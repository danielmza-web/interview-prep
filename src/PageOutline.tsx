import {useEffect,useRef,useState} from 'react';
import {readingOffset,jumpToReading} from './readingNavigation';
type Entry={id:string;title:string;level:number;part:string;group:string};
export function PageOutline({contentKey,enabled}:{contentKey:string;enabled:boolean}){
 const [entries,setEntries]=useState<Entry[]>([]),[active,setActive]=useState(''),[opened,setOpened]=useState<Record<string,boolean>>({});
 const targets=useRef<HTMLElement[]>([]),list=useRef<HTMLElement>(null),mobile=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  setEntries([]);setActive('');setOpened({});targets.current=[];
  if(!enabled)return;
  const root=document.getElementById('reading');if(!root)return;
  let frame=0;
  const updatePosition=()=>{frame=0;const headings=targets.current;if(!headings.length)return;const offset=readingOffset()+4;let current=headings[0];for(const h of headings){if(h.getBoundingClientRect().top<=offset)current=h;else break;}setActive(current.id);};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(updatePosition);};
  const scan=()=>{
   const counts=new Map<string,number>();let group='';
   const headings=[...root.querySelectorAll<HTMLElement>('h2,h3')].filter(h=>!h.closest('.page-outline,.outline-mobile,.practice-box,.review-support,.optional-return,[data-outline-ignore],[contenteditable],details:not([open])'));
   const next=headings.map(h=>{
    const title=(h.textContent||'').replace(/\s+/g,' ').trim();
    const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'section';
    const n=(counts.get(slug)||0)+1;counts.set(slug,n);
    const owner=h.closest<HTMLElement>('[data-outline-anchor]'),anchor=owner?.querySelector('h2')===h?owner.dataset.outlineAnchor:undefined;
    const article=h.closest<HTMLElement>('article.question-card'),question=article?.querySelector('h3')===h?article.id:undefined;
    if(!h.id||h.dataset.outlineGenerated==='true'){h.id=anchor?'heading-'+anchor:question?'heading-'+question:'page-'+slug+(n>1?'-'+n:'');h.dataset.outlineGenerated='true';}
    h.tabIndex=-1;
    const part=h.closest<HTMLElement>('[data-outline-part]')?.dataset.outlinePart||'';
    if(h.tagName==='H2'||!group)group=h.id;
    return {id:h.id,title,level:h.tagName==='H3'?3:2,part,group};
   });
   targets.current=headings;setEntries(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);setActive(old=>headings.some(h=>h.id===old)?old:headings[0]?.id||'');schedule();
  };
  scan();const observer=new MutationObserver(records=>{if(records.some(r=>!(r.target instanceof Element?r.target:r.target.parentElement)?.closest('.page-outline,.outline-mobile')))scan();});
  observer.observe(root,{childList:true,characterData:true,subtree:true});
  const resize=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;
  for(const el of [document.querySelector('.topbar'),root.querySelector('.optional-return')])if(el)resize?.observe(el);
  root.addEventListener('toggle',scan,true);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  return()=>{observer.disconnect();resize?.disconnect();root.removeEventListener('toggle',scan,true);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);if(frame)cancelAnimationFrame(frame);};
 },[contentKey,enabled]);
 const activeGroup=entries.find(e=>e.id===active)?.group;
 useEffect(()=>{const entry=entries.find(e=>e.group===activeGroup);if(!entry)return;const key=entry.part+entry.group;setOpened(o=>{if(!(key in o))return o;const next={...o};delete next[key];return next;});},[activeGroup]);
 useEffect(()=>{const nav=list.current,item=nav?.querySelector<HTMLElement>('[aria-current="location"]');if(nav&&item){const a=item.getBoundingClientRect(),b=nav.getBoundingClientRect();if(a.top<b.top||a.bottom>b.bottom)nav.scrollTop+=a.top-b.top-nav.clientHeight/3;}},[active]);
 const jump=(id:string)=>{if(mobile.current)mobile.current.open=false;jumpToReading(id);setActive(id);};
 const link=(e:Entry)=><a key={e.id} className={e.level===3?'outline-detail':''} href={'#'+e.id} aria-current={active===e.id?'location':undefined} onClick={event=>{event.preventDefault();jump(e.id);}}>{e.title}</a>;
 const current=entries.find(e=>e.id===active),parts=[...new Set(entries.map(e=>e.part))];
 const links=()=>parts.map(part=><section key={part} className="outline-part">{part&&<strong>{part}</strong>}{entries.filter(e=>e.part===part&&e.level===2).map(e=>{
  const children=entries.filter(x=>x.part===part&&x.group===e.id&&x.id!==e.id);
  if(!children.length)return link(e);
  const key=part+e.id,expanded=opened[key]??current?.group===e.id;
  return <div className="outline-group" key={e.id}><div>{link(e)}<button aria-label={(expanded?'Collapse ':'Expand ')+e.title} aria-expanded={expanded} onClick={()=>setOpened(o=>({...o,[key]:!expanded}))}>{expanded?'−':'+'}</button></div>{expanded&&children.map(link)}</div>;
 })}{entries.filter(e=>e.part===part&&e.level===3&&!entries.some(x=>x.id===e.group&&x.level===2)).map(link)}</section>);
 if(!enabled||!entries.length)return null;
 return <><aside className="page-outline" aria-label="On this page"><strong>On this page</strong><nav ref={list} aria-label="Page index">{links()}</nav></aside><details ref={mobile} className="outline-mobile"><summary>On this page{current?' · '+current.title:''}</summary><nav aria-label="Page index mobile">{links()}</nav></details></>;
}
