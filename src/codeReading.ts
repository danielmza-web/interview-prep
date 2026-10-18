import hljs from 'highlight.js/lib/core';
import go from 'highlight.js/lib/languages/go';
import cpp from 'highlight.js/lib/languages/cpp';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import powershell from 'highlight.js/lib/languages/powershell';
import bash from 'highlight.js/lib/languages/bash';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import http from 'highlight.js/lib/languages/http';
import {codeLanguage,codeLanguages} from './codeLanguages';
for(const [name,grammar] of Object.entries({go,cpp,python,sql,json,yaml,powershell,bash,dockerfile,http}))hljs.registerLanguage(name,grammar);
// Caller supplies sanitized study HTML. Only the library-generated token markup is added.
export function highlightCode(html:string){
 const root=document.createElement('div');root.innerHTML=html;
 for(const pre of root.querySelectorAll('pre')){
  let code=pre.firstElementChild as HTMLElement|null;
  if(code?.tagName!=='CODE'||pre.childNodes.length!==1){const source=pre.textContent||'';code=document.createElement('code');code.textContent=source;pre.replaceChildren(code);}
  const language=codeLanguage(code),source=code.textContent||'';pre.dataset.codeLabel=codeLanguages[language];
  if(language==='plaintext'||source.length>100_000){code.textContent=source;continue;}
  try{code.innerHTML=hljs.highlight(source,{language,ignoreIllegals:true}).value;}catch{code.textContent=source;}
 }
 return root.innerHTML;
}
