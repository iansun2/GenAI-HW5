(function (G) {
  const RS = G.Research = {};

  RS.cost = (s, t) => G.U.round(t.cost * G.Mods.researchCost(s), 1);
  RS.months = (s, t) => Math.max(1, Math.ceil(t.months * G.Mods.researchTime(s)));
  RS.inQueue = (s, id) => s.research.find(r => r.techId === id);

  // 飛行紀錄是否符合條件規格(失敗的飛行不算)
  RS.matches = function (f, spec) {
    if (f.outcome === 'fail') return false;
    if (spec.kind && f.kind !== spec.kind) return false;
    if (spec.exp && f.exp !== spec.exp) return false;
    if (spec.orbit && f.orbit !== spec.orbit) return false;
    if (spec.minStages && f.stages < spec.minStages) return false;
    if (spec.engine && !f.engines.includes(spec.engine)) return false;
    if (spec.tank && !f.tanks.some(t => spec.tank.includes(t))) return false;
    if (spec.minEngines && f.maxEng < spec.minEngines) return false;
    if (spec.boosters && f.boosters < spec.boosters) return false;
    if (spec.recovered && !f.recovered) return false;
    return true;
  };

  RS.needStatus = function (s, t) {
    return t.needs.map(n => {
      if (n.type === 'rep') return { label: n.label, have: Math.floor(s.rep), need: n.rep, ok: s.rep >= n.rep };
      const have = s.flightLog.filter(f => RS.matches(f, n.spec)).length;
      return { label: n.label, have: Math.min(have, n.count), need: n.count, ok: have >= n.count };
    });
  };
  RS.needsMet = (s, t) => RS.needStatus(s, t).every(x => x.ok);

  RS.status = function (s, id) {
    if (s.techs[id] != null) return 'done';
    if (RS.inQueue(s, id)) return 'active';
    const t = G.TECH_MAP[id];
    if (!t.req.every(r => s.techs[r] != null)) return 'locked';
    return RS.needsMet(s, t) ? 'avail' : 'needs';
  };

  RS.canStart = function (s, id) {
    const st = RS.status(s, id);
    if (st === 'done') return '已完成';
    if (st === 'active') return '研發中';
    if (st === 'locked') return '前置科技尚未完成';
    if (st === 'needs') return '尚未滿足研發條件';
    if (s.research.length >= s.facilities.lab) return '研究所沒有空位';
    if (G.Finance.restricted(s)) return '財務受限,無法投資';
    return null;
  };

  RS.start = function (s, id) {
    const err = RS.canStart(s, id);
    if (err) return err;
    const t = G.TECH_MAP[id];
    const cost = RS.cost(s, t), months = RS.months(s, t);
    G.Finance.spend(s, cost, 'research', `研發 ${t.name}`);
    s.research.push({ techId: id, start: s.month, doneMonth: s.month + months });
    G.Log.add(s, `開始研發「${t.name}」(${G.U.money(cost)},${months} 個月)。`, 'tech');
    return null;
  };

  RS.process = function (s, rep) {
    s.research = s.research.filter(r => {
      if (r.doneMonth <= s.month + 1) {
        s.techs[r.techId] = s.month;
        rep.research.push(r.techId);
        G.Log.add(s, `研發完成:「${G.TECH_MAP[r.techId].name}」。`, 'tech');
        return false;
      }
      return true;
    });
  };

  // 回傳此科技解鎖的項目文字
  RS.unlocks = function (id) {
    const out = [];
    G.COMPONENT_LIST.filter(c => c.tech === id).forEach(c => out.push(`組件:${c.name}`));
    Object.values(G.SAT_TYPES).filter(t => t.tech === id).forEach(t => out.push(`衛星:${t.name}`));
    Object.values(G.ORBITS).filter(o => o.tech === id).forEach(o => out.push(`軌道:${o.name} ${o.id}`));
    Object.values(G.EXPERIMENTS).filter(x => x.tech === id).forEach(x => out.push(`實驗:${x.name}`));
    if (id === 'str_reuse') out.push('可回收第一級');
    return out;
  };

  const EFFECT_TEXT = {
    failReduce: v => `發射失敗率 -${Math.round(v * 100)}%`,
    buildTime: v => `製造工期 ${v} 個月`,
    componentCost: v => `零件成本 ${Math.round(v * 100)}%`,
    engineCost: v => `引擎成本 ${Math.round(v * 100)}%`,
    researchTime: v => `研發時間 ${Math.round(v * 100)}%`,
    satIncome: v => `衛星收入 +${Math.round(v * 100)}%`,
    satLife: v => `衛星壽命 +${Math.round(v * 100)}%`,
    crowdReduce: v => `擁擠造成的壽命損耗 -${Math.round(v * 100)}%`,
    repGain: v => `聲望獲得 +${Math.round(v * 100)}%`,
    interest: v => `利率 ${Math.round(v * 100)}%`,
    credit: v => `信用額度 +${Math.round(v * 100)}%`,
    weather: v => `惡劣天候機率 ${Math.round(v * 100)}%`,
    bidBonus: () => '競標評分優勢',
    maxStages: v => `火箭最大級數 +${v}`,
    politicalShield: v => `負面政治事件持續時間 -${Math.round(v * 100)}%`,
    maxEngines: v => `每級可並聯引擎 +${v} 具`,
    maxTanks: v => `每級可用貯箱 +${v} 個`,
    maxBoosters: v => `可捆綁助推器 +${v} 具`,
    satCost: v => `自有衛星造價 ${Math.round(v * 100)}%`,
    market: v => `自有衛星的市場規模 +${Math.round(v * 100)}%`,
    heritageMax: v => `飛行紀錄可靠度加成上限 +${Math.round(v * 100)}%`,
    reuseRefund: v => `回收退款 +${Math.round(v * 100)}%`,
    reuseChance: v => `回收成功率 +${Math.round(v * 100)}%`,
    expGrant: v => `實驗成功獲得補助 ₵${v}M`,
    insurance: v => `發射失敗理賠火箭造價 ${Math.round(v * 100)}%`,
  };
  RS.effectText = t => Object.entries(t.effects).map(([k, v]) => (EFFECT_TEXT[k] ? EFFECT_TEXT[k](v) : k));
})(window.Game);
