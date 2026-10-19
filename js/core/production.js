(function (G) {
  const P = G.Production = {};

  P.canBuild = function (s, bp) {
    if (s.production.length >= s.facilities.factory) return '總裝廠產線已滿';
    if (G.Finance.restricted(s)) return '財務受限,無法下單';
    const errs = G.Rocket.validate(s, bp);
    return errs.length ? errs[0] : null;
  };

  P.build = function (s, bpId) {
    const bp = G.Rocket.find(s, bpId);
    if (!bp) return '找不到藍圖';
    const err = P.canBuild(s, bp);
    if (err) return err;
    const cost = G.Rocket.cost(s, bp), months = G.Rocket.buildMonths(s, bp);
    G.Finance.spend(s, cost, 'build', `製造 ${bp.name}`);
    s.production.push({ id: G.U.uid(s, 'pd'), bpId, start: s.month, doneMonth: s.month + months, cost });
    bp.builds = (bp.builds || 0) + 1;
    G.Log.add(s, `開始製造「${bp.name}」(${G.U.money(cost)},${months} 個月)。`, 'build');
    return null;
  };

  P.process = function (s, rep) {
    s.production = s.production.filter(p => {
      if (p.doneMonth <= s.month + 1) {
        s.inventory.push({ id: G.U.uid(s, 'rk'), bpId: p.bpId });
        const bp = G.Rocket.find(s, p.bpId);
        rep.production.push(bp ? bp.name : '火箭');
        G.Log.add(s, `「${bp ? bp.name : '火箭'}」完成總裝,進入庫存。`, 'build');
        return false;
      }
      return true;
    });
  };
})(window.Game);
