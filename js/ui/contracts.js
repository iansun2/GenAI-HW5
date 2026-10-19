(function (G) {
  const U = G.U, UI = G.UI, CT = G.Contracts;

  // 玩家藍圖中對該軌道的最大運載量
  const bestCap = (s, orbit) => Math.max(0, ...s.blueprints.map(bp => G.Rocket.maxPayload(bp, orbit)));

  const STATUS = { won: ['執行中', 'accent'], done: ['已完成', 'good'], failed: ['失敗', 'bad'], lost: ['未得標', ''], expired: ['流標', ''], open: ['投標中', 'warn'] };

  UI.views.contracts = {
    render(s) {
      const b = G.BALANCE;
      const open = s.contracts.filter(c => c.status === 'open');
      const active = s.contracts.filter(c => c.status === 'won');
      const past = s.contracts.filter(c => ['done', 'failed'].includes(c.status) || (c.status === 'lost' && c.playerBid != null)).slice(-15).reverse();
      const caps = {};
      G.ORBIT_ORDER.forEach(o => { caps[o] = bestCap(s, o); });
      const busy = active.length + open.filter(c => c.playerBid != null).length;

      return `<h2 class="view-title">合約市場</h2>
      <div class="alert info">每份合約開放投標 ${b.bidWindow} 個月,於截止月底開標。評分綜合<b>報價/底價</b>、<b>聲望</b>與<b>歷史成功率</b>,最低者得標。
        得標時收取 ${U.pct(b.advanceShare, 0)} 預付款,成功交付後收取尾款;逾期未發射須付 ${U.pct(b.contractFailPenalty, 0)} 違約金並損失聲望。
        <br>你目前有 <b>${busy}</b> 筆執行中/投標中的合約,發射台每月可發射 <b>${s.facilities.pad}</b> 次。</div>
      <div class="panel">
        <h3>開放投標 <span class="dim">${open.length} 筆</span></h3>
        <div class="tbl-wrap"><table>
          <thead><tr><th>客戶 / 酬載</th><th>軌道</th><th class="num">質量</th><th class="num">底價</th><th>條件</th><th>截止</th><th>我的運力</th><th>出價</th><th></th></tr></thead>
          <tbody>${open.map(c => {
            const err = CT.playerEligible(s, c);
            const fit = caps[c.orbit] >= c.mass;
            const cur = c.playerBid != null;
            return `<tr>
              <td>${U.esc(c.client)}<div class="dim small">${c.purpose} · 交期 ${c.deliverMonths} 個月</div></td>
              <td>${UI.tag(c.orbit, 'accent')}</td>
              <td class="num">${U.ton(c.mass)}</td>
              <td class="num">${U.money(c.base)}</td>
              <td>${c.minRep ? `<span class="${s.rep >= c.minRep ? '' : 'bad'}">聲望 ≥ ${c.minRep}</span>` : '<span class="dim">—</span>'}</td>
              <td class="nowrap">${U.date(c.bidClose)}底</td>
              <td>${fit ? `<span class="cap-ok">✓ ${U.ton(caps[c.orbit])}</span>` : `<span class="warn">✗ ${U.ton(caps[c.orbit])}</span>`}</td>
              <td>${err ? `<span class="dim small">${err}</span>` : `<input type="number" id="bid-${c.id}" step="0.5" min="${U.round(c.base * b.bidMin, 1)}" max="${U.round(c.base * b.bidMax, 1)}" value="${cur ? c.playerBid : U.round(c.base * 0.95, 1)}">`}</td>
              <td class="nowrap">${err ? '' : cur
                ? `${UI.tag('已出價 ' + U.money(c.playerBid), 'good')} ${UI.btn('更新', 'bid', `data-id="${c.id}"`, 'sm')} ${UI.btn('撤回', 'withdraw', `data-id="${c.id}"`, 'sm danger')}`
                : UI.btn('投標', 'bid', `data-id="${c.id}"`, 'sm primary')}</td>
            </tr>`;
          }).join('') || '<tr><td colspan="9" class="dim">目前沒有開放中的合約,下個月會有新的需求。</td></tr>'}</tbody>
        </table></div>
        <div class="dim small mt">「我的運力」為現有藍圖對該軌道的最大運載量。若不足,得標後需先設計並製造更大的火箭。</div>
      </div>

      <div class="panel">
        <h3>執行中合約 <span class="dim">${active.length} 筆</span></h3>
        <div class="tbl-wrap"><table>
          <thead><tr><th>客戶 / 酬載</th><th>軌道</th><th class="num">質量</th><th class="num">合約金</th><th>期限</th><th>狀態</th><th></th></tr></thead>
          <tbody>${active.map(c => {
            const left = c.deadline - s.month;
            const planned = CT.isPlanned(s, c.id);
            return `<tr>
              <td>${U.esc(c.client)}<div class="dim small">${c.purpose}</div></td>
              <td>${UI.tag(c.orbit, 'accent')}</td>
              <td class="num">${U.ton(c.mass)}</td>
              <td class="num">${U.money(c.price)}</td>
              <td class="nowrap ${left <= 1 ? 'bad' : left <= 3 ? 'warn' : ''}">${U.date(c.deadline)}底(剩 ${left + 1} 月)</td>
              <td>${planned ? UI.tag('本月發射', 'good') : caps[c.orbit] >= c.mass ? UI.tag('待排程', 'warn') : UI.tag('運力不足', 'bad')}</td>
              <td>${UI.btn('前往發射', 'goto', 'data-tab="hangar"', 'sm')}</td>
            </tr>`;
          }).join('') || '<tr><td colspan="7" class="dim">沒有執行中的合約。</td></tr>'}</tbody>
        </table></div>
      </div>

      <div class="panel">
        <h3>近期紀錄</h3>
        <div class="tbl-wrap"><table>
          <thead><tr><th>客戶 / 酬載</th><th>軌道</th><th class="num">金額</th><th>結果</th></tr></thead>
          <tbody>${past.map(c => {
            const [label, cls] = STATUS[c.status];
            const extra = c.status === 'lost' ? `由 ${G.Rivals.def(c.winner).name} 得標` : c.partial ? '軌道偏差,尾款減半' : c.overdue ? '逾期違約' : '';
            return `<tr><td>${U.esc(c.client)}<div class="dim small">${c.purpose}</div></td><td>${UI.tag(c.orbit)}</td><td class="num">${U.money(c.price)}</td><td>${UI.tag(label, cls)} <span class="dim small">${extra}</span></td></tr>`;
          }).join('') || '<tr><td colspan="4" class="dim">尚無紀錄。</td></tr>'}</tbody>
        </table></div>
      </div>`;
    },
  };

  UI.actions.bid = el => {
    const input = document.getElementById('bid-' + el.dataset.id);
    const v = parseFloat(input && input.value);
    UI.run(CT.bid(UI.s, el.dataset.id, v), '已送出報價');
  };
  UI.actions.withdraw = el => { CT.withdraw(UI.s, el.dataset.id); UI.render(); };
})(window.Game);
