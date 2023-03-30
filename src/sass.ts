import sass from "https://deno.land/x/denosass@1.0.6/mod.ts";
import { SassOptions } from "https://deno.land/x/denosass@1.0.6/src/types/module.types.ts";
import { CompileError } from "./types.ts";

export function compileSass(content: string,options:SassOptions):string{
    const compiler = sass(content,options);
    const result = compiler.to_string();
    if(result === false){
        throw new CompileError('Can not compile sass content.');
    }
    return result.toString();
}