export const areas = ['Start here','Learn','Interview Practice','Reference','My Experience'] as const;
export type Area = typeof areas[number];
export interface GlossaryTerm {id:string;term:string;aliases:string[];definition:string;purpose:string;example:string;}
export function validGlossary(value:unknown):value is GlossaryTerm[]{
 if(!Array.isArray(value)||value.length>240)return false;const ids=new Set<string>();return value.every(t=>{if(!t||typeof t!=='object'||typeof t.id!=='string'||!/^term-[a-z0-9-]{1,90}$/.test(t.id)||ids.has(t.id))return false;ids.add(t.id);return typeof t.term==='string'&&t.term.length>0&&t.term.length<=100&&Array.isArray(t.aliases)&&t.aliases.length<=8&&t.aliases.every((a:unknown)=>typeof a==='string'&&a.length>0&&a.length<=100)&&['definition','purpose','example'].every(k=>typeof t[k]==='string'&&t[k].length<=1200)&&[t.definition,t.purpose,t.example].join(' ').trim().split(/\s+/).length<=100;});
}
export interface Section { kind:'section'; glossaryTerms?:GlossaryTerm[]; title:string; subtitle:string; area:Area; order:number; body:string; core:boolean; minutes:number; archived:boolean; printOrder?:number; answer?:string; source?:string; links?:string[]; printBody?:string; deepBody?:string; questionIds?:string[]; questionPriority?:'Prepare first'|'Follow-up questions'|'Specific topics and role details'; questionTopic?:string; }
export interface Practice { kind:'practice'; note:string; response:string; completed:boolean; resumeSectionId?:string; }
export type Payload = Section | Practice;
export interface RecordRow { id:string; payload:Payload; version:number; updated_at:string; }
export interface Draft { payload:Payload; expected:number; stamp:string; }
export interface Backup { format:'fieldnotes'; schema:1; exported_at:string; records:RecordRow[]; }
export function isSection(p:Payload): p is Section {return p.kind==='section';}
export function validatePayload(p:unknown):p is Payload {
 if(!p || typeof p!=='object')return false; const v=p as Record<string,unknown>;
 if(v.kind==='practice')return typeof v.note==='string' && typeof v.response==='string' && typeof v.completed==='boolean' && (v.resumeSectionId===undefined || typeof v.resumeSectionId==='string' && /^[a-z0-9][a-z0-9_-]{0,119}$/.test(v.resumeSectionId));
 return v.kind==='section' && (v.glossaryTerms===undefined||validGlossary(v.glossaryTerms)) && typeof v.title==='string' && v.title.length>0 && v.title.length<=250 && typeof v.subtitle==='string' && areas.includes(v.area as Area) && typeof v.body==='string' && typeof v.order==='number' && Number.isFinite(v.order) && typeof v.core==='boolean' && typeof v.archived==='boolean' && typeof v.minutes==='number' && Number.isFinite(v.minutes) && v.minutes>=1 && v.minutes<=120 && (v.source===undefined || typeof v.source==='string') && (v.links===undefined || Array.isArray(v.links) && v.links.every(x=>typeof x==='string')) && (v.answer===undefined || typeof v.answer==='string') && (v.printBody===undefined || typeof v.printBody==='string') && (v.deepBody===undefined || typeof v.deepBody==='string') && (v.questionTopic===undefined || typeof v.questionTopic==='string' && v.questionTopic.length<=120) && (v.questionPriority===undefined || ['Prepare first','Follow-up questions','Specific topics and role details'].includes(v.questionPriority as string)) && (v.questionIds===undefined || Array.isArray(v.questionIds) && v.questionIds.length<=66 && new Set(v.questionIds).size===v.questionIds.length && v.questionIds.every(x=>typeof x==='string' && /^question-[bt]-\d{2}$/.test(x))) && (v.printOrder===undefined || typeof v.printOrder==='number' && Number.isFinite(v.printOrder));
}
export function parseBackup(text:string):RecordRow[]{
 if(text.length>25_000_000)throw Error('This file is too large.');
 const d=JSON.parse(text) as Backup;
 if(d.format!=='fieldnotes'||d.schema!==1||!Array.isArray(d.records)||d.records.length>1500)throw Error('Choose a Fieldnotes backup (version 1).');
 const ids=new Set<string>();
 for(const r of d.records){if(!r||typeof r.id!=='string'||!r.id.match(/^[a-z0-9][a-z0-9_-]{0,119}$/)||ids.has(r.id)||!validatePayload(r.payload))throw Error('The file contains an invalid or repeated section. Nothing has been imported.');ids.add(r.id);}
 return d.records;
}
export function backup(rows:RecordRow[]):Backup{return {format:'fieldnotes',schema:1,exported_at:new Date().toISOString(),records:rows};}
export function resolveDraft(remote:RecordRow|undefined,draft:Draft):'save'|'already-saved'|'conflict'{
 if(remote&&JSON.stringify(remote.payload)===JSON.stringify(draft.payload))return 'already-saved';
 return (remote?.version||0)===draft.expected?'save':'conflict';
}
