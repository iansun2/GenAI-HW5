// 生產與發射:製造火箭、管理庫存、排定本月發射
(function (G) {
  const U = G.U, UI = G.UI, R = G.Rocket, L = G.Launch;

  // 由發射表單狀態組出任務物件
  function missionOf(lf) {
    if (!lf) return null;
    if (lf.kind === 'contract') return lf.contractId ? { kind: 'contract', contractId: lf.contractId } : null;
    if (lf.kind === 'experiment') return lf.exp ? { kind: 'experiment', exp: lf.exp, orbit: lf.orbit || 'LEO' } : null;
    return lf.satType ? { kind: 'own', satType: lf.satType, count: lf.count || 1 } : null;
  }

  function launchForm(s) {
    const lf = UI.lf;
    const rk = s.inventory.find(r => r.id === lf.rocketId);
    if (!rk) { UI.lf = null; return ''; }
    const bp = R.find(s, rk.bpId);
    const caps = R.capabilities(bp);
    const won = s.contracts.filter(c => c.status === 'won' && !G.Contracts.isPlanned(s, c.id));
    const sats = Object.values(G.SAT_TYPES).filter(t => G.Mods.unlocked(s, t));

    let body = '';
    if (lf.kind === 'experiment') {
      const exps = Object.values(G.EXPERIMENTS).filter(x => G.Mods.unlocked(s, x));
      if (!lf.exp || !exps.some(x => x.id === lf.exp)) lf.exp = exps[0].id;
      const x = G.EXPERIMENTS[lf.exp];
      body = `<select data-change="lfSet" data-field="exp" style="width:100%">${exps.map(e => `<option value="${e.id}" ${e.id === lf.exp ? 'selected' : ''}>${caps[e.orbit || lf.orbit || 'LEO'] >= e.mass && caps[e.orbit || lf.orbit || 'LEO'] > 0 ? '✓' : '✗'} ${e.name} · ${e.orbit || '任選軌道'} · ${e.mass}t · 儀器 ₵${e.cost}M</option>`).join('')}</select>
        <div class="dim small mt">${x.desc} 實驗飛行屬科研豁免,不需要軌道認證;成功可提升聲望,並累積型號飛行紀錄。${Object.values(G.EXPERIMENTS).some(e => !G.Mods.unlocked(s, e)) ? '研發「科學探測儀器」「熱防護材料」可解鎖更多實驗。' : ''}</div>
        ${x.orbit ? '' : `<div class="row mt"><span class="dim small">目標軌道</span><select data-change="lfSet" data-field="orbit">${G.ORBIT_ORDER.map(o => `<option value="${o}" ${o === (lf.orbit || 'LEO') ? 'selected' : ''}>${o} ${G.ORBITS[o].name}${caps[o] > 0 ? '' : '(無法到達)'}</option>`).join('')}</select></div>`}`;
    } else if (lf.kind === 'contract') {
      if (!lf.contractId && won.length) lf.contractId = (won.find(c => caps[c.orbit] >= c.mass) || won[0]).id;
      body = won.length
        ? `<select data-change="lfSet" data-field="contractId" style="width:100%">${won.map(c => `<option value="${c.id}" ${c.id === lf.contractId ? 'selected' : ''}>${caps[c.orbit] >= c.mass ? '✓' : '✗'} ${c.client}「${c.purpose}」 ${c.orbit} ${U.ton(c.mass)} · ${U.money(c.price)} · 期限 ${U.date(c.deadline)}</option>`).join('')}</select>`
        : '<div class="dim">沒有待執行的合約。可到「合約」頁面投標。</div>';
    } else {
      if (!sats.length) body = '<div class="dim">尚未研發任何自營衛星。請到「科技研發」研發「立方衛星平台」等科技。</div>';
      else {
        if (!lf.satType || !sats.some(t => t.id === lf.satType)) lf.satType = sats[0].id;
        const t = G.SAT_TYPES[lf.satType];
        const maxN = Math.max(1, Math.floor(caps[t.orbit] / t.mass));
        lf.count = U.clamp(lf.count || maxN, 1, Math.max(1, maxN));
        const od = G.ORBITS[t.orbit];
        body = `<select data-change="lfSet" data-field="satType" style="width:100%">${sats.map(x => `<option value="${x.id}" ${x.id === lf.satType ? 'selected' : ''}>${x.name} · ${x.orbit} · ${x.mass}t · ₵${x.cost}/顆 · 月收 ₵${x.income} · 壽命 ${x.life} 月</option>`).join('')}</select>
          <div class="row mt"><span class="dim small">數量</span>
            <span class="stepper">${UI.btn('−', 'lfCount', 'data-delta="-1"')}<span>${lf.count}</span>${UI.btn('+', 'lfCount', 'data-delta="1"')}</span>
            ${UI.btn('裝滿', 'lfCount', `data-delta="max" data-max="${maxN}"`, 'sm')}
            <span class="dim small">此火箭最多 ${caps[t.orbit] > 0 ? maxN : 0} 顆 · 市場係數 ${U.pct(G.Orbit.marketFactor(s, t.id), 0)} · ${od.id} 擁擠度 ${U.pct(G.Orbit.crowd(s, t.orbit), 0)}</span></div>`;
      }
    }

    const m = missionOf(lf);
    const info = m && L.missionInfo(s, m);
    const err = m ? L.check(s, rk.id, m) : '請選擇任務';
    const p = L.chance(s, bp);
    // 若此次飛行成功,可推進哪些尚未滿足條件的科技
    let helps = [];
    if (m && info) {
      const f = Object.assign({ kind: m.kind, exp: m.exp || null, orbit: info.orbit, outcome: 'success', recovered: !!bp.reusable }, R.features(bp));
      helps = G.TECHS.filter(t => s.techs[t.id] == null && !G.Research.inQueue(s, t.id) && G.Research.needStatus(s, t).some((n, i) => !n.ok && t.needs[i].type === 'flights' && G.Research.matches(f, t.needs[i].spec)));
    }
    return `<div class="panel">
      <h3>安排發射:${U.esc(bp.name)} ${UI.btn('取消', 'lfClose', '', 'sm')}</h3>
      <div class="row mb">
        <label class="inline"><input type="radio" name="lfk" data-change="lfKind" value="contract" ${lf.kind === 'contract' ? 'checked' : ''}> 客戶合約</label>
        <label class="inline"><input type="radio" name="lfk" data-change="lfKind" value="own" ${lf.kind === 'own' ? 'checked' : ''}> 自有衛星</label>
        <label class="inline"><input type="radio" name="lfk" data-change="lfKind" value="experiment" ${lf.kind === 'experiment' ? 'checked' : ''}> 純實驗</label>
      </div>
      ${body}
      ${info ? `<div class="kv mt">
        <span>目標軌道</span><span>${info.orbit} ${G.ORBITS[info.orbit].name}</span>
        <span>酬載 / 運載上限</span><span class="${info.mass <= caps[info.orbit] ? 'good' : 'bad'}">${U.ton(info.mass)} / ${U.ton(caps[info.orbit])}</span>
        <span>預估成功率</span><span>${U.pct(p, 1)}</span>
        <span>發射作業費</span><span>${U.money(G.BALANCE.launchOpsCost + G.Mods.launchCost(s))}</span>
        ${info.satCost ? `<span>${m.kind === 'experiment' ? '實驗儀器費' : '衛星採購費'}(排程時支付)</span><span>${U.money(info.satCost)}</span>` : ''}
      </div>` : ''}
      ${helps.length ? `<div class="small mt"><span class="accent">成功後可推進研發條件:</span>${helps.map(t => t.name).join('、')}</div>` : ''}
      ${err ? `<div class="bad small mt">${err}</div>` : ''}
      <div class="row mt">${UI.btn('確認排程', 'lfConfirm', err ? 'disabled' : '', 'primary')}</div>
    </div>`;
  }

  UI.views.hangar = {
    render(s) {
      const P = G.Production;
      const slots = s.facilities.factory - s.production.length;
      const padsLeft = s.facilities.pad - s.launches.length;

      const bpRows = s.blueprints.map(bp => {
        const err = P.canBuild(s, bp);
        const cp = R.capabilities(bp);
        return `<tr>
          <td>${U.esc(bp.name)}<div class="dim small">${R.summary(bp)}</div></td>
          <td class="small">${G.ORBIT_ORDER.filter(o => cp[o] > 0).map(o => `${o} ${cp[o].toFixed(1)}t`).join(' · ') || '<span class="bad">無法入軌</span>'}</td>
          <td class="num">${U.money(R.cost(s, bp))}</td>
          <td class="num">${R.buildMonths(s, bp)} 月</td>
          <td class="num">${U.pct(L.chance(s, bp), 1)}</td>
          <td>${(s.grounded[bp.id] || 0) > s.month ? UI.tag('停飛', 'bad') : ''} ${UI.btn('製造', 'build', `data-id="${bp.id}" ${err ? `disabled title="${err}"` : ''}`, 'sm primary')}</td>
        </tr>`;
      }).join('');

      const inv = s.inventory.map(rk => {
        const bp = R.find(s, rk.bpId);
        const plan = s.launches.find(l => l.rocketId === rk.id);
        return `<li><span class="grow">${U.esc(bp.name)} <span class="dim small">${R.summary(bp)}</span></span>
          ${plan ? UI.tag('已排程:' + plan.label + ' → ' + plan.orbit, 'good')
            : UI.btn('安排發射', 'lfOpen', `data-id="${rk.id}" ${padsLeft <= 0 ? 'disabled title="發射台已滿"' : ''}`, 'sm primary')}</li>`;
      }).join('');

      return `<h2 class="view-title">生產與發射</h2>
      ${G.Mods.launchBan(s) ? '<div class="alert bad">本月有發射禁令,排程的發射將延後到下個月。</div>' : ''}
      <div class="grid g2">
        <div>
          <div class="panel">
            <h3>庫存火箭 <span class="dim">${s.inventory.length} 枚</span></h3>
            ${inv ? `<ul class="list">${inv}</ul>` : '<div class="dim">倉庫是空的。請從下方藍圖製造火箭。</div>'}
          </div>
          ${UI.lf ? launchForm(s) : ''}
          <div class="panel">
            <h3>本月發射排程 <span class="dim">發射台 ${s.launches.length} / ${s.facilities.pad}</span></h3>
            ${s.launches.length ? `<ul class="list">${s.launches.map(l => {
              const bp = R.find(s, l.bpId);
              return `<li><span class="grow">${U.esc(bp.name)} → ${UI.tag(l.orbit, 'accent')} ${l.label} <span class="dim small">${U.ton(l.mass)} · 成功率 ${U.pct(L.chance(s, bp), 0)}</span></span>${UI.btn('取消', 'lnCancel', `data-id="${l.id}"`, 'sm danger')}</li>`;
            }).join('')}</ul>` : '<div class="dim">本月尚未排定發射。發射會在按下「下一月」時執行。</div>'}
          </div>
        </div>
        <div>
          <div class="panel">
            <h3>總裝產線 <span class="dim">${s.production.length} / ${s.facilities.factory} 使用中</span></h3>
            ${s.production.length ? `<ul class="list">${s.production.map(p => {
              const bp = R.find(s, p.bpId);
              const total = p.doneMonth - p.start, done = s.month - p.start;
              return `<li><span class="grow">${U.esc(bp ? bp.name : '?')}<div class="small dim">完成於 ${U.date(p.doneMonth)} 初</div></span><span style="width:120px">${UI.bar(done / total, '')}</span></li>`;
            }).join('')}</ul>` : '<div class="dim">產線閒置中。</div>'}
          </div>
          <div class="panel">
            <h3>可製造藍圖 <span class="dim">剩餘產線 ${slots}</span></h3>
            <div class="tbl-wrap"><table>
              <thead><tr><th>藍圖</th><th>運載量</th><th class="num">單價</th><th class="num">工期</th><th class="num">成功率</th><th></th></tr></thead>
              <tbody>${bpRows}</tbody>
            </table></div>
            <div class="row mt">${UI.btn('設計新火箭', 'goto', 'data-tab="design"', 'sm')}<span class="dim small">製造費用於開工時支付;同藍圖越造越便宜。</span></div>
          </div>
        </div>
      </div>`;
    },
  };

  const A = UI.actions;
  A.build = el => UI.run(G.Production.build(UI.s, el.dataset.id));
  A.lfOpen = el => {
    const s = UI.s;
    const hasWon = s.contracts.some(c => c.status === 'won' && !G.Contracts.isPlanned(s, c.id));
    UI.lf = { rocketId: el.dataset.id, kind: hasWon ? 'contract' : 'own', contractId: null, satType: null, count: 0, exp: null, orbit: 'LEO' };
    UI.render();
  };
  A.lfClose = () => { UI.lf = null; UI.render(); };
  A.lfKind = el => { UI.lf.kind = el.value; UI.render(); };
  A.lfSet = el => { UI.lf[el.dataset.field] = el.value; if (el.dataset.field === 'satType') UI.lf.count = 0; UI.render(); };
  A.lfCount = el => {
    const lf = UI.lf;
    if (el.dataset.delta === 'max') lf.count = +el.dataset.max;
    else lf.count = Math.max(1, (lf.count || 1) + (+el.dataset.delta));
    UI.render();
  };
  A.lfConfirm = () => {
    const lf = UI.lf;
    const err = L.plan(UI.s, lf.rocketId, missionOf(lf));
    if (!err) UI.lf = null;
    UI.run(err, '已排入本月發射');
  };
  A.lnCancel = el => { L.cancel(UI.s, el.dataset.id); UI.render(); };
})(window.Game);
