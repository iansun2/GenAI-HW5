// 月底結算。順序:發射 → 對手發射 → 開標 → 期限 → 生產 → 研發 → 軌道 → 對手 → 財務 → 新月份
(function (G) {
  const RNG = G.RNG;

  G.Turn = {
    end(s) {
      const b = G.BALANCE, F = G.Finance;
      const rep = {
        month: s.month, launches: [], bids: [], research: [], production: [], events: [], milestones: [],
        retired: 0, retiredTypes: {}, collisions: [], deadlines: [], rivalNews: [], notes: [],
      };

      G.Launch.resolveAll(s, rep);
      G.Rivals.resolveLaunches(s, rep);
      G.Contracts.resolveBids(s, rep);
      G.Contracts.checkDeadlines(s, rep);
      G.Production.process(s, rep);
      G.Research.process(s, rep);
      G.Orbit.monthly(s, rep);
      G.Rivals.monthly(s, rep);
      F.monthly(s, rep);

      rep.ledger = s.ledger;
      rep.revenue = F.revenue(s.ledger);
      rep.expense = F.expense(s.ledger);
      s.stats.lastRevenue = rep.revenue;
      s.history.push({
        m: s.month, cash: G.U.round(s.cash, 2), debt: G.U.round(s.debt, 2),
        rev: G.U.round(rep.revenue, 2), exp: G.U.round(rep.expense, 2), rep: G.U.round(s.rep, 1),
        sats: s.sats.filter(x => x.owner === 'player').length,
      });
      G.Milestones.check(s, rep);
      if (rep.retired) G.Log.add(s, `${rep.retired} 顆自有衛星壽命終了,已退役。`, 'warn');

      // 進入新月份
      s.month++;
      s.prevLedger = s.ledger;
      s.ledger = { month: s.month, items: [] };
      s.modifiers = s.modifiers.filter(m => m.until > s.month);
      for (const id in s.grounded) if (s.grounded[id] <= s.month) delete s.grounded[id];

      if (s.month >= b.maxMonths) {
        s.gameOver = true;
        s.ended = true;
        rep.gameOver = true;
      } else {
        G.Contracts.generate(s, RNG.int(s, b.contractsPerMonth[0], b.contractsPerMonth[1]));
        G.Events.roll(s, rep);
      }
      G.Save.auto(s);
      return rep;
    },
  };
})(window.Game);
