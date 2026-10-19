// @vitest-environment jsdom
import {expect,it} from 'vitest';
import {searchWorkspace} from './workspaceSearch';
import type {RecordRow,Section} from './types';
const base:Section={kind:'section',title:'Private topic',subtitle:'Read',area:'Reference',order:1,body:'<p>Main.</p>',core:false,minutes:10,archived:false};
const row=(id:string,payload:Partial<Section>):RecordRow=>({id,payload:{...base,...payload},version:2,updated_at:''});
it('searches virtual review blocks through canonical answers without old start metadata',()=>{
 const rows=[row('start',{title:'Old home',subtitle:'Four sessions 4 hours 30 minutes',body:'<p>Extended course.</p>'}),row('review-foundations',{title:'Technical foundations'}),row('question-b-04',{title:'Five years',answer:'<p>My direction.</p>'})];
 const found=searchWorkspace(rows,'Five years');expect(found.map(x=>x.row.id)).toEqual(['review-profile','question-b-04']);
 const home=searchWorkspace(rows,'Final interview')[0];expect(home.row.id).toBe('start');expect((home.row.payload as Section).subtitle).toContain('2 hours 20');expect(home.area).toBe('Final review');
 expect(searchWorkspace(rows,'4 hours 30').map(x=>x.row.id)).toEqual(['full-course']);
 expect(rows[0].payload).toMatchObject({subtitle:'Four sessions 4 hours 30 minutes'});
});
it('opens optional content only when the match is exclusively in that content',()=>{
 const rows=[row('learn-delivery',{body:'<p>Docker image.</p>',deepBody:'<p>Advanced recovery.</p>'})];
 expect(searchWorkspace(rows,'Docker')[0].showDeep).toBe(false);expect(searchWorkspace(rows,'Advanced')[0].showDeep).toBe(true);
});
it('keeps archive search scoped to archived records without virtual active entries',()=>{
 const rows=[row('old-section',{title:'Old note',archived:true})];
 expect(searchWorkspace(rows,'Old')).toEqual([]);expect(searchWorkspace(rows,'Old',true).map(x=>x.row.id)).toEqual(['old-section']);
});
