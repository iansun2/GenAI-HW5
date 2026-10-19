// 發射動畫(Canvas):升空 → 分節 → 入軌或爆炸,之後顯示任務報告
(function (G) {
  const U = G.U, UI = G.UI;
  const SEP = 1.1;          // 每一級燃燒秒數
  const T0 = 0.6;           // 點火前倒數
  let skipCurrent = null;

  UI.actions.lvSkip = () => { if (skipCurrent) skipCurrent(); };

  function animate(box, r) {
    const cv = box.querySelector('canvas');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height, groundY = H - 40;
    const n = r.stages;
    const burnEnd = T0 + n * SEP;
    const failT = r.outcome === 'fail' ? T0 + r.failStage * SEP + 0.35 + ((r.failStage * 37) % 50) / 100 : Infinity;
    const endT = r.outcome === 'fail' ? failT + 1.6 : burnEnd + 1.6;
    const stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 97) % W, y: (i * 53) % H, r: (i % 3) * 0.5 + 0.4 }));
    const debris = [], drops = [];
    let start = null, raf = 0, exploded = false, finished = false;
    const stageH = 26, bodyW = 12;
    const boostEnd = r.boosters ? T0 + SEP * 0.65 : -1;
    let boostDropped = false;

    const altAt = t => (t < T0 ? 0 : 18 * Math.pow(t - T0, 2.2));

    function drawRocket(x, y, stagesLeft, t, flame) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.min(0.5, Math.max(0, t - T0 - 0.8) * 0.18));
      let yy = 0;
      if (stagesLeft === n && r.boosters && t < boostEnd) {
        const per = Math.min(3, r.boosters / 2);
        for (let k = 0; k < per; k++) {
          ctx.fillStyle = '#d8c9a8';
          ctx.fillRect(-bodyW / 2 - (k + 1) * 6, -stageH * 0.85, 5, stageH * 0.85);
          ctx.fillRect(bodyW / 2 + k * 6 + 1, -stageH * 0.85, 5, stageH * 0.85);
          if (flame) {
            ctx.fillStyle = 'rgba(255,190,90,0.85)';
            ctx.fillRect(-bodyW / 2 - (k + 1) * 6 + 1, 0, 3, 10 + Math.random() * 8);
            ctx.fillRect(bodyW / 2 + k * 6 + 2, 0, 3, 10 + Math.random() * 8);
          }
        }
      }
      for (let i = n - stagesLeft; i < n; i++) {
        ctx.fillStyle = i % 2 ? '#c9dcec' : '#eef8ff';
        ctx.fillRect(-bodyW / 2, yy - stageH, bodyW, stageH);
        ctx.strokeStyle = '#3ff2ff';
        ctx.beginPath(); ctx.moveTo(-bodyW / 2, yy - stageH); ctx.lineTo(bodyW / 2, yy - stageH); ctx.stroke();
        yy -= stageH;
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(-bodyW / 2, yy); ctx.quadraticCurveTo(0, yy - 26, bodyW / 2, yy); ctx.fill();
      if (flame) {
        const f = 18 + Math.random() * 14;
        const g = ctx.createLinearGradient(0, 0, 0, f);
        g.addColorStop(0, '#fff6c2'); g.addColorStop(0.4, '#ff9f43'); g.addColorStop(1, 'rgba(255,77,109,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(-bodyW / 2 + 1, 0); ctx.lineTo(bodyW / 2 - 1, 0); ctx.lineTo(0, f); ctx.fill();
      }
      ctx.restore();
    }

    function frame(ts) {
      if (start == null) start = ts;
      const t = (ts - start) / 1000;
      const alt = altAt(Math.min(t, failT));
      const cam = Math.max(0, alt - (groundY - 120));
      const rx = W / 2 + Math.max(0, alt - 60) * 0.08;
      const ry = groundY - alt + cam;

      // 背景:天空由藍轉黑
      const k = U.clamp(cam / 600, 0, 1);
      ctx.fillStyle = `rgb(${Math.round(12 * (1 - k))},${Math.round(30 * (1 - k)) + 2},${Math.round(60 * (1 - k)) + 8})`;
      ctx.fillRect(0, 0, W, H);
      stars.forEach(s => {
        const sy = (s.y + cam * 0.25) % H;
        ctx.fillStyle = `rgba(210,235,255,${0.25 + k * 0.7})`;
        ctx.fillRect(s.x, sy, s.r, s.r);
      });
      // 地面與發射塔
      const gy = groundY + cam;
      if (gy < H + 40) {
        ctx.fillStyle = '#0b1a2c'; ctx.fillRect(0, gy, W, H);
        ctx.strokeStyle = '#2b6191'; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        ctx.fillStyle = '#1c3f63'; ctx.fillRect(W / 2 + 14, gy - 110, 6, 110);
      }

      // 分節後落下的級
      const sepDone = Math.max(0, Math.min(n - 1, Math.floor((Math.min(t, failT) - T0) / SEP)));
      if (r.boosters && !boostDropped && t >= boostEnd && t < failT) {
        boostDropped = true;
        [-1, 1].forEach(side => drops.push({ x: rx + side * 12, y: ry, born: t, side, booster: true }));
      }
      while (drops.filter(d => !d.booster).length < sepDone) drops.push({ x: rx, y: ry, born: t });
      drops.forEach(d => {
        const dt = t - d.born;
        ctx.save();
        ctx.translate(d.x + (d.booster ? d.side * dt * 22 : -dt * 12), d.y + dt * dt * 40);
        ctx.rotate(d.booster ? d.side * dt * 1.6 : dt * 1.2);
        ctx.fillStyle = d.booster ? 'rgba(216,201,168,0.85)' : 'rgba(160,190,215,0.8)';
        if (d.booster) ctx.fillRect(-3, -stageH * 0.85, 5, stageH * 0.85);
        else ctx.fillRect(-bodyW / 2, -stageH, bodyW, stageH);
        ctx.restore();
      });

      if (t < failT) {
        const burning = t >= T0 && t < burnEnd;
        drawRocket(rx, ry, n - sepDone, t, burning);
        if (t >= burnEnd && r.outcome !== 'fail') {
          // 酬載分離
          const dt = t - burnEnd;
          ctx.fillStyle = r.outcome === 'success' ? '#4cff9a' : '#ffd166';
          ctx.fillRect(rx + dt * 26, ry - n * stageH - 30 - dt * 8, 6, 6);
          ctx.fillRect(rx + dt * 26 - 6, ry - n * stageH - 28 - dt * 8, 4, 2);
          ctx.fillRect(rx + dt * 26 + 8, ry - n * stageH - 28 - dt * 8, 4, 2);
        }
      } else {
        if (!exploded) {
          exploded = true;
          for (let i = 0; i < 70; i++) {
            const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 140;
            debris.push({ x: rx, y: ry - 20, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1 });
          }
        }
        debris.forEach(p => {
          p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 1.5; p.life -= 0.012;
          if (p.life > 0) { ctx.fillStyle = `rgba(255,${Math.round(120 + 100 * p.life)},60,${p.life})`; ctx.fillRect(p.x, p.y, 3, 3); }
        });
      }

      // HUD
      ctx.fillStyle = '#7593b3';
      ctx.font = '12px monospace';
      ctx.fillText(`T+${Math.max(0, t - T0).toFixed(1)}s`, 12, 20);
      ctx.fillText(`ALT ${(alt * 0.4).toFixed(0)} km`, 12, 36);
      ctx.fillText(`STAGE ${Math.min(n, sepDone + 1)}/${n}`, 12, 52);
      if (t < T0) { ctx.fillStyle = '#3ff2ff'; ctx.font = '20px monospace'; ctx.fillText('IGNITION', W / 2 - 46, 40); }

      if (t >= endT) { finish(); return; }
      raf = requestAnimationFrame(frame);
    }

    function finish() {
      if (finished) return;
      finished = true;
      box.querySelector('.lv-result').classList.remove('hidden');
      box.querySelector('[data-act="lvSkip"]').classList.add('hidden');
      box.querySelector('[data-act="modalNext"]').classList.remove('hidden');
    }

    skipCurrent = () => { cancelAnimationFrame(raf); finish(); };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); skipCurrent = null; };
  }

  UI.LaunchView = {
    step(r) {
      const word = { success: ['任務成功', 'good'], partial: ['部分成功 · 軌道偏差', 'warn'], fail: ['任務失敗', 'bad'] }[r.outcome];
      const lines = [];
      lines.push(`酬載:${r.label}(${U.ton(r.mass)})→ ${r.orbit} ${G.ORBITS[r.orbit].name}`);
      lines.push(`預估成功率 ${U.pct(r.p, 1)}${r.weather ? ',<span class="warn">發射窗口天候不佳</span>' : ''}`);
      if (r.boosters) lines.push(`<span class="dim">捆綁 ${r.boosters} 具固體助推器</span>`);
      if (r.outcome === 'fail') lines.push(`<span class="bad">第 ${r.failStage + 1} 級發生故障。此型號將停飛調查 ${G.BALANCE.groundMonths} 個月,聲望 -${G.BALANCE.failRepLoss}。</span>`);
      if (r.outcome === 'partial') lines.push(r.kind === 'experiment' ? '<span class="warn">軌道偏差,僅取得部分實驗數據(仍計入研發條件)。</span>'
        : r.kind === 'own' ? '<span class="warn">衛星進入偏差軌道,壽命縮短。</span>' : '<span class="warn">酬載進入偏差軌道,壽命縮短,合約尾款減半。</span>');
      if (r.kind === 'experiment' && r.outcome === 'success') lines.push('<span class="good">實驗數據蒐集完成,已計入研發條件。</span>');
      if (r.grant) lines.push(`<span class="good">獲得科研補助 ${U.money(r.grant)}</span>`);
      if (r.insured) lines.push(`<span class="warn">保險理賠 ${U.money(r.insured)}</span>`);
      if (r.reward) lines.push(`<span class="good">收到合約尾款 ${U.money(r.reward)}</span>`);
      if (r.reusable) lines.push(r.recovered ? `<span class="good">第一級成功著陸回收,退回 ${U.money(r.refund)}</span>` : '<span class="dim">第一級回收失敗。</span>');
      return {
        cls: 'launch',
        html: `<h2>發射任務 · ${U.esc(r.bpName)}</h2>
          <canvas class="launch-canvas" width="640" height="300"></canvas>
          <div class="lv-result hidden">
            <div class="outcome ${word[1]}">${word[0]}</div>
            <ul class="list">${lines.map(x => `<li>${x}</li>`).join('')}</ul>
          </div>
          <div class="modal-actions">
            <button class="btn" data-act="lvSkip">跳過動畫</button>
            <button class="btn primary hidden" data-act="modalNext">繼續</button>
          </div>`,
        mount: box => animate(box, r),
      };
    },
  };
})(window.Game);
