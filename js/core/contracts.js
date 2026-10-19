// 合約生成、競標與交付期限
(function (G) {
  const U = G.U, RNG = G.RNG;
  const CT = G.Contracts = {};

  CT.find = (s, id) => s.contracts.find(c => c.id === id);

  CT.generate = function (s, n, priceMult = 1, onlyOrbit = null) {
    const b = G.BALANCE;
    for (let i = 0; i < n; i++) {
      let orbit = onlyOrbit;
      if (!orbit) {
        const items = G.ORBIT_ORDER.filter(o => G.ORBITS[o].weight(s.month) > 0);
        orbit = RNG.weighted(s, items, o => G.ORBITS[o].weight(s.month));
      }
      const od = G.ORBITS[orbit];
      const [mn, mx] = od.mass(s.month);
      const mass = U.round(RNG.range(s, mn, mx), 2);
      const price = U.round((od.priceBase + od.pricePerTon * mass) * RNG.range(s, 0.85, 1.2) * G.Mods.contractPrice(s) * priceMult, 1);
      const minRep = od.minRep + (RNG.chance(s, 0.3) ? RNG.int(s, 5, 20) : 0);
      s.contracts.push({
        id: U.uid(s, 'ct'),
        client: RNG.pick(s, G.CLIENTS),
        purpose: RNG.pick(s, G.PURPOSES[orbit]),
        orbit, mass, price, base: price, minRep,
        created: s.month,
        bidClose: s.month + b.bidWindow - 1,
        deliverMonths: RNG.int(s, 5, 12),
        status: 'open',
        playerBid: null,
      });
    }
    // 清除久遠的已結束合約
    s.contracts = s.contracts.filter(c => ['open', 'won'].includes(c.status) || s.month - c.created < 24);
  };

  CT.playerEligible = function (s, c) {
    const od = G.ORBITS[c.orbit];
    if (od.tech && s.techs[od.tech] == null) return `需要「${G.TECH_MAP[od.tech].name}」`;
    if (s.rep < c.minRep) return `聲望需 ≥ ${c.minRep}`;
    return null;
  };

  // 玩家的歷史成功率(貝氏平滑)
  CT.trackRecord = s => (s.stats.successes + 0.5 * s.stats.partials + 4 * 0.85) / (s.stats.launches + 4);

  CT.bid = function (s, id, price) {
    const b = G.BALANCE, c = CT.find(s, id);
    if (!c || c.status !== 'open') return '合約已截止';
    const err = CT.playerEligible(s, c);
    if (err) return err;
    if (!(price >= c.base * b.bidMin && price <= c.base * b.bidMax)) return `出價需介於 ${U.money(c.base * b.bidMin)} 與 ${U.money(c.base * b.bidMax)}`;
    c.playerBid = U.round(price, 1);
    return null;
  };
  CT.withdraw = function (s, id) {
    const c = CT.find(s, id);
    if (c && c.status === 'open') c.playerBid = null;
  };

  CT.score = (price, base, rep, rel, bonus) => price / base - 0.003 * rep - 0.8 * (rel - 0.85) - bonus;

  CT.resolveBids = function (s, rep) {
    const b = G.BALANCE;
    s.contracts.filter(c => c.status === 'open' && c.bidClose <= s.month).forEach(c => {
      const bids = [];
      if (c.playerBid != null && !CT.playerEligible(s, c)) {
        bids.push({ who: 'player', price: c.playerBid, score: CT.score(c.playerBid, c.base, s.rep, CT.trackRecord(s), G.Mods.bidBonus(s)) });
      }
      s.rivals.forEach(r => {
        if (!G.Rivals.eligible(s, r, c) || !RNG.chance(s, b.rivalBidChance)) return;
        const price = U.round(G.Rivals.bidPrice(s, r, c), 1);
        bids.push({ who: r.id, price, score: CT.score(price, c.base, r.rep, G.Rivals.rel(r), 0) });
      });
      if (!bids.length) { c.status = 'expired'; return; }
      bids.sort((x, y) => x.score - y.score);
      const win = bids[0];
      c.price = win.price;
      c.winner = win.who;
      const label = `${c.client}「${c.purpose}」`;
      if (win.who === 'player') {
        c.status = 'won';
        c.deadline = s.month + c.deliverMonths;
        const adv = c.price * b.advanceShare;
        G.Finance.add(s, adv, 'contract', `${label}預付款`);
        G.Log.add(s, `得標 ${label},合約金 ${U.money(c.price)},已收預付款 ${U.money(adv)}。`, 'good');
        rep.bids.push({ c, won: true });
      } else {
        c.status = 'lost';
        const r = s.rivals.find(x => x.id === win.who);
        r.pending.push({ month: s.month + RNG.int(s, 1, 4), contractId: c.id, orbit: c.orbit });
        if (c.playerBid != null) {
          G.Log.add(s, `${label} 由 ${G.Rivals.def(r.id).name} 以 ${U.money(c.price)} 得標。`, 'warn');
          rep.bids.push({ c, won: false, winner: r.id });
        }
      }
    });
  };

  CT.isPlanned = (s, id) => s.launches.some(l => l.mission.kind === 'contract' && l.mission.contractId === id);

  CT.checkDeadlines = function (s, rep) {
    const b = G.BALANCE;
    s.contracts.filter(c => c.status === 'won' && s.month >= c.deadline && !CT.isPlanned(s, c.id)).forEach(c => {
      c.status = 'failed';
      c.overdue = true;
      const fine = U.round(c.price * b.contractFailPenalty, 1);
      G.Finance.spend(s, fine, 'penalty', `${c.client} 違約金`);
      s.rep = Math.max(0, s.rep - b.contractFailRep);
      rep.deadlines.push(c);
      G.Log.add(s, `未能如期交付 ${c.client}「${c.purpose}」,支付違約金 ${U.money(fine)},聲望 -${b.contractFailRep}。`, 'bad');
    });
  };
})(window.Game);
