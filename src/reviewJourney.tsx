import {useRef,useState} from 'react';
import {finalSteps} from './finalReview';
export type JourneyIntent='browse'|'route'|'course';
const validStep=(id:unknown):id is string=>typeof id==='string'&&(id==='rapid-review'||finalSteps.some(s=>s.id===id));
export function readReviewReturn(owner:string,active:string){try{const id=sessionStorage.getItem('fieldnotes-review-return-'+owner);return validStep(id)&&id!==active&&active!=='start'?id:null;}catch{return null;}}
export function useReviewReturn(owner:string,active:string){
 const [returnTo,setReturnTo]=useState<string|null>(()=>readReviewReturn(owner,active));const current=useRef(returnTo);
 const change=(id:string|null)=>{current.current=validStep(id)?id:null;setReturnTo(current.current);try{const key='fieldnotes-review-return-'+owner;if(current.current)sessionStorage.setItem(key,current.current);else sessionStorage.removeItem(key);}catch{/* Session-only state still works when browser storage is unavailable. */}};
 const sync=(id:string)=>{if(id==='start'||id===current.current)change(null);};
 return {returnTo,current,change,sync};
}
export const reviewSupport:Record<string,{ready:string;links:[string,string][]}>={
 'review-profile':{ready:'Continue when you can introduce yourself and explain your motivation, strengths, development area and experience boundary without reading.',links:[['qa-about-me','More personal questions'],['qa-communication','Learning, feedback and mentoring'],['experience-career','Check career details']]},
 'review-cases':{ready:'Continue when you can tell each main story with your own actions, a verified result and what remained pending, then answer one difficult follow-up.',links:[['qa-cases','More cases and difficult situations'],['practice-stories','Complete story rehearsal and memory prompts'],['experience-new-vehicle','Details of the new-vehicle example'],['experience-biw','Details of the BIW example'],['experience-thesis','Details of the thesis example']]},
 'review-foundations':{ready:'Continue when you can follow a mission and a code change, place the technologies correctly and explain what you would check after a failure.',links:[['learn-system','Learn: architecture and robots'],['learn-network','Learn: networks and APIs'],['learn-delivery','Learn: deployments and code'],['learn-messaging','Learn: messaging'],['learn-evidence','Learn: SQL and observability'],['learn-incidents','Learn: incidents'],['qa-architecture','More technical interview questions']]},
 'review-mock':{ready:'Finish when you have spoken through the twenty-minute mock and identified the two points to revisit before the call.',links:[['qa-about-me','Personal answers used in the mock'],['qa-cases','Story and management follow-ups'],['qa-architecture','Technical questions used in the mock'],['qa-role','Your questions for the interviewer']]},
};
export function ReviewSupport({id,onBrowse}:{id:string;onBrowse:(id:string)=>void}){const s=reviewSupport[id];return s?<section className="review-support"><h2>When you can continue</h2><p>{s.ready} The suggested time is a guide, not an exam or a requirement to memorise every answer.</p><details><summary>If you need more · optional</summary><p>Choose only the extra help you need. It is part of the same workspace; you do not need to complete another bank or course.</p><div className="support-links">{s.links.map(([id,title])=><button key={id} onClick={()=>onBrowse(id)}>{title} →</button>)}</div></details></section>:null;}
