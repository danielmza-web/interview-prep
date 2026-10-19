// @vitest-environment jsdom
import {afterEach,beforeEach,it,expect} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,within} from '@testing-library/react';
import {Editor as CoreEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {DiagramNode} from './DiagramNode';
import {diagramPlaceholder,diagrams,diagramHTML} from './diagrams';
import {safe,study,text,markdown} from './safe';
import {backup,parseBackup,type RecordRow,type Section} from './types';
import {Workspace} from './App';
const base:Section={kind:'section',title:'First lesson',subtitle:'A scope example',area:'Learn',order:1,body:'<p>Core explanation.</p>'+diagramPlaceholder('cluster-v1')+'<p>Editable caption.</p>',deepBody:'<p>Extra detail.</p>',core:false,minutes:20,archived:false};
const row=(id:string,p:Partial<Section>={}):RecordRow=>({id,payload:{...base,...p},version:1,updated_at:'2026-10-18'});
beforeEach(()=>{localStorage.clear();sessionStorage.clear();Element.prototype.scrollIntoView=()=>{};window.history.replaceState(null,'','#learn-system');Object.defineProperty(navigator,'onLine',{value:true,configurable:true});});
afterEach(cleanup);
it('accepts only known placeholders and never imported executable graphics',()=>{
 const content=safe('<div data-study-diagram="cluster-v1"><svg onload="bad()"></svg></div><div data-study-diagram="unknown"><p>Useful fallback.</p></div><svg><script>bad()</script></svg>');
 expect(content).toContain('data-study-diagram="cluster-v1"');expect(content).not.toMatch(/<svg|bad\(|unknown/);expect(content).toContain('Useful fallback.');
 const rendered=study(content);expect(rendered).toContain('role="img"');expect(rendered).toContain('data-rendered-diagram="cluster-v1"');expect(rendered).not.toContain('onload');
});
it('renders all five labelled diagrams with desktop/mobile alternatives and searchable/exportable explanations',()=>{
 for(const id of Object.keys(diagrams) as (keyof typeof diagrams)[]){const h=diagramPlaceholder(id);const content=study(h);expect(content.match(/<svg /g)).toHaveLength(2);expect(content).toContain('diagram-narrow');expect(content).toContain('aria-label');expect(text(h)).toContain(diagrams[id].labels);expect(markdown(h)).toContain(diagrams[id].description);}
});
it('keeps display markup stable across background refreshes and note edits',()=>{expect(diagramHTML('cluster-v1')).toBe(diagramHTML('cluster-v1'));const h=diagramPlaceholder('single-host-v1');expect(study(h)).toBe(study(h));});
it('keeps diagrams in schema-1 backups, rich text edits and editor reloads',()=>{
 const r=row('learn-system');expect(parseBackup(JSON.stringify(backup([r])))[0].payload).toEqual(r.payload);
 const editor=new CoreEditor({element:document.createElement('div'),extensions:[StarterKit,DiagramNode],content:safe(base.body)});
 editor.commands.insertContentAt(editor.state.doc.content.size,'<p>Changed caption.</p>');const saved=editor.getHTML();expect(saved).toContain('data-study-diagram="cluster-v1"');expect(saved).toContain('Changed caption.');editor.commands.setContent(safe(saved));expect(editor.getHTML()).toContain('data-study-diagram="cluster-v1"');editor.destroy();
});
it('finds diagram labels through workspace search',async()=>{
 localStorage.setItem('fieldnotes-preview-visual',JSON.stringify([row('learn-system')]));render(<Workspace owner="visual" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'First lesson'});
 fireEvent.change(screen.getByRole('textbox',{name:'Search your workspace'}),{target:{value:'control plane'}});expect(screen.getByRole('heading',{name:'1 result'})).toBeTruthy();
});
it('keeps navigation separate from explicit progress, preserves notes and allows unmarking',async()=>{
 const records=[row('learn-system'),row('learn-network',{title:'Second lesson',order:2}),{id:'practice_learn-system',payload:{kind:'practice',note:'Keep this note',response:'',completed:false},version:1,updated_at:'2026-10-18'}];
 localStorage.setItem('fieldnotes-preview-progress',JSON.stringify(records));render(<Workspace owner="progress" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'First lesson'});
 expect(screen.getByText('0/4')).toBeTruthy();fireEvent.click(within(screen.getByRole('banner')).getByRole('button',{name:/^Next$/}));await screen.findByRole('heading',{name:'Second lesson'});expect(screen.getByText('0/4')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Resources and tools'}));fireEvent.click(screen.getByRole('button',{name:/^First lesson$/}));fireEvent.click(screen.getByRole('button',{name:/Mark reviewed and continue/}));await screen.findByRole('heading',{name:'Second lesson'});expect(screen.getByText('0/4')).toBeTruthy();
 await waitFor(()=>expect(localStorage.getItem('fieldnotes-preview-progress')).toContain('"completed":true'),{timeout:3500});expect(localStorage.getItem('fieldnotes-preview-progress')).toContain('Keep this note');
 if(!screen.queryByRole('button',{name:/^First lesson$/}))fireEvent.click(screen.getByRole('button',{name:'Resources and tools'}));fireEvent.click(screen.getByRole('button',{name:/^First lesson$/}));fireEvent.click(screen.getByRole('checkbox',{name:'Reviewed and understood'}));expect(screen.getByText('0/4')).toBeTruthy();
});
it('uses practised wording and marks the final route section without needing a next page',async()=>{
 window.history.replaceState(null,'','#practice-stories');localStorage.setItem('fieldnotes-preview-practise',JSON.stringify([row('practice-stories',{title:'Practice lesson',area:'Interview Practice'})]));render(<Workspace owner="practise" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'Practice lesson'});fireEvent.click(screen.getByRole('button',{name:/^Mark practised/}));expect((screen.getByRole('checkbox',{name:'Practised aloud'}) as HTMLInputElement).checked).toBe(true);
});
it('shows a diagram in history and restores the placeholder with its caption',async()=>{
 localStorage.setItem('fieldnotes-preview-history',JSON.stringify([row('learn-system',{body:'<p>Current text.</p>'})]));localStorage.setItem('fieldnotes-preview-history-history-learn-system',JSON.stringify([row('learn-system')]));render(<Workspace owner="history" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'First lesson'});fireEvent.click(screen.getByText('Section tools and history'));fireEvent.click(screen.getByRole('button',{name:'Version history'}));const dialog=await screen.findByRole('dialog',{name:'Version history'});expect(dialog.querySelector('[data-rendered-diagram="cluster-v1"]')).toBeTruthy();fireEvent.click(within(dialog).getByRole('button',{name:'Restore this version'}));await waitFor(()=>expect(localStorage.getItem('fieldnotes-drafts-history')).toContain('data-study-diagram'));expect(screen.getByText('Editable caption.')).toBeTruthy();
});
