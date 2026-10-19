import {useEffect,useRef,useState} from 'react';

type Entry={id:string;title:string;level:number};
export function PageOutline({contentKey,enabled}:{contentKey:string;enabled:boolean}){
 const [entries,setEntries]=useState<Entry[]>([]),[active,setActive]=useState('');
 const targets=useRef<HTMLElement[]>([]),list=useRef<HTMLElement>(null);
 useEffect(()=>{
  setEntries([]);setActive('');targets.current=[];
  if(!enabled)return;
  const root=document.getElementById('reading');if(!root)return;
  let frame=0;
  const updatePosition=()=>{frame=0;const headings=targets.current;if(!headings.length)return;let current=headings[0];for(const h of headings){if(h.getBoundingClientRect().top<=150)current=h;else break;}setActive(current.id);};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(updatePosition);};
  const scan=()=>{
   const counts=new Map<string,number>();
   const headings=[...root.querySelectorAll<HTMLElement>('h2,h3')].filter(h=>!h.closest('.page-outline,.outline-mobile,.practice-box,.review-support,.optional-return,[contenteditable],details:not([open])'));
   const next=headings.map(h=>{
    const title=(h.textContent||'').replace(/\s+/g,' ').trim();
    const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'section';
    const n=(counts.get(slug)||0)+1;counts.set(slug,n);
    if(!h.id||h.dataset.outlineGenerated==='true'){h.id='page-'+slug+(n>1?'-'+n:'');h.dataset.outlineGenerated='true';}
    h.tabIndex=-1;
    return {id:h.id,title,level:h.tagName==='H3'?3:2};
   });
   targets.current=headings;setEntries(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);schedule();
  };
  scan();const observer=new MutationObserver(scan);observer.observe(root,{childList:true,characterData:true,subtree:true});
  root.addEventListener('toggle',scan,true);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  return()=>{observer.disconnect();root.removeEventListener('toggle',scan,true);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);if(frame)cancelAnimationFrame(frame);};
 },[contentKey,enabled]);
 useEffect(()=>{const nav=list.current,item=nav?.querySelector<HTMLElement>('[aria-current="location"]');if(nav&&item){const a=item.getBoundingClientRect(),b=nav.getBoundingClientRect();if(a.top<b.top||a.bottom>b.bottom)nav.scrollTop+=a.top-b.top-nav.clientHeight/3;}},[active]);
 const jump=(id:string)=>{const h=document.getElementById(id);h?.scrollIntoView({block:'start',behavior:'auto'});h?.focus({preventScroll:true});setActive(id);};
 const links=()=>entries.map(e=><a key={e.id} className={e.level===3?'outline-detail':''} href={'#'+e.id} aria-current={active===e.id?'location':undefined} onClick={event=>{event.preventDefault();jump(e.id);}}>{e.title}</a>);
 if(!enabled||!entries.length)return null;
 return <><aside className="page-outline" aria-label="On this page"><strong>On this page</strong><p>Jump to a topic or question. Your current position is highlighted.</p><nav ref={list} aria-label="Page index">{links()}</nav></aside><details className="outline-mobile"><summary>On this page · topics and questions</summary><nav aria-label="Page index mobile">{links()}</nav></details></>;
}
