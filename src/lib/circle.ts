import { KEYS, chord, pitch, type Key, type Reviews } from './harmony.ts';
export const FAMILIES = [
  ['C', 'A'], ['G', 'E'], ['D', 'B'], ['A', 'F♯'], ['E', 'C♯'], ['F', 'D'],
] as const;
export const PRIORITY = ['major:C','major:G','major:D','major:A','major:E','minor:A','minor:E','minor:B','minor:D'];
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
export type RecallKind = 'name' | 'number';
export interface RecallCard { id: string; key: Key; degree: number; kind: RecallKind }
export interface LearningProgress {
  version: 2;
  keyId: string;
  reviews: Reviews;
  rounds: Record<string, number>;
  builds: Record<string, number>;
}
export function recallId(key: Key, degree: number, kind: RecallKind) {
  return `${key.id}:${kind}:${degree}`;
}
export function degreesFor(key: Key, includeDiminished = false) {
  return Array.from({ length: 7 }, (_, i) => i)
    .filter(i => includeDiminished || chord(key, i).quality !== 'diminished');
}
export function learnedCount(key: Key, reviews: Reviews, includeDiminished = false) {
  return degreesFor(key, includeDiminished).reduce((count, degree) => count +
    (['name', 'number'] as const).filter(kind => (reviews[recallId(key, degree, kind)]?.streak ?? 0) > 0).length, 0);
}
export function hiddenCount(key: Key, reviews: Reviews) {
  const learned = learnedCount(key, reviews);
  return learned >= 10 ? 6 : learned >= 4 ? 3 : 1;
}
export function shuffled<T>(items: readonly T[], random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
// Every round visits every chord. Consecutive rounds reverse the direction for each chord.
export function makeRound(key: Key, round: number, includeDiminished = false, random = Math.random): RecallCard[] {
  const cards = degreesFor(key, includeDiminished).map((degree, index) => {
    const kind: RecallKind = (index + round) % 2 === 0 ? 'name' : 'number';
    return { id: recallId(key, degree, kind), key, degree, kind };
  });
  const names = shuffled(cards.filter(c => c.kind === 'name'), random);
  const numbers = shuffled(cards.filter(c => c.kind === 'number'), random);
  const result: RecallCard[] = [];
  while (names.length || numbers.length) {
    if (names.length) result.push(names.shift()!);
    if (numbers.length) result.push(numbers.shift()!);
  }
  return result;
}
export function makeRebuild(key: Key, includeDiminished = false): RecallCard[] {
  return degreesFor(key, includeDiminished).map(degree => ({
    id: recallId(key, degree, 'name'), key, degree, kind: 'name',
  }));
}
export function answerChoices(card: RecallCard, random = Math.random) {
  const expected = card.kind === 'name' ? shortChord(card.key, card.degree) : String(card.degree + 1);
  const sameQuality = degreesFor(card.key, true).filter(i => i !== card.degree && chord(card.key, i).quality === chord(card.key, card.degree).quality);
  let distractors: string[];
  if (card.kind === 'number') {
    const others = sameQuality.length >= 2 ? sameQuality : degreesFor(card.key, true).filter(i => i !== card.degree);
    distractors = shuffled(others, random).slice(0, 2).map(i => String(i + 1));
  } else if (sameQuality.length >= 2) {
    distractors = shuffled(sameQuality, random).slice(0, 2).map(i => shortChord(card.key, i));
  } else {
    // Test the diminished root too: a generic "diminished" button would give it away.
    distractors = shuffled(degreesFor(card.key), random).slice(0, 2).map(i => `${chord(card.key, i).root}dim`);
  }
  return shuffled([expected, ...distractors], random);
}
export function hiddenDegrees(card: RecallCard, count: number, includeDiminished: boolean, random = Math.random) {
  return new Set([card.degree, ...shuffled(degreesFor(card.key, includeDiminished).filter(i => i !== card.degree), random).slice(0, count - 1)]);
}
export function readProgress(raw: string | null): LearningProgress {
  const fresh: LearningProgress = { version: 2, keyId: 'major:C', reviews: {}, rounds: {}, builds: {} };
  try {
    const data = JSON.parse(raw ?? 'null');
    if (data?.version !== 2) return fresh;
    const validKeys = FAMILIES.flatMap((_, i) => familyKeys(i)).map(k => k.id);
    if (validKeys.includes(data.keyId)) fresh.keyId = data.keyId;
    if (data.reviews && typeof data.reviews === 'object' && !Array.isArray(data.reviews)) {
      for (const [id, value] of Object.entries(data.reviews)) {
        const v = value as Record<string, unknown> | null;
        if (v && ['streak', 'due', 'attempts', 'correct'].every(k => typeof v[k] === 'number' && Number.isFinite(v[k]) && (v[k] as number) >= 0)) fresh.reviews[id] = v as unknown as Reviews[string];
      }
    }
    for (const field of ['rounds', 'builds'] as const) {
      if (!data[field] || typeof data[field] !== 'object') continue;
      for (const id of validKeys) {
        const count = data[field][id];
        if (Number.isSafeInteger(count) && count >= 0) fresh[field][id] = count;
      }
    }
  } catch { /* Corrupt storage does not prevent practice. */ }
  return fresh;
}
