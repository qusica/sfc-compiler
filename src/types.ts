import { BindingMetadata } from 'https://esm.sh/@vue/compiler-sfc'
export interface ServerConfig{
    port : number;
}
export class CompileResult{
    id: string;    
    js?: string | undefined;
    css?: string | undefined;
    constructor(id: string){
        this.id = id;
    }
}
function text(param: any): string{
    return Array.isArray(param) ? param.map(i=>String(i)).join('\n') : String(param);
}
export class CompileError extends Error{
    constructor(errors: any){
        super(text(errors));
    }   
}

export interface CompileData{
    code: string,
    bindings?:BindingMetadata | undefined
}

