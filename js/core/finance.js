// 現金、帳本、借貸與每月固定支出。所有金流都經過 F.add 以便記帳
(function (G) {
  const U = G.U;
  const F = G.Finance = {};
  const REVENUE_CATS = ['contract', 'service'];

  F.CAT_NAMES = {
    contract: '合約收入', service: '衛星服務', refund: '回收/退款', event: '事件', loan: '借還款',
    research: '研發', build: '火箭製造', launch: '發射作業', satellite: '衛星採購',
    facility: '設施投資', upkeep: '人事與維護', interest: '利息', penalty: '違約金',
    experiment: '實驗儀器', grant: '科研補助', insurance: '保險理賠',
  };

  F.add = function (s, amount, cat, note) {
    s.cash += amount;
    s.ledger.items.push({ cat, amount, note });
  };
  F.spend = (s, amount, cat, note) => F.add(s, -amount, cat, note);

  F.revenue = L => U.sum(L.items.filter(x => REVENUE_CATS.includes(x.cat) && x.amount > 0), x => x.amount);
  F.expense = L => -U.sum(L.items.filter(x => x.cat !== 'loan' && x.amount < 0), x => x.amount);
  F.byCat = function (L) {
    const out = {};
    L.items.forEach(x => { out[x.cat] = (out[x.cat] || 0) + x.amount; });
    return out;
  };

  F.rate = function (s) {
    const b = G.BALANCE;
    const base = b.loanBaseRate * (1 + (40 - s.rep) / 80);
    return Math.max(0.002, base * G.Mods.interestMult(s) + G.Mods.interestAdd(s));
  };
  F.creditLimit = function (s) {
    const b = G.BALANCE;
    return Math.max(0, (b.creditBase + s.rep * b.creditPerRep + 0.4 * G.Orbit.playerSatValue(s)) * G.Mods.credit(s));
  };
  F.available = s => Math.max(0, F.creditLimit(s) - s.debt);
  F.restricted = s => s.cash < -G.BALANCE.restrictThreshold * F.creditLimit(s);

  F.borrow = function (s, amt) {
    amt = U.round(amt, 1);
    if (!(amt > 0)) return '請輸入正確金額';
    if (s.cash < 0) return '透支中無法申請新貸款';
    if (amt > F.available(s) + 1e-9) return `超過可借額度 ${U.money(F.available(s))}`;
    s.debt += amt;
    F.add(s, amt, 'loan', '銀行貸款');
    G.Log.add(s, `向銀行借款 ${U.money(amt)}。`, 'money');
    return null;
  };
  F.repay = function (s, amt) {
    amt = U.round(Math.min(amt, s.debt), 1);
    if (!(amt > 0)) return '沒有需要償還的金額';
    if (amt > s.cash + 1e-9) return '現金不足';
    s.debt = U.round(s.debt - amt, 2);
    if (s.debt < 0.05) s.debt = 0;
    F.add(s, -amt, 'loan', '償還貸款');
    G.Log.add(s, `償還貸款 ${U.money(amt)}。`, 'money');
    return null;
  };

  F.upkeep = function (s) {
    const lv = U.sum(Object.values(s.facilities));
    return G.BALANCE.staffCost + G.Mods.staff(s) + G.BALANCE.facilityUpkeep * lv;
  };

  F.monthly = function (s) {
    const b = G.BALANCE;
    F.spend(s, F.upkeep(s), 'upkeep', '人事與設施維護');
    if (s.debt > 0) F.spend(s, s.debt * F.rate(s), 'interest', '貸款利息');
    if (s.cash < 0) {
      F.spend(s, -s.cash * b.overdraftRate, 'interest', '透支利息');
      s.rep = Math.max(0, s.rep - b.overdraftRepLoss);
    }
  };

  F.upgradeFacility = function (s, key) {
    const def = G.BALANCE.facilities[key], lv = s.facilities[key];
    if (lv >= def.max) return '已達最高等級';
    if (F.restricted(s)) return '財務受限,無法投資';
    const cost = def.cost[lv];
    F.spend(s, cost, 'facility', `${def.name}升級`);
    s.facilities[key] = lv + 1;
    G.Log.add(s, `${def.name}升級至 Lv.${lv + 1}(${U.money(cost)})。`, 'build');
    return null;
  };
})(window.Game);
