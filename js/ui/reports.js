// 彈出視窗內容:開場說明、月報、事件抉擇、勝利、結算、選單
(function (G) {
  const U = G.U, UI = G.UI;
  const R = UI.Reports = {};

  R.introStep = s => ({
    html: `<h2>歡迎,${U.esc(s.company)} 執行長</h2>
      <p>公司剛在艾瑟聯邦成立,帳上有 ${U.money(s.cash)},倉庫裡有一枚「啟明一號」小型火箭(LEO 約 0.4 t)。</p>
      <ul class="list">
        <li><b>1. 合約</b>:投標客戶的發射需求,得標後在期限內發射。</li>
        <li><b>2. 生產與發射</b>:製造火箭、排定本月發射,按「下一月」執行。</li>
        <li><b>3. 火箭設計</b>:自由組合引擎與貯箱,依 Δv 決定能到哪個軌道、載多重。</li>
        <li><b>4. 科技研發</b>:解鎖更好的組件、軌道認證與自營衛星。部分科技需先用特定規格的火箭發射,或完成「純實驗」任務蒐集數據。</li>
        <li><b>5. 軌道與衛星</b>:部署自有星座賺取月收入,但軌道越擠壽命越短。</li>
      </ul>
      <p class="dim small">目標:${G.BALANCE.maxMonths} 個月內完成 ${G.MILESTONES.length} 個里程碑。可以借款與透支,但都會產生利息。</p>
      <div class="modal-actions"><button class="btn primary" data-act="modalNext">開始經營</button></div>`,
  });

  R.summaryStep = function (s, rep) {
    const sec = (title, items) => (items.length ? `<h4>${title}</h4><ul class="list">${items.map(x => `<li>${x}</li>`).join('')}</ul>` : '');
    const bids = rep.bids.map(b => (b.won
      ? `<span class="good">得標</span> ${U.esc(b.c.client)}「${b.c.purpose}」${b.c.orbit} · ${U.money(b.c.price)},期限 ${U.date(b.c.deadline)}`
      : `<span class="dim">落標</span> ${U.esc(b.c.client)}「${b.c.purpose}」由 ${G.Rivals.def(b.winner).name} 以 ${U.money(b.c.price)} 得標`));
    const launches = rep.launches.map(l => `${l.outcome === 'success' ? '<span class="good">成功</span>' : l.outcome === 'partial' ? '<span class="warn">部分成功</span>' : '<span class="bad">失敗</span>'} ${U.esc(l.bpName)} → ${l.orbit} ${l.label}`);
    const done = rep.research.map(id => `<span class="accent">研發完成</span>「${G.TECH_MAP[id].name}」${G.Research.unlocks(id).concat(G.Research.effectText(G.TECH_MAP[id])).map(x => ` · ${x}`).join('')}`)
      .concat(rep.production.map(n => `<span class="accent">總裝完成</span>「${U.esc(n)}」已進入庫存`));
    const bad = rep.deadlines.map(c => `<span class="bad">違約</span> ${U.esc(c.client)}「${c.purpose}」逾期未發射`)
      .concat(rep.collisions.map(c => `<span class="${c.playerLost ? 'bad' : 'warn'}">碰撞</span> ${c.orbit} 損失 ${c.lost} 顆衛星${c.playerLost ? `(你的 ${c.playerLost} 顆)` : ''}`))
      .concat(rep.retired ? [`<span class="warn">退役</span> ${Object.entries(rep.retiredTypes).map(([k, v]) => `${G.SAT_TYPES[k].name} ×${v}`).join('、')} 壽命終了`] : [])
      .concat(rep.notes.map(n => `<span class="warn">注意</span> ${n}`));
    const events = rep.events.map(e => `<span class="event-cat">${G.EVENT_MAP[e.id].cat}</span> <b>${G.EVENT_MAP[e.id].title}</b>:${G.EVENT_MAP[e.id].text} ${e.result}`);
    const ms = rep.milestones.map(m => `🏆 <b>${m.name}</b> — ${m.desc}(聲望 +${G.BALANCE.milestoneRep},獎金 ${U.money(G.BALANCE.milestoneCash)})`);
    return {
      html: `<h2>${U.date(rep.month)} 月報</h2>
        <div class="grid g3">
          <div><div class="dim small">營收</div><div class="mono good" style="font-size:20px">${U.money(rep.revenue)}</div></div>
          <div><div class="dim small">支出</div><div class="mono bad" style="font-size:20px">${U.money(rep.expense)}</div></div>
          <div><div class="dim small">月底資金</div><div class="mono ${s.cash < 0 ? 'bad' : ''}" style="font-size:20px">${U.money(s.cash)}</div></div>
        </div>
        ${sec('里程碑', ms)}${sec('發射', launches)}${sec('開標結果', bids)}${sec('完成項目', done)}${sec('警示', bad)}${sec('新月份事件', events)}
        ${sec('業界動態', rep.rivalNews.slice(0, 5).map(x => `<span class="dim">${x}</span>`))}
        <div class="modal-actions"><button class="btn primary" data-act="modalNext">進入 ${U.date(s.month)}</button></div>`,
    };
  };

  R.eventStep = function (s) {
    const ev = G.EVENT_MAP[s.pendingEvent.id];
    return {
      html: `<div class="event-cat">${ev.cat}事件</div><h2>${ev.title}</h2><p>${ev.text}</p>
        <div class="choice-list">${ev.choices.map((c, i) => `<button class="btn" data-act="eventChoice" data-idx="${i}">${c.label}</button>`).join('')}</div>`,
    };
  };
  UI.actions.eventChoice = el => {
    const s = UI.s;
    if (!s.pendingEvent) { UI.Modal.next(); return; }
    const ev = G.EVENT_MAP[s.pendingEvent.id];
    const res = G.Events.choose(s, +el.dataset.idx);
    G.Save.auto(s);
    UI.Modal.q.unshift({ html: `<div class="event-cat">${ev.cat}事件</div><h2>${ev.title}</h2><p>${res}</p><div class="modal-actions"><button class="btn primary" data-act="modalNext">確定</button></div>` });
    UI.Modal.next();
  };

  R.victoryStep = s => ({
    html: `<h2>🏆 全部里程碑達成!</h2>
      <p>${U.esc(s.company)} 已成為艾瑟聯邦最頂尖的太空企業,於 ${U.date(s.month - 1)} 完成全部 ${G.MILESTONES.length} 個里程碑。</p>
      <p class="dim">你可以立即結算,或繼續經營到第 ${G.BALANCE.maxMonths} 個月以提高分數。</p>
      <div class="modal-actions"><button class="btn" data-act="modalNext">繼續經營</button><button class="btn primary" data-act="finishNow">立即結算</button></div>`,
  });
  UI.actions.finishNow = () => {
    UI.s.ended = true;
    G.Save.auto(UI.s);
    UI.Modal.reset();
    UI.render();
    UI.Modal.push(R.finalStep(UI.s, 'victory'));
  };

  R.finalStep = function (s, why) {
    const sc = G.Milestones.score(s);
    const title = { time: '十年經營期滿', abandon: '放棄經營', victory: '光榮退場' }[why];
    return {
      html: `<h2>${title} · 最終結算</h2>
        <div class="grid g2">
          <div><div class="dim small center">評級</div><div class="grade">${sc.grade}</div><div class="center mono">${sc.total} 分</div></div>
          <div class="kv">
            <span>現金</span><span>${U.money(s.cash)}</span>
            <span>負債</span><span>-${U.money(s.debt)}</span>
            <span>衛星資產</span><span>${U.money(sc.satValue)}</span>
            <span>庫存火箭</span><span>${U.money(sc.rocketValue)}</span>
            <span>淨值</span><span>${U.money(sc.netWorth)}</span>
            <span>里程碑 ${sc.done} × 80</span><span>${sc.milestoneScore}</span>
            <span>聲望 × 3</span><span>${sc.repScore}</span>
          </div>
        </div>
        <h4>經營紀錄</h4>
        <div class="kv">
          <span>經營時間</span><span>${s.month} 個月</span>
          <span>發射</span><span>${s.stats.successes} 成功 / ${s.stats.launches} 次</span>
          <span>完成合約</span><span>${s.stats.contractsDone}</span>
          <span>部署自有衛星</span><span>${s.stats.ownSats} 顆</span>
          <span>研發科技</span><span>${Object.keys(s.techs).length} / ${G.TECHS.length}</span>
        </div>
        <h4>里程碑</h4>
        <div class="milestones">${G.MILESTONES.map(m => `<div class="ms ${s.milestones[m.id] != null ? 'done' : ''}"><span class="ico">${s.milestones[m.id] != null ? '✓' : '·'}</span><div class="t">${m.name}</div></div>`).join('')}</div>
        <div class="dim small mt">評級門檻:${G.BALANCE.grades.map(g => `${g[1]} ≥ ${g[0]}`).join('、')}</div>
        <div class="modal-actions"><button class="btn" data-act="modalNext">留下來檢視</button><button class="btn primary" data-act="toStart">回到主畫面</button></div>`,
    };
  };

  R.menuStep = function (s) {
    const slot = k => {
      const m = G.Save.meta(k);
      return `<div class="slot"><span>存檔 ${k}:${m ? `${U.esc(m.company)} · ${U.date(m.month)}` : '<span class="dim">空</span>'}</span>
        <span class="row">${UI.btn('存到這裡', 'saveSlot', `data-slot="${k}"`, 'sm primary')}${m ? UI.btn('讀取', 'loadSlot', `data-slot="${k}"`, 'sm') : ''}</span></div>`;
    };
    return {
      html: `<h2>選單</h2>
        <div class="dim small">每月結束時會自動存檔。瀏覽器存檔只存在這台裝置,換電腦請用匯出。</div>
        <div class="slot-list">${G.Save.SLOTS.map(slot).join('')}</div>
        <div class="row mt">${UI.btn('匯出存檔檔案', 'exportSave')}${UI.btn('匯入存檔檔案', 'importSave')}</div>
        <div class="row mt">${s.ended ? UI.btn('檢視結算', 'showFinal') : UI.btn('放棄經營', 'abandon', '', 'danger')}${UI.btn('回到主畫面', 'toStart')}</div>
        <div class="modal-actions"><button class="btn primary" data-act="modalNext">關閉</button></div>`,
    };
  };
})(window.Game);
