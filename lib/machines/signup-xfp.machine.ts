import {assign, createMachine, send, Sender, sendUpdate, interpret, spawn} from 'xstate';
import {EmailSchema, SmsSchema} from "../Api/SignUpInteraction";
import {CreateOrUpdateFormMachineEvent} from "./create-or-update-form.machine";

type InteractionRefs = {
    submitInteraction(SighUpInfo: SighUpInfo): Promise<InteractionState>;
    submitInteractionConfirm(confirmInfo: DateInfo): Promise<InteractionState>;
}
const InteractionRefs: InteractionRefs = {
    submitInteraction: (SighUpInfo: SighUpInfo) => {
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
    submitInteractionConfirm: (confirmInfo: DateInfo) => {
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
    refs: InteractionRefs;
    metadata:  any,
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
    | FinalizedEvent
    | {
    type: 'SUBMIT';
    info: SighUpInfo;

};

type CONFIRM =
    {
        type: 'CONFIRM';
        info: DateInfo;
    }
type InteractionSubmitEvents = CONFIRM
type InteractionStateEvent =
    {
        type: 'INTERACTION_STATE';
        info: InteractionState;
    }
type FinalizedEvent =
    {
        type: 'FINALIZED';
    }

import * as x from 'xsfp';
import {InvokeMeta} from "xstate/lib/types";
import {effect, transition} from "xsfp";

const fetchTransition = x.on('FETCH', 'loading');

const fetchMachine = x.createMachine(
    x.id('SWAPI'),
    x.context({
        response: null,
        request: async (context, event) => event.request || "https://swapi.dev/api/people/1",
        select: (res) => res.json(),
        fetch: async (context, event) => context.select(await fetch(context.request(context, event)))
    }),
    x.states(
        x.initialState('idle', fetchTransition),
        x.state(
            'loading',
            x.invoke(async (context, event) => await context.fetch(context, event),
                x.id('fetchLuke'),
                x.onDone('resolved', x.assign({response: (_, event) => event.data})),
                x.onError('rejected')
            ),
            x.on('CANCEL', 'idle')
        ),
        x.state('rejected', fetchTransition),
        x.finalState('resolved')
    )
);


const formState = x.states(
    x.state('loading', x.transition('loaded', fetchMachine)),
    x.state('loaded', x.on('SUBMIT')),
    x.state('stop')
);
const fetchService = x.invoke(
    (context, event) =>
        fetch('https://swapi.dev/api/people/1').then(res => res.data),
    x.id('fetchLuke'),
    x.onDone('resolved', x.assign({ user: (_, event) => event.data })),
    x.onError('rejected')
);



const interactionMachine = x.createMachine(
    x.id('sighUpForm'),
    x.states(
        x.state('draft',  x.on("TEMPLATE", "loaded") ),
        x.state('loaded',  x.on("SUBMIT", "created") ),
        x.state('created',x.on("CONFIRM", "committed") ),
        x.state('committed',  x.transition('finalized'))
    )
);


const SighUpFormMachine = createMachine<SighUpFormMachineContext,
    SighUpFormMachineEvent>(
    {
        id: 'sighUpForm',
        initial: 'draft',
        context: {
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
                    },


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
            confirmInteraction: (context, event, _) => async (send: Sender<SighUpFormMachineEvent>) => {
                if (event.type !== 'CONFIRM') return {};
                const state = await context.refs.submitInteractionConfirm(event.info);
                send(state.event)

            },
            submitInteraction: (context, event, _) => async (send: Sender<SighUpFormMachineEvent>) => {
                if (event.type !== 'SUBMIT') return {};
                const state = await context.refs.submitInteraction(event.info);
                send(state.event)
            },
            submit: (context, event, _) => async (send: Sender<SighUpFormMachineEvent>) => {
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
            clearErrorMessage: assign((context, event) => {
                return {
                    errorMessage: undefined,
                }
            }),
        },
    },
);

export default SighUpFormMachine;
