import {OpenApiBuilder, OpenAPIObject} from "openapi3-ts";
import {OperationObject, PathItemObject} from "openapi3-ts/src/model/OpenApi";
import {CommonAPIProps} from "@stoplight/elements/containers/API";
import {$Refs} from "@stoplight/json-schema-ref-parser";

// type operations={
//     [name:string] : OperationObject
// };
// const apiOperations:operations={
//     PostInteraction: {
//        
//     }
// }


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
        ['LOGGED-IN']: {
            id_token: "X5657fsddks"
        },
        ['done.invoke.login']: {
            data: {
                id_token: "X5657fsddks"

            }
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
    },
    api: {
        lookup: (context, event) => {
            const channel = context.input?.channel || "sms";
            const identifier_type = channel == "sms" ? "phonenumber" : "email";
            const identifier = context.identity ? [identifier_type] : '087653222';

            return new OpenApiBuilder()
                .addServer({
                    url: 'https://accounts.gigya.com'
                })

                .addSchema('Lookup', {
                    properties: {
                        identifier: {
                            type: 'string'
                        },
                        identifier_type: {
                            type: 'string',
                            enum: ['phonenumber', 'email']
                        },
                    },
                    example: {
                        identifier_type: identifier_type,
                        identifier: identifier

                    }
                })
                .addRequestBody('LookupRequest', {
                    content: {
                        ['application/json']:
                            {
                                schema: {
                                    $ref: '#/components/schemas/Lookup'

                                }
                            }
                    }
                })


                .addPath('/auth/lookup', {
                    description: "lookup for existing user by identifier",
                    post: {
                        operationId: "Lookup",
                        requestBody: {
                            content: {
                                ['application/json']:
                                    {
                                        schema: {
                                            $ref: '#/components/schemas/Lookup'

                                        }
                                    }
                            }
                        },
                        responses: {
                            '200':
                                {
                                    content: {
                                        ['application/json']:
                                            {
                                                schema: {
                                                    properties: {
                                                        aToken: "sdsds"
                                                    }

                                                }
                                            }
                                    }
                                }

                        }
                    }

                })
                .getSpec()
        },


    }
};