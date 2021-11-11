import React, {useContext, useEffect, useState} from "react";
import {Button, Modal, Offcanvas} from "react-bootstrap";
import {FlyPaneContext} from "../../OffCanvasProvider";
import {InteractionForm, InteractionFormProps} from "./InteractionForm";
import {OverlayContainer} from "@react-aria/overlays";
import {ModalDialog} from "../../ModalDialog";
import {CatalogueSearcher} from "../../CatalogueSearcher";
import {useActor, useSelector, useService} from "@xstate/react";
import {MachineHelpersContext} from "../../MachineHelpers";
import * as x from "xsfp";
import {AnyEventObject, interpret, actions} from "xstate";
import {Subject} from "rxjs";
import {filter} from "rxjs/operators";
const {log} =actions;
import * as yaml from 'js-yaml'        ;
import * as JsonRefs from 'json-refs';
 import dynamic from "next/dynamic";
 
const Form = dynamic(
    () => {
        return import("./InteractionFormGen").then(x=>x.Form);
    },
    { ssr: false }
);


const show: (props: InteractionFormProps) => void = () => {
};
export const FormContext = React.createContext<{
    show: (props: InteractionFormProps) => void,

}>({show: show});

export type SubmitEvent = AnyEventObject & {
    type: "SUBMIT"

}

export type RejectEvent = AnyEventObject & {
    type: "REJECT"

}
export type LoadEvent = AnyEventObject & {
    type: "LOAD"

}


const assignForm = x.assign({
    form: (c, e) => e
});


const openForm = x.send((context, event) => {
    return {
        type: 'FORM',
        ...event.response
    }
})


export const formObservable = new Subject<SubmitEvent | RejectEvent>();


const submittingService = (onDone, onError) => x.invoke((c, e) => c.observable.next(e), x.onDone(onDone), x.onError(onError))
// const submittingService = (onDone, onError) => x.pure((c, e) => formObservable.ne)
const interactionFormMachine = x.createMachine(
    x.id('sighUpForm'),
    x.context(
        {observable: formObservable
            
        }
    ),
    x.states(
        x.state('idle', x.on('LOAD', 'schema', assignForm)),
        x.state('schema', x.invoke(async (c, e)=> {  
            console.log('schema');
            console.log(c); 
             const jsonRefs= await JsonRefs.resolveRefsAt(c.form.properties.schema, {
                // Resolve all remote references
                filter: ['relative', 'remote'],
                loaderOptions: {
                    processContent: (res, cb) => cb(undefined, yaml.load(res.text))
                }
            });
        
             console.log(jsonRefs.resolved);
 
            return jsonRefs.resolved;
        }, x.onDone('open', x.assign({
            schema:(c,e)=> e.data
        })))),
        x.state('open', x.on("SUBMIT",
            x.send((c, e) => {
                return {...e.model, type: e.action}
            }, {
                to: (context, event, meta) =>
                    context.observable
            }))),
        x.state('submitting', submittingService('#success', '#error')),
        x.state('success', x.id("success")),
        x.state('error', x.id("error"))
    )).withConfig(
    {
        services: {
            eventsService: (c, e) => c.observable
        }
    }
);
export const interactionFormService = interpret(interactionFormMachine)
    .start();


// formObservable.subscribe(interactionFormService.send);

export const formService = {

    actor: interactionFormService,
    submit: (model) => {
        interactionFormService.send({type: "SUBMIT", model: model, action:"CREATE"})
    },
    close: ( ) => {
        interactionFormService.send({type: "REJECT",   action:"REJECT"})
    },
    onSubmit: (subscriber) => {
        return formObservable
            .asObservable()
            .pipe(filter((pip) => pip.type == "SUBMIT"))
            .subscribe(subscriber)
    },
    events: {

        submit: formObservable
            .asObservable()
            .pipe(filter((pip) => pip.type == "SUBMIT")),

        reject: formObservable
            .asObservable()
            .pipe(filter((pip) => pip.type == "REJECT"))
    },


    open: (form) => {
        console.log('open form');
        interactionFormService.send({type: "LOAD", form: form})
        return {
            subscribe: (subscriber) => {
                return formObservable
                    .asObservable()
                    .subscribe(subscriber)
            },
            submit: formObservable
                .asObservable()
                .pipe(filter((pip) => pip.type == "SUBMIT")),

            reject: formObservable
                .asObservable()
                .pipe(filter((pip) => pip.type == "REJECT"))
        };
    }


}

formService.open.bind(formService);
const FormOverlay=({form})=>{
    console.log('open form');
    console.log(form);

    return       

        <Form schema={form.schema } onSubmit={e => formService.submit(e)}/>
 }
export function FormProvider({children}) {
    const [open, setOpen] = useState(false);
    const [props, setProps] = useState({schema: {}});
    const handleClose = () => setOpen(false);
    const show = (props: InteractionFormProps) => {
        setProps(props);
        setOpen(true);
    }
    const [state, send] = useActor(interactionFormService);

    useEffect(()=>{
        const selectForm = (state) => state.matches('open') && {...state.context.form,schema: state.context.schema};
        const form =selectForm(state);
        form && show(form)

    },[state?.value])

    // const {service} = useContext(MachineHelpersContext);
    // const [state, send] = useActor(interactionFormService);

    // const form = useSelector(interactionFormService, selectForm);

console.log('FormContextProvider');
console.log(props);
// console.log(form.properties.schema);
    return (
        <FormContext.Provider value={{show: show}}>
            <Modal show={open} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{state?.context?.form?.properties?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form schema={props?.schema} onSubmit={e=>formService.submit(e)} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="secondary" onClick={()=> interactionFormService.send({type: "LOAD", form: state.context.form})
                    }>
                        Reload Schema
                    </Button>
                    <Button variant="primary" onClick={handleClose}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
            {children}
        </FormContext.Provider>


    );
}
