import type {RecordRow,Practice,Section} from './types';
export const finalSteps=[
 {id:'review-profile',title:'Introduction and personal answers',minutes:25,goal:'Say your introduction, motivation, strengths, development area, five-year direction and experience boundary.',questions:['b01','b02','b03','b06','b07','b04','b08','b05']},
 {id:'review-cases',title:'Stories and difficult situations',minutes:25,goal:'Rehearse your three main stories, then practise a mistake, management disagreement, deadline and independent work.',questions:['b14','b20','b10','b11','b12','b23','b24']},
 {id:'review-foundations',title:'Technical foundations',minutes:60,goal:'Follow the mission, release, telemetry and failure flows; explain what each component does and what confirms success.',questions:[]},
 {id:'review-mock',title:'Technical questions and mock interview',minutes:30,goal:'Spend ten minutes on technical questions and twenty minutes speaking as in the real call.',questions:['t01','t03','t04','t05','t10','t11','t14','t19','t22','t24','t26','b29']},
];
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
