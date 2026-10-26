// Exhaustive solver over subsets. Intermediate values: non-negative integers, exact division.
export const CAP = 2_000_000;

// vals[mask] : Map value -> [op, leftMask, leftVal, rightVal]  (op: 0 leaf, 1 +, 2 -, 3 *, 4 /)
export function buildVals(cards, maxSize = cards.length) {
  const n = cards.length, full = (1 << n) - 1;
  const vals = new Array(full + 1);
  const pc = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
  const masks = [];
  for (let m = 1; m <= full; m++) if (pc(m) <= maxSize) masks.push(m);
  masks.sort((a, b) => pc(a) - pc(b));
  for (const m of masks) {
    const map = new Map();
    if (pc(m) === 1) { map.set(cards[31 - Math.clz32(m)], [0]); vals[m] = map; continue; }
    // iterate sub-masks a with a < (m^a) to halve work (ops handle both orders)
    for (let a = (m - 1) & m; a > 0; a = (a - 1) & m) {
      const b = m ^ a;
      if (a > b) continue;
      const A = vals[a], B = vals[b];
      if (!A || !B) continue;
      for (const x of A.keys()) for (const y of B.keys()) {
        let v = x + y; if (v <= CAP && !map.has(v)) map.set(v, [1, a, x, y]);
        if (x >= y) { v = x - y; if (!map.has(v)) map.set(v, [2, a, x, y]); }
        else { v = y - x; if (!map.has(v)) map.set(v, [2, b, y, x]); }
        v = x * y; if (v <= CAP && !map.has(v)) map.set(v, [3, a, x, y]);
        if (y && x % y === 0) { v = x / y; if (!map.has(v)) map.set(v, [4, a, x, y]); }
        if (x && y % x === 0) { v = y / x; if (!map.has(v)) map.set(v, [4, b, y, x]); }
      }
    }
    vals[m] = map;
  }
  return vals;
}

// expression tree: {n} leaf or {op, l, r}
export function tree(vals, cards, mask, v) {
  const e = vals[mask].get(v);
  if (e[0] === 0) return { n: v };
  const [op, lm, lv, rv] = e;
  return { op: '+-*/'[op - 1], l: tree(vals, cards, lm, lv), r: tree(vals, cards, mask ^ lm, rv) };
}

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };
export function show(t, parentOp, right) {
  if (t.n !== undefined) return String(t.n);
  const s = show(t.l, t.op, false) + ' ' + ({ '*': '×', '/': '÷' }[t.op] || t.op) + ' ' + show(t.r, t.op, true);
  if (!parentOp) return s;
  const need = PREC[t.op] < PREC[parentOp] || (right && PREC[t.op] === PREC[parentOp] && (parentOp === '-' || parentOp === '/'));
  return need ? '(' + s + ')' : s;
}
export const val = t => t.n !== undefined ? t.n : ({ '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b })[t.op](val(t.l), val(t.r));

// Canonical form: flatten +/- into signed terms and */÷ into factors, sort. Two solutions that only
// differ by commutativity/associativity get the same key.
export function canon(t) {
  if (t.n !== undefined) return String(t.n);
  if (t.op === '+' || t.op === '-') {
    const pos = [], neg = [];
    (function walk(u, sign) {
      if (u.n === undefined && (u.op === '+' || u.op === '-')) { walk(u.l, sign); walk(u.r, u.op === '+' ? sign : -sign); }
      else (sign > 0 ? pos : neg).push(canon(u));
    })(t, 1);
    return 'S(' + pos.sort().join(',') + '|' + neg.sort().join(',') + ')';
  }
  const num = [], den = [];
  (function walk(u, up) {
    if (u.n === undefined && (u.op === '*' || u.op === '/')) { walk(u.l, up); walk(u.r, u.op === '*' ? up : !up); }
    else (up ? num : den).push(canon(u));
  })(t, true);
  return 'P(' + num.sort().join(',') + '|' + den.sort().join(',') + ')';
}

export function solve(cards, target, vals = buildVals(cards)) {
  const full = (1 << cards.length) - 1;
  return vals[full].has(target) ? tree(vals, cards, full, target) : null;
}

// Lower bound on the number of distinct solutions: every top-level split (A op B = target), each side
// reconstructed one way, deduped by canonical form. Returns {count, samples}.
export function many(cards, target, vals, limit = Infinity) {
  const full = (1 << cards.length) - 1, seen = new Map();
  for (let a = (full - 1) & full; a > 0; a = (a - 1) & full) {
    const b = full ^ a, A = vals[a], B = vals[b];
    for (const x of A.keys()) {
      const tries = [[target - x, '+'], [x - target, '-'], [target % x === 0 && x ? target / x : -1, '*'], [target && x % target === 0 ? x / target : -1, '/']];
      for (const [y, op] of tries) {
        if (y < 0 || !B.has(y)) continue;
        if (op === '/' && y === 0) continue;
        const t = { op, l: tree(vals, cards, a, x), r: tree(vals, cards, b, y) };
        const k = canon(t);
        if (!seen.has(k)) { seen.set(k, t); if (seen.size >= limit) return seen; }
      }
    }
  }
  return seen;
}

// All distinct solutions (by canonical form), recursively over every split, capped.
export function enumerate(cards, target, vals, cap = 1000, subCap = 0) {
  const memo = new Map();
  function all(mask, v, lim) {
    const key = mask * 4194304 + v;
    const hit = memo.get(key);
    if (hit && (hit.done || hit.list.length >= lim)) return hit.list;
    if (!(mask & (mask - 1))) { const r = { list: [{ n: v }], done: true }; memo.set(key, r); return r.list; }
    const out = new Map();
    let done = true;
    outer:
    for (let a = (mask - 1) & mask; a > 0; a = (a - 1) & mask) {
      const b = mask ^ a, A = vals[a], B = vals[b];
      const tries = x => [[v - x, '+', x <= v], [x - v, '-', x >= v], [x && v % x === 0 ? v / x : -1, '*', x > 0], [v && x % v === 0 ? x / v : -1, '/', v > 0]];
      for (const x of A.keys()) for (const [y, op, ok] of tries(x)) {
        if (!ok || y < 0 || !B.has(y) || (op === '/' && y === 0)) continue;
        if ((op === '+' || op === '*') && a > b) continue; // symmetric, other order covers it
        const sub = subCap || Math.max(2, Math.ceil(Math.sqrt(lim)));
        for (const l of all(a, x, sub)) for (const r of all(b, y, sub)) {
          const t = { op, l, r }, k = canon(t);
          if (!out.has(k)) out.set(k, t);
          if (out.size >= lim) { done = false; break outer; }
        }
      }
    }
    const r = { list: [...out.values()], done };
    memo.set(key, r);
    return r.list;
  }
  return all((1 << cards.length) - 1, target, cap);
}

// ---- The trunk-and-correction method, as a step-by-step hint ----
const pcount = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
const bitsOf = (cards, m) => cards.filter((_, i) => m >> i & 1);

// Products of three or four cards nearest the target (the "rough trunk"), leaning towards big cards.
export function trunks(cards, target) {
  const n = cards.length, out = [], seen = new Set();
  for (let m = 1; m < 1 << n; m++) {
    const k = pcount(m); if (k < 3 || k > 4) continue;
    const pick = cards.filter((_, i) => m >> i & 1).sort((a, b) => b - a);
    const key = pick.join(','); if (seen.has(key)) continue; seen.add(key);
    if (pick.includes(1)) continue;
    const p = pick.reduce((a, b) => a * b, 1);
    out.push({ pick, p, off: Math.abs(Math.log(p / target)) + (k === 4 ? 0.01 : 0) });
  }
  return out.sort((a, b) => a.off - b.off).slice(0, 3);
}

// One step: target = d × X ± c, where d is one card, c is made from up to 3 other cards and X is
// still makeable from the rest. Smallest correction wins, bigger divisors break ties.
export function methodStep(cards, vals, mask, T, prefer = [], loose = false) {
  let best = null;
  for (let i = 0; i < cards.length; i++) {
    if (!(mask >> i & 1)) continue;
    const d = cards[i]; if (d < 2) continue;
    const restAll = mask & ~(1 << i);
    for (let S = restAll; ; S = (S - 1) & restAll) {
      const k = pcount(S);
      const rest = restAll ^ S;
      if (k <= 3 && rest) {
        const cs = S ? vals[S].keys() : [0];
        for (const c of cs) {
          if (c > (loose ? 99 : Math.max(13, 2 * d))) continue;
          for (const sign of c ? [1, -1] : [1]) {
            const X = (T - sign * c) / d;
            if (!Number.isInteger(X) || X < 2 || !vals[rest].has(X)) continue;
            const score = c * 1.0 + k * 2 - d * 1.5 + (pcount(rest) < 2 ? 8 : 0) - (prefer.includes(d) ? 6 : 0);
            if (!best || score < best.score) best = { score, d, di: i, S, c, sign, X, rest };
          }
        }
      }
      if (S === 0) break;
    }
  }
  return best;
}

// Full walk: repeatedly peel off a divisor until three or fewer cards remain.
export function methodWalk(cards, target, vals, prefer = trunks(cards, target)[0]?.pick || []) {
  const steps = [];
  prefer = [...prefer];
  let mask = (1 << cards.length) - 1, T = target;
  while (pcount(mask) > 3) {
    const s = methodStep(cards, vals, mask, T, prefer) || methodStep(cards, vals, mask, T, prefer, true);
    if (!s) break;
    if (prefer.includes(s.d)) prefer.splice(prefer.indexOf(s.d), 1);
    s.T = T; s.cardsLeft = bitsOf(cards, mask);
    s.cTree = s.S ? tree(vals, cards, s.S, s.c) : null;
    steps.push(s);
    mask = s.rest; T = s.X;
  }
  const finish = vals[mask].has(T) ? { T, cards: bitsOf(cards, mask), tree: tree(vals, cards, mask, T) } : null;
  if (!finish) return null;
  // assemble the whole expression from the inside out
  let e = finish.tree;
  for (let j = steps.length - 1; j >= 0; j--) {
    const s = steps[j];
    e = { op: '*', l: { n: s.d }, r: e };
    if (s.cTree) e = { op: s.sign > 0 ? '+' : '-', l: e, r: s.cTree };
  }
  return { steps, finish, tree: e };
}

// ---- The sharpened method: biggest divider first, one card per nudge, twice, then the last cards ----
// Nudges that make T divide by d, smallest first. sign +1 means T = d × X + c, −1 means T = d × X − c.
export function nudgeOptions(T, d, max = 13) {
  const r = T % d;
  if (r === 0) return [[0, 1]];
  return [[r, 1], [d - r, -1], [r + d, 1], [2 * d - r, -1]].filter(([c]) => c <= max).sort((a, b) => a[0] - b[0]);
}

// Every two-divider route in the order a player would try them. Each route: {steps:[{d,i,c,j,sign,T,X}], mask, Y, ok}.
// Every divide-and-nudge a player would try from here, in their order: biggest card first, smallest nudge first.
export function peelsFrom(cards, mask, T) {
  const seen = new Set(), order = [];
  [...cards.keys()].filter(i => mask >> i & 1 && cards[i] >= 2).sort((a, b) => cards[b] - cards[a])
    .forEach(i => { if (!seen.has(cards[i])) { seen.add(cards[i]); order.push(i); } });
  const res = [];
  for (const i of order) {
    const d = cards[i], m = mask & ~(1 << i);
    for (const [c, sign] of nudgeOptions(T, d)) {
      const j = c ? [...cards.keys()].find(k => m >> k & 1 && cards[k] === c) : -1;
      if (j === undefined) continue;
      const X = (T - sign * c) / d;
      if (X < 1) continue;
      res.push({ d, i, c, j, sign, T, X, rest: j >= 0 ? m & ~(1 << j) : m });
    }
  }
  return res;
}

export function playerRoutes(cards, target, vals, limit = 400) {
  const out = [], n = cards.length;
  const peel = (mask, T) => peelsFrom(cards, mask, T);
  for (const a of peel((1 << n) - 1, target)) {
    for (const b of peel(a.rest, a.X)) {
      if (!b.rest) continue;
      out.push({ steps: [a, b], mask: b.rest, Y: b.X, ok: vals[b.rest].has(b.X) });
      if (out.length >= limit) return out;
    }
  }
  return out;
}
