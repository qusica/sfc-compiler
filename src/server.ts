import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import {compileWithCss} from './sfc-compiler.ts'

async function handler (request: Request): Promise<Response> {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    if(pathname === '/sfc/compile'){
        const result = await handleRequest(request);        
        return Response.json(result);
    }else{
        return new Response('request error',{headers:{'Content-Type':'text/plan'},status:404});
    }
};

export async function startServer(){
    await serve(handler);
}
function empty(value: string){
    return value == null || value === '';
}
async function handleRequest(request: Request){
    try{
        const param = await request.json();
        const {filename,content,vuepath} = param;
        for(const name of ['filename','content','vuepath']){
            if(empty(param[name])){
                return {error:`${name} can not be empty.`}
            }
        }
        const result = await compileWithCss(filename,vuepath,content);       
        return {code:result.js}
    }catch(e){
        return {error:e.message}
    }
}

