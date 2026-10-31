import { ACCIDENTALS, beatFrame, createNotePicker, formatTime, spellNote } from '../lib/fretboard';

const root = document.querySelector<HTMLElement>('[data-trainer]')!;
function element<T extends HTMLElement>(id: string) { return root.querySelector<T>(`#${id}`)!; }
const start = element<HTMLButtonElement>('start');
const stop = element<HTMLButtonElement>('stop');
const tempo = element<HTMLInputElement>('tempo');
const duration = element<HTMLSelectElement>('duration');
const notePool = element<HTMLSelectElement>('note-pool');
const modes = element<HTMLFieldSetElement>('mode-options');
const clock = element('session-clock');
const message = element('message');
const phase = element('phase');
const current = element('current-note');
const next = element('next-note');
const cue = element('cue');
const countIn = element('count-in');
const beatElements = Array.from(root.querySelectorAll<HTMLElement>('[data-beat]'));
const countElements = Array.from(root.querySelectorAll<HTMLElement>('[data-count-beat]'));
let state: 'ready' | 'running' | 'paused' | 'finished' = 'ready';
let audio: AudioContext | undefined;
let starting = false;
function makePicker() { return createNotePicker(Math.random, notePool.value === 'accidentals' ? ACCIDENTALS : undefined); }
let pick = makePicker();
let notes = [spellNote(pick()), spellNote(pick())];
let elapsedBefore = 0;
let completedBefore = 0;
let completed = 0;
let displayedRound = 0;
let interval = 1;
let practiceStart = 0;
let endTime = Infinity;
let nextTime = 0;
let index = 0;
let scheduler: ReturnType<typeof setInterval> | undefined;
let animation = 0;
let generation = 0;
type BeatEvent = { time: number; frame: ReturnType<typeof beatFrame> };
let pending: BeatEvent[] = [];
const oscillators = new Set<OscillatorNode>();

function timed() { return root.querySelector<HTMLInputElement>('input[name="mode"]:checked')!.value === 'timed'; }
function limit() { return timed() ? Number(duration.value) : Infinity; }
function noteAt(round: number) {
  while (notes.length <= round) notes.push(spellNote(pick()));
  return notes[round]!;
}
function showNotes(round = 0) {
  if (current.textContent !== noteAt(round)) current.textContent = noteAt(round);
  if (next.textContent !== noteAt(round + 1)) next.textContent = noteAt(round + 1);
}
function resetHighlights() {
  beatElements.forEach(el => { el.classList.remove('active', 'passed'); el.removeAttribute('aria-current'); });
  countElements.forEach(el => el.classList.remove('active'));
}
function settings() {
  const active = state === 'running' || starting;
  tempo.disabled = active;
  modes.disabled = active || state === 'paused';
  duration.disabled = modes.disabled;
  notePool.disabled = modes.disabled;
  element('duration-field').hidden = !timed();
  start.disabled = starting;
  start.textContent = starting ? 'Starting…' : state === 'running' ? 'Pause' : state === 'paused' ? 'Resume practice' : state === 'finished' ? 'Practice again' : 'Start practice';
  stop.disabled = state !== 'running' && state !== 'paused';
}
function progress(now = audio?.currentTime ?? 0) {
  const seconds = state === 'running' ? Math.max(0, Math.min(now, endTime) - practiceStart) : 0;
  const elapsed = elapsedBefore + seconds;
  if (state === 'running') completed = completedBefore + Math.floor((seconds + 0.000001) / (6 * interval));
  clock.textContent = timed() ? `${formatTime(limit() - elapsed)} remaining` : `${formatTime(elapsed)} elapsed`;
  element('completed').textContent = String(completed);
  return elapsed;
}
function cancelPlayback() {
  generation++;
  clearInterval(scheduler);
  cancelAnimationFrame(animation);
  pending = [];
  for (const oscillator of oscillators) {
    try { oscillator.stop(); } catch { /* It may already have ended. */ }
    oscillator.disconnect();
  }
  oscillators.clear();
}
function click(time: number, accent: boolean) {
  const oscillator = audio!.createOscillator();
  const gain = audio!.createGain();
  oscillator.frequency.value = accent ? 1100 : 750;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.22, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
  oscillator.connect(gain);
  gain.connect(audio!.destination);
  oscillators.add(oscillator);
  oscillator.onended = () => { oscillators.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(time);
  oscillator.stop(time + 0.05);
}
function applyBeat({ frame }: BeatEvent) {
  resetHighlights();
  countIn.hidden = !frame.preparing;
  if (frame.preparing) {
    if (phase.textContent !== 'Get ready · 4-beat count-in') phase.textContent = 'Get ready · 4-beat count-in';
    countElements[frame.beat]!.classList.add('active');
    cue.textContent = `Prepare · ${frame.beat + 1} of 4`;
  } else {
    displayedRound = frame.round;
    showNotes(frame.round);
    if (phase.textContent !== 'Playing · one string per click') phase.textContent = 'Playing · one string per click';
    beatElements.forEach((el, i) => {
      el.classList.toggle('passed', i < frame.beat);
      if (i === frame.beat) { el.classList.add('active'); el.setAttribute('aria-current', 'step'); }
    });
    cue.textContent = `Play ${noteAt(frame.round)} · beat ${frame.beat + 1} of 6`;
  }
}
function drain(now: number) {
  while (pending.length && pending[0]!.time <= now) applyBeat(pending.shift()!);
}
function finish() {
  elapsedBefore = progress();
  cancelPlayback();
  state = 'finished';
  resetHighlights();
  countIn.hidden = true;
  phase.textContent = 'Session complete';
  cue.textContent = 'A little practice, often.';
  message.textContent = `${completed} ${completed === 1 ? 'note' : 'notes'} completed across all six strings · ${formatTime(elapsedBefore)} of playing`;
  settings();
}
function pause(reason = 'Your notes are held. Resume with four clicks, then start again on low E.') {
  if (state !== 'running') return;
  const now = audio!.currentTime;
  drain(now);
  elapsedBefore = progress(now);
  completedBefore = completed;
  // A partially played note restarts from low E after resuming.
  notes = notes.slice(displayedRound);
  displayedRound = 0;
  cancelPlayback();
  state = 'paused';
  countIn.hidden = true;
  resetHighlights();
  phase.textContent = 'Paused';
  cue.textContent = 'Take your time.';
  message.textContent = reason;
  settings();
}
function schedule() {
  if (state !== 'running') return;
  const now = audio!.currentTime;
  // Never burst overdue clicks after device sleep or a blocked main thread.
  if (nextTime < now - 0.15) { pause('Timing was interrupted. Resume for a fresh count-in.'); return; }
  try {
    while (nextTime < now + 0.1 && nextTime < endTime - 0.000001) {
      const frame = beatFrame(index++);
      if (!frame.preparing) noteAt(frame.round + 1);
      click(nextTime, frame.beat === 0);
      pending.push({ time: nextTime, frame });
      nextTime += interval;
    }
  } catch {
    pause('Audio could not continue. Check your sound output, then resume.');
  }
}
function render() {
  if (state !== 'running') return;
  const now = audio!.currentTime;
  drain(now);
  progress(now);
  if (now >= endTime) { finish(); return; }
  animation = requestAnimationFrame(render);
}
async function begin() {
  if (starting) return;
  if (state === 'running') { pause(); return; }
  if (document.hidden) return;
  starting = true;
  settings();
  const token = generation;
  try {
    audio ??= new AudioContext();
    await audio.resume();
    if (token !== generation || document.hidden) return;
    if (audio.state !== 'running') throw new Error('Audio unavailable');
    if (state !== 'paused') {
      pick = makePicker();
      notes = [spellNote(pick()), spellNote(pick())];
      elapsedBefore = completedBefore = completed = displayedRound = 0;
    }
    interval = 60 / Number(tempo.value);
    index = 0;
    nextTime = audio.currentTime + 0.1;
    practiceStart = nextTime + 4 * interval;
    endTime = practiceStart + limit() - elapsedBefore;
    state = 'running';
    showNotes();
    resetHighlights();
    countIn.hidden = false;
    phase.textContent = 'Get ready · 4-beat count-in';
    cue.textContent = 'Listen for the first click.';
    message.textContent = '';
    schedule();
    scheduler = setInterval(schedule, 25);
    animation = requestAnimationFrame(render);
  } catch {
    message.textContent = 'Sound could not start. Check your browser’s audio permissions and sound output, then try again.';
  } finally {
    starting = false;
    settings();
  }
}
start.addEventListener('click', begin);
stop.addEventListener('click', finish);
tempo.addEventListener('input', () => { element('tempo-output').textContent = tempo.value; });
root.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', () => { settings(); progress(); }));
duration.addEventListener('change', () => progress());
notePool.addEventListener('change', () => {
  pick = makePicker();
  notes = [spellNote(pick()), spellNote(pick())];
  showNotes();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (starting) generation++;
    pause('Paused while you were away. Resume for a fresh count-in.');
  }
});
window.addEventListener('pagehide', () => {
  pause();
  cancelPlayback();
  if (audio) { audio.onstatechange = null; void audio.close(); audio = undefined; }
});
// If the browser or operating system interrupts sound, practice must pause too.
root.addEventListener('click', () => {
  if (audio && !audio.onstatechange) audio.onstatechange = () => {
    if (audio?.state !== 'running') pause('Audio was interrupted. Resume when sound is available.');
  };
});
showNotes();
settings();
progress();
