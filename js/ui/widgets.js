// 共用小元件:折線圖、進度條、火箭示意圖
(function (G) {
  const U = G.U, UI = G.UI;

  UI.lineChart = function (series, opt = {}) {
    const W = opt.w || 640, H = opt.h || 200, PL = 52, PR = 10, PT = 10, PB = 22;
    const n = Math.max(0, ...series.map(x => x.values.length));
    if (n < 2) return '<div class="dim small">資料累積中(至少需要兩個月)。</div>';
    const all = series.flatMap(x => x.values);
    let mn = Math.min(0, ...all), mx = Math.max(1, ...all);
    if (mx - mn < 1) mx = mn + 1;
    const X = i => PL + (W - PL - PR) * i / (n - 1);
    const Y = v => PT + (H - PT - PB) * (1 - (v - mn) / (mx - mn));
    const ticks = [mn, (mn + mx) / 2, mx];
    if (mn < 0) ticks.push(0);
    const grid = ticks.map(v => `<line x1="${PL}" x2="${W - PR}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#2b6191' : '#15304d'}" stroke-dasharray="${v === 0 ? '' : '3 4'}"/>
      <text x="${PL - 6}" y="${Y(v) + 4}" fill="#7593b3" font-size="10" text-anchor="end" font-family="monospace">${Math.round(v)}</text>`).join('');
    const lines = series.map(x => {
      const d = x.values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
      return `<path d="${d}" fill="none" stroke="${x.color}" stroke-width="2" stroke-linejoin="round"/>`;
    }).join('');
    const labels = (opt.labels || []).map((t, i) => (i % Math.ceil(n / 6) === 0 || i === n - 1 ? `<text x="${X(i)}" y="${H - 6}" fill="#7593b3" font-size="10" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${t}</text>` : '')).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${grid}${lines}${labels}</svg>
      <div class="legend">${series.map(x => `<span><i style="background:${x.color}"></i>${x.name}</span>`).join('')}</div>`;
  };

  UI.bar = function (ratio, cls) {
    const pct = U.clamp(ratio, 0, 1) * 100;
    cls = cls || (ratio >= 1 ? 'bad' : ratio >= 0.7 ? 'warn' : '');
    return `<div class="bar ${cls}"><i style="width:${pct.toFixed(1)}%"></i></div>`;
  };

  UI.crowdBars = function (s) {
    const counts = G.Orbit.counts(s);
    return G.ORBIT_ORDER.map(o => {
      const c = G.Orbit.crowd(s, o, counts);
      return `<div class="bar-row"><span class="mono">${o}</span>${UI.bar(c)}<span class="mono right ${c >= 1 ? 'bad' : c >= 0.7 ? 'warn' : ''}">${U.pct(c, 0)}</span></div>`;
    }).join('');
  };

  // 火箭側視示意圖(由下而上堆疊各級)
  UI.rocketSVG = function (bp) {
    const C = G.COMPONENTS;
    const W = 150, H = 360, cx = W / 2;
    const stages = bp.stages.map(st => {
      const t = C[st.tank], prop = t.prop * st.tankCount;
      return { st, h: 26 + Math.sqrt(prop) * 4.2, w: 18 + Math.sqrt(t.prop) * 2.2 };
    });
    const fair = C[bp.fairing];
    const fairH = 26 + Math.sqrt(fair.maxPayload) * 9;
    const bellH = 14;
    const total = U.sum(stages, x => x.h) + fairH + bellH * stages.length;
    const scale = Math.min(1, (H - 20) / total);
    let y = H - 6;
    let out = '';
    stages.forEach((x, i) => {
      const h = x.h * scale, w = Math.min(W - 30, x.w), bh = bellH * scale;
      const n = Math.min(x.st.engineCount, 5);
      const bw = Math.min(14, (w - 4) / n);
      for (let k = 0; k < n; k++) {
        const bx = cx - (n * bw) / 2 + k * bw + bw / 2;
        out += `<path d="M${bx - bw * 0.3},${y - bh} L${bx + bw * 0.3},${y - bh} L${bx + bw * 0.48},${y} L${bx - bw * 0.48},${y} Z" fill="#3a5b7d" stroke="#6d8bab" stroke-width="0.8"/>`;
      }
      y -= bh;
      out += `<rect x="${cx - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="url(#body${i % 2})" stroke="#9fd8ff" stroke-width="1"/>`;
      out += `<line x1="${cx - w / 2}" x2="${cx + w / 2}" y1="${y - h}" y2="${y - h}" stroke="#3ff2ff" stroke-width="1.5"/>`;
      out += `<text x="${cx}" y="${y - h / 2 + 4}" fill="#04101f" font-size="11" text-anchor="middle" font-family="monospace" font-weight="700">S${i + 1}</text>`;
      if (x.st.engineCount > 5) out += `<text x="${cx + w / 2 + 3}" y="${y + bh}" fill="#7593b3" font-size="9" font-family="monospace">×${x.st.engineCount}</text>`;
      if (i === 0 && bp.boosters && bp.boosters.count > 0) {
        const perSide = Math.min(3, bp.boosters.count / 2), bh2 = h * 0.85, bw2 = 8;
        for (let k = 0; k < perSide; k++) {
          [-1, 1].forEach(side => {
            const bx = side < 0 ? cx - w / 2 - (k + 1) * (bw2 + 1) : cx + w / 2 + k * (bw2 + 1) + 1;
            out += `<rect x="${bx}" y="${y - bh2}" width="${bw2}" height="${bh2}" fill="#d8c9a8" stroke="#ff9f43" stroke-width="0.8"/>`;
            out += `<path d="M${bx},${y - bh2} L${bx + bw2 / 2},${y - bh2 - 10} L${bx + bw2},${y - bh2} Z" fill="#d8c9a8" stroke="#ff9f43" stroke-width="0.8"/>`;
          });
        }
        if (bp.boosters.count > 6) out += `<text x="${cx}" y="${y + 12}" fill="#ff9f43" font-size="9" text-anchor="middle">+${bp.boosters.count} 助推</text>`;
      }
      if (i === 0 && bp.reusable) {
        out += `<path d="M${cx - w / 2},${y} l-8,10 M${cx + w / 2},${y} l8,10" stroke="#ff9f43" stroke-width="2"/>`;
      }
      y -= h;
    });
    const topW = Math.min(W - 30, Math.max(stages.length ? stages[stages.length - 1].w : 20, 16 + Math.sqrt(fair.maxPayload) * 8));
    const fh = fairH * scale;
    out += `<path d="M${cx - topW / 2},${y} L${cx - topW / 2},${y - fh * 0.45} Q${cx - topW / 2},${y - fh} ${cx},${y - fh} Q${cx + topW / 2},${y - fh} ${cx + topW / 2},${y - fh * 0.45} L${cx + topW / 2},${y} Z" fill="#e8f6ff" stroke="#9fd8ff"/>`;
    return `<svg class="rocket-svg" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="body0" x1="0" x2="1"><stop offset="0" stop-color="#8fb2cc"/><stop offset=".45" stop-color="#eef8ff"/><stop offset="1" stop-color="#7b9cb8"/></linearGradient>
        <linearGradient id="body1" x1="0" x2="1"><stop offset="0" stop-color="#7f9fb8"/><stop offset=".45" stop-color="#d9ecfa"/><stop offset="1" stop-color="#6b8ca8"/></linearGradient>
      </defs>
      <line x1="10" x2="${W - 10}" y1="${H - 5}" y2="${H - 5}" stroke="#1c3f63"/>
      ${out}
    </svg>`;
  };
})(window.Game);
