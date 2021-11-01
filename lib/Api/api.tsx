import React, {useEffect, useRef} from "react";
import {API} from '@stoplight/elements';
import '@stoplight/elements/styles.min.css';
import {OpenApiBuilder} from "openapi3-ts/src/dsl/OpenApiBuilder";

export function OpenApi({spec}) {
    // const spcUrl=  spec && `./specs/${spec}/opemapi.yaml` || "specs/interaction/openapi.yaml";
    const spcUrl = spec && `../specs/${spec}/openapi.yaml` || "specs/interaction/openapi.yaml";
    return <div>
        spec
        <rapi-doc-mini
            spec-url={spcUrl}></rapi-doc-mini>
        {/*<a href={`./specs/index.html`}  >Go To Api</a>*/}

        {/*<script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>*/}

        {/*{ <API apiDescriptionUrl={spcUrl}  /> }*/}
        {/*<script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"> </script>*/}
    </div>
}

export function ElementOpenApi({api}) {
    // const spcUrl=  spec && `./specs/${spec}/opemapi.yaml` || "specs/interaction/openapi.yaml";
    // const spcUrl=  spec && `../specs/${spec}/openapi.yaml` || "specs/interaction/openapi.yaml";
    const apiDocRef = useRef(null);
    useEffect(() => {
        // @ts-ignore
        // let objSpec = JSON.parse(api);

        if(apiDocRef.current){
            apiDocRef.current.loadSpec(api)
        }
     }, [apiDocRef, api]);

    return          <rapi-doc-mini
        schema-expand-level={1}
            id={'rapi'}
            ref={apiDocRef}  ></rapi-doc-mini>
        
        {/*<a href={`./specs/index.html`}  >Go To Api</a>*/}

        {/*<script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>*/}

        {/*<API  apiDescriptionDocument={api}  /> */}
        {/*<script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"> </script>*/}
             
        }