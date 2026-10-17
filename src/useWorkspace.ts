import {useCallback,useEffect,useRef,useState} from 'react';
import type {Draft,Payload,RecordRow} from './types';
import {resolveDraft,validatePayload} from './types';
import {ConflictError,draftsFor} from './store';
import type {Store} from './store';
export function useWorkspace(store:Store,owner:string){
 const storage=useRef(draftsFor(owner));
 const [rows,setRows]=useState<RecordRow[]>([]),[pending,setPending]=useState<Record<string,Draft>>(()=>storage.current.read());
 const [error,setError]=useState(''),[loaded,setLoaded]=useState(false),[conflicts,setConflicts]=useState<string[]>([]),[saving,setSaving]=useState(false);
 const [online,setOnline]=useState(navigator.onLine),[saveFailed,setSaveFailed]=useState(false);
 const remote=useRef(rows),drafts=useRef(pending),blocked=useRef(new Set<string>()),busy=useRef(false);
 const publish=(next:Record<string,Draft>)=>{storage.current.write(next);drafts.current=next;setPending({...next});};
 const replaceRows=(next:RecordRow[])=>{const merged=new Map(remote.current.map(r=>[r.id,r]));for(const r of next){if(r.version>=(merged.get(r.id)?.version||0))merged.set(r.id,r);}remote.current=[...merged.values()];setRows(remote.current);};
 const refresh=useCallback(async()=>{try{const next=await store.list();replaceRows(next);setLoaded(true);setError('');}catch(e){setError('Your workspace is temporarily unavailable. Check your connection; if the free database has paused, resume it in Supabase. Your saved data has not been replaced.');}},[store]);
 const flush=useCallback(async()=>{
  if(busy.current||!navigator.onLine)return;busy.current=true;setSaving(true);
  try{for(const [id,d]of Object.entries(drafts.current)){
   if(blocked.current.has(id))continue;
   if(!validatePayload(d.payload)){setError('This draft needs a valid title and section settings before it can be saved. Your draft stays on this device.');continue;}
   try{const saved=await store.save(id,d.payload,d.expected);setSaveFailed(false);replaceRows([...remote.current.filter(r=>r.id!==id),saved]);
    const latest=drafts.current[id];if(latest?.stamp===d.stamp){const n={...drafts.current};delete n[id];publish(n);}else if(latest){publish({...drafts.current,[id]:{...latest,expected:saved.version}});}setError('');
   }catch(e){if(e instanceof ConflictError){const latest=await store.list();replaceRows(latest);const current=drafts.current[id];if(current&&resolveDraft(latest.find(r=>r.id===id),current)==='already-saved'){const n={...drafts.current};delete n[id];publish(n);}else{blocked.current.add(id);setConflicts([...blocked.current]);}}else{setSaveFailed(true);setError('Changes are pending on this device. Reconnect or resume your Supabase project, then retry.');break;}}
  }}finally{busy.current=false;setSaving(false);}
 },[store]);
 const update=(id:string,payload:Payload)=>{const d=drafts.current[id];const draft={payload,expected:d?.expected??remote.current.find(r=>r.id===id)?.version??0,stamp:crypto.randomUUID()};try{publish({...drafts.current,[id]:draft});}catch{setError('This browser cannot keep a recovery draft. Export your work before closing this page.');drafts.current={...drafts.current,[id]:draft};setPending({...drafts.current});}};
 const resolve=(id:string,mine:boolean)=>{const n={...drafts.current};if(mine&&n[id])n[id]={...n[id],expected:remote.current.find(r=>r.id===id)?.version||0,stamp:crypto.randomUUID()};else delete n[id];blocked.current.delete(id);setConflicts([...blocked.current]);publish(n);};
 useEffect(()=>{void refresh();const timer=setInterval(()=>{void refresh();void flush();},15000);const resume=()=>{void refresh();void flush();};window.addEventListener('focus',resume);window.addEventListener('online',resume);return()=>{clearInterval(timer);window.removeEventListener('focus',resume);window.removeEventListener('online',resume);};},[refresh,flush]);
 useEffect(()=>{if(Object.keys(pending).length){const t=setTimeout(()=>void flush(),1000);return()=>clearTimeout(t);}},[pending,flush]);
 useEffect(()=>{const sync=()=>setOnline(navigator.onLine);window.addEventListener('online',sync);window.addEventListener('offline',sync);return()=>{window.removeEventListener('online',sync);window.removeEventListener('offline',sync);};},[]);
 useEffect(()=>{const guard=(e:BeforeUnloadEvent)=>{if(Object.keys(drafts.current).length){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[]);
 const merged=[...rows.map(r=>pending[r.id]?{...r,payload:pending[r.id].payload}:r),...Object.entries(pending).filter(([id])=>!rows.some(r=>r.id===id)).map(([id,d])=>({id,payload:d.payload,version:0,updated_at:d.stamp}))];
 return {rows:merged,remote:rows,update,refresh,flush,error,loaded,saving,online,saveFailed,pending:Object.keys(pending).length,conflicts,resolve};
}
