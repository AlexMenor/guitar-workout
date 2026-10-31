export type Mode = 'major' | 'minor';
export type Quality = 'major' | 'minor' | 'diminished';
export type Direction = 'forward' | 'reverse' | 'progression';
export interface Key { id: string; tonic: string; mode: Mode }
export interface Chord { root: string; quality: Quality; numeral: string; notes: string[] }
export interface Card { id: string; key: Key; direction: Direction; degrees: number[] }
export interface Review { streak: number; due: number; attempts: number; correct: number }
export type Reviews = Record<string, Review>;
export interface Preferences { mode: 'both' | Mode; kind: 'single' | 'progression' | 'mixed'; reverse: boolean }
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const PITCHES = [0, 2, 4, 5, 7, 9, 11];
const INTERVALS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const NUMERALS = { major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], minor: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] };
const QUALITIES: Record<Mode, Quality[]> = { major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'], minor: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'] };
const TONICS = { major: ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'F', 'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭'], minor: ['A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'D', 'G', 'C', 'F', 'B♭', 'E♭', 'A♭'] };
export const KEYS: Key[] = (['major', 'minor'] as const).flatMap(mode => TONICS[mode].map(tonic => ({ id: `${mode}:${tonic}`, mode, tonic })));
export function keyName(key: Key) { return `${key.tonic} ${key.mode === 'major' ? 'major' : 'natural minor'}`; }
export function pitch(note: string) {
  const i = LETTERS.indexOf(note[0]!);
  if (i < 0) throw new Error(`Invalid note: ${note}`);
  return (PITCHES[i]! + (note.includes('♯') ? 1 : note.includes('♭') ? -1 : 0) + 12) % 12;
}
export function scale(key: Key) {
  const start = LETTERS.indexOf(key.tonic[0]!);
  return INTERVALS[key.mode].map((interval, degree) => {
    const letter = (start + degree) % 7;
    let offset = (pitch(key.tonic) + interval - PITCHES[letter]! + 12) % 12;
    if (offset > 6) offset -= 12;
    return LETTERS[letter]! + (offset > 0 ? '♯'.repeat(offset) : '♭'.repeat(-offset));
  });
}
export function chord(key: Key, degree: number): Chord {
  const notes = scale(key);
  return { root: notes[degree]!, quality: QUALITIES[key.mode][degree]!, numeral: NUMERALS[key.mode][degree]!, notes: [notes[degree]!, notes[(degree + 2) % 7]!, notes[(degree + 4) % 7]!] };
}
export function chordName(value: Pick<Chord, 'root' | 'quality'>) { return `${value.root} ${value.quality}`; }
export function makeCards(preferences: Preferences): Card[] {
  return KEYS.filter(key => preferences.mode === 'both' || key.mode === preferences.mode).flatMap(key => {
    const cards: Card[] = [];
    if (preferences.kind !== 'progression') {
      for (let degree = 0; degree < 7; degree++) {
        for (const direction of (preferences.reverse ? ['forward', 'reverse'] : ['forward']) as Direction[]) {
          cards.push({ id: `${key.id}:${direction}:${degree}`, key, direction, degrees: [degree] });
        }
      }
    }
    if (preferences.kind !== 'single') {
      const patterns = key.mode === 'major' ? [[1, 4, 0], [0, 3, 4], [0, 5, 3, 4]] : [[0, 3, 4], [0, 5, 6], [5, 6, 0]];
      for (const degrees of patterns) cards.push({ id: `${key.id}:progression:${degrees.join('-')}`, key, direction: 'progression', degrees });
    }
    return cards;
  });
}
export function reviewAnswer(previous: Review | undefined, correct: boolean, now: number): Review {
  const streak = correct ? (previous?.streak ?? 0) + 1 : 0;
  const days = [1, 3, 7, 14, 30, 60][Math.min(streak - 1, 5)] ?? 0;
  return { streak, due: correct ? now + days * 86400000 : now, attempts: (previous?.attempts ?? 0) + 1, correct: (previous?.correct ?? 0) + Number(correct) };
}

// Prefer due reviews, then unseen cards; mastered cards remain available for extra practice.
export function chooseCard(cards: Card[], reviews: Reviews, seen: Set<string>, now: number, random = Math.random) {
  const available = cards.filter(card => !seen.has(card.id));
  const pool = available.length ? available : cards;
  const due = pool.filter(card => reviews[card.id] && reviews[card.id]!.due <= now);
  const unseen = pool.filter(card => !reviews[card.id]);
  const candidates = due.length ? due : unseen.length ? unseen : pool;
  return candidates[Math.floor(random() * candidates.length)]!;
}
