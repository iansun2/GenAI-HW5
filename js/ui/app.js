// UI 核心:頂部列、分頁、事件委派、開始畫面、選單與月底流程
(function (G) {
  const U = G.U;
  const $ = sel => document.querySelector(sel);
  const UI = G.UI = { s: null, tab: 'dashboard', views: {}, actions: {}, draft: null, selTech: null, lf: null };

  UI.TABS = [
    ['dashboard', '總覽'], ['contracts', '合約'], ['design', '火箭設計'], ['hangar', '生產與發射'],
    ['tech', '科技研發'], ['orbits', '軌道與衛星'], ['base', '基地設施'], ['finance', '財務'],
    ['rivals', '競爭對手'], ['log', '紀錄'],
  ];

  UI.money = U.money;
  UI.esc = U.esc;
  UI.tag = (text, cls = '') => `<span class="tag ${cls}">${text}</span>`;
  UI.btn = (label, act, attrs = '', cls = '') => `<button class="btn ${cls}" data-act="${act}" ${attrs}>${label}</button>`;

  UI.toast = function (msg, kind = 'info') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3000);
  };

  // 執行會回傳錯誤字串的操作;成功則重繪
  UI.run = function (err, okMsg) {
    if (err) { UI.toast(err, 'bad'); return false; }
    if (okMsg) UI.toast(okMsg, 'good');
    UI.render();
    return true;
  };

  UI.badges = function (s) {
    const b = {};
    const won = s.contracts.filter(c => c.status === 'won' && !G.Contracts.isPlanned(s, c.id)).length;
    const idleRk = s.inventory.filter(r => !G.Launch.isPlanned(s, r.id)).length;
    if (won || (idleRk && s.launches.length < s.facilities.pad)) b.hangar = won || idleRk;
    const open = s.contracts.filter(c => c.status === 'open' && c.playerBid == null && !G.Contracts.playerEligible(s, c)).length;
    if (open) b.contracts = open;
    const freeLab = s.facilities.lab - s.research.length;
    if (freeLab > 0) b.tech = freeLab;
    return b;
  };

  UI.topbar = function (s) {
    const F = G.Finance;
    const last = s.history.length ? s.history[s.history.length - 1] : null;
    return `<header id="topbar">
      <div class="brand"><span class="logo">◢◤</span><div>${U.esc(s.company)}<small>星軌大亨 ORBITAL TYCOON</small></div></div>
      <div class="stat"><label>日期</label><span>${U.date(s.month)}</span><small>回合 ${Math.min(s.month + 1, G.BALANCE.maxMonths)} / ${G.BALANCE.maxMonths}</small></div>
      <div class="stat"><label>資金</label><span class="${s.cash < 0 ? 'bad' : ''}">${U.money(s.cash)}</span><small>${F.restricted(s) ? '<b class="bad">財務受限</b>' : s.cash < 0 ? '<span class="warn">透支中</span>' : '&nbsp;'}</small></div>
      <div class="stat"><label>負債</label><span class="${s.debt > 0 ? 'warn' : ''}">${U.money(s.debt)}</span><small>月利率 ${U.pct(F.rate(s), 2)}</small></div>
      <div class="stat"><label>聲望</label><span>${s.rep.toFixed(0)}</span><small>/ 100</small></div>
      <div class="stat"><label>上月營收</label><span>${last ? U.money(last.rev) : '—'}</span><small>${last ? '支出 ' + U.money(last.exp) : '&nbsp;'}</small></div>
      <div class="top-actions">
        <button class="btn primary end-turn" data-act="endTurn" ${s.ended ? 'disabled' : ''}>下一月 ▶</button>
        <button class="btn" data-act="menu" title="選單">☰</button>
      </div>
    </header>`;
  };

  UI.nav = function (s) {
    const b = UI.badges(s);
    return `<nav id="nav">${UI.TABS.map(([id, name]) =>
      `<button class="${UI.tab === id ? 'active' : ''}" data-act="tab" data-tab="${id}">${name}${b[id] ? `<span class="badge">${b[id]}</span>` : ''}</button>`).join('')}</nav>`;
  };

  UI.render = function () {
    const s = UI.s;
    if (!s) { UI.renderStart(); return; }
    const keep = {};
    document.querySelectorAll('[data-keep]').forEach(el => { keep[el.dataset.keep] = [el.scrollLeft, el.scrollTop]; });
    const y = window.scrollY;
    const view = UI.views[UI.tab];
    $('#app').innerHTML = UI.topbar(s) + UI.nav(s) + `<main id="view">${view.render(s)}</main>`;
    document.querySelectorAll('[data-keep]').forEach(el => {
      const k = keep[el.dataset.keep];
      if (k) { el.scrollLeft = k[0]; el.scrollTop = k[1]; } else if (view.initScroll) view.initScroll(el);
    });
    window.scrollTo(0, y);
  };

  UI.go = function (tab) {
    UI.tab = tab;
    UI.render();
    window.scrollTo(0, 0);
  };

  UI.load = function (s) {
    UI.Modal.reset();
    UI.s = s;
    UI.draft = null; UI.lf = null; UI.selTech = null;
    UI.tab = 'dashboard';
    UI.render();
    window.scrollTo(0, 0);
    if (s.pendingEvent) UI.Modal.push(UI.Reports.eventStep(s));
  };

  // ── 開始畫面 ──
  UI.renderStart = function () {
    UI.s = null;
    const slotRow = (slot, label) => {
      const m = G.Save.meta(slot);
      if (!m) return `<div class="slot"><span>${label}</span><span class="dim">空</span></div>`;
      return `<div class="slot"><span>${label}:${U.esc(m.company)} · ${U.date(m.month)}${m.ended ? ' <span class="dim">(已結束)</span>' : ''}</span>${UI.btn('讀取', 'loadSlot', `data-slot="${slot}"`, 'sm')}</div>`;
    };
    $('#app').innerHTML = `<div class="start"><div class="start-box panel">
      <div class="title-logo">星軌大亨</div>
      <div class="subtitle">ORBITAL TYCOON · 衛星發射經營模擬</div>
      <label for="company">公司名稱</label>
      <input type="text" id="company" maxlength="12" value="星穹航太">
      <button class="btn primary big" data-act="newGame">建立公司 ▶</button>
      <div class="slot-list">
        ${slotRow('auto', '自動存檔')}
        ${G.Save.SLOTS.map(x => slotRow(x, '存檔 ' + x)).join('')}
      </div>
      <div class="row mt">${UI.btn('匯入存檔檔案', 'importSave')}</div>
      <p class="hint">在 ${G.BALANCE.maxMonths} 個月(10 年)內經營一家發射公司:競標合約、設計火箭、研發科技、部署自有衛星星座。
      完成 ${G.MILESTONES.length} 個里程碑即可獲勝,或撐到最後依淨值與聲望評分。每月結束時會自動存檔。</p>
    </div></div>`;
  };

  // ── 事件委派 ──
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = UI.actions[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]');
    if (el && UI.actions[el.dataset.change]) UI.actions[el.dataset.change](el, e);
  });
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-input]');
    if (el && UI.actions[el.dataset.input]) UI.actions[el.dataset.input](el, e);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'company') UI.actions.newGame();
  });

  const A = UI.actions;
  A.tab = el => UI.go(el.dataset.tab);
  A.goto = el => UI.go(el.dataset.tab);
  A.newGame = () => {
    const name = ($('#company').value || '').trim() || '星穹航太';
    UI.load(G.State.newGame(name));
    G.Save.auto(UI.s);
    UI.Modal.push(UI.Reports.introStep(UI.s));
  };
  A.loadSlot = el => {
    const s = G.Save.read(el.dataset.slot);
    if (!s) { UI.toast('存檔無法讀取', 'bad'); return; }
    UI.load(s);
    UI.toast('已讀取存檔', 'good');
  };
  A.importSave = () => G.Save.importFile(s => {
    if (!s) { UI.toast('檔案格式不正確', 'bad'); return; }
    UI.load(s);
    UI.toast('已匯入存檔', 'good');
  });
  A.exportSave = () => G.Save.exportFile(UI.s);
  A.saveSlot = el => {
    if (G.Save.write(el.dataset.slot, UI.s)) { UI.toast(`已存到存檔 ${el.dataset.slot}`, 'good'); UI.Modal.next(); }
    else UI.toast('瀏覽器無法存檔,請改用匯出', 'bad');
  };
  A.menu = () => UI.Modal.push(UI.Reports.menuStep(UI.s));
  A.toStart = () => { UI.Modal.reset(); UI.renderStart(); };
  A.abandon = () => {
    if (!confirm('確定要放棄經營嗎?遊戲會立即結算。')) return;
    UI.s.ended = true;
    G.Save.auto(UI.s);
    UI.Modal.reset();
    UI.render();
    UI.Modal.push(UI.Reports.finalStep(UI.s, 'abandon'));
  };
  A.modalNext = () => UI.Modal.next();
  A.showFinal = () => UI.Modal.push(UI.Reports.finalStep(UI.s, UI.s.gameOver ? 'time' : 'abandon'));
  A.endTurn = () => UI.endTurn();

  UI.endTurn = function () {
    const s = UI.s;
    if (!s || s.ended || UI.Modal.open) return;
    if (s.pendingEvent) { UI.Modal.push(UI.Reports.eventStep(s)); return; }
    const due = s.contracts.filter(c => c.status === 'won' && c.deadline <= s.month && !G.Contracts.isPlanned(s, c.id));
    if (due.length && !confirm(`有 ${due.length} 筆合約本月到期但尚未排程發射,結束本月將違約。確定繼續?`)) return;
    const rep = G.Turn.end(s);
    UI.lf = null;
    rep.launches.forEach(l => UI.Modal.push(UI.LaunchView.step(l)));
    UI.Modal.push(UI.Reports.summaryStep(s, rep));
    if (s.pendingEvent) UI.Modal.push(UI.Reports.eventStep(s));
    if (rep.victory) UI.Modal.push(UI.Reports.victoryStep(s));
    if (rep.gameOver) UI.Modal.push(UI.Reports.finalStep(s, 'time'));
    UI.render();
  };

  document.addEventListener('DOMContentLoaded', () => UI.renderStart());
})(window.Game);
