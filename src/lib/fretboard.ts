export const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NOTES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

export function spellNote(pitch: number, random: () => number = Math.random) {
  return (random() < 0.5 ? NOTES : FLAT_NOTES)[pitch]!;
}
export const STRINGS = ['Low E', 'A', 'D', 'G', 'B', 'High E'];

// A shuffled deck visits all twelve pitch classes before drawing a fresh deck.
export function createNotePicker(random: () => number = Math.random) {
  let deck: number[] = [];
  let previous = -1;
  return () => {
    if (!deck.length) {
      deck = Array.from({ length: 12 }, (_, i) => i);
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [deck[i], deck[j]] = [deck[j]!, deck[i]!];
      }
      if (deck[deck.length - 1] === previous) {
        [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1]!, deck[0]!];
      }
    }
    previous = deck.pop()!;
    return previous;
  };
}

export function beatFrame(index: number) {
  return index < 4
    ? { preparing: true, beat: index, round: 0 }
    : { preparing: false, beat: (index - 4) % 6, round: Math.floor((index - 4) / 6) };
}

export function formatTime(seconds: number) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
