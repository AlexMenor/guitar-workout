import {
  FAMILIES, NODES, getKey, familyKeys, circleNode, nodeFor, shortChord,
  degreesFor, learnedCount, hiddenCount, makeRound, makeRebuild, answerChoices,
  hiddenDegrees, readProgress, type RecallCard,
} from '../lib/circle';
import { chord, reviewAnswer, type Key, type Mode } from '../lib/harmony';

const root = document.querySelector<HTMLElement>('[data-circle]')!;
const el = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
const svgEl = <T extends SVGElement = SVGElement>(id: string) => root.querySelector<T>(`#${id}`)!;
const storageKey = 'guitar-workout:circle:v2';
let stored: string | null = null;
try { stored = localStorage.getItem(storageKey); } catch { /* Practice works without storage. */ }
const progress = readProgress(stored);
let key = getKey(progress.keyId);
let phase: 'study' | 'practice' | 'feedback' | 'summary' = 'study';
let cards: RecallCard[] = [];
let index = 0;
let score = 0;
let rebuild = false;
let includeDim = false;
let hideCount = 1;
let masked = new Set<number>();
let filled = new Set<number>();
let peeked = false;
let picked = '';
let options: string[] = [];
let feedback = '';
let studyMessage = '';
let summaryAction: 'practice' | 'rebuild' | 'seventh' | 'next-key' = 'practice';
let retryCards: RecallCard[] = [];
let missed: RecallCard[] = [];

function familyIndex() { return FAMILIES.findIndex((_, i) => familyKeys(i).some(k => k.id === key.id)); }
function keyLabel(value: Key) { return `${value.tonic} ${value.mode}`; }
function dimUnlocked() { return (progress.builds[key.id] ?? 0) > 0; }
function persist() {
  progress.keyId = key.id;
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
    el('storage').textContent = 'Your learning is saved on this device.';
  } catch {
    el('storage').textContent = 'Practice works, but this browser cannot save your learning between visits.';
  }
}
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}
function position(node: typeof NODES[number]) {
  const radius = node.mode === 'major' ? 242 : 155;
  const angle = node.index * Math.PI / 6 - Math.PI / 2;
  return { x: 300 + radius * Math.cos(angle), y: 300 + radius * Math.sin(angle) };
}
function visibleFields(degree: number) {
  const card = cards[index];
  const studying = phase === 'study' || phase === 'summary';
  const revealed = studying || peeked || (phase === 'feedback' && degree === card?.degree) || (rebuild && filled.has(degree));
  const hidden = !revealed && masked.has(degree);
  return {
    number: hidden && card?.kind === 'number' ? '?' : String(degree + 1),
    name: hidden && card?.kind === 'name' ? '?' : shortChord(key, degree),
    target: !studying && degree === card?.degree,
  };
}
function renderCircle() {
  const activeDegrees = degreesFor(key, includeDim);
  const activeNodes = activeDegrees.map(degree => nodeFor(key, degree));
  const guides = svgEl('circle-guides');
  const nodes = svgEl('circle-chords');
  guides.replaceChildren(); nodes.replaceChildren();
  for (const node of NODES) {
    const p = position(node);
    if (!activeNodes.includes(node.id)) guides.append(svg('circle', { cx: p.x, cy: p.y, r: 4, class: 'orbit-dot' }));
    if (node.mode === 'major' && activeNodes.includes(node.id)) {
      const inner = NODES.find(n => n.index === node.index && n.mode === 'minor')!;
      const q = position(inner);
      guides.append(svg('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: 'family-link' }));
    }
  }
  const descriptions: string[] = [];
  for (const degree of activeDegrees) {
    const id = nodeFor(key, degree);
    const fields = visibleFields(degree);
    const description = `Chord ${fields.number}: ${fields.name === '?' ? 'missing name' : fields.name}${fields.target ? ', current question' : ''}`;
    descriptions.push(description);
    if (id === 'dim') {
      const number = document.createElement('span'); number.className = 'dim-number'; number.textContent = fields.number;
      const name = document.createElement('span'); name.textContent = fields.name;
      const caption = document.createElement('small'); caption.textContent = 'diminished';
      el('diminished').replaceChildren(number, name, caption);
      el('diminished').classList.toggle('target', fields.target);
      el('diminished').setAttribute('aria-label', description);
      continue;
    }
    const node = NODES.find(n => n.id === id)!;
    const p = position(node);
    const classes = ['chord-node', node.mode];
    if (degree === 0) classes.push('home');
    if (fields.target) classes.push('target');
    const group = svg('g', { class: classes.join(' '), transform: `translate(${p.x}, ${p.y})` });
    group.append(
      svg('rect', { x: -33, y: -37, width: 66, height: 74 }),
      svg('text', { x: 0, y: -3, 'text-anchor': 'middle', class: 'degree-text' }, fields.number),
      svg('text', { x: 0, y: 24, 'text-anchor': 'middle', class: 'chord-text' }, fields.name),
    );
    nodes.append(group);
  }
  el('diminished').hidden = !includeDim;
  svgEl('circle-home').textContent = keyLabel(key);
  svgEl('circle-title').textContent = `${keyLabel(key)} chord family`;
  svgEl('circle-description').textContent = descriptions.join('. ');
}
function renderPattern() {
  const box = el('study-pattern'); box.replaceChildren();
  const numbers = key.mode === 'major' ? [[4, 1, 5], [2, 6, 3]] : [[6, 3, 7], [4, 1, 5]];
  numbers.forEach((row, i) => {
    const div = document.createElement('div'); div.className = `pattern-row ${i ? 'inner' : ''}`;
    const label = document.createElement('small'); label.textContent = i ? 'Inside' : 'Outside'; div.append(label);
    for (const value of row) { const span = document.createElement('span'); span.textContent = String(value); div.append(span); }
    box.append(div);
  });
}
function setPrimary(label: string) { el('primary').textContent = label; el('primary').hidden = false; }
function render() {
  root.dataset.practising = String(phase === 'practice' || phase === 'feedback');
  const pair = familyKeys(familyIndex());
  el<HTMLSelectElement>('family').value = String(familyIndex());
  for (const mode of ['major', 'minor'] as const) {
    const button = el<HTMLButtonElement>(`${mode}-key`);
    button.textContent = keyLabel(pair[mode === 'major' ? 0 : 1]!);
    button.setAttribute('aria-pressed', String(key.mode === mode));
  }
  el('mode-note').textContent = phase === 'practice' || phase === 'feedback' ? 'Changing key starts a fresh round.' : 'Same chords. A different home.';
  renderCircle();
  el('study-pattern').hidden = phase !== 'study';
  el('choices').hidden = phase !== 'practice' && phase !== 'feedback';
  el('hint').hidden = phase !== 'practice';
  el<HTMLButtonElement>('hint').disabled = peeked;
  el('hint').textContent = peeked ? 'Pattern revealed' : 'Peek at the pattern';
  el('secondary').hidden = phase !== 'summary';
  el('round-count').textContent = '';
  el('round-dots').replaceChildren();
  el('feedback').textContent = feedback;
  el('learning-note').textContent = '';

  if (phase === 'study') {
    renderPattern();
    el('round-label').textContent = includeDim ? 'THE COMPLETE FAMILY' : 'FIRST, LOOK AT THE PATTERN';
    el('prompt').textContent = includeDim ? 'One last chord.' : 'Six chords. One shape.';
    el('instruction').textContent = studyMessage || (includeDim
      ? `Add ${shortChord(key, key.mode === 'major' ? 6 : 1)}: chord ${key.mode === 'major' ? 7 : 2}. Its root matters too, so you’ll practise its name and number.`
      : `In ${keyLabel(key)}, read the three highlighted columns around the circle. The big number is the chord’s place in the scale.`);
    setPrimary('Try a round →');
    el('learning-note').textContent = includeDim ? 'Same shape. Seven chords to recall.' : 'Study the shape, then fill in missing names and numbers. More labels disappear as you learn.';
  } else if (phase === 'practice' || phase === 'feedback') {
    const card = cards[index]!;
    el('round-label').textContent = rebuild ? 'BUILD THE FAMILY' : retryCards.length ? 'REVISIT THE TRICKY ONES' : 'FILL THE GAP';
    el('round-count').textContent = `${index + 1} / ${cards.length}`;
    cards.forEach((_, i) => { const dot = document.createElement('span'); dot.className = i < index ? 'complete' : i === index ? 'current' : ''; el('round-dots').append(dot); });
    el('prompt').textContent = card.kind === 'name' ? `What is chord ${card.degree + 1}?` : `${shortChord(key, card.degree)} is which number?`;
    el('instruction').textContent = `In ${keyLabel(key)}. ${rebuild ? 'Fill the outlined position. Each answer stays on the circle.' : 'Find the outlined position on the circle.'}`;
    const choices = el('choices'); choices.replaceChildren();
    const expected = card.kind === 'name' ? shortChord(key, card.degree) : String(card.degree + 1);
    for (const option of options) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = option;
      button.disabled = phase === 'feedback';
      if (phase === 'feedback') {
        if (option === expected) button.className = 'correct';
        else if (option === picked) button.className = 'wrong';
      }
      button.addEventListener('click', () => answer(option)); choices.append(button);
    }
    el('primary').hidden = phase === 'practice';
    if (phase === 'feedback') setPrimary(index === cards.length - 1 ? 'See how you did →' : 'Next →');
    el('learning-note').textContent = peeked ? 'A peek helps you learn. This answer will return for practice.' : rebuild ? 'Recall the whole shape, one chord at a time.' : hideCount === 1 ? 'One label hidden. Start with the shape.' : `${hideCount} labels hidden. Keep the shape in mind.`;
  } else {
    el('round-label').textContent = 'ROUND COMPLETE';
    el('prompt').textContent = `${score} of ${cards.length} recalled.`;
    const allSix = learnedCount(key, progress.reviews) === 12;
    const allSeven = learnedCount(key, progress.reviews, true) === 14;
    if (rebuild && score === cards.length && !includeDim) {
      summaryAction = 'seventh';
      el('instruction').textContent = 'You rebuilt the six-chord family. Now add the diminished chord to complete the key.';
      setPrimary('Meet the seventh chord →');
    } else if (allSeven && dimUnlocked()) {
      summaryAction = 'next-key';
      const next = nextKey();
      el('instruction').textContent = key.mode === 'major' ? `Try ${keyLabel(next)} next: the same chords in the same positions, with new numbers.` : `Keep this shape in mind. Next up: ${keyLabel(next)}.`;
      setPrimary(`Try ${keyLabel(next)} →`);
    } else if (allSix && !dimUnlocked()) {
      summaryAction = 'rebuild';
      el('instruction').textContent = 'You’ve recalled the names and numbers. Try rebuilding the family with all six names hidden.';
      setPrimary('Build the family →');
    } else {
      summaryAction = 'practice';
      el('instruction').textContent = missed.length ? 'The tricky answers are ready for another try. The circle will give you more support when you need it.' : 'Keep going. Your next round connects these chords with their numbers in the other direction.';
      setPrimary(missed.length ? 'Retry tricky answers →' : 'Another round →');
    }
    el('secondary').textContent = 'Study the pattern again';
    el('learning-note').textContent = 'Only answers recalled without a peek count. You can choose any family above at any time.';
  }
}
function study(message = '', focus = false) {
  phase = 'study'; includeDim = dimUnlocked(); feedback = ''; studyMessage = message;
  peeked = false; masked.clear(); filled.clear();
  render(); persist();
  if (focus) el('prompt').focus({ preventScroll: true });
}
function startRound(build = false, retry: RecallCard[] = []) {
  rebuild = build; retryCards = retry;
  includeDim = dimUnlocked(); hideCount = hiddenCount(key, progress.reviews);
  cards = retry.length ? [...retry] : build ? makeRebuild(key, includeDim) : makeRound(key, progress.rounds[key.id] ?? 0, includeDim);
  index = 0; score = 0; missed = []; filled = new Set();
  el<HTMLDetailsElement>('key-help').open = false;
  newQuestion();
  root.querySelector('.trainer')!.scrollIntoView({ block: 'start', behavior: 'instant' });
}
function newQuestion() {
  phase = 'practice'; peeked = false; picked = ''; feedback = '';
  const card = cards[index]!;
  masked = rebuild ? new Set(degreesFor(key, includeDim)) : hiddenDegrees(card, hideCount, includeDim);
  options = answerChoices(card);
  render(); el('prompt').focus({ preventScroll: true });
}
function answer(value: string) {
  if (phase !== 'practice') return;
  const card = cards[index]!;
  const expected = card.kind === 'name' ? shortChord(key, card.degree) : String(card.degree + 1);
  const right = value === expected;
  const recalled = right && !peeked;
  picked = value;
  if (recalled) score++; else missed.push(card);
  progress.reviews[card.id] = reviewAnswer(progress.reviews[card.id], recalled, Date.now());
  filled.add(card.degree);
  const c = chord(key, card.degree);
  feedback = `${right ? peeked ? 'That’s it — with a little help.' : 'That’s it.' : 'Keep this position in mind.'} ${shortChord(key, card.degree)} is chord ${card.degree + 1} (${c.numeral}) in ${keyLabel(key)}.`;
  phase = 'feedback'; persist(); render(); el('primary').focus({ preventScroll: true });
}
function finishRound() {
  if (!retryCards.length && !rebuild) progress.rounds[key.id] = (progress.rounds[key.id] ?? 0) + 1;
  if (rebuild && score === cards.length) progress.builds[key.id] = (progress.builds[key.id] ?? 0) + 1;
  phase = 'summary'; feedback = ''; persist(); render(); el('prompt').focus({ preventScroll: true });
}
function nextKey() {
  const family = familyIndex();
  return key.mode === 'major' ? familyKeys(family)[1]! : familyKeys((family + 1) % FAMILIES.length)[0]!;
}
function switchKey(next: Key) {
  const sameFamily = circleNode(next).index === circleNode(key).index;
  const relative = familyKeys(familyIndex()).some(k => k.id === next.id) && next.mode !== key.mode;
  key = next;
  study(relative && sameFamily ? `Same six chords, same positions. ${keyLabel(key)} is home now: notice how every number changes.` : '', true);
}
el('primary').addEventListener('click', () => {
  if (phase === 'study') startRound();
  else if (phase === 'feedback') {
    if (++index < cards.length) newQuestion(); else finishRound();
  } else if (phase === 'summary') {
    if (summaryAction === 'rebuild') startRound(true);
    else if (summaryAction === 'seventh') study('', true);
    else if (summaryAction === 'next-key') switchKey(nextKey());
    else startRound(false, missed);
  }
});
el('hint').addEventListener('click', () => {
  if (phase !== 'practice') return;
  peeked = true; render();
});
el('secondary').addEventListener('click', () => study('', true));
el<HTMLDetailsElement>('key-help').addEventListener('toggle', () => {
  if (el<HTMLDetailsElement>('key-help').open && phase === 'practice' && !peeked) { peeked = true; render(); }
});
el<HTMLSelectElement>('family').addEventListener('change', event => {
  const family = Number((event.target as HTMLSelectElement).value);
  switchKey(familyKeys(family)[0]!);
});
for (const mode of ['major', 'minor'] as Mode[]) el(`${mode}-key`).addEventListener('click', () => {
  if (key.mode !== mode) switchKey(familyKeys(familyIndex())[mode === 'major' ? 0 : 1]!);
});
study();
