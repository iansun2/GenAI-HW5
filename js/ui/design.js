// 火箭設計:編輯草稿藍圖,即時顯示各級 Δv、推重比與各軌道運載量
(function (G) {
  const U = G.U, UI = G.UI, R = G.Rocket, C = G.COMPONENTS;

  const clone = o => JSON.parse(JSON.stringify(o));
  const unlockedOf = (s, type) => G.COMPONENT_LIST.filter(c => c.type === type && G.Mods.unlocked(s, c));

  function newDraft(s) {
    const base = s.blueprints[0];
    return { name: '新型火箭', stages: clone(base.stages), fairing: base.fairing, avionics: base.avionics, reusable: false, boosters: null, payload: 0 };
  }
  const draft = s => (UI.draft = UI.draft || newDraft(s));

  function options(list, cur, fmt) {
    return list.map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${fmt(c)}</option>`).join('');
  }
  const engFmt = c => `${c.name}|推力 ${c.thrustSL}/${c.thrustVac} kN|Isp ${c.ispSL}/${c.ispVac}s|${c.mass}t|₵${c.cost}`;
  const tankFmt = c => `${c.name}|推進劑 ${c.prop}t|乾重 ${c.dry}t|₵${c.cost}`;

  function stageEditor(s, d, i, info) {
    const st = d.stages[i];
    const e = C[st.engine];
    const r = info.stages[i];
    const engs = unlockedOf(s, 'engine');
    const tanks = unlockedOf(s, 'tank');
    const stepper = (field, v) => `<span class="stepper">${UI.btn('−', 'dCount', `data-idx="${i}" data-field="${field}" data-delta="-1"`)}<span>${v}</span>${UI.btn('+', 'dCount', `data-idx="${i}" data-field="${field}" data-delta="1"`)}</span>`;
    const maxB = G.Mods.maxBoosters(s);
    const srbs = unlockedOf(s, 'srb');
    const bst = d.boosters || { type: srbs.length ? srbs[0].id : '', count: 0 };
    const boosterRow = i !== 0 ? '' : maxB > 0 && srbs.length
      ? `<span class="lbl">助推器</span>
        <select data-change="dBoostType">${options(srbs, bst.type, c => `${c.name} · 推力 ${c.thrustSL} kN · Isp ${c.ispSL}/${c.ispVac}s · 推進劑 ${c.prop}t · ₵${c.cost}`)}</select>
        <span class="stepper">${UI.btn('−', 'dBoost', 'data-delta="-1"')}<span>${bst.count}</span>${UI.btn('+', 'dBoost', 'data-delta="1"')}</span>`
      : '<span class="lbl">助推器</span><span class="dim small" style="grid-column:span 2">研發「固體助推器」後可在兩側捆綁助推器</span>';
    return `<div class="stage-card">
      <div class="hd"><span>第 ${i + 1} 級 ${i === 0 ? '(起飛)' : '(真空)'}</span>${d.stages.length > 1 ? UI.btn('移除', 'dStageDel', `data-idx="${i}"`, 'sm danger') : ''}</div>
      <div class="stage-grid">
        <span class="lbl">引擎</span>
        <select data-change="dSet" data-field="engine" data-idx="${i}">${options(engs, st.engine, c => engFmt(c).replace(/\|/g, ' · '))}</select>
        ${stepper('engineCount', st.engineCount)}
        <span class="lbl">貯箱</span>
        <select data-change="dSet" data-field="tank" data-idx="${i}">${options(tanks, st.tank, c => tankFmt(c).replace(/\|/g, ' · '))}</select>
        ${stepper('tankCount', st.tankCount)}
        ${boosterRow}
      </div>
      <div class="row mt small">
        ${UI.tag('Δv ' + (r.dv / 1000).toFixed(2) + ' km/s', 'accent')}
        ${r.dvBoost ? UI.tag('含並聯段 ' + (r.dvBoost / 1000).toFixed(2) + ' km/s', 'accent') : ''}
        ${UI.tag('推重比 ' + r.twr.toFixed(2), i === 0 ? (r.twr >= G.BALANCE.minLiftoffTWR ? 'good' : 'bad') : r.twr < 0.25 ? 'warn' : '')}
        ${UI.tag(`Isp ${r.isp.toFixed(0)} s`)}
        ${UI.tag(`濕重 ${(r.prop + r.dry).toFixed(1)} t`)}
        ${UI.tag(`乾重 ${r.dry.toFixed(1)} t`)}
        ${i === 0 && e.ispSL === 0 ? UI.tag('真空引擎無法在海平面點火', 'bad') : ''}
      </div>
    </div>`;
  }

  UI.views.design = {
    render(s) {
      const d = draft(s);
      const b = G.BALANCE;
      const maxSt = G.Mods.maxStages(s);
      const pay = Math.max(0, d.payload || 0);
      const info = R.compute(d, pay);
      const errs = R.validate(s, d);
      const caps = R.capabilities(d);
      const tmp = Object.assign({}, d, { builds: 0, successes: 0 });
      const cost = R.cost(s, tmp), rel = R.reliability(s, tmp), months = R.buildMonths(s, tmp);

      const bpRows = s.blueprints.map(bp => {
        const cp = R.capabilities(bp);
        const used = s.inventory.some(r => r.bpId === bp.id) || s.production.some(p => p.bpId === bp.id);
        return `<tr>
          <td>${U.esc(bp.name)}<div class="dim small">${R.summary(bp)}</div></td>
          <td class="num">${U.ton(cp.LEO)}</td><td class="num">${U.ton(cp.GEO)}</td>
          <td class="num">${U.money(R.cost(s, bp))}</td>
          <td class="num">${U.pct(R.reliability(s, bp), 1)}</td>
          <td class="num">${bp.successes || 0}/${bp.flights || 0}</td>
          <td class="nowrap">${UI.btn('載入修改', 'dLoad', `data-id="${bp.id}"`, 'sm')} ${s.blueprints.length > 1 && !used ? UI.btn('刪除', 'bpDel', `data-id="${bp.id}"`, 'sm danger') : ''}</td>
        </tr>`;
      }).join('');

      return `<h2 class="view-title">火箭設計</h2>
      <div class="split">
        <div>
          <div class="panel">
            <h3>設計草稿 ${UI.btn('重新開始', 'dNew', '', 'sm')}</h3>
            <div class="row mb"><span class="dim small">名稱</span><input type="text" maxlength="14" value="${U.esc(d.name)}" data-input="dName" style="flex:1"></div>
            ${d.stages.map((_, i) => stageEditor(s, d, i, info)).join('')}
            <div class="row mb">
              ${UI.btn('+ 加一級(上方)', 'dStageAdd', d.stages.length >= maxSt ? 'disabled' : '', 'sm')}
              <span class="dim small">最多 ${maxSt} 級${maxSt < 3 ? '(研發「三級火箭整合」可增加)' : ''}</span>
            </div>
            <div class="part-grid">
              <span class="dim small">整流罩</span>
              <select data-change="dSet" data-field="fairing">${options(unlockedOf(s, 'fairing'), d.fairing, c => `${c.name} · 上限 ${c.maxPayload}t · ${c.mass}t · ₵${c.cost}`)}</select>
              <span class="dim small">航電</span>
              <select data-change="dSet" data-field="avionics">${options(unlockedOf(s, 'avionics'), d.avionics, c => `${c.name} · 可靠度 ${(c.rel * 100).toFixed(1)}% · ₵${c.cost}`)}</select>
              <span class="dim small">回收</span>
              <label class="inline ${G.Mods.reusable(s) ? '' : 'dim'}"><input type="checkbox" data-change="dReuse" ${d.reusable ? 'checked' : ''} ${G.Mods.reusable(s) ? '' : 'disabled'}>
                第一級回收(推進劑 -${U.pct(b.reusePropPenalty, 0)},${U.pct(b.reuseRecoverChance, 0)} 機率退回 ${U.pct(b.reuseRefund, 0)} 第一級成本)</label>
            </div>
          </div>
        </div>
        <div>
          <div class="panel">
            <h3>性能分析</h3>
            <div class="design-wrap">
              ${UI.rocketSVG(d)}
              <div>
                <div class="row mb"><span class="dim small">試算酬載</span><input type="number" step="0.1" min="0" value="${pay}" data-change="dPay"><span class="dim small">t</span></div>
                <div class="kv">
                  <span>總 Δv(含酬載)</span><span class="accent">${info.dv.toFixed(2)} km/s</span>
                  <span>起飛質量</span><span>${info.totalMass.toFixed(1)} t</span>
                  <span>起飛推重比</span><span class="${info.liftoffTWR >= b.minLiftoffTWR ? 'good' : 'bad'}">${info.liftoffTWR.toFixed(2)}</span>
                  <span>單枚成本(首枚)</span><span>${U.money(cost)}</span>
                  <span>製造工期</span><span>${months} 個月</span>
                  <span>基礎成功率</span><span>${U.pct(rel, 1)}</span>
                </div>
                ${errs.length ? `<ul class="err-list">${errs.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}
                ${info.warnings.length ? `<ul class="warn-list">${info.warnings.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}
                <h4 class="dim small mt">各軌道最大運載量</h4>
                <table><thead><tr><th>軌道</th><th class="num">需求 Δv</th><th class="num">最大酬載</th><th></th></tr></thead><tbody>
                ${G.ORBIT_ORDER.map(o => {
                  const od = G.ORBITS[o], locked = od.tech && s.techs[od.tech] == null;
                  return `<tr><td>${o} <span class="dim small">${od.name}</span></td><td class="num">${od.dv.toFixed(1)}</td>
                    <td class="num ${caps[o] > 0 ? 'cap-ok' : 'cap-no'}">${caps[o] > 0 ? U.ton(caps[o]) : '無法到達'}</td>
                    <td>${locked ? UI.tag('未認證', 'warn') : ''}</td></tr>`;
                }).join('')}
                </tbody></table>
                <div class="row mt">${UI.btn('儲存為藍圖', 'dSave', errs.length ? 'disabled' : '', 'primary')}</div>
              </div>
            </div>
          </div>
          <div class="panel">
            <h3>原理說明</h3>
            <div class="dim small">Δv = Isp × g₀ × ln(m₀ / m_f),由最上級往下逐級計算,上一級與酬載都算作下一級的負重。
            第一級使用海平面與真空比衝的平均值,並需起飛推重比 ≥ ${b.minLiftoffTWR}。捆綁助推器時採並聯分級:助推器與芯級一起點火,燒完後拋棄,芯級再燒完剩餘推進劑。
            上面級推重比低於 0.4 時有重力損失。多引擎並聯會略降可靠度,每多一級也增加分離風險。同一藍圖量產越多越便宜(最低 ${U.pct(b.learningFloor, 0)}),成功飛行紀錄可進一步降低失敗率。</div>
          </div>
        </div>
      </div>
      <div class="panel">
        <h3>已儲存藍圖 <span class="dim">${s.blueprints.length} 款</span></h3>
        <div class="tbl-wrap"><table>
          <thead><tr><th>名稱</th><th class="num">LEO</th><th class="num">GEO</th><th class="num">單價</th><th class="num">成功率</th><th class="num">飛行</th><th></th></tr></thead>
          <tbody>${bpRows}</tbody>
        </table></div>
      </div>`;
    },
  };

  const A = UI.actions;
  A.dNew = () => { UI.draft = newDraft(UI.s); UI.render(); };
  A.dLoad = el => {
    const bp = R.find(UI.s, el.dataset.id);
    UI.draft = { name: bp.name + ' 改', stages: clone(bp.stages), fairing: bp.fairing, avionics: bp.avionics, reusable: !!bp.reusable, boosters: bp.boosters ? clone(bp.boosters) : null, payload: 0 };
    UI.go('design');
  };
  A.dName = el => { draft(UI.s).name = el.value; };
  A.dPay = el => { draft(UI.s).payload = Math.max(0, parseFloat(el.value) || 0); UI.render(); };
  A.dReuse = el => { draft(UI.s).reusable = el.checked; UI.render(); };
  A.dSet = el => {
    const d = draft(UI.s);
    const f = el.dataset.field;
    if (el.dataset.idx != null) d.stages[+el.dataset.idx][f] = el.value; else d[f] = el.value;
    UI.render();
  };
  A.dCount = el => {
    const st = draft(UI.s).stages[+el.dataset.idx], f = el.dataset.field;
    const max = f === 'engineCount' ? G.Mods.maxEngines(UI.s) : G.Mods.maxTanks(UI.s);
    st[f] = U.clamp(st[f] + (+el.dataset.delta), 1, max);
    UI.render();
  };
  A.dBoostType = el => {
    const d = draft(UI.s);
    d.boosters = { type: el.value, count: d.boosters ? d.boosters.count : 0 };
    UI.render();
  };
  A.dBoost = el => {
    const s = UI.s, d = draft(s);
    const type = d.boosters ? d.boosters.type : G.COMPONENT_LIST.find(c => c.type === 'srb' && G.Mods.unlocked(s, c)).id;
    const count = U.clamp((d.boosters ? d.boosters.count : 0) + (+el.dataset.delta) * G.BALANCE.boosterStep, 0, G.Mods.maxBoosters(s));
    d.boosters = count > 0 ? { type, count } : null;
    UI.render();
  };
  A.dStageAdd = () => {
    const d = draft(UI.s);
    if (d.stages.length >= G.Mods.maxStages(UI.s)) return;
    d.stages.push({ engine: 'eng_blue', engineCount: 1, tank: 'tank_s', tankCount: 1 });
    UI.render();
  };
  A.dStageDel = el => { const d = draft(UI.s); d.stages.splice(+el.dataset.idx, 1); UI.render(); };
  A.dSave = () => {
    const s = UI.s, d = draft(s);
    const errs = R.validate(s, d);
    if (errs.length) { UI.toast(errs[0], 'bad'); return; }
    const name = (d.name || '').trim() || '未命名火箭';
    if (s.blueprints.some(b => b.name === name)) { UI.toast('已有同名藍圖,請換個名稱', 'bad'); return; }
    s.blueprints.push({ id: U.uid(s, 'bp'), name, created: s.month, stages: clone(d.stages), fairing: d.fairing, avionics: d.avionics, reusable: !!d.reusable, boosters: d.boosters && d.boosters.count > 0 ? clone(d.boosters) : null, builds: 0, flights: 0, successes: 0 });
    G.Log.add(s, `完成新火箭設計「${name}」。`, 'build');
    UI.toast(`已儲存藍圖「${name}」,可到「生產與發射」製造`, 'good');
    d.name = name + ' 改';
    UI.render();
  };
  A.bpDel = el => {
    const s = UI.s, bp = R.find(s, el.dataset.id);
    if (!bp || !confirm(`刪除藍圖「${bp.name}」?`)) return;
    s.blueprints = s.blueprints.filter(b => b !== bp);
    UI.render();
  };
})(window.Game);
