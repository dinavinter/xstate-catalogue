import {metadata} from "../../lib/metadata";
import {OpenApi} from "../../lib/Api/api";
import {InferGetStaticPropsType, NextPage} from "next";
import {useLayout} from "../../lib/GlobalState";
import React, {useEffect, useRef} from "react";
import {inspect} from "@xstate/inspect";
import Head from "next/head";
import {FlyPaneProvider} from "../../lib/OffCanvasProvider";
import {useRouter} from "next/router";

export const getStaticProps = async ({params}) => {
    const fs = await import('fs');
    const path = await import('path');
 

    return {
        props: {
            slug: params.id as string,
           
        },
    };
};

const APIPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = (props) => {  
     
    
    return (
        <>
            <Head>
                <title> API Refernce { props.slug}</title>
            </Head>
            <FlyPaneProvider>
                <OpenApi spec={props.slug} /> 
            </FlyPaneProvider>

        </>
    );
};
export default APIPage;
