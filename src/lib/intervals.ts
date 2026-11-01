import { ROOT_OPTIONS } from './harmony.ts';
export const INTERVALS = [
  { name: 'Minor 2nd', steps: 1, semitones: 1 },
  { name: 'Major 2nd', steps: 1, semitones: 2 },
  { name: 'Minor 3rd', steps: 2, semitones: 3 },
  { name: 'Major 3rd', steps: 2, semitones: 4 },
  { name: 'Perfect 4th', steps: 3, semitones: 5 },
  { name: 'Perfect 5th', steps: 4, semitones: 7 },
  { name: 'Minor 6th', steps: 5, semitones: 8 },
  { name: 'Major 6th', steps: 5, semitones: 9 },
  { name: 'Minor 7th', steps: 6, semitones: 10 },
  { name: 'Major 7th', steps: 6, semitones: 11 },
] as const;
export type Interval = typeof INTERVALS[number];
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
export function createIntervalRound(previousName?: string, random: () => number = Math.random) {
  const available = INTERVALS.filter(interval => interval.name !== previousName);
  const interval = available[Math.floor(random() * available.length)]!;
  const pitches = Array.from({ length: 12 }, (_, i) => i);
  for (let i = pitches.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pitches[i], pitches[j]] = [pitches[j]!, pitches[i]!];
  }
  const tonics = pitches.map(pitch => {
    const spellings = ROOT_OPTIONS[pitch]!;
    return spellings[Math.floor(random() * spellings.length)]!;
  });
  return { interval, tonics };
}
