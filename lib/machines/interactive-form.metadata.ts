export default  {
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
        CONFIRM: {
            info: {
                auth: "OTP",
            },
        },
    }
};