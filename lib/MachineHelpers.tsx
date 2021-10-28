import {useSelector, useService} from '@xstate/react';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {Interpreter} from 'xstate';
import {Card, Collapse, Col, Row, Toast} from "react-bootstrap";
import {BsPrefixRefForwardingComponent} from "react-bootstrap/helpers";
import {useFlyPane} from "./OffCanvasProvider";
import {OpenApi} from "./Api/api";

export const MachineHelpersContext = React.createContext<{
    service: Interpreter<any, any, any>;
    metadata?: MDXMetadata;
}>({} as any);

export interface MDXMetadata {
    eventPayloads?: {
        [eventType: string]: any;
    };
    
    api?: {
        [eventType: string]: string;
    }
}

export const State = (props: { children: string }) => {
    const context = useContext(MachineHelpersContext);
    const [state] = useService(context.service);
    return (
        <span className={`font-mono inline-flex flex-wrap font-bold text-sm `}>
      {props.children.split('.').map((a, index, array) => (
          <span
              key={index}
              className={`transition-colors py-1 ${index === 0 && 'pl-2'} ${
                  index === array.length - 1 && 'pr-2'
              } ${
                  state.matches(props.children)
                      ? `bg-green-100 text-green-800`
                      : 'bg-gray-100 text-gray-600'
              }`}
          >
          {a}
              {index !== array.length - 1 && '.'}
        </span>
      ))}
    </span>
    );
};

function ToastProvider({Body, Control, json, timeout = 3000}) {
    const [show, setShow] = useState(false);

    return (
        <Row>
            <Col xs={6}>
                <Toast onClose={() => setShow(false)} show={show} delay={timeout} autohide>
                    <Toast.Header>
                        <img
                            src="holder.js/20x20?text=%20"
                            className="rounded me-2"
                            alt=""
                        />
                        <strong className="me-auto">Bootstrap</strong>
                        <small>11 mins ago</small>
                    </Toast.Header>
                    <Toast.Body> {Body} </Toast.Body>
                </Toast>
            </Col>
            <Col xs={6}>
                <button onClick={() => setShow(true)}>Show Toast</button>
            </Col>
        </Row>
    );
}

export const API = (props: { children: string }) => {
    const context = useContext(MachineHelpersContext);
    const {flyChildren} = useFlyPane();

    const [state, send] = useService(context.service);

    const {children, ...event} = props;

    return (
        <div>
            <button
                onClick={() => {
                    flyChildren(()=> <OpenApi spec={children} />,`${children} API` );

                }}
                // To override prose
                style={{margin: 0}}
            >
                {children}
            </button>
          </div>

)
    ;
};


export const Event = (props: { children: string }) => {
    const context = useContext(MachineHelpersContext);
    const {flyJson} = useFlyPane();

    const [state, send] = useService(context.service);

    const {children, ...event} = props;
    const defaultEvent = context.metadata?.eventPayloads?.[props.children] || {};
    const eventData = {
        ...defaultEvent,
        ...event,
        type: props.children,
    };

    return (
        <button
            onClick={() => {
                flyJson(eventData, eventData.Type);
                send({
                    ...defaultEvent,
                    ...event,
                    type: props.children,
                });
            }}
            // To override prose
            style={{margin: 0}}
        >
      <span className={`font-mono inline-flex flex-wrap font-bold text-sm `}>
        {props.children.split('.').map((a, index, array) => (
            <span
                key={index}
                className={`transition-colors py-1 ${index === 0 && 'pl-2'} ${
                    index === array.length - 1 && 'pr-2'
                } ${
                    state.nextEvents.includes(props.children)
                        ? `bg-yellow-100 text-yellow-800`
                        : 'bg-gray-100 text-gray-600'
                }`}
            >
            {a}
                {index !== array.length - 1 && '.'}
          </span>
        ))}
      </span>
        </button>


    );
};

export const Action = (props: { children: string }) => {
    return (
        <span
            className={`bg-gray-100 text-gray-600 font-mono font-bold text-sm px-2 py-1 transition-colors`}
        >
      {props.children}
    </span>
    );
};

export const Guard = (props: { children: string }) => {
    return (
        <span
            className={`bg-gray-100 text-gray-600 font-mono font-bold text-sm px-2 py-1 transition-colors`}
        >
      {props.children}
    </span>
    );
};

export const Context = (props: { children: string; stringify?: boolean }) => {
    const context = useContext(MachineHelpersContext);
    const [state] = useService(context.service);

    let transform = (entry: string) => entry;

    if (props.stringify) {
        transform = (entry) => JSON.stringify(entry, null, 2);
    }
    return (
        <span
            className={`bg-gray-100 text-gray-600 font-mono inline-flex flex-wrap font-bold text-sm px-2 py-1 transition-colors ${
                state.context[props.children] ? `bg-yellow-100 text-yellow-800` : ''
            }`}
        >
      {props.children}:{' '}
            {transform(state.context[props.children] ?? 'undefined')}
    </span>
    );
};

export const WholeContext = () => {
    const context = useContext(MachineHelpersContext);
    const jsonContext = useSelector(context.service, (state) => {
        return JSON.stringify(state.context, null, 2);
    });
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
};

export const Service = (props: { children: string }) => {
    const context = useContext(MachineHelpersContext);
    const isCurrentlyInvoked = useSelector(context.service, (state) => {
        const nodesWhichInvokeThisService = state.configuration.filter((node) => {
            return node.invoke.some((invoke) => invoke.src === props.children);
        });

        const isCurrentlyInvoked = nodesWhichInvokeThisService.some((node) =>
            state.matches(node.path),
        );
        return isCurrentlyInvoked;
    });

    return (
        <span
            className={`font-mono inline-flex flex-wrap font-bold text-sm px-2 py-1 transition-colors relative ${
                isCurrentlyInvoked
                    ? `bg-blue-100 text-blue-800`
                    : `bg-gray-100 text-gray-600`
            }`}
        >
      {props.children}
    </span>
    );
};
