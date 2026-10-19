// 自營衛星類型。income 為每月收入 (₵M),life 為基礎壽命(月),market 為市場規模(同類衛星超過時單價下降)
Game.SAT_TYPES = {
  cube:      { id: 'cube',      name: '立方衛星',     orbit: 'LEO',   mass: 0.1, cost: 1.5, income: 0.22, life: 36,  market: 150, tech: 'sat_smallcom',  rivalTech: 0,  desc: '便宜的物聯網小衛星,壽命短。' },
  eo:        { id: 'eo',        name: '光學遙測衛星', orbit: 'SSO',   mass: 0.8, cost: 9,   income: 1.0,  life: 60,  market: 40,  tech: 'sat_eo',        rivalTech: 5,  desc: '販售地球影像資料。' },
  broadband: { id: 'broadband', name: '寬頻星座節點', orbit: 'LEO',   mass: 0.3, cost: 2.8, income: 0.42, life: 60,  market: 400, tech: 'sat_broadband', rivalTech: 8,  desc: '大量部署組成寬頻網路。' },
  nav:       { id: 'nav',       name: '導航衛星',     orbit: 'MEO',   mass: 1.6, cost: 22,  income: 2.4,  life: 120, market: 30,  tech: 'sat_nav',       rivalTech: 14, desc: '提供高精度定位授時服務。' },
  geocom:    { id: 'geocom',    name: '同步通訊衛星', orbit: 'GEO',   mass: 4,   cost: 55,  income: 6,    life: 150, market: 40,  tech: 'sat_geo',       rivalTech: 24, desc: '大型廣播與通訊平台。' },
  relay:     { id: 'relay',     name: '月球中繼衛星', orbit: 'LUNAR', mass: 1.5, cost: 35,  income: 4.2,  life: 120, market: 12,  tech: 'sat_relay',     rivalTech: 42, desc: '為月面任務提供通訊。' },
};

Game.CLIENTS = ['海角電信', '綠洲氣象局', '天樞大學', '群星製圖', '北境國防部', '藍鯨通訊', '晨曦農業科技', '深空研究院', '艾瑟聯邦太空署', '環宇保險', '雲梯物流', '白鷺海事', '極光廣播', '玄武地質調查所', '銀杏遙測', '新月科學基金會', '潮汐能源', '琥珀金融資訊', '墨丘利導航', '翡翠漁業協會'];

Game.PURPOSES = {
  LEO: ['技術驗證衛星', '物聯網衛星', '科學實驗艙', '通訊試驗衛星'],
  SSO: ['地球觀測衛星', '氣象衛星', '農業遙測衛星', '雷達成像衛星'],
  MEO: ['導航增強衛星', '區域定位衛星'],
  GEO: ['同步通訊衛星', '廣播衛星', '氣象同步衛星'],
  LUNAR: ['月球探測器', '月面著陸器', '月球軌道器'],
};

Game.RIVALS = [
  { id: 'beichen',   name: '北辰重工', color: '#ff9f43', style: '價格殺手',   desc: '以低價搶下大量合約,可靠度普通。', bidFactor: 0.86, techRate: 0.55, constRate: 0.25, baseRel: 0.86 },
  { id: 'cangqiong', name: '蒼穹動力', color: '#7dd3fc', style: '可靠度至上', desc: '報價偏高,但發射紀錄穩健。',       bidFactor: 1.04, techRate: 0.6, constRate: 0.18, baseRel: 0.93 },
  { id: 'chiyan',    name: '赤焰太空', color: '#ff4d6d', style: '激進擴張',   desc: '大量部署自有星座,搶佔軌道。',     bidFactor: 0.95, techRate: 0.75, constRate: 0.45, baseRel: 0.84 },
];
