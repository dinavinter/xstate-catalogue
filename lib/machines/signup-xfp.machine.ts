import {assign, createMachine, send, Sender, sendUpdate} from 'xstate';
import {EmailSchema, SmsSchema} from "../Api/SignUpInteraction";
import {CreateOrUpdateFormMachineEvent} from "./create-or-update-form.machine";

type InteractionRefs = {
    submitInteraction(SighUpInfo: SighUpInfo): Promise<InteractionState>;
    submitInteractionConfirm(confirmInfo: DateInfo): Promise<InteractionState>;
}
const InteractionRefs:InteractionRefs = {
    submitInteraction: (SighUpInfo: SighUpInfo)=> {
          return Promise.resolve({
              interactionId: "###testId",
              state: "pending_confirmation",
              event: {
                  type: "CONFIRM",
                  info: {
                      preferredData: "auto"
                  }
              }
          })
    },
    submitInteractionConfirm: (confirmInfo: DateInfo)=>{
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
    refs:InteractionRefs ;
    sighUpInfo?: SighUpInfo;
    state?: InteractionState;
    confirmInfo?: DateInfo;
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
        state: 'draft' | 'pending_authentication' | 'pending_confirmation' | 'finalized'
        event: SighUpFormMachineEvent
    };

interface DateInfo {
    preferredData: string;
}

export type SighUpFormMachineEvent =
    | {
    type: 'BACK';
}
    | InteractionStateEvent
    | CONFIRM
    |FinalizedEvent
    | {
    type: 'SUBMIT';
    info: SighUpInfo;

};

type CONFIRM =
    {
        type: 'CONFIRM';
        info: DateInfo;
    }
type InteractionSubmitEvents =    CONFIRM
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
        context:{
            refs: InteractionRefs
        },
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
                    } ,
                 


                },
                on: {
                    BACK: {
                        target: 'draft',
                    },
                    CONFIRM: {
                        target: 'confirming',
                        actions: ['assignDateToContext'],
                    },
                },

            },
            pending_confirmation: {
                id: 'pending_confirmation',
                invoke: {
                    src: ''
                },
                on: {
                    BACK: {
                        target: 'draft',
                    },
                    CONFIRM: {
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
                            SUBMIT: 'submitting',
                            BACK: {
                                target: '#pending_confirmation',
                            },
                        },
                    },
                    submitting: {
                        invoke: {
                            src: 'confirmInteraction',
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
            confirmInteraction:  (context,event ,_) => async (send: Sender<SighUpFormMachineEvent>) => {
                if (event.type !== 'CONFIRM') return {};
                const state = await context.refs.submitInteractionConfirm(event.info);
                send(state.event)

            },
            submitInteraction: (context,event ,_) => async (send: Sender<SighUpFormMachineEvent>) => {
                if (event.type !== 'SUBMIT') return {}; 
                const state = await context.refs.submitInteraction(event.info);
                send(state.event)
            },
            submit: (context,event ,_) => async (send: Sender<SighUpFormMachineEvent>) => {
                if (event.type !== 'SUBMIT') return {}; 
                 const state = await context.refs.submitInteraction(event.info);
                send(state.event); 
            },
        },
        actions: {
            assignDateToContext: assign((context, event) => {
                if (event.type !== 'CONFIRM') return {};
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
            clearErrorMessage: assign((context, event) =>  {return {
                errorMessage: undefined,
            }}),
        },
    },
);

export default SighUpFormMachine;
