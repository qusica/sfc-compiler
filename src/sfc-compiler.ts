import { compileScript, compileTemplate, parse,rewriteDefault,compileStyle,CompilerOptions,SFCDescriptor,BindingMetadata } from "https://esm.sh/@vue/compiler-sfc";
import { CompileResult,CompileError, CompileData } from './types.ts'
import hashId from 'https://esm.sh/hash-sum'
import { transform } from 'https://esm.sh/sucrase'
import {compileSass} from "./sass.ts";

const COMP_IDENTIFIER = `__sfc__`

export function compile(filename: string,runtimeModuleName: string,code: string): CompileResult{
    const id = hashId(filename);
    const compilerOptions = {
        runtimeModuleName,
        isProd:true
    }
    const compiled = new CompileResult(id);
    const {errors,descriptor} = parse(code,{filename,sourceMap: true})
    if(errors.length){
        throw new CompileError(errors)
    }
    const scriptLang = (descriptor.script && descriptor.script.lang) || (descriptor.scriptSetup && descriptor.scriptSetup.lang)
    const isTS = scriptLang === 'ts'
    if (scriptLang && !isTS) {
        throw new CompileError('Only lang="ts" is supported for <script> blocks.')
    }
    const hasScoped = descriptor.styles.some((s) => s.scoped)
    let clientCode = ''
    const appendSharedCode = (code : string) => {
        clientCode += code
    }
    const clientScriptResult = doCompileScript(compilerOptions,descriptor,id,isTS)
    if (!clientScriptResult) {
        throw new CompileError('The compiled script result is empty')
    }
    const {code:clientScript, bindings} = clientScriptResult
    clientCode += clientScript;
  
    if (descriptor.template) {
        const clientTemplateResult = doCompileTemplate(compilerOptions,descriptor,id,bindings,isTS)        
        clientCode += clientTemplateResult
    }
    if (hasScoped) {
        appendSharedCode(
            `\n${COMP_IDENTIFIER}.__scopeId = ${JSON.stringify(`data-v-${id}`)}`
        )
    }
    if (clientCode) {
        appendSharedCode(
            `\n${COMP_IDENTIFIER}.__file = ${JSON.stringify(filename)}` +
            `\nexport default ${COMP_IDENTIFIER}`
        )
        compiled.js = clientCode.trimStart()
    }
    let css = ''
    for (const style of descriptor.styles) {
        if (style.module) {
            throw new CompileError('<style module> is not supported in the playground.')
        }
        if(style.lang){
            const compiledCss = compileSass(style.content,{style:"compressed"});
            style.content = compiledCss;
            //console.log(`parsed ${style.lang} to css:`,style.content)
        }
        const styleResult = compileStyle({
            isProd:true,
            source: style.content,
            filename,
            id,
            scoped: style.scoped
        })
        if (styleResult.errors.length) {
            // postcss uses pathToFileURL which isn't polyfilled in the browser
            // ignore these errors for now
            throw new CompileError(styleResult.errors)
        // proceed even if css compile errors
        } else {
            css += styleResult.code
        }
    }
    if (css) {
        compiled.css = css.trim()
        //console.log(compiled.css)
    } 
    return compiled;
}

function doCompileScript(compilerOptions:CompilerOptions,descriptor:SFCDescriptor,id:string,isTS:boolean): CompileData{
    if (descriptor.script || descriptor.scriptSetup) {
        try{
            const expressionPlugins : CompilerOptions['expressionPlugins'] = isTS ? ['typescript'] : undefined;
            const compiledScript = compileScript(descriptor,{
                id,
                inlineTemplate:true,
                isProd:true,
                templateOptions:{
                    isProd:true,
                    compilerOptions:{
                        expressionPlugins,
                        ...compilerOptions
                    }
                }
            })
            compiledScript.content = compiledScript.content.replace(/from\s+'vue'/,`from '${compilerOptions.runtimeModuleName}'`)
            let code = '';
            
            code +=
                `\n` +
                rewriteDefault(
                compiledScript.content,
                COMP_IDENTIFIER,
                expressionPlugins
                )
            if ((descriptor.script || descriptor.scriptSetup)?.lang === 'ts') {
                code = transformTS(code)
            }
            return {code, bindings:compiledScript.bindings}
        }catch(e){
            throw new CompileError(e.stack.split('\n').slice(0, 12).join('\n'))
        }
        
    }else{
        return {code:`\nconst ${COMP_IDENTIFIER} = {}`}
    }
}
function doCompileTemplate(
    compilerOptions:CompilerOptions,
    descriptor: SFCDescriptor,
    id:string,
    bindingMetadata:BindingMetadata | undefined,
    isTS:boolean
): string {
    const templateResult = compileTemplate({
      isProd:true,
      source: descriptor.template!.content,
      filename: descriptor.filename,
      id,
      scoped: descriptor.styles.some((s) => s.scoped),
      slotted: descriptor.slotted,
      ssr:false,
      ssrCssVars: descriptor.cssVars,
      compilerOptions: {        
        bindingMetadata,
        expressionPlugins: isTS ? ['typescript'] : undefined,
        ...compilerOptions
      }
    })
    if (templateResult.errors.length) {
        throw new CompileError(templateResult.errors)
    }
  
    const fnName = `render`
  
    let code =
      `\n${templateResult.code.replace(
        /\nexport (function|const) (render|ssrRender)/,
        `$1 ${fnName}`
      )}` + `\n${COMP_IDENTIFIER}.${fnName} = ${fnName}`
  
    if ((descriptor.script || descriptor.scriptSetup)?.lang === 'ts') {
      code = transformTS(code)
    }
    return code
  }

  function transformTS(src:string) {
    return transform(src, {
      transforms: ['typescript']
    }).code
  }

  export function compileWithCss(filename:string,runtimeModuleName:string,content:string): CompileResult{
    const compiled = compile(filename,runtimeModuleName,content);
    if(compiled.css){
        let js = compiled.js ? compiled.js+'\n' : '';
        js += `
const _styleElement = document.createElement('style');
_styleElement.id = ${JSON.stringify('data-v-'+compiled.id)};
_styleElement.innerHTML = ${JSON.stringify(compiled.css)};
document.head.appendChild(_styleElement)
        `.trim()
        compiled.js = js;
    }
    return compiled;
  }