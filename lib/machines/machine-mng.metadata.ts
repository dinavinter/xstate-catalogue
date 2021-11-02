let id = 0;
const defaultRequest = {
    query: {},
    request: {
        body: {
            service: 'interaction-service',
            app: 'sighUp'
        }
    }

}


export default {
    title: "Machine Mng",
    eventPayloads: {
        GET: {
            ...defaultRequest,

            query: {},
        },
        CREATE: {
            ...defaultRequest
        },
        FORM: {
            ...defaultRequest,

        },

        UPDATE: {
            ...defaultRequest,

        },
    }
};