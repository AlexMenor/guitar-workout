import { NODES, FAMILIES, PRIORITY, STAGES, getKey, familyKeys, circleNode, nodeLabel, nodeAliases, degreeAt, shortChord, numberLabel, questionDeck, type CircleQuestion } from '../lib/circle';
import { chord, keyName, reviewAnswer, type Reviews } from '../lib/harmony';
const root = document.querySelector<HTMLElement>('[data-circle]')!;
const el = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
const stage = el<HTMLSelectElement>('stage'), focus = el<HTMLSelectElement>('focus');
const storageKey = 'guitar-workout:circle:v1';
let reviews: Reviews = {}, family = 0, savedStage = 0, available = true;
try {
  const data = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
  if (data?.version === 1) {
    if (Number.isInteger(data.family) && data.family >= 0 && data.family < FAMILIES.length) family = data.family;
    if (Number.isInteger(data.stage) && data.stage >= 0 && data.stage < STAGES.length) savedStage = data.stage;
    if (data.reviews && typeof data.reviews === 'object' && !Array.isArray(data.reviews)) {
      for (const [id, value] of Object.entries(data.reviews)) {
        const v = value as Record<string, unknown> | null;
        if (v && ['streak','due','attempts','correct'].every(k => typeof v[k] === 'number' && Number.isFinite(v[k]) && (v[k] as number) >= 0)) reviews[id] = v as unknown as Reviews[string];
      }
    }
  }
} catch { /* A fresh journey is safe if storage is unavailable or malformed. */ }
stage.value = String(savedStage);
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({version:1, family, stage:savedStage, reviews})); available = true; }
  catch { available = false; }
  el('storage').textContent = available ? 'Progress saved on this device. Short sessions, no timer. Minor means natural minor.' : 'Progress cannot be saved on this device. You can still practise for this visit.';
}
const buttons = new Map<string, HTMLButtonElement>();
for (const node of NODES) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = `circle-node ${node.mode}`;
  const radius = node.mode === 'major' ? 41.4 : 28.4;
  const angle = node.index * Math.PI / 6 - Math.PI / 2;
  button.style.left = `${50 + radius * Math.cos(angle)}%`;
  button.style.top = `${50 + radius * Math.sin(angle)}%`;
  button.addEventListener('click', () => select(node.id));
  el('circle').append(button); buttons.set(node.id, button);
}
buttons.set('dim', el<HTMLButtonElement>('dim'));
el('dim').addEventListener('click', () => select('dim'));
let deck: CircleQuestion[] = [], question: CircleQuestion, round = 0, score = 0, size = 10;
let selected: string[] = [], hinted = false, done = false;
let missed = new Map<string, CircleQuestion>(), retryDeck: CircleQuestion[] | null = null;
let lastIds: string[] = [], sessionStage = 0;
function currentKeys() { return focus.value === 'journey' ? familyKeys(family) : focus.value === 'priority' ? PRIORITY.map(getKey) : [getKey(focus.value)]; }
function start(retry: CircleQuestion[] | null = null) {
  sessionStage = Number(stage.value); retryDeck = retry; size = retry?.length ?? 10;
  deck = questionDeck(currentKeys(), sessionStage); round = score = 0; lastIds = []; missed = new Map();
  el('summary').hidden = true; el('practice').hidden = false;
  const pair = FAMILIES[family]!;
  el('journey').textContent = focus.value === 'journey' ? `Family ${family+1} of ${FAMILIES.length}: ${pair[0]} major / ${pair[1]} minor. Aim for 8/10 without hints to advance. Earlier families return in review.` : 'Choose any stage at any time. Your guided journey is kept separately.';
  nextQuestion(false);
}
function chooseQuestion() {
  if (retryDeck) return retryDeck[round]!;
  // Earlier families return on alternate questions once due, without adding new families.
  let pool = deck;
  if (focus.value === 'journey' && family > 0 && round % 2 === 1) {
    const old = Array.from({length:family},(_,i)=>questionDeck(familyKeys(i), sessionStage)).flat().filter(q=>reviews[q.id] && reviews[q.id]!.due <= Date.now());
    if (old.length) pool = old;
  }
  if (sessionStage === 3) {
    const direction = round % 2 === 0 ? 'forward' : 'reverse';
    const directional = pool.filter(q => q.kind === direction);
    if (directional.length) pool = directional;
  }
  const unused = pool.filter(q => !lastIds.slice(-Math.min(pool.length - 1, 6)).includes(q.id));
  pool = unused.length ? unused : pool;
  const due = pool.filter(q=>reviews[q.id] && reviews[q.id]!.due <= Date.now());
  const unseen = pool.filter(q=>!reviews[q.id]);
  pool = due.length ? due : unseen.length ? unseen : pool;
  return pool[Math.floor(Math.random()*pool.length)]!;
}
function nextQuestion(moveFocus = true) {
  question = chooseQuestion(); lastIds.push(question.id);
  selected = []; hinted = false; done = false;
  el('feedback').replaceChildren(); el('answer-map').hidden = true; el('next').hidden = true;
  el('hint').hidden = false; el<HTMLButtonElement>('hint').disabled = false;
  el('progress').textContent = `${retryDeck ? 'Retry' : 'Question'} ${round+1} of ${size}`;
  const learned = deck.filter(q=>(reviews[q.id]?.streak ?? 0) >= 2).length;
  el('mastery').textContent = `${learned}/${deck.length} prompts recalled twice`;
  render();
  if (moveFocus) el('prompt').focus();
}
function isGuided() { return sessionStage < 3 && (reviews[question.id]?.streak ?? 0) < 2; }
function renderCircle() {
  const full = hinted || done || isGuided();
  const showNumbers = full || (sessionStage === 3 && (reviews[question.id]?.streak ?? 0) < 2);
  el('circle-key').textContent = question.key.tonic + (question.key.mode === 'minor' ? 'm' : '');
  for (const [id, button] of buttons) {
    const degree = degreeAt(question.key, id), member = degree !== undefined;
    const isDim = id === 'dim';
    const hiddenTarget = !full && ['neighbour','relative'].includes(question.kind) && question.targets.includes(id);
    const text = hiddenTarget ? '?' : isDim ? (full ? shortChord(question.key, degree!) : 'Diminished chord') : nodeLabel(question.key, id);
    button.replaceChildren();
    const names = text.split(' / ');
    button.append(document.createTextNode(names[0]!));
    if (names.length > 1) {
      const alias = document.createElement('small'); alias.className = 'enharmonic-alias';
      alias.textContent = `/ ${names.slice(1).join(' / ')}`; button.append(alias);
    }
    const equivalents = nodeAliases(id);
    button.title = hiddenTarget ? '' : equivalents.length > 1 ? `Same sound, same circle position: ${equivalents.join(' = ')}. Chord families use the active key’s spelling.` : '';
    button.classList.toggle('member', member && full);
    button.classList.toggle('home', id === circleNode(question.key).id);
    button.classList.toggle('selected', selected.includes(id));
    const target = question.kind === 'reverse' && id === question.targets[0];
    button.classList.toggle('target', target || (done && question.targets.includes(id)));
    // Never expose an answer in accessible labels while its visible label is hidden.
    button.setAttribute('aria-label', text);
    button.setAttribute('aria-pressed', String(selected.includes(id)));
    if (member && showNumbers && !(['forward','reverse'].includes(question.kind) && !done && !hinted)) {
      const small = document.createElement('small'); small.textContent = numberLabel(question.key, degree!); button.append(small);
      button.setAttribute('aria-label', `${text}, chord ${numberLabel(question.key,degree!)}`);
    }
    if (isDim && member && full) button.setAttribute('aria-label', `${text}, chord ${numberLabel(question.key,degree!)}`);
    button.disabled = done || ['reverse','neighbour','relative'].includes(question.kind);
    button.hidden = isDim && sessionStage < 3;
  }
}
function render() {
  const q = question;
  el('key-name').textContent = keyName(q.key);
  const prompts = {
    neighbour: `What is ${q.clockwise ? 'clockwise' : 'anticlockwise'} from ${q.key.tonic}${q.key.mode === 'minor' ? 'm' : ''}?`,
    relative: `Find the relative ${q.key.mode === 'major' ? 'minor' : 'major'} of ${q.key.tonic}${q.key.mode === 'minor' ? 'm' : ''}.`,
    family: 'Find the six major and minor chords.',
    forward: `Find chord ${q.degree+1} (${chord(q.key,q.degree).numeral}).`,
    reverse: `${shortChord(q.key,q.degree)} is which chord number?`,
    whole: 'Build this key in scale order: 1 → 7.',
  };
  el('prompt').textContent = prompts[q.kind];
  el('instruction').textContent = done ? 'Follow each chord’s position and number on the circle.' : q.kind === 'family' ? 'Choose six chords on the circle, in any order. Look for three neighbouring columns.' : q.kind === 'whole' ? `Tap the chords in scale order. Next: chord ${Math.min(selected.length+1,7)}. Include the diminished chord below.` : q.kind === 'reverse' ? 'The outlined chord is your target. Choose its scale degree below.' : isGuided() ? 'Follow the visible circle. Labels fade after two unaided correct answers.' : 'Picture the pattern, then tap your answer. A visual hint is always available.';
  if (!done && ['neighbour','relative'].includes(q.kind)) el('instruction').textContent = isGuided() ? 'Study the circle, then choose the chord name below. The missing label is hidden after two correct answers.' : 'Recall the missing name on the circle, then choose it below.';
  const multi = ['family','whole'].includes(q.kind);
  el('slots').hidden = !multi;
  el('slots').replaceChildren();
  if (multi) {
    q.targets.forEach((_,i)=>{
      const span = document.createElement('span'), small = document.createElement('small');
      small.textContent = q.kind === 'whole' ? `Chord ${i+1}` : `Slot ${i+1}`;
      span.append(small, document.createTextNode(selected[i] ? labelFor(selected[i]!) : '—'));
      span.classList.toggle('active', selected.length === i && !done); el('slots').append(span);
    });
  }
  el('check').hidden = !multi || done; el<HTMLButtonElement>('check').disabled = selected.length !== q.targets.length;
  el('undo').hidden = !multi || !selected.length || done;
  const answers = el('degree-answers'); answers.replaceChildren(); answers.hidden = !['reverse','neighbour','relative'].includes(q.kind);
  answers.setAttribute('aria-label', q.kind === 'reverse' ? 'Choose the chord number' : 'Choose the missing chord name');
  if (['neighbour','relative'].includes(q.kind)) {
    const target = NODES.find(n=>n.id===q.targets[0])!;
    const options = NODES.filter(n=>n.mode === target.mode && [0,3,6,9].includes((n.index-target.index+12)%12));
    for (const option of options) {
      const button = document.createElement('button');
      button.textContent = nodeLabel(q.key, option.id); button.disabled = done;
      button.addEventListener('click',()=>finish(option.id === q.targets[0])); answers.append(button);
    }
  }
  if (q.kind === 'reverse') for (let i=0;i<7;i++) {
    const button = document.createElement('button'); button.textContent = numberLabel(q.key,i); button.disabled = done;
    button.addEventListener('click',()=>finish(i === q.degree)); answers.append(button);
  }
  renderCircle();
}
function labelFor(id: string) {
  return nodeLabel(question.key, id);
}
function select(id: string) {
  if (done || question.kind === 'reverse') return;
  if (['family','whole'].includes(question.kind)) {
    if (selected.length < question.targets.length && !selected.includes(id)) selected.push(id);
    render();
  } else { selected = [id]; finish(question.targets[0] === id); }
}
function finish(right: boolean) {
  if (done) return;
  done = true;
  const unaided = right && !hinted;
  if (unaided) score++; else missed.set(question.id,question);
  reviews[question.id] = reviewAnswer(reviews[question.id], unaided, Date.now()); persist(); render();
  const title = document.createElement('strong'); title.textContent = right ? hinted ? 'Correct with a hint. We’ll revisit it.' : 'Correct.' : 'Let’s map it out.';
  const explanation = document.createElement('p');
  if (question.kind === 'neighbour' || question.kind === 'relative') {
    explanation.textContent = question.kind === 'relative' ? `${keyName(question.key)} and ${labelFor(question.targets[0]!)} share a key signature and the same seven chords. They sit in the same column.` : `${question.key.tonic}${question.key.mode === 'minor' ? 'm' : ''} → ${labelFor(question.targets[0]!)}: one step ${question.clockwise ? 'clockwise, up a fifth' : 'anticlockwise, down a fifth'}.`;
  } else {
    const c = chord(question.key,question.degree);
    explanation.textContent = ['forward','reverse'].includes(question.kind) ? `${shortChord(question.key,question.degree)} is chord ${numberLabel(question.key,question.degree)}: ${c.root} is scale note ${question.degree+1}, and its triad is ${c.quality}.` : `${keyName(question.key)}: the three outer major chords and their three inner minors make six. Add ${shortChord(question.key,question.key.mode === 'major' ? 6 : 1)} for all seven.`;
  }
  el('feedback').replaceChildren(title,explanation);
  if (sessionStage >= 2) {
    el('answer-map').hidden = false; el('answer-map').replaceChildren();
    for (let i=0;i<7;i++) {
      const span=document.createElement('span'), small=document.createElement('small'); small.textContent=numberLabel(question.key,i);
      span.append(small,document.createTextNode(shortChord(question.key,i)));el('answer-map').append(span);
    }
  }
  el('hint').hidden = true; el('next').hidden = false;
  el('next').textContent = round+1 === size ? 'Finish session' : 'Next question';
  el('next').focus();
}
el('hint').addEventListener('click',()=>{ hinted=true; renderCircle(); el<HTMLButtonElement>('hint').disabled=true; el('instruction').textContent='Follow the highlighted family and its numbers. This question will return for unaided recall.'; });
el('undo').addEventListener('click',()=>{if(!done){selected.pop();render();}});
el('check').addEventListener('click',()=>{ if(selected.length !== question.targets.length) return; finish(question.kind === 'whole' ? selected.every((id,i)=>id===question.targets[i]) : question.targets.every(id=>selected.includes(id))); });
el('next').addEventListener('click',()=>{
  if (!done) return;
  round++;
  if(round < size){nextQuestion();return;}
  el('practice').hidden=true;el('summary').hidden=false;
  el('progress').textContent=`${size} questions complete`;
  el('score').textContent=`${score} of ${size} correct without hints.${missed.size ? ' Missed and hinted questions are ready to retry.' : ''}`;
  const advance = !retryDeck && focus.value === 'journey' && score >= 8;
  el('recommendation').textContent=advance ? sessionStage < 4 ? `Ready for ${STAGES[sessionStage+1]}. Keep the same family and build on its pattern.` : family < FAMILIES.length-1 ? 'Family complete. Introduce the next family, with earlier ones returning in review.' : 'All six families explored. Keep reviewing, or mix your priority keys.' : 'Keep this stage until the pattern feels familiar. You can also choose any stage above.';
  el('continue').textContent=advance ? sessionStage < 4 ? 'Next stage' : family < FAMILIES.length-1 ? 'Next family' : 'Mix priority keys' : 'Continue practising';
  el('continue').dataset.advance=String(advance);el('retry').hidden=!missed.size;
  el('summary-title').focus();
});
el('continue').addEventListener('click',()=>{
  if(el('continue').dataset.advance==='true') {
    if(sessionStage < 4) stage.value=String(sessionStage+1);
    else if(family < FAMILIES.length-1){family++;stage.value='0';} else focus.value='priority';
  }
  if(focus.value==='journey') savedStage=Number(stage.value);
  persist();start();
});
el('again').addEventListener('click',()=>start());
el('retry').addEventListener('click',()=>start([...missed.values()]));
stage.addEventListener('change',()=>{if(focus.value==='journey')savedStage=Number(stage.value);persist();start();});
focus.addEventListener('change',()=>{if(focus.value==='journey')stage.value=String(savedStage);start();});
start();persist();
