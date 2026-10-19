// localStorage 存檔與 JSON 匯出/匯入。所有存取都包在 try/catch,以便在禁用儲存的環境下仍可遊玩
(function (G) {
  const KEY = 'orbitalTycoon.';
  const SV = G.Save = {};
  SV.SLOTS = ['1', '2', '3'];

  SV.write = function (slot, s) {
    try {
      localStorage.setItem(KEY + slot, JSON.stringify(s));
      localStorage.setItem(KEY + slot + '.meta', JSON.stringify({ company: s.company, month: s.month, time: Date.now(), ended: s.ended }));
      return true;
    } catch (e) { return false; }
  };
  SV.auto = s => SV.write('auto', s);

  SV.meta = function (slot) {
    try { return JSON.parse(localStorage.getItem(KEY + slot + '.meta')); } catch (e) { return null; }
  };

  // 先升級舊版存檔再檢查結構
  SV.validate = function (s) {
    G.migrate(s);
    return !!(s && typeof s === 'object' && s.version === G.SAVE_VERSION && Array.isArray(s.blueprints) && Array.isArray(s.sats) && Array.isArray(s.flightLog) && typeof s.month === 'number');
  };

  SV.read = function (slot) {
    try {
      const s = JSON.parse(localStorage.getItem(KEY + slot));
      return SV.validate(s) ? s : null;
    } catch (e) { return null; }
  };

  SV.exportFile = function (s) {
    const blob = new Blob([JSON.stringify(s)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `星軌大亨-${s.company}-${G.BALANCE.startYear + Math.floor(s.month / 12)}-${s.month % 12 + 1}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  SV.importFile = function (cb) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const s = JSON.parse(reader.result);
          cb(SV.validate(s) ? s : null);
        } catch (e) { cb(null); }
      };
      reader.readAsText(f);
    };
    input.click();
  };
})(window.Game);
