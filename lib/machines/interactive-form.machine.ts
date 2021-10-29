import {spawn} from "xstate";
import * as x from "xsfp";


const lookupService = (next, onError) => x.invoke('lookup', x.onDone(next, x.assign({
        lookup_token: (context, e) => e.data?.token,
    })),
    x.onError(onError, x.assign({
        error: (context, e) => e.data?.errorCode,
        message: (context, e) => e.data?.errorMessage
    })));

const authenticationService = (auth) => x.invoke(`authn-${auth}`, x.onDone(x.send((context, event) => {
        return {
            type: "authentication.SUCCESS",
            auth: {
                ...context.auth,
                token: event.data?.token
            }
        }
    })),
    x.onError(x.assign({
        error: (context, e) => e.data?.errorCode,
        message: (context, e) => e.data?.errorMessage
    })));


const assignInput = x.assign({input: (context, event) => event.data});
const assignMetadata = x.assign({
    metadata: (context, event) => event?.data?.metadata,
});

const interactiveFormMachine = x.createMachine(
    x.id('sighUpForm'),
    x.on("LOAD", 'loading'),
    x.states(
        x.state('loading', x.on("loading.SUCCESS", "draft", assignMetadata)),
        x.state('draft', x.on("draft.SUBMIT", "submitting", assignInput)),
        x.state('submitting',
            x.states(
                x.state('lookup', lookupService('#submitting.post', "#error")),
                x.state('post',  
                    x.id("submitting.post"),
                    x.on("AUTH-LITE", '#authentication.lite'),
                    x.on("AUTH-OTP", '#authentication.otp'),
                    x.on("submitting.SUCCESS", "#success"),
                ),
                x.state('authentication',
                    x.id("authentication"),
                    x.on("authentication.SUCCESS", '#submitting.post'),
                    x.states(
                        x.state('lite', authenticationService('lite')),
                        x.state('otp', authenticationService('otp'))
                    )),
            ),
        ),
        x.state('success', x.id("success")),
        x.state('error', x.id("error")),
    )
);

// function startService(machine, state) {
//     const service = interpret(machine)
//         .start(state && machine.resolveState(state))
//     return service
// }
export default interactiveFormMachine;
