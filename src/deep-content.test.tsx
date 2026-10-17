// @vitest-environment jsdom
import {beforeEach,afterEach,it,expect} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {Workspace} from './App';
import type {RecordRow,Section} from './types';
const section:Section={kind:'section',title:'Mission lesson',subtitle:'Learn from the beginning',area:'Learn',order:1,body:'<p>Essential visible explanation.</p>',deepBody:'<p>Partition position explained with a worked example.</p>',core:false,minutes:20,archived:false};
const row:RecordRow={id:'learn-system',payload:section,version:2,updated_at:'2026-10-17'};
beforeEach(()=>{localStorage.clear();Element.prototype.scrollIntoView=()=>{};window.history.replaceState(null,'','#learn-system');Object.defineProperty(navigator,'onLine',{value:true,configurable:true});localStorage.setItem('fieldnotes-preview-depth',JSON.stringify([row]));});
afterEach(cleanup);
it('keeps essentials visible and makes optional content searchable and expandable',async()=>{
 render(<Workspace owner="depth" preview onExit={()=>{}}/>);
 await screen.findByText('Essential visible explanation.');
 const detail=screen.getByText('Partition position explained with a worked example.').closest('details')!;
 expect(detail.open).toBe(false);
 fireEvent.click(screen.getByText('More explanation and worked examples · optional'));
 await waitFor(()=>expect(detail.open).toBe(true));
 fireEvent.change(screen.getByRole('textbox',{name:'Search your workspace'}),{target:{value:'Partition position'}});
 expect(screen.getByRole('heading',{name:'1 result'})).toBeTruthy();
 fireEvent.click(screen.getByRole('main').querySelector('button.search-result')!);
 await waitFor(()=>expect(screen.getByText('Partition position explained with a worked example.').closest('details')!.open).toBe(true));
});
it('shows optional content in history and restores it with the record',async()=>{
 localStorage.setItem('fieldnotes-preview-depth-history-learn-system',JSON.stringify([{...row,version:1,payload:{...section,deepBody:'<p>Recovered detailed explanation</p>'}}]));
 render(<Workspace owner="depth" preview onExit={()=>{}}/>);
 await screen.findByText('Essential visible explanation.');
 fireEvent.click(screen.getByText('Section tools and history'));
 fireEvent.click(screen.getByRole('button',{name:'Version history'}));
 const saved=await screen.findByText('Recovered detailed explanation');
 expect(saved.closest('[role="dialog"]')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Restore this version'}));
 await waitFor(()=>expect(localStorage.getItem('fieldnotes-drafts-depth')).toContain('Recovered detailed explanation'));
});
