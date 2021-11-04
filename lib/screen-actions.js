 

onAfterSubmit = (response) => {
    response
        .actions
        .where(a => a.class.contains('after-login'))
        .map(onLogin += followLink(a))
    
    response
        .actions
        .where(a => a.class.contains('after-submit'))
        .map(onAfterSubmit += followLink(a))

    response
        .actions
        .where(a => a.class.contains('screen-set'))
        .map(showScreenSet(a.name));
}


const response =
    {
        "class": ["sign-up"],
        "properties": {
            "id": "093b941d",
            "status": "pending",
            "phonenumber": "5464545",
            "channel": "phonenumber"
        },

        "actions": [
            {
                "name": "otp-loin",
                "title": "Please Verify Your Phone",
                "class": ['screen-set', 'login'],
                //semantic can be used when we have hosted screen 
                "method": "GET",
                "href": "/screen-set/otp-login",
                "type": "application/html",
                "fields": [

                    {"name": "phonenumber", "type": "hidden", "value": "5464545"}
                ]
            },
            {
                "name": "bind",
                "class": ['http', 'after-login'],
                "method": "POST",
                "href": "/me/interactions/093b941d/bind",
                "type": "application/json",

            }
        ],
        "links": [
            {"rel": ["self"], "href": "/interactions/093b941d"},
            {"rel": ["bind"], "href": "/me/interactions/093b941d/bind"},
            {"rel": ["reject"], "href": "/interactions/093b941d/reject"}
        ]
    }