import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, scale } from '../src/lib/harmony.ts';
import { PRIORITY } from '../src/lib/circle.ts';
import {
 INTERVALS, intervalAnswer, notePitch, relativeAnswer, relationshipAnswer,
 relationshipDeck, createRelationshipRound, readRelationshipPreferences,
} from '../src/lib/intervals.ts';
const key=(tonic,mode)=>KEYS.find(k=>k.tonic===tonic&&k.mode===mode);

test('the focused intervals are ascending perfect fourths and fifths, with correct letter spelling',()=>{
 assert.deepEqual(INTERVALS.map(i=>i.semitones),[5,7]);
 const letters=['C','D','E','F','G','A','B'];
 for(const tonic of new Set(KEYS.map(k=>k.tonic))) for(const interval of INTERVALS){
  const answer=intervalAnswer(tonic,interval);
  assert.equal((answer.pitch-notePitch(tonic)+12)%12,interval.semitones);
  assert.equal(notePitch(answer.spelling),answer.pitch);
  assert.equal((letters.indexOf(answer.spelling[0])-letters.indexOf(tonic[0])+7)%7,interval.steps);
 }
 assert.equal(intervalAnswer('C♭',INTERVALS[0]).spelling,'F♭');
 assert.equal(intervalAnswer('A♯',INTERVALS[1]).spelling,'E♯');
 assert.equal(intervalAnswer('F♯',INTERVALS[1]).spelling,'C♯');
 assert.equal(intervalAnswer('G♭',INTERVALS[1]).spelling,'D♭');
});
test('relative major/minor pairs preserve their key signature and round-trip across all standard keys',()=>{
 for(const source of KEYS){
  const answer=relativeAnswer(source),relative=key(answer.spelling,answer.mode);
  assert(relative,`${source.id} has a standard relative key`);
  assert.notEqual(answer.mode,source.mode);
  assert.deepEqual([...scale(source)].sort(),[...scale(relative)].sort());
  const back=relativeAnswer(relative);assert.equal(back.spelling,source.tonic);assert.equal(back.mode,source.mode);
 }
 assert.equal(relativeAnswer(key('E','major')).spelling,'C♯');
 assert.equal(relativeAnswer(key('B','minor')).spelling,'D');
 assert.equal(relativeAnswer(key('D','minor')).spelling,'F');
 assert.equal(relativeAnswer(key('C♭','major')).spelling,'A♭');
});
test('common scope uses exactly the nine requested source keys and deduplicates mode-independent notes',()=>{
 const deck=relationshipDeck({scope:'common',practice:'mixed'});
 assert.deepEqual(deck.filter(c=>c.kind==='relative').map(c=>c.key.id).sort(),[...PRIORITY].sort());
 for(const kind of ['fourth','fifth']){
  const notes=deck.filter(c=>c.kind===kind).map(c=>c.tonic).sort();
  assert.deepEqual(notes,['A','B','C','D','E','G']);
 }
 assert.equal(deck.length,21);
 // Scope filters starting keys, not answers: E major must still lead to C sharp minor.
 const answer=relationshipAnswer(deck.find(c=>c.id==='relative:major:E'));
 assert.equal(answer.label,'C♯ minor');
});
test('all keys include enharmonic signatures and every source tonic spelling',()=>{
 const deck=relationshipDeck({scope:'all',practice:'mixed'});
 assert.equal(deck.filter(c=>c.kind==='relative').length,30);
 for(const tonic of new Set(KEYS.map(k=>k.tonic)))for(const kind of ['fourth','fifth']){
  assert(deck.some(c=>c.kind===kind&&c.tonic===tonic));
 }
 for(const id of ['relative:major:B','relative:major:C♭','relative:major:F♯','relative:major:G♭','relative:major:C♯','relative:major:D♭']) assert(deck.some(c=>c.id===id));
});
test('rounds balance mixed questions, never duplicate a card, and cover each pool before recycling',()=>{
 for(const scope of ['common','all'])for(const practice of ['mixed','relative','fourth','fifth'])for(const random of [()=>0,()=>0.999,Math.random]){
  const prefs={scope,practice},deck=relationshipDeck(prefs),seen=new Set(),visited={relative:[],fourth:[],fifth:[]};
  for(let n=0;n<10;n++){
   const round=createRelationshipRound(prefs,seen,random);
   assert.equal(round.length,Math.min(12,deck.length));
   assert.equal(new Set(round.map(c=>c.id)).size,round.length);
   assert(round.every(c=>deck.some(d=>d.id===c.id)));
   if(practice==='mixed')for(const kind of ['relative','fourth','fifth'])assert.equal(round.filter(c=>c.kind===kind).length,4);
   for(const c of round)visited[c.kind].push(c.id);
  }
  for(const kind of ['relative','fourth','fifth']){
   const size=deck.filter(c=>c.kind===kind).length;
   assert.equal(new Set(visited[kind].slice(0,size)).size,size);
  }
 }
});
test('dropdown preferences validate stored values and default to common mixed practice',()=>{
 for(const raw of [null,'broken','null','{}','{"scope":"anything","practice":"Major 7th"}'])assert.deepEqual(readRelationshipPreferences(raw),{scope:'common',practice:'mixed'});
 assert.deepEqual(readRelationshipPreferences('{"scope":"all","practice":"relative"}'),{scope:'all',practice:'relative'});
});
