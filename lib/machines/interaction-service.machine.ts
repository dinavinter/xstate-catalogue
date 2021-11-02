import * as x from "xsfp";
import {SighUpInfo} from "./signup-xfp.machine";
import {ConfirmInfo} from "./interactionService";


const templateStore = {
    get: async (d) => {
        return {schema: await import ("../schemas/SignUpTemplateSchema.json")}
    }
};


export interface InteractionServiceMachineContext {
    metadata: any,
    input?: SighUpInfo;
    confirmInfo?: ConfirmInfo;
    id?: string;
}


export type InteractionServiceMachineEvent =
    | CONFIRM
    | SUBMIT;

type CONFIRM =
    {
        type: 'CONFIRM';
        info: ConfirmInfo;
    }
type SUBMIT =
    {
        type: 'SUBMIT';
        info: SighUpInfo;
    }


const assignSighUpInfo = x.assign({input: (context, event) => event.info, id: (context, event) => Math.random()});
const assignConfirmInfo = x.assign({confirmInfo: (context, event) => event.info});

const annotateHref = (path) => (context, meta) => `/interactions/sighUp/v1${context?.id && `/${context?.id}`}/${path}`;
export const machineCreator = (appName, defaultSchema) => x.createMachine<InteractionServiceMachineContext, InteractionServiceMachineEvent>(
    x.id(`interaction-service#${appName}`),
    x.context({
        metadata: {
            appName: appName,
            schema: defaultSchema,

        }
    }),
    x.meta({
            interaction: 'sighUp',
            basePath: `/interactions/${appName}/v1`,
            href: ( id, path) =>  `/interactions/${appName}/v1${id && `/${id}`}${path && `/${path}`}`,

            links: {
                self: `/interactions/${appName}/v1`,
                template: annotateHref('template'),
                submit: annotateHref('submit'),
                confirm: annotateHref('confirm'),
                authorization: '/oauth/authorize'
            }
        }
    ),
    x.states(
        x.state('draft', x.context({template: templateStore.get('sighUp')}), x.on("SUBMIT", "intent", assignSighUpInfo)),
        x.state('intent', x.on("CONFIRM", "verified", assignConfirmInfo)),
        x.state('verified', x.invoke('projection', x.id('project-interaction'), x.onDone('completed'))),
        x.finalState('completed')
    )
);


export default machineCreator("sighUp", '/specs/interaction/components/schemas/SignUpSchema.yaml');
