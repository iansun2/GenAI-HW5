// 軌道與衛星、基地設施、財務、競爭對手、紀錄
(function (G) {
  const U = G.U, UI = G.UI, O = G.Orbit, F = G.Finance;

  UI.views.orbits = {
    render(s) {
      const counts = O.counts(s);
      const cr = G.Mods.crowdReduce(s);
      const rows = G.ORBIT_ORDER.map(o => {
        const od = G.ORBITS[o];
        const inO = s.sats.filter(x => x.orbit === o);
        const mine = inO.filter(x => x.owner === 'player').length;
        const client = inO.filter(x => x.owner === 'client').length;
        const crowd = O.crowd(s, o, counts);
        const rivals = s.rivals.map(r => `<span style="color:${G.Rivals.def(r.id).color}">${inO.filter(x => x.owner === r.id).length}</span>`).join(' / ');
        return `<tr>
          <td>${UI.tag(o, 'accent')} ${od.name}${od.tech && s.techs[od.tech] == null ? ' ' + UI.tag('未認證', 'warn') : ''}</td>
          <td class="num">${od.dv.toFixed(1)}</td>
          <td class="num good">${mine}</td><td class="num">${rivals}</td><td class="num dim">${client}</td>
          <td class="num warn">${s.debris[o].toFixed(0)}</td>
          <td class="num">${counts[o] + Math.round(s.debris[o])} / ${od.capacity}</td>
          <td style="min-width:120px">${UI.bar(crowd)}<div class="small mono ${crowd >= 1 ? 'bad' : crowd >= 0.7 ? 'warn' : 'dim'}">${U.pct(crowd, 0)} · 壽命消耗 ×${O.decayRate(crowd, cr).toFixed(2)}</div></td>
        </tr>`;
      }).join('');

      const fleet = O.incomeBreakdown(s);
      const fleetRows = fleet.map(f => {
        const unlocked = G.Mods.unlocked(s, f.type);
        const avg = f.count ? U.sum(f.sats, x => x.life) / f.count : 0;
        const soon = f.sats.filter(x => x.life < 6).length;
        return `<tr class="${unlocked ? '' : 'dim'}">
          <td>${f.type.name}<div class="dim small">${f.type.desc}</div></td>
          <td>${UI.tag(f.type.orbit)}</td>
          <td class="num">${f.type.mass} t</td>
          <td class="num">${U.money(f.type.cost)}</td>
          <td class="num">${f.count}</td>
          <td class="num">${f.count ? avg.toFixed(0) + ' 月' : '—'}${soon ? `<div class="warn small">${soon} 顆即將退役</div>` : ''}</td>
          <td class="num ${f.factor < 0.7 ? 'warn' : ''}">${U.pct(f.factor, 0)}</td>
          <td class="num good">${U.money(f.income)}</td>
          <td>${unlocked ? '' : UI.tag('未研發')}</td>
        </tr>`;
      }).join('');

      return `<h2 class="view-title">軌道與衛星</h2>
      <div class="panel">
        <h3>軌道環境 <span class="dim">你 / ${s.rivals.map(r => G.Rivals.def(r.id).name).join(' / ')} / 其他</span></h3>
        <div class="tbl-wrap"><table>
          <thead><tr><th>軌道</th><th class="num">需求 Δv</th><th class="num">自有</th><th class="num">對手</th><th class="num">其他</th><th class="num">碎片</th><th class="num">佔用 / 容量</th><th>擁擠度</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="dim small mt">每月壽命消耗 = 1 + ${G.BALANCE.crowdDecayK} × 擁擠度²${cr ? `(你的避碰科技減免 ${U.pct(cr, 0)})` : ''}。擁擠度超過 ${U.pct(G.BALANCE.collisionThreshold, 0)} 時可能發生碰撞並產生更多碎片。</div>
      </div>
      <div class="panel">
        <h3>自有星座 <span class="dim">每月收入 ${U.money(O.monthlyIncome(s))}</span></h3>
        <div class="tbl-wrap"><table>
          <thead><tr><th>類型</th><th>軌道</th><th class="num">質量</th><th class="num">造價</th><th class="num">在軌</th><th class="num">平均剩餘壽命</th><th class="num">市場係數</th><th class="num">月收入</th><th></th></tr></thead>
          <tbody>${fleetRows}</tbody>
        </table></div>
        <div class="dim small mt">市場係數:同類衛星(含對手)越多,單顆收入越低(最低 30%)。發射自有衛星請到「生產與發射」,選擇「自有衛星」任務。</div>
      </div>`;
    },
  };

  UI.views.base = {
    render(s) {
      const defs = G.BALANCE.facilities;
      const cards = Object.keys(defs).map(k => {
        const d = defs[k], lv = s.facilities[k];
        const max = lv >= d.max;
        const cost = max ? 0 : d.cost[lv];
        return `<div class="panel">
          <h3>${d.name} <span class="dim">Lv.${lv}</span></h3>
          <div class="pips mb">${Array.from({ length: d.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>
          <div class="dim small mb">${d.desc}</div>
          <div class="kv mb">
            <span>目前效果</span><span>${k === 'control' ? '失敗率 -' + (lv * 4) + '%' : lv + (k === 'pad' ? ' 次 / 月' : ' 項')}</span>
            <span>維護費</span><span>${U.money(lv * G.BALANCE.facilityUpkeep)} / 月</span>
          </div>
          ${max ? UI.tag('已達最高等級', 'good') : UI.btn(`升級 ${U.money(cost)}`, 'upgrade', `data-key="${k}"`, 'primary')}
        </div>`;
      }).join('');
      return `<h2 class="view-title">基地設施</h2>
        <div class="grid g4">${cards}</div>
        <div class="panel mt"><h3>說明</h3><div class="dim small">設施升級立即生效,每級每月增加 ${U.money(G.BALANCE.facilityUpkeep)} 維護費。發射台決定每月可發射次數;總裝廠決定可同時製造的火箭數;研究所決定可同時研發的科技數。</div></div>`;
    },
  };

  function ledgerTable(L) {
    if (!L || !L.items.length) return '<div class="dim">尚無收支。</div>';
    const by = F.byCat(L);
    return `<table><tbody>${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      `<tr><td>${F.CAT_NAMES[k] || k}</td><td class="num ${v >= 0 ? 'good' : 'bad'}">${v >= 0 ? '+' : ''}${U.money(v)}</td></tr>`).join('')}
      <tr><td><b>營收(合約+服務)</b></td><td class="num good"><b>${U.money(F.revenue(L))}</b></td></tr>
      <tr><td><b>支出</b></td><td class="num bad"><b>${U.money(F.expense(L))}</b></td></tr>
    </tbody></table>`;
  }

  UI.views.finance = {
    render(s) {
      const b = G.BALANCE;
      const hist = s.history;
      const lim = F.creditLimit(s), avail = F.available(s);
      return `<h2 class="view-title">財務</h2>
      ${F.restricted(s) ? `<div class="alert bad">財務受限:透支已超過信用額度的 ${U.pct(b.restrictThreshold, 0)}。在恢復之前無法製造、研發、升級設施或採購衛星,但仍可發射庫存火箭與投標。若已無力回天,可從右上選單「放棄經營」。</div>`
        : s.cash < 0 ? `<div class="alert warn">透支中:每月須支付 ${U.pct(b.overdraftRate, 0)} 透支利息,聲望每月 -${b.overdraftRepLoss},且無法申請新貸款。</div>` : ''}
      <div class="grid g3">
        <div class="panel">
          <h3>資金與信用</h3>
          <div class="kv">
            <span>現金</span><span class="${s.cash < 0 ? 'bad' : ''}">${U.money(s.cash)}</span>
            <span>貸款餘額</span><span class="${s.debt > 0 ? 'warn' : ''}">${U.money(s.debt)}</span>
            <span>貸款月利率</span><span>${U.pct(F.rate(s), 2)}</span>
            <span>每月利息</span><span>${U.money(s.debt * F.rate(s))}</span>
            <span>信用額度</span><span>${U.money(lim)}</span>
            <span>可借額度</span><span class="accent">${U.money(avail)}</span>
          </div>
          <div class="dim small mt">信用額度 = (${b.creditBase} + 聲望 × ${b.creditPerRep} + 衛星資產 × 40%)× 科技加成。聲望越高利率越低。</div>
          <div class="row mt"><input type="number" id="fin-amt" min="0" step="5" value="${Math.min(20, Math.floor(avail))}">
            ${UI.btn('借款', 'borrow', s.cash < 0 ? 'disabled' : '', 'primary')} ${UI.btn('還款', 'repay', s.debt > 0 ? '' : 'disabled')}
            ${UI.btn('全部還清', 'repayAll', s.debt > 0 && s.cash >= s.debt ? '' : 'disabled', 'sm')}</div>
        </div>
        <div class="panel"><h3>本月收支 <span class="dim">${U.date(s.month)}</span></h3>${ledgerTable(s.ledger)}</div>
        <div class="panel"><h3>上月收支</h3>${ledgerTable(s.prevLedger)}</div>
      </div>
      <div class="panel mt">
        <h3>歷史走勢 <span class="dim">₵M</span></h3>
        ${UI.lineChart([
          { name: '資金', color: '#3ff2ff', values: hist.map(h => h.cash) },
          { name: '負債', color: '#ff4d6d', values: hist.map(h => h.debt) },
          { name: '月營收', color: '#4cff9a', values: hist.map(h => h.rev) },
          { name: '月支出', color: '#ff9f43', values: hist.map(h => h.exp) },
        ], { h: 220, labels: hist.map(h => `${b.startYear + Math.floor(h.m / 12)}/${h.m % 12 + 1}`) })}
      </div>`;
    },
  };

  UI.views.rivals = {
    render(s) {
      const R = G.Rivals;
      const rows = [{ name: U.esc(s.company) + '(你)', color: '#4cff9a', rep: s.rep, launches: s.stats.launches, succ: s.stats.successes, sats: s.sats.filter(x => x.owner === 'player').length, rel: G.Contracts.trackRecord(s) }]
        .concat(s.rivals.map(r => ({ name: R.def(r.id).name, color: R.def(r.id).color, rep: r.rep, launches: r.launches, succ: r.successes, sats: R.satCount(s, r), rel: R.rel(r) })))
        .sort((a, b) => b.rep - a.rep);
      const cards = s.rivals.map(r => {
        const d = R.def(r.id);
        const reach = G.ORBIT_ORDER.filter(o => R.canOrbit(r, o));
        return `<div class="panel rival-card" style="--c:${d.color}">
          <h3 style="color:${d.color}">${d.name} <span class="tag">${d.style}</span></h3>
          <div class="dim small mb">${d.desc}</div>
          <div class="kv">
            <span>聲望</span><span>${r.rep.toFixed(0)}</span>
            <span>技術等級</span><span>${r.tech.toFixed(0)}</span>
            <span>可靠度</span><span>${U.pct(R.rel(r), 1)}</span>
            <span>LEO 運力</span><span>${U.ton(R.capacity(r, 'LEO'))}</span>
            <span>可達軌道</span><span>${reach.join(' ')}</span>
            <span>在軌衛星</span><span>${R.satCount(s, r)}</span>
            <span>發射紀錄</span><span>${r.successes} / ${r.launches}</span>
          </div>
        </div>`;
      }).join('');
      return `<h2 class="view-title">競爭對手</h2>
        <div class="grid g3">${cards}</div>
        <div class="panel mt">
          <h3>業界排行 <span class="dim">依聲望</span></h3>
          <div class="tbl-wrap"><table>
            <thead><tr><th>#</th><th>公司</th><th class="num">聲望</th><th class="num">可靠度</th><th class="num">發射</th><th class="num">在軌衛星</th></tr></thead>
            <tbody>${rows.map((x, i) => `<tr><td class="mono">${i + 1}</td><td style="color:${x.color}">${x.name}</td><td class="num">${x.rep.toFixed(0)}</td><td class="num">${U.pct(x.rel, 0)}</td><td class="num">${x.succ} / ${x.launches}</td><td class="num">${x.sats}</td></tr>`).join('')}</tbody>
          </table></div>
          <div class="dim small mt">你的「可靠度」為競標時使用的歷史成功率評分。</div>
        </div>`;
    },
  };

  UI.views.log = {
    render(s) {
      const f = UI.logFilter || 'all';
      const kinds = [['all', '全部'], ['good', '成功'], ['bad', '失敗'], ['event', '事件'], ['tech', '研發'], ['build', '生產'], ['money', '財務'], ['rival', '對手']];
      const list = s.log.filter(l => f === 'all' || l.k === f);
      return `<h2 class="view-title">營運紀錄</h2>
        <div class="row mb">${kinds.map(([k, n]) => UI.btn(n, 'logFilter', `data-k="${k}"`, 'sm ' + (f === k ? 'primary' : ''))).join('')}</div>
        <div class="panel"><ul class="list log-list">${list.map(l => `<li><span class="m">${U.date(l.m)}</span><span class="grow k-${l.k}">${U.esc(l.t)}</span></li>`).join('') || '<li class="dim">沒有紀錄。</li>'}</ul></div>`;
    },
  };

  const A = UI.actions;
  A.upgrade = el => UI.run(F.upgradeFacility(UI.s, el.dataset.key), '設施已升級');
  A.borrow = () => UI.run(F.borrow(UI.s, parseFloat(document.getElementById('fin-amt').value)), '貸款已撥入');
  A.repay = () => UI.run(F.repay(UI.s, parseFloat(document.getElementById('fin-amt').value)), '已還款');
  A.repayAll = () => UI.run(F.repay(UI.s, UI.s.debt), '貸款已全部還清');
  A.logFilter = el => { UI.logFilter = el.dataset.k; UI.render(); };
})(window.Game);
