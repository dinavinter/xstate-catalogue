import * as x from "xsfp";
import {SighUpInfo} from "./signup-xfp.machine";
import {BindInfo} from "./interactionService";


const templateStore = {
    get: async (d) => {
        return {schema: await import ("../schemas/SignUpTemplateSchema.json")}
    }
};


export interface InteractionServiceMachineContext {
    metadata: any,
    input?: SighUpInfo;
    BindInfo?: BindInfo;
    id?: string;
}


export type InteractionServiceMachineEvent =
    | BIND
    | SUBMIT;

type BIND =
    {
        type: 'BIND';
        info: BindInfo;
    }
type SUBMIT =
    {
        type: 'SUBMIT';
        info: SighUpInfo;
    }


const assignSighUpInfo = x.assign({input: (context, event) => event.info, id: (context, event) => Math.random()});
const assignBindInfo = x.assign({BindInfo: (context, event) => event.info});

const annotateHref = (path) => (context, meta) => `/interactions/sighUp/v1${context?.id && `/${context?.id}`}/${path}`;
export const machineCreator = (appName, defaultSchema= defaults) => x.createMachine<InteractionServiceMachineContext, InteractionServiceMachineEvent>(
    x.id(`interaction-service#${appName}`),
    x.context({
        metadata: {
            appName: appName,
            schema: defaultSchema,

        }
    }),
    x.meta({
            interaction: appName,
            schema: defaultSchema,

            basePath: `/interactions/${appName}/v1`,
            href: (id, path) => `/interactions/${appName}/v1${id && `/${id}`}${path && `/${path}`}`,

            links: {
                self: `/interactions/${appName}/v1`,
                template: annotateHref('template'),
                submit: annotateHref('submit'),
                bind: annotateHref('bind'),
                authorization: '/oauth/authorize'
            }
        }
    ),
    x.states(
        x.state('draft', x.context({template: templateStore.get('sighUp')}), x.on("SUBMIT", "intent", assignSighUpInfo)),
        x.state('intent', x.on("BIND", "verified", assignBindInfo)),
        x.state('verified', x.invoke('projection', x.id('project-interaction'), x.onDone('completed'))),
        x.finalState('completed')
    )
);

const defaults = '/specs/interaction/components/schemas/SignUpSchema.yaml';

export default machineCreator("sighUp");
// export default machineCreator("sighUp");
