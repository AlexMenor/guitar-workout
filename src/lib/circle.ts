import { KEYS, chord, pitch, type Key } from './harmony.ts';
export const FAMILIES = [
  ['C', 'A'], ['G', 'E'], ['D', 'B'], ['F', 'D'], ['A', 'F♯'], ['E', 'C♯'],
] as const;
export const PRIORITY = ['major:C','major:G','major:D','major:A','major:E','minor:A','minor:E','minor:B','minor:D'];
export const STAGES = ['Circle neighbours', 'Relative pairs', 'Six-chord families', 'Chord numbers', 'Recall the whole key'];
const MAJOR = ['C','G','D','A','E','B','F♯','D♭','A♭','E♭','B♭','F'];
const MAJOR_ALIASES: Record<number, string> = {5:'C♭', 6:'G♭', 7:'C♯'};
const MINOR_ALIASES: Record<number, string> = {5:'A♭', 6:'E♭', 7:'A♯'};
const MINOR = ['A','E','B','F♯','C♯','G♯','D♯','B♭','F','C','G','D'];
export const NODES = MAJOR.flatMap((tonic, index) => [
  { id: `major:${tonic}`, tonic, aliases: [tonic, ...(MAJOR_ALIASES[index] ? [MAJOR_ALIASES[index]!] : [])], mode: 'major' as const, index },
  { id: `minor:${MINOR[index]}`, tonic: MINOR[index]!, aliases: [MINOR[index]!, ...(MINOR_ALIASES[index] ? [MINOR_ALIASES[index]!] : [])], mode: 'minor' as const, index },
]);
export function getKey(id: string): Key { return KEYS.find(k => k.id === id)!; }
// A circle position represents pitch and quality; spelling belongs to the key.
export function circleNode(key: Key) {
  return NODES.find(n => n.mode === key.mode && pitch(n.tonic) === pitch(key.tonic))!;
}
export function nodeLabel(key: Key, nodeId: string) {
  const degree = degreeAt(key, nodeId);
  if (degree !== undefined) return shortChord(key, degree);
  const node = NODES.find(n => n.id === nodeId)!;
  return node.aliases.map(note => note + (node.mode === 'minor' ? 'm' : '')).join(' / ');
}
export function nodeAliases(nodeId: string) {
  const node = NODES.find(n => n.id === nodeId);
  return node?.aliases.map(note => note + (node.mode === 'minor' ? 'm' : '')) ?? [];
}
export function familyKeys(index: number) {
  const pair = FAMILIES[index]!;
  return [getKey(`major:${pair[0]}`), getKey(`minor:${pair[1]}`)];
}
export function nodeFor(key: Key, degree: number) {
  const c = chord(key, degree);
  if (c.quality === 'diminished') return 'dim';
  return NODES.find(n => n.mode === c.quality && pitch(n.tonic) === pitch(c.root))!.id;
}
export function degreeAt(key: Key, nodeId: string) {
  return Array.from({length:7}, (_, i) => i).find(i => nodeFor(key, i) === nodeId);
}
export function shortChord(key: Key, degree: number) {
  const c = chord(key, degree);
  return c.root + (c.quality === 'minor' ? 'm' : c.quality === 'diminished' ? 'dim' : '');
}
export function numberLabel(key: Key, degree: number) {
  const c = chord(key, degree);
  return `${degree + 1}${c.quality === 'minor' ? 'm' : c.quality === 'diminished' ? '°' : ''} · ${c.numeral}`;
}
export interface CircleQuestion { id: string; key: Key; kind: 'neighbour' | 'relative' | 'family' | 'forward' | 'reverse' | 'whole'; degree: number; targets: string[]; clockwise?: boolean }
export function questionDeck(keys: Key[], stage: number): CircleQuestion[] {
  return keys.flatMap<CircleQuestion>(key => {
    const base = {key, degree:0};
    if (stage === 0) {
      const node = circleNode(key);
      return [true, false].map(clockwise => ({...base, id:`${key.id}:neighbour:${clockwise}`, kind:'neighbour' as const, clockwise, targets:[NODES.find(n => n.mode === key.mode && n.index === (node.index + (clockwise ? 1 : 11)) % 12)!.id]}));
    }
    if (stage === 1) {
      const node = circleNode(key);
      return [{...base, id:`${key.id}:relative`, kind:'relative' as const, targets:[NODES.find(n => n.index === node.index && n.mode !== node.mode)!.id]}];
    }
    if (stage === 2 || stage === 4) return [{...base, id:`${key.id}:${stage === 2 ? 'family' : 'whole'}`, kind:stage === 2 ? 'family' as const : 'whole' as const, targets:Array.from({length:7},(_,i)=>i).filter(i=>stage === 4 || chord(key,i).quality !== 'diminished').map(i=>nodeFor(key,i))}];
    return Array.from({length:7},(_,degree) => ['forward','reverse'].map(kind => ({key,degree,kind:kind as 'forward'|'reverse',id:`${key.id}:${kind}:${degree}`,targets:[nodeFor(key,degree)]}))).flat();
  });
}
