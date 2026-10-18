export const codeLanguages={plaintext:'Text',go:'Go',cpp:'C++',python:'Python',sql:'SQL',json:'JSON',yaml:'YAML',powershell:'PowerShell',bash:'Bash',dockerfile:'Dockerfile',http:'HTTP'} as const;
export type CodeLanguage=keyof typeof codeLanguages;
export function isCodeLanguage(value:unknown):value is CodeLanguage{return typeof value==='string'&&Object.hasOwn(codeLanguages,value);}
export function codeLanguage(el:Element):CodeLanguage{const name=Array.from(el.classList).find(c=>c.startsWith('language-'))?.slice(9);return isCodeLanguage(name)?name:'plaintext';}
