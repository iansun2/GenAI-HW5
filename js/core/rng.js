(function (G) {
  // mulberry32,狀態存在 s.rng 以便存檔重現
  const R = G.RNG = {};

  R.next = function (s) {
    s.rng = (s.rng + 0x6D2B79F5) >>> 0;
    let t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  R.range = (s, a, b) => a + (b - a) * R.next(s);
  R.int = (s, a, b) => a + Math.floor(R.next(s) * (b - a + 1));
  R.chance = (s, p) => R.next(s) < p;
  R.pick = (s, arr) => arr[Math.floor(R.next(s) * arr.length)];
  R.weighted = function (s, items, w) {
    const total = items.reduce((a, x) => a + w(x), 0);
    if (total <= 0) return null;
    let r = R.next(s) * total;
    for (const x of items) { r -= w(x); if (r <= 0) return x; }
    return items[items.length - 1];
  };
})(window.Game);
