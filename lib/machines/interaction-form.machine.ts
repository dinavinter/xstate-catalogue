import {assign, createMachine, Sender} from "xstate";
import * as x from "xsfp";
import {guard} from "xsfp";

export interface InteractionFormMachineContext {
};

export type InteractionFormMachineEvent =
    | {
    type: "TYPE";
};

const otp = x.states(
    x.state('pending-authentication', x.on("SEND", 'send-code')),
    x.state('send-code', x.invoke('otp-send', x.onDone('pending-verification', x.assign({
        ticket: (context, e) => e.data?.regToken,
    })))),
    x.state('pending-verification', x.on("SUBMIT", 'verifying', x.assign({
        code: (context, e) => e.data?.code,
    }))),
    x.state('verifying', x.invoke('otp-verify', x.onDone('pending-verification', x.assign({
        token: (context, e) => e.data?.token,
    })))),
    x.finalState('error'),
    x.finalState('complete'));


const tokenService = (next, onError) => x.invoke('token', x.onDone(next, x.assign({
        access_token: (context, e) => e.data?.access_token,
        authorization_details: (context, e) => e.data?.authorization_details
    })),
    x.onError(onError, x.assign({
        error: (context, e) => e.data?.errorCode,
        message: (context, e) => e.data?.errorMessage,
        ticket: (context, e) => e.data?.ticket
    })));

const loginService = (next, onError) => x.invoke('login', x.onDone(next, x.assign({
        code: (context, e) => e.data?.code,
    })),
    x.onError(onError, x.assign({
        error: (context, e) => e.data?.errorCode,
        message: (context, e) => e.data?.errorMessage
    })));


const authenticationService = (next, onError) => x.states(
    x.state('login', loginService('token', onError)),
    x.state('token', tokenService(next, 'login'))
)

const authorizationService = (authorized, notAuthorized) =>
    x.always(
        x.transition(
            authorized,
            x.effect((context, event) => {
            }),
            x.guard((context, event) => context.authorization(context.input)),
        ),
        notAuthorized);

const intentService = (next, onError) => x.invoke('post-intent', x.onDone(next, x.assign({
    auth: (context, event) => event.data?.auth,
    authorization_request: (context, event) => event.data?.authorization_request,
    intent_id: (context, event) => event.data?.id
})), x.onError(onError));

 
const requireAuthorization = () => false;

const assignSighUpInfo = x.assign({input: (context, event) => event.data});
const assignTemplate = x.assign({
    metadata: (context, event) => event?.data?.metadata,
    authorization: (context, event) => event?.data?.authorization || requireAuthorization
});

const submittingService = (next, error) => 
        x.states(
            x.state('authorization', authorizationService('#submit.execution', `#submit.intent`)),
            x.state('intent', x.id(`submit.intent`), intentService(`#submit.authentication`, error)),
            x.state('authentication', x.id(`submit.authentication`), authenticationService('#submit.execution', error)),
            x.state('execution', x.id(`submit.execution`), x.invoke('post-interaction', x.onDone(next), x.onError(error))),
        ) ;

const interactionFormMachine = x.createMachine<InteractionFormMachineContext,
    InteractionFormMachineEvent>(
    x.id('sighUpForm'),
    x.states(
        x.state('draft', x.on("TEMPLATE", "loaded", assignTemplate)),
        x.state('loaded', x.on("SUBMIT", "submitting", assignSighUpInfo)),
        x.state('submitting', submittingService( '#success', '#error')),
        x.state('success', x.id("success")),
        x.state('error', x.id("error")),
    )
);

export default interactionFormMachine;
