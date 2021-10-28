export default  {
    title: "Interaction Service",
    eventPayloads: {
        SUBMIT: {
            info: {
                channel: "sms",
                identity: {
                    "phonenumber": 543332123
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