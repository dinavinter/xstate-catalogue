import {services} from "../servicesStore";

const {createStateApp} = require("../xstateApp");
const {appUrl} = require("../appUrl");


export async function machine_service_middleware(ctx, next) {

    const {service, app, id} = ctx.params
    console.log('service-midd');
    console.log({service, app, id});

    if (id) {
        const found = services[id]
        if (!found) {
            ctx.throw(404, `${app} with id ${id} not found`, {app, id})
        }
        ctx.state.model = createStateApp(() => found.machine)
        ctx.state.service = found
        ctx.state.id = id
    } else {

        const {machineCreator} = await getMachine(service);


        ctx.state.model = createStateApp(() => machineCreator(app));
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

const getMachine = async (slug) => {
    const machineImport = await import(`../../../lib/machines/${slug}.machine.ts`);

    const mdxDoc = await import(`../../../lib/machines/${slug}.mdx`);
    // console.log( mdxDoc);
    // console.log( mdxDoc.default.metadata);

    try {
        const mdxDocMetadata = await import(`../../../lib/machines/${slug}.metadata.ts`);
        mdxDoc.metadata = mdxDocMetadata.default;
        console.log(mdxDoc.metadata);
    } catch (e) {
        console.log(e)
    }

    return {
        machine: machineImport.default,
        machineCreator: machineImport.machineCreator,
        mdxDoc: mdxDoc.default,
        mdxMetadata: mdxDoc.metadata,
    };
};
