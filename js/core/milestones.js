(function (G) {
  const U = G.U;
  const playerSats = s => s.sats.filter(x => x.owner === 'player').length;

  G.MILESTONES = [
    { id: 'orbit', name: '首次成功入軌', desc: '完成第一次成功發射。', check: s => s.stats.successes >= 1 },
    { id: 'ten', name: '十次成功發射', desc: '累計成功發射 10 次。', check: s => s.stats.successes >= 10 },
    { id: 'own', name: '自有衛星', desc: '部署第一顆自有衛星。', check: s => s.stats.ownSats >= 1 },
    { id: 'geo', name: '挺進同步軌道', desc: '以合約或自有衛星任務成功發射至 GEO。', check: s => !!s.stats.orbitsReached.GEO },
    { id: 'const', name: '星座成形', desc: '自有在軌衛星同時達 20 顆。', check: s => playerSats(s) >= 20 },
    { id: 'lunar', name: '奔月', desc: '以合約或自有衛星任務成功發射至月球軌道。', check: s => !!s.stats.orbitsReached.LUNAR },
    { id: 'rev', name: '億元企業', desc: '單月營收 ≥ ₵100M(1 億)且無負債。', check: s => (s.stats.lastRevenue || 0) >= G.BALANCE.revenueGoal && s.debt <= 0 && s.cash >= 0 },
  ];

  const MS = G.Milestones = {};

  MS.check = function (s, rep) {
    const b = G.BALANCE;
    G.MILESTONES.forEach(m => {
      if (s.milestones[m.id] != null || !m.check(s)) return;
      s.milestones[m.id] = s.month;
      s.rep = Math.min(100, s.rep + b.milestoneRep);
      G.Finance.add(s, b.milestoneCash, 'event', `里程碑獎勵:${m.name}`);
      rep.milestones.push(m);
      G.Log.add(s, `🏆 達成里程碑「${m.name}」!`, 'good');
    });
    if (!s.victory && G.MILESTONES.every(m => s.milestones[m.id] != null)) {
      s.victory = true;
      rep.victory = true;
    }
  };

  MS.score = function (s) {
    const satValue = G.Orbit.playerSatValue(s);
    const rocketValue = U.sum(s.inventory, r => { const bp = G.Rocket.find(s, r.bpId); return bp ? G.Rocket.cost(s, bp) * 0.5 : 0; });
    const netWorth = s.cash - s.debt + satValue + rocketValue;
    const done = G.MILESTONES.filter(m => s.milestones[m.id] != null).length;
    const total = Math.round(netWorth + done * 80 + s.rep * 3);
    const g = G.BALANCE.grades.find(x => total >= x[0]);
    const grade = g ? g[1] : 'D';
    return { satValue, rocketValue, netWorth, done, milestoneScore: done * 80, repScore: Math.round(s.rep * 3), total, grade };
  };
})(window.Game);
