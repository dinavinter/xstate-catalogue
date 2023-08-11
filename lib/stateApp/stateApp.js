import {useEffect, useState} from "react";
import {StateMachine} from "xstate";
import {MDXMetadata} from "../MachineHelpers";
import {machineCreator} from "../machines/interaction-service.machine";
import {machine_service_middleware} from "./middleware/machine_service_middleware";
import {services} from "./servicesStore";


const {errorResponse} = require("./middleware/errorResponse");
const {locationResponse} = require("./middleware/locationResponse");
const {sirenResponse} = require("./middleware/sirenResponse");


const resourceUrl = function (id, path = "") {
    return new URL(this.applicationPath(id, path), this.href).href
}

const applicationPath = function (id, path = "") {
    return (this.state && this.state.service && this.state.service.machine.meta.href && this.state.service.machine.meta.href(id, path))
        || `/${this.params.app}/${id}${path ? "/".concat(path) : path}`
}






class api {
    async appForm(ctx) {
        const form = ctx.state.model.contextSchema(ctx.query)
        ctx.body = {
            properties: ctx.state.model.meta(),
            actions: [{
                class: 'form',
                name: "create",
                title: form.title,
                method: "POST",
                // href: new URL(ctx.params.app, ctx.href).href,
                href: ctx.state.model.createLink(ctx.href),
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
const accepts = (m) => false;
const middlewares = async (request, next) => {
    let ctx = {
        resourceUrl: resourceUrl,
        applicationPath: applicationPath,
        request: request.request,
        query: request.query,
        href: document.location.href,
        accepts: (mediatype) => (request.headers?.accepts && request.headers?.accepts?.contains(mediatype)) || accepts(mediatype),
        set: (name, header) => ctx.response.headers[name] = header,
        params: {...request.query, ...request.request.body},
        response: {
            headers: {},
            body: {}
        }, state: {}
    };
    ctx.resourceUrl.bind(ctx);
    ctx.applicationPath.bind(ctx);
    ctx.set.bind(ctx);
    ctx.accepts.bind(ctx);
    await machine_service_middleware(ctx, async () => await errorResponse(ctx, async () => await locationResponse(ctx, async () => await sirenResponse(ctx, async () => await next(ctx)))))

    ctx.response.body = ctx.body;
    // ctx.response.state=ctx.state;

    return {
        ...ctx.response,
        body: ctx.body,

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
 


