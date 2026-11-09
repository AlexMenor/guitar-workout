import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FAMILIES, NODES, PRIORITY, getKey, familyKeys, nodeFor, degreeAt, shortChord, numberLabel} from '../src/lib/circle.ts';
import {chord, pitch} from '../src/lib/harmony.ts';
test('priority keys and supporting relatives all map to three adjacent circle columns plus diminished',()=>{
  for(let index=0;index<FAMILIES.length;index++) {
    const keys=familyKeys(index);
    const majorIndex=NODES.find(n=>n.id===keys[0].id).index;
    for(const key of keys) {
      const ids=Array.from({length:7},(_,i)=>nodeFor(key,i));
      assert.equal(new Set(ids).size,7);
      assert.equal(ids.filter(id=>id==='dim').length,1);
      for(let degree=0;degree<7;degree++) {
        assert.equal(degreeAt(key,ids[degree]),degree);
        const node=NODES.find(n=>n.id===ids[degree]);
        if(node){assert([11,0,1].includes((node.index-majorIndex+12)%12));assert.equal(pitch(node.tonic),pitch(chord(key,degree).root));}
      }
    }
    assert.deepEqual(keys.map(k=>Array.from({length:7},(_,i)=>nodeFor(k,i)).sort())[0],keys.map(k=>Array.from({length:7},(_,i)=>nodeFor(k,i)).sort())[1]);
  }
  for(const id of PRIORITY) assert(getKey(id));
});
test('the same visual position changes degree between relative major and minor',()=>{
  const g=getKey('major:G'),em=getKey('minor:E');
  assert.equal(degreeAt(g,'major:C'),3);assert.equal(degreeAt(em,'major:C'),5);
  assert.equal(numberLabel(g,3),'4 · IV');assert.equal(numberLabel(em,5),'6 · VI');
  assert.equal(nodeFor(g,6),'dim');assert.equal(nodeFor(em,1),'dim');
  assert.equal(shortChord(g,6),'F♯dim');assert.equal(shortChord(em,4),'Bm');
});
test('D minor is spelled with B flat and uses a minor v',()=>{
  assert.deepEqual(Array.from({length:7},(_,i)=>shortChord(getKey('minor:D'),i)),['Dm','Edim','F','Gm','Am','B♭','C']);
});
test('enharmonic spellings share a single circle position with correctly spelled chord labels', async()=>{
  const {circleNode,nodeLabel,nodeAliases}=await import('../src/lib/circle.ts');
  for(const [first,second] of [['major:B','major:C♭'],['major:F♯','major:G♭'],['major:C♯','major:D♭'],['minor:G♯','minor:A♭'],['minor:D♯','minor:E♭'],['minor:A♯','minor:B♭']]) {
    const a=getKey(first),b=getKey(second);
    assert.equal(circleNode(a).id,circleNode(b).id);
    assert.equal(nodeAliases(circleNode(a).id).length,2);
    for(let degree=0;degree<7;degree++){
      assert.equal(nodeFor(a,degree),nodeFor(b,degree));
      assert.equal(nodeLabel(a,nodeFor(a,degree)),shortChord(a,degree));
      assert.equal(nodeLabel(b,nodeFor(b,degree)),shortChord(b,degree));
    }
  }
  assert.equal(nodeLabel(getKey('major:F♯'),'minor:B♭'),'A♯m');
  assert.equal(nodeLabel(getKey('major:G♭'),'minor:B♭'),'B♭m');
  assert.equal(nodeLabel(getKey('minor:C♯'),'major:E'),'E');
});

const {makeRound, makeRebuild, answerChoices, hiddenDegrees, hiddenCount, learnedCount, readProgress, recallId} = await import('../src/lib/circle.ts');
test('two rounds train every chord in both directions before introducing diminished',()=>{
  for(const id of PRIORITY){
    const key=getKey(id), first=makeRound(key,0,false,()=>0.25), second=makeRound(key,1,false,()=>0.75);
    assert.equal(first.length,6); assert.equal(second.length,6);
    assert.equal(new Set([...first,...second].map(c=>c.id)).size,12);
    assert.equal(first.filter(c=>c.kind==='name').length,3);
    assert.equal(first.filter(c=>c.kind==='number').length,3);
    assert(first.every(c=>chord(key,c.degree).quality!=='diminished'));
    const complete=makeRound(key,2,true);
    assert.equal(complete.length,7);assert(complete.some(c=>chord(key,c.degree).quality==='diminished'));
    assert.deepEqual(makeRebuild(key,true).map(c=>c.degree),[0,1,2,3,4,5,6]);
  }
});
test('answer choices always contain exactly one correct answer and two distinct alternatives',()=>{
  for(const id of PRIORITY)for(let round=0;round<2;round++)for(const card of makeRound(getKey(id),round,true)){
    const choices=answerChoices(card);
    const expected=card.kind==='name'?shortChord(card.key,card.degree):String(card.degree+1);
    assert.equal(choices.length,3);assert.equal(new Set(choices).size,3);assert(choices.includes(expected));
    if(card.kind==='name'&&chord(card.key,card.degree).quality==='diminished') assert(choices.every(c=>c.endsWith('dim')));
  }
});
test('fading starts with the target, increases on unaided recall, and backs off after misses',()=>{
  const key=getKey('major:C'),reviews={};
  assert.equal(hiddenCount(key,reviews),1);
  const cards=[...makeRound(key,0),...makeRound(key,1)];
  const success={streak:1,attempts:1,correct:1,due:1000};
  for(const card of cards.slice(0,4))reviews[card.id]={...success};
  assert.equal(hiddenCount(key,reviews),3);
  for(const card of cards) reviews[card.id]={...success};
  assert.equal(hiddenCount(key,reviews),6);assert.equal(learnedCount(key,reviews),12);
  for(const card of cards.slice(0,9))reviews[card.id].streak=0;
  assert.equal(hiddenCount(key,reviews),1);
  for(const card of cards)for(const count of [1,3,6]){
    const hidden=hiddenDegrees(card,count,false,()=>0.5);
    assert.equal(hidden.size,count);assert(hidden.has(card.degree));
  }
});
test('old, corrupt, or unavailable saved data starts a fresh trainer without trusting invalid progress',()=>{
  for(const raw of [null,'invalid','null','{"version":1,"family":5}','{"version":2,"keyId":"major:invalid","rounds":{"major:C":-1}}']){
    const data=readProgress(raw);assert.equal(data.keyId,'major:C');assert.deepEqual(data.rounds,{});
  }
  const key=getKey('minor:D'), id=recallId(key,2,'number');
  const data=readProgress(JSON.stringify({version:2,keyId:key.id,reviews:{[id]:{streak:2,due:123,correct:2,attempts:3},bad:{streak:-1}},rounds:{[key.id]:2},builds:{[key.id]:1}}));
  assert.equal(data.keyId,key.id);assert.equal(data.reviews[id].streak,2);assert(!data.reviews.bad);
  assert.equal(data.builds[key.id],1);assert.equal(data.rounds[key.id],2);
});
