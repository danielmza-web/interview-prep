import {createContext,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {GlossaryTerm} from './types';
import {groupGlossary} from './glossaryTopics';
import {study} from './safe';
import {highlightCode} from './codeReading';

type Help={term:GlossaryTerm;anchor:HTMLElement};
const Context=createContext<{terms:GlossaryTerm[];open:Help|null;show:(term:GlossaryTerm,anchor:HTMLElement)=>void;close:()=>void;cancel:()=>void;schedule:()=>void}>({terms:[],open:null,show:()=>{},close:()=>{},cancel:()=>{},schedule:()=>{}});
export function glossaryText(terms:GlossaryTerm[]=[]){return terms.map(t=>[t.term,...t.aliases,t.definition,t.purpose,t.example].join(' ')).join(' ');}
function contextAllows(id:string,context:string){
 const rules:Record<string,RegExp>={
  'term-image':/docker|container|registry|template|artifact|packag/i,
  'term-build':/source|docker|\bCI\b|artifact|software|compil|pipeline|application|\btests?\b/i,
  'term-path':/URL|https?|API|endpoint|address|scheme|request/i,
  'term-class':/C\+\+|\btype\b|object|instance|programming|inherit/i,
  'term-parameter':/function|battery|caller|argument|\bGo\b|C\+\+/i,
  'term-exception':/throw|C\+\+|error|function|handler/i,
  'term-helm-values':/Helm|chart/i,
  'term-helm-release':/Helm|chart|installed/i,
  'term-readiness-probe':/probe|Kubernetes|\bPods?\b|traffic|kubelet/i,
  'term-liveness-probe':/probe|Kubernetes|\bPods?\b|kubelet|restart/i,
  'term-process':/operating system|\bOS\b|\bPID\b|\bCPU\b|\bRAM\b|memory|\bprograms?\b|thread|execut|running process|process.*running|Linux|kill/i,
 };
 return !rules[id]||rules[id].test(context);
}
export function annotateTerms(html:string,terms:GlossaryTerm[]){
 const root=document.createElement('div');root.innerHTML=highlightCode(study(html));
 const names=terms.flatMap(t=>[t.term,...t.aliases].map(name=>({name:name.trim(),t})).filter(x=>x.name)).sort((a,b)=>b.name.length-a.name.length);
 const strict=new Set(['Go','C','SELECT','FROM','WHERE','JOIN','GROUP BY','HAVING','ORDER BY','LIMIT','COUNT','SUM','ROUND','NULLIF','GET','POST','PUT','PATCH','DELETE']);
 const groups=new Map<Element,{source:string;nodes:{node:Text;start:number;end:number}[]}>();
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let prior:Element|null=null;
 while(walker.nextNode()){
  const node=walker.currentNode as Text,parent=node.parentElement;if(!parent)continue;
  const scope=parent.closest('p,li,td,th,h2,h3,h4,blockquote')||root;
  const group=groups.get(scope)||{source:'',nodes:[]};groups.set(scope,group);
  if(parent.closest('pre,a,button,svg,figure,[data-study-diagram],textarea,input,[contenteditable]')){group.source+='\ufffc';prior=null;continue;}
  if(prior&&prior!==scope)group.source+='\ufffc';
  const start=group.source.length;group.source+=node.data;group.nodes.push({node,start,end:group.source.length});prior=scope;
 }
 for(const [scope,{source,nodes}] of groups){
  const context=(scope.closest('tr')||scope).textContent||source;
  const seen=new Set<string>(),matches:{start:number;end:number;t:GlossaryTerm}[]=[];let at=0;
  while(at<source.length){let best:typeof matches[number]|undefined;
   for(const {name,t} of names){if(seen.has(t.id)||!contextAllows(t.id,context))continue;const sensitive=strict.has(name),hay=sensitive?source:source.toLowerCase(),needle=sensitive?name:name.toLowerCase();let start=hay.indexOf(needle,at);
    while(start>=0){const end=start+name.length;if(!/[\p{L}\p{N}_]/u.test(source[start-1]||'')&&!/[\p{L}\p{N}_]/u.test(source[end]||'')){if(!best||start<best.start||(start===best.start&&end>best.end))best={start,end,t};break;}start=hay.indexOf(needle,start+1);}
   }
   if(!best)break;matches.push(best);seen.add(best.t.id);at=best.end;
  }
  for(const match of matches.reverse()){
   const first=nodes.find(n=>n.start<=match.start&&n.end>match.start),last=nodes.find(n=>n.start<match.end&&n.end>=match.end);if(!first||!last)continue;
   const range=document.createRange();range.setStart(first.node,match.start-first.start);range.setEnd(last.node,match.end-last.start);
   const button=document.createElement('button');button.type='button';button.className='term-help';button.dataset.termId=match.t.id;button.setAttribute('aria-label','Explain '+match.t.term);button.append(range.extractContents());range.insertNode(button);
  }
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
 const marked=useMemo(()=>annotate?annotateTerms(html,help.terms):highlightCode(study(html)),[html,help.terms,annotate]);
 useEffect(()=>()=>clearTimeout(hover.current),[marked]);
 const target=(node:EventTarget|null)=>{const b=(node as HTMLElement)?.closest?.('button[data-term-id]') as HTMLElement|null;const term=help.terms.find(t=>t.id===b?.dataset.termId);return b&&term?{b,term}:null;};
 return <div className="prose" onPointerDown={()=>{pointer.current=true;}} onPointerOver={e=>{if(e.pointerType==='touch')return;const t=target(e.target);if(!t||t.b.contains(e.relatedTarget as Node))return;help.cancel();clearTimeout(hover.current);hover.current=setTimeout(()=>help.show(t.term,t.b),300);}} onPointerOut={e=>{const t=target(e.target);if(!t||t.b.contains(e.relatedTarget as Node))return;clearTimeout(hover.current);help.schedule();}} onFocus={e=>{const t=target(e.target);if(t&&!pointer.current)help.show(t.term,t.b);}} onBlur={e=>{pointer.current=false;if(!document.getElementById('term-explanation')?.contains(e.relatedTarget as Node))help.close();}} onClick={e=>{const t=target(e.target);if(t){clearTimeout(hover.current);if(help.open?.anchor===t.b)help.close();else help.show(t.term,t.b);pointer.current=false;}}} dangerouslySetInnerHTML={{__html:marked}}/>;
}
export function GlossaryEntries({terms,editing,onChange,initialQuery=''}:{terms:GlossaryTerm[];editing:boolean;onChange:(terms:GlossaryTerm[])=>void;initialQuery?:string}){
 const [query,setQuery]=useState(initialQuery),[topic,setTopic]=useState(()=>groupGlossary(terms)[0]?.id||'all'),[error,setError]=useState('');
 useEffect(()=>{setQuery(initialQuery);},[initialQuery]);
 const groups=groupGlossary(terms),activeTopic=groups.some(g=>g.id===topic)?topic:'all';
 const selected=terms.filter(t=>glossaryText([t]).toLowerCase().includes(query.toLowerCase())&&(query||activeTopic==='all'||groups.find(g=>g.id===activeTopic)?.terms.some(v=>v.id===t.id)));
 const update=(id:string,key:keyof GlossaryTerm,value:string)=>{const next=terms.map(t=>t.id===id?{...t,[key]:key==='aliases'?(value.trim()?value.split(',').map(s=>s.trim()):[]):value}:t);onChange(next);};
 return <section className="glossary-entries" aria-label="Concept glossary">
  <div className="glossary-controls"><label className="field-label">Find a term<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search every topic, definition and example"/></label>
   <label className="field-label">Topic<select value={query?'all':activeTopic} onChange={e=>{setTopic(e.target.value);setQuery('');}}><option value="all">All topics</option>{groups.map(g=><option key={g.id} value={g.id}>{g.title} ({g.terms.length})</option>)}</select></label>
  </div>
  <p>{selected.length} of {terms.length} concepts. Dotted terms in chapters open these same explanations.</p>
  {!editing&&<p className="glossary-instruction">Choose a topic or search across all of them. Each row shows the meaning; open it for the complete definition, purpose and example.</p>}
  {error&&<p role="alert">{error}</p>}
  {editing&&<button onClick={()=>{if(terms.length>=240){setError('Keep up to 240 concepts.');return;}onChange([...terms,{id:'term-'+crypto.randomUUID(),term:'New concept',aliases:[],definition:'Add a clear definition.',purpose:'Explain its purpose.',example:'Connect it to a mission.'}]);setQuery('New concept');}}>Add concept</button>}
  {!selected.length&&<p>No matching concepts. Try another name or clear the search.</p>}
  {groupGlossary(selected).map(group=><section className="glossary-topic" key={group.id} aria-label={group.title}>
   <h2>{group.title} <small>{group.terms.length}</small></h2>
   {!editing&&<div className="glossary-columns" aria-hidden="true"><span>Term</span><span>What it means</span></div>}
   {group.terms.map(t=>editing?<article key={t.id} className="glossary-entry">
    <label className="field-label">Term<input maxLength={100} value={t.term} onChange={e=>update(t.id,'term',e.target.value)}/></label>
    <label className="field-label">Other names separated by commas<input value={t.aliases.join(', ')} onChange={e=>update(t.id,'aliases',e.target.value)}/></label>
    {(['definition','purpose','example'] as const).map(k=><label key={k} className="field-label">{k==='definition'?'What it means':k==='purpose'?'Why it matters':'Example'}<textarea maxLength={1200} rows={2} value={t[k]} onChange={e=>update(t.id,k,e.target.value)}/></label>)}
    <p>{[t.definition,t.purpose,t.example].join(' ').trim().split(/\s+/).length}/100 words. Keep the explanation short; an invalid draft remains on this device until corrected.</p>
    <button onClick={()=>onChange(terms.filter(x=>x.id!==t.id))}>Remove concept</button>
   </article>:<details key={t.id} className="glossary-row">
    <summary><strong>{t.term}</strong><span className="glossary-meaning">{t.definition}</span><span className="glossary-expand" aria-hidden="true">+</span></summary>
    <div className="glossary-detail">{t.aliases.length>0&&<p className="glossary-aliases">Also called: {t.aliases.join(', ')}</p>}<p><strong>Why it matters:</strong> {t.purpose}</p><p><strong>Example:</strong> {t.example}</p></div>
   </details>)}
  </section>)}
 </section>;
}
