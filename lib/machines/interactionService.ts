import {State} from "xstate";
 import interactionServiceMachine, {InteractionServiceMachineEvent} from "./interaction-service.machine";
import {EmailSchema, SmsSchema} from "../Api/SignUpInteraction";

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

export const interactionService = async (stateService ) => {

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

