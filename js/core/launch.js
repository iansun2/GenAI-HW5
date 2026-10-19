// 發射排程與判定。任務種類:contract(客戶合約)、own(自有衛星)、experiment(純實驗)
(function (G) {
  const U = G.U, RNG = G.RNG, R = G.Rocket;
  const L = G.Launch = {};

  L.isPlanned = (s, rocketId) => s.launches.some(l => l.rocketId === rocketId);

  // 回傳任務的目標軌道、質量、說明與排程時須支付的費用
  L.missionInfo = function (s, mission) {
    if (mission.kind === 'contract') {
      const c = G.Contracts.find(s, mission.contractId);
      if (!c) return null;
      return { orbit: c.orbit, mass: c.mass, label: `${c.client}「${c.purpose}」`, satCost: 0 };
    }
    if (mission.kind === 'experiment') {
      const x = G.EXPERIMENTS[mission.exp];
      const orbit = x && (x.orbit || mission.orbit);
      if (!x || !G.ORBITS[orbit]) return null;
      return { orbit, mass: x.mass, label: `實驗:${x.name}`, satCost: x.cost, costCat: 'experiment' };
    }
    const t = G.SAT_TYPES[mission.satType];
    if (!t) return null;
    return { orbit: t.orbit, mass: U.round(t.mass * mission.count, 2), label: `自有 ${t.name} ×${mission.count}`, satCost: U.round(t.cost * G.Mods.satCost(s) * mission.count, 1), costCat: 'satellite' };
  };

  L.check = function (s, rocketId, mission) {
    const rk = s.inventory.find(r => r.id === rocketId);
    if (!rk) return '找不到火箭';
    if (L.isPlanned(s, rocketId)) return '此火箭已排程';
    if (s.launches.length >= s.facilities.pad) return '發射台本月已滿';
    const bp = R.find(s, rk.bpId);
    if ((s.grounded[bp.id] || 0) > s.month) return '此型號停飛調查中';
    const info = L.missionInfo(s, mission);
    if (!info) return '請選擇任務';
    const od = G.ORBITS[info.orbit];
    // 實驗飛行屬科研豁免,不需軌道認證
    if (mission.kind !== 'experiment' && od.tech && s.techs[od.tech] == null) return `尚未取得 ${od.id} 認證`;
    if (mission.kind === 'contract') {
      const c = G.Contracts.find(s, mission.contractId);
      if (c.status !== 'won') return '合約不在執行中';
      if (G.Contracts.isPlanned(s, c.id)) return '此合約已排程';
    } else if (mission.kind === 'experiment') {
      if (!G.Mods.unlocked(s, G.EXPERIMENTS[mission.exp])) return '尚未研發此實驗所需科技';
      if (info.satCost > 0 && G.Finance.restricted(s)) return '財務受限,無法採購實驗儀器';
    } else {
      const t = G.SAT_TYPES[mission.satType];
      if (!G.Mods.unlocked(s, t)) return '尚未研發此衛星';
      if (!(mission.count >= 1)) return '數量至少 1';
      if (G.Finance.restricted(s)) return '財務受限,無法採購衛星';
    }
    const cap = R.maxPayload(bp, info.orbit);
    if (info.mass > cap + 1e-9 || cap <= 0) return `超過運載能力(${od.id} 最多 ${U.ton(cap)})`;
    return null;
  };

  L.plan = function (s, rocketId, mission) {
    const err = L.check(s, rocketId, mission);
    if (err) return err;
    const rk = s.inventory.find(r => r.id === rocketId);
    const info = L.missionInfo(s, mission);
    if (info.satCost > 0) G.Finance.spend(s, info.satCost, info.costCat, info.label);
    s.launches.push({ id: U.uid(s, 'ln'), rocketId, bpId: rk.bpId, mission: Object.assign({}, mission), orbit: info.orbit, mass: info.mass, label: info.label, satCost: info.satCost, costCat: info.costCat });
    return null;
  };

  L.cancel = function (s, id) {
    const l = s.launches.find(x => x.id === id);
    if (!l) return;
    if (l.satCost > 0) G.Finance.add(s, l.satCost, l.costCat || 'satellite', `取消 ${l.label}`);
    s.launches = s.launches.filter(x => x !== l);
  };

  L.chance = (s, bp) => U.clamp(R.reliability(s, bp) + G.Mods.reliability(s), 0.3, 0.995);

  L.resolveAll = function (s, rep) {
    if (!s.launches.length) return;
    if (G.Mods.launchBan(s)) {
      s.launches.forEach(l => {
        if (l.mission.kind === 'contract') { const c = G.Contracts.find(s, l.mission.contractId); c.deadline = Math.max(c.deadline, s.month + 1); }
      });
      rep.notes.push('發射禁令生效,本月排程的發射全部延後至下個月。');
      return;
    }
    s.launches.forEach(l => rep.launches.push(L.resolveOne(s, l)));
    s.launches = [];
  };

  L.resolveOne = function (s, l) {
    const b = G.BALANCE, F = G.Finance, M = G.Mods;
    const bp = R.find(s, l.bpId);
    let p = L.chance(s, bp);
    const weather = RNG.chance(s, b.weatherChance * M.weather(s));
    if (weather) p = Math.max(0.3, p - b.weatherPenalty);
    const roll = RNG.next(s);
    const outcome = roll < p ? 'success' : roll < p + (1 - p) * b.partialShare ? 'partial' : 'fail';
    const n = bp.stages.length;
    const failStage = outcome === 'fail' ? RNG.int(s, 0, n - 1) : -1;
    const kind = l.mission.kind;

    s.inventory = s.inventory.filter(r => r.id !== l.rocketId);
    F.spend(s, b.launchOpsCost + M.launchCost(s), 'launch', `發射作業 ${bp.name}`);
    bp.flights = (bp.flights || 0) + 1;
    s.stats.launches++;

    const res = { bpName: bp.name, stages: n, boosters: R.hasBoosters(bp) ? bp.boosters.count : 0, kind, orbit: l.orbit, label: l.label, mass: l.mass, outcome, p, weather, failStage, reward: 0, grant: 0, insured: 0, recovered: false, refund: 0, reusable: !!bp.reusable };

    if (outcome === 'success') {
      bp.successes = (bp.successes || 0) + 1;
      s.stats.successes++;
      s.stats.orbitsReached[l.orbit] = s.stats.orbitsReached[l.orbit] || kind !== 'experiment';
      s.rep = Math.min(100, s.rep + b.successRep * M.repGain(s));
    } else if (outcome === 'partial') {
      s.stats.partials++;
    } else {
      s.stats.failures++;
      s.rep = Math.max(0, s.rep - b.failRepLoss);
      s.grounded[bp.id] = s.month + 1 + b.groundMonths;
      if (M.insurance(s) > 0) {
        res.insured = U.round(R.cost(s, bp) * M.insurance(s), 1);
        F.add(s, res.insured, 'insurance', `${bp.name} 失敗理賠`);
      }
    }

    const lifeF = outcome === 'partial' ? b.partialLifeFactor : 1;
    if (kind === 'contract') {
      const c = G.Contracts.find(s, l.mission.contractId);
      const rest = c.price * (1 - b.advanceShare);
      if (outcome === 'fail') {
        c.status = 'failed';
      } else {
        res.reward = U.round(outcome === 'success' ? rest : rest * b.partialRewardFactor, 1);
        F.add(s, res.reward, 'contract', `${l.label}尾款`);
        c.status = 'done';
        c.partial = outcome === 'partial';
        s.stats.contractsDone++;
        G.Orbit.addSat(s, 'client', 'client', l.orbit, RNG.int(s, b.clientSatLife[0], b.clientSatLife[1]) * lifeF);
      }
    } else if (kind === 'experiment') {
      if (outcome !== 'fail') {
        s.stats.experiments = (s.stats.experiments || 0) + 1;
        if (outcome === 'success') s.rep = Math.min(100, s.rep + M.repGain(s));
        if (M.expGrant(s) > 0) { res.grant = M.expGrant(s); F.add(s, res.grant, 'grant', `${l.label} 科研補助`); }
      }
    } else if (outcome !== 'fail') {
      const t = G.SAT_TYPES[l.mission.satType];
      for (let i = 0; i < l.mission.count; i++) G.Orbit.addSat(s, 'player', t.id, l.orbit, t.life * M.satLife(s) * lifeF);
      s.stats.ownSats += l.mission.count;
    }

    if (bp.reusable && (outcome !== 'fail' || failStage > 0) && RNG.chance(s, M.reuseChance(s))) {
      res.recovered = true;
      res.refund = U.round(R.stageCost(s, bp, 0) * M.reuseRefund(s), 1);
      F.add(s, res.refund, 'refund', `${bp.name} 第一級回收`);
    }

    s.flightLog.push(Object.assign({ m: s.month, bp: bp.id, kind, exp: l.mission.exp || null, orbit: l.orbit, outcome, recovered: res.recovered }, R.features(bp)));

    const word = { success: '成功', partial: '部分成功(軌道偏差)', fail: '失敗' }[outcome];
    G.Log.add(s, `「${bp.name}」發射 ${l.label} 至 ${l.orbit}:${word}${res.reward ? `,收入 ${U.money(res.reward)}` : ''}${res.recovered ? ',第一級成功回收' : ''}。`,
      outcome === 'success' ? 'good' : outcome === 'partial' ? 'warn' : 'bad');
    return res;
  };
})(window.Game);
