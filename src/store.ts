import {createClient} from '@supabase/supabase-js';
import type {Payload,RecordRow,Draft} from './types';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key&&!url.includes('your-project')?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export class ConflictError extends Error{}
export interface Store{list():Promise<RecordRow[]>;save(id:string,payload:Payload,version:number):Promise<RecordRow>;history(id:string):Promise<RecordRow[]>;}
export const cloudStore:Store={
 async list(){const {data,error}=await supabase!.from('prep_records').select('id,payload,version,updated_at').order('id');if(error)throw error;return data as RecordRow[];},
 async save(id,payload,version){const {data,error}=await supabase!.rpc('save_prep_record',{record_id:id,new_payload:payload,expected_version:version});if(error){if(error.message.includes('VERSION_CONFLICT'))throw new ConflictError('This section changed on another device.');throw error;}return data as RecordRow;},
 async history(id){const {data,error}=await supabase!.from('prep_revisions').select('id,payload,version,updated_at').eq('id',id).order('version',{ascending:false}).limit(30);if(error)throw error;return data as RecordRow[];}
};
export function localStore(namespace:string):Store{
 const key=`fieldnotes-preview-${namespace}`; const read=():RecordRow[]=>JSON.parse(localStorage.getItem(key)||'[]');
 return {async list(){return read();},async save(id,payload,expected){const rows=read(),current=rows.find(r=>r.id===id);if((current?.version||0)!==expected)throw new ConflictError('This section changed in another tab.');const row={id,payload,version:expected+1,updated_at:new Date().toISOString()};localStorage.setItem(`${key}-history-${id}`,JSON.stringify([row,...JSON.parse(localStorage.getItem(`${key}-history-${id}`)||'[]')].slice(0,30)));localStorage.setItem(key,JSON.stringify([...rows.filter(r=>r.id!==id),row]));return row;},async history(id){return JSON.parse(localStorage.getItem(`${key}-history-${id}`)||'[]');}};
}
export function draftsFor(owner:string){
 const key=`fieldnotes-drafts-${owner}`;let last:Record<string,Draft>={};
 const read=():Record<string,Draft>=>{try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{return {};}};
 return {read(){last=read();return last;},write(value:Record<string,Draft>){const merged=read();for(const [id,previous]of Object.entries(last)){if(!value[id]&&merged[id]?.stamp===previous.stamp)delete merged[id];}for(const [id,d]of Object.entries(value)){if(last[id]?.stamp!==d.stamp)merged[id]=d;}localStorage.setItem(key,JSON.stringify(merged));last={...value};}};
}
