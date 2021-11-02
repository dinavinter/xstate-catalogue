import {assign, createMachine, Sender, Machine, AnyEventObject, actions, spawn} from "xstate";

import * as x from "xsfp";
import {createStateApp} from "../stateApp/xstateApp";
import interactionServiceMachine from "./interaction-service.machine";
import {Subject} from "rxjs";
import {formService, interactionFormService} from "../forms/InteractionForm/FormService";
import {ActionObject} from "xstate/lib/types";
import * as xstate from "xstate";
import * as types from "xsfp/src/types";

const {ApiService} = require("../stateApp/stateApp");
const {pure, send} = actions;

export interface MachineMngMachineContext {
    [name: string]: any
};

export type MachineMngMachineEvent =
    | {
    type: "TYPE";
} |
    AnyEventObject;


declare type onResponseConfig = string
    | xstate.TransitionConfig<MachineMngMachineContext, MachineMngMachineEvent>
    | types.TransitionTuple<MachineMngMachineContext, MachineMngMachineEvent>;

declare type onErrorConfig = string
    | xstate.TransitionConfig<MachineMngMachineContext, MachineMngMachineEvent>
    | types.TransitionTuple<MachineMngMachineContext, MachineMngMachineEvent>;

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


var stateApp = createStateApp(() => interactionServiceMachine);
const apiAction = (api) => async (context, event) => await api({...event.query, ...event.requestBody, ...event});
const apiState = (api, onResponse: onResponseConfig = assignResponse(api), onError: onErrorConfig = assignError(api)) => x.state(api,
    x.states(
        x.state(`idle`, x.on(api.toUpperCase(), `#${api}.request`)),
        x.state(`request`, x.id(`${api}.request`), x.invoke(api),
            x.on("RESPONSE", `idle`, onResponse),
            x.on("ERROR", `idle`, onError)),
    ));

const apiService = (api, onResponse: onResponseConfig = assignResponse(api), onError: onErrorConfig = assignError(api)) =>
    x.states(
        x.state(`idle`, x.on(api.toUpperCase(), `#${api}.request`)),
        x.state(`request`, x.id(`${api}.request`), x.invoke(api),
            x.on("RESPONSE", `idle`, onResponse),
            x.on("ERROR", `idle`, onError)),
    );
const openFormService = (api) => x.state(api,
    x.states(
        apiService(api, 'open-form'),
        x.state('open-form'),
    ));
const openFormState = (state) => x.state(state,
    x.states(
        x.state('idle',),
        x.state('open-form', x.invoke('formService')),
    ));

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

// const sendToAllSampleActors = pure((context, event) => {
//     formService.open(event);
//     return send()
//     // formService
//     // return context.sampleActors.map((sampleActor) => {
//     //     return x.send('SOME_EVENT', { to:  });
//     // });
// });

const machineMngMachine = x.createMachine(
    x.id('machineMng'),
    x.meta({
            formService: interactionFormService
        }
    ),
    x.context({
        apps: [],
        services: {
            form: interactionFormService
        }
    }),


    x.parallelStates(
        apiState('get'),
        apiState('create'),
        apiState('update'),
        x.state('form', x.parallelStates(
            x.state('init', x.entry(x.action('assignForm'))),
            apiState('form', x.send((context, event) => {
                    return {type: "LOAD", ...event.response.body}
                }, {
                    to: (context, event) => context.form.ref
                }),
            )))
)
// apiState('form', x.send( (context, event) =>({type: "LOAD", ...event.response.body}), {to:'view-form'})),
// x.state('form-service',  ))
// apiService('form', x.action('openForm') ),
// ))
).
withConfig({
    actions: {
        get: apiAction(ApiService.get),
        create: apiAction(ApiService.create),
        update: apiAction(ApiService.update),
        form: apiAction(ApiService.form),
        assignForm: assign({
            form: (ctx, {type, ...rest}) => {
                return {
                    meta: rest,
                    ref:interactionFormService
                }
            }
        })
        // openForm: (context, event) =>  interactionFormService.send({type: "LOAD", ...event.response.body})

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
            callApi(ApiService.form(event), callback)
            // const callbackDec=(e)=>{
            //     formService
            //         .open(e.response)
            //         .subscribe(callback)
            // };
            // onReceive(event=>{
            //     if(event.type == 'RESPONSE')
            //        
            // })
        },
        // ['form-service'] :  (context, event,m) => context.services.form,
        // formService: (context, event) =>formService.open(event.response).submit,
        sals: (context, event) => ApiService.create({...event.query, ...event.requestBody})
    }
});

export default machineMngMachine;
