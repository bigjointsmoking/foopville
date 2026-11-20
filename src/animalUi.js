// ============================================================
// FARM ANIMAL WINDOW + the little signs over coops, barns and hives (F-E).
//   FUP.animalUi.open(scene, p, onClose)  ->  { destroy() }
//   FUP.animalUi.marks(scene, region)     😟 hungry · ✨ produce ready · 💀 died
// Rules in src/systems/animals.js, numbers in data/animals.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.animalUi = {
  marks(scene, region, tile = FUP.villageData.tileSize) {
    const A = FUP.animals, list = A.list().filter(p => FUP.place.zone(p.zone).where.region === region);
    const sig = list.map(p => [p.uid, p.zone, p.tx, p.ty, A.look(p)].join(':')).join('|');
    if (sig === scene._animalSig) return;
    scene._animalSig = sig;
    (scene._animalMarks || []).forEach(o => { if (o.active) { scene.tweens.killTweensOf(o); o.destroy(); } });
    scene._animalMarks = [];
    for (const p of list) {
      const sign = { hungry: '😟', ready: '✨', dead: '💀' }[A.look(p)];
      if (!sign) continue;
      const b = FUP.buildUi.box(p, tile);
      const m = scene.add.text(b.x + b.w / 2, b.y - 6, sign, { fontSize: '20px' }).setOrigin(0.5, 1).setDepth(5200);
      scene.tweens.add({ targets: m, y: m.y - 5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene._animalMarks.push(m);
    }
  },

  // The placed animal you're standing next to, as an action spot (or null)
  spot(scene, region = 'village', tile = FUP.villageData.tileSize) {
    const A = FUP.animals;
    for (const p of A.list()) {
      if (FUP.place.zone(p.zone).where.region !== region) continue;
      const b = FUP.buildUi.box(p, tile);
      const dx = Math.max(b.x - scene.player.x, 0, scene.player.x - (b.x + b.w)), dy = Math.max(b.y - scene.player.y, 0, scene.player.y - (b.y + b.h));
      if (Math.hypot(dx, dy) >= 30) continue;
      const k = A.kind(p), look = A.look(p), a = A.get(p);
      const label = look === 'ready' ? `${FUP.ingredients[k.produce].emoji} Collect (${a.made})` : look === 'hungry' ? '😟 Feed' : look === 'dead' ? '💀 Look' : `${k.emoji} Look`;
      return { kind: 'animal', p, label, x: b.x + b.w / 2, y: b.y + 10 };
    }
    return null;
  },

  open(scene, p, onClose) {
    const ui = FUP.ui, c = ui.colors, A = FUP.animals, run = FUP.run, it = FUP.place.item(p.item);
    const W = scene.scale.width, H = scene.scale.height, Z = 20000, k = A.kind(p);
    const g = { open: true };
    let parts = [], note = '';
    const where = () => ({ x: W / 2, y: H / 2 - 60 });
    const fix = (o, d = 1) => { o.setScrollFactor(0).setDepth(Z + d); parts.push(o); return o; };
    const btn = (x, y, w, label, fn, opts = {}) => {
      const b = ui.button(scene, x, y, w, 42, label, () => { fn(); if (g.open) draw(); }, { size: 14, ...opts });
      fix(b.rect, 2); fix(b.txt, 3); if (b.icon) fix(b.icon, 3);
      if (opts.disabled) b.setEnabled(false);
    };
    const draw = () => {
      parts.forEach(o => o.destroy()); parts = [];
      const a = A.get(p), look = A.look(p), prod = FUP.ingredients[k.produce], feed = k.feed && FUP.ingredients[k.feed];
      const PW = 600, PH = 330, X = W / 2 - PW / 2, Y = H / 2 - PH / 2;
      fix(ui.shade(scene, 0.65), 0);
      fix(ui.panel(scene, X, Y, PW, PH, 'panel'));
      fix(ui.text(scene, W / 2, Y + 16, `${it.emoji} ${it.name.toUpperCase()}`, 20, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
      // How they are
      let status;
      if (look === 'dead') status = `Your ${k.who} died: nobody fed them. The building is empty.`;
      else if (!k.feed) status = `The ${k.who} look after themselves. They don't need feeding.`;
      else if (a.food > 0) status = `Fed. Food left: ${Math.ceil(a.food / 60)} min of play.`;
      else status = `HUNGRY! No ${k.units} while hungry. They die in ${Math.ceil(A.daysLeft(p) * FUP.clockData.daySeconds / 60)} min of play if not fed.`;
      fix(ui.text(scene, W / 2, Y + 52, status, 14, look === 'hungry' || look === 'dead' ? c.bad : c.ink, { align: 'center', wordWrap: { width: PW - 50 } }).setOrigin(0.5, 0), 2);
      // Produce
      if (look !== 'dead') {
        const next = a.made >= k.hold ? 'Full: collect to make room.' : (k.feed && a.food <= 0) ? 'Paused while hungry.' : `Next batch in ${FUP.garden.timeText(Math.ceil(k.every - a.grown))} (real time).`;
        fix(ui.text(scene, W / 2, Y + 100, `${prod.emoji} ${a.made} ${k.units} ready (holds ${k.hold}). ${next}`, 13, c.ink, { align: 'center', wordWrap: { width: PW - 50 } }).setOrigin(0.5, 0), 2);
      }
      // The trough
      if (feed && look !== 'dead') {
        fix(ui.text(scene, W / 2, Y + 136, `Trough: ${a.trough}/${k.trough} ${feed.name}  ·  you carry ${run.bagCount(k.feed)}  ·  1 feed = 1 game day`, 13, c.dim, { align: 'center' }).setOrigin(0.5, 0), 2);
        const fh = A.hired() ? `Hollis feeds them from the trough: hired for ${A.daysHired()} more day${A.daysHired() === 1 ? '' : 's'}.` : 'Busy? Hire Hollis the Farmhand (by the fields) to feed them from the trough.';
        fix(ui.text(scene, W / 2, Y + 160, fh, 12, A.hired() ? c.good : c.dim, { align: 'center', wordWrap: { width: PW - 50 } }).setOrigin(0.5, 0), 2);
      }
      if (note) fix(ui.text(scene, W / 2, Y + 200, note, 13, c.accent, { align: 'center', fontStyle: 'italic', wordWrap: { width: PW - 50 } }).setOrigin(0.5, 0), 2);
      // Buttons
      const by = Y + PH - 64;
      if (look === 'dead') {
        const price = A.restockPrice(p);
        btn(X + 30, by, 300, `Get new ${k.who} (${price} 🪙)`, () => {
          const r = A.restock(p);
          if (r === 'ok') { FUP.audio.sfx('coins'); note = `New ${k.who}. Try to keep these ones.`; } else { FUP.audio.sfx('error'); note = 'Not enough coins.'; }
        }, { hot: run.coins >= price, disabled: run.coins < price });
      } else {
        let bx = X + 30;
        if (feed) {
          btn(bx, by, 130, '🌾 Feed', () => {
            const r = A.feed(p, false, where());
            if (r === 'ok') { FUP.audio.sfx('eat'); note = `Fed. That's one game day of not dying.`; }
            else { FUP.audio.sfx('error'); note = r === 'full' ? 'Not hungry yet. Feed them once their food runs out.' : `The trough is empty. Put ${feed.name} in it first.`; }
          }, { hot: a.food <= 0 && a.trough > 0 });
          bx += 140;
          btn(bx, by, 150, '📥 Fill trough', () => {
            const n = A.fill(p);
            if (n) { FUP.audio.sfx('place'); note = `Put ${n} ${feed.name} in the trough.`; }
            else { FUP.audio.sfx('error'); note = a.trough >= k.trough ? 'The trough is full.' : `You have no ${feed.name}. Grow some (Pip sells the seeds).`; }
          });
          bx += 160;
        }
        btn(bx, by, 150, `🧺 Collect ${a.made}`, () => {
          const r = A.collect(p, where());
          if (r && r.got) { FUP.audio.sfx('pickup'); note = r.left ? `Got ${r.got}. Your backpack is full: ${r.left} left.` : `Got ${r.got} ${k.units}.`; }
          else { FUP.audio.sfx('error'); note = a.made ? 'Your backpack is full.' : 'Nothing to collect yet.'; }
        }, { hot: a.made > 0, disabled: !a.made });
      }
      btn(X + PW - 120, by, 90, 'Close', () => g.destroy(), {});
    };
    g.destroy = () => { if (!g.open) return; g.open = false; parts.forEach(o => o.destroy()); parts = []; if (onClose) onClose(); };
    draw();
    return g;
  },
};
