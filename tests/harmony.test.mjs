import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, chord, makeCards, scale, pitch, reviewAnswer, chooseCard } from '../src/lib/harmony.ts';
const key=(tonic,mode)=>KEYS.find(k=>k.tonic===tonic&&k.mode===mode);
test('every standard major and minor key has seven correctly spelled notes and triads',()=>{
 assert.equal(KEYS.length,30);
 for(const k of KEYS){
  const notes=scale(k); assert.equal(new Set(notes.map(n=>n[0])).size,7);
  for(let degree=0;degree<7;degree++){
   const c=chord(k,degree),root=pitch(c.root);
   const intervals=c.notes.map(n=>(pitch(n)-root+12)%12);
   assert.deepEqual(intervals,c.quality==='major'?[0,4,7]:c.quality==='minor'?[0,3,7]:[0,3,6],`${k.id} ${c.numeral}`);
  }
 }
});
test('key signatures retain E sharp, C flat, and minor v rather than harmonic-minor V',()=>{
 assert.equal(chord(key('D','major'),1).root,'E');assert.equal(chord(key('D','major'),1).quality,'minor');
 assert.deepEqual(scale(key('F♯','major')),['F♯','G♯','A♯','B','C♯','D♯','E♯']);
 assert.deepEqual(scale(key('C♭','major')),['C♭','D♭','E♭','F♭','G♭','A♭','B♭']);
 assert.deepEqual(chord(key('A','minor'),4),{root:'E',quality:'minor',numeral:'v',notes:['E','G','B']});
});
test('all material is available immediately and reverse questions are optional',()=>{
 const base={mode:'both',kind:'mixed',reverse:false};const cards=makeCards(base);
 assert.equal(cards.length,300);assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
 assert(!cards.some(c=>c.direction==='reverse'));
 assert.equal(makeCards({...base,reverse:true}).length,510);
 assert(makeCards({mode:'minor',kind:'progression',reverse:true}).every(c=>c.key.mode==='minor'&&c.direction==='progression'));
});
test('misses become due immediately and successful reviews expand across days',()=>{
 const now=1000;let review=reviewAnswer(undefined,false,now);assert.equal(review.due,now);assert.equal(review.streak,0);
 review=reviewAnswer(review,true,now);assert.equal(review.due,now+86400000);
 review=reviewAnswer(review,true,now);assert.equal(review.due,now+3*86400000);
 review=reviewAnswer(review,false,now);assert.equal(review.streak,0);assert.equal(review.attempts,4);assert.equal(review.correct,2);
});
test('due cards precede unseen cards, and seen cards wait until the pool is exhausted',()=>{
 const cards=makeCards({mode:'major',kind:'single',reverse:false}).slice(0,3);const reviews={[cards[1].id]:{due:100,streak:0,attempts:1,correct:0}};
 assert.equal(chooseCard(cards,reviews,new Set(),100,()=>0).id,cards[1].id);
 assert.equal(chooseCard(cards,reviews,new Set([cards[1].id]),100,()=>0).id,cards[0].id);
});
