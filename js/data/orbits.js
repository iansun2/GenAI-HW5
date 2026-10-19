// dv 為含損耗的所需 Δv (km/s);mass(m) 回傳第 m 月合約酬載範圍;weight(m) 為合約出現權重
Game.ORBIT_ORDER = ['LEO', 'SSO', 'MEO', 'GEO', 'LUNAR'];
Game.ORBITS = {
  LEO: {
    id: 'LEO', name: '近地軌道', dv: 9.4, capacity: 400, tech: null,
    priceBase: 26, pricePerTon: 14, minRep: 0, rivalFactor: 1,
    mass: m => [0.1, Math.min(8, 0.4 + m * 0.04)],
    weight: () => 5,
  },
  SSO: {
    id: 'SSO', name: '太陽同步軌道', dv: 9.8, capacity: 150, tech: null,
    priceBase: 28, pricePerTon: 18, minRep: 0, rivalFactor: 0.85,
    mass: m => [0.1, Math.min(4, 0.25 + m * 0.025)],
    weight: () => 3,
  },
  MEO: {
    id: 'MEO', name: '中地球軌道', dv: 11.2, capacity: 60, tech: 'ops_cert_meo',
    priceBase: 48, pricePerTon: 18, minRep: 15, rivalFactor: 0.5,
    mass: m => [0.8, Math.min(4, 1.5 + m * 0.02)],
    weight: m => (m < 6 ? 0.3 : 1 + m / 30),
  },
  GEO: {
    id: 'GEO', name: '地球同步軌道', dv: 11.8, capacity: 80, tech: 'ops_cert_geo',
    priceBase: 75, pricePerTon: 16, minRep: 25, rivalFactor: 0.4,
    mass: m => [1.5, Math.min(7, 2.5 + m * 0.03)],
    weight: m => (m < 12 ? 0.2 : 0.6 + m / 25),
  },
  LUNAR: {
    id: 'LUNAR', name: '月球軌道', dv: 12.6, capacity: 25, tech: 'ops_cert_lunar',
    priceBase: 110, pricePerTon: 26, minRep: 40, rivalFactor: 0.3,
    mass: m => [0.5, Math.min(5, 1.2 + m * 0.02)],
    weight: m => (m < 30 ? 0 : m / 40),
  },
};
