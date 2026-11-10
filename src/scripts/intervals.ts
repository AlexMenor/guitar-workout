import {
  createRelationshipRound, relationshipAnswer, readRelationshipPreferences,
  type RelationshipPreferences, type RelationshipCard,
} from '../lib/intervals';
const root = document.querySelector<HTMLElement>('[data-intervals]')!;
const el = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
const scope = el<HTMLSelectElement>('interval-scope');
const practice = el<HTMLSelectElement>('interval-practice');
const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-pitch]'));
const storageKey = 'guitar-workout:relationships:v1';
let raw: string | null = null;
try { raw = localStorage.getItem(storageKey); } catch { /* Storage is optional. */ }
const saved = readRelationshipPreferences(raw);
scope.value = saved.scope; practice.value = saved.practice;
let round: RelationshipCard[] = [];
let seen = new Set<string>();
let missed: RelationshipCard[] = [];
let retry = false;
let index = 0;
let score = 0;
let answered = false;
function preferences(): RelationshipPreferences {
  return { scope: scope.value as RelationshipPreferences['scope'], practice: practice.value as RelationshipPreferences['practice'] };
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(preferences())); el('interval-storage').textContent = ''; }
  catch { el('interval-storage').textContent = 'Practice works, but this browser cannot save your dropdown choices.'; }
}
function render(moveFocus = false) {
  answered = false;
  const card = round[index]!;
  const relative = card.kind === 'relative';
  el('interval-tonic').textContent = card.tonic;
  el('interval-source-label').textContent = relative ? 'STARTING KEY' : 'STARTING NOTE';
  el('interval-mode').textContent = relative ? card.key.mode : '';
  el('interval-mode').hidden = !relative;
  el('interval-kind').textContent = relative ? 'RELATIVE KEY' : 'ASCENDING INTERVAL';
  el('interval-prompt').textContent = relative
    ? `What is the relative ${card.key.mode === 'major' ? 'minor' : 'major'} of ${card.tonic} ${card.key.mode}?`
    : `What is a perfect ${card.kind} above ${card.tonic}?`;
  el('interval-answer-label').textContent = relative ? `Choose the tonic of the relative ${card.key.mode === 'major' ? 'minor' : 'major'} key` : 'Choose the note';
  el('interval-progress').textContent = `${retry ? 'Retry' : 'Question'} ${index + 1} / ${round.length}`;
  el('interval-score').textContent = `${score} correct`;
  el('interval-feedback').replaceChildren();
  el('interval-feedback').classList.remove('wrong');
  el('interval-next').hidden = true;
  for (const button of buttons) {
    button.disabled = false;
    button.classList.remove('correct', 'incorrect');
    button.removeAttribute('aria-label');
  }
  if (moveFocus) el('interval-prompt').focus({ preventScroll: true });
}
function start(retryQuestions: RelationshipCard[] = []) {
  retry = retryQuestions.length > 0;
  round = retry ? [...retryQuestions] : createRelationshipRound(preferences(), seen);
  index = score = 0; missed = [];
  el('interval-summary').hidden = true;
  el('interval-round').hidden = false;
  el('interval-scope-note').textContent = scope.value === 'common'
    ? 'Starting keys: E, A, D, G, C major · Em, Am, Bm, Dm. Fourths/fifths use their six distinct tonic notes: C, D, E, G, A, B.'
    : 'All 15 standard major and 15 natural-minor key signatures, including both spellings of enharmonic keys. Fourths/fifths cover every tonic spelling used in those keys.';
  render();
}
function advance() {
  if (!answered) return;
  if (++index < round.length) render(true);
  else {
    answered = false;
    el('interval-round').hidden = true;
    el('interval-summary').hidden = false;
    el('interval-summary-title').textContent = retry ? 'Retry complete.' : 'Round complete.';
    el('interval-summary-score').textContent = `${score} / ${round.length} correct`;
    el('interval-summary-name').textContent = retry ? 'Keep connecting each starting note or key with its answer.' : 'New rounds continue through the selected keys before repeating them within each question type.';
    el('interval-retry').hidden = !missed.length;
    el('interval-retry').textContent = `Retry ${missed.length} missed ${missed.length === 1 ? 'answer' : 'answers'}`;
    el('interval-summary-title').focus({ preventScroll: true });
  }
}
for (const button of buttons) button.addEventListener('click', () => {
  if (answered) return;
  answered = true;
  const card = round[index]!;
  const expected = relationshipAnswer(card);
  const correct = Number(button.dataset.pitch) === expected.pitch;
  if (correct) score++; else missed.push(card);
  for (const option of buttons) {
    option.disabled = true;
    if (Number(option.dataset.pitch) === expected.pitch) {
      option.classList.add('correct');
      option.setAttribute('aria-label', `${option.textContent} — correct answer: ${expected.label}`);
    }
  }
  if (!correct) button.classList.add('incorrect');
  el('interval-feedback').classList.toggle('wrong', !correct);
  const heading = document.createElement('strong'); heading.textContent = `${correct ? 'Correct' : 'Not quite'} — ${expected.label}`;
  const explanation = document.createElement('p'); explanation.textContent = expected.explanation;
  el('interval-feedback').replaceChildren(heading, explanation);
  el('interval-score').textContent = `${score} correct`;
  el('interval-next').hidden = false;
  el('interval-next').textContent = index === round.length - 1 ? 'Finish round →' : 'Next question →';
  el('interval-next').focus({ preventScroll: true });
});
el('interval-next').addEventListener('click', advance);
el('interval-again').addEventListener('click', () => { start(); el('interval-prompt').focus({ preventScroll: true }); });
el('interval-retry').addEventListener('click', () => { start(missed); el('interval-prompt').focus({ preventScroll: true }); });
for (const setting of [scope, practice]) setting.addEventListener('change', () => {
  seen = new Set(); persist(); start();
});
start(); persist();
