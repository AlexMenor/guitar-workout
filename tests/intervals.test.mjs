import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERVALS, intervalAnswer, createIntervalRound, notePitch } from '../src/lib/intervals.ts';
const interval=name=>INTERVALS.find(i=>i.name===name);
test('exactly the ten requested intervals, without unison or tritone',()=>{
 assert.equal(INTERVALS.length,10);assert.deepEqual(INTERVALS.map(i=>i.semitones),[1,2,3,4,5,7,8,9,10,11]);
});
test('rounds keep one interval and visit each pitch exactly once',()=>{
 for(const random of [Math.random,()=>0,()=>0.999]){
  let previous;
  for(let n=0;n<100;n++){
   const r=createIntervalRound(previous,random);assert.equal(r.tonics.length,12);assert.equal(new Set(r.tonics.map(notePitch)).size,12);
   assert.notEqual(r.interval.name,previous);previous=r.interval.name;
  }
 }
});
test('answers retain diatonic spelling, including double accidentals',()=>{
 assert.deepEqual(intervalAnswer('A♭',interval('Minor 6th')),{pitch:4,spelling:'F♭'});
 assert.deepEqual(intervalAnswer('C♯',interval('Major 7th')),{pitch:0,spelling:'B♯'});
 assert.deepEqual(intervalAnswer('G♭',interval('Minor 2nd')),{pitch:7,spelling:'A♭♭'});
 assert.deepEqual(intervalAnswer('G♯',interval('Major 7th')),{pitch:7,spelling:'F♯♯'});
});
test('every answer has the correct pitch distance and letter distance',()=>{
 const letters=['C','D','E','F','G','A','B'];
 for(const root of ['C','C♯','D♭','D','D♯','E♭','E','F','F♯','G♭','G','G♯','A♭','A','A♯','B♭','B'])for(const i of INTERVALS){
  const a=intervalAnswer(root,i);assert.equal((a.pitch-notePitch(root)+12)%12,i.semitones);
  assert.equal(notePitch(a.spelling),a.pitch);assert.equal((letters.indexOf(a.spelling[0])-letters.indexOf(root[0])+7)%7,i.steps);
 }
});
