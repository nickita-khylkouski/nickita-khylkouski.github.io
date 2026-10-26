import { buildVals, show, tree, enumerate, methodWalk, trunks, playerRoutes, peelsFrom, nudgeOptions } from './solver.js';

const SUITS = ['s', 'h', 'd', 'c'];

function dealHand(n, rnd = Math.random) {
  const deck = [];
  for (let v = 1; v <= 13; v++) for (let s = 0; s < 4; s++) deck.push({ v, s: SUITS[s] });
  const hand = [];
  for (let i = 0; i < n; i++) hand.push(deck.splice(Math.floor(rnd() * deck.length), 1)[0]);
  return hand;
}
// The daily hand: the same cards and target for everyone on the same date.
function seeded(str) {
  let h = 1779033703;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353), h = h << 13 | h >>> 19;
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

// One hand's reachable numbers are reused while the player works on it.
// A few hands are kept, so dealing the next hand ahead doesn't throw away the one being played.
const cache = new Map();
function valsFor(cards) {
  const key = cards.join(',');
  let vals = cache.get(key);
  if (!vals) { vals = buildVals(cards); cache.set(key, vals); if (cache.size > 4) cache.delete(cache.keys().next().value); }
  return vals;
}

// Adds or subtracts outside all brackets, so it needs brackets when multiplied.
function loose(e) {
  let depth = 0;
  for (const ch of e) { if (ch === '(') depth++; else if (ch === ')') depth--; else if (!depth && (ch === '+' || ch === '-' || ch === '−')) return true; }
  return false;
}
const bits = (cards, m) => cards.filter((_, i) => m >> i & 1);
const routeOut = (cards, vals, r) => ({
  steps: r.steps.map(s => ({ d: s.d, i: s.i, c: s.c, j: s.j, sign: s.sign, T: s.T, X: s.X })),
  Y: r.Y, mask: r.mask, left: bits(cards, r.mask), ok: r.ok,
  finish: r.ok ? show(tree(vals, cards, r.mask, r.Y)) : null,
});

function analyse(cards, target) {
  const vals = valsFor(cards);
  const full = (1 << cards.length) - 1;
  if (!vals[full].has(target)) return { solvable: false };
  const routes = playerRoutes(cards, target, vals);
  const k = routes.findIndex(r => r.ok);
  const walk = methodWalk(cards, target, vals);
  const sols = enumerate(cards, target, vals, 400, 30).map(t => show(t));
  let answer = walk ? show(walk.tree) : sols[0];
  if (k >= 0) {
    const [a, b] = routes[k].steps;
    let e = show(tree(vals, cards, routes[k].mask, routes[k].Y));
    for (const s of [b, a]) e = `${s.d} × ${loose(e) ? `(${e})` : e}` + (s.c ? ` ${s.sign > 0 ? '+' : '-'} ${s.c}` : '');
    answer = e;
  }
  return {
    solvable: true,
    trunks: trunks(cards, target),
    route: k >= 0 ? routeOut(cards, vals, routes[k]) : null,
    tries: k + 1,
    deadEnds: k > 0 ? routes.slice(0, Math.min(k, 3)).map(r => routeOut(cards, vals, r)) : [],
    steps: walk ? walk.steps.map(s => ({ T: s.T, d: s.d, X: s.X, sign: s.sign, c: s.c, cExpr: s.cTree ? show(s.cTree) : null, left: s.cardsLeft, rest: bits(cards, s.rest) })) : [],
    finish: walk ? { T: walk.finish.T, cards: walk.finish.cards, expr: show(walk.finish.tree) } : null,
    answer,
    solutions: sols.sort((a, b) => a.length - b.length),
    more: sols.length >= 400,
  };
}

// The next divide-and-nudge from where the player stands, the first in player order that still leads to a finish.
// left: how many divides are still to come (2 at the start, then 1). skipped: bigger dividers that lead nowhere.
function guide(cards, mask, T, left) {
  const vals = valsFor(cards);
  for (const a of peelsFrom(cards, mask, T)) {
    const ok = left <= 1 ? vals[a.rest].has(a.X) : peelsFrom(cards, a.rest, a.X).some(b => b.rest && vals[b.rest].has(b.X));
    if (!ok) continue;
    // bigger cards passed over, either because no card pays their nudge or because they lead nowhere
    const skipped = [...new Set(cards.filter((v, i) => mask >> i & 1 && v > a.d))].sort((x, y) => y - x);
    // why each one was passed over: no card for any nudge it needs, or the nudges it can pay lead nowhere
    const why = skipped.map(d => {
      const paid = peelsFrom(cards, mask, T).filter(p => p.d === d);
      return { d, r: T % d, need: nudgeOptions(T, d).map(([c, sign]) => ({ c, sign, X: (T - sign * c) / d })), paid: paid.map(p => ({ c: p.c, sign: p.sign, X: p.X })) };
    });
    return { d: a.d, i: a.i, c: a.c, j: a.j, sign: a.sign, X: a.X, skipped, why };
  }
  return null;
}

// A hand where two dividers are already done and the last four cards have to make what's left.
function finishDeal() {
  for (let tries = 0; tries < 60; tries++) {
    const hand = dealHand(8), cards = hand.map(c => c.v);
    const target = 1000 + Math.floor(Math.random() * 9000);
    const vals = valsFor(cards);
    if (!vals[255].has(target)) continue;
    const good = playerRoutes(cards, target, vals).filter(r => r.ok && r.steps.every(s => s.j >= 0) && r.Y >= 8 && r.Y <= 120);
    if (!good.length) continue;
    const r = good[Math.floor(Math.random() * Math.min(good.length, 4))];
    const left = bits(cards, r.mask);
    const lv = buildVals(left);
    const sols = enumerate(left, r.Y, lv, 60, 20).map(t => show(t)).sort((a, b) => a.length - b.length);
    return { hand, target, route: routeOut(cards, vals, r), finishes: sols };
  }
}

self.onmessage = ({ data }) => {
  if (data.type === 'deal') {
    // Deal until the hand can be solved (about 1 in 50 cannot), so practice never dead-ends.
    // needRoute: only hands the method can do (about 97 in 100), for guided play. seed: the daily hand.
    const rnd = data.seed ? seeded(data.seed) : Math.random;
    for (let tries = 0; tries < 40; tries++) {
      const hand = dealHand(data.n || 8, rnd);
      const target = 1000 + Math.floor(rnd() * 9000);
      const res = analyse(hand.map(c => c.v), target);
      if (res.solvable && (!data.needRoute || res.route)) { self.postMessage({ id: data.id, hand, target, ...res, skipped: tries }); return; }
    }
  } else if (data.type === 'analyse') {
    self.postMessage({ id: data.id, ...analyse(data.cards, data.target) });
  } else if (data.type === 'finish') {
    self.postMessage({ id: data.id, ...finishDeal() });
  } else if (data.type === 'guide') {
    self.postMessage({ id: data.id, step: guide(data.cards, data.mask, data.T, data.left) });
  } else if (data.type === 'alive') {
    // Can the cards in mask still make X? If so, one way to do it.
    const vals = valsFor(data.cards);
    const ok = vals[data.mask]?.has(data.X) || false;
    self.postMessage({ id: data.id, ok, expr: ok ? show(tree(vals, data.cards, data.mask, data.X)) : null });
  }
};
