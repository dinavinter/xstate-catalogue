import React, {useEffect, useRef} from "react";
import 'rapidoc'; // <-- import rapidoc

declare global {
    namespace JSX {
        interface IntrinsicElements {
            item: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'rapi-doc-mini':  React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;  

        }
    }
}

export function OpenApi({spec}) {
    // const spcUrl=  spec && `./specs/${spec}/opemapi.yaml` || "specs/interaction/openapi.yaml";
    const spcUrl = spec && `../specs/${spec}/openapi.yaml` || "specs/interaction/openapi.yaml";
    // @ts-ignore
    return <div> 
        <rapi-doc-mini  
            spec-url={spcUrl}     
            render-style = "read"
        />
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
    // @ts-ignore 
    return          
    <rapi-doc-mini
    schema-expand-level={1}
    id={'rapi'}
    ref={apiDocRef}  />
        
        {/*<a href={`./specs/index.html`}  >Go To Api</a>*/}

        {/*<script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>*/}

        {/*<API  apiDescriptionDocument={api}  /> */}
        {/*<script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"> </script>*/}
             
        }