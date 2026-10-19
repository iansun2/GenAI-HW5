// 隨機事件。effect / choices[].effect 簽名為 (s, A),A 為 core/events.js 提供的輔助函式;回傳結果文字
(function (G) {
  const PERM = 9999;
  const money = v => G.U.money(v);

  G.EVENTS = [
    // ── 政治 ──
    { id: 'export_ctrl', cat: '政治', title: '出口管制升級', weight: 3, cond: s => s.month >= 6,
      text: '鄰國宣布對高溫合金與精密軸承實施出口管制,零件採購成本大增。',
      effect: (s, A) => { const m = A.mod(s, 'componentCost', 1.2, 6, '出口管制', true); return `零件成本 +20%,持續 ${m} 個月。`; } },
    { id: 'subsidy', cat: '政治', title: '國家太空產業補助', weight: 3,
      text: '艾瑟聯邦通過《商業太空振興條例》,符合資格的業者可獲得一次性補助。',
      effect: (s, A) => { const v = 15 + Math.round(s.rep * 0.4); A.cash(s, v, '政府補助'); return `獲得補助 ${money(v)}。`; } },
    { id: 'budget_cut', cat: '政治', title: '國會刪減太空預算', weight: 2, cond: s => s.month >= 8,
      text: '財政緊縮,政府相關機構的發射合約報價全面下修。',
      effect: (s, A) => { const m = A.mod(s, 'contractPrice', 0.9, 6, '預算刪減', true); return `新合約底價 -10%,持續 ${m} 個月。`; } },
    { id: 'permit', cat: '政治', title: '發射許可審查', weight: 3, cond: s => s.month >= 3,
      text: '航太管理局要求重新審查發射場的環境影響評估。',
      choices: [
        { label: '支付加急審查費 ₵5M', effect: (s, A) => { A.cash(s, -5, '加急審查費'); return '審查順利通過。'; } },
        { label: '依正常程序審查(本月禁止發射)', effect: (s, A) => { A.mod(s, 'launchBan', 1, 1, '許可審查中'); return '本月所有發射暫停,已排程的發射將延後。'; } },
      ] },
    { id: 'classified', cat: '政治', title: '機密酬載邀約', weight: 2, cond: s => s.rep >= 20,
      text: '北境國防部私下接洽,希望以高價搭載一個不公開內容的酬載。媒體可能會追問。',
      choices: [
        { label: '接受(+₵35M,聲望 -4)', effect: (s, A) => { A.cash(s, 35, '機密酬載'); A.rep(s, -4); return '款項已入帳,但輿論出現質疑聲浪。'; } },
        { label: '婉拒(聲望 +2)', effect: (s, A) => { A.rep(s, 2); return '你堅持透明經營,獲得好評。'; } },
      ] },
    { id: 'election', cat: '政治', title: '選舉年科技政策', weight: 2,
      text: '執政黨為爭取選票加碼科研補貼。',
      effect: (s, A) => { A.mod(s, 'researchCost', 0.85, 6, '科研補貼'); return '研發成本 -15%,持續 6 個月。'; } },
    { id: 'treaty', cat: '政治', title: '國際軌道清理協定', weight: 2, cond: s => s.month >= 24,
      text: '各國簽署協定,聯合清理低軌道碎片。',
      effect: s => { s.debris.LEO *= 0.4; s.debris.SSO *= 0.4; return 'LEO/SSO 太空碎片大幅減少。'; } },
    { id: 'sanction', cat: '政治', title: '對手遭到制裁', weight: 2, cond: s => s.month >= 6,
      text: '一家競爭對手被控違反出口規範,遭到政府制裁。',
      effect: (s, A) => { const r = A.rival(s); r.tech = Math.max(0, r.tech - 4); r.rep = Math.max(0, r.rep - 3); return `${A.rivalName(r)} 技術進度受挫、聲望下滑。`; } },

    // ── 市場 ──
    { id: 'bb_boom', cat: '市場', title: '寬頻需求暴增', weight: 3, cond: s => s.month >= 12,
      text: '遠距工作潮再起,衛星通訊服務供不應求。',
      effect: (s, A) => { A.mod(s, 'satIncome', 1.2, 6, '需求暴增'); return '衛星服務收入 +20%,持續 6 個月。'; } },
    { id: 'bubble', cat: '市場', title: '衛星概念股泡沫破裂', weight: 2, cond: s => s.month >= 18,
      text: '資本市場急凍,衛星服務價格戰開打。',
      effect: (s, A) => { A.mod(s, 'satIncome', 0.85, 6, '泡沫破裂'); return '衛星服務收入 -15%,持續 6 個月。'; } },
    { id: 'insurance', cat: '市場', title: '發射保險費率上漲', weight: 3, cond: s => s.month >= 4,
      text: '近期業界事故頻傳,保險公司調漲費率。',
      effect: (s, A) => { A.mod(s, 'launchCost', 1, 6, '保險漲價'); return '每次發射作業費 +₵1M,持續 6 個月。'; } },
    { id: 'vc', cat: '市場', title: '創投注資邀約', weight: 2, cond: s => s.month >= 6,
      text: '知名創投「銀河資本」提議注資,但要求分享未來的衛星服務收益。',
      choices: [
        { label: '接受(+₵50M,衛星收入永久 -6%)', effect: (s, A) => { A.cash(s, 50, '創投注資'); A.mod(s, 'satIncome', 0.94, PERM, '創投分潤'); return '資金到位。'; } },
        { label: '婉拒', effect: () => '你保留了完整的經營權。' },
      ] },
    { id: 'bigclient', cat: '市場', title: '大型客戶入市', weight: 3,
      text: '一家新興通訊巨頭釋出多筆發射需求。',
      effect: s => { G.Contracts.generate(s, 2, 1.3); return '合約市場新增 2 筆高價合約。'; } },
    { id: 'cubesat', cat: '市場', title: '立方衛星熱潮', weight: 2,
      text: '大學與新創紛紛投入立方衛星,小型低軌合約大增。',
      effect: s => { G.Contracts.generate(s, 2, 1.1, 'LEO'); return '合約市場新增 2 筆 LEO 合約。'; } },
    { id: 'rate_up', cat: '市場', title: '央行升息', weight: 2, cond: s => s.month >= 6,
      text: '通膨升溫,央行連續升息。',
      effect: (s, A) => { A.mod(s, 'interest', 0.004, 12, '升息'); return '貸款月利率 +0.4%,持續 12 個月。'; } },
    { id: 'rate_down', cat: '市場', title: '央行降息', weight: 2,
      text: '景氣趨緩,央行宣布降息刺激投資。',
      effect: (s, A) => { A.mod(s, 'interest', -0.003, 12, '降息'); return '貸款月利率 -0.3%,持續 12 個月。'; } },
    { id: 'media', cat: '市場', title: '媒體專題報導', weight: 2, cond: s => s.stats.successes >= 2,
      text: '知名科技雜誌以封面故事報導你的公司。',
      effect: (s, A) => { A.rep(s, 3); return '聲望 +3。'; } },

    // ── 供應鏈 ──
    { id: 'titanium', cat: '供應鏈', title: '鈦合金短缺', weight: 3, cond: s => s.month >= 3,
      text: '全球鈦合金產能吃緊,交期延長。',
      effect: (s, A) => { A.mod(s, 'buildTime', 1, 4, '鈦合金短缺'); return '新開工的火箭工期 +1 個月,持續 4 個月。'; } },
    { id: 'carbon', cat: '供應鏈', title: '碳纖維漲價', weight: 2,
      text: '航空業復甦,碳纖維原料被大量搶購。',
      effect: (s, A) => { A.mod(s, 'componentCost', 1.1, 4, '碳纖維漲價'); return '零件成本 +10%,持續 4 個月。'; } },
    { id: 'supplier', cat: '供應鏈', title: '關鍵供應商財務危機', weight: 2, cond: s => s.month >= 6,
      text: '主要閥件供應商瀕臨倒閉,他們詢問你是否願意收購。',
      choices: [
        { label: '收購(₵20M,零件成本永久 -6%)', effect: (s, A) => { A.cash(s, -20, '收購供應商'); A.mod(s, 'componentCost', 0.94, PERM, '垂直整合'); return '完成收購,供應鏈更穩定。'; } },
        { label: '另覓供應商(零件成本 +12%,6 個月)', effect: (s, A) => { A.mod(s, 'componentCost', 1.12, 6, '更換供應商'); return '短期內採購成本上升。'; } },
      ] },
    { id: 'strike', cat: '供應鏈', title: '總裝廠工會罷工', weight: 2, cond: s => s.month >= 4,
      text: '工會要求調薪 15%,否則持續罷工。',
      choices: [
        { label: '同意調薪(每月人事 +₵0.3M)', effect: (s, A) => { A.mod(s, 'staff', 0.3, PERM, '調薪'); return '員工士氣提升,產線恢復運作。'; } },
        { label: '強硬談判(生產延誤 2 個月,聲望 -2)', effect: (s, A) => { s.production.forEach(p => { p.doneMonth += 2; }); A.rep(s, -2); return '罷工持續,所有生產中的火箭延後 2 個月。'; } },
      ] },
    { id: 'chips', cat: '供應鏈', title: '晶片短缺', weight: 2,
      text: '車用與 AI 晶片排擠,航電零件嚴重缺貨。',
      effect: (s, A) => { A.mod(s, 'componentCost', 1.12, 3, '晶片短缺'); return '零件成本 +12%,持續 3 個月。'; } },
    { id: 'port', cat: '供應鏈', title: '港口塞港', weight: 2, cond: s => s.production.length > 0,
      text: '颱風過後港口大塞車,零件運輸延誤。',
      effect: s => { s.production.forEach(p => { p.doneMonth += 1; }); return '生產中的火箭交期延後 1 個月。'; } },

    // ── 技術 ──
    { id: 'breakthrough', cat: '技術', title: '研發突破', weight: 3, cond: s => s.research.length > 0,
      text: '工程團隊在深夜實驗中意外取得突破!',
      effect: s => { const r = G.RNG.pick(s, s.research); r.doneMonth = Math.min(r.doneMonth, s.month + 1); return `「${G.TECH_MAP[r.techId].name}」將於本月底完成。`; } },
    { id: 'genius', cat: '技術', title: '天才工程師求職', weight: 2,
      text: '一位曾任職於競爭對手的明星工程師想加入你的團隊,但薪資要求不低。',
      choices: [
        { label: '聘用(每月 +₵0.25M,研發時間永久 -10%)', effect: (s, A) => { A.mod(s, 'staff', 0.25, PERM, '明星工程師'); A.mod(s, 'researchTime', 0.9, PERM, '明星工程師'); return '新血加入,研發效率提升。'; } },
        { label: '不聘用', effect: () => '你婉拒了他的求職。' },
      ] },
    { id: 'test_boom', cat: '技術', title: '引擎測試台爆炸', weight: 2, cond: s => s.month >= 2,
      text: '一次全時長點火測試以爆炸收場,所幸無人傷亡。',
      effect: (s, A) => { A.cash(s, -5, '測試台修復'); s.research.forEach(r => { r.doneMonth += 1; }); return '損失 ₵5M,進行中的研發延後 1 個月。'; } },
    { id: 'academic', cat: '技術', title: '學術合作計畫', weight: 2,
      text: '天樞大學提議共同研究,帶來資源與名聲。',
      effect: (s, A) => { A.cash(s, 5, '學術合作'); A.rep(s, 3); return '獲得 ₵5M,聲望 +3。'; } },
    { id: 'fire', cat: '技術', title: '倉庫火災', weight: 1, cond: s => s.month >= 6,
      text: '火箭倉庫發生電氣火災。',
      effect: (s, A) => {
        const idle = s.inventory.filter(r => !s.launches.some(l => l.rocketId === r.id));
        if (idle.length) {
          const rk = G.RNG.pick(s, idle);
          s.inventory = s.inventory.filter(r => r !== rk);
          const bp = s.blueprints.find(b => b.id === rk.bpId);
          return `一枚「${bp ? bp.name : '火箭'}」在火災中損毀。`;
        }
        A.cash(s, -8, '火災損失');
        return '設備損失 ₵8M。';
      } },
    { id: 'qa_scandal', cat: '技術', title: '品管疏失曝光', weight: 2, cond: s => s.month >= 6,
      text: '內部稽核發現部分焊道檢驗紀錄造假。',
      choices: [
        { label: '全面重檢(₵8M,聲望 +1)', effect: (s, A) => { A.cash(s, -8, '全面重檢'); A.rep(s, 1); return '你果斷處理,贏得客戶信任。'; } },
        { label: '低調處理(可靠度 -4%,3 個月)', effect: (s, A) => { A.mod(s, 'reliability', -0.04, 3, '品管隱患'); return '隱患仍在,發射風險上升。'; } },
      ] },

    // ── 競爭 ──
    { id: 'rival_fail', cat: '競爭', title: '對手發射事故', weight: 3, cond: s => s.month >= 3,
      text: '一家競爭對手的火箭在升空後解體,客戶信心動搖。',
      effect: (s, A) => { const r = A.rival(s); r.rep = Math.max(0, r.rep - 5); return `${A.rivalName(r)} 聲望 -5。`; } },
    { id: 'poach', cat: '競爭', title: '對手挖角', weight: 2, cond: s => s.research.length > 0,
      text: '競爭對手以高薪挖角你的研發主管。',
      choices: [
        { label: '加薪留人(₵6M)', effect: (s, A) => { A.cash(s, -6, '留才獎金'); return '研發主管決定留下。'; } },
        { label: '讓他離開(研發進度延後 2 個月)', effect: s => { s.research.forEach(r => { r.doneMonth += 2; }); return '研發團隊群龍無首,進度延後。'; } },
      ] },
    { id: 'price_war', cat: '競爭', title: '對手發動價格戰', weight: 2, cond: s => s.month >= 10,
      text: '競爭對手宣布大幅降價搶單。',
      effect: (s, A) => { A.mod(s, 'rivalBid', 0.92, 6, '價格戰'); return '對手報價 -8%,持續 6 個月。'; } },
    { id: 'merger', cat: '競爭', title: '對手併購新創', weight: 2, cond: s => s.month >= 12,
      text: '一家競爭對手併購了一間推進技術新創公司。',
      effect: (s, A) => { const r = A.rival(s); r.tech += 6; return `${A.rivalName(r)} 技術大幅躍進。`; } },

    // ── 太空環境 ──
    { id: 'solar_storm', cat: '太空環境', title: '強烈太陽風暴', weight: 2, cond: s => s.sats.length > 0,
      text: 'X 級閃焰引發地磁暴,低軌衛星大氣阻力劇增。',
      effect: s => {
        let n = 0;
        s.sats.forEach(x => { if (x.orbit === 'LEO' || x.orbit === 'SSO') { x.life -= 6; if (x.owner === 'player') n++; } });
        return `LEO/SSO 所有衛星壽命 -6 個月(你有 ${n} 顆受影響)。`;
      } },
    { id: 'asat', cat: '太空環境', title: '反衛星試驗碎片', weight: 2, cond: s => s.month >= 12,
      text: '某國進行反衛星武器試驗,在低軌道留下大量碎片。',
      effect: s => { s.debris.LEO += 40; return 'LEO 碎片 +40,擁擠度上升。'; } },
    { id: 'cleanup', cat: '太空環境', title: '太空垃圾清除計畫', weight: 2, cond: s => s.debris.LEO > 10,
      text: '一家新創提出以捕捉網清除低軌碎片,邀請你出資。',
      choices: [
        { label: '出資 ₵10M(LEO 碎片 -60%,聲望 +4)', effect: (s, A) => { A.cash(s, -10, '清除碎片'); s.debris.LEO *= 0.4; A.rep(s, 4); return '清除任務成功,國際好評。'; } },
        { label: '不參與', effect: () => '計畫因資金不足而擱置。' },
      ] },
    { id: 'typhoon', cat: '太空環境', title: '颱風季提前', weight: 2,
      text: '發射場所在海域颱風頻繁。',
      effect: (s, A) => { A.mod(s, 'weather', 2, 3, '颱風季'); return '惡劣天候機率加倍,持續 3 個月。'; } },
    { id: 'meteor', cat: '太空環境', title: '流星雨高峰', weight: 1, cond: s => s.sats.some(x => x.owner === 'player'),
      text: '異常強烈的流星雨穿越軌道。',
      effect: s => {
        const mine = s.sats.filter(x => x.owner === 'player');
        const v = G.RNG.pick(s, mine);
        s.sats = s.sats.filter(x => x !== v);
        return `你的一顆${G.SAT_TYPES[v.type].name}被微隕石擊毀。`;
      } },
  ];

  G.EVENT_MAP = {};
  G.EVENTS.forEach(e => { G.EVENT_MAP[e.id] = e; });
})(window.Game);
