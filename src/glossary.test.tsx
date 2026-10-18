// @vitest-environment jsdom
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,act,waitFor,within} from '@testing-library/react';
import {annotateTerms,GlossaryProvider,StudyContent,GlossaryEntries} from './Glossary';
import {validGlossary,validatePayload,backup,parseBackup,type Section,type GlossaryTerm,type RecordRow} from './types';
import {Workspace} from './App';
import {groupGlossary} from './glossaryTopics';
const term:GlossaryTerm={id:'term-pod',term:'Pod',aliases:['workload unit'],definition:'A workload unit containing containers.',purpose:'Groups related containers.',example:'One API Pod runs an API replica.'};
const base:Section={kind:'section',title:'Concepts',subtitle:'Read and connect',area:'Learn',order:1,body:'<p>A Pod contains containers. Another Pod.</p>',core:false,minutes:20,archived:false};
const row=(id:string,payload:Section):RecordRow=>({id,payload,version:1,updated_at:'2026-10-18'});
it('groups by stable IDs and keeps custom entries in a discoverable topic',()=>{
 const custom={...term,id:'term-my-custom-concept',term:'Custom'};
 expect(groupGlossary([{...term,term:'Renamed workload unit'},custom]).map(g=>[g.title,g.terms.length])).toEqual([['Containers and deployments',1],['Other concepts',1]]);
});
it('shows compact meanings, opens detail by keyboard and searches every topic',()=>{
 const robot={...term,id:'term-agv',term:'AGV',definition:'A guided vehicle.',purpose:'Move material.',example:'Deliver a pallet.'};
 render(<GlossaryEntries terms={[term,robot]} editing={false} onChange={()=>{}}/>);
 expect(screen.getByLabelText('Topic').getAttribute('value')).toBeNull();
 expect((screen.getByLabelText('Topic') as HTMLSelectElement).value).toBe('robots');
 expect(screen.getByText('A guided vehicle.').closest('details')?.open).toBe(false);
 const summary=screen.getByText('AGV').closest('summary')!;summary.focus();expect(document.activeElement).toBe(summary);
 fireEvent.click(summary);expect(screen.getByText('A guided vehicle.').closest('details')?.open).toBe(true);
 expect(screen.getByText(/Deliver a pallet/)).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Find a term'),{target:{value:'replica'}});
 expect(screen.getByText('Pod')).toBeTruthy();expect(screen.queryByText('AGV')).toBeNull();
 fireEvent.change(screen.getByLabelText('Topic'),{target:{value:'robots'}});expect(screen.getByText('AGV')).toBeTruthy();
});
it('provides sidebar shortcuts and carries workspace search into the compact glossary',async()=>{
 const g={...base,title:'Quick glossary',area:'Reference' as const,body:'<p>Comparison content.</p>',glossaryTerms:[term]};
 localStorage.setItem('fieldnotes-preview-shortcuts',JSON.stringify([row('learn-system',base),row('ref-glossary',g),row('rapid-review',{...base,title:'Day support'})]));
 render(<Workspace owner="shortcuts" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'Concepts'});
 const nav=screen.getByRole('navigation',{name:'Quick access'});
 expect(within(nav).getByRole('button',{name:'Interview day'})).toBeTruthy();
 fireEvent.click(within(nav).getByRole('button',{name:'Glossary'}));await screen.findByRole('heading',{name:'Quick glossary'});
 expect(within(nav).getByRole('button',{name:'Glossary'}).getAttribute('aria-current')).toBe('page');
 expect(screen.getByText('Compare related concepts · optional tables').closest('details')?.open).toBe(false);
 fireEvent.change(screen.getByRole('textbox',{name:'Search your workspace'}),{target:{value:'replica'}});
 fireEvent.click(screen.getByRole('button',{name:/Quick glossary/}));
 expect((screen.getByLabelText('Find a term') as HTMLInputElement).value).toBe('replica');
});
it('explains acronym plurals and full names in comparison cells without partial matches',()=>{
 const agv={...term,id:'term-agv',term:'AGV',aliases:['AGVs','automated guided vehicle','automated guided vehicles']};
 const amr={...term,id:'term-amr',term:'AMR',aliases:['AMRs','autonomous mobile robot']};
 const d=document.createElement('div');
 d.innerHTML=annotateTerms('<p>AGVs and AGV share a category; XAGV is not an acronym.</p><table><tr><td>Automated <strong>guided vehicles</strong></td><td>AMRs</td></tr></table>',[agv,amr]);
 expect([...d.querySelectorAll('button')].map(b=>b.textContent)).toEqual(['AGVs','Automated guided vehicles','AMRs']);
 expect(d.querySelector('p')?.textContent).toBe('AGVs and AGV share a category; XAGV is not an acronym.');
});
beforeEach(()=>{localStorage.clear();window.history.replaceState(null,'','#learn-system');Element.prototype.scrollIntoView=()=>{};Object.defineProperty(navigator,'onLine',{value:true,configurable:true});});
afterEach(()=>{cleanup();vi.useRealTimers();});
function view(html=base.body){return render(<GlossaryProvider terms={[term]} resetKey="lesson"><StudyContent html={html}/></GlossaryProvider>);}
it('validates concise entries and keeps old schema-one backups compatible',()=>{expect(validGlossary([term])).toBe(true);expect(validGlossary(Array.from({length:240},(_,i)=>({...term,id:'term-'+i})))).toBe(true);expect(validGlossary([term,term])).toBe(false);expect(validGlossary([{...term,aliases:[4]}])).toBe(false);expect(validGlossary([{...term,definition:'x '.repeat(101)}])).toBe(false);expect(validGlossary(Array.from({length:241},(_,i)=>({...term,id:'term-'+i})))).toBe(false);expect(validatePayload({...base,glossaryTerms:[term]})).toBe(true);expect(parseBackup(JSON.stringify(backup([row('learn-system',base)])))[0].payload).toEqual(base);expect(parseBackup(JSON.stringify(backup([row('ref-glossary',{...base,glossaryTerms:[term]})])))[0].payload).toEqual({...base,glossaryTerms:[term]});});
it('marks each block including headings and inline code but skips executable blocks and links',()=>{const html=annotateTerms('<h3>Pod</h3><pre>Pod</pre><code>Pod</code><a href="#x">Pod</a><figure>Pod</figure><p>Podium. Pod and Pod.</p>',[term]);const d=document.createElement('div');d.innerHTML=html;expect(d.querySelectorAll('button.term-help')).toHaveLength(3);expect(d.querySelector('p')?.textContent).toBe('Podium. Pod and Pod.');expect(d.querySelector('button')?.textContent).toBe('Pod');});
it('prefers longest contextual names and never evaluates glossary strings as HTML',()=>{const generic={...term,id:'term-service',term:'service',aliases:[]};const specific={...term,id:'term-kubernetes-service',term:'Kubernetes Service',aliases:[]};const d=document.createElement('div');d.innerHTML=annotateTerms('<p>Kubernetes Service then a service.</p>',[generic,specific]);expect([...d.querySelectorAll('button')].map(b=>b.dataset.termId)).toEqual(['term-kubernetes-service','term-service']);render(<GlossaryProvider terms={[{...term,definition:'<img src=x onerror=bad()>'}]} resetKey="x"><StudyContent html="<p>Pod</p>"/></GlossaryProvider>);fireEvent.click(screen.getByRole('button',{name:'Explain Pod'}));expect(screen.getByRole('tooltip').querySelector('img')).toBeNull();expect(screen.getByText('<img src=x onerror=bad()>')).toBeTruthy();});
it('waits 300ms for hover and permits reading over the help without a timeout',()=>{vi.useFakeTimers();view();const b=screen.getByRole('button',{name:'Explain Pod'});fireEvent.pointerOver(b,{pointerType:'mouse'});act(()=>vi.advanceTimersByTime(299));expect(screen.queryByRole('tooltip')).toBeNull();act(()=>vi.advanceTimersByTime(1));const tip=screen.getByRole('tooltip');fireEvent.pointerOut(b,{relatedTarget:tip,pointerType:'mouse'});fireEvent.pointerEnter(tip);act(()=>vi.advanceTimersByTime(10000));expect(screen.getByRole('tooltip')).toBeTruthy();fireEvent.pointerLeave(tip,{pointerType:'mouse'});act(()=>vi.advanceTimersByTime(180));expect(screen.queryByRole('tooltip')).toBeNull();});
it('opens on focus, Escape closes and leaving focus closes',()=>{view();const b=screen.getByRole('button',{name:'Explain Pod'});fireEvent.focus(b);expect(b.getAttribute('aria-describedby')).toBe('term-explanation');fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('tooltip')).toBeNull();fireEvent.blur(b);fireEvent.focus(b);expect(screen.getByRole('tooltip')).toBeTruthy();fireEvent.blur(b);expect(screen.queryByRole('tooltip')).toBeNull();});
it('toggles on touch/click, closes outside and on route change',()=>{const v=view();const b=screen.getByRole('button',{name:'Explain Pod'});fireEvent.pointerDown(b,{pointerType:'touch'});fireEvent.focus(b);expect(screen.queryByRole('tooltip')).toBeNull();fireEvent.click(b);expect(screen.getByRole('tooltip')).toBeTruthy();fireEvent.click(b);expect(screen.queryByRole('tooltip')).toBeNull();fireEvent.click(b);fireEvent.pointerDown(document.body);expect(screen.queryByRole('tooltip')).toBeNull();fireEvent.click(b);v.rerender(<GlossaryProvider terms={[term]} resetKey="next"><StudyContent html={base.body}/></GlossaryProvider>);expect(screen.queryByRole('tooltip')).toBeNull();});
it('never saves generated annotation into source content',()=>{const original=base.body;const html=annotateTerms(original,[term]);expect(html).toContain('term-help');expect(base.body).toBe(original);expect(JSON.stringify(backup([row('learn-system',base)]))).not.toContain('term-help');});
it('keeps help open through an unchanged background refresh',()=>{const v=view();fireEvent.click(screen.getByRole('button',{name:'Explain Pod'}));v.rerender(<GlossaryProvider terms={[{...term,aliases:[...term.aliases]}]} resetKey="lesson"><StudyContent html={base.body}/></GlossaryProvider>);expect(screen.getByRole('tooltip')).toBeTruthy();});
it('edits and searches a shared entry',()=>{const save=vi.fn();render(<GlossaryEntries terms={[term]} editing onChange={save}/>);fireEvent.change(screen.getByLabelText('What it means'),{target:{value:'A clearer definition.'}});expect(save.mock.calls[0][0][0].definition).toBe('A clearer definition.');fireEvent.change(screen.getByLabelText('Find a term'),{target:{value:'replica'}});expect(screen.getByText('1 of 1 concepts. Dotted terms in chapters open these same explanations.')).toBeTruthy();});
it('keeps glossary outside progress, searches definitions and restores its history',async()=>{const g={...base,title:'Quick glossary',area:'Reference' as const,body:'<p>Shared explanations.</p>',glossaryTerms:[term]};localStorage.setItem('fieldnotes-preview-gloss',JSON.stringify([row('learn-system',base),row('ref-glossary',g)]));localStorage.setItem('fieldnotes-preview-gloss-history-ref-glossary',JSON.stringify([row('ref-glossary',{...g,glossaryTerms:[{...term,definition:'Recovered definition.'}]})]));render(<Workspace owner="gloss" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'Concepts'});expect(screen.getByText('0/1')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Explain Pod'}));expect(screen.getByRole('tooltip')).toBeTruthy();fireEvent.change(screen.getByRole('textbox',{name:'Search your workspace'}),{target:{value:'Groups related containers'}});fireEvent.click(screen.getByRole('button',{name:/Quick glossary/}));await screen.findByRole('heading',{name:'Quick glossary'});fireEvent.click(screen.getByText('Section tools and history'));fireEvent.click(screen.getByRole('button',{name:'Version history'}));const dialog=await screen.findByRole('dialog',{name:'Version history'});expect(within(dialog).getByText(/Recovered definition/)).toBeTruthy();fireEvent.click(within(dialog).getByRole('button',{name:'Restore this version'}));await waitFor(()=>expect(localStorage.getItem('fieldnotes-drafts-gloss')).toContain('Recovered definition.'));});
