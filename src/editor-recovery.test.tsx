// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
vi.mock('./Editor',()=>{throw Error('Failed to fetch dynamically imported module');});
import {Workspace} from './App';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('retains the workspace and notes when a stale or disconnected tab cannot load the editor',async()=>{
 localStorage.clear();Element.prototype.scrollIntoView=()=>{};window.history.replaceState(null,'','#learn-system');
 localStorage.setItem('fieldnotes-preview-recovery',JSON.stringify([{id:'learn-system',payload:{kind:'section',title:'My lesson',subtitle:'Saved content',area:'Learn',order:1,body:'<p>Saved explanation.</p>',core:false,minutes:20,archived:false},version:1,updated_at:'2026-10-18'},{id:'practice_learn-system',payload:{kind:'practice',note:'Keep my note',response:'',completed:false},version:1,updated_at:'2026-10-18'}]));
 vi.spyOn(console,'error').mockImplementation(()=>{});
 render(<Workspace owner="recovery" preview onExit={()=>{}}/>);await screen.findByRole('heading',{name:'My lesson'});fireEvent.click(screen.getByRole('button',{name:/^Edit$/}));
 expect(await screen.findAllByText('The editor could not load.',{},{timeout:5000})).not.toHaveLength(0);
 expect(screen.getByRole('textbox',{name:'Section title'})).toBeTruthy();expect((screen.getByRole('textbox',{name:'Personal notes'}) as HTMLTextAreaElement).value).toBe('Keep my note');expect(screen.getAllByRole('button',{name:'Reload the workspace'}).length).toBeGreaterThan(0);
});
