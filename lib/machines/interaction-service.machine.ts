import * as x from "xsfp";
import {State, assign} from "xstate";
import {SighUpFormMachineContext, SighUpInfo} from "./signup-xfp.machine";


const templateStore = {
    get: async (d) => {
        return import ("../schemas/SignUpTemplateSchema.json")
    }
};

interface ConfirmInfo {
    [key: string]: any;

}

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
        x.state('draft', x.data({template: templateStore.get('sighUp')}), x.on("SUBMIT", "created", assignSighUpInfo)),
        x.state('created', x.on("CONFIRM", "verified", assignConfirmInfo)),
        x.state('verified', x.invoke('projection' ,x.id('project-interaction'), x.onDone('completed') )),
        x.finalState('completed')
    )
);

const stateService = {
    getState: async (d) => {
        return await d()
    }, setState: async (state) => {
        console.log(state)
    }
};


export const signUpService = async (context, stateService) => {

    const currentValue = await stateService.getState(
        () => interactionServiceMachine.initialState
    )
    const state = interactionServiceMachine.resolveState(State.create(currentValue));

    return {
        template: (): Promise<State<any>> => {
            return Promise.resolve(state);
        },
        submit: async (input: SighUpInfo): Promise<State<any>> => {
            return transition({type: "SUBMIT", info: input});
        },
        confirm: async (input: ConfirmInfo): Promise<State<any>> => {
            return transition({type: "CONFIRM", info: input});
        }
    }

    async function transition(event: InteractionServiceMachineEvent) {
        const transitioned = interactionServiceMachine.transition(state, event);
        await stateService.setState(transitioned);
        return transitioned;

    }
}


export default interactionServiceMachine;
