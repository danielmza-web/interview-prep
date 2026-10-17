import {describe,it,expect} from 'vitest';
import {backup,parseBackup,resolveDraft} from './types';
import type {RecordRow,Practice} from './types';
const p:Practice={kind:'practice',note:'observation',response:'my answer',completed:false};
const r:RecordRow={id:'practice_example',payload:p,version:3,updated_at:'2026-10-17'};
describe('portable backup',()=>{
 it('retains notes and stable identifiers',()=>expect(parseBackup(JSON.stringify(backup([r])))).toEqual([r]));
 it('rejects repeated IDs before importing anything',()=>expect(()=>parseBackup(JSON.stringify(backup([r,r])))).toThrow(/repeated/));
 it('rejects invalid bodies and paths',()=>expect(()=>parseBackup(JSON.stringify(backup([{...r,id:'../../escape'}])))).toThrow());
 it('rejects incompatible versions',()=>expect(()=>parseBackup('{"format":"fieldnotes","schema":2,"records":[]}')).toThrow());
});
describe('cross-device recovery',()=>{
 it('saves only against the version the draft was based on',()=>expect(resolveDraft(r,{payload:{...p,note:'next'},expected:3,stamp:'a'})).toBe('save'));
 it('detects a stale draft instead of overwriting another device',()=>expect(resolveDraft({...r,version:4},{payload:{...p,note:'next'},expected:3,stamp:'a'})).toBe('conflict'));
 it('recognizes a successful write whose response was lost',()=>expect(resolveDraft({...r,version:4},{payload:p,expected:3,stamp:'a'})).toBe('already-saved'));
 it('detects concurrent first creation',()=>expect(resolveDraft(r,{payload:{...p,note:'next'},expected:0,stamp:'a'})).toBe('conflict'));
});
