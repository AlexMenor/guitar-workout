import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FAMILIES, NODES, PRIORITY, getKey, familyKeys, nodeFor, degreeAt, shortChord, numberLabel, questionDeck} from '../src/lib/circle.ts';
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
test('all stages produce answerable cards with both number directions and full scale order',()=>{
  for(let index=0;index<FAMILIES.length;index++)for(let stage=0;stage<5;stage++) {
    const keys=familyKeys(index),deck=questionDeck(keys,stage);
    assert(deck.length>0);assert.equal(new Set(deck.map(q=>q.id)).size,deck.length);
    for(const q of deck)for(const target of q.targets) assert(target==='dim'||NODES.some(n=>n.id===target));
    if(stage===2)assert(deck.every(q=>q.targets.length===6&&!q.targets.includes('dim')));
    if(stage===3){assert.equal(deck.length,28);assert.equal(deck.filter(q=>q.kind==='reverse').length,14);}
    if(stage===4)for(const q of deck)assert.deepEqual(q.targets,Array.from({length:7},(_,i)=>nodeFor(q.key,i)));
  }
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
    for(let stage=0;stage<5;stage++)assert.equal(questionDeck([a,b],stage).length,stage===3?28:stage===0?4:2);
  }
  assert.equal(nodeLabel(getKey('major:F♯'),'minor:B♭'),'A♯m');
  assert.equal(nodeLabel(getKey('major:G♭'),'minor:B♭'),'B♭m');
  assert.equal(nodeLabel(getKey('minor:C♯'),'major:E'),'E');
});
