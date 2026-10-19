import type {RecordRow,Section} from './types';
import {finalSteps,reviewSection,questionId} from './finalReview';
import {text} from './safe';
type SearchResult={row:RecordRow;area:string;showDeep:boolean};
export function searchWorkspace(rows:RecordRow[],query:string,archived=false):SearchResult[]{
 const needle=query.trim().toLowerCase();if(!needle)return [];
 const base:Section={kind:'section',title:'',subtitle:'',body:'',area:'Start here',order:0,minutes:140,core:false,archived:false};
 const synthetic=(id:string,payload:Section):RecordRow=>({id,payload,version:0,updated_at:''});
 const start=rows.find(r=>r.id==='start');
 const home=synthetic('start',{...base,title:'Final interview preparation',subtitle:'Four guided blocks · 2 hours 20 minutes · interview-day recap: 10 minutes.'});
 const full=synthetic('full-course',{...base,title:'Full four-session course',subtitle:'Optional extended course · 4 hours 30 minutes, including Fleet-Lab.',body:(start?.payload as Section|undefined)?.body||''});
 const review=finalSteps.filter(s=>rows.some(r=>r.id==='review-foundations')).map(s=>{
  const original=rows.find(r=>r.id===s.id),p=reviewSection(s.id)||(original?.payload as Section)||base;
  return synthetic(s.id,{...p,title:s.title,subtitle:s.goal,body:p.body||''});
 });
 const ids=new Set(['start',...finalSteps.map(s=>s.id)]);
 const candidates=archived?rows:[home,...review,...rows.filter(r=>!ids.has(r.id)),full];
 return candidates.flatMap(row=>{
  const p=row.payload;if(p.kind!=='section'||p.archived!==archived)return [];
  const step=finalSteps.find(s=>s.id===row.id);
  const answers=step?.questions.map(questionId).map(id=>rows.find(r=>r.id===id)?.payload as Section|undefined).map(q=>q?[q.title,text(q.answer||'')].join(' '):'').join(' ')||'';
  const glossary=p.glossaryTerms?.map(t=>[t.term,...t.aliases,t.definition,t.purpose,t.example].join(' ')).join(' ')||'';
  const main=[p.title,p.subtitle,text(p.body),text(p.answer||''),answers,glossary].join(' ').toLowerCase();
  const deep=text(p.deepBody||'').toLowerCase();
  const area=step||row.id==='start'?'Final review':row.id==='full-course'?'Resources':row.id.startsWith('question-')?'Interview Q&A':row.id==='rapid-review'?'Interview day':row.id==='ref-glossary'?'Glossary':p.area;
  return main.includes(needle)||deep.includes(needle)?[{row,area,showDeep:!main.includes(needle)&&deep.includes(needle)}]:[];
 });
}
