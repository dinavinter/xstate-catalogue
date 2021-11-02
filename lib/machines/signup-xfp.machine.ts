import {assign, createMachine, send, Sender, sendUpdate, interpret, spawn} from 'xstate';
import {EmailSchema, SmsSchema} from "../Api/SignUpInteraction";
import {CreateOrUpdateFormMachineEvent} from "./create-or-update-form.machine";
import {BindInfo} from "./interactionService";

type InteractionRefs = {
    submitInteraction(SighUpInfo: SighUpInfo): Promise<InteractionState>;
    bindInteraction(confirmInfo: BindInfo): Promise<InteractionState>;
}
const InteractionRefs: InteractionRefs = {
    submitInteraction: (SighUpInfo: SighUpInfo) => {
        return Promise.resolve({
            interactionId: "###testId",
            state: "pending_authentication",
            event: {
                type: "BIND",
                info:{
                    
                }
                
            }
        })
    },
    bindInteraction: (confirmInfo: BindInfo) => {
        return Promise.resolve({
            interactionId: "###testId",
            state: "finalized",
            event: {
                type: "FINALIZED"
            }
        })
    },
}

export interface SighUpFormMachineContext { 
    metadata:  any,
    sighUpInfo?: SighUpInfo;
    state?: InteractionState;
    confirmInfo?: BindInfo;
    errorMessage?: string;
}

export interface InteractionReference {
    /**
     * A uuid referenced to a specific interaction.
     * @type {string}
     * @memberof Interaction
     */
    interactionId?: string;
}

export type SighUpInfo = EmailSchema | SmsSchema;
export type InteractionState = InteractionReference &
    {
        state: 'draft' | 'pending_authentication'   | 'finalized'
        event: SighUpFormMachineEvent
    };

 

export type SighUpFormMachineEvent =
    | {
    type: 'BACK';
}
    | InteractionStateEvent
    | BIND
    | FinalizedEvent
    | {
    type: 'SUBMIT';
    info: SighUpInfo;

};

type BIND =
    {
        type: 'BIND';
        info: BindInfo;
    }
 type InteractionStateEvent =
    {
        type: 'INTERACTION_STATE';
        info: InteractionState;
    }
type FinalizedEvent =
    {
        type: 'FINALIZED';
    }

 
  


const SighUpFormMachine = createMachine<SighUpFormMachineContext,
    SighUpFormMachineEvent>(
    {
        id: 'sighUpForm',
        initial: 'draft',
       
        on: {
            INTERACTION_STATE: {
                actions: ['assignInteractionStateToContext']
            }
        },
        states: {
            draft: {
                on: {
                    SUBMIT: {
                        target: 'submitting',
                        actions: ['assignSighUpInfoToContext'],
                    },
                },
            },

            submitting: {
                invoke: {
                    src: 'submitInteraction',
                    onError: {
                        target: 'draft',
                        actions: 'assignErrorMessageToContext',
                    },


                },
                on: {
                    BACK: {
                        target: 'draft',
                    },
                    BIND: {
                        target: 'confirming',
                        actions: ['assignDateToContext'],
                    },
                },

            },
           
            confirming: {
                onDone: {
                    target: 'success',
                },
                initial: 'idle',
                states: {

                    idle: {
                        exit: ['clearErrorMessage'],
                        on: {
                            SUBMIT: 'submitting'
                          
                        },
                    },
                    submitting: {
                        invoke: {
                            src: 'bindInteraction',
                            onDone: {
                                target: 'complete',
                            },
                            onError: {
                                target: 'idle',
                                actions: 'assignErrorMessageToContext',
                            },
                        },
                    },
                    complete: {type: 'final'},
                },
            },
            success: {
                type: 'final',
            },
        },
    },
    {
        services: {
            bindInteraction: (context, event, _) => async (send: Sender<SighUpFormMachineEvent>) => {
                if (event.type !== 'BIND') return {};
                const state = await InteractionRefs.bindInteraction(event.info);
                send(state.event)

            },
            submitInteraction: (context, event, _) => async (send: Sender<SighUpFormMachineEvent>) => {
                if (event.type !== 'SUBMIT') return {};
                const state = await InteractionRefs.submitInteraction(event.info);
                send(state.event)
            },
            submit: (context, event, _) => async (send: Sender<SighUpFormMachineEvent>) => {
                if (event.type !== 'SUBMIT') return {};
                const state = await InteractionRefs.submitInteraction(event.info);
                send(state.event);
            },
        },
        actions: {
            assignDateToContext: assign((context, event) => {
                if (event.type !== 'BIND') return {};
                return {
                    confirmInfo: event.info
                };
            }),
            assignSighUpInfoToContext: assign((context, event, _) => {
                if (event.type !== 'SUBMIT') return {};
                return {
                    sighUpInfo: event.info,
                };
            }),
            assignInteractionStateToContext: assign((context, event) => {
                if (event.type !== 'INTERACTION_STATE') return {};
                return {
                    state: event.info,
                };
            }),
            assignErrorMessageToContext: assign((context, event: any) => {
                return {
                    errorMessage: event.data?.message || 'An unknown error occurred',
                };
            }),
            clearErrorMessage: assign((context, event) => {
                return {
                    errorMessage: undefined,
                }
            }),
        },
    },
);

export default SighUpFormMachine;
