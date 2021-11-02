import {assign, createMachine, Sender, Machine, AnyEventObject} from "xstate";
import * as x from "xsfp";
import {createStateApp} from "../stateApp/xstateApp";
import interactionServiceMachine from "./interaction-service.machine";

const {ApiService} = require("../stateApp/stateApp");

export interface MachineMngMachineContext {
};

export type MachineMngMachineEvent =
    | {
    type: "TYPE";
};

const assignResponse = (api) => x.assign({
    [api]: (context, event) => {
        return {response: event.response}
    }

});
const assignError = (api) => x.assign({
    [api]: (context, event) => {
        return {error: event.error}
    }

});
const pushApp = x.assign({
    apps: (context, event) => [
        ...context.apps,
        stateApp.create(event.id)
    ]
});

let id = 0;
var stateApp = createStateApp(() => interactionServiceMachine);
const apiAction =   (api) => async (context, event) =>  await api({...event.query, ...event.requestBody, ...event});
// const apiService = (api) => x.state(api, x.invoke(api, x.onDone(assignResponse(api)), x.onError(api)))
const apiService = (api) => x.state(api, x.invoke(api), x.on("RESPONSE", assignResponse(api)), x.on("ERROR", assignError(api)));
// const apiService = (api) => x.state(api,  x.on(api.toUpperCase(), x.action(api) ))

function callApi(api, callback: (event: AnyEventObject) => void) {
    api
        .catch(err => {
            console.log(err);
            callback({
                type: 'ERROR',
                response: err
            });
        })
        .then(res => {
            console.log(res);
            callback({
                type: 'RESPONSE',
                response: res
            });
        })
}

const machineMngMachine = x.createMachine(
    x.id('machineMng'),
    x.context({
        apps: [],
        schema: stateApp.contextSchema({})

    }),
    // x.on("GET", x.send('REQUEST', {to: 'get'})),
    // x.on("CREATE", x.send((context, event,meta)=>{return {type:'REQUEST', ...event}},{to:'create'})),
    x.on("GET", 'get'),
    x.on("CREATE", 'create'),
    x.on("UPDATE", 'update'),
    x.on("FORM", 'form'),


    x.states    (
        x.state('idle',
            // x.states(
            //     x.state('create', x.invoke( ),
            //     x.state('get' ),
            //     x.state('get' ),
            //     x.state('get' ),
            // )
        ),
        apiService('get'),
        apiService('create'),
        apiService('update'),
        apiService('form'),
    ))
    .withConfig({
        actions: {
            get: apiAction(ApiService.get),
            create: apiAction(ApiService.create),
            update: apiAction(ApiService.update),
            form: apiAction(ApiService.form)
        },
        services: {
            create: (context, event) => (callback, onReceive) => {
                // apiAction(ApiService.create)(context, event)
                callApi(ApiService.create(event), callback);
            },
            get: (context, event) => (callback, onReceive) => {
                // apiAction(ApiService.create)(context, event)
                callApi(ApiService.get(event), callback);
            },
            update: (context, event) => (callback, onReceive) => {
                // apiAction(ApiService.create)(context, event)
                callApi(ApiService.update(event), callback);
            },
            form: (context, event) => (callback, onReceive) => {
                // apiAction(ApiService.create)(context, event)
                callApi(ApiService.form(event), callback);
            }
            ,
        sals: (context, event) => ApiService.create({...event.query, ...event.requestBody})
    }
})
;

export default machineMngMachine;
