import { sessionSettings, questionEntrance } from '../lib/practice-ui';
import { ROOT_OPTIONS, chord, chordName, chooseCard, keyName, makeCards, pitch, reviewAnswer, scale, type Card, type Preferences, type Reviews } from '../lib/harmony';
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
let sessionSize = 10;
let retryDeck: Card[] | null = null;
let missed = new Map<string, Card>();
function readPreferences(): Preferences { return { mode: mode.value as Preferences['mode'], kind: kind.value as Preferences['kind'], reverse: reverse.checked }; }
let activePreferences: Preferences;
function preferences() { return activePreferences; }
function storageWarning() { el('storage-message').textContent = storageAvailable ? 'Review progress saved on this device.' : 'Storage is unavailable. You can practice, but progress will only last for this visit.'; }
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
    if (['common', 'both', 'major', 'minor'].includes(saved.preferences?.mode)) mode.value = saved.preferences.mode;
    if (['single', 'progression', 'mixed'].includes(saved.preferences?.kind)) kind.value = saved.preferences.kind;
    reverse.checked = saved.preferences?.reverse === true;
  }
} catch { storageAvailable = false; }
activePreferences = readPreferences();
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, reviews, preferences: preferences() })); storageAvailable = true; }
  catch { storageAvailable = false; }
  storageWarning();
}
function updateProgress() {
  el('question-progress').textContent = `${retryDeck ? 'Retry' : 'Question'} ${Math.min(answered + 1, sessionSize)} of ${sessionSize}`;
  const due = cards.filter(c => reviews[c.id] && reviews[c.id]!.due <= Date.now()).length;
  el('review-status').textContent = due ? `${due} due for review` : `${correctCount} correct`;
}
function clearAnswer() {
  form.reset();
  el('feedback').hidden = true;
  form.hidden = false;
  for (const input of form.querySelectorAll<HTMLInputElement>('input')) input.disabled = false;
  for (const label of form.querySelectorAll('label')) label.classList.remove('correct', 'incorrect');
  el('check-answer').hidden = false;
  el('reveal-answer').hidden = false;
  el('next-question').hidden = true;
  el<HTMLDetailsElement>('chord-explanation').open = false;
  el('answer-error').textContent = '';
  awaitingNext = false;
}
function renderQuestion(focus = false) {
  clearAnswer();
  el('key-name').textContent = keyName(card.key);
  const value = chord(card.key, card.degrees[step]!);
  const backward = card.direction === 'reverse';
  el('root-field').hidden = backward;
  el('degree-field').hidden = !backward;
  el('recall-hint').textContent = backward ? 'Recall its degree, then choose the Roman numeral.' : 'Choose the root. The numeral gives the quality.';
  const symbol = document.createElement('span');
  symbol.className = `question-symbol${backward ? ' long-symbol' : ''}`;
  symbol.textContent = backward ? `${value.root}${value.quality === 'minor' ? 'm' : value.quality === 'diminished' ? 'dim' : ''}` : value.numeral;
  const question = document.createElement('span'); question.className = 'question-text';
  question.textContent = backward ? 'Which degree is this chord?' : card.direction === 'progression' ? 'Find this chord’s root.' : 'Which root builds this chord?';
  el('question-prompt').replaceChildren(symbol, document.createTextNode(' '), question);
  questionEntrance(el('question-prompt'));
  const slots = el('progression-slots');
  slots.replaceChildren();
  slots.hidden = card.direction !== 'progression';
  if (!slots.hidden) {
    card.degrees.forEach((degree, i) => {
      const span = document.createElement('span');
      span.textContent = degree === 0 || i < step ? chordName(chord(card.key, degree)) : chord(card.key, degree).numeral;
      span.className = i === step ? 'active' : degree === 0 || i < step ? 'done' : '';
      if (i === step) span.setAttribute('aria-current', 'step');
      slots.append(span);
    });
    el('recall-hint').textContent = 'Build the progression. Tonic chords are filled in.';
  }
  const degrees = el('degree-options');
  degrees.replaceChildren();
  if (backward) {
    for (let i = 1; i < 7; i++) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'degree'; input.value = String(i);
      const span = document.createElement('span'); span.textContent = chord(card.key, i).numeral;
      label.append(input, span); degrees.append(label);
    }
  }
  updateProgress();
  if (focus) el('question-prompt').focus({ preventScroll: true });
}
function nextCard(focus = false) {
  const retry = retries.findIndex(r => r.at <= answered);
  if (retryDeck) card = retryDeck[answered]!;
  else if (retry >= 0) card = retries.splice(retry, 1)[0]!.card;
  else card = chooseCard(cards, reviews, seen, Date.now());
  seen.add(card.id);
  step = card.degrees.findIndex(degree => degree !== 0); cardCorrect = true;
  renderQuestion(focus);
}
function showFeedback(revealed = false) {
  if (awaitingNext) return;
  const expected = chord(card.key, card.degrees[step]!);
  const data = new FormData(form);
  const backward = card.direction === 'reverse';
  if (!revealed && (backward ? !data.has('degree') : !data.has('root'))) {
    el('answer-error').textContent = backward ? 'Choose a chord degree.' : 'Choose a root note.';
    return;
  }
  const selectedRoot = String(data.get('root') ?? '');
  const right = !revealed && (backward ? Number(data.get('degree')) === card.degrees[step] : pitch(selectedRoot) === pitch(expected.root));
  const alternateSpelling = right && !backward && !ROOT_OPTIONS.find(notes => notes[0] === selectedRoot)?.includes(expected.root);
  cardCorrect &&= right;
  awaitingNext = true;
  for (const input of form.querySelectorAll<HTMLInputElement>('input')) {
    const expectedInput = backward ? input.name === 'degree' && Number(input.value) === card.degrees[step] : input.name === 'root' && pitch(input.value) === pitch(expected.root);
    input.closest('label')?.classList.toggle('correct', expectedInput);
    input.closest('label')?.classList.toggle('incorrect', input.checked && !expectedInput);
    input.disabled = true;
  }
  el('check-answer').hidden = true;
  el('reveal-answer').hidden = true;
  el('next-question').hidden = false;
  el('feedback').hidden = false;
  el('feedback').dataset.correct = String(right);
  el('feedback-short').textContent = right ? 'Keep the connection in mind.' : revealed ? 'Take a moment, then try the next one.' : 'The correct answer is highlighted above.';
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
  const lastStep = !card.degrees.slice(step + 1).some(degree => degree !== 0);
  el('next-question').textContent = !lastStep ? 'Next chord' : answered === sessionSize - 1 ? (retryDeck ? 'Finish retry' : 'Finish round') : 'Next question';
  if (lastStep) {
    reviews[card.id] = reviewAnswer(reviews[card.id], cardCorrect, Date.now());
    persist();
  }
  el('next-question').focus({ preventScroll: true });
}
function completeQuestion() {
  if (!awaitingNext) return;
  const nextStep = card.degrees.findIndex((degree, i) => i > step && degree !== 0);
  if (nextStep >= 0) { step = nextStep; renderQuestion(true); return; }
  answered++;
  if (cardCorrect) correctCount++;
  else {
    missed.set(card.id, card);
    if (!retryDeck) retries.push({ at: answered + 3, card });
  }
  awaitingNext = false;
  if (answered < sessionSize) nextCard(true);
  else {
    el('question-panel').hidden = true;
    el('session-summary').hidden = false;
    el('question-progress').textContent = `${sessionSize} ${sessionSize === 1 ? 'question' : 'questions'} complete`;
    el('summary-title').textContent = retryDeck ? 'Retry complete.' : 'Round complete.';
    const retryButton = el<HTMLButtonElement>('retry-missed');
    retryButton.hidden = missed.size === 0;
    retryButton.textContent = `Retry ${missed.size} missed ${missed.size === 1 ? 'question' : 'questions'}`;
    el('summary-score').textContent = `${correctCount} of ${sessionSize} correct without revealing an answer. Progressions count when every requested root note is correct.`;
    const due = cards.filter(c => reviews[c.id] && reviews[c.id]!.due <= Date.now()).length;
    el('summary-misses').textContent = missed.size ? `Revisit: ${Array.from(missed.values()).map(c => `${keyName(c.key)} (${c.degrees.filter(d => d !== 0).map(d => chord(c.key, d).numeral).join('–')})`).join(' · ')}.` : 'Every root recalled. A good connection to build on.';
    el('summary-review').textContent = due ? `${due} ${due === 1 ? 'question is' : 'questions are'} ready to revisit. Missed questions return sooner; correct answers are spaced across later days.` : 'Correct answers will return on later days. You can keep practicing now, too.';
    el('summary-title').focus();
  }
}
function newSession() {
  answered = correctCount = 0; seen = new Set(); retries = [];
  sessionSize = 10; retryDeck = null; missed = new Map();
  reverse.disabled = activePreferences.kind === 'progression';
  cards = makeCards(preferences());
  el('question-panel').hidden = false;
  el('session-summary').hidden = true;
  nextCard();
}
form.addEventListener('submit', event => { event.preventDefault(); showFeedback(); });
el('reveal-answer').addEventListener('click', () => showFeedback(true));
el('next-question').addEventListener('click', completeQuestion);
el('practice-again').addEventListener('click', newSession);
el('retry-missed').addEventListener('click', () => {
  if (!missed.size) return;
  retryDeck = Array.from(missed.values());
  sessionSize = retryDeck.length;
  missed = new Map();
  answered = correctCount = 0;
  retries = [];
  el('question-panel').hidden = false;
  el('session-summary').hidden = true;
  nextCard(true);
});
reverse.disabled = activePreferences.kind === 'progression';
sessionSettings(el<HTMLDetailsElement>('chord-settings'), () => `${activePreferences.mode === 'common' ? 'Common keys' : activePreferences.mode === 'both' ? 'All keys' : activePreferences.mode === 'major' ? 'Major keys' : 'Minor keys'} · ${activePreferences.kind === 'mixed' ? 'Chords + progressions' : activePreferences.kind === 'single' ? 'Single chords' : 'Progressions'}${activePreferences.reverse && activePreferences.kind !== 'progression' ? ' · Both directions' : ''}`, () => { activePreferences = readPreferences(); persist(); newSession(); });
kind.addEventListener('change', () => { reverse.disabled = kind.value === 'progression'; });
root.addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if ((event.target as HTMLElement).closest('button, summary, a, details.session-settings[open]')) return;
  event.preventDefault(); if (awaitingNext) completeQuestion(); else if (!el('question-panel').hidden) showFeedback();
});
newSession();
storageWarning();
