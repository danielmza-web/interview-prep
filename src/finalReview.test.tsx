// @vitest-environment jsdom
import {afterEach,beforeEach,it,expect} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,within} from '@testing-library/react';
import {Workspace} from './App';
import {finalSteps,finalResume,qaTopics,questionId,topicFor} from './finalReview';
import {priorities,questions,resolveId} from './preparation';
import type {RecordRow,Section,Practice} from './types';
const base:Section={kind:'section',title:'Private section',subtitle:'Description',area:'Reference',order:1,body:'<p>Preserved content.</p>',core:false,minutes:10,archived:false};
const row=(id:string,payload:RecordRow['payload']=base):RecordRow=>({id,payload,version:1,updated_at:'2026-10-19'});
const bank=qaTopics.flatMap(t=>t.codes.split(' ').map(code=>row(questionId(code),{...base,title:code==='b01'?'Introduce yourself':code==='b04'?'Five years':code==='b11'?'Manager disagreement':code==='b12'?'Missed deadline':'Question '+code,answer:'<p>Answer '+code+'</p>',deepBody:code==='b02'?'<p>Optional historical idea.</p>':undefined})));
const seed=(more:RecordRow[]=[])=>localStorage.setItem('fieldnotes-preview-final',JSON.stringify([row('start',{...base,area:'Start here',title:'Original printed title',core:true,printBody:'<p>Original print summary.</p>'}),row('review-foundations',{...base,title:'Technical foundations',body:'<p>Foundation comparison.</p>',deepBody:'<p>Optional foundations.</p>'}),row('rapid-review',{...base,title:'Interview day'}),...bank,...more]));
beforeEach(()=>{localStorage.clear();Element.prototype.scrollIntoView=()=>{};window.history.replaceState(null,'','#start');Object.defineProperty(navigator,'onLine',{value:true,configurable:true});});afterEach(cleanup);
it('covers 66 unique questions once in ten topics, retains priorities and redirects old practice links',()=>{
 expect(bank).toHaveLength(66);expect(new Set(bank.map(r=>r.id)).size).toBe(66);expect(priorities.map(p=>questions(bank,p).length)).toEqual([24,30,12]);
 expect(qaTopics.map(t=>t.codes.split(' ').length)).toEqual([9,10,4,6,5,7,12,3,5,5]);
 expect(topicFor('question-b-04')?.id).toBe('qa-about-me');expect(topicFor('question-b-11')?.id).toBe('qa-cases');expect(resolveId('practice-profile')).toBe('qa-about-me');expect(resolveId('practice-technical')).toBe('qa-architecture');
 expect(finalSteps.reduce((n,s)=>n+s.minutes,0)).toBe(120);
});
it('resumes independently and recovers absent or invalid final positions without using the old course',()=>{
 const old=row('practice_route',{kind:'practice',note:'Earlier note',response:'',completed:false,resumeSectionId:'lab-guided'});
 expect(finalResume([old])).toBe('review-profile');expect(finalResume([old,row('practice_final_review',{kind:'practice',note:'',response:'',completed:false,resumeSectionId:'review-foundations'})])).toBe('review-foundations');
 expect(finalResume([row('practice_final_review',{kind:'practice',note:'',response:'',completed:false,resumeSectionId:'obsolete'})])).toBe('review-profile');
});
it('finds introduction, five years, manager and deadlines within two actions; filters do not create another bank',async()=>{
 seed();render(<Workspace owner="final" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'Final interview preparation'});
 fireEvent.click(screen.getByRole('button',{name:'Interview Q&A'}));await screen.findByText('Answer b01');expect(screen.getAllByText(/^Answer /)).toHaveLength(66);
 fireEvent.click(screen.getByRole('link',{name:'About me and direction (9)'}));expect(screen.getByRole('link',{name:'Five years'})).toBeTruthy();
 fireEvent.click(screen.getByRole('link',{name:'Cases and difficult situations (10)'}));expect(screen.getByRole('link',{name:'Manager disagreement'})).toBeTruthy();expect(screen.getByRole('link',{name:'Missed deadline'})).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Preparation priority'),{target:{value:'Prepare first'}});expect(screen.getAllByText(/^Answer /)).toHaveLength(24);
 fireEvent.change(screen.getByLabelText('Preparation priority'),{target:{value:'All priorities'}});expect(screen.getByText('Optional historical idea.').closest('details')?.open).toBe(false);
});
it('walks all four final blocks, saves completion and resumes without touching old notes or course position',async()=>{
 const old=row('practice_route',{kind:'practice',note:'Original note',response:'Original answer',completed:false,resumeSectionId:'lab-guided'});seed([old]);
 const view=render(<Workspace owner="final" preview onExit={()=>{}}/>);await screen.findByRole('button',{name:'Start final review'});fireEvent.click(screen.getByRole('button',{name:'Start final review'}));
 await screen.findByRole('heading',{name:'Introduction and personal answers'});fireEvent.change(screen.getByLabelText('Personal notes'),{target:{value:'My final note'}});
 fireEvent.click(screen.getByRole('button',{name:/Mark practised and continue/}));await screen.findByRole('heading',{name:'Stories and difficult situations'});expect(screen.getByText('1/4')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Mark practised and continue/}));await screen.findByRole('heading',{name:'Technical foundations'});expect(screen.getByText('Foundation comparison.')).toBeTruthy();
 await waitFor(()=>{const saved=JSON.parse(localStorage.getItem('fieldnotes-preview-final')!);expect((saved.find((r:RecordRow)=>r.id==='practice_final_review').payload as Practice).resumeSectionId).toBe('review-foundations');},{timeout:3500});
 view.unmount();window.history.replaceState(null,'','#start');render(<Workspace owner="final" preview onExit={()=>{}}/>);await screen.findByRole('button',{name:'Continue final review'});fireEvent.click(screen.getByRole('button',{name:'Continue final review'}));await screen.findByRole('heading',{name:'Technical foundations'});
 fireEvent.click(screen.getByRole('button',{name:/Mark reviewed and continue/}));await screen.findByRole('heading',{name:'Technical questions and mock interview'});
 fireEvent.click(screen.getByRole('button',{name:/Mark practised and continue/}));await screen.findByRole('heading',{name:'Interview day'});expect(screen.getByText('4/4')).toBeTruthy();
 await waitFor(()=>expect(JSON.parse(localStorage.getItem('fieldnotes-preview-final')!).find((r:RecordRow)=>r.id==='practice_review-profile')?.payload.note).toBe('My final note'),{timeout:3500});
 expect(JSON.parse(localStorage.getItem('fieldnotes-preview-final')!).find((r:RecordRow)=>r.id==='practice_route')).toEqual(old);
 expect(document.querySelector('.print-document')?.textContent).toContain('Original print summary.');
});
it('opens legacy practice URLs in the matching topic and keeps the optional answer expansion',async()=>{
 seed();window.history.replaceState(null,'','#practice-profile');render(<Workspace owner="final" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'Interview Q&A'});await waitFor(()=>expect(document.activeElement?.id).toBe('qa-about-me'));
 expect(screen.getByText('Optional historical idea.').closest('details')).toBeTruthy();
 fireEvent.click(within(screen.getByRole('navigation',{name:'Main navigation'})).getByRole('button',{name:'Final review'}));await screen.findByRole('heading',{name:'Final interview preparation'});
 expect(screen.queryByRole('button',{name:/Mark reviewed and continue/})).toBeNull();
});
