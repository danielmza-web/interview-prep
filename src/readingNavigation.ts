/** Display-only scrolling: jumps and tracking share the actual sticky offset. */
export function readingOffset(){
 const root=document.getElementById('reading');
 const toolbar=Math.max(0,document.querySelector('.topbar')?.getBoundingClientRect().bottom||76);
 const returning=document.querySelector('.optional-return')?.getBoundingClientRect().height||0;
 const mobile=document.querySelector<HTMLElement>('.outline-mobile');
 const index=mobile&&getComputedStyle(mobile).display!=='none'?(mobile.querySelector('summary')?.getBoundingClientRect().height||40):0;
 const offset=toolbar+returning+index+18;
 root?.style.setProperty('--toolbar-bottom',toolbar+'px');
 root?.style.setProperty('--return-height',returning+'px');
 root?.style.setProperty('--reading-offset',offset+'px');
 return offset;
}
export function jumpToReading(id:string){
 const element=document.getElementById(id);if(!element)return;
 const heading=element.matches('h2,h3')?element:element.querySelector<HTMLElement>('h2,h3')||element;
 readingOffset();heading.scrollIntoView({block:'start',behavior:'auto'});heading.focus({preventScroll:true});
}
