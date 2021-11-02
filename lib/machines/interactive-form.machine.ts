import * as x from "xsfp";
import {interactionService} from "./interactionService";


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

const loginService = (next, onError) => x.on('LOGGED-IN', next, x.assign({
    identity: (context, event) => {
        return {
            ...context.identity,
            id_token: event.data?.id_token
        }
    }
}));

const lookupService = (next, onError) => x.invoke('lookup', x.onDone(next, x.assign({
        identity: (context, e) => {
            return {lookup_token: e.data?.aToken, ...context.identity || {}}
        },
    })),
    x.onError(onError, x.assign({
        error: (context, e) => e.data?.errorCode,
        message: (context, e) => e.data?.errorMessage
    })));


const assignAuthorizationDetails = x.assign(
    {
        auth: (context, event) => {
            return {
                authorization_details: event.authorization_details,
                request_uri: (context, event) => event.request_uri,
            }
        }
    });

const authorizationService = (next, onError) => x.states(
    x.state('authorization',
        x.on("BIND", next),
        x.on("AUTHENTICATE", 'authentication', assignAuthorizationDetails),
        x.on("TOKEN", 'token', assignAuthorizationDetails),
    ),
    x.state('authentication', loginService('token', onError)),
    x.state('token', tokenService(next, 'authentication')),
);

let followActions = x.send((context, event) => {
    console.log(event.data);
        return {type:event.data?.actions?.filter(a => a.class === "event")[0]?.name}
    }
);
const assignActions = x.assign({
    intent: (context, event) => {
        return event.data?.actions?.filter(a => a.class === "event.auto").reduce((a, v) => ({
            ...a,
            [v.name]: v.properties
        }), {});

    }
});

const intentService = (next, onError) => x.invoke('intent', x.onDone(next, followActions), x.onError(onError));

const assignInput = x.assign({
    input: (context, event) => event.input,
    identity: (context, event) => event.input?.identity
});

const assignMetadata = x.assign({
    metadata: (context, event) => event?.metadata
});
const submittingService = (next, error) =>
    x.states(
        x.state('lookup', lookupService(`#submit.intent`, error)),
        x.state('intent', x.id(`submit.intent`), intentService(`#submit.authorization`, error)),
        x.state('authorization', x.id(`submit.authorization`), authorizationService('#submit.execution', `#submit.intent`)),
        x.state('execution', x.id(`submit.execution`), x.invoke('bind', x.onDone(next), x.onError(error))),
    );
//add follow actions machine
// rest machine
// signed request machine
// send event with target state or transition 
const machine = "#interaction-machine";
const service = interactionService({
    getState: () => {
        const state = localStorage.getItem(machine);
        if (state) {
            return JSON.parse(state)
        }
    },
    setState: (state) => (localStorage.setItem(machine, JSON.stringify(state)))
})
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
        intent: async (event, context) => {
            try {
                return await service.submit(context.input)

            }
            catch (e){
                console.error(e)
            }
        },
        bind: async (event, context) => await service.bind(context.auth),
        token: (context, event) => {
            console.log(context.authorization_details)
            return Promise.resolve({
                access_token: "2YotnFZFEjr1zCsicMWpAA",
                token_type: "example",
                expires_in: 3600,
                authorization_details: context.auth.authorization_details.map(details => {
                    return {
                        ...details,
                        claims: {
                            ...details.claims,
                            uid: "uid-541235",
                            request_sig: {
                                nonce: '<nonce>',
                                timestamp: '<current unix-time>',
                                sig: '<signature>'
                            }
                        }

                    }
                }),
                actions: [
                    {
                        class: "event.auto",
                        properties: {
                            state: "execute",
                            type: "POST",
                            href: "/accounts.setAccountInfo"
                        },

                    }

                ]
            })
        }
    }
});


export default interactionFormMachine;
