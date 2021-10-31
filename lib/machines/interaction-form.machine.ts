import {assign, createMachine, Sender} from "xstate";
import * as x from "xsfp";
import {guard} from "xsfp";


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
        lookup_token: (context, e) => e.data?.aToken,
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
const assignAuthorizationDetails =x.assign(
    {
        authorization_details: (context, event) => event.authorization_details
    });

const authorizationService = (next, onError) => x.states(
    x.state('authorization', 
        x.on("AUTHENTICATE", 'authentication', x.assign(
            {
                authorization_details: (context, event) => event.authorization_details
            })),
        x.on("TOKEN", 'token', assignAuthorizationDetails),
    ),
    x.state('authentication', loginService('token', onError)),
    x.state('token', tokenService(next, 'authentication')),
);


let followActions =  x.send((context, event) => {
        return event.data?.actions?.filter(a => a.class === "event.auto")[0].properties;
    }
);
const assignActions=x.assign({
    intent: (context, event) => {
        return event.data?.actions?.filter(a => a.class === "event.auto").reduce((a, v) => ({ ...a, [v.name]: v.properties}), {});

    }
});

const intentService = (next, onError) => x.invoke('intent', x.onDone(next, followActions), x.onError(onError));

const intentState = x.state('post',
    x.id("submitting.post"),
    x.on("AUTH-LITE", '#authentication.lite'),
    x.on("AUTH-OTP", '#authentication.otp'),
    x.on("submitting.SUCCESS", "#success"),
);


const requireAuthorization = () => false;

const assignInput = x.assign({input: (context, event) => event.input});
const assignTemplate = x.assign({
    metadata: (context, event) => event?.data?.metadata,
    authorization: (context, event) => event?.data?.authorization || requireAuthorization
});
const assignMetadata = x.assign({
    metadata: (context, event) => event?.metadata,
    authorization: (context, event) => event?.authorization || requireAuthorization
});
const submittingService = (next, error) =>
    x.states(
        x.state('lookup', lookupService(`#submit.intent`, error)),
        x.state('intent', x.id(`submit.intent`), intentService(`#submit.authorization`, error)),
        x.state('authorization', x.id(`submit.authorization`), authorizationService('#submit.execution', `#submit.intent`)),
        x.state('execution', x.id(`submit.execution`), x.invoke('post-interaction', x.onDone(next), x.onError(error))),
    );
//add follow actions machine
// rest machine
// signed request machine
// send event with target state or transition 

const interactionFormMachine = x.createMachine(
    x.id('sighUpForm'),
    x.states(
        x.state('loading', x.on("METADATA", "draft", assignMetadata)),
        x.state('draft', x.on("SUBMIT", "submitting", assignInput)),
        x.state('submitting', submittingService('#success', '#error')),
        x.state('success', x.id("success")),
        x.state('error', x.id("error")),
    ),
).withConfig({
    services: {
        lookup: (event, context) => Promise.resolve({aToken: "i am token"}),
        intent: (event, context) => Promise.resolve({
            actions: [
                {
                    class: "event.auto",
                    name:'authorization',
                    properties: {
                        state: "authorization",
                        type: "AUTHENTICATE",
                        request_uri: "instead of details",
                        authorization_details: [{
                            "type": "setAccountInfo",
                            "locations": [
                                "/accounts.setAccountInfo"
                            ],
                            "max_age": 360,
                            "acr_values": "urn:gigya:otp:sms",
                            "claims": {
                                profile: {...event.profile},
                                preferences: {...event.preferences},
                                uid: null,
                                request_sig: null
                            }
                        }]
                    },

                }

            ]
        }),
        token: (context, event) => {
            console.log(context.authorization_details)
            return Promise.resolve({
                actions: [
                    {
                        class: "event.auto",
                        properties: {
                            state: "execute", 
                            type: "POST",
                            access_token: "2YotnFZFEjr1zCsicMWpAA",
                            token_type: "example",
                            expires_in: 3600,
                            authorization_details: [{
                                "type": "setAccountInfo",
                                "locations": [
                                    "/accounts.setAccountInfo"
                                ],
                                "max_age": 360,
                                "acr_values": "urn:gigya:otp:sms",
                                "claims": {
                                    profile: {...event.profile},
                                    preferences: {...event.preferences},
                                    uid: "uid-541235",
                                    request_sig: {
                                        nonce: '<nonce>',
                                        timestamp: '<current unix-time>',
                                        sig: '<signature>'
                                    }
                                }
                            }]
                        },

                    }

                ]
            })
        }
    }
});

export default interactionFormMachine;
