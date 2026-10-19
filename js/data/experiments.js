// 純實驗任務。orbit 為 null 表示由玩家選擇目標軌道;cost 為實驗儀器費 (₵M),排程時支付
// 實驗飛行屬科研豁免,不需要該軌道的發射認證
Game.EXPERIMENTS = {
  test:      { id: 'test',      name: '試飛驗證',         orbit: null,    mass: 0,    cost: 0,   tech: null,             desc: '不帶酬載的驗證飛行,累積型號飛行紀錄。' },
  microg:    { id: 'microg',    name: '微重力實驗艙',     orbit: 'LEO',   mass: 0.3,  cost: 1.5, tech: null,             desc: '在近地軌道進行材料與生物實驗。' },
  atmos:     { id: 'atmos',     name: '高層大氣探測',     orbit: 'SSO',   mass: 0.15, cost: 1,   tech: null,             desc: '蒐集高層大氣密度與氣動數據。' },
  reentry:   { id: 'reentry',   name: '再入回收試驗',     orbit: 'LEO',   mass: 0.6,  cost: 3,   tech: 'sat_heatshield', desc: '測試熱防護與再入導引,為回收技術鋪路。' },
  radiation: { id: 'radiation', name: '輻射帶探測器',     orbit: 'MEO',   mass: 0.5,  cost: 3,   tech: 'sat_sciprobe',   desc: '量測范艾倫輻射帶,取得中軌道認證所需數據。' },
  geo_test:  { id: 'geo_test',  name: '同步軌道轉移試驗', orbit: 'GEO',   mass: 0.8,  cost: 4,   tech: 'sat_sciprobe',   desc: '驗證同步轉移軌道入軌與定點。' },
  deepspace: { id: 'deepspace', name: '深空通訊測試',     orbit: 'LUNAR', mass: 0.6,  cost: 6,   tech: 'sat_sciprobe',   desc: '前往月球軌道測試深空通訊與導航。' },
};
