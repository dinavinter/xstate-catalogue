import 'bootstrap/dist/css/bootstrap.min.css';
import {Card, Collapse, Col, Row, Toast, Offcanvas} from "react-bootstrap";
import React, {useContext, useEffect, useRef, useState} from 'react';
import {Interpreter} from "xstate";
import {useSelector} from "@xstate/react";

export const FlyPaneContext = React.createContext<{
    flyJson ,
    flyChildren
}>({flyJson: (j)=>alert(JSON.stringify(j)), flyChildren: (j)=>alert()} );

export function  useFlyPane(){
    return useContext(FlyPaneContext);
}

const Pretty = ({json}) => {
    const jsonContext = 
          JSON.stringify(json, null, 2);
 
    const jsonContextRef = useRef(null);
    useEffect(() => {
        // @ts-ignore
        const hljs: any = window.hljs;
        if (hljs) {
            hljs.highlightBlock(jsonContextRef.current);
        }
    }, [jsonContextRef, jsonContext]);
    return (
        <pre>
      <code ref={jsonContextRef} className="json">
        {jsonContext}
      </code>
    </pre>
    );
}
export function FlyPaneProvider({children}) {
    const [show, setShow] = useState(false);
    const [json, setJson] = useState({});
    const [child, setChild] = useState({});
    const [header, setHeader] = useState({});

    const handleClose = () => setShow(false);
    const showJson = (json, header) =>{
        setChild(null);

        setJson(json);
        setShow(true);
    } 
const showChildren = (child, header) =>{
         setChild(child);
         setChild(header);
        setShow(true);
    } 

    return (
        <FlyPaneContext.Provider value={{flyJson: showJson, flyChildren: showChildren }}>
            {children}
            <Offcanvas show={show} onHide={handleClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Offcanvas</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {child || <Pretty  json={json} />} 
                </Offcanvas.Body>
            </Offcanvas >
          
        </FlyPaneContext.Provider>
    );
}

 