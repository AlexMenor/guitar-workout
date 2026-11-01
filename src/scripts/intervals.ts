import { createIntervalRound, intervalAnswer } from '../lib/intervals';
const root = document.querySelector<HTMLElement>('[data-intervals]')!;
function el(id: string) { return root.querySelector<HTMLElement>(`#${id}`)!; }
const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-pitch]'));
let round = createIntervalRound();
let index = 0;
let score = 0;
let answered = false;
let timer: ReturnType<typeof setTimeout> | undefined;
function render() {
  answered = false;
  el('interval-tonic').textContent = round.tonics[index]!;
  el('interval-progress').textContent = `${index + 1} / 12`;
  el('interval-score').textContent = `${score} correct`;
  el('interval-feedback').textContent = '';
  el('interval-feedback').classList.remove('wrong');
  for (const button of buttons) {
    button.disabled = false;
    button.classList.remove('correct', 'incorrect');
    button.removeAttribute('aria-label');
  }
}
function advance() {
  if (!answered) return;
  index++;
  if (index < 12) render();
  else {
    answered = false;
    el('interval-round').hidden = true;
    el('interval-summary').hidden = false;
    el('interval-summary-score').textContent = `${score} / 12 correct`;
    el('interval-summary-name').textContent = `${round.interval.name} · all 12 tonics`;
    el('interval-summary-title').focus();
  }
}
function scheduleAdvance() {
  clearTimeout(timer);
  if (answered && !document.hidden) timer = setTimeout(advance, el('interval-feedback').classList.contains('wrong') ? 1500 : 900);
}
for (const button of buttons) button.addEventListener('click', () => {
  if (answered) return;
  answered = true;
  const expected = intervalAnswer(round.tonics[index]!, round.interval);
  const correct = Number(button.dataset.pitch) === expected.pitch;
  if (correct) score++;
  for (const option of buttons) {
    option.disabled = true;
    if (Number(option.dataset.pitch) === expected.pitch) {
      option.classList.add('correct');
      option.setAttribute('aria-label', `${option.textContent} — correct answer: ${expected.spelling}`);
    }
  }
  if (!correct) button.classList.add('incorrect');
  el('interval-feedback').classList.toggle('wrong', !correct);
  el('interval-feedback').textContent = correct ? `Correct — ${expected.spelling}` : `Not quite — ${expected.spelling}`;
  el('interval-score').textContent = `${score} correct`;
  scheduleAdvance();
});
el('interval-again').addEventListener('click', () => {
  clearTimeout(timer);
  round = createIntervalRound(round.interval.name);
  index = score = 0;
  el('interval-name').textContent = round.interval.name;
  el('interval-summary').hidden = true;
  el('interval-round').hidden = false;
  render();
  buttons[0]!.focus({ preventScroll: true });
});
document.addEventListener('visibilitychange', scheduleAdvance);
window.addEventListener('pagehide', () => clearTimeout(timer));
window.addEventListener('pageshow', scheduleAdvance);
el('interval-name').textContent = round.interval.name;
render();
