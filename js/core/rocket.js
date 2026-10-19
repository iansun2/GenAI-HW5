// 火箭藍圖計算:Δv(Tsiolkovsky)、推重比、運載量、成本、可靠度
(function (G) {
  const C = id => G.COMPONENTS[id];
  const R = G.Rocket = {};

  // 回傳各級 Δv / 推重比;stages[0] 為第一級(最底部)
  R.compute = function (bp, payload) {
    const b = G.BALANCE, g0 = b.g0;
    const res = { stages: [], errors: [], warnings: [], dv: 0, totalMass: 0, liftoffTWR: 0 };
    if (!bp.stages || !bp.stages.length) { res.errors.push('至少需要一級'); return res; }
    const fair = C(bp.fairing), avi = C(bp.avionics);
    if (!fair || !avi) { res.errors.push('缺少整流罩或航電'); return res; }

    let above = payload + fair.mass + avi.mass;
    const n = bp.stages.length;
    for (let i = n - 1; i >= 0; i--) {
      const st = bp.stages[i], e = C(st.engine), t = C(st.tank);
      let prop = t.prop * st.tankCount;
      if (i === 0 && bp.reusable) prop *= 1 - b.reusePropPenalty;
      const dry = t.dry * st.tankCount + e.mass * st.engineCount;
      const m0 = above + prop + dry, mf = above + dry;
      const isp = i === 0 ? (e.ispSL + e.ispVac) / 2 : e.ispVac;
      const thrust = (i === 0 ? e.thrustSL : e.thrustVac) * st.engineCount;
      const twr = thrust / (m0 * g0); // kN ÷ (t × m/s²)
      let dv = isp * g0 * Math.log(m0 / mf);
      if (i > 0 && twr < 0.4) dv *= 0.75 + 0.625 * twr; // 低推重比的重力損失
      res.stages[i] = { dv, twr, m0, mf, prop, dry, isp, thrust };
      if (i === 0 && bp.boosters && bp.boosters.count > 0) {
        Object.assign(res.stages[0], R.boostedStage(bp, e, st.engineCount, prop, dry, above));
      }
      above = res.stages[i].m0;
    }
    res.totalMass = above;
    res.dv = res.stages.reduce((a, x) => a + x.dv, 0) / 1000;
    res.liftoffTWR = res.stages[0].twr;
    if (res.liftoffTWR < b.minLiftoffTWR) res.errors.push(`起飛推重比 ${res.liftoffTWR.toFixed(2)} 不足(需 ≥ ${b.minLiftoffTWR})`);
    if (payload > fair.maxPayload + 1e-9) res.errors.push(`酬載超過整流罩上限 ${fair.maxPayload} t`);
    for (let i = 1; i < n; i++) if (res.stages[i].twr < 0.25) res.warnings.push(`第 ${i + 1} 級推重比過低,重力損失大`);
    return res;
  };

  // 並聯分級:助推器與芯級同時點火。A 段兩者共燃至助推器耗盡(以質量流率分配芯級耗用),拋棄助推器後 B 段由芯級燒完剩餘推進劑
  R.boostedStage = function (bp, e, count, coreProp, coreDry, above) {
    const g0 = G.BALANCE.g0;
    const sb = C(bp.boosters.type), nb = bp.boosters.count;
    const ispC = (e.ispSL + e.ispVac) / 2, ispB = (sb.ispSL + sb.ispVac) / 2;
    const thrC = (e.thrustSL + e.thrustVac) / 2 * count, thrB = (sb.thrustSL + sb.thrustVac) / 2 * nb;
    const mdotC = ispC > 0 ? thrC / (ispC * g0) : 0, mdotB = thrB / (ispB * g0);
    const propB = sb.prop * nb, dryB = sb.dry * nb;
    const burnB = propB / mdotB;
    const coreUsed = Math.min(coreProp, mdotC * burnB);
    const m0 = above + coreProp + coreDry + propB + dryB;
    const m1 = m0 - propB - coreUsed;
    const ispA = (thrC + thrB) / (g0 * (mdotC + mdotB));
    const dvA = ispA * g0 * Math.log(m0 / m1);
    const m2 = m1 - dryB, m3 = m2 - (coreProp - coreUsed);
    const dvB = ispC > 0 ? ispC * g0 * Math.log(m2 / m3) : 0;
    const thrust = e.thrustSL * count + sb.thrustSL * nb;
    return { dv: dvA + dvB, dvBoost: dvA, twr: thrust / (m0 * g0), m0, mf: m3, thrust, isp: ispA, prop: coreProp + propB, dry: coreDry + dryB };
  };

  R.maxPayload = function (bp, orbitId) {
    const need = G.ORBITS[orbitId].dv;
    const limit = C(bp.fairing).maxPayload;
    const ok = p => { const r = R.compute(bp, p); return r.errors.length === 0 && r.dv >= need; };
    if (!ok(0)) return 0;
    if (ok(limit)) return limit;
    let lo = 0, hi = limit;
    for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
    return Math.floor(lo * 100) / 100;
  };

  R.capabilities = function (bp) {
    const out = {};
    G.ORBIT_ORDER.forEach(o => { out[o] = R.maxPayload(bp, o); });
    return out;
  };

  // 與遊戲狀態相關的檢查(科技解鎖、級數上限)
  R.validate = function (s, bp) {
    const M = G.Mods, errs = [];
    if (!bp.stages.length) return ['至少需要一級'];
    if (bp.stages.length > M.maxStages(s)) errs.push(`超過最大級數 ${M.maxStages(s)}`);
    const maxE = M.maxEngines(s), maxT = M.maxTanks(s);
    const parts = [bp.fairing, bp.avionics];
    bp.stages.forEach((st, i) => {
      parts.push(st.engine, st.tank);
      if (st.engineCount < 1 || st.engineCount > maxE) errs.push(`第 ${i + 1} 級引擎數量需為 1–${maxE}(研發「引擎叢集」類科技可增加)`);
      if (st.tankCount < 1 || st.tankCount > maxT) errs.push(`第 ${i + 1} 級貯箱數量需為 1–${maxT}`);
    });
    if (bp.boosters && bp.boosters.count > 0) {
      parts.push(bp.boosters.type);
      if (bp.boosters.count > M.maxBoosters(s)) errs.push(`助推器最多 ${M.maxBoosters(s)} 具`);
    }
    parts.forEach(id => { const c = C(id); if (!c) errs.push('未知組件'); else if (!G.Mods.unlocked(s, c)) errs.push(`「${c.name}」尚未研發`); });
    if (bp.reusable && !G.Mods.reusable(s)) errs.push('尚未研發一級回收技術');
    return errs.concat(R.compute(bp, 0).errors);
  };

  R.stageCost = function (s, bp, i) {
    const st = bp.stages[i], e = C(st.engine), t = C(st.tank);
    return (e.cost * st.engineCount * G.Mods.engineCost(s) + t.cost * st.tankCount) * G.Mods.componentCost(s);
  };

  R.cost = function (s, bp) {
    let c = 0;
    bp.stages.forEach((_, i) => { c += R.stageCost(s, bp, i); });
    c += (C(bp.fairing).cost + C(bp.avionics).cost) * G.Mods.componentCost(s);
    if (R.hasBoosters(bp)) c += C(bp.boosters.type).cost * bp.boosters.count * G.Mods.componentCost(s);
    c += bp.stages.length * G.BALANCE.stageIntegrationCost;
    const learn = Math.max(G.BALANCE.learningFloor, Math.pow(G.BALANCE.learningRate, bp.builds || 0));
    return G.U.round(c * learn, 1);
  };

  // 不含天候與事件修正的成功率
  R.reliability = function (s, bp) {
    const b = G.BALANCE;
    let p = 1;
    bp.stages.forEach(st => {
      p *= Math.pow(C(st.engine).rel, 1 + b.engineClusterExp * (st.engineCount - 1));
      p *= Math.pow(C(st.tank).rel, st.tankCount);
    });
    p *= C(bp.avionics).rel;
    p *= Math.pow(b.separationRel, bp.stages.length - 1);
    if (R.hasBoosters(bp)) p *= Math.pow(C(bp.boosters.type).rel, bp.boosters.count) * b.separationRel;
    let fail = 1 - p;
    fail *= 1 - G.Mods.failReduce(s);
    fail *= 1 - Math.min(G.Mods.heritageMax(s), (bp.successes || 0) * b.heritagePerFlight);
    return 1 - fail;
  };

  R.hasBoosters = bp => !!(bp.boosters && bp.boosters.count > 0);
  R.maxEngineCount = bp => Math.max(...bp.stages.map(st => st.engineCount));

  // 一次飛行的規格特徵,寫入 flightLog 供科技條件比對
  R.features = bp => ({
    stages: bp.stages.length,
    engines: [...new Set(bp.stages.map(st => st.engine))],
    tanks: [...new Set(bp.stages.map(st => st.tank))],
    maxEng: R.maxEngineCount(bp),
    boosters: R.hasBoosters(bp) ? bp.boosters.count : 0,
    reusable: !!bp.reusable,
  });

  R.buildMonths = (s, bp) => Math.max(1, bp.stages.length + G.Mods.buildTime(s));

  R.summary = function (bp) {
    return bp.stages.map((st, i) => `${i + 1}級 ${C(st.engine).name}×${st.engineCount}`).join(' / ') +
      (R.hasBoosters(bp) ? ` + ${C(bp.boosters.type).name}×${bp.boosters.count}` : '');
  };

  R.find = (s, id) => s.blueprints.find(b => b.id === id);
})(window.Game);
