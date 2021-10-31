export default {
    title: "Interaction Form",
    eventPayloads: {
        SUBMIT: {
            input: {
                channel: "sms",
                identity: {
                    "phonenumber": 543332123,
                },
                "newsletter": true
            },
        },

        METADATA: { 
                metadata: {
                    interaction: 'sighUp',
                    basePath: '/interactions/v1/sighUp',
                    links: {
                        self: '/metadata',
                        schema: '/schema',
                        submit: '/submit',
                        confirm: '/confirm',
                        authorization: '/oauth/authorize',
                        token: '/oauth/token'
                    }

                },
            
        },
        CONFIRM: {
            info: {
                auth: "OTP",
            },
        },
    }
};