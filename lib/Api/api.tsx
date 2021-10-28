import React from "react";

export function OpenApi({spec}){
    const spcUrl=  spec && `./specs/${spec}/opemapi.yaml` || "specs/interaction/openapi.yaml";
    return <div>
        <a href={`./specs/index.html`}  >Go To Api</a>

        {/*<script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>*/}

        <rapi-doc spec-url={spcUrl}></rapi-doc>
    {/*<script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"> </script>*/}
    </div>
}