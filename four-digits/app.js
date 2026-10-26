import { SOLUTIONS_7217 } from './data.js';
import { canon } from './solver.js';
import { $, $$, SUIT, cardHTML, parse, evalQ, leaves, fmtQ, reason, pretty, list, ask, fmtTime, dealLocal, rand4, renderCards, onCard, nudgeNeed, chunkText, fits, wrap, words, makePad, hintsFor } from './lib.js';

// ---------- hero ----------
const EXAMPLE = [[12, 'h'], [11, 'c'], [9, 's'], [8, 'd'], [6, 'c'], [5, 'h'], [4, 's'], [1, 'd']];
function renderFan() {
  $$('[data-fan]').forEach(f => {
    f.innerHTML = EXAMPLE.map(([v, s], i) => {
      const a = (i - 3.5) * 5, x = i * 0.29;
      return cardHTML(v, s, 'span', `style="left:${x}em;transform:rotate(${a}deg)"`);
    }).join('');
  });
}
function placeHero() {
  const hero = $('.hero'), hl = $('.hl');
  if (!hero || !hl) return;
  const seam = $('.hero-bottom').offsetTop;
  const lh = hl.getBoundingClientRect().height;
  // the seam crosses line two a third of the way down
  const fromTop = lh * (0.5 + 0.5 / 3);
  hl.style.setProperty('--lift', `-${fromTop}px`);
  hl.style.transform = `translate(-50%, -${fromTop}px)`;
  hl.style.setProperty('--cut', `${fromTop}px`);
  void seam;
}

// ---------- intro equation made of cards ----------
const SUIT_OF = Object.fromEntries(EXAMPLE.map(([v, s]) => [v, s]));
function renderEq() {
  $$('[data-eq]').forEach(el => {
    el.innerHTML = el.dataset.eq.split(' ').map((tok, i) => {
      if (tok === '7217') return `<span class="t">7217</span>`;
      return tok.replace(/\d+/g, m => cardHTML(+m, SUIT_OF[m] || 's'));
    }).join(' ');
  });
  $$('[data-hand]').forEach(el => {
    el.innerHTML = el.dataset.hand.split(',').map(v => cardHTML(+v, SUIT_OF[v] || 's')).join('');
  });
}

// ---------- the wall ----------
const FAVS = ['9*(6*(11*12)+5*8/4)-1', '(12*9-5)*(11*6+4)+8-1', '11*8*(12*6+9+5-4)+1', '11*(12+4)*(9*6-8-5)+1'].map(s => canon(parse(s)));
function renderWall() {
  const ol = $('[data-wall]'); if (!ol) return;
  ol.innerHTML = SOLUTIONS_7217.map(s => {
    let fav = false;
    try { fav = FAVS.includes(canon(parse(s))); } catch {}
    return `<li${fav ? ' class="fav"' : ''}>7217 = ${pretty(s)}</li>`;
  }).join('');
  $('[data-wall-count]').textContent = SOLUTIONS_7217.length;
}

// ---------- bar ink by chapter ----------
function watchBar() {
  const bar = $('#bar');
  const grounds = $$('[data-ground]').filter(el => el !== bar);
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = bar.offsetHeight / 2;
    const under = grounds.find(el => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    const g = under ? under.dataset.ground : 'paper';
    bar.classList.toggle('on-dark', g === 'dark');
    bar.dataset.on = g;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

// ---------- entrances ----------
function watchRise() {
  const els = $$('[data-rise]');
  const groups = new Map();
  els.forEach(el => {
    const sec = el.closest('section, figure, footer') || document.body;
    const n = groups.get(sec) || 0; groups.set(sec, n + 1);
    el.style.setProperty('--d', `${Math.min(n, 6) * 80}ms`);
  });
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
}

const pcount = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

// ---------- progress, kept in this browser ----------
const store = (() => { try { return JSON.parse(localStorage.getItem('fourdigits') || '{}'); } catch { return {}; } })();
const save = () => { try { localStorage.setItem('fourdigits', JSON.stringify(store)); } catch {} };
store.lv ??= {};
const GOAL = { 1: 10, 2: 10, 3: 5, 4: 5, 5: 5 };
const BY_STREAK = { 1: true, 2: true };
const lv = n => (store.lv[n] ??= { streak: 0, wins: 0, tries: 0, times: [], cleared: false });

function record(n, ok, ms) {
  const L = lv(n);
  L.tries++;
  if (ok) { L.wins++; L.streak++; if (ms) { L.times.push(ms); L.times = L.times.slice(-20); } }
  else L.streak = 0;
  if ((BY_STREAK[n] ? L.streak : L.wins) >= GOAL[n]) L.cleared = true;
  save(); renderLadder(); renderScore(n);
}
function renderLadder() {
  $$('.rung').forEach(b => {
    const n = +b.dataset.lv, L = lv(n);
    b.classList.toggle('is-done', L.cleared);
    $(`[data-prog="${n}"]`).textContent = L.cleared ? 'Cleared' : BY_STREAK[n] ? `${L.streak} of ${GOAL[n]} in a row` : `${L.wins} of ${GOAL[n]} wins`;
  });
}
const avg = ts => ts.length ? (ts.reduce((a, b) => a + b, 0) / ts.length / 1000).toFixed(1) + ' s' : '–';
function renderScore(n) {
  const L = lv(n), el = $(`[data-score="${n}"]`);
  if (n <= 2) el.innerHTML = `Streak <b>${L.streak}</b> · right <b>${L.wins}</b> of <b>${L.tries}</b> · average <b>${avg(L.times)}</b>`;
  else if (n <= 4) el.innerHTML = `Wins <b>${L.wins}</b> · hands <b>${L.tries}</b>`;
  else el.innerHTML = `Solved <b>${L.wins}</b> · streak <b>${L.streak}</b> · best <b>${L.best ? fmtTime(L.best) : '–'}</b> · clock <b data-clock>0:00</b>`;
}

// Pick a divider from the hand, leaning to the big cards, since those are the ones the method divides by.
// 10 (and 5 for remainders) is skipped: the last digit gives it away, so there is nothing to train.
function bigCard(hand, min = 3, skip = [10]) {
  const idx = hand.map((_, i) => i).filter(i => hand[i].v >= min && !skip.includes(hand[i].v)).sort((a, b) => hand[b].v - hand[a].v);
  return idx.length ? idx[Math.floor(Math.random() * Math.min(4, idx.length))] : -1;
}

// ---------- drill 1: remainders ----------
const D1 = { hand: [], di: -1, d: 0, T: 0, start: 0, answered: false, timer: 0 };
function next1() {
  clearTimeout(D1.timer);
  do { D1.hand = dealLocal(8); D1.di = bigCard(D1.hand, 3, [5, 10]); } while (D1.di < 0);
  D1.d = D1.hand[D1.di].v;
  do D1.T = rand4(); while (D1.T % D1.d === 0 && Math.random() < 0.85);
  renderCards($('[data-hand="1"]'), D1.hand, { pick: new Set([D1.di]) });
  $('[data-q="1"]').textContent = `${D1.T} ÷ ${D1.d}`;
  $('[data-in="1"]').value = '';
  $('[data-out="1"]').textContent = '';
  $('[data-next="1"]').textContent = 'Skip';
  D1.answered = false; D1.start = performance.now();
}
function setup1() {
  $('[data-form="1"]').addEventListener('submit', e => {
    e.preventDefault();
    if (D1.answered) return next1();
    const raw = $('[data-in="1"]').value.trim();
    const v = parseInt(raw, 10), out = $('[data-out="1"]');
    if (Number.isNaN(v)) { out.textContent = 'Type the number it leaves, like 5.'; return; }
    const r = D1.T % D1.d, ok = v === r;
    D1.answered = true;
    record(1, ok, performance.now() - D1.start);
    out.innerHTML = `<b>${ok ? 'Right.' : 'Not quite.'}</b> ${chunkText(D1.T, D1.d)}`;
    $('[data-next="1"]').textContent = 'Next';
    if (ok) D1.timer = setTimeout(() => { if (D1.answered) { next1(); $('[data-in="1"]').focus({ preventScroll: true }); } }, 1500);
  });
  $('[data-next="1"]').addEventListener('click', () => { if (!D1.answered) record(1, false); next1(); });
}

// ---------- drill 2: which card pays the nudge ----------
const D2 = { hand: [], di: -1, d: 0, T: 0, ok: [], start: 0, answered: false, timer: 0 };
function next2() {
  clearTimeout(D2.timer);
  for (;;) {
    D2.hand = dealLocal(8); D2.di = bigCard(D2.hand, 4);
    if (D2.di < 0) continue;
    D2.d = D2.hand[D2.di].v; D2.T = rand4();
    if (D2.T % D2.d === 0) continue;
    D2.ok = D2.hand.map((c, i) => i).filter(i => i !== D2.di && fits(D2.T, D2.d, D2.hand[i].v));
    if (D2.ok.length) break;
  }
  renderCards($('[data-hand="2"]'), D2.hand, { pick: new Set([D2.di]) });
  $('[data-q="2"]').textContent = `Make ${D2.T} divide by ${D2.d}`;
  $('[data-out="2"]').textContent = '';
  $('[data-next="2"]').textContent = 'Skip';
  D2.answered = false; D2.start = performance.now();
}
function setup2() {
  onCard($('[data-hand="2"]'), i => {
    if (D2.answered || i === D2.di) return;
    const v = D2.hand[i].v, ok = D2.ok.includes(i), out = $('[data-out="2"]');
    D2.answered = true;
    record(2, ok, performance.now() - D2.start);
    const vals = [...new Set(D2.ok.map(j => D2.hand[j].v))];
    if (ok) {
      const down = (D2.T - v) % D2.d === 0, m = down ? D2.T - v : D2.T + v;
      const others = vals.filter(x => x !== v);
      out.innerHTML = `<b>Right.</b> ${D2.T} ${down ? '−' : '+'} ${v} = ${m} = ${D2.d} × ${m / D2.d}.${others.length ? ` Your ${list(others)} would work too.` : ''}`;
      D2.timer = setTimeout(() => { if (D2.answered) next2(); }, 1600);
    } else {
      out.innerHTML = `<b>Not that one.</b> ${nudgeNeed(D2.T, D2.d)}. Here that's your ${list(vals)}.`;
      renderCards($('[data-hand="2"]'), D2.hand, { pick: new Set([D2.di]), mark: new Set(D2.ok) });
    }
    $('[data-next="2"]').textContent = 'Next';
  });
  $('[data-next="2"]').addEventListener('click', () => { if (!D2.answered) record(2, false); next2(); });
}

// ---------- drill 3: two dividers on a real hand ----------
const D3 = { info: null, hand: [], mask: 255, T: 0, steps: [], div: -1, busy: false, done: false };
async function new3() {
  D3.busy = true;
  $('[data-out="3"]').textContent = 'Dealing…';
  const r = await ask({ type: 'deal', n: 8 });
  Object.assign(D3, { info: r, hand: r.hand, mask: 255, T: r.target, steps: [], div: -1, busy: false, done: false });
  $('[data-target="3"]').textContent = r.target;
  render3();
  $('[data-out="3"]').textContent = 'Tap your biggest card to divide by it.';
}
const left3 = () => D3.hand.filter((_, i) => D3.mask >> i & 1).map(c => c.v);
function render3() {
  const used = new Set(D3.hand.map((_, i) => i).filter(i => !(D3.mask >> i & 1)));
  renderCards($('[data-hand="3"]'), D3.hand, { used, pick: new Set(D3.div >= 0 ? [D3.div] : []) });
  $('[data-work="3"]').innerHTML = D3.steps.map(s => {
    const note = s.alive === null ? 'checking…' : s.alive ? `${s.X} can still be made from ${list(s.left)}.` : `dead end: ${s.X} can't be made from ${list(s.left)}.`;
    return `<li><span class="w-math">${s.T} = ${s.d} × ${s.X}${s.c ? (s.sign > 0 ? ' + ' : ' − ') + s.c : ''}</span><span class="w-note">${note}</span></li>`;
  }).join('');
}
async function apply3(j, c, sign, X) {
  const s = { T: D3.T, d: D3.hand[D3.div].v, di: D3.div, j, c, sign, X, alive: null };
  D3.steps.push(s);
  D3.mask &= ~(1 << D3.div); if (j >= 0) D3.mask &= ~(1 << j);
  D3.T = X; D3.div = -1;
  s.left = left3();
  render3();
  D3.busy = true;
  const a = await ask({ type: 'alive', cards: D3.hand.map(h => h.v), mask: D3.mask, X });
  D3.busy = false;
  s.alive = a.ok; render3();
  const out = $('[data-out="3"]');
  if (!a.ok) { out.textContent = 'Press Undo and try another card.'; return; }
  if (D3.steps.length < 2 && pcount(D3.mask) > 4) { out.textContent = 'Still alive. Now the next biggest card.'; return; }
  D3.done = true;
  record(3, true);
  const route = D3.info.route, mine = D3.steps.map(t => t.d).join(' then ');
  const rules = route ? route.steps.map(t => t.d).join(' then ') : '';
  out.innerHTML = `<b>You win the hand.</b> The last part: ${X} = ${pretty(a.expr)}.${route && rules !== mine ? ` The rules would have tried ${rules} first.` : ''}`;
}
function setup3() {
  onCard($('[data-hand="3"]'), i => {
    if (D3.busy || D3.done) return;
    const out = $('[data-out="3"]'), v = D3.hand[i].v;
    if (D3.steps.length && D3.steps.at(-1).alive === false) { out.textContent = 'That one is a dead end. Press Undo first.'; return; }
    if (D3.div < 0) {
      if (v < 2) { out.textContent = "A 1 can't shrink anything. Pick a bigger card."; return; }
      D3.div = i; render3();
      const r = D3.T % v;
      if (!r) { out.textContent = `${D3.T} divides by ${v} exactly, because ${reason(D3.T, v)}. Press No nudge needed.`; return; }
      const can = D3.hand.some((h, k) => k !== i && D3.mask >> k & 1 && fits(D3.T, v, h.v));
      out.textContent = `${nudgeNeed(D3.T, v)}. ${can ? 'Tap the card that pays.' : `You don't hold one, so tap the ${v} again and pick another divider.`}`;
      return;
    }
    if (i === D3.div) { D3.div = -1; render3(); out.textContent = 'Pick a divider.'; return; }
    const d = D3.hand[D3.div].v, down = (D3.T - v) % d === 0, up = (D3.T + v) % d === 0;
    if (!down && !up) { out.textContent = `Your ${v} doesn't do it. ${nudgeNeed(D3.T, d)}.`; return; }
    const sign = down ? 1 : -1, X = (D3.T - sign * v) / d;
    if (X < 1) { out.textContent = 'That would leave nothing to make. Try another card.'; return; }
    apply3(i, v, sign, X);
  });
  $$('[data-act3]').forEach(b => b.addEventListener('click', () => {
    const out = $('[data-out="3"]'), act = b.dataset.act3;
    if (act === 'new') { if (D3.info && !D3.done && D3.steps.length) record(3, false); return new3(); }
    if (D3.busy) return;
    if (act === 'undo') {
      const s = D3.steps.pop(); if (!s) return;
      D3.mask |= 1 << s.di; if (s.j >= 0) D3.mask |= 1 << s.j;
      D3.T = s.T; D3.div = -1; D3.done = false; render3();
      out.textContent = 'Pick a divider.';
      return;
    }
    if (D3.done) return;
    if (D3.div < 0) { out.textContent = 'Pick a divider first.'; return; }
    const d = D3.hand[D3.div].v;
    if (D3.T % d) { out.textContent = `${D3.T} doesn't divide by ${d}: it leaves ${D3.T % d}. Tap a card to pay the nudge.`; return; }
    apply3(-1, 0, 1, D3.T / d);
  }));
}

// ---------- drill 4: the last four cards ----------
const D4 = { info: null, shown: false, busy: false };
let pad4;
function scaffold(route, T) {
  let inner = '□';
  for (const s of [...route.steps].reverse()) inner = `${s.d} × ${wrap(inner)}${s.c ? (s.sign > 0 ? ' + ' : ' − ') + s.c : ''}`;
  return `${T} = ${inner}`;
}
async function new4() {
  if (D4.busy) return;
  D4.busy = true;
  $('[data-q="4"]').textContent = 'Dealing…';
  let r; do r = await ask({ type: 'finish' }); while (!r.hand);
  D4.busy = false;
  Object.assign(D4, { info: r, shown: false });
  const left = r.route.left;
  $('[data-scaffold]').textContent = scaffold(r.route, r.target);
  $('[data-q="4"]').textContent = `Make ${r.route.Y} from ${list(left)}`;
  $('[data-answers="4"]').hidden = true;
  const allowed = r.hand.map((_, i) => i).filter(i => r.route.mask >> i & 1);
  pad4.set({ hand: r.hand, allowed, target: r.route.Y, placeholder: `Make ${r.route.Y} with ${list(left)}` });
}
function show4(won) {
  const r = D4.info, box = $('[data-answers="4"]');
  box.hidden = false;
  $('[data-answers-lead="4"]').textContent = won ? `Done. Then ${r.target} = ${scaffold(r.route, r.target).split(' = ')[1].replace('□', wrap(pretty(r.finishes[0] || '')))}. Other ways to make ${r.route.Y}:` : `Ways to make ${r.route.Y} from ${list(r.route.left)}:`;
  $('[data-answers-list="4"]').innerHTML = r.finishes.slice(0, 16).map(x => `<li>${r.route.Y} = ${pretty(x)}</li>`).join('');
}
function setup4() {
  pad4 = makePad($('[data-pad="4"]'), 4, () => {
    record(4, !D4.shown);
    pad4.out.innerHTML = D4.shown ? '<b>Done.</b> It counts once you find one without looking.' : '<b>Done.</b> That is the hard part of a hand.';
    show4(true);
  });
  $('[data-act4="show"]').addEventListener('click', () => { if (D4.info) { D4.shown = true; show4(false); } });
  $('[data-act4="new"]').addEventListener('click', () => { if (D4.info && !pad4.done) record(4, false); new4(); });
}

// ---------- drill 5: the full hand ----------
const G = { info: null, start: 0, hintAt: 0, revealed: false, timer: 0, busy: false };
let pad5;
async function newHand() {
  if (G.busy) return;
  G.busy = true;
  Object.assign(G, { hintAt: 0, revealed: false, info: null });
  $('[data-hints]').innerHTML = ''; $('[data-answers="5"]').hidden = true;
  $('[data-target="5"]').parentElement.classList.remove('hit');
  pad5.out.textContent = 'Dealing…';
  const r = await ask({ type: 'deal', n: 8 });
  G.busy = false; G.info = r;
  $('[data-target="5"]').textContent = r.target;
  pad5.set({ hand: r.hand, target: r.target, placeholder: 'Click cards or type, like 12 × (11 × 55 − 4) + 5' });
  G.start = performance.now();
  clearInterval(G.timer);
  G.timer = setInterval(() => { const c = $('[data-score="5"] [data-clock]'); if (c && !pad5.done) c.textContent = fmtTime(performance.now() - G.start); }, 500);
  $('[data-act="hint"]').textContent = 'Hint';
}
function win5() {
  const t = performance.now() - G.start, L = lv(5);
  $('[data-target="5"]').parentElement.classList.add('hit');
  if (!G.revealed) { if (!L.best || t < L.best) L.best = t; record(5, true); } else renderScore(5);
  $('[data-score="5"] [data-clock]').textContent = fmtTime(t);
  const n = G.info.solutions.length;
  pad5.out.innerHTML = `<b>Solved in ${fmtTime(t)}.</b> Your answer is one of ${G.info.more ? 'at least ' : ''}${n} for this hand.`;
  showAnswers(false);
}
function showAnswers(revealed) {
  const box = $('[data-answers="5"]'), sols = G.info.solutions;
  box.hidden = false;
  $('[data-answers-lead="5"]').textContent = revealed
    ? `Here is one way: ${G.info.target} = ${pretty(G.info.answer)}. This hand has ${G.info.more ? 'at least ' : ''}${sols.length} answers. A few more:`
    : 'A few of the other answers:';
  $('[data-answers-list="5"]').innerHTML = sols.slice(0, 12).map(x => `<li>${G.info.target} = ${pretty(x)}</li>`).join('');
  const all = $('[data-act="all"]'); all.hidden = sols.length <= 12;
  all.textContent = `Show all ${sols.length}${G.info.more ? '+' : ''}`;
}

function hint() {
  if (!G.info || pad5.done) return;
  const hs = hintsFor(G.info);
  if (G.hintAt >= hs.length) return;
  const li = document.createElement('li');
  li.innerHTML = hs[G.hintAt++];
  $('[data-hints]').append(li);
  if (G.hintAt >= hs.length) { G.revealed = true; $('[data-act="hint"]').textContent = 'No more hints'; }
}
function setup5() {
  pad5 = makePad($('[data-pad="5"]'), 5, win5);
  $('[data-act="hint"]').addEventListener('click', hint);
  $('[data-act="answer"]').addEventListener('click', () => {
    if (!G.info) return;
    if (!pad5.done) { G.revealed = true; lv(5).streak = 0; save(); renderScore(5); }
    showAnswers(true);
  });
  $('[data-act="new"]').addEventListener('click', () => {
    if (!pad5.done && G.info && pad5.input.value) { lv(5).streak = 0; save(); renderScore(5); }
    newHand();
  });
  $('[data-act="all"]').addEventListener('click', e => {
    $('[data-answers-list="5"]').innerHTML = G.info.solutions.map(x => `<li>${G.info.target} = ${pretty(x)}</li>`).join('');
    e.target.hidden = true;
  });
}

// ---------- switching drills ----------
const started = new Set();
const START = { 1: next1, 2: next2, 3: new3, 4: new4, 5: newHand };
function showLevel(n) {
  store.cur = n; save();
  $$('.rung').forEach(b => { const on = +b.dataset.lv === n; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
  $$('.train .pane').forEach(p => p.hidden = +p.dataset.pane !== n);
  if (!started.has(n)) { started.add(n); START[n](); }
}
function setupTrain() {
  setup1(); setup2(); setup3(); setup4(); setup5();
  [1, 2, 3, 4, 5].forEach(renderScore);
  renderLadder();
  $$('.rung').forEach(b => b.addEventListener('click', () => showLevel(+b.dataset.lv)));
  const first = [1, 2, 3, 4, 5].find(n => !lv(n).cleared) || 5;
  showLevel(store.cur || first);
}

// ---------- go ----------
renderFan();
renderEq();
renderWall();
watchRise();
watchBar();
setupTrain();
const ready = () => placeHero();
document.fonts?.ready.then(ready);
addEventListener('resize', ready);
ready();
