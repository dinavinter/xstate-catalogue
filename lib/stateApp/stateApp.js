import {useEffect, useState} from "react";
import {StateMachine} from "xstate";
import {MDXMetadata} from "../MachineHelpers";

 

const {createStateApp} = require("./xstateApp")
const {appUrl} = require("./appUrl")
const toSiren = require("./toSiren");
const Router = require("next");
const {errorResponse} = require("./middleware/errorResponse");
const {locationResponse} = require("./middleware/locationResponse");
const {sirenResponse} = require("./middleware/sirenResponse");


const resourceUrl = function (id, path = "") {
    return appUrl(this.params.app, this.href, id, path)
}


const services = {}

const getMachine = async (slug) => {
    const machineImport = await import(`../../lib/machines/${slug}.machine.ts`);

    const mdxDoc = await import(`../../lib/machines/${slug}.mdx`);
    // console.log( mdxDoc);
    // console.log( mdxDoc.default.metadata);

    try {
        const mdxDocMetadata = await import(`../../lib/machines/${slug}.metadata.ts`);
        mdxDoc.metadata = mdxDocMetadata.default;
        console.log(mdxDoc.metadata);
    } catch (e) {
        console.log(e)
    }

    return {
        machine: machineImport.default,
        mdxDoc: mdxDoc.default,
        mdxMetadata: mdxDoc.metadata,
    };
};


async function service_middleware(ctx, next) {
    
    const {app, id} = ctx.params
    console.log('service-midd');
    console.log({app, id});

    if (id) {
        const found = services[id]
        if (!found) {
            ctx.throw(404, `${app} with id ${id} not found`, {app, id})
        }
        ctx.state.model = createStateApp(() => found.machine)
        ctx.state.service = found
        ctx.state.id = id
    } else {

        const {machine} = await getMachine(app);
        ctx.state.model = createStateApp(() => machine);
        ctx.state.service = ctx.state.model.service;
        // let machine
        // if (/^[a-f0-9]{32}$/i.test(app)) {
        //     const fromGist = require("./fromGist")
        //     machine = await fromGist(app)
        // } else {
        //     try {
        //         machine = require(`./xstate/${app}`)
        //     } catch (err) {
        //         ctx.throw(404, `App ${app} not found`, {app})
        //     }
        // }
        //
        // ctx.state.model = createStateApp(() => machine)
    }
    console.log('service-midd');
    console.log(ctx);
    await next()
    if (ctx.state.id) {
        ctx.state.links.push({
            rel: ["new", "form"],
            href: appUrl(app, ctx.href, ctx.state.id)
        })
    }
    console.debug('service-midd-end');
}

class api {
    async appForm(ctx) {
        const form = ctx.state.model.contextSchema(ctx.query)
        ctx.body = {
            actions: [{
                name: "create",
                title: form.title,
                method: "POST",
                href: new URL(ctx.params.app, ctx.href).href,
                fields: form.properties
            }]
        }
    }

    async create(ctx) {
        const created = ctx.state.model.create({...ctx.query, ...ctx.request.body})
        ctx.state.id = created.id
        ctx.state.service = created.service
        services[created.id] = created.service
        ctx.status = 201
    }

    async update(ctx) {
        const event = {
            type: ctx.params.type,
            ...ctx.request.body,
            ...ctx.query
        }
        const newState = await ctx.state.service.send(event)
        ctx.status = newState.changed ? 200 : 406
    }

    get(ctx) {
        ctx.status = 200
    }

    del(ctx) {
        ctx.state.model.delete(ctx.id)
        ctx.state.id = ctx.state.service = undefined
        ctx.status = 204
    }

}

// const stateAppRoutes = new Router()
//     .use(service_middleware)
//     .get("/:app",appForm)
//     // .get("/:app/:id/events", ctx => {
//     //     sampleEvents(ctx)
//     //     // Koa quirk: Don't close the request/stream after handling the route!
//     //     ctx.respond = false
//     // })
//     .post("/:app", create)
//     .put("/:app/:id/: ", update)
//     .get("/:app/:id",get)
//     .del("/:app/:id",del)
//     .middleware()
const  accepts =(m)=>false;
const middlewares = async (request, next) => {
    let ctx = {
        resourceUrl:resourceUrl,
        request:request.request,
        query:request.query,
        href: document.location.href,
        accepts:(mediatype)=> (request.headers?.accepts && request.headers?.accepts?.contains(mediatype) ) || accepts(mediatype),
        set:(name, header)=>ctx.response.headers[name]= header,
        params: {...request.query, ...request.request.body},
        response: {
            headers: {},
            body: {}
        }, state: {}
    };
    ctx.resourceUrl.bind(ctx);
    ctx.set.bind(ctx);
    ctx.accepts.bind(ctx);
      await service_middleware(ctx, async () => await errorResponse(ctx, async () => await locationResponse(ctx, async () => await sirenResponse(ctx, async () => await next(ctx)))))
   
   ctx.response.body=ctx.body;
   // ctx.response.state=ctx.state;
      
    return  {
       ...ctx.response,
        body:  ctx.body,
        
    };

    // return  middleware(
    //      request,
    //      [
    //          service_middleware,
    //          errorResponse,
    //          locationResponse,
    //          sirenResponse
    //      ],
    //      next
    //  )();
}

const middleware = (request, middlewares, api) => {
    let ctx = {
        request: request
    };

    const reducer = (previousValue, currentValue) => next(previousValue, currentValue);
    const first = () => {
        return () => {
            console.log(api);
            console.log(ctx);

            return api(ctx);
        }
    };
    const next = (previousStep, currentStep) => {
        return () => {
            console.log(currentStep);

            return currentStep(ctx, previousStep);
        }
    };
    return middlewares.reduce(first(request), reducer)
}
export const apis = new api();

export const ApiService = {
    form: (request) => middlewares(request, apis.appForm),
    create: (request) => middlewares(request, apis.create),
    get: (request) => middlewares(request, apis.get),
    update: (request) => middlewares(request, apis.update),
    delete: (request) => middlewares(request, apis.del),

}
 


