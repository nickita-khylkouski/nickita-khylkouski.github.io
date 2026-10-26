import { $, $$, list, pretty, ask, fmtTime, dealLocal, rand4, renderCards, onCard, nudgeNeed, chunks, chunkText, fits, wrap, makePad, hintsFor } from './lib.js';

const pcount = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
const now = () => performance.now();
const focusIn = el => el && setTimeout(() => el.focus({ preventScroll: true }), 30);
// Set a big number or question and let it land, so a new one is noticed at a glance.
function land(el, text) { el.textContent = text; el.classList.remove('land'); void el.offsetWidth; el.classList.add('land'); }

// ---------- your numbers, kept in this browser ----------
const KEY = 'fourdigits-practice';
const P = (() => {
  let p; try { p = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { p = {}; }
  p.rem ??= {}; p.nudge ??= { n: 0, ok: 0 }; p.finish ??= { n: 0, ok: 0, ms: [] };
  p.solo ??= { n: 0, solved: 0, times: [], best: 0 }; p.guided ??= { n: 0, solved: 0 };
  p.sprint ??= {}; p.daily ??= {}; p.days ??= [];
  return p;
})();
const day = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const keep = (a, v, n) => { a.push(v); if (a.length > n) a.splice(0, a.length - n); };
function save() {
  const t = day(); if (P.days.at(-1) !== t) keep(P.days, t, 90);
  try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {}
  renderStats();
}
function remRecord(d, ok, ms) { const r = (P.rem[d] ??= { n: 0, ok: 0, ms: [] }); r.n++; if (ok) { r.ok++; keep(r.ms, ms, 12); } save(); }
function solveRecord(ms) { P.solo.solved++; keep(P.solo.times, ms, 30); if (!P.solo.best || ms < P.solo.best) P.solo.best = ms; save(); }

// How well you know a card's remainders: not enough data yet, weak, fine, or fast and right.
const DIVS = [3, 4, 6, 7, 8, 9, 11, 12, 13];
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
function level(d) {
  const r = P.rem[d];
  if (!r || r.n < 3) return 'new';
  const acc = r.ok / r.n, t = mean(r.ms);
  if (acc >= 0.9 && t && t <= 4000) return 'good';
  if (acc < 0.75 || t > 7000) return 'weak';
  return 'fine';
}
// The method divides by big cards most, so they come up more; weak cards come up most.
const BASE = { 3: 1, 4: 1, 6: 1, 7: 2, 8: 2, 9: 2, 11: 3, 12: 3, 13: 3 };
const PULL = { new: 1.5, weak: 3, fine: 1.4, good: 0.6 };
function pickDiv(focus) {
  if (focus && Math.random() < 0.7) return focus;
  const w = DIVS.map(d => BASE[d] * PULL[level(d)]);
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let k = 0; k < DIVS.length; k++) if ((x -= w[k]) < 0) return DIVS[k];
  return 13;
}
// The quickest way to a remainder in your head, card by card.
function trick(T, d) {
  const a = Math.floor(T / 1000), b = T % 1000;
  if ((d === 7 || d === 11 || d === 13) && b >= a) return `last three digits minus the first: ${b} − ${a} = ${b - a}, and that leaves the same as ${T}`;
  if (d === 9 || d === 3) { const s = String(T).split('').reduce((x, y) => x + +y, 0); return `add the digits: ${String(T).split('').join(' + ')} = ${s}`; }
  if (d === 4) return `only the last two digits count: ${T % 100}`;
  if (d === 8) return `only the last three digits count: ${b}`;
  const p = chunks(T, d).parts[0];
  return p ? `peel off ${p} (${d} × ${p / d}): ${T} − ${p} = ${T - p}` : `${T} is already smaller than a few ${d}s`;
}

// ---------- one clock per mode ----------
const clocks = {};
const startClock = m => { clocks[m] = { start: now(), stop: 0 }; };
const stopClock = m => { const c = clocks[m]; if (c && !c.stop) c.stop = now(); return c ? c.stop - c.start : 0; };
const elapsed = m => { const c = clocks[m]; return c ? (c.stop || now()) - c.start : 0; };
setInterval(() => { for (const m in clocks) { const el = $(`[data-clock="${m}"]`); if (el) el.textContent = fmtTime(elapsed(m)); } }, 250);

// ---------- guided: the method one step at a time ----------
const GD = { info: null, cards: [], mask: 255, T: 0, left: 2, steps: [], g: null, phase: '', first: true, q: 0, hints: 0, done: false, busy: false, next: null };
let gpad;
const gIn = $('[data-g-in]');
const prompt = h => { $('[data-prompt]').innerHTML = h; };
const say = h => { $('[data-say]').innerHTML = h; };
const dealGuided = () => ask({ type: 'deal', n: 8, needRoute: true });

async function guidedNew() {
  if (GD.busy) return;
  if (GD.info && !GD.done && GD.steps.length) { P.guided.n++; save(); }
  GD.busy = true;
  prompt('Dealing…'); say(''); showAsk(false); $('[data-g-pad]').hidden = true;
  const r = await (GD.next || dealGuided());
  GD.next = dealGuided();
  Object.assign(GD, { info: r, cards: r.hand.map(c => c.v), mask: 255, T: r.target, left: 2, steps: [], g: null, hints: 0, done: false, busy: false });
  land($('[data-target="guided"]'), r.target);
  $('[data-g="new"]').innerHTML = 'Skip hand <kbd>Esc</kbd>';
  $('[data-hand="guided"]').hidden = false;
  startClock('guided');
  drawGuided();
  guidedNext();
}
function drawGuided(mark = new Set()) {
  const used = new Set(GD.cards.map((_, i) => i).filter(i => !(GD.mask >> i & 1)));
  const pick = new Set(GD.g && (GD.phase === 'rem' || GD.phase === 'nudge') ? [GD.g.i] : []);
  renderCards($('[data-hand="guided"]'), GD.info.hand, { used, pick, mark });
  $('[data-work]').innerHTML = GD.steps.map(s => `<li>${s.T} = ${s.d} × <b>${s.X}</b>${s.c ? (s.sign > 0 ? ' + ' : ' − ') + s.c : ''}</li>`).join('');
}
function showAsk(on) { $('[data-ask]').hidden = !on; if (on) { gIn.value = ''; focusIn(gIn); } }

async function guidedNext() {
  if (GD.left > 0 && pcount(GD.mask) > 4) {
    GD.busy = true;
    const { step } = await ask({ type: 'guide', cards: GD.cards, mask: GD.mask, T: GD.T, left: GD.left });
    GD.busy = false;
    if (step) return askRem(step);
  }
  askFinish();
}
// Why a bigger card was passed over, in one sentence.
function whyNot(w, T) {
  const or = a => a.length > 1 ? `${a.slice(0, -1).join(', ')} or ${a.at(-1)}` : `${a[0]}`;
  if (!w.paid.length) return `${w.d} leaves ${w.r}, and only ${or(w.need.map(n => `a ${n.c}`))} could fix that. You don't have one.`;
  const p = w.paid[0], more = w.paid.length > 1 ? ' (nor any other nudge)' : '';
  return `${w.d} can divide it, ${T} ${p.sign > 0 ? '−' : '+'} ${p.c} = ${w.d} × ${p.X}, but the cards left can't finish ${p.X}${more}.`;
}
function askRem(g) {
  Object.assign(GD, { g, phase: 'rem', first: true, q: now() });
  drawGuided();
  const big = Math.max(...GD.cards.filter((_, i) => GD.mask >> i & 1));
  const rest = g.skipped.slice(2);
  const lead = g.skipped.length ? `${g.why.slice(0, 2).map(w => whyNot(w, GD.T)).join(' ')}${rest.length ? ` Your ${list(rest)} ${rest.length > 1 ? "don't" : "doesn't"} work either.` : ''} So divide by ${g.d}.`
    : g.d === big ? `Divide by your ${GD.steps.length ? 'next ' : ''}biggest card, ${g.d}.` : `Divide by ${g.d}.`;
  prompt(`${lead} What does <b>${GD.T}</b> leave?`);
  $('[data-g="none"]').hidden = true;
  showAsk(true);
}
function answerRem(v) {
  const { d } = GD.g, T = GD.T, r = T % d, ok = v === r;
  remRecord(d, ok, now() - GD.q);
  const head = ok ? '<b>Right.</b>' : `<b>It leaves ${r}.</b> ${chunkText(T, d)}`;
  if (!r) {
    say(`${head} ${T} = ${d} × ${T / d}, no nudge needed.`);
    return apply(-1, 0, 1, T / d);
  }
  say(head);
  Object.assign(GD, { phase: 'nudge', first: true, q: now() });
  prompt(`${d} leaves ${r}. Which card makes ${T} divide by ${d}? Tap it or type it.`);
  showAsk(true);
}
async function pickNudge(i) {
  const { d } = GD.g, T = GD.T, v = GD.cards[i];
  if (!fits(T, d, v)) {
    if (GD.first) { P.nudge.n++; save(); GD.first = false; }
    const good = new Set(GD.cards.map((_, k) => k).filter(k => k !== GD.g.i && GD.mask >> k & 1 && fits(T, d, GD.cards[k])));
    drawGuided(good);
    say(`<b>Not the ${v}.</b> ${nudgeNeed(T, d)}.`);
    return;
  }
  const sign = (T - v) % d === 0 ? 1 : -1, X = (T - sign * v) / d;
  if (X < 1) { say('That leaves nothing to make. Pick another card.'); return; }
  const rest = GD.mask & ~(1 << GD.g.i) & ~(1 << i);
  GD.busy = true;
  const a = await ask({ type: 'alive', cards: GD.cards, mask: rest, X });
  GD.busy = false;
  if (!a.ok) { say(`The ${v} works, but then ${X} can't be made from the cards left. Try another.`); return; }
  if (GD.first) { P.nudge.n++; P.nudge.ok++; save(); }
  say(`${T} ${sign > 0 ? '−' : '+'} ${v} = ${T - sign * v} = ${d} × ${X}.`);
  apply(i, v, sign, X);
}
function apply(j, c, sign, X) {
  const g = GD.g;
  GD.steps.push({ T: GD.T, d: g.d, c, sign, X });
  GD.mask &= ~(1 << g.i); if (j >= 0) GD.mask &= ~(1 << j);
  Object.assign(GD, { T: X, left: GD.left - 1, g: null, phase: '' });
  drawGuided();
  guidedNext();
}
function askFinish() {
  const idx = GD.cards.map((_, i) => i).filter(i => GD.mask >> i & 1), left = idx.map(i => GD.cards[i]);
  Object.assign(GD, { phase: 'finish', q: now(), hints: 0 });
  showAsk(false);
  $('[data-hand="guided"]').hidden = true;
  $('[data-g-pad]').hidden = false;
  prompt(left.length === 1 ? `Your last card is ${left[0]}. Tap it.` : `Now make <b>${GD.T}</b> from ${list(left)}.`);
  gpad.set({ hand: GD.info.hand, allowed: idx, target: GD.T, placeholder: `Make ${GD.T} with ${list(left)}` });
  focusIn(gpad.input);
}
function finishWon(s) {
  const ms = now() - GD.q, total = stopClock('guided');
  P.finish.n++; if (!GD.hints) { P.finish.ok++; keep(P.finish.ms, ms, 20); }
  let e = pretty(s.trim());
  for (const st of [...GD.steps].reverse()) e = `${st.d} × ${wrap(e)}${st.c ? (st.sign > 0 ? ' + ' : ' − ') + st.c : ''}`;
  P.guided.n++; P.guided.solved++; GD.done = true;
  save();
  gpad.out.innerHTML = '<b>Done.</b> Press Enter for the next hand.';
  prompt(`<b>Solved in ${fmtTime(total)}.</b> ${GD.info.target} = ${e}`);
  say('');
  $('[data-g="new"]').innerHTML = 'Next hand <kbd>Enter</kbd>';
}
async function guidedHint() {
  if (GD.done || !GD.info) return;
  if (GD.phase === 'rem') say(`Hint: ${trick(GD.T, GD.g.d)}.`);
  else if (GD.phase === 'nudge') {
    if (GD.first) { P.nudge.n++; save(); GD.first = false; }
    const { d } = GD.g, good = new Set(GD.cards.map((_, k) => k).filter(k => k !== GD.g.i && GD.mask >> k & 1 && fits(GD.T, d, GD.cards[k])));
    drawGuided(good); say(`Hint: ${nudgeNeed(GD.T, d)}. The pale cards do it.`);
  } else if (GD.phase === 'finish') {
    GD.hints++;
    if (GD.hints === 1) say('Hint: chain it. Pick two cards that make something near the number, then fold in the other cards one at a time. That covers three hands in four.');
    else {
      const a = await ask({ type: 'alive', cards: GD.cards, mask: GD.mask, X: GD.T });
      say(`One way: ${GD.T} = ${pretty(a.expr)}. Type it in to finish the hand.`);
    }
  }
}
function setupGuided() {
  gpad = makePad($('[data-g-pad]'), 'g', finishWon);
  $('[data-ask]').addEventListener('submit', e => {
    e.preventDefault();
    if (GD.busy) return;
    const v = parseInt(gIn.value, 10);
    if (Number.isNaN(v)) { say('Type a number.'); return; }
    if (GD.phase === 'rem') return answerRem(v);
    if (GD.phase === 'nudge') {
      const i = GD.cards.findIndex((c, k) => c === v && k !== GD.g.i && GD.mask >> k & 1);
      gIn.value = '';
      if (i < 0) { say(`You don't have a ${v} to use.`); return; }
      pickNudge(i);
    }
  });
  onCard($('[data-hand="guided"]'), i => { if (!GD.busy && GD.phase === 'nudge' && i !== GD.g.i) pickNudge(i); });
  $('[data-g="hint"]').addEventListener('click', guidedHint);
  $('[data-g="new"]').addEventListener('click', guidedNew);
}

// ---------- solo and daily: a full hand on the pad ----------
function handGame(mode, { onWin }) {
  const H = { info: null, hintAt: 0, revealed: false };
  const pad = makePad($(`[data-pad="${mode}"]`), mode, s => onWin(H, s));
  const hintsEl = $(`[data-${mode[0]}-hints]`);
  H.pad = pad;
  H.set = (r) => {
    Object.assign(H, { info: r, hintAt: 0, revealed: false });
    hintsEl.innerHTML = ''; $(`[data-${mode[0]}-answers]`).hidden = true;
    land($(`[data-target="${mode}"]`), r.target);
    pad.set({ hand: r.hand, target: r.target, placeholder: 'Tap cards or type, like 12 × (11 × 55 − 4) + 5' });
    startClock(mode);
    focusIn(pad.input);
  };
  H.hint = () => {
    if (!H.info || pad.done) return;
    const hs = hintsFor(H.info);
    if (H.hintAt >= hs.length) return;
    const li = document.createElement('li'); li.innerHTML = hs[H.hintAt++]; hintsEl.append(li);
    if (H.hintAt >= hs.length) H.revealed = true;
    H.hinted = true;
  };
  H.answers = (lead) => {
    const box = $(`[data-${mode[0]}-answers]`), sols = H.info.solutions;
    box.hidden = false;
    $(`[data-${mode[0]}-lead]`).textContent = lead;
    $(`[data-${mode[0]}-list]`).innerHTML = sols.slice(0, 12).map(x => `<li>${H.info.target} = ${pretty(x)}</li>`).join('');
  };
  return H;
}

const SO = { next: null };
let solo;
const dealSolo = () => ask({ type: 'deal', n: 8 });
async function soloNew() {
  if (solo.info && !solo.pad.done && solo.pad.input.value) { P.solo.n++; save(); }
  solo.pad.out.textContent = 'Dealing…';
  const r = await (SO.next || dealSolo());
  SO.next = dealSolo();
  solo.set(r);
}
function setupSolo() {
  solo = handGame('solo', {
    onWin(H) {
      const t = stopClock('solo');
      P.solo.n++;
      const clean = !H.revealed;
      if (clean) solveRecord(t); else save();
      const n = H.info.solutions.length;
      H.pad.out.innerHTML = `<b>Solved in ${fmtTime(t)}.</b> ${clean ? '' : "Hints that give it away don't count toward your times. "}This hand has ${H.info.more ? 'at least ' : ''}${n} answers. Esc for the next one.`;
      H.answers('A few of the others:');
    },
  });
  $('[data-s="hint"]').addEventListener('click', solo.hint);
  $('[data-s="answer"]').addEventListener('click', () => { if (!solo.info) return; solo.revealed = true; solo.answers(`One way: ${solo.info.target} = ${pretty(solo.info.answer)}. Some others:`); });
  $('[data-s="new"]').addEventListener('click', soloNew);
}

// ---------- daily ----------
let daily;
const D = { r: null, loading: null };
const prettyDate = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
function streak() {
  const set = new Set(P.days); let n = 0; const d = new Date();
  if (!set.has(day(d))) d.setDate(d.getDate() - 1);
  while (set.has(day(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function dailyOpen() {
  $$('[data-d-date]').forEach(el => el.textContent = `Today's hand · ${prettyDate()}`);
  D.loading ??= ask({ type: 'deal', n: 8, needRoute: true, seed: 'fourdigits-' + day() }).then(r => (D.r = r));
  const rec = P.daily[day()];
  if (rec) dailyShow(rec);
}
async function dailyStart() {
  $('[data-d-start]').textContent = 'Shuffling…';
  await D.loading;
  $('[data-d-wait]').hidden = true; $('[data-d-play]').hidden = false;
  daily.set(D.r);
}
function dailyShow(rec) {
  D.loading.then(() => {
    $('[data-d-wait]').hidden = true; $('[data-d-play]').hidden = false;
    daily.set(D.r); daily.pad.done = true; stopClock('daily');
    $('[data-clock="daily"]').textContent = rec.ms ? fmtTime(rec.ms) : '–';
    clocks.daily.stop = clocks.daily.start + (rec.ms || 0);
    daily.pad.input.value = rec.expr || ''; daily.pad.input.readOnly = true;
    daily.pad.out.innerHTML = rec.ms ? `<b>You solved today's hand in ${fmtTime(rec.ms)}${rec.hints ? ` with ${rec.hints} hint${rec.hints > 1 ? 's' : ''}` : ''}.</b> ${streak()} day${streak() === 1 ? '' : 's'} in a row. A new hand comes at midnight.` : '<b>You gave up on today\'s hand.</b> A new one comes at midnight.';
    daily.answers(`Ways to make ${D.r.target}:`);
  });
}
function setupDaily() {
  daily = handGame('daily', {
    onWin(H, s) {
      const t = stopClock('daily');
      const rec = { ms: t, hints: H.hintAt, expr: s };
      P.daily[day()] = rec;
      if (!H.revealed) solveRecord(t); else save();
      dailyShow(rec);
    },
  });
  $('[data-d-start]').addEventListener('click', dailyStart);
  $('[data-d="hint"]').addEventListener('click', daily.hint);
  $('[data-d="give"]').addEventListener('click', () => { if (!daily.info || daily.pad.done) return; P.daily[day()] = { ms: 0, gaveUp: true }; save(); dailyShow(P.daily[day()]); });
}

// ---------- sprints ----------
const SP = { kind: '', focus: 0, score: 0, wrong: 0, end: 0, timer: 0, q: null, t0: 0, miss: [], next: null, busy: false };
const DUR = { rem: 60e3, nudge: 60e3, finish: 180e3 };
const NAME = { rem: 'Remainders', nudge: 'Nudges', finish: 'Last four' };
let spad;
const spIn = $('[data-sp-in]');
const spSay = h => { $('[data-sp-say]').innerHTML = h; };
function spView(v) { $('[data-sp-pick]').hidden = v !== 'pick'; $('[data-sp-run]').hidden = v !== 'run'; $('[data-sp-end]').hidden = v !== 'end'; }
function spStart(kind, focus = 0) {
  Object.assign(SP, { kind, focus, score: 0, wrong: 0, miss: [], end: now() + DUR[kind] });
  spView('run'); spSay('');
  $('[data-sp-score]').textContent = 0;
  $('[data-sp-clock]').textContent = fmtTime(DUR[kind]);
  $('[data-sp-skip]').hidden = kind !== 'finish';
  clearInterval(SP.timer);
  SP.timer = setInterval(() => {
    const left = SP.end - now();
    $('[data-sp-clock]').textContent = fmtTime(Math.max(0, left) + 999);
    if (left <= 0) spEnd();
  }, 200);
  if (kind === 'finish') SP.next = ask({ type: 'finish' });
  spNext();
}
async function spNext() {
  const k = SP.kind, form = $('[data-sp-form]'), hand = $('[data-sp-hand]');
  $('[data-sp-pad]').hidden = k !== 'finish'; form.hidden = k === 'finish'; hand.hidden = k !== 'nudge';
  if (k === 'rem') {
    const d = pickDiv(SP.focus); let T;
    do T = rand4(); while (T % d === 0 && Math.random() < 0.85);
    SP.q = { d, T };
    land($('[data-sp-q]'), `${T} ÷ ${d} leaves`);
  } else if (k === 'nudge') {
    let h, di, d, T, ok;
    for (;;) {
      h = dealLocal(8);
      const big = h.map((_, i) => i).filter(i => h[i].v >= 4 && h[i].v !== 10).sort((a, b) => h[b].v - h[a].v);
      if (!big.length) continue;
      di = big[Math.floor(Math.random() * Math.min(3, big.length))]; d = h[di].v; T = rand4();
      if (T % d === 0) continue;
      ok = h.map((_, i) => i).filter(i => i !== di && fits(T, d, h[i].v));
      if (ok.length) break;
    }
    SP.q = { h, di, d, T, ok };
    renderCards(hand, h, { pick: new Set([di]) });
    land($('[data-sp-q]'), `Make ${T} divide by ${d}`);
  } else {
    SP.busy = true;
    $('[data-sp-q]').textContent = 'Dealing…';
    let r; do r = await SP.next; while (!r.hand && (SP.next = ask({ type: 'finish' })));
    SP.next = ask({ type: 'finish' });
    SP.busy = false;
    if (SP.kind !== 'finish' || $('[data-sp-run]').hidden) return;
    SP.q = r;
    land($('[data-sp-q]'), `Make ${r.route.Y} from ${list(r.route.left)}`);
    spad.set({ hand: r.hand, allowed: r.hand.map((_, i) => i).filter(i => r.route.mask >> i & 1), target: r.route.Y, placeholder: `Make ${r.route.Y}` });
    focusIn(spad.input);
  }
  SP.t0 = now();
  if (k !== 'finish') { spIn.value = ''; focusIn(spIn); }
}
function spHit(ok, note) {
  if (ok) { SP.score++; const s = $('[data-sp-score]'); s.textContent = SP.score; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
  else SP.wrong++;
  spSay(note || '');
  spNext();
}
function spAnswer(v) {
  const q = SP.q;
  if (SP.kind === 'rem') {
    const r = q.T % q.d, ok = v === r;
    remRecord(q.d, ok, now() - SP.t0);
    if (!ok) SP.miss.push(q.d);
    spHit(ok, ok ? '' : `${q.T} ÷ ${q.d} leaves <b>${r}</b>: ${trick(q.T, q.d)}.`);
  } else if (SP.kind === 'nudge') {
    const i = q.h.findIndex((c, k) => c.v === v && k !== q.di);
    if (i < 0) { spSay(`You don't have a ${v}.`); spIn.value = ''; return; }
    spNudge(i);
  }
}
function spNudge(i) {
  const q = SP.q, ok = q.ok.includes(i);
  P.nudge.n++; if (ok) P.nudge.ok++; save();
  if (!ok) SP.miss.push(`${q.T} ÷ ${q.d}`);
  spHit(ok, ok ? '' : `Not the ${q.h[i].v}: ${nudgeNeed(q.T, q.d)}.`);
}
function spEnd() {
  clearInterval(SP.timer);
  const k = SP.kind, best = P.sprint[k] || 0, isBest = SP.score > best;
  if (isBest) P.sprint[k] = SP.score;
  save();
  spView('end');
  $('[data-sp-kind]').textContent = `${NAME[k]}${SP.focus ? `, mostly ${SP.focus}s` : ''}`;
  $('[data-sp-final]').textContent = SP.score;
  const tot = SP.score + SP.wrong;
  $('[data-sp-sum]').innerHTML = `${SP.score} right${k === 'finish' ? `, ${SP.wrong} skipped` : ` out of ${tot}`}. ${isBest && best ? `<b>A new best</b>, up from ${best}.` : isBest ? '<b>Your first score.</b> Beat it next time.' : `Your best is ${best}.`}`;
  const miss = {}; SP.miss.forEach(m => miss[m] = (miss[m] || 0) + 1);
  const top = Object.entries(miss).sort((a, b) => b[1] - a[1]).slice(0, 4);
  $('[data-sp-miss]').innerHTML = k === 'rem' ? top.map(([d, n]) => `<li><b>${d}</b> cost you ${n}. The trick: ${trick(7217, +d)}.</li>`).join('') : '';
}
function setupSprint() {
  spad = makePad($('[data-sp-pad]'), 'sp', () => {
    const ms = now() - SP.t0;
    P.finish.n++; P.finish.ok++; keep(P.finish.ms, ms, 20); save();
    spHit(true, '');
  });
  $$('[data-sp]').forEach(b => b.addEventListener('click', () => spStart(b.dataset.sp)));
  $('[data-sp-form]').addEventListener('submit', e => {
    e.preventDefault();
    const v = parseInt(spIn.value, 10);
    if (Number.isNaN(v)) return;
    spAnswer(v);
  });
  onCard($('[data-sp-hand]'), i => { if (SP.kind === 'nudge' && i !== SP.q.di) spNudge(i); });
  $('[data-sp-skip]').addEventListener('click', spSkip);
  $('[data-sp-stop]').addEventListener('click', () => { clearInterval(SP.timer); spView('pick'); renderBests(); });
  $('[data-sp-again]').addEventListener('click', () => spStart(SP.kind, SP.focus));
  $('[data-sp-back]').addEventListener('click', () => { spView('pick'); renderBests(); });
  renderBests();
}
function spSkip() {
  if (SP.kind !== 'finish' || SP.busy) return;
  P.finish.n++; save();
  spHit(false, `Skipped. One way: ${SP.q.route.Y} = ${pretty(SP.q.finishes[0] || '')}.`);
}
function renderBests() {
  for (const k of ['rem', 'nudge', 'finish']) $(`[data-sp-best="${k}"]`).textContent = P.sprint[k] ? `Best ${P.sprint[k]}` : 'No score yet';
}

// ---------- your numbers ----------
function renderStats() {
  const solved = P.solo.solved + P.guided.solved;
  $('[data-st="solved"]').textContent = solved;
  $('[data-st="best"]').textContent = P.solo.best ? fmtTime(P.solo.best) : '–';
  const last = P.solo.times.slice(-10);
  $('[data-st="avg"]').textContent = last.length ? fmtTime(mean(last)) : '–';
  // the last twenty solve times, quickest at the top
  const ts = P.solo.times.slice(-20), svg = $('[data-spark]');
  if (ts.length >= 2) {
    const hi = Math.max(...ts), lo = Math.min(...ts), span = hi - lo || 1;
    const pts = ts.map((t, i) => [i / (ts.length - 1) * 296 + 2, 6 + (t - lo) / span * 52]);
    svg.innerHTML = `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>` +
      pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 4.5 : 2.5}" class="${i === pts.length - 1 ? 'now' : ''}"/>`).join('');
    $('[data-spark-cap]').textContent = `Your last ${ts.length} solves, from ${fmtTime(lo)} to ${fmtTime(hi)}. Lower is faster.`;
  }
  $('[data-rems]').innerHTML = DIVS.map(d => {
    const r = P.rem[d], lv = level(d);
    const line = r && r.n ? `${Math.round(100 * r.ok / r.n)}%${r.ms.length ? ` · ${(mean(r.ms) / 1000).toFixed(1)} s` : ''}` : 'not yet';
    return `<button type="button" class="rem rem-${lv}" data-rem="${d}" aria-label="Sprint on ${d}s: ${line}"><span class="rem-d">${d}</span><span class="rem-l">${line}</span></button>`;
  }).join('');
  const pct = (a, n) => n ? `${Math.round(100 * a / n)}% of ${n}` : '–';
  $('[data-st="nudge"]').textContent = pct(P.nudge.ok, P.nudge.n);
  $('[data-st="finish"]').textContent = P.finish.n ? `${pct(P.finish.ok, P.finish.n)}${P.finish.ms.length ? ` · ${fmtTime(mean(P.finish.ms))}` : ''}` : '–';
  $('[data-st="guided"]').textContent = P.guided.n ? `${P.guided.solved} of ${P.guided.n}` : '–';
  const s = streak(); $('[data-st="days"]').textContent = s ? `${s}` : '–';
  // the one thing to work on next
  const seen = DIVS.filter(d => P.rem[d]?.n >= 3);
  let tip = 'Start with a guided hand. It walks you through the method one step at a time.';
  if (P.guided.solved >= 3 && !P.solo.solved) tip = 'You know the steps. Try a solo hand: same method, no prompts, a clock.';
  else if (P.guided.solved) tip = 'Now a remainders sprint, so each divide comes without thinking. Your slow cards come up more.';
  if (seen.length) {
    const worst = seen.map(d => ({ d, s: P.rem[d].ok / P.rem[d].n - mean(P.rem[d].ms) / 20000 })).sort((a, b) => a.s - b.s)[0].d;
    tip = level(worst) === 'good' ? 'Every card you have tried is fast and right. Time for solo hands against the clock.' : `Work on ${worst}s next. The trick: ${trick(7217, worst)}.`;
  }
  $('[data-tip]').textContent = tip;
}

// ---------- modes ----------
const started = new Set();
const OPEN = { guided: guidedNew, solo: soloNew, sprint: () => {}, daily: dailyOpen };
function showMode(m) {
  if (!OPEN[m]) m = 'guided';
  $$('.mode').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === m));
  $$('.mode-pane').forEach(p => p.hidden = p.dataset.pane !== m);
  document.body.dataset.mode = m;
  if (history.replaceState) history.replaceState(null, '', '#' + m);
  if (!started.has(m)) { started.add(m); OPEN[m](); }
  else if (m === 'guided' && GD.phase !== 'finish') focusIn(gIn);
  else if (m === 'solo') focusIn(solo.pad.input);
}
const mode = () => document.body.dataset.mode;

addEventListener('keydown', e => {
  const typing = e.target.matches('input');
  if (e.key === '?') {
    e.preventDefault();
    ({ guided: guidedHint, solo: () => solo.hint(), daily: () => daily.hint() })[mode()]?.();
  } else if (e.key === 'Escape') {
    if (mode() === 'guided') guidedNew();
    else if (mode() === 'solo') soloNew();
    else if (mode() === 'sprint' && !$('[data-sp-run]').hidden) spSkip();
  } else if (e.key === 'Enter' && !typing) {
    if (mode() === 'guided' && GD.done) { e.preventDefault(); guidedNew(); }
    else if (mode() === 'sprint' && !$('[data-sp-end]').hidden) { e.preventDefault(); spStart(SP.kind, SP.focus); }
  } else if (e.key === 'Enter' && typing && mode() === 'guided' && GD.done) { e.preventDefault(); guidedNew(); }
});

setupGuided(); setupSolo(); setupDaily(); setupSprint();
$$('.mode').forEach(b => b.addEventListener('click', () => showMode(b.dataset.mode)));
$('[data-rems]').addEventListener('click', e => { const b = e.target.closest('[data-rem]'); if (b) { showMode('sprint'); spStart('rem', +b.dataset.rem); } });
$('[data-reset]').addEventListener('click', () => {
  if (!confirm('Reset all your practice numbers? This cannot be undone.')) return;
  localStorage.removeItem(KEY); location.reload();
});
renderStats();
showMode(location.hash.slice(1) || 'guided');
