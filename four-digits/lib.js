export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const SUIT = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };

// A card is a small drawing: rounded face, a suit in two corners, the value in the middle.
export function cardHTML(v, suit = 's', tag = 'span', attrs = '') {
  const red = suit === 'h' || suit === 'd' ? ' red' : '';
  const label = `${v} of ${SUIT[suit]}`;
  const svg = `<svg viewBox="0 0 50 70" aria-hidden="true" focusable="false"><rect class="face" width="50" height="70" rx="5"/><use href="#s-${suit}" x="4" y="4" width="9" height="12"/><use href="#s-${suit}" x="4" y="4" width="9" height="12" transform="rotate(180 25 35)"/><text x="25" y="${v > 9 ? 47 : 48}" text-anchor="middle">${v}</text></svg>`;
  if (tag === 'button') return `<button class="card${red}" ${attrs}>${svg}</button>`;
  return `<span class="card${red}" role="img" aria-label="${label}" ${attrs}>${svg}</span>`;
}

// ---------- expressions: parse to a tree, evaluate exactly ----------
const OPS = { '+': '+', '-': '-', '−': '-', '–': '-', '*': '*', '×': '*', 'x': '*', 'X': '*', '·': '*', '/': '/', '÷': '/' };
function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/\d/.test(ch)) { let j = i; while (j < s.length && /\d/.test(s[j])) j++; out.push({ t: 'n', v: +s.slice(i, j) }); i = j; continue; }
    if (OPS[ch]) { out.push({ t: 'o', v: OPS[ch] }); i++; continue; }
    if (ch === '(' || ch === ')') { out.push({ t: ch }); i++; continue; }
    throw { msg: `“${ch}” is not something you can use.` };
  }
  return out;
}
export function parse(s) {
  const tk = tokenize(s); let p = 0;
  const peek = () => tk[p];
  function expr() {
    let l = term();
    while (peek() && peek().t === 'o' && (peek().v === '+' || peek().v === '-')) { const op = tk[p++].v; l = { op, l, r: term() }; }
    return l;
  }
  function term() {
    let l = factor();
    while (peek() && peek().t === 'o' && (peek().v === '*' || peek().v === '/')) { const op = tk[p++].v; l = { op, l, r: factor() }; }
    return l;
  }
  function factor() {
    const t = tk[p++];
    if (!t) throw { incomplete: true };
    if (t.t === 'n') return { n: t.v };
    if (t.t === '(') { const e = expr(); if (!peek()) throw { incomplete: true }; if (peek().t !== ')') throw { msg: 'A bracket is not closed.' }; p++; return e; }
    if (t.t === 'o') throw { msg: 'Two operators in a row.' };
    throw { msg: 'A closing bracket came too early.' };
  }
  if (!tk.length) throw { empty: true };
  const e = expr();
  if (p < tk.length) throw tk[p].t === 'n' ? { msg: 'Two numbers need an operator between them.' } : { msg: 'A closing bracket came too early.' };
  return e;
}
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export function evalQ(t) {
  if (t.n !== undefined) return [t.n, 1];
  const [a, b] = evalQ(t.l), [c, d] = evalQ(t.r);
  let n, m;
  if (t.op === '+') { n = a * d + c * b; m = b * d; }
  else if (t.op === '-') { n = a * d - c * b; m = b * d; }
  else if (t.op === '*') { n = a * c; m = b * d; }
  else { if (c === 0) throw { msg: 'That divides by zero.' }; n = a * d; m = b * c; }
  if (m < 0) { n = -n; m = -m; }
  const g = gcd(n, m); return [n / g, m / g];
}
export const leaves = t => t.n !== undefined ? [t.n] : [...leaves(t.l), ...leaves(t.r)];
export const fmtQ = ([n, d]) => d === 1 ? n.toLocaleString('en-US') : `${n}/${d}`;


// ---------- divisibility reasons ----------
export const digitSum = n => String(n).split('').reduce((a, b) => a + +b, 0);
export function reason(m, d) {
  const s = digitSum(m), l2 = String(m % 100).padStart(2, '0'), l3 = String(m % 1000).padStart(3, '0');
  switch (d) {
    case 2: return `${m} is even`;
    case 3: return `its digits add to ${s}`;
    case 4: return `${l2} divides by 4`;
    case 5: return `it ends in ${m % 10}`;
    case 6: return `it is even and its digits add to ${s}`;
    case 8: return `${l3} divides by 8`;
    case 9: return `its digits add to ${s}`;
    case 10: return `it ends in 0`;
    case 11: { const ds = String(m).split('').map(Number); const a = ds.reduce((acc, x, i) => acc + (i % 2 ? -x : x), 0); return `${ds.map((x, i) => (i ? (i % 2 ? ' − ' : ' + ') : '') + x).join('')} = ${a < 0 ? '−' + -a : a}`; }
    case 12: return `its digits add to ${s} and ${l2} divides by 4`;
    default: return `${d} × ${m / d} = ${m}`;
  }
}
export const pretty = s => s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');
export const list = a => a.length === 1 ? String(a[0]) : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];


// ---------- the solver runs in a worker so the page never freezes ----------
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
let reqId = 0; const pending = new Map();
worker.onmessage = ({ data }) => { const f = pending.get(data.id); if (f) { pending.delete(data.id); f(data); } };
export const ask = msg => new Promise(res => { const id = ++reqId; pending.set(id, res); worker.postMessage({ ...msg, id }); });


export function fmtTime(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

// ---------- cards on the table ----------
export const SUITS = ['s', 'h', 'd', 'c'];
export function dealLocal(n) {
  const deck = [];
  for (let v = 1; v <= 13; v++) for (const s of SUITS) deck.push({ v, s });
  return Array.from({ length: n }, () => deck.splice(Math.floor(Math.random() * deck.length), 1)[0]);
}
export const rand4 = () => 1000 + Math.floor(Math.random() * 9000);
// used: spent or out of play; pick: the card being divided by; mark: the answer, shown after a miss
export function renderCards(el, hand, { used = new Set(), pick = new Set(), mark = new Set() } = {}) {
  el.innerHTML = hand.map((c, i) => {
    const state = used.has(i) ? ', spent' : pick.has(i) ? ', the divider' : '';
    return cardHTML(c.v, c.s, 'button', `type="button" data-i="${i}" aria-label="${c.v} of ${SUIT[c.s]}${state}"${used.has(i) ? ' aria-disabled="true"' : ''}`);
  }).join('');
  $$('.card', el).forEach((b, i) => { b.style.setProperty('--i', i); b.classList.toggle('used', used.has(i)); b.classList.toggle('pick', pick.has(i)); b.classList.toggle('mark', mark.has(i)); });
  // A new hand is dealt onto the table; taps on the same hand just redraw it.
  const key = hand.map(c => c.v + c.s).join();
  if (el.dataset.dealt !== key) { el.dataset.dealt = key; el.classList.remove('deal'); void el.offsetWidth; el.classList.add('deal'); clearTimeout(el._deal); el._deal = setTimeout(() => el.classList.remove('deal'), 900); }
}
export const onCard = (el, f) => el.addEventListener('click', e => { const b = e.target.closest('.card'); if (b && !b.classList.contains('used')) f(+b.dataset.i); });


export function nudgeNeed(T, d) {
  const r = T % d, opts = [`${r} to go down`, `${d - r} to go up`];
  if (r + d <= 13) opts.push(`${r + d} down`);
  if (2 * d - r <= 13) opts.push(`${2 * d - r} up`);
  return `${d} leaves ${r}, so you need ${list(opts).replace(/ and ([^,]*)$/, ' or $1')}`;
}

// 7217 by 12 → [7200, 12] and 5 left: big easy multiples first.
export function chunks(T, d) {
  const parts = []; let rest = T;
  for (const p of [1000, 100, 10, 1]) { const q = Math.floor(rest / (d * p)); if (q) { parts.push(d * p * q); rest -= d * p * q; } }
  return { parts, r: rest };
}
export function chunkText(T, d) {
  const { parts, r } = chunks(T, d);
  return `${T} = ${parts.join(' + ')}${r ? ' + ' + r : ''}. Every chunk ${r ? 'but the last ' : ''}is a multiple of ${d}, so ${d} leaves ${r}.`;
}


export const fits = (T, d, v) => (T - v) % d === 0 || (T + v) % d === 0;

// Does the expression add or subtract outside all brackets? Then it needs brackets when multiplied.
export function loose(e) {
  let depth = 0;
  for (const ch of e) { if (ch === '(') depth++; else if (ch === ')') depth--; else if (!depth && (ch === '+' || ch === '−' || ch === '-')) return true; }
  return false;
}
export const wrap = e => loose(e) ? `(${e})` : e;

export const words = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight' };

// ---------- the expression pad: cards, a line to type in, operator keys, a live readout ----------
export function makePad(root, n, onWin) {
  root.innerHTML = `<div class="hand" data-pad-hand aria-label="Your cards. Click one to add it."></div>
    <label class="sr" for="expr${n}">Your expression</label>
    <input class="expr" id="expr${n}" autocomplete="off" spellcheck="false">
    <div class="keys" aria-label="Operators">${[[' + ', '+'], [' − ', '−'], [' × ', '×'], [' ÷ ', '÷'], ['(', '('], [')', ')']].map(([k, l]) => `<button class="key" type="button" data-key="${k}">${l}</button>`).join('')}<button class="key" type="button" data-key="back" aria-label="Delete last">⌫</button><button class="key" type="button" data-key="clear">Clear</button></div>
    <p class="readout" data-pad-out aria-live="polite"></p>`;
  const P = { hand: [], allowed: [], target: 0, done: false, input: $('.expr', root), out: $('[data-pad-out]', root), handEl: $('[data-pad-hand]', root) };
  const need = () => P.allowed.length;
  const idle = () => `Use all ${words[need()] || need()} cards once each.`;
  function mark(nums) {
    const used = new Set(), extra = [];
    for (const v of nums) { const i = P.allowed.find(j => P.hand[j].v === v && !used.has(j)); if (i === undefined) extra.push(v); else used.add(i); }
    return { used, extra };
  }
  function draw(used) {
    const spent = new Set(P.hand.map((_, i) => i).filter(i => !P.allowed.includes(i) || used.has(i)));
    renderCards(P.handEl, P.hand, { used: spent });
  }
  P.set = ({ hand, allowed, target, placeholder }) => {
    Object.assign(P, { hand, allowed: allowed || hand.map((_, i) => i), target, done: false });
    P.input.value = ''; P.input.placeholder = placeholder || 'Click cards or type';
    draw(new Set()); P.out.textContent = idle();
  };
  P.check = () => {
    if (P.done) return;
    const s = P.input.value;
    let tree;
    try { tree = parse(s); }
    catch (e) { draw(mark((s.match(/\d+/g) || []).map(Number)).used); P.out.textContent = e.empty ? idle() : e.incomplete ? 'Keep going…' : e.msg; return; }
    const { used, extra } = mark(leaves(tree));
    draw(used);
    if (extra.length) { P.out.textContent = `You don't have ${P.hand.some((c, i) => c.v === extra[0] && P.allowed.includes(i)) ? 'another' : 'a'} ${extra[0]} to use.`; return; }
    let q;
    try { q = evalQ(tree); } catch (e) { P.out.textContent = e.msg; return; }
    const left = need() - used.size;
    if (q[1] === 1 && q[0] === P.target && left === 0) { P.done = true; return onWin(s); }
    const diff = q[1] === 1 ? Math.abs(q[0] - P.target) : null;
    const bits = [`= <b>${fmtQ(q)}</b>`, left ? `${left} card${left > 1 ? 's' : ''} left` : 'every card used'];
    if (diff !== null) bits.push(diff === 0 ? 'right on the target, now fit the rest in' : `${diff.toLocaleString('en-US')} ${q[0] > P.target ? 'over' : 'under'}`);
    P.out.innerHTML = bits.join(' · ');
  };
  function insert(txt) {
    const el = P.input, a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a;
    let ins = txt;
    if (/^\d+$/.test(txt) && /\d\s*$/.test(el.value.slice(0, a))) ins = ' × ' + txt; // a number after a number means multiply
    el.value = el.value.slice(0, a) + ins + el.value.slice(b);
    el.setSelectionRange(a + ins.length, a + ins.length);
    P.check();
  }
  onCard(P.handEl, i => { if (!P.done && P.allowed.includes(i)) insert(String(P.hand[i].v)); });
  $$('.key', root).forEach(k => k.addEventListener('click', () => {
    if (P.done) return;
    const v = k.dataset.key;
    if (v === 'back') { P.input.value = P.input.value.replace(/\s*\S\s*$/, ''); P.check(); }
    else if (v === 'clear') { P.input.value = ''; P.check(); }
    else insert(v);
  }));
  P.input.addEventListener('input', P.check);
  return P;
}


// One hint per press, following the sharpened method: biggest divider, one-card nudge, twice, then the last cards.
export function stepText(s) {
  if (!s.c) return `<span class="m">${s.T} ÷ ${s.d} = ${s.X}</span> exactly, because ${reason(s.T, s.d)}.`;
  const m = s.T - s.sign * s.c;
  return `${s.d} leaves ${s.T % s.d}, so <span class="m">${s.T} ${s.sign > 0 ? '−' : '+'} ${s.c} = ${m} = ${s.d} × ${s.X}</span>. Your ${s.c} pays the nudge.`;
}
export function hintsFor(info) {
  const r = info.route;
  if (r) {
    const [a, b] = r.steps;
    const dead = info.deadEnds.filter(x => x.steps[0].d === a.d && x.steps[0].c === a.c && x.steps[1].d !== b.d);
    const out = [
      `${a.d === Math.max(...info.hand.map(c => c.v)) ? 'Start with your biggest card.' : 'Start with a big card.'} ${stepText(a)}`,
      `Now make ${a.X}. ${stepText(b)}${dead.length ? ` (Trying ${list(dead.map(x => x.steps[1].d))} first leads to a dead end here.)` : ''}`,
      `Now it's the 24 game: make <span class="m">${r.Y}</span> from ${list(r.left)}.`,
      `<span class="m">${r.Y} = ${pretty(r.finish)}</span>. So <span class="m">${info.target} = ${pretty(info.answer)}</span>.`,
    ];
    if (info.tries > 1 && !dead.length) out[0] += ` (The rules take ${info.tries} tries on this hand. This is the one that works.)`;
    return out;
  }
  // rare hands with no two-divider route: fall back to the general walk
  const out = [];
  for (const s of info.steps) {
    const restTxt = s.rest.length === 1 ? `That leaves ${s.X}, which is your last card.` : `Now make <span class="m">${s.X}</span> from ${list(s.rest)}.`;
    const pay = !s.c ? '' : s.cExpr === String(s.c) ? ` Your ${s.c} pays the nudge.` : ` Make the ${s.c} from <span class="m">${pretty(s.cExpr)}</span>.`;
    out.push(s.c ? `${s.d} leaves ${s.T % s.d}: <span class="m">${s.T} ${s.sign > 0 ? '−' : '+'} ${s.c} = ${s.T - s.sign * s.c} = ${s.d} × ${s.X}</span>.${pay} ${restTxt}` : `<span class="m">${s.T} ÷ ${s.d} = ${s.X}</span> exactly. ${restTxt}`);
  }
  if (info.finish && info.finish.cards.length > 1) out.push(`Last: <span class="m">${info.finish.T} = ${pretty(info.finish.expr)}</span>.`);
  out.push(`So <span class="m">${info.target} = ${pretty(info.answer)}</span>.`);
  return out;
}
