let id = 0;
const defaultRequest = {
    query: {},
    request: {
        body: {
            app: 'interaction-service'
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