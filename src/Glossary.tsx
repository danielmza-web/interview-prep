import {createContext,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {GlossaryTerm} from './types';
import {study} from './safe';

type Help={term:GlossaryTerm;anchor:HTMLElement};
const Context=createContext<{terms:GlossaryTerm[];open:Help|null;show:(term:GlossaryTerm,anchor:HTMLElement)=>void;close:()=>void;cancel:()=>void;schedule:()=>void}>({terms:[],open:null,show:()=>{},close:()=>{},cancel:()=>{},schedule:()=>{}});
export function glossaryText(terms:GlossaryTerm[]=[]){return terms.map(t=>[t.term,...t.aliases,t.definition,t.purpose,t.example].join(' ')).join(' ');}
export function annotateTerms(html:string,terms:GlossaryTerm[]){
 const root=document.createElement('div');root.innerHTML=study(html);
 const seen=new Set<string>();
 const names=terms.flatMap(t=>[t.term,...t.aliases].filter(name=>name.trim()).map(name=>({name,t}))).sort((a,b)=>b.name.length-a.name.length);
 const nodes:Text[]=[];const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode as Text);
 for(const node of nodes){if(node.parentElement?.closest('h1,h2,h3,h4,h5,h6,pre,code,a,button,svg,figure,[data-study-diagram],textarea,input,[contenteditable]'))continue;
  const source=node.data;const out=document.createDocumentFragment();let at=0,changed=false;
  while(at<source.length){let best:{start:number;end:number;t:GlossaryTerm}|undefined;
   for(const {name,t} of names){if(seen.has(t.id))continue;const sensitive=name.length<=4&&name===name.toUpperCase();let start=(sensitive?source:source.toLowerCase()).indexOf(sensitive?name:name.toLowerCase(),at);
    while(start>=0){const end=start+name.length;if(!/[\p{L}\p{N}_]/u.test(source[start-1]||'')&&!/[\p{L}\p{N}_]/u.test(source[end]||'')){if(!best||start<best.start||(start===best.start&&end>best.end))best={start,end,t};break;}start=(sensitive?source:source.toLowerCase()).indexOf(sensitive?name:name.toLowerCase(),start+1);}
   }
   if(!best)break;out.append(source.slice(at,best.start));const b=document.createElement('button');b.type='button';b.className='term-help';b.dataset.termId=best.t.id;b.textContent=source.slice(best.start,best.end);b.setAttribute('aria-label','Explain '+best.t.term);out.append(b);seen.add(best.t.id);at=best.end;changed=true;
  }
  if(changed){out.append(source.slice(at));node.replaceWith(out);}
 }
 return root.innerHTML;
}
export function GlossaryProvider({terms,resetKey,children}:{terms:GlossaryTerm[];resetKey:string;children:React.ReactNode}){
 const [open,setOpen]=useState<Help|null>(null),[position,setPosition]=useState({left:12,top:12});const box=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const cancel=()=>{clearTimeout(timer.current);};const close=()=>{cancel();setOpen(null);};const schedule=()=>{cancel();timer.current=setTimeout(()=>setOpen(null),180);};
 useEffect(()=>{close();},[resetKey,JSON.stringify(terms)]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{if(!open)return;open.anchor.setAttribute('aria-describedby','term-explanation');return()=>open.anchor.removeAttribute('aria-describedby');},[open]);
 useEffect(()=>{if(!open)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();};const outside=(e:PointerEvent)=>{if(!box.current?.contains(e.target as Node)&&!open.anchor.contains(e.target as Node))close();};document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);return()=>{document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);};},[open]);
 useLayoutEffect(()=>{if(!open)return;const place=()=>{const a=open.anchor.getBoundingClientRect(),b=box.current?.getBoundingClientRect();if(!b)return;const w=document.documentElement.clientWidth||window.innerWidth,h=window.innerHeight;setPosition({left:Math.max(12,Math.min(a.left,w-b.width-12)),top:Math.max(12,Math.min(a.bottom+8+b.height<=h-12?a.bottom+8:a.top-b.height-8,h-b.height-12))});};place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};},[open]);
 const value={terms,open,show:(term:GlossaryTerm,anchor:HTMLElement)=>{if(!anchor.isConnected)return;cancel();setOpen({term,anchor});},close,cancel,schedule};
 return <Context.Provider value={value}>{children}{open&&createPortal(<div ref={box} id="term-explanation" role="tooltip" className="term-popover" style={{...position,maxWidth:Math.max(160,(document.documentElement.clientWidth||window.innerWidth)-24)}} onPointerEnter={cancel} onPointerLeave={e=>{if(e.pointerType!=='touch')schedule();}}><strong>{open.term.term}</strong><p><span>What it means</span>{open.term.definition}</p><p><span>Why it matters</span>{open.term.purpose}</p><p><span>Example</span>{open.term.example}</p><small>Escape or tap outside to close.</small></div>,document.body)}</Context.Provider>;
}
export function StudyContent({html,annotate=true}:{html:string;annotate?:boolean}){
 const help=useContext(Context),hover=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),pointer=useRef(false);
 const marked=useMemo(()=>annotate?annotateTerms(html,help.terms):study(html),[html,help.terms,annotate]);
 useEffect(()=>()=>clearTimeout(hover.current),[marked]);
 const target=(node:EventTarget|null)=>{const b=(node as HTMLElement)?.closest?.('button[data-term-id]') as HTMLElement|null;const term=help.terms.find(t=>t.id===b?.dataset.termId);return b&&term?{b,term}:null;};
 return <div className="prose" onPointerDown={()=>{pointer.current=true;}} onPointerOver={e=>{if(e.pointerType==='touch')return;const t=target(e.target);if(!t||t.b.contains(e.relatedTarget as Node))return;help.cancel();clearTimeout(hover.current);hover.current=setTimeout(()=>help.show(t.term,t.b),300);}} onPointerOut={e=>{const t=target(e.target);if(!t||t.b.contains(e.relatedTarget as Node))return;clearTimeout(hover.current);help.schedule();}} onFocus={e=>{const t=target(e.target);if(t&&!pointer.current)help.show(t.term,t.b);}} onBlur={e=>{pointer.current=false;if(!document.getElementById('term-explanation')?.contains(e.relatedTarget as Node))help.close();}} onClick={e=>{const t=target(e.target);if(t){clearTimeout(hover.current);if(help.open?.anchor===t.b)help.close();else help.show(t.term,t.b);pointer.current=false;}}} dangerouslySetInnerHTML={{__html:marked}}/>;
}
export function GlossaryEntries({terms,editing,onChange}:{terms:GlossaryTerm[];editing:boolean;onChange:(terms:GlossaryTerm[])=>void}){
 const [query,setQuery]=useState(''),[error,setError]=useState('');const selected=terms.filter(t=>glossaryText([t]).toLowerCase().includes(query.toLowerCase()));
 const update=(id:string,key:keyof GlossaryTerm,value:string)=>{const next=terms.map(t=>t.id===id?{...t,[key]:key==='aliases'?(value.trim()?value.split(',').map(s=>s.trim()):[]):value}:t);onChange(next);};
 return <section className="glossary-entries"><label className="field-label">Find a term<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search terms, definitions and examples"/></label><p>{selected.length} of {terms.length} concepts. Dotted terms in chapters open these same explanations.</p>{error&&<p role="alert">{error}</p>}{editing&&<button onClick={()=>{if(terms.length>=80){setError('Keep up to 80 concepts.');return;}onChange([...terms,{id:'term-'+crypto.randomUUID(),term:'New concept',aliases:[],definition:'Add a clear definition.',purpose:'Explain its purpose.',example:'Connect it to a mission.'}]);setQuery('New concept');}}>Add concept</button>}{selected.map(t=><article key={t.id} className="glossary-entry">{editing?<><label className="field-label">Term<input maxLength={100} value={t.term} onChange={e=>update(t.id,'term',e.target.value)}/></label><label className="field-label">Other names separated by commas<input value={t.aliases.join(', ')} onChange={e=>update(t.id,'aliases',e.target.value)}/></label>{(['definition','purpose','example'] as const).map(k=><label key={k} className="field-label">{k==='definition'?'What it means':k==='purpose'?'Why it matters':'Example'}<textarea maxLength={1200} rows={2} value={t[k]} onChange={e=>update(t.id,k,e.target.value)}/></label>)}<p>{[t.definition,t.purpose,t.example].join(' ').trim().split(/\s+/).length}/100 words. Keep the explanation short; an invalid draft remains on this device until corrected.</p><button onClick={()=>onChange(terms.filter(x=>x.id!==t.id))}>Remove concept</button></>:<><h2>{t.term}</h2><p><strong>What it means:</strong> {t.definition}</p><p><strong>Why it matters:</strong> {t.purpose}</p><p><strong>Example:</strong> {t.example}</p></>}</article>)}</section>;
}
