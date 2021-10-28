import React from "react";
import { API } from '@stoplight/elements';
import '@stoplight/elements/styles.min.css';

export function OpenApi({spec}){
    // const spcUrl=  spec && `./specs/${spec}/opemapi.yaml` || "specs/interaction/openapi.yaml";
    const spcUrl=  spec && `../specs/${spec}/openapi.yaml` || "specs/interaction/openapi.yaml";
    return <div>
        spec
        <rapi-doc-mini
            spec-url ={spcUrl}       > </rapi-doc-mini>
        {/*<a href={`./specs/index.html`}  >Go To Api</a>*/}

        {/*<script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>*/}

        {/*{ <API apiDescriptionUrl={spcUrl}  /> }*/}
    {/*<script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"> </script>*/}
    </div>
}