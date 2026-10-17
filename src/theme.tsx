import {useEffect,useState} from 'react';
export type Theme='night'|'light';
const key='fieldnotes-theme';
export function readTheme():Theme {try{return localStorage.getItem(key)==='light'?'light':'night';}catch{return 'night';}}
export function applyTheme(theme:Theme){document.documentElement.dataset.theme=theme;}
applyTheme(readTheme());
export function ThemeToggle(){
 const [theme,setTheme]=useState<Theme>(readTheme);
 useEffect(()=>{const sync=()=>{const next=readTheme();applyTheme(next);setTheme(next);};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 return <button className="theme-toggle" onClick={()=>{const next=theme==='night'?'light':'night';applyTheme(next);setTheme(next);try{localStorage.setItem(key,next);}catch{/* The current tab can still use the selected theme. */}}}>{theme==='night'?'Use light mode':'Use soft night mode'}</button>;
}
