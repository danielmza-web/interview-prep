import {useMemo} from 'react';
import {safe} from './safe';
import {StudyContent} from './Glossary';
import {jumpToReading} from './readingNavigation';
export const foundationQuestionGroups=[0,2,1,1,2,3,3,4];
export const foundationTopics=['Architecture and robots','Networks and APIs','Containers and deployments','Changes and recovery','Messaging','Backend and data','Observability','Diagnosis and coordination'];
export function FoundationContent({html}:{html:string}){
 const parts=useMemo(()=>{
  const root=document.createElement('div');root.innerHTML=safe(html);
  const result:{topic:number;body:string}[]=[{topic:0,body:''}];
  for(const el of [...root.childNodes]){
   const number=el instanceof HTMLElement&&el.tagName==='H2'?el.textContent?.match(/^([1-8])\s*[·.]/)?.[1]:undefined;
   if(number)result.push({topic:Number(number),body:''});
   const copy=document.createElement('div');copy.append(el.cloneNode(true));result.at(-1)!.body+=copy.innerHTML;
  }
  return result;
 },[html]);
 return <section data-outline-part="Understand" className="foundation-explanation"><h2 id="review-understand" data-outline-ignore tabIndex={-1} className="review-part-title">Understand <small>35 minutes</small></h2>{parts.map((p,i)=><section key={i} id={p.topic?'understand-topic-'+p.topic:undefined} data-outline-anchor={p.topic?'understand-topic-'+p.topic:undefined} tabIndex={p.topic?-1:undefined}><StudyContent html={p.body}/>{p.topic>0&&<button className="theory-practice-link" onClick={()=>jumpToReading('review-questions-'+foundationQuestionGroups[p.topic-1])}>Practise the related interview answers ↓</button>}</section>)}</section>;
}
