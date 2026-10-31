import { chord, chordName, chooseCard, keyName, makeCards, pitch, reviewAnswer, scale, type Card, type Preferences, type Reviews } from '../lib/harmony';
const root = document.querySelector<HTMLElement>('[data-harmony]')!;
function el<T extends HTMLElement = HTMLElement>(id: string) { return root.querySelector<T>(`#${id}`)!; }
const mode = el<HTMLSelectElement>('scale-mode');
const kind = el<HTMLSelectElement>('question-kind');
const reverse = el<HTMLInputElement>('reverse-mode');
const form = el<HTMLFormElement>('answer-form');
const storageKey = 'guitar-workout:harmony:v1';
let reviews: Reviews = {};
let storageAvailable = true;
let answered = 0;
let correctCount = 0;
let card: Card;
let step = 0;
let cardCorrect = true;
let awaitingNext = false;
let seen = new Set<string>();
let retries: { at: number; card: Card }[] = [];
let cards: Card[] = [];
function preferences(): Preferences { return { mode: mode.value as Preferences['mode'], kind: kind.value as Preferences['kind'], reverse: reverse.checked }; }
function storageWarning() { el('storage-message').textContent = storageAvailable ? 'Review progress is saved on this device, including offline.' : 'Storage is unavailable. You can practice, but progress will only last for this visit.'; }
try {
  const raw = localStorage.getItem(storageKey);
  let saved;
  try { saved = JSON.parse(raw ?? 'null'); } catch { /* Ignore malformed saved data; new answers replace it. */ }
  if (saved?.version === 1) {
    if (saved.reviews && typeof saved.reviews === 'object' && !Array.isArray(saved.reviews)) {
      for (const [id, value] of Object.entries(saved.reviews)) {
        const v = value as Record<string, unknown> | null;
        if (v && ['streak', 'due', 'attempts', 'correct'].every(k => typeof v[k] === 'number' && Number.isFinite(v[k]) && (v[k] as number) >= 0)) reviews[id] = v as unknown as Reviews[string];
      }
    }
    if (['both', 'major', 'minor'].includes(saved.preferences?.mode)) mode.value = saved.preferences.mode;
    if (['single', 'progression', 'mixed'].includes(saved.preferences?.kind)) kind.value = saved.preferences.kind;
    reverse.checked = saved.preferences?.reverse === true;
  }
} catch { storageAvailable = false; }
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, reviews, preferences: preferences() })); storageAvailable = true; }
  catch { storageAvailable = false; }
  storageWarning();
}
function updateProgress() {
  el('question-progress').textContent = `Question ${Math.min(answered + 1, 10)} of 10`;
  const due = cards.filter(c => reviews[c.id] && reviews[c.id]!.due <= Date.now()).length;
  el('review-status').textContent = due ? `${due} due for review` : 'All keys available';
}
function clearAnswer() {
  form.reset();
  el('feedback').hidden = true;
  form.hidden = false;
  el('answer-error').textContent = '';
  awaitingNext = false;
}
function renderQuestion(focus = false) {
  clearAnswer();
  el('key-name').textContent = keyName(card.key);
  const value = chord(card.key, card.degrees[step]!);
  const backward = card.direction === 'reverse';
  el('root-field').hidden = backward;
  el('quality-field').hidden = backward;
  el('degree-field').hidden = !backward;
  el('recall-hint').textContent = backward ? 'Recall its degree, then choose the Roman numeral.' : 'Think of the chord first, then enter your answer.';
  el('question-prompt').textContent = backward ? `${chordName(value)} is which chord?` : card.direction === 'progression' ? 'Build this progression.' : `What is the ${value.numeral} chord?`;
  const slots = el('progression-slots');
  slots.replaceChildren();
  slots.hidden = card.direction !== 'progression';
  if (!slots.hidden) {
    card.degrees.forEach((degree, i) => {
      const span = document.createElement('span');
      span.textContent = i < step ? chordName(chord(card.key, degree)) : chord(card.key, degree).numeral;
      span.className = i === step ? 'active' : i < step ? 'done' : '';
      if (i === step) span.setAttribute('aria-current', 'step');
      slots.append(span);
    });
    el('recall-hint').textContent = `Chord ${step + 1} of ${card.degrees.length}: enter ${value.numeral}.`;
  }
  const degrees = el('degree-options');
  degrees.replaceChildren();
  if (backward) {
    for (let i = 0; i < 7; i++) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'degree'; input.value = String(i);
      const span = document.createElement('span'); span.textContent = chord(card.key, i).numeral;
      label.append(input, span); degrees.append(label);
    }
  }
  updateProgress();
  if (focus) el('question-prompt').focus();
}
function nextCard(focus = false) {
  const retry = retries.findIndex(r => r.at <= answered);
  if (retry >= 0) card = retries.splice(retry, 1)[0]!.card;
  else card = chooseCard(cards, reviews, seen, Date.now());
  seen.add(card.id);
  step = 0; cardCorrect = true;
  renderQuestion(focus);
}
function showFeedback(revealed = false) {
  if (awaitingNext) return;
  const expected = chord(card.key, card.degrees[step]!);
  const data = new FormData(form);
  const backward = card.direction === 'reverse';
  if (!revealed && (backward ? !data.has('degree') : !data.has('root') || !data.has('quality'))) {
    el('answer-error').textContent = backward ? 'Choose a chord degree.' : 'Choose a root note and chord quality.';
    return;
  }
  const selectedRoot = `${data.get('root') ?? ''}${data.get('accidental') ?? ''}`;
  const right = !revealed && (backward ? Number(data.get('degree')) === card.degrees[step] : pitch(selectedRoot) === pitch(expected.root) && data.get('quality') === expected.quality);
  const alternateSpelling = right && !backward && selectedRoot !== expected.root;
  cardCorrect &&= right;
  awaitingNext = true;
  form.hidden = true;
  el('feedback').hidden = false;
  el('feedback-title').textContent = right ? alternateSpelling ? `Correct pitch — ${chordName(expected)}` : `Correct — ${backward ? expected.numeral : chordName(expected)}` : `${revealed ? 'Answer' : 'Not quite'} — ${backward ? expected.numeral : chordName(expected)}`;
  const degree = card.degrees[step]!;
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
  el('feedback-reason').textContent = `${expected.root} is the ${ordinals[degree]} note of ${keyName(card.key)}. The ${expected.numeral} chord is ${expected.quality}.${alternateSpelling ? ` ${selectedRoot} sounds the same, but this key spells it ${expected.root}.` : ''}`;
  el('feedback-notes').textContent = `Chord tones: ${expected.notes.join(' · ')}.`;
  const explanation = el('scale-explanation'); explanation.replaceChildren();
  scale(card.key).forEach((note, i) => {
    const item = document.createElement('span');
    if (i === degree) item.className = 'highlight';
    const numeral = document.createElement('small'); numeral.textContent = chord(card.key, i).numeral;
    item.append(numeral, document.createTextNode(note)); explanation.append(item);
  });
  const lastStep = step === card.degrees.length - 1;
  el('next-question').textContent = !lastStep ? 'Next chord' : answered === 9 ? 'Finish session' : 'Next question';
  if (lastStep) {
    reviews[card.id] = reviewAnswer(reviews[card.id], cardCorrect, Date.now());
    persist();
  }
  el('feedback-title').focus();
}
function completeQuestion() {
  if (!awaitingNext) return;
  if (step < card.degrees.length - 1) { step++; renderQuestion(true); return; }
  answered++;
  if (cardCorrect) correctCount++;
  else retries.push({ at: answered + 3, card });
  if (answered < 10) nextCard(true);
  else {
    el('question-panel').hidden = true;
    el('session-summary').hidden = false;
    el('question-progress').textContent = '10 questions complete';
    el('summary-score').textContent = `${correctCount} of 10 correct without revealing an answer. Progressions count when every chord is correct.`;
    const due = cards.filter(c => reviews[c.id] && reviews[c.id]!.due <= Date.now()).length;
    el('summary-review').textContent = due ? `${due} ${due === 1 ? 'question is' : 'questions are'} ready to revisit. Missed questions return sooner; correct answers are spaced across later days.` : 'Correct answers will return on later days. You can keep practicing now, too.';
    el('summary-title').focus();
  }
}
function newSession() {
  answered = correctCount = 0; seen = new Set(); retries = [];
  reverse.disabled = kind.value === 'progression';
  cards = makeCards(preferences());
  el('question-panel').hidden = false;
  el('session-summary').hidden = true;
  nextCard();
}
form.addEventListener('submit', event => { event.preventDefault(); showFeedback(); });
el('reveal-answer').addEventListener('click', () => showFeedback(true));
el('next-question').addEventListener('click', completeQuestion);
el('practice-again').addEventListener('click', newSession);
for (const setting of [mode, kind, reverse]) setting.addEventListener('change', () => { persist(); newSession(); });
newSession();
storageWarning();
