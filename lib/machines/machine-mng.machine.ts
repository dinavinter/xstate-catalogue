import {assign, createMachine, Sender, Machine, AnyEventObject, actions} from "xstate";
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
const apiAction = (api) => async (context, event) => await api({...event.query, ...event.requestBody, ...event});
 const apiService = (api, onResponse=assignResponse(api), onError=assignError(api)) => x.state(api, 
    x.states(
        x.initialState(`idle`, x.id(`${api}.request`), x.on(api.toUpperCase(), `#${api}.request`)),
        x.state(`request`, x.id(`${api}.request`), x.invoke(api),
            x.on("RESPONSE", `idle`,   onResponse ),
            x.on("ERROR", `idle`,   onError )),
    ))




 
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

const fetchTransition = x.on('FETCH', 'loading');

 

const machineMngMachine = x.createMachine(
    x.id('machineMng'),
    x.context({
        apps: [],
     }),
 

    x.parallelStates( 
        apiService('get'),
        apiService('create'),
        apiService('update'),
        apiService('form'   ),
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
                 callApi(ApiService.create(event), callback);
            },
            get: (context, event) => (callback, onReceive) => {
                 callApi(ApiService.get(event), callback);
            },
            update: (context, event) => (callback, onReceive) => {
                 callApi(ApiService.update(event), callback);
            },
            form: (context, event) => (callback, onReceive) => {
                 callApi(ApiService.form(event), callback);
             }
            ,
            sals: (context, event) => ApiService.create({...event.query, ...event.requestBody})
        }
    });

export default machineMngMachine;
