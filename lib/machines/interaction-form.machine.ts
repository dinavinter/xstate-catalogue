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
        token: (context, e) => {
            return {
                access_token: e.data?.access_token,
                authorization_details: e.data?.authorization_details
            }
        }
    })),
    x.onError(onError, x.assign({
        error: (context, e) => e.data?.errorCode,
        message: (context, e) => e.data?.errorMessage,
        ticket: (context, e) => e.data?.ticket
    })));

const loginService = (next, onError) => x.invoke('login', x.onDone(next, x.assign({
        auth: (context, event) => {
            return {
                ...context.auth,
                login_token: event.data?.login_token
            }
        }
    })),
    x.onError(onError, x.assign({
        error: (context, e) => e.data?.errorCode,
        message: (context, e) => e.data?.errorMessage
    })));
const lookupService = (next, onError) => x.invoke('lookup', x.onDone(next, x.assign({
        lookup_token: (context, e) => e.data?.token,
    })),
    x.onError(onError, x.assign({
        error: (context, e) => e.data?.errorCode,
        message: (context, e) => e.data?.errorMessage
    })));

const authenticationService = (next, onError) => x.states(
    x.state('login', loginService('token', onError)),
    x.state('token', tokenService(next, 'login'))
)

const liteAuthenticationService = (next, onError) => x.states(
    x.state('lookup', lookupService('token', onError)),
    x.state('token', tokenService(next, onError))
);

const authorizationService = (next, onError) => x.states(
    x.state('authorization', x.always(
        x.transition('authentication'), 
        guard((context, event) =>  event.data?.require_authn ),
        // this will run only if the "require_authn" guard above is false
        x.transition('token'),
        guard((context, event) => !context.auth?.access_token),
        // this will run only if the "access_token" guard above is false 
        'token',
    )),
    x.state('authentication', loginService('token', onError)),
    x.state('token', tokenService(next, 'authentication')),
);


const intentService = (next, onError) => x.invoke('post-intent', x.onDone(next, x.assign({
    auth: (context, event) => {
        return {
            auth_provider: event.data?.auth_provider,
            authorization_request: event.data?.authorization_request,
            intent_token: event.data?.intent_token,
         }
    },

    intent_id: (context, event) => event.data?.id
})), x.onError(onError) );
 

const requireAuthorization = () => false;

const assignInput = x.assign({input: (context, event) => event.data});
const assignTemplate = x.assign({
    metadata: (context, event) => event?.data?.metadata,
    authorization: (context, event) => event?.data?.authorization || requireAuthorization
});
const assignMetadata = x.assign({
    metadata: (context, event) => event?.data?.metadata,
    authorization: (context, event) => event?.data?.authorization || requireAuthorization
});
const submittingService = (next, error) =>
    x.states(
        x.state('lookup', lookupService(`#submit.intent`, error)),
        x.state('intent', x.id(`submit.intent`), intentService(`#submit.authorization`, error)),
        x.state('authorization', x.id(`submit.authorization`), authorizationService('#submit.execution', `#submit.intent`)),
        x.state('execution', x.id(`submit.execution`), x.invoke('post-interaction', x.onDone(next), x.onError(error))),
    );

const interactionFormMachine = x.createMachine<InteractionFormMachineContext,
    InteractionFormMachineEvent>(
    x.id('sighUpForm'),
    x.states(
        x.state('loading', x.on("METADATA", "draft", assignMetadata)),
        x.state('draft', x.on("SUBMIT", "submitting", assignInput)),
        x.state('submitting', submittingService('#success', '#error')),
        x.state('success', x.id("success")),
        x.state('error', x.id("error")),
    )
);

export default interactionFormMachine;
