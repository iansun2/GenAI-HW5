// 彈出視窗佇列。step = { html, cls?, mount?(box) => cleanup? }
(function (G) {
  const UI = G.UI;
  const root = () => document.getElementById('modal');

  UI.Modal = {
    q: [], open: false, cleanup: null,

    push(step) {
      this.q.push(step);
      if (!this.open) this.next();
    },

    next() {
      if (this.cleanup) { this.cleanup(); this.cleanup = null; }
      const el = root();
      const step = this.q.shift();
      if (!step) {
        this.open = false;
        el.classList.remove('show');
        el.innerHTML = '';
        if (UI.s) UI.render();
        return;
      }
      this.open = true;
      el.classList.add('show');
      el.innerHTML = `<div class="modal-box ${step.cls || ''}">${step.html}</div>`;
      el.scrollTop = 0;
      if (step.mount) this.cleanup = step.mount(el.querySelector('.modal-box')) || null;
    },

    reset() {
      this.q = [];
      if (this.cleanup) { this.cleanup(); this.cleanup = null; }
      this.open = false;
      const el = root();
      if (el) { el.classList.remove('show'); el.innerHTML = ''; }
    },
  };
})(window.Game);
