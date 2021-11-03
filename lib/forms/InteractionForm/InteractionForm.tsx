import * as React from 'react'
import {Box, Button, CircularProgress, Grid, TextField, Typography} from '@material-ui/core'
import MailOutlineIcon from '@material-ui/icons/MailOutline'
import {JSONSchema7} from "json-schema";
import Form, {IChangeEvent, ISubmitEvent} from "@rjsf/core";

export interface InteractionFormProps<TemplateType = any> {
    onSubmit: (interaction: TemplateType) => void,
    schema: JSONSchema7,
    isSubscribing?: boolean
    hasError?: boolean
}

//
// function log<T>(log: string) {
//     return function (p1: IChangeEvent<T>, p2: React.FormEvent<HTMLFormElement>) {
//         log && console.log(log);
//         p1 && console.log(p1);
//         p2 && console.log(p2)
//     };
// }
//
// function logChange<T>(log: string) {
//     return function (e: IChangeEvent<T>, es?: ErrorSchema) {
//         log && console.log(log);
//         e && console.log(e);
//         es && console.log(es)
//     };
// }

export const InteractionForm: React.FC<InteractionFormProps> = ({
                                                                    onSubmit,
                                                                    schema,
                                                                    isSubscribing,
                                                                    hasError
                                                                }) => {
    // type MyForm = Form<InteractionTemplate>;

    return (
        <Box py={3}>
            <Grid container>
                <Grid item xs={12} md={6}>
                    <Typography variant='h2'>My Interaction Form</Typography>
                    <Typography variant='subtitle1'>Subscribe to newsletter</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Box display='flex' flexDirection='column' position='relative'>
                        {isSubscribing && (
                            <Box
                                position='absolute'
                                top={0}
                                left={0}
                                right={0}
                                bottom={0}
                                zIndex={1}
                                style={{backgroundColor: 'white', opacity: 0.5}}
                                display='flex'
                                justifyContent='center'
                                alignItems='center'
                            >
                                <CircularProgress/>
                            </Box>
                        )}

                        {/*<Grid container spacing={3}>*/}
                        {<Form
                            schema={schema}
                            onSubmit={i => onSubmit(i.formData)}/>}
                        {/*</Grid>*/}

                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}
