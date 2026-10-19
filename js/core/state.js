(function (G) {
  const U = G.U, RNG = G.RNG;
  G.SAVE_VERSION = 2;

  // 舊版存檔升級。v1 → v2:新增飛行紀錄與助推器;引擎並聯上限改由科技決定,已使用超過基本上限的玩家直接獲得對應科技
  G.migrate = function (s) {
    if (!s || typeof s !== 'object' || typeof s.version !== 'number' || s.version > G.SAVE_VERSION) return s;
    if (s.version < 2) {
      s.flightLog = s.flightLog || [];
      s.stats.experiments = s.stats.experiments || 0;
      (s.blueprints || []).forEach(bp => { bp.boosters = bp.boosters || null; });
      const maxEng = Math.max(0, ...(s.blueprints || []).map(bp => Math.max(...bp.stages.map(st => st.engineCount))));
      if (maxEng > G.BALANCE.baseMaxEngines && s.techs.prop_cluster1 == null) s.techs.prop_cluster1 = s.month;
      s.version = 2;
    }
    return s;
  };

  G.State = {
    newGame(company, seed) {
      const b = G.BALANCE;
      seed = (seed != null ? seed : (Date.now() ^ Math.floor(Math.random() * 1e9))) >>> 0;
      const s = {
        version: G.SAVE_VERSION,
        company, month: 0, seed, rng: seed,
        cash: b.startCash, debt: 0, rep: b.startRep,
        techs: {}, research: [],
        facilities: { pad: 1, factory: 1, lab: 1, control: 0 },
        blueprints: [], production: [], inventory: [], launches: [],
        contracts: [], sats: [], debris: {}, rivals: [], modifiers: [],
        stats: { launches: 0, successes: 0, partials: 0, failures: 0, ownSats: 0, contractsDone: 0, experiments: 0, orbitsReached: {}, lastRevenue: 0 },
        flightLog: [],
        milestones: {}, ledger: { month: 0, items: [] }, history: [], log: [],
        pendingEvent: null, eventLast: {}, grounded: {}, nextId: 1,
        victory: false, gameOver: false, ended: false,
      };
      G.ORBIT_ORDER.forEach(o => { s.debris[o] = 0; });

      const bp = {
        id: U.uid(s, 'bp'), name: '啟明一號', created: 0,
        stages: [
          { engine: 'eng_fb1', engineCount: 2, tank: 'tank_m', tankCount: 2 },
          { engine: 'eng_blue', engineCount: 1, tank: 'tank_s', tankCount: 1 },
        ],
        fairing: 'fair_s', avionics: 'avi_1', reusable: false, boosters: null,
        builds: 1, flights: 0, successes: 0,
      };
      s.blueprints.push(bp);
      s.inventory.push({ id: U.uid(s, 'rk'), bpId: bp.id });

      // 既有的其他業者衛星
      const preset = { LEO: 70, SSO: 25, MEO: 10, GEO: 20, LUNAR: 0 };
      G.ORBIT_ORDER.forEach(o => {
        for (let i = 0; i < preset[o]; i++) G.Orbit.addSat(s, 'client', 'client', o, RNG.int(s, 6, 100));
      });

      G.Rivals.init(s);
      G.Contracts.generate(s, 3);
      G.Log.add(s, `${company} 在艾瑟聯邦成立,手上有一枚「啟明一號」火箭。`, 'info');
      return s;
    },
  };
})(window.Game);
