// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {Editor as CoreEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {safe,study,markdown} from './safe';
import {annotateTerms} from './Glossary';
import {highlightCode} from './codeReading';
import {codeLanguages} from './codeLanguages';
import {diagramPlaceholder,diagramHTML,diagrams} from './diagrams';
import type {GlossaryTerm} from './types';
const term=(name:string,aliases:string[]=[]):GlossaryTerm=>({id:'term-'+name.toLowerCase().replace(/\W+/g,'-'),term:name,aliases,definition:'Meaning',purpose:'Purpose',example:'Example'});
const element=(html:string)=>{const d=document.createElement('div');d.innerHTML=html;return d;};
it('marks one complete name per paragraph, cell, list item and heading across formatting',()=>{
 const html='<h3>NATS</h3><p>Core <strong>NATS</strong> and NATS again.</p><p><code>NATS</code> returns.</p><ul><li>NATS and NATS</li></ul><table><tr><td>NATS NATS</td><td>NATS</td></tr></table>';
 const d=element(annotateTerms(html,[term('NATS',['Core NATS'])]));expect(d.querySelectorAll('button')).toHaveLength(6);expect(d.textContent).toBe(element(study(html)).textContent);expect(d.querySelector('p button strong')?.textContent).toBe('NATS');expect(d.querySelectorAll('p button')[0].textContent).toBe('Core NATS');
});
it('recognizes IDs and product variants without marking partial identifiers',()=>{
 const ts=[term('Mission ID',['M-105','M-101']),term('NATS',['Core NATS']),term('JetStream',['NATS JetStream']),term('Kafka'),term('Canary')];
 const d=element(annotateTerms('<p><code>M-105</code>, M-105X, kafka, nats, NATS <em>JetStream</em> and canary.</p>',ts));expect([...d.querySelectorAll('button')].map(b=>b.textContent)).toEqual(['M-105','kafka','nats','NATS JetStream','canary']);
});
it('does not treat camera images or physical paths as Docker images or URL paths',()=>{
 const ts=[term('Image',['images']),term('Path',['paths']),term('Build')];
 expect(element(annotateTerms('<p>I build camera structures and compare images along the robot path.</p>',ts)).querySelectorAll('button')).toHaveLength(0);
 expect(element(annotateTerms('<p>Build the software image for a Docker container; inspect the API URL path.</p>',ts)).querySelectorAll('button')).toHaveLength(3);
});
const samples={go:'func eligible(battery int) bool {\n\treturn battery >= 20\n}',cpp:'bool eligible(int battery) { return battery >= 20; }',python:'def eligible(battery):\n    return battery >= 20',sql:'SELECT id FROM missions WHERE status = \'Failed\';',json:'{"mission":"M-105","battery":20}',yaml:'replicas: 2\nimage: fleet-api:v2',powershell:'$base = "http://127.0.0.1:8000"\nInvoke-RestMethod "$base/api/robots"',bash:'kubectl get pods -n robotics\necho "done"',dockerfile:'FROM python:3.14-slim\nCOPY . /app\nCMD ["python", "main.py"]',http:'POST /api/missions HTTP/1.1\nContent-Type: application/json\n\n{"id":"M-105"}'};
it('colours every supported language while preserving exact code and explicit labels',()=>{
 for(const [language,source] of Object.entries(samples)){
  const pre=document.createElement('pre'),code=document.createElement('code');code.className='language-'+language;code.textContent=source;pre.append(code);
  const original=safe(pre.outerHTML),d=element(highlightCode(study(original)));expect(d.querySelector('pre code')?.textContent).toBe(source);expect(d.querySelector('pre')?.getAttribute('data-code-label')).toBe(codeLanguages[language as keyof typeof codeLanguages]);expect(d.querySelector('.hljs-keyword,.hljs-string,.hljs-attr,.hljs-attribute,.hljs-meta,.hljs-number')).toBeTruthy();expect(highlightCode(study(original))).toBe(highlightCode(study(original)));
 }
});
it('does not guess language, execute embedded HTML or retain presentation classes on save',()=>{
 const source='<img src=x onerror="bad()">\n<script>bad()</script>';
 const p=document.createElement('pre'),c=document.createElement('code');c.className='language-json';c.textContent=source;p.append(c);const rendered=element(highlightCode(study(p.outerHTML)));expect(rendered.querySelector('img,script')).toBeNull();expect(rendered.querySelector('code')?.textContent).toBe(source);
 const clean=safe('<p class="overlay">Text</p><pre><code class="language-go other">return true</code></pre>');expect(clean).toContain('class="language-go"');expect(clean).not.toContain('overlay');expect(clean).not.toContain('other');expect(safe(highlightCode(study(clean)))).not.toContain('hljs-');
 const plain=element(highlightCode(study('<pre><code class="language-unknown">return true</code></pre>')));expect(plain.querySelector('span')).toBeNull();expect(plain.querySelector('pre')?.dataset.codeLabel).toBe('Text');
});
it('keeps language and text through plain editing and Markdown export',()=>{
 const original='<pre><code class="language-go">return battery &gt;= 20\n</code></pre>';const editor=new CoreEditor({element:document.createElement('div'),extensions:[StarterKit],content:safe(original)});expect(editor.getHTML()).toContain('language-go');expect(editor.getHTML()).not.toContain('hljs-');editor.commands.insertContentAt(editor.state.doc.content.size,'<p>Edited note.</p>');const output=safe(editor.getHTML());expect(output).toContain('language-go');expect(markdown(output)).toContain('```go\nreturn battery >= 20\n');editor.destroy();
});
it('renders all eight safe diagrams with mobile alternatives and no glossary buttons inside SVG',()=>{
 expect(Object.keys(diagrams)).toHaveLength(8);for(const id of Object.keys(diagrams) as (keyof typeof diagrams)[]){const d=element(annotateTerms(diagramPlaceholder(id),[term('NATS'),term('Canary'),term('Mission ID',['M-105'])]));expect(d.querySelectorAll('svg')).toHaveLength(2);expect(d.querySelector('svg button')).toBeNull();expect(diagramHTML(id)).toBe(diagramHTML(id));}
});
