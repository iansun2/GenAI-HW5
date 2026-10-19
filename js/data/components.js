// 火箭組件。推力 kN、比衝 s、質量 t、成本 ₵M。tech 為 null 表示初始即可用
(function (G) {
  const list = [
    // 引擎
    { id: 'eng_fb1', type: 'engine', name: '火鳥-1', mass: 0.6, thrustSL: 400, thrustVac: 450, ispSL: 270, ispVac: 300, cost: 2.6, rel: 0.97, tech: null, desc: '創業時期的煤油引擎,便宜但效率普通。' },
    { id: 'eng_blue', type: 'engine', name: '藍焰-V', mass: 0.3, thrustSL: 40, thrustVac: 110, ispSL: 180, ispVac: 335, cost: 2.2, rel: 0.97, tech: null, desc: '真空最佳化上面級引擎,海平面推力極低。' },
    { id: 'eng_fb2', type: 'engine', name: '火鳥-2', mass: 0.85, thrustSL: 720, thrustVac: 800, ispSL: 282, ispVac: 312, cost: 4.2, rel: 0.98, tech: 'prop_turbo', desc: '強化渦輪泵,推力大幅提升。' },
    { id: 'eng_blue2', type: 'engine', name: '藍焰-V2', mass: 0.35, thrustSL: 50, thrustVac: 180, ispSL: 190, ispVac: 350, cost: 3.2, rel: 0.98, tech: 'prop_vac2', desc: '高膨脹比噴嘴的上面級引擎。' },
    { id: 'eng_whale', type: 'engine', name: '赤鯨', mass: 1.9, thrustSL: 1800, thrustVac: 2000, ispSL: 288, ispVac: 318, cost: 8, rel: 0.975, tech: 'prop_heavy', desc: '重型煤油主引擎,適合大型第一級。' },
    { id: 'eng_h2', type: 'engine', name: '寒霜-H', mass: 0.55, thrustSL: 0, thrustVac: 120, ispSL: 0, ispVac: 450, cost: 6.5, rel: 0.975, tech: 'prop_hydro', desc: '液氫液氧上面級,比衝極高,只能在真空點火。' },
    { id: 'eng_meth', type: 'engine', name: '渡鴉-M', mass: 1.6, thrustSL: 2300, thrustVac: 2500, ispSL: 325, ispVac: 355, cost: 9, rel: 0.985, tech: 'prop_methane', desc: '全流量甲烷引擎,高效且耐用。' },
    { id: 'eng_methv', type: 'engine', name: '渡鴉-MV', mass: 1.1, thrustSL: 0, thrustVac: 900, ispSL: 0, ispVac: 375, cost: 8, rel: 0.985, tech: 'prop_methane', desc: '真空版甲烷引擎,大推力上面級。' },
    { id: 'eng_ntr', type: 'engine', name: '普羅米修斯 NTR', mass: 3.5, thrustSL: 0, thrustVac: 90, ispSL: 0, ispVac: 850, cost: 28, rel: 0.965, tech: 'prop_nuclear', desc: '核熱推進,比衝驚人但推力很小。' },
    { id: 'eng_aero', type: 'engine', name: '塞式-A', mass: 1.3, thrustSL: 950, thrustVac: 1000, ispSL: 335, ispVac: 355, cost: 8.5, rel: 0.975, tech: 'prop_aerospike', desc: '線型塞式噴嘴,海平面與真空效率兼顧。' },
    { id: 'eng_meth2', type: 'engine', name: '渡鴉-M2', mass: 1.45, thrustSL: 2700, thrustVac: 2900, ispSL: 330, ispVac: 360, cost: 8, rel: 0.99, tech: 'prop_meth2', desc: '依飛行數據改良的第二代甲烷引擎。' },

    // 固體助推器(捆綁於第一級兩側,與芯級同時點火)
    { id: 'srb_s', type: 'srb', name: '雷霆-S 固推', prop: 28, dry: 3.5, thrustSL: 1000, thrustVac: 1100, ispSL: 235, ispVac: 262, cost: 2.8, rel: 0.985, tech: 'prop_srb1', desc: '小型固體助推器,便宜又能大幅提升起飛推力。' },
    { id: 'srb_l', type: 'srb', name: '雷霆-L 固推', prop: 85, dry: 9.5, thrustSL: 3000, thrustVac: 3300, ispSL: 245, ispVac: 272, cost: 7.5, rel: 0.982, tech: 'prop_srb2', desc: '大型分段式固體助推器。' },
    { id: 'srb_c', type: 'srb', name: '雷霆-C 複材固推', prop: 85, dry: 6, thrustSL: 3200, thrustVac: 3500, ispSL: 252, ispVac: 280, cost: 9.5, rel: 0.986, tech: 'prop_srb_comp', desc: '碳纖維殼體,更輕更強。' },

    // 貯箱
    { id: 'tank_s', type: 'tank', name: '小型貯箱', prop: 8, dry: 0.8, cost: 0.6, rel: 0.998, tech: null, desc: '基本鋁合金貯箱。' },
    { id: 'tank_m', type: 'tank', name: '中型貯箱', prop: 25, dry: 2.2, cost: 1.5, rel: 0.997, tech: null, desc: '基本鋁合金貯箱。' },
    { id: 'tank_l', type: 'tank', name: '大型貯箱', prop: 80, dry: 6, cost: 4, rel: 0.996, tech: 'str_tank_l', desc: '大尺寸焊接貯箱。' },
    { id: 'tank_m_al', type: 'tank', name: '鋁鋰中型貯箱', prop: 25, dry: 1.4, cost: 2.2, rel: 0.997, tech: 'str_al_li', desc: '鋁鋰合金,乾重更輕。' },
    { id: 'tank_l_al', type: 'tank', name: '鋁鋰大型貯箱', prop: 80, dry: 4.2, cost: 5.5, rel: 0.996, tech: 'str_al_li', desc: '鋁鋰合金,乾重更輕。' },
    { id: 'tank_s_c', type: 'tank', name: '複材小型貯箱', prop: 8, dry: 0.4, cost: 1.2, rel: 0.998, tech: 'str_composite', desc: '碳纖維複合材料,極輕。' },
    { id: 'tank_xl_c', type: 'tank', name: '複材特大貯箱', prop: 200, dry: 8, cost: 12, rel: 0.995, tech: 'str_composite', desc: '重型火箭專用的巨型複材貯箱。' },
    { id: 'tank_steel', type: 'tank', name: '不鏽鋼巨型貯箱', prop: 300, dry: 20, cost: 5, rel: 0.996, tech: 'str_steel', desc: '笨重但極便宜,適合大量生產。' },

    // 整流罩
    { id: 'fair_s', type: 'fairing', name: '小型整流罩', mass: 0.25, maxPayload: 1.5, cost: 0.5, tech: null, desc: '酬載上限 1.5 t。' },
    { id: 'fair_m', type: 'fairing', name: '中型整流罩', mass: 0.8, maxPayload: 6, cost: 1.2, tech: 'str_fairing_m', desc: '酬載上限 6 t。' },
    { id: 'fair_l', type: 'fairing', name: '大型整流罩', mass: 2, maxPayload: 20, cost: 3, tech: 'str_fairing_l', desc: '酬載上限 20 t。' },
    { id: 'fair_xl', type: 'fairing', name: '超大型整流罩', mass: 4.5, maxPayload: 50, cost: 6, tech: 'str_fairing_xl', desc: '酬載上限 50 t。' },

    // 航電
    { id: 'avi_1', type: 'avionics', name: '基本航電', mass: 0.15, rel: 0.985, cost: 1, tech: null, desc: '單套導航電腦。' },
    { id: 'avi_2', type: 'avionics', name: '冗餘航電', mass: 0.2, rel: 0.993, cost: 2, tech: 'sat_avionics2', desc: '三重冗餘飛控。' },
    { id: 'avi_3', type: 'avionics', name: 'AI 飛控', mass: 0.2, rel: 0.998, cost: 4, tech: 'sat_avionics3', desc: '即時故障診斷與重構。' },
  ];

  G.COMPONENT_LIST = list;
  G.COMPONENTS = {};
  list.forEach(c => { G.COMPONENTS[c.id] = c; });
})(window.Game);
