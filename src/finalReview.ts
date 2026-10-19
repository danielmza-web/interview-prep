import type {RecordRow,Practice,Section} from './types';
// References only: every answer continues to come from its editable private record.
export const reviewGroups:Record<string,{title:string;instruction:string;codes:string[]}[]>={
 'review-foundations':[
  {title:'Architecture and robots',instruction:'Explain who requests, assigns and performs a mission, and which confirmation proves completion.',codes:['t01','t02','t03']},
  {title:'Containers, scope and a safe release',instruction:'Compare the tools first; then describe a release and one recovery check. Helm is included here so its role is clear.',codes:['t04','t06','t08','t09','t05','t10']},
  {title:'Requests and messages',instruction:'Follow a timeout without creating a duplicate mission, then explain live versus retained messages.',codes:['t14','t36','t19','t20']},
  {title:'Data and evidence',instruction:'Name the evidence you would query, the metric denominator and how you would verify a suspected cause.',codes:['t22','t23','t24']},
  {title:'Diagnosis and incident response',instruction:'Separate the symptom from the cause; explain containment, escalation, recovery and verification.',codes:['t11','t26']},
 ],
 'review-profile':[
  {title:'Introduction, motivation and direction',instruction:'Start with your introduction. Practise a clear reason for the move and a realistic direction for the next five years.',codes:['b01','b02','b03','b04','b21']},
  {title:'What you offer and what you are developing',instruction:'Support a strength with evidence. Explain your development area and experience boundary honestly.',codes:['b05','b06','b07','b08']},
  {title:'Learning, feedback and communication',instruction:'Explain how you learn, respond to feedback and make technical issues understandable to Operations.',codes:['b17','b18','b15']},
  {title:'Joining the team and your questions',instruction:'Prepare your first-90-days approach and two questions to ask. Discuss support, travel and on-call expectations without assuming the conditions.',codes:['b22','b16','b27','b29']},
 ],
 'review-cases':[
  {title:'Ownership, independence and mentoring',instruction:'Use the three stories above. Name your contribution, the teams involved, the result and any remaining work.',codes:['b14','b23','b24','b20']},
  {title:'Mistakes, disagreement and deadlines',instruction:'Practise each circumstance explicitly. Distinguish management disagreement from a disagreement with another team; avoid claiming an unverified outcome.',codes:['b10','b11','b12','b13']},
  {title:'Problem solving and improvement',instruction:'Choose the closest real example. If the cause is unknown, describe how you collect evidence and escalate.',codes:['b09','b19','b25']},
 ],
};
export const finalSteps=[
 {id:'review-foundations',title:'Technical foundations',minutes:60,goal:'Understand the system, then practise its essential interview answers.'},
 {id:'review-profile',title:'Introduction and personal answers',minutes:25,goal:'Prepare your introduction, direction, strengths and expectations.'},
 {id:'review-cases',title:'Stories and difficult situations',minutes:25,goal:'Use three real stories to answer ownership, coordination and difficult situations.'},
 {id:'review-mock',title:'Mock interview',minutes:30,goal:'Speak for twenty minutes; check and repeat weak answers for ten.'},
].map(step=>({...step,questions:(reviewGroups[step.id]||[]).flatMap(g=>g.codes)}));
export const qaTopics=[
 {id:'qa-about-me',title:'About me and direction',codes:'b01 b02 b03 b04 b05 b06 b07 b08 b21'},
 {id:'qa-cases',title:'Cases and difficult situations',codes:'b09 b10 b11 b12 b13 b14 b19 b23 b24 b25'},
 {id:'qa-communication',title:'Communication, learning and mentoring',codes:'b15 b17 b18 b20'},
 {id:'qa-role',title:'Role, expectations and my questions',codes:'b16 b22 b26 b27 b28 b29'},
 {id:'qa-architecture',title:'Architecture and robots',codes:'t01 t02 t03 t17 t29'},
 {id:'qa-networks',title:'Networks and APIs',codes:'t12 t13 t14 t15 t16 t21 t36'},
 {id:'qa-deployments',title:'Deployments and code',codes:'t04 t05 t06 t07 t08 t09 t10 t30 t31 t32 t33 t34'},
 {id:'qa-messaging',title:'Messaging',codes:'t18 t19 t20'},
 {id:'qa-evidence',title:'SQL and observability',codes:'t22 t23 t24 t25 t35'},
 {id:'qa-incidents',title:'Incidents and diagnosis',codes:'t11 t26 t27 t28 t37'},
];
export const questionId=(code:string)=>`question-${code[0]}-${code.slice(1)}`;
export function topicFor(id:string){return qaTopics.find(t=>t.codes.split(' ').map(questionId).includes(id));}
export function finalResume(rows:RecordRow[]){if(finalSteps.every(s=>(rows.find(r=>r.id==='practice_'+s.id)?.payload as Practice|undefined)?.completed))return 'rapid-review';const saved=(rows.find(r=>r.id==='practice_final_review')?.payload as Practice|undefined)?.resumeSectionId;return finalSteps.some(s=>s.id===saved)?saved!:finalSteps.find(s=>!(rows.find(r=>r.id==='practice_'+s.id)?.payload as Practice|undefined)?.completed)?.id||'review-mock';}
export function reviewSection(id:string):Section|undefined {const step=finalSteps.find(s=>s.id===id);if(!step||id==='review-foundations')return;return {kind:'section',title:step.title,subtitle:step.goal,area:'Interview Practice',order:0,body:'',core:false,minutes:step.minutes,archived:false,questionIds:step.questions.map(questionId)};}
