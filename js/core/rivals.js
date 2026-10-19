// AI 競爭對手:以簡單規則成長、競標合約、部署自有星座佔用軌道
(function (G) {
  const U = G.U, RNG = G.RNG;
  const RV = G.Rivals = {};
  const ORBIT_TECH = { LEO: 0, SSO: 0, MEO: 10, GEO: 22, LUNAR: 40 };

  RV.def = id => G.RIVALS.find(r => r.id === id);

  RV.init = function (s) {
    s.rivals = G.RIVALS.map(d => ({ id: d.id, tech: RNG.range(s, 2, 6), rep: RNG.int(s, 12, 22), launches: 0, successes: 0, pending: [] }));
  };

  RV.rel = r => Math.min(0.97, RV.def(r.id).baseRel + r.tech * 0.0025);
  RV.canOrbit = (r, o) => r.tech >= ORBIT_TECH[o];
  RV.capacity = (r, o) => (0.6 + r.tech * 0.35) * G.ORBITS[o].rivalFactor;
  RV.eligible = (s, r, c) => RV.canOrbit(r, c.orbit) && RV.capacity(r, c.orbit) >= c.mass && r.rep >= c.minRep;
  RV.bidPrice = (s, r, c) => c.base * RV.def(r.id).bidFactor * G.Mods.rivalBid(s) * RNG.range(s, 0.92, 1.08);
  RV.satCount = (s, r) => s.sats.filter(x => x.owner === r.id).length;

  function launch(s, r) {
    r.launches++;
    const ok = RNG.chance(s, RV.rel(r));
    if (ok) { r.successes++; r.rep = Math.min(100, r.rep + 1.5); } else { r.rep = Math.max(0, r.rep - 4); }
    return ok;
  }

  RV.resolveLaunches = function (s, rep) {
    const b = G.BALANCE;
    s.rivals.forEach(r => {
      r.pending = r.pending.filter(p => {
        if (p.month > s.month) return true;
        if (launch(s, r)) G.Orbit.addSat(s, 'client', 'client', p.orbit, RNG.int(s, b.clientSatLife[0], b.clientSatLife[1]));
        else {
          rep.rivalNews.push(`${RV.def(r.id).name} 的一次合約發射失敗。`);
          G.Log.add(s, `${RV.def(r.id).name} 發射失敗。`, 'rival');
        }
        return false;
      });
    });
  };

  RV.monthly = function (s, rep) {
    s.rivals.forEach(r => {
      const d = RV.def(r.id);
      r.tech += d.techRate * RNG.range(s, 0.6, 1.4);
      if (!RNG.chance(s, d.constRate * Math.min(1, 0.2 + r.tech / 30))) return;

      const types = Object.values(G.SAT_TYPES).filter(t => r.tech >= t.rivalTech && RV.canOrbit(r, t.orbit) && RV.capacity(r, t.orbit) >= t.mass);
      const t = RNG.weighted(s, types, x => (x.id === 'broadband' ? 4 : 1));
      if (!t) return;
      const maxN = Math.floor(RV.capacity(r, t.orbit) / t.mass);
      let n = 1;
      if (t.id === 'broadband') n = RNG.int(s, 3, Math.min(15, 4 + Math.floor(r.tech / 6)));
      else if (t.id === 'cube') n = RNG.int(s, 2, 6);
      else if (t.id === 'eo') n = RNG.int(s, 1, 2);
      n = Math.max(1, Math.min(n, maxN));

      if (launch(s, r)) {
        for (let i = 0; i < n; i++) G.Orbit.addSat(s, r.id, t.id, t.orbit, t.life * RNG.range(s, 0.9, 1.1));
        const msg = `${d.name} 部署了 ${n} 顆${t.name}至 ${t.orbit}。`;
        rep.rivalNews.push(msg);
        G.Log.add(s, msg, 'rival');
      } else {
        const msg = `${d.name} 的${t.name}發射失敗。`;
        rep.rivalNews.push(msg);
        G.Log.add(s, msg, 'rival');
      }
    });
  };
})(window.Game);
