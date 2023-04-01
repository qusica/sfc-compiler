import {compileWithCss} from '../src/sfc-compiler.ts'

const source = Deno.readTextFileSync('./test/App.vue');
const result = compileWithCss('App.vue','/newjs/vue.js',source)
//console.log(result.js)
//console.log(result.css)