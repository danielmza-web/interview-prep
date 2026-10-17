// @vitest-environment jsdom
import {act,renderHook,waitFor,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import {useWorkspace} from './useWorkspace';
import {ConflictError,draftsFor} from './store';
import type {Store} from './store';
import type {Payload,Practice,RecordRow} from './types';
import {safe} from './safe';
const p:Practice={kind:'practice',note:'original',response:'',completed:false};
function memory(){let rows:RecordRow[]=[];const store:Store={async list(){return structuredClone(rows);},async save(id,payload,version){const current=rows.find(r=>r.id===id);if((current?.version||0)!==version)throw new ConflictError();const row={id,payload,version:version+1,updated_at:new Date().toISOString()};rows=[...rows.filter(r=>r.id!==id),row];return row;},async history(){return [];}};return {store,rows:()=>rows,external:(id:string,payload:Payload,version:number)=>{rows=[...rows.filter(r=>r.id!==id),{id,payload,version,updated_at:'now'}];}};}
beforeEach(()=>{localStorage.clear();Object.defineProperty(navigator,'onLine',{value:true,configurable:true});});
afterEach(()=>cleanup());
describe('autosave recovery',()=>{
 it('restores an offline draft after reload and saves it only after confirmation',async()=>{
  Object.defineProperty(navigator,'onLine',{value:false,configurable:true});const m=memory();let h=renderHook(()=>useWorkspace(m.store,'owner'));
  await waitFor(()=>expect(h.result.current.loaded).toBe(true));act(()=>h.result.current.update('practice-test',p));expect(h.result.current.pending).toBe(1);expect(m.rows()).toHaveLength(0);h.unmount();
  Object.defineProperty(navigator,'onLine',{value:true,configurable:true});h=renderHook(()=>useWorkspace(m.store,'owner'));await act(async()=>{await h.result.current.flush();});expect(m.rows()[0].payload).toEqual(p);expect(h.result.current.pending).toBe(0);
 });
 it('recognizes an acknowledged write when the original response was lost',async()=>{
  const m=memory(),normal=m.store.save;let drop=true;m.store.save=async(...args)=>{const saved=await normal(...args);if(drop){drop=false;throw Error('response lost');}return saved;};
  const h=renderHook(()=>useWorkspace(m.store,'owner'));await waitFor(()=>expect(h.result.current.loaded).toBe(true));act(()=>h.result.current.update('practice-test',p));await act(async()=>{await h.result.current.flush();});expect(h.result.current.pending).toBe(1);await act(async()=>{await h.result.current.flush();});expect(h.result.current.pending).toBe(0);expect(m.rows()[0].version).toBe(1);
 });
 it('retains a stale draft and asks for a choice instead of overwriting',async()=>{
  const m=memory();m.external('practice-test',p,3);const h=renderHook(()=>useWorkspace(m.store,'owner'));await waitFor(()=>expect(h.result.current.loaded).toBe(true));act(()=>h.result.current.update('practice-test',{...p,note:'mine'}));m.external('practice-test',{...p,note:'another device'},4);await act(async()=>{await h.result.current.flush();});expect(h.result.current.conflicts).toEqual(['practice-test']);expect((m.rows()[0].payload as Practice).note).toBe('another device');act(()=>h.result.current.resolve('practice-test',false));expect(h.result.current.pending).toBe(0);expect((h.result.current.rows[0].payload as Practice).note).toBe('another device');
 });
 it('keeps a newer edit made while an earlier save is in flight',async()=>{
  const m=memory(),normal=m.store.save;let release:(r:RecordRow)=>void=()=>{};let first:RecordRow|undefined;
  m.store.save=async(...args)=>{const r=await normal(...args);if(r.version===1){first=r;return new Promise<RecordRow>(resolve=>{release=resolve;});}return r;};
  const h=renderHook(()=>useWorkspace(m.store,'owner'));await waitFor(()=>expect(h.result.current.loaded).toBe(true));act(()=>h.result.current.update('practice-test',p));let saving:Promise<void>;act(()=>{saving=h.result.current.flush();});await waitFor(()=>expect(first).toBeTruthy());act(()=>h.result.current.update('practice-test',{...p,note:'newer'}));await act(async()=>{release(first!);await saving!;});expect(h.result.current.pending).toBe(1);await act(async()=>{await h.result.current.flush();});expect((m.rows()[0].payload as Practice).note).toBe('newer');expect(m.rows()[0].version).toBe(2);
 });
 it('does not mix recovery drafts across owners',()=>{draftsFor('a').write({test:{payload:p,expected:0,stamp:'1'}});expect(draftsFor('b').read()).toEqual({});});
 it('does not erase another tab\'s recovery draft when acknowledging its own',()=>{const a=draftsFor('owner'),b=draftsFor('owner');a.read();b.read();a.write({first:{payload:p,expected:0,stamp:'1'}});b.write({second:{payload:p,expected:0,stamp:'2'}});a.write({});expect(draftsFor('owner').read()).toEqual({second:{payload:p,expected:0,stamp:'2'}});});
});
describe('content rendering',()=>{
 it('removes executable HTML and unsafe links from editable imports',()=>{const html=safe('<p>Hello<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">link</a></p>');expect(html).not.toMatch(/script|onerror|javascript:|<img/);expect(html).toContain('Hello');});
 it('retains useful headings, links and tables',()=>{const html=safe('<h3>Title</h3><table><tr><th>Name</th></tr></table><a href="https://example.com">Read</a>');expect(html).toContain('<h3>Title</h3>');expect(html).toContain('<table>');expect(html).toContain('https://example.com');});
});
