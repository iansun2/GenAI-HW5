// 所有平衡參數集中於此,金額單位為百萬星幣 (₵M),質量單位為公噸
Game.BALANCE = {
  startCash: 80,
  startRep: 10,
  maxMonths: 120,
  startYear: 2030,

  // 火箭物理
  g0: 9.80665,
  minLiftoffTWR: 1.15,
  baseMaxStages: 2,
  baseMaxEngines: 5,       // 每級可並聯引擎數(科技可提升)
  baseMaxTanks: 8,
  boosterStep: 2,          // 助推器必須成對捆綁

  // 成本
  staffCost: 1.2,
  facilityUpkeep: 0.4,
  launchOpsCost: 1.5,
  stageIntegrationCost: 0.6,
  learningRate: 0.93,      // 同藍圖每多造一枚的成本倍率
  learningFloor: 0.7,

  // 可靠度
  engineClusterExp: 0.3,   // 多引擎可靠度懲罰指數
  separationRel: 0.995,
  heritagePerFlight: 0.04, // 每次成功飛行降低失敗率
  heritageMax: 0.3,
  weatherChance: 0.15,
  weatherPenalty: 0.04,

  // 發射結果
  partialShare: 0.35,
  partialRewardFactor: 0.5,
  partialLifeFactor: 0.6,
  successRep: 2,
  failRepLoss: 6,
  groundMonths: 2,

  // 可回收
  reusePropPenalty: 0.12,
  reuseRecoverChance: 0.75,
  reuseRefund: 0.55,

  // 合約
  contractsPerMonth: [2, 4],
  bidWindow: 2,
  bidMin: 0.5,
  bidMax: 1.5,
  advanceShare: 0.2,
  contractFailRep: 8,
  contractFailPenalty: 0.15,
  rivalBidChance: 0.7,

  // 財務
  loanBaseRate: 0.012,
  overdraftRate: 0.03,
  overdraftRepLoss: 0.3,
  creditBase: 60,
  creditPerRep: 3,
  restrictThreshold: 0.5,

  // 軌道
  crowdDecayK: 2.0,        // 每月壽命損耗 = 1 + K × 擁擠度²
  collisionThreshold: 0.7,
  collisionChanceK: 0.5,
  debrisDecay: 0.97,
  clientSatLife: [36, 120],

  // 事件與里程碑
  eventChance: 0.45,
  eventCooldown: 12,
  milestoneRep: 5,
  milestoneCash: 10,
  revenueGoal: 100,

  facilities: {
    pad:     { name: '發射台',       max: 4, cost: [0, 40, 90, 160],  desc: '每月可同時執行的發射數' },
    factory: { name: '總裝廠',       max: 4, cost: [0, 30, 70, 130],  desc: '可同時製造的火箭數' },
    lab:     { name: '研究所',       max: 4, cost: [0, 25, 60, 110],  desc: '可同時進行的研發項目數' },
    control: { name: '任務控制中心', max: 4, cost: [20, 45, 90, 160], desc: '每級降低發射失敗率 4%' },
  },

  grades: [[1500, 'S'], [900, 'A'], [450, 'B'], [0, 'C']],
};
