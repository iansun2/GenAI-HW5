// 加總科技效果與事件修正值。事件修正存在 s.modifiers:{kind, value, until, label}
(function (G) {
  const U = G.U;
  const M = G.Mods = {};

  function techSum(s, key) {
    let v = 0;
    for (const id in s.techs) {
      const t = G.TECH_MAP[id];
      if (t && t.effects[key]) v += t.effects[key];
    }
    return v;
  }
  const prod = (s, kind) => s.modifiers.reduce((v, m) => (m.kind === kind ? v * m.value : v), 1);
  const sum = (s, kind) => s.modifiers.reduce((v, m) => (m.kind === kind ? v + m.value : v), 0);

  M.techSum = techSum;
  M.unlocked = (s, obj) => !obj.tech || s.techs[obj.tech] != null;

  M.componentCost = s => Math.max(0.3, 1 + techSum(s, 'componentCost')) * prod(s, 'componentCost');
  M.engineCost = s => 1 + techSum(s, 'engineCost');
  M.failReduce = s => U.clamp(techSum(s, 'failReduce') + s.facilities.control * 0.04, 0, 0.7);
  M.buildTime = s => techSum(s, 'buildTime') + sum(s, 'buildTime');
  M.researchTime = s => Math.max(0.3, 1 + techSum(s, 'researchTime')) * prod(s, 'researchTime');
  M.researchCost = s => prod(s, 'researchCost');
  M.satIncome = s => (1 + techSum(s, 'satIncome')) * prod(s, 'satIncome');
  M.satLife = s => 1 + techSum(s, 'satLife');
  M.crowdReduce = s => U.clamp(techSum(s, 'crowdReduce'), 0, 0.8);
  M.repGain = s => 1 + techSum(s, 'repGain');
  M.interestMult = s => Math.max(0.2, 1 + techSum(s, 'interest'));
  M.interestAdd = s => sum(s, 'interest');
  M.credit = s => 1 + techSum(s, 'credit');
  M.reliability = s => sum(s, 'reliability');
  M.launchCost = s => sum(s, 'launchCost');
  M.weather = s => Math.max(0, 1 + techSum(s, 'weather')) * prod(s, 'weather');
  M.contractPrice = s => prod(s, 'contractPrice');
  M.rivalBid = s => prod(s, 'rivalBid');
  M.bidBonus = s => techSum(s, 'bidBonus');
  M.maxStages = s => G.BALANCE.baseMaxStages + techSum(s, 'maxStages');
  M.maxEngines = s => G.BALANCE.baseMaxEngines + techSum(s, 'maxEngines');
  M.maxTanks = s => G.BALANCE.baseMaxTanks + techSum(s, 'maxTanks');
  M.maxBoosters = s => techSum(s, 'maxBoosters');
  M.satCost = s => Math.max(0.3, 1 + techSum(s, 'satCost'));
  M.market = s => 1 + techSum(s, 'market');
  M.heritageMax = s => G.BALANCE.heritageMax + techSum(s, 'heritageMax');
  M.reuseRefund = s => G.BALANCE.reuseRefund + techSum(s, 'reuseRefund');
  M.reuseChance = s => Math.min(0.97, G.BALANCE.reuseRecoverChance + techSum(s, 'reuseChance'));
  M.expGrant = s => techSum(s, 'expGrant');
  M.insurance = s => techSum(s, 'insurance');
  M.shield = s => techSum(s, 'politicalShield');
  M.staff = s => sum(s, 'staff');
  M.launchBan = s => s.modifiers.some(m => m.kind === 'launchBan');
  M.reusable = s => s.techs.str_reuse != null;
})(window.Game);
