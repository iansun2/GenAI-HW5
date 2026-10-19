// 科技樹。effects 的鍵值由 core/mods.js 解讀;解鎖的組件/衛星/軌道/實驗由其 tech 欄位反查
// needs:除了資金外的研發條件。flights 型依 s.flightLog 中「非失敗」的飛行計數,spec 欄位見 core/research.js
(function (G) {
  const fl = (count, label, spec) => ({ type: 'flights', count, label, spec: spec || {} });
  const ex = (exp, count) => ({ type: 'flights', count, label: `完成「${G.EXPERIMENTS[exp].name}」實驗 ${count} 次`, spec: { exp } });
  const rep = n => ({ type: 'rep', rep: n, label: `聲望 ≥ ${n}` });

  G.TECH_BRANCHES = [
    { id: 'prop', name: '推進' },
    { id: 'struct', name: '結構材料' },
    { id: 'sat', name: '電子與衛星' },
    { id: 'fac', name: '地面設施與製造' },
    { id: 'ops', name: '營運與金融' },
  ];

  G.TECHS = [
    // ── 推進 ──
    { id: 'prop_turbo', branch: 'prop', name: '渦輪泵強化', cost: 18, months: 3, req: [], desc: '提升燃氣產生器循環效率。' },
    { id: 'prop_cluster1', branch: 'prop', name: '引擎叢集控制', cost: 20, months: 3, req: [], effects: { maxEngines: 4 },
      needs: [fl(2, '以單級 ≥ 3 具引擎的火箭成功發射 2 次', { minEngines: 3 })], desc: '同步控制更多並聯引擎的點火與關機。' },
    { id: 'prop_srb1', branch: 'prop', name: '固體助推器', cost: 25, months: 3, req: [], effects: { maxBoosters: 2 }, desc: '可在第一級兩側捆綁固體助推器。' },
    { id: 'prop_vac2', branch: 'prop', name: '高膨脹比噴嘴', cost: 22, months: 3, req: ['prop_turbo'], desc: '提高上面級真空比衝。' },
    { id: 'prop_heavy', branch: 'prop', name: '重型燃燒室', cost: 40, months: 4, req: ['prop_turbo'],
      needs: [fl(3, '以「火鳥-2」成功發射 3 次', { engine: 'eng_fb2' })], desc: '大推力主引擎的燃燒穩定性研究。' },
    { id: 'prop_srb2', branch: 'prop', name: '四助推器構型', cost: 45, months: 4, req: ['prop_srb1', 'str_tank_l'], effects: { maxBoosters: 2 },
      needs: [fl(2, '以捆綁助推器的火箭成功發射 2 次', { boosters: 1 })], desc: '最多捆綁 4 具助推器,並解鎖大型固推。' },
    { id: 'prop_cluster2', branch: 'prop', name: '大規模並聯點火', cost: 50, months: 4, req: ['prop_cluster1', 'sat_avionics2'], effects: { maxEngines: 6 },
      needs: [fl(2, '以單級 ≥ 9 具引擎的火箭成功發射 2 次', { minEngines: 9 })], desc: '單級最多 15 具引擎。' },
    { id: 'prop_hydro', branch: 'prop', name: '液氫推進', cost: 60, months: 5, req: ['prop_vac2'],
      needs: [fl(2, '以「藍焰-V2」成功發射 2 次', { engine: 'eng_blue2' })], desc: '掌握深冷液氫的儲存與點火。' },
    { id: 'prop_srb3', branch: 'prop', name: '六助推器構型', cost: 70, months: 4, req: ['prop_srb2'], effects: { maxBoosters: 2 },
      needs: [fl(2, '以 ≥ 4 具助推器的火箭成功發射 2 次', { boosters: 4 })], desc: '最多捆綁 6 具助推器。' },
    { id: 'prop_methane', branch: 'prop', name: '全流量甲烷循環', cost: 90, months: 6, req: ['prop_heavy', 'prop_hydro'],
      needs: [fl(3, '以「赤鯨」成功發射 3 次', { engine: 'eng_whale' })], desc: '次世代高效甲烷引擎。' },
    { id: 'prop_srb_comp', branch: 'prop', name: '複材殼體固推', cost: 60, months: 4, req: ['prop_srb2', 'str_composite'], desc: '更輕、比衝更高的固體助推器。' },
    { id: 'prop_nuclear', branch: 'prop', name: '核熱推進', cost: 150, months: 8, req: ['prop_hydro', 'str_composite'],
      needs: [ex('deepspace', 1)], desc: '以核反應爐加熱氫工質。' },
    { id: 'prop_aerospike', branch: 'prop', name: '線型塞式噴嘴', cost: 70, months: 5, req: ['prop_methane'],
      needs: [ex('atmos', 2)], desc: '依高層大氣數據設計的高度補償噴嘴。' },
    { id: 'prop_meth2', branch: 'prop', name: '渡鴉-M2 改良', cost: 80, months: 5, req: ['prop_methane'],
      needs: [fl(4, '以「渡鴉-M」成功發射 4 次', { engine: 'eng_meth' })], desc: '分析飛行數據改良甲烷引擎。' },
    { id: 'prop_cluster3', branch: 'prop', name: '超大型引擎陣列', cost: 110, months: 6, req: ['prop_cluster2', 'prop_methane'], effects: { maxEngines: 9 },
      needs: [fl(2, '以單級 ≥ 15 具引擎的火箭成功發射 2 次', { minEngines: 15 })], desc: '單級最多 24 具引擎。' },

    // ── 結構材料 ──
    { id: 'str_tank_l', branch: 'struct', name: '大型貯箱焊接', cost: 20, months: 3, req: [], desc: '攪拌摩擦焊製造大直徑貯箱。' },
    { id: 'str_fairing_m', branch: 'struct', name: '中型整流罩', cost: 15, months: 2, req: [], desc: '容納更大的酬載。' },
    { id: 'str_stage3', branch: 'struct', name: '三級火箭整合', cost: 30, months: 3, req: ['str_fairing_m'], effects: { maxStages: 1 },
      needs: [fl(3, '累積成功發射 3 次')], desc: '允許設計三級火箭。' },
    { id: 'str_al_li', branch: 'struct', name: '鋁鋰合金', cost: 35, months: 4, req: ['str_tank_l'], desc: '更輕的貯箱材料。' },
    { id: 'str_assembly', branch: 'struct', name: '垂直總裝大樓', cost: 35, months: 3, req: ['str_tank_l'], effects: { maxTanks: 4 }, desc: '每級最多 12 個貯箱。' },
    { id: 'str_fairing_l', branch: 'struct', name: '大型整流罩', cost: 35, months: 3, req: ['str_fairing_m', 'str_tank_l'], desc: '重型酬載整流罩。' },
    { id: 'str_composite', branch: 'struct', name: '碳纖複材貯箱', cost: 70, months: 5, req: ['str_al_li'],
      needs: [fl(2, '以鋁鋰貯箱的火箭成功發射 2 次', { tank: ['tank_m_al', 'tank_l_al'] })], desc: '極輕的複合材料貯箱。' },
    { id: 'str_stage4', branch: 'struct', name: '四級火箭整合', cost: 60, months: 4, req: ['str_stage3'], effects: { maxStages: 1 },
      needs: [fl(2, '以三級以上火箭成功發射 2 次', { minStages: 3 })], desc: '允許設計四級火箭,適合深空任務。' },
    { id: 'str_reuse', branch: 'struct', name: '一級回收著陸', cost: 110, months: 6, req: ['str_composite', 'prop_heavy'],
      needs: [ex('reentry', 2)], desc: '第一級可垂直著陸回收,節省成本但損失部分推進劑。' },
    { id: 'str_steel', branch: 'struct', name: '不鏽鋼巨型貯箱', cost: 65, months: 4, req: ['str_assembly', 'prop_methane'], desc: '以不鏽鋼大量生產超大貯箱。' },
    { id: 'str_fairing_xl', branch: 'struct', name: '超大型整流罩', cost: 60, months: 4, req: ['str_fairing_l', 'str_composite'], desc: '酬載上限 50 t。' },
    { id: 'str_reuse2', branch: 'struct', name: '快速翻修', cost: 90, months: 5, req: ['str_reuse'], effects: { reuseRefund: 0.2, reuseChance: 0.15 },
      needs: [fl(3, '成功回收第一級 3 次', { recovered: true })], desc: '回收的第一級只需簡單檢修即可再飛。' },

    // ── 電子與衛星 ──
    { id: 'sat_smallcom', branch: 'sat', name: '立方衛星平台', cost: 12, months: 2, req: [], desc: '開始經營自有小衛星。' },
    { id: 'sat_avionics2', branch: 'sat', name: '冗餘導航電腦', cost: 20, months: 3, req: [], desc: '更可靠的火箭航電。' },
    { id: 'sat_telemetry', branch: 'sat', name: '遙測數據鏈', cost: 15, months: 2, req: [], effects: { failReduce: 0.05 },
      needs: [fl(3, '累積成功發射 3 次')], desc: '從每次飛行取得完整遙測數據。' },
    { id: 'sat_sciprobe', branch: 'sat', name: '科學探測儀器', cost: 18, months: 2, req: [],
      needs: [ex('microg', 1)], desc: '解鎖輻射帶、同步軌道與深空實驗。' },
    { id: 'sat_heatshield', branch: 'sat', name: '熱防護材料', cost: 25, months: 3, req: [],
      needs: [ex('atmos', 1)], desc: '解鎖再入回收試驗。' },
    { id: 'sat_eo', branch: 'sat', name: '光學遙測酬載', cost: 28, months: 3, req: ['sat_smallcom'], desc: '高解析地球觀測衛星。' },
    { id: 'sat_broadband', branch: 'sat', name: '寬頻星座', cost: 55, months: 4, req: ['sat_smallcom'],
      needs: [fl(2, '自有衛星任務成功發射 2 次', { kind: 'own' })], desc: '大規模低軌通訊星座。' },
    { id: 'sat_avionics3', branch: 'sat', name: 'AI 飛控', cost: 70, months: 5, req: ['sat_avionics2', 'sat_telemetry'], effects: { failReduce: 0.08 },
      needs: [fl(8, '累積成功發射 8 次')], desc: '即時故障重構飛控系統。' },
    { id: 'sat_bus2', branch: 'sat', name: '標準化衛星平台', cost: 40, months: 3, req: ['sat_eo'], effects: { satCost: -0.15 },
      needs: [fl(3, '自有衛星任務成功發射 3 次', { kind: 'own' })], desc: '共用衛星平台,降低自有衛星造價。' },
    { id: 'sat_life', branch: 'sat', name: '電推進軌道維持', cost: 45, months: 4, req: ['sat_broadband'], effects: { satLife: 0.25 }, desc: '霍爾推進器延長衛星壽命。' },
    { id: 'sat_hts', branch: 'sat', name: '高通量寬頻', cost: 60, months: 4, req: ['sat_broadband'], effects: { market: 0.5 },
      needs: [fl(3, '以自有衛星任務成功發射至 LEO 3 次', { kind: 'own', orbit: 'LEO' })], desc: '提升單顆容量,自有衛星的市場規模 +50%。' },
    { id: 'sat_nav', branch: 'sat', name: '原子鐘導航', cost: 50, months: 4, req: ['sat_eo', 'ops_cert_meo'], desc: '中軌道導航衛星。' },
    { id: 'sat_avoid', branch: 'sat', name: '自主碰撞規避', cost: 60, months: 4, req: ['sat_life'], effects: { crowdReduce: 0.45 }, desc: '降低擁擠軌道的避碰耗損。' },
    { id: 'sat_fuel', branch: 'sat', name: '軌道機動燃料擴充', cost: 40, months: 3, req: ['sat_life'], effects: { crowdReduce: 0.15 }, desc: '更多機動燃料應付避碰。' },
    { id: 'sat_geo', branch: 'sat', name: '大型同步通訊平台', cost: 80, months: 5, req: ['sat_nav', 'ops_cert_geo'], desc: '高價值同步軌道衛星。' },
    { id: 'sat_laser', branch: 'sat', name: '星間雷射鏈路', cost: 85, months: 5, req: ['sat_hts', 'sat_avoid'], effects: { satIncome: 0.12 }, desc: '衛星間直接傳輸,服務品質大增。' },
    { id: 'sat_relay', branch: 'sat', name: '深空中繼', cost: 90, months: 5, req: ['sat_geo', 'ops_cert_lunar'],
      needs: [ex('deepspace', 1)], desc: '月球通訊中繼衛星。' },

    // ── 地面設施與製造 ──
    { id: 'fac_qa', branch: 'fac', name: '品管系統', cost: 18, months: 2, req: [], effects: { failReduce: 0.1 }, desc: '建立 ISO 等級品保流程。' },
    { id: 'fac_lean', branch: 'fac', name: '精實製造', cost: 25, months: 3, req: [], effects: { buildTime: -1 }, desc: '縮短總裝工期。' },
    { id: 'fac_weather', branch: 'fac', name: '氣象預報整合', cost: 15, months: 2, req: [], effects: { weather: -0.6 }, desc: '更精準掌握發射窗口天候。' },
    { id: 'fac_windtunnel', branch: 'fac', name: '風洞實驗室', cost: 30, months: 3, req: [], effects: { failReduce: 0.05 },
      needs: [ex('atmos', 2)], desc: '以實測大氣數據校正氣動模型。' },
    { id: 'fac_qa2', branch: 'fac', name: '數位孿生測試', cost: 55, months: 4, req: ['fac_qa'], effects: { failReduce: 0.15 },
      needs: [fl(5, '累積成功發射 5 次')], desc: '模擬上萬次飛行找出缺陷。' },
    { id: 'fac_teststand', branch: 'fac', name: '全尺寸試車台', cost: 45, months: 4, req: ['fac_qa'], effects: { heritageMax: 0.15 },
      needs: [ex('test', 2)], desc: '飛行紀錄對可靠度的提升上限 +15%。' },
    { id: 'fac_auto', branch: 'fac', name: '自動化產線', cost: 60, months: 5, req: ['fac_lean'], effects: { componentCost: -0.15 }, desc: '機器人焊接與組裝。' },
    { id: 'fac_window', branch: 'fac', name: '發射窗口最佳化', cost: 30, months: 3, req: ['fac_weather'], effects: { weather: -0.3 },
      needs: [fl(6, '累積成功發射 6 次')], desc: '以歷次發射數據最佳化窗口選擇。' },
    { id: 'fac_print', branch: 'fac', name: '3D 列印引擎', cost: 80, months: 5, req: ['fac_auto'], effects: { engineCost: -0.2, buildTime: -1 }, desc: '積層製造引擎零件。' },

    // ── 營運與金融 ──
    { id: 'ops_pr', branch: 'ops', name: '公關部門', cost: 12, months: 2, req: [], effects: { repGain: 0.5 }, desc: '經營品牌形象。' },
    { id: 'ops_finance', branch: 'ops', name: '財務工程', cost: 20, months: 3, req: [], effects: { interest: -0.25, credit: 0.3 }, desc: '更好的融資條件。' },
    { id: 'ops_research', branch: 'ops', name: '研發管理制度', cost: 30, months: 3, req: [], effects: { researchTime: -0.2 }, desc: '縮短研發時程。' },
    { id: 'ops_cert_meo', branch: 'ops', name: '中軌道認證', cost: 30, months: 3, req: [],
      needs: [ex('radiation', 1)], desc: '取得 MEO 發射執照。' },
    { id: 'ops_grants', branch: 'ops', name: '科研補助計畫', cost: 15, months: 2, req: ['ops_pr'], effects: { expGrant: 3 },
      needs: [fl(2, '完成任意實驗任務 2 次', { kind: 'experiment' })], desc: '每次實驗成功可獲得政府科研補助。' },
    { id: 'ops_insurance', branch: 'ops', name: '發射保險方案', cost: 30, months: 3, req: ['ops_finance'], effects: { insurance: 0.3 }, desc: '發射失敗時理賠火箭造價的 30%。' },
    { id: 'ops_cert_geo', branch: 'ops', name: '同步軌道認證', cost: 50, months: 4, req: ['ops_cert_meo'],
      needs: [ex('geo_test', 1)], desc: '取得 GEO 發射執照。' },
    { id: 'ops_market', branch: 'ops', name: '行銷通路', cost: 40, months: 3, req: ['ops_pr'], effects: { satIncome: 0.15 }, desc: '擴大衛星服務客群。' },
    { id: 'ops_lobby', branch: 'ops', name: '政府關係', cost: 40, months: 4, req: ['ops_pr'], effects: { politicalShield: 0.5, bidBonus: 0.04 }, desc: '降低政治風險,競標更有利。' },
    { id: 'ops_cert_lunar', branch: 'ops', name: '月球轉移認證', cost: 90, months: 6, req: ['ops_cert_geo'],
      needs: [ex('deepspace', 1)], desc: '取得月球任務執照。' },
    { id: 'ops_intl', branch: 'ops', name: '國際合作聯盟', cost: 60, months: 4, req: ['ops_lobby'], effects: { bidBonus: 0.03, repGain: 0.25 },
      needs: [rep(50)], desc: '加入國際太空聯盟,競標與聲望更有利。' },
  ];

  G.TECH_MAP = {};
  G.TECHS.forEach(t => { t.effects = t.effects || {}; t.needs = t.needs || []; G.TECH_MAP[t.id] = t; });
})(window.Game);
