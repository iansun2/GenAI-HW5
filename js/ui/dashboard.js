(function (G) {
  const U = G.U, UI = G.UI;

  UI.todos = function (s) {
    const t = [];
    const F = G.Finance;
    if (F.restricted(s)) t.push({ lvl: 'bad', text: '財務受限:透支過深,無法下單製造、研發、投資設施或採購衛星。', tab: 'finance' });
    else if (s.cash < 0) t.push({ lvl: 'bad', text: `資金為負,每月需付 ${U.pct(G.BALANCE.overdraftRate, 0)} 透支利息且聲望下滑。`, tab: 'finance' });
    s.contracts.filter(c => c.status === 'won' && !G.Contracts.isPlanned(s, c.id)).forEach(c => {
      const left = c.deadline - s.month;
      t.push({ lvl: left <= 1 ? 'bad' : 'warn', text: `合約 ${U.esc(c.client)}「${c.purpose}」(${c.orbit} ${U.ton(c.mass)})須在 ${U.date(c.deadline)} 底前發射(剩 ${left + 1} 個月)`, tab: 'hangar' });
    });
    const idle = s.inventory.filter(r => !G.Launch.isPlanned(s, r.id)).length;
    const pads = s.facilities.pad - s.launches.length;
    if (idle && pads > 0) t.push({ lvl: 'info', text: `${idle} 枚火箭待命,發射台尚有 ${pads} 個空檔`, tab: 'hangar' });
    const fac = s.facilities.factory - s.production.length;
    if (fac > 0) t.push({ lvl: 'info', text: `總裝廠有 ${fac} 條產線閒置`, tab: 'hangar' });
    const lab = s.facilities.lab - s.research.length;
    if (lab > 0) t.push({ lvl: 'info', text: `研究所有 ${lab} 個研發空位`, tab: 'tech' });
    const waiting = G.TECHS.filter(x => G.Research.status(s, x.id) === 'needs');
    if (waiting.length) t.push({ lvl: 'info', text: `${waiting.length} 項科技等待發射/實驗條件:${waiting.slice(0, 3).map(x => x.name).join('、')}${waiting.length > 3 ? ' 等' : ''}`, tab: 'tech' });
    const open = s.contracts.filter(c => c.status === 'open' && c.playerBid == null && !G.Contracts.playerEligible(s, c)).length;
    if (open) t.push({ lvl: 'info', text: `${open} 筆合約開放投標中`, tab: 'contracts' });
    Object.keys(s.grounded).forEach(id => {
      const bp = G.Rocket.find(s, id);
      if (bp) t.push({ lvl: 'warn', text: `「${U.esc(bp.name)}」停飛調查中,至 ${U.date(s.grounded[id])} 解除`, tab: 'hangar' });
    });
    if (G.Mods.launchBan(s)) t.push({ lvl: 'bad', text: '本月有發射禁令,排程的發射將延後。', tab: 'hangar' });
    return t;
  };

  UI.views.dashboard = {
    render(s) {
      const todos = UI.todos(s);
      const mine = s.sats.filter(x => x.owner === 'player').length;
      const income = G.Orbit.monthlyIncome(s);
      const succRate = s.stats.launches ? s.stats.successes / s.stats.launches : 0;
      const hist = s.history.slice(-36);
      const mods = s.modifiers.filter(m => m.until < 9000);

      return `<h2 class="view-title">任務總覽</h2>
      <div class="grid g3">
        <div class="panel span2">
          <h3>待辦事項 <span class="dim">${todos.length} 項</span></h3>
          ${todos.length ? `<ul class="list todo">${todos.map(x => `<li class="${x.lvl}"><span class="grow">${x.text}</span>${UI.btn('前往', 'goto', `data-tab="${x.tab}"`, 'sm')}</li>`).join('')}</ul>` : '<div class="dim">一切就緒,可以進入下一月。</div>'}
        </div>
        <div class="panel">
          <h3>公司概況</h3>
          <div class="kv">
            <span>發射紀錄</span><span>${s.stats.successes} 成功 / ${s.stats.launches} 次</span>
            <span>成功率</span><span>${s.stats.launches ? U.pct(succRate, 0) : '—'}</span>
            <span>競標信用評分</span><span>${U.pct(G.Contracts.trackRecord(s), 0)}</span>
            <span>完成合約</span><span>${s.stats.contractsDone}</span>
            <span>實驗任務</span><span>${s.stats.experiments || 0}</span>
            <span>自有在軌衛星</span><span>${mine} 顆</span>
            <span>預估衛星月收入</span><span class="good">${U.money(income)}</span>
            <span>每月固定支出</span><span class="bad">${U.money(G.Finance.upkeep(s))}</span>
            <span>已研發科技</span><span>${Object.keys(s.techs).length} / ${G.TECHS.length}</span>
          </div>
        </div>
        <div class="panel span2">
          <h3>財務走勢 <span class="dim">近 36 個月 · ₵M</span></h3>
          ${UI.lineChart([
            { name: '資金', color: '#3ff2ff', values: hist.map(h => h.cash) },
            { name: '負債', color: '#ff4d6d', values: hist.map(h => h.debt) },
            { name: '月營收', color: '#4cff9a', values: hist.map(h => h.rev) },
          ], { h: 190, labels: hist.map(h => U.date(h.m).replace(' 年 ', '/').replace(' 月', '')) })}
        </div>
        <div class="panel">
          <h3>軌道擁擠度</h3>
          ${UI.crowdBars(s)}
          <div class="dim small mt">擁擠度越高,衛星需頻繁避碰,壽命消耗越快;超過 70% 可能發生碰撞。</div>
        </div>
        <div class="panel">
          <h3>里程碑 <span class="dim">${Object.keys(s.milestones).length} / ${G.MILESTONES.length}</span></h3>
          <div class="milestones">${G.MILESTONES.map(m => {
            const done = s.milestones[m.id] != null;
            return `<div class="ms ${done ? 'done' : ''}"><span class="ico">${done ? '✓' : '·'}</span><div><div class="t">${m.name}</div><div class="d">${m.desc}${done ? ` · ${U.date(s.milestones[m.id])}` : ''}</div></div></div>`;
          }).join('')}</div>
        </div>
        <div class="panel">
          <h3>生效中的狀態</h3>
          ${mods.length || s.modifiers.length ? `<ul class="list">${s.modifiers.map(m => `<li><span class="grow">${m.label}</span><span class="dim small">${m.until > 9000 ? '永久' : `至 ${U.date(m.until - 1)}`}</span></li>`).join('')}</ul>` : '<div class="dim">目前沒有特殊狀態。</div>'}
        </div>
        <div class="panel">
          <h3>最新動態 ${UI.btn('全部', 'goto', 'data-tab="log"', 'sm')}</h3>
          <ul class="list log-list">${s.log.slice(0, 8).map(l => `<li><span class="m">${U.date(l.m)}</span><span class="grow k-${l.k}">${U.esc(l.t)}</span></li>`).join('')}</ul>
        </div>
      </div>`;
    },
  };
})(window.Game);
