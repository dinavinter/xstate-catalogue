import * as x from "xsfp";
import {EventObject, State, assign} from "xstate";
import {InteractionState, SighUpFormMachineContext, SighUpInfo} from "./signup-xfp.machine";
import {AnyEventObject} from "xstate/lib/types";
 
const interactionFormMachine = x.createMachine(
    x.id('sighUpForm'),
    x.states(
        x.state('draft', x.on("TEMPLATE", "loaded")),
        x.state('loaded', x.on("SUBMIT", "created")),
        x.state('created', x.on("CONFIRM", "committed")),
        x.finalState('committed')
    )
);
const assignSighUpInfo = x.assign({sighUpInfo: (context, event) => event.data});
const assignConfirmInfo = x.assign({confirmInfo: (context, event) => event.data});

const templateStore = {
    get: async (d) => {
        return import ("../schemas/SignUpTemplateSchema.json")
    }
};

const interactionMachine = x.createMachine(
    x.id('sighUp'),
    x.context<SighUpFormMachineContext>({
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
        x.state('draft', x.data({template: templateStore.get('sighUp')}), x.on("CREATE", "created", assignSighUpInfo)),
        x.state('created', x.on("CONFIRM", "committed", assignConfirmInfo)),
        x.finalState('committed')
    )
);

const stateService = {
    getState: async (d) => {
        return await d()
    }, setState: async (state) => {
        console.log(state)
    }
};


interface ConfirmInfo {
    [key: string]: any;

}

export const signUpService = async (context, stateService) => {

    const currentValue = await stateService.getState(
        () => interactionMachine.initialState
    )
    const state = interactionMachine.resolveState(State.create(currentValue));

    return {
        template: (): Promise<State<any>> => {
            return Promise.resolve(state);
        },
        submit: async (input: SighUpInfo): Promise<State<any>> => {
            return transition({type: "CREATE", input: input});
        },
        confirm: async (input: ConfirmInfo): Promise<State<any>> => {
            return transition({type: "CONFIRM", input: input});
        }
    }

    async function transition(event: AnyEventObject) {
        const transitioned = interactionMachine.transition(state, event);
        await stateService.setState(transitioned);
        return transitioned;

    }
}
 
 