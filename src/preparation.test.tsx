// @vitest-environment jsdom
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {cloudStore} from './store';
import {Workspace} from './App';
import {route,routeNeighbours,resumeId,resolveId,priorities,questions} from './preparation';
import {validatePayload,parseBackup,backup} from './types';
import type {RecordRow,Section} from './types';
const section:Section={kind:'section',title:'Lesson',subtitle:'Study',area:'Learn',order:1,body:'<p>Full explanation.</p>',core:false,minutes:15,archived:false};
const row=(id:string,payload:RecordRow['payload']=section):RecordRow=>({id,payload,version:1,updated_at:'2026-10-17'});
beforeEach(()=>{Element.prototype.scrollIntoView=()=>{};localStorage.clear();window.history.replaceState(null,'','#start');Object.defineProperty(navigator,'onLine',{value:true,configurable:true});});
afterEach(cleanup);
it('follows all four sessions deterministically regardless of record order',()=>{
 expect(routeNeighbours('learn-delivery')).toEqual(['learn-network','learn-messaging']);
 expect(routeNeighbours('learn-incidents')[1]).toBe('lab-guided');
 expect(routeNeighbours('lab-guided')[1]).toBe('practice-profile');
 expect(routeNeighbours('interview-qa')[1]).toBe('rapid-review');
 expect(new Set(route).size).toBe(route.length);
});
it('resumes from the saved position and tolerates old backups without it',()=>{
 expect(resumeId([row('practice_route',{kind:'practice',note:'',response:'',completed:false,resumeSectionId:'lab-guided'})])).toBe('lab-guided');
 expect(resumeId([])).toBe('learn-system');
 expect(resolveId('ref-k8s-deep')).toBe('learn-delivery');
 expect(resolveId('ref-question-bank')).toBe('interview-qa');
});
it('groups old question backups without optional priority fields into 24/30/12',()=>{const rows=[...Array.from({length:29},(_,i)=>row('question-b-'+String(i+1).padStart(2,'0'))),...Array.from({length:37},(_,i)=>row('question-t-'+String(i+1).padStart(2,'0')))];expect(priorities.map(p=>questions(rows,p).length)).toEqual([24,30,12]);});
it('validates optional metadata and keeps schema one backups compatible',()=>{
 const p={...section,printBody:'<p>Short edition</p>',questionIds:['question-t-01'],questionPriority:'Prepare first',questionTopic:'Architecture'};
 expect(parseBackup(JSON.stringify(backup([row('learn-system',p as Section)])))[0].payload).toEqual(p);
 for(const invalid of [{questionPriority:'90% likely'},{questionIds:['question-t-01','question-t-01']},{questionTopic:123},{printBody:[]},{printOrder:'first'}])expect(validatePayload({...p,...invalid})).toBe(false);
 expect(validatePayload({kind:'practice',note:'',response:'',completed:false,resumeSectionId:'../../oops'})).toBe(false);
});
it('renders 66 visible answers in 24/30/12 groups and keeps administration secondary',async()=>{
 const qs=Array.from({length:66},(_,i)=>row('question-'+(i<29?'b-'+String(i+1).padStart(2,'0'):'t-'+String(i-28).padStart(2,'0')),{...section,area:'Reference',title:'Question '+i,answer:'<p>Visible answer '+i+'</p>',questionPriority:priorities[i<24?0:i<54?1:2],questionTopic:i%2?'Architecture':'Experience'}));
 localStorage.setItem('fieldnotes-preview-ui',JSON.stringify([row('start',{...section,area:'Start here',title:'Your preparation'}),...qs]));
 render(<Workspace owner="ui" preview onExit={()=>{}}/>);
 await screen.findByText('Four sessions. One connected route.');
 fireEvent.click(screen.getByRole('button',{name:'Interview Q&A'}));
 await screen.findByRole('heading',{name:'Interview Q&A'});
 expect(screen.getAllByText(/^Visible answer /)).toHaveLength(66);
 expect(screen.getByRole('link',{name:'Prepare first (24)'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Follow-up questions (30)'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Specific topics and role details (12)'})).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Import'})).toBeNull();
 fireEvent.click(screen.getByLabelText('Hide answers to practise'));
 expect(screen.getAllByText('Show answer')).toHaveLength(66);
 await waitFor(()=>expect(localStorage.getItem('fieldnotes-drafts-ui')).toContain('interview-qa'));
});
it('reuses a question answer inside Learn and opens the same editable record',async()=>{
 window.history.replaceState(null,'','#learn-system');
 const q=row('question-t-01',{...section,title:'Canonical question',answer:'<p>One shared answer</p>'});
 localStorage.setItem('fieldnotes-preview-ui',JSON.stringify([row('learn-system',{...section,questionIds:[q.id]}),q]));
 render(<Workspace owner="ui" preview onExit={()=>{}}/>);
 await screen.findByText('One shared answer');
 fireEvent.click(screen.getByRole('button',{name:'Edit / notes'}));
 expect(await screen.findByRole('heading',{name:'Canonical question'})).toBeTruthy();
 expect(screen.getByText('One shared answer')).toBeTruthy();
});

it('does not show an empty question bank while the private backend is still loading',()=>{
 window.history.replaceState(null,'','#interview-qa');
 const spy=vi.spyOn(cloudStore,'list').mockImplementation(()=>new Promise(()=>{}));
 render(<Workspace owner="waiting" preview={false} onExit={()=>{}}/>);
 expect(screen.getByRole('heading',{name:'Connecting to your workspace…'})).toBeTruthy();
 expect(screen.queryByText('Prepare first (0)')).toBeNull();
 spy.mockRestore();
});
