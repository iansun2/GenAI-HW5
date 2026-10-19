(function (G) {
  const U = G.U, RNG = G.RNG;
  const EV = G.Events = {};

  // 提供給事件資料使用的輔助函式
  EV.A = {
    cash: (s, v, note) => G.Finance.add(s, v, 'event', note),
    rep: (s, v) => { s.rep = U.clamp(s.rep + v, 0, 100); },
    // political:受「政府關係」科技減免持續時間;回傳實際月數
    mod: (s, kind, value, months, label, political) => {
      if (political) months = Math.max(1, Math.round(months * (1 - G.Mods.shield(s))));
      s.modifiers.push({ kind, value, until: s.month + months, label });
      return months;
    },
    rival: s => RNG.pick(s, s.rivals),
    rivalName: r => G.Rivals.def(r.id).name,
  };

  EV.roll = function (s, rep) {
    const b = G.BALANCE;
    if (s.pendingEvent || !RNG.chance(s, b.eventChance)) return;
    const cand = G.EVENTS.filter(e => (!e.cond || e.cond(s)) && (s.eventLast[e.id] == null || s.month - s.eventLast[e.id] >= b.eventCooldown));
    const ev = RNG.weighted(s, cand, e => e.weight);
    if (!ev) return;
    s.eventLast[ev.id] = s.month;
    if (ev.choices) {
      s.pendingEvent = { id: ev.id };
    } else {
      const result = ev.effect(s, EV.A) || '';
      rep.events.push({ id: ev.id, result });
      G.Log.add(s, `【${ev.title}】${result}`, 'event');
    }
  };

  EV.choose = function (s, idx) {
    if (!s.pendingEvent) return '';
    const ev = G.EVENT_MAP[s.pendingEvent.id];
    const c = ev.choices[idx];
    const result = c.effect(s, EV.A) || '';
    s.pendingEvent = null;
    G.Log.add(s, `【${ev.title}】選擇「${c.label}」:${result}`, 'event');
    return result;
  };
})(window.Game);
