import * as React from 'react'
 import "bootstrap";
 import 'bootstrap/dist/css/bootstrap.css';
import { Button } from 'react-bootstrap';

 
 import {
    UIGenerator,
    isInvalid,
    createEmptyStore,   
   createOrderedMap,
    storeUpdater,
} from "@ui-schema/ui-schema";

import {widgets} from "@ui-schema/ds-material";
import {JsonSchemaRoot} from "@ui-schema/ui-schema/JsonSchema";
import {JSONSchema7} from "json-schema";

// console.log(schema);
const values = {};
export interface InteractionFormProps<TemplateType = any> {
    onSubmit: (interaction: TemplateType) => void,
    schema: JsonSchemaRoot,
    isSubscribing?: boolean
    hasError?: boolean
}

const useStyle = (styles) => {
    React.useEffect(() => {
        styles.use();
        return () => styles.unuse();
    }, [styles]);
};

export const Form:React.FC<InteractionFormProps> = ({
                                                                                  onSubmit,
                                                                                  schema,
                                                                                  isSubscribing,
                                                                                  hasError
                                                                              }) => {
    const [schemaMap, setSchemaMap] = React.useState(createOrderedMap(schema));

    const [store, setStore] = React.useState(() => createEmptyStore(schemaMap.get('type')));
    const [showValidity, setShowValidity] = React.useState(false);
    
    React.useEffect(() => {
        let schemaMap = createOrderedMap(schema);
        setSchemaMap(() => schemaMap);
        setStore(oldStore => {
            const newStore = createEmptyStore(schemaMap.get('type'))
            if(newStore.values.equals && newStore.values.equals(oldStore.values)) {
                // only change the store, when the values have really changed - otherwise it could overwrite the already changed validity
                return oldStore
            }
            return newStore
        });
    }, [schema, setSchemaMap, setStore]);

 
    const onChange = React.useCallback((storeKeys, scopes, updater, deleteOnEmpty, type) => {
        setStore(storeUpdater(storeKeys, scopes, updater, deleteOnEmpty, type))
    }, [setStore])

    const emptyStore = React.useCallback((storeKeys, scopes, updater, deleteOnEmpty, type) => {
        setStore(storeUpdater(storeKeys, "", updater, deleteOnEmpty, type))
    }, [setStore])

     
    return (<React.Fragment>
            {window &&
         <div className="App container">
                 <UIGenerator
                    schema={schemaMap}
                    
                    store={store}
                    onChange={onChange}
                    showValidity={showValidity}

                    widgets={widgets}
                />
                <button
                    /* show the validity only at submit (or pass `true` to `showValidity`) */
                    onClick={() =>
                        isInvalid(store.getValidity()) ?
                            setShowValidity(true) :
                            console.log('doingSomeAction:', store.valuesToJS())
                    }
                >send!
                </button>             
        </div> }
        </React.Fragment>
     );
}

 
 
   