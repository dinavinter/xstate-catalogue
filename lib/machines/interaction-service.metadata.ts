export default  {
    title: "Interaction Service",
    eventPayloads: {
        SUBMIT: {
            info: {
                channel: "sms",
                identity: {
                    "phonenumber": 543332123,
                    uuid: "userA"
                },
                "newsletter": true
            },
        },
        BIND: {
            info: {
                auth: "OTP",
            },
        },
    }
};