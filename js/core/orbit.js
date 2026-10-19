// 軌道擁擠度、衛星壽命衰減、碰撞與自營衛星收入
(function (G) {
  const U = G.U;
  const O = G.Orbit = {};

  O.counts = function (s) {
    const c = {};
    G.ORBIT_ORDER.forEach(o => { c[o] = 0; });
    s.sats.forEach(x => { c[x.orbit]++; });
    return c;
  };
  O.crowd = function (s, orbit, counts) {
    counts = counts || O.counts(s);
    return (counts[orbit] + s.debris[orbit]) / G.ORBITS[orbit].capacity;
  };
  // 擁擠造成的每月壽命損耗倍率
  O.decayRate = (crowd, reduce) => 1 + G.BALANCE.crowdDecayK * crowd * crowd * (1 - reduce);

  O.ownerReduce = function (s, owner) {
    if (owner === 'player') return G.Mods.crowdReduce(s);
    if (owner === 'client') return 0.2;
    const r = s.rivals.find(x => x.id === owner);
    return r ? Math.min(0.45, r.tech / 100) : 0;
  };

  O.addSat = function (s, owner, type, orbit, life) {
    s.sats.push({ id: U.uid(s, 'st'), owner, type, orbit, life, maxLife: life, launched: s.month });
  };

  // 自有衛星的市場係數(玩家的「高通量」類科技會放大市場規模)
  O.marketFactor = function (s, typeId) {
    const n = s.sats.filter(x => x.type === typeId).length;
    return Math.max(0.3, 1 - 0.5 * n / (G.SAT_TYPES[typeId].market * G.Mods.market(s)));
  };

  O.incomeBreakdown = function (s) {
    const mult = G.Mods.satIncome(s);
    return Object.values(G.SAT_TYPES).map(t => {
      const mine = s.sats.filter(x => x.owner === 'player' && x.type === t.id);
      const factor = O.marketFactor(s, t.id);
      return { type: t, count: mine.length, factor, income: mine.length * t.income * factor * mult, sats: mine };
    });
  };
  O.monthlyIncome = s => U.sum(O.incomeBreakdown(s), x => x.income);

  O.playerSatValue = s => U.sum(s.sats.filter(x => x.owner === 'player'), x => G.SAT_TYPES[x.type].cost * Math.max(0, x.life) / x.maxLife * 0.6);

  O.monthly = function (s, rep) {
    const b = G.BALANCE;
    const income = O.monthlyIncome(s);
    if (income > 0) G.Finance.add(s, income, 'service', '衛星服務收入');

    const counts = O.counts(s);
    const crowd = {};
    G.ORBIT_ORDER.forEach(o => { crowd[o] = O.crowd(s, o, counts); });

    s.sats = s.sats.filter(x => {
      x.life -= O.decayRate(crowd[x.orbit], O.ownerReduce(s, x.owner));
      if (x.life <= 0) {
        if (x.owner === 'player') { rep.retired++; rep.retiredTypes[x.type] = (rep.retiredTypes[x.type] || 0) + 1; }
        return false;
      }
      return true;
    });

    G.ORBIT_ORDER.forEach(o => {
      const c = crowd[o];
      if (c > b.collisionThreshold && G.RNG.chance(s, (c - b.collisionThreshold) * b.collisionChanceK)) {
        const inOrbit = s.sats.filter(x => x.orbit === o);
        const n = Math.min(inOrbit.length, G.RNG.int(s, 1, 3));
        let playerLost = 0;
        for (let i = 0; i < n; i++) {
          const v = G.RNG.pick(s, s.sats.filter(x => x.orbit === o));
          if (v.owner === 'player') playerLost++;
          s.sats = s.sats.filter(x => x !== v);
        }
        const debris = G.RNG.int(s, 4, 12);
        s.debris[o] += debris;
        rep.collisions.push({ orbit: o, lost: n, playerLost });
        G.Log.add(s, `${G.ORBITS[o].name}發生碰撞,${n} 顆衛星損毀${playerLost ? `(其中 ${playerLost} 顆是你的)` : ''},新增 ${debris} 片碎片。`, playerLost ? 'bad' : 'warn');
      }
      s.debris[o] *= b.debrisDecay;
    });
  };
})(window.Game);
