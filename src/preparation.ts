import type {RecordRow, Section, Practice} from './types';
export const route = ['start','learn-system','learn-network','learn-delivery','learn-messaging','learn-evidence','learn-incidents','lab-guided','practice-profile','practice-stories','practice-technical','practice-feedback','interview-qa','rapid-review'];
export const sessions = [
 {title:'1 · Follow a mission',minutes:75,goal:'Understand the architecture, requests and deployment behind one factory delivery.',ids:route.slice(1,4)},
 {title:'2 · Diagnose the system',minutes:70,goal:'Connect messages, data and incident decisions to the same delivery.',ids:route.slice(4,7)},
 {title:'3 · Practise in Fleet-Lab',minutes:60,goal:'Complete the six local stages, then record what you observed here.',ids:['lab-guided']},
 {title:'4 · Rehearse the interview',minutes:65,goal:'Explain your background, three stories and priority answers aloud.',ids:route.slice(8,13)},
];
export const aliases:Record<string,string> = {
 'practice-feedback':'qa-role','practice-profile':'qa-about-me','practice-technical':'qa-architecture','ref-ask':'qa-role','ref-question-bank':'interview-qa','ref-distributed-deep':'learn-system','ref-robotics-deep':'learn-system',
 'ref-api-deep':'learn-network','ref-net-deep':'learn-network','ref-docker-deep':'learn-delivery',
 'ref-k8s-deep':'learn-delivery','ref-code-deep':'learn-delivery','ref-messaging-deep':'learn-messaging',
 'ref-sql-deep':'learn-evidence','ref-ops-deep':'learn-incidents','ref-people-deep':'learn-incidents',
 'ref-scenarios':'learn-incidents','ref-lab-current':'lab-guided'
};
export const priorities = ['Prepare first','Follow-up questions','Specific topics and role details'] as const;
export type Priority = typeof priorities[number];
export function category(id:string,s:Section):string {
 if(id==='start'||id==='rapid-review'||id==='lab-guided')return 'Your route';
 if(id==='interview-qa'||id.startsWith('question-')||s.area==='Interview Practice')return 'Interview Q&A';
 if(s.area==='Learn'||s.area==='My Experience')return s.area;
 return 'Resources';
}
export function resolveId(id:string){return aliases[id]||id;}
export function hashId(hash:string){try{return decodeURIComponent(hash.replace(/^#/,''))||'start';}catch{return 'start';}}
export function availableRoute(rows:RecordRow[]){return route.filter(id=>id==='start'||id==='interview-qa'&&rows.some(r=>r.id.startsWith('question-')&&r.payload.kind==='section'&&!r.payload.archived)||rows.some(r=>r.id===id&&r.payload.kind==='section'&&!r.payload.archived));}
export function resumeId(rows:RecordRow[]):string {
 const active=availableRoute(rows);
 const saved=rows.find(r=>r.id==='practice_route')?.payload as Practice|undefined;
 if(saved?.resumeSectionId&&active.includes(saved.resumeSectionId))return saved.resumeSectionId;
 return active.slice(1).find(id=>!rows.some(r=>r.id==='practice_'+id&&(r.payload as Practice).completed))||'start';
}
export function routeNeighbours(id:string,rows?:RecordRow[]):[string|undefined,string|undefined]{
 const current=rows?availableRoute(rows):route;
 const i=current.indexOf(resolveId(id));return i<0?['start','interview-qa']:[current[i-1],current[i+1]];
}
const topicOrder=['Background and motivation','Ownership and coordination','Learning feedback and mentoring','Questions for the interviewer','Architecture and robots','Networks APIs and retries','Containers deployment and code','Messaging','SQL and observability','Incidents and diagnosis'];
const firstIds=new Set('b01 b02 b03 b05 b06 b07 b08 b10 b11 b14 b20 b29 t01 t03 t04 t05 t10 t11 t14 t22 t23 t24 t26 t36'.split(' '));
const specificIds=new Set('b26 b28 t07 t08 t16 t21 t30 t31 t32 t33 t34 t35'.split(' '));
export function priorityFor(id:string,s:Section):Priority {const code=id.replace('question-','').replace('-','');return s.questionPriority||(firstIds.has(code)?priorities[0]:specificIds.has(code)?priorities[2]:priorities[1]);}
export function questions(rows:RecordRow[],priority?:Priority):RecordRow[]{
 return rows.filter(r=>r.id.startsWith('question-')&&r.payload.kind==='section'&&!r.payload.archived&&(!priority||priorityFor(r.id,r.payload)===priority))
 .sort((a,b)=>(topicOrder.indexOf((a.payload as Section).questionTopic||'')<0?999:topicOrder.indexOf((a.payload as Section).questionTopic||''))-(topicOrder.indexOf((b.payload as Section).questionTopic||'')<0?999:topicOrder.indexOf((b.payload as Section).questionTopic||''))||a.id.localeCompare(b.id));
}
