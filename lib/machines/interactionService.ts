import {State, interpret} from "xstate";
 import interactionServiceMachine, {InteractionServiceMachineEvent} from "./interaction-service.machine";
import {EmailSchema, SmsSchema} from "../Api/SignUpInteraction";
import value from "micromark/lib/constant/types";

const stateService = {
    getState: async (d) => {
        return await d()
    }, setState: async (state) => {
        console.log(state)
    }
};
export interface ConfirmInfo {
    [key: string]: any;

}
export type SighUpInfo = EmailSchema | SmsSchema;

export const interactionService =   (stateService ) => {


    return {
        template: async (): Promise<State<any>> => { 
            return  await currentState();
        },
        submit: async (input: SighUpInfo): Promise<any> => {
            return toSiren(await transition({type: "SUBMIT", info: input}), requestAnnotator('/interactions/sighup'));
        },
        confirm: async (input: ConfirmInfo): Promise<any> => {
            return toSiren(await transition({type: "CONFIRM", info: input}), requestAnnotator('/interactions/sighup'));

         }
    }
    
    async function currentState(){
        const currentValue = await stateService.getState(
            
        ) ||interactionServiceMachine.initialState;
        return   interactionServiceMachine.resolveState(State.create(currentValue));

    }

    async function transition(event: InteractionServiceMachineEvent) {
        const transitioned = interactionServiceMachine.transition(await currentState(), event);
        await stateService.setState(transitioned);
        return transitioned;

    }
}
const { URL } = require("url")
const url = (  path) => path;

const requestAnnotator = ( pathPrefix) => ({
    href: (path) => url(  pathPrefix!==undefined ? pathPrefix + "/" + path : path),
})
function toSiren(state, annotate = {}) {
    const service =  startService(interactionServiceMachine, state);
    const current =  service.state;
    return {
        class: service.id,
        title: current.meta.title || (service.machine.meta && service.machine.meta.title) || current.id,
        properties: current.context,
        links: [
            {
                rel: ["self"],
                href: annotate.href("")
            }
        ],
        entities: [
            {
                class: "state",
                properties: {
                    value: current.value,
                    context: current.context,
                    events: current.events,
                    
                }
            }
        ],
        actions: current.nextEvents.reduce((actions, event) => {
            let meta = current.meta[`${service.id}.${current.toStrings()[0]}`]
            if (!meta) {
                meta =  { on: { [event]: {} } }
            }
            const { fields, ...rest} = ((meta.on||{})[event] || [])
            if (Array.isArray(fields) || service.machine.transition(current, event).changed) {
                let action = {
                    name: event,
                    class: "event", 
                    href: annotate.href && annotate.href(event),
                    method: "PUT",
                    fields: (fields||[]).map(field => {
                        return Object.keys(field).reduce((field, key) => {
                            const resolver = ((service.machine.options.meta||{}).values||{})[field[key]]
                            if (resolver) {
                                if (typeof resolver === "function") {
                                    field[key] = resolver(current.context)
                                }
                            }
                            return field
                        }, field)
                    }),
                    ...rest
                }
                actions.push(action)
            }
            return actions
        }, [])
    }
}
function startService(machine, state) {
    const service = interpret(machine)
        .start(state && machine.resolveState(state))
    return service
}