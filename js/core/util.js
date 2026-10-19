window.Game = window.Game || {};
(function (G) {
  const U = G.U = {};

  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.round = (v, d = 1) => { const f = Math.pow(10, d); return Math.round(v * f) / f; };
  U.sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);
  U.money = v => {
    const a = Math.abs(v), sign = v < 0 ? '-' : '';
    if (a >= 1000) return sign + '₵' + (a / 1000).toFixed(2) + 'B';
    return sign + '₵' + a.toFixed(1) + 'M';
  };
  U.pct = (v, d = 1) => (v * 100).toFixed(d) + '%';
  U.ton = v => v.toFixed(2) + ' t';
  U.date = m => {
    const y = G.BALANCE.startYear + Math.floor(m / 12);
    return `${y} 年 ${m % 12 + 1} 月`;
  };
  U.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.uid = (s, prefix) => prefix + (s.nextId++);

  G.Log = {
    add(s, text, kind = 'info') {
      s.log.unshift({ m: s.month, t: text, k: kind });
      if (s.log.length > 400) s.log.length = 400;
    }
  };
})(window.Game);
