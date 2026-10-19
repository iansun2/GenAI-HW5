// 科技樹:以 SVG 繪製,依分支分列、依前置深度分欄
(function (G) {
  const U = G.U, UI = G.UI, RS = G.Research;
  const NW = 150, NH = 44, GX = 44, GY = 10, LX = 132, LP = 14;
  let layout = null;

  function computeLayout() {
    const depth = {};
    const d = id => {
      if (depth[id] != null) return depth[id];
      const t = G.TECH_MAP[id];
      depth[id] = t.req.length ? 1 + Math.max(...t.req.map(d)) : 0;
      return depth[id];
    };
    G.TECHS.forEach(t => d(t.id));
    const pos = {}, lanes = [];
    let y = 10;
    G.TECH_BRANCHES.forEach(br => {
      const techs = G.TECHS.filter(t => t.branch === br.id);
      const byDepth = {};
      techs.forEach(t => { (byDepth[depth[t.id]] = byDepth[depth[t.id]] || []).push(t); });
      const rows = Math.max(...Object.values(byDepth).map(a => a.length));
      Object.entries(byDepth).forEach(([dep, arr]) => arr.forEach((t, i) => {
        pos[t.id] = { x: LX + dep * (NW + GX), y: y + LP + i * (NH + GY) };
      }));
      const h = LP * 2 + rows * (NH + GY) - GY;
      lanes.push({ br, y, h });
      y += h + 8;
    });
    const maxD = Math.max(...Object.values(depth));
    return { pos, lanes, W: LX + (maxD + 1) * (NW + GX), H: y };
  }

  function treeSVG(s) {
    layout = layout || computeLayout();
    const { pos, lanes, W, H } = layout;
    const lanesSvg = lanes.map((l, i) => `<rect class="tlane" x="0" y="${l.y}" width="${W}" height="${l.h}" ${i % 2 ? 'style="fill:rgba(63,242,255,.045)"' : ''}/>
      ${l.br.name.length > 6
        ? `<text class="tlane-label" x="12" y="${l.y + l.h / 2 - 4}">${l.br.name.slice(0, 4)}</text><text class="tlane-label" x="12" y="${l.y + l.h / 2 + 12}">${l.br.name.slice(4)}</text>`
        : `<text class="tlane-label" x="12" y="${l.y + l.h / 2 + 4}">${l.br.name}</text>`}`).join('');
    const edges = G.TECHS.flatMap(t => t.req.map(r => {
      const a = pos[r], b = pos[t.id];
      const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, mx = (x1 + x2) / 2;
      return `<path class="tedge ${s.techs[r] != null ? 'done' : ''}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
    })).join('');
    const nodes = G.TECHS.map(t => {
      const p = pos[t.id], st = RS.status(s, t.id);
      const q = RS.inQueue(s, t.id);
      const ns = t.needs.length ? RS.needStatus(s, t) : [];
      const needTxt = ns.length && st !== 'done' && st !== 'active' ? ` · ${ns.every(x => x.ok) ? '✓' : '⚑'}條件 ${ns.filter(x => x.ok).length}/${ns.length}` : '';
      const sub = st === 'done' ? '✓ 已完成' : st === 'active' ? `研發中 · ${U.date(q.doneMonth)}` : `₵${RS.cost(s, t)}M · ${RS.months(s, t)} 月${needTxt}`;
      return `<g class="tnode ${st} ${UI.selTech === t.id ? 'sel' : ''}" data-act="techSel" data-id="${t.id}" transform="translate(${p.x},${p.y})">
        <rect width="${NW}" height="${NH}" rx="2"/>
        <text x="8" y="18">${t.name}</text>
        <text class="sub" x="8" y="35">${sub}</text>
      </g>`;
    }).join('');
    return `<svg class="tree-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${lanesSvg}${edges}${nodes}</svg>`;
  }

  function detail(s) {
    const id = UI.selTech;
    if (!id) return '<div class="dim">點選科技樹上的節點查看詳情。</div>';
    const t = G.TECH_MAP[id], st = RS.status(s, id);
    const err = RS.canStart(s, id);
    const effects = RS.effectText(t), unlocks = RS.unlocks(id);
    return `<div class="event-cat">${G.TECH_BRANCHES.find(b => b.id === t.branch).name}</div>
      <h3 style="margin-top:4px">${t.name}</h3>
      <div class="dim small mb">${t.desc}</div>
      <div class="kv">
        <span>研發費用</span><span>${U.money(RS.cost(s, t))}</span>
        <span>研發時間</span><span>${RS.months(s, t)} 個月</span>
        <span>狀態</span><span>${{ done: '<span class="good">已完成</span>', active: '<span class="warn">研發中</span>', avail: '<span class="accent">可研發</span>', needs: '<span class="warn">條件未滿</span>', locked: '<span class="dim">未解鎖</span>' }[st]}</span>
      </div>
      ${t.req.length ? `<h4 class="dim small mt">前置科技</h4><ul class="list">${t.req.map(r => `<li>${s.techs[r] != null ? '<span class="good">✓</span>' : '<span class="bad">✗</span>'} ${G.TECH_MAP[r].name}</li>`).join('')}</ul>` : ''}
      ${t.needs.length ? `<h4 class="dim small mt">研發條件(需在開始研發前達成)</h4><ul class="list">${RS.needStatus(s, t).map(n => `<li>${n.ok ? '<span class="good">✓</span>' : '<span class="warn">⚑</span>'} <span class="grow">${n.label}</span><span class="mono small ${n.ok ? 'good' : 'warn'}">${n.have}/${n.need}</span></li>`).join('')}</ul>
        ${t.needs.some((n, i) => n.type === 'flights' && !RS.needStatus(s, t)[i].ok) ? `<div class="dim small">發射可在「生產與發射」安排,實驗飛行請選「純實驗」任務。失敗的發射不計入。</div>` : ''}` : ''}
      ${unlocks.length || effects.length ? `<h4 class="dim small mt">效果</h4><ul class="list">${unlocks.concat(effects).map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      <div class="row mt">${st === 'done' || st === 'active' ? '' : UI.btn('開始研發', 'research', `data-id="${id}" ${err ? 'disabled' : ''}`, 'primary')} ${err && st !== 'done' && st !== 'active' ? `<span class="dim small">${err}</span>` : ''}</div>`;
  }

  UI.views.tech = {
    render(s) {
      return `<h2 class="view-title">科技研發</h2>
      <div class="grid g3">
        <div class="panel span2">
          <h3>研發佇列 <span class="dim">${s.research.length} / ${s.facilities.lab}(升級研究所可增加)</span></h3>
          ${s.research.length ? `<ul class="list">${s.research.map(r => {
            const t = G.TECH_MAP[r.techId], total = r.doneMonth - r.start, done = s.month - r.start;
            return `<li><span class="grow">${t.name}<div class="small dim">完成於 ${U.date(r.doneMonth)} 初</div></span><span style="width:160px">${UI.bar(done / total, '')}</span></li>`;
          }).join('')}</ul>` : '<div class="dim">研究所閒置中,選擇一項科技開始研發。</div>'}
        </div>
        <div class="panel">
          <h3>圖例</h3>
          <div class="row small">${UI.tag('可研發', 'accent')} ${UI.tag('條件未滿', 'warn')} ${UI.tag('研發中', 'warn')} ${UI.tag('已完成', 'good')} ${UI.tag('未解鎖')}</div>
          <div class="dim small mt">研發費用在開始時一次付清。標示 ⚑ 的科技除了資金,還需要先完成特定的發射或實驗。</div>
        </div>
      </div>
      <div class="grid g3 mt">
        <div class="panel span2" style="padding:10px">
          <div class="tree-wrap" data-keep="tree">${treeSVG(s)}</div>
        </div>
        <div class="panel">${detail(s)}</div>
      </div>`;
    },
  };

  UI.actions.techSel = el => { UI.selTech = el.dataset.id; UI.render(); };
  UI.actions.research = el => UI.run(RS.start(UI.s, el.dataset.id), '研發已開始');
})(window.Game);
