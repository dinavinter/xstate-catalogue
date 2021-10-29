import * as x from "xsfp";
import {State, assign} from "xstate";
import {SighUpFormMachineContext, SighUpInfo} from "./signup-xfp.machine";
import {ConfirmInfo} from "./interactionService";


const templateStore = {
    get: async (d) => {
        return {schema: await import ("../schemas/SignUpTemplateSchema.json")}
    }
};



export interface InteractionServiceMachineContext {
    metadata: any,
    input?: SighUpInfo;
    confirmInfo?: ConfirmInfo;
}


export type InteractionServiceMachineEvent =
    | CONFIRM
    | SUBMIT;

type CONFIRM =
    {
        type: 'CONFIRM';
        info: ConfirmInfo;
    }
type SUBMIT =
    {
        type: 'SUBMIT';
        info: SighUpInfo;
    }


const assignSighUpInfo = x.assign({input: (context, event) => event.info});
const assignConfirmInfo = x.assign({confirmInfo: (context, event) => event.info});


const interactionServiceMachine = x.createMachine<InteractionServiceMachineContext, InteractionServiceMachineEvent>(
    x.id('sighUp'),
    x.context({
        metadata: {
            interaction: 'sighUp',
            basePath: '/interactions/v1',
            links: {
                template: '/template',
                submit: '/submit',
                confirm: '/confirm',
                authorization: '/oauth/authorize'
            }

        }
    }),
    x.states(
        x.state('draft', x.context({template: templateStore.get('sighUp')}), x.on("SUBMIT", "created", assignSighUpInfo)),
        x.state('created', x.on("CONFIRM", "verified", assignConfirmInfo)),
        x.state('verified', x.invoke('projection', x.id('project-interaction'), x.onDone('completed'))),
        x.finalState('completed')
    )
);


export default interactionServiceMachine;
