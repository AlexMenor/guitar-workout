import { KEYS, scale, type Key, type Mode } from './harmony.ts';
import { PRIORITY } from './circle.ts';

export const INTERVALS = [
  { name: 'Perfect 4th', steps: 3, semitones: 5 },
  { name: 'Perfect 5th', steps: 4, semitones: 7 },
] as const;
export type Interval = typeof INTERVALS[number];
export type QuestionKind = 'relative' | 'fourth' | 'fifth';
export interface RelationshipPreferences { scope: 'common' | 'all'; practice: 'mixed' | QuestionKind }
export type RelationshipCard =
  | { id: string; kind: 'relative'; tonic: string; key: Key }
  | { id: string; kind: 'fourth' | 'fifth'; tonic: string };
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const PITCHES = [0, 2, 4, 5, 7, 9, 11];
export function notePitch(note: string) {
  const letter = LETTERS.indexOf(note[0]!);
  if (letter < 0) throw new Error(`Invalid note ${note}`);
  const offset = [...note.slice(1)].reduce((sum, accidental) => sum + (accidental === '♯' ? 1 : accidental === '♭' ? -1 : 0), 0);
  return (PITCHES[letter]! + offset + 24) % 12;
}
export function intervalAnswer(tonic: string, interval: Interval) {
  const letter = (LETTERS.indexOf(tonic[0]!) + interval.steps) % 7;
  const pitch = (notePitch(tonic) + interval.semitones) % 12;
  let accidental = (pitch - PITCHES[letter]! + 12) % 12;
  if (accidental > 6) accidental -= 12;
  return { pitch, spelling: LETTERS[letter]! + (accidental > 0 ? '♯'.repeat(accidental) : '♭'.repeat(-accidental)) };
}
export function relativeAnswer(key: Key) {
  const mode: Mode = key.mode === 'major' ? 'minor' : 'major';
  const spelling = scale(key)[key.mode === 'major' ? 5 : 2]!;
  return { spelling, pitch: notePitch(spelling), mode };
}
export function relationshipAnswer(card: RelationshipCard) {
  if (card.kind === 'relative') {
    const answer = relativeAnswer(card.key);
    return {
      ...answer,
      label: `${answer.spelling} ${answer.mode}`,
      explanation: `${card.tonic} ${card.key.mode} and ${answer.spelling} ${answer.mode} share the same key signature. ${card.key.mode === 'major' ? 'The relative minor starts on scale note 6.' : 'The relative major starts on scale note 3 of natural minor.'}`,
    };
  }
  const interval = INTERVALS[card.kind === 'fourth' ? 0 : 1];
  const answer = intervalAnswer(card.tonic, interval);
  return {
    ...answer,
    label: answer.spelling,
    explanation: `${card.tonic} → ${answer.spelling}: up ${interval.semitones} semitones. One step ${card.kind === 'fourth' ? 'anticlockwise' : 'clockwise'} on the circle of fifths.`,
  };
}
export function relationshipDeck(preferences: RelationshipPreferences): RelationshipCard[] {
  const keys = KEYS.filter(key => preferences.scope === 'all' || PRIORITY.includes(key.id));
  const cards: RelationshipCard[] = [];
  if (preferences.practice === 'mixed' || preferences.practice === 'relative') {
    cards.push(...keys.map(key => ({ id: `relative:${key.id}`, kind: 'relative' as const, tonic: key.tonic, key })));
  }
  // A fourth/fifth above a note is independent of mode. Do not double-count shared tonics.
  const tonics = [...new Set(keys.map(key => key.tonic))];
  for (const kind of ['fourth', 'fifth'] as const) {
    if (preferences.practice === 'mixed' || preferences.practice === kind) {
      cards.push(...tonics.map(tonic => ({ id: `${kind}:${tonic}`, kind, tonic })));
    }
  }
  return cards;
}
// Balance mixed rounds and exhaust each question pool before recycling it across rounds.
export function createRelationshipRound(preferences: RelationshipPreferences, seen = new Set<string>(), random = Math.random) {
  const deck = relationshipDeck(preferences);
  const kinds: QuestionKind[] = preferences.practice === 'mixed' ? ['relative', 'fourth', 'fifth'] : [preferences.practice];
  const round: RelationshipCard[] = [];
  const inRound = new Set<string>();
  const size = Math.min(12, deck.length);
  for (let index = 0; index < size; index++) {
    const kind = kinds[index % kinds.length]!;
    const pool = deck.filter(card => card.kind === kind && !inRound.has(card.id));
    let available = pool.filter(card => !seen.has(card.id));
    if (!available.length) {
      for (const card of deck.filter(card => card.kind === kind)) seen.delete(card.id);
      available = pool;
    }
    const card = available[Math.floor(random() * available.length)]!;
    round.push(card); inRound.add(card.id); seen.add(card.id);
  }
  return round;
}
export function readRelationshipPreferences(raw: string | null): RelationshipPreferences {
  const preferences: RelationshipPreferences = { scope: 'common', practice: 'mixed' };
  try {
    const saved = JSON.parse(raw ?? 'null');
    if (saved?.scope === 'common' || saved?.scope === 'all') preferences.scope = saved.scope;
    if (['mixed', 'relative', 'fourth', 'fifth'].includes(saved?.practice)) preferences.practice = saved.practice;
  } catch { /* Malformed saved preferences fall back to the common keys. */ }
  return preferences;
}
