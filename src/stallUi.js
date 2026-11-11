// ============================================================
// FOOD STALL WINDOW + the little signs over stalls on the map.
//   FUP.stallUi.open(scene, uid, onClose)  ->  { destroy() }   (the window)
//   FUP.stallUi.marks(scene, region)       🪙 over a stall with coins in the till, 💤 over an empty one
// Rules in src/systems/stall.js, numbers in data/stall.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.stallUi = {
  marks(scene, region, tile = FUP.villageData.tileSize) {
    (scene._stallMarks || []).forEach(o => { if (o.active) { scene.tweens.killTweensOf(o); o.destroy(); } });
    scene._stallMarks = [];
    for (const p of FUP.stall.placed()) {
      if (FUP.place.zone(p.zone).where.region !== region) continue;
      const s = FUP.stall.get(p.uid), b = FUP.buildUi.box(p, tile);
      const sign = s.till > 0 ? '🪙' : !s.stock.length ? '💤' : '';
      if (!sign) continue;
      const m = scene.add.text(b.x + b.w / 2, b.y - 6, sign, { fontSize: '20px' }).setOrigin(0.5, 1).setDepth(5200);
      scene.tweens.add({ targets: m, y: m.y - 5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene._stallMarks.push(m);
    }
  },

  open(scene, uid, onClose) {
    const ui = FUP.ui, c = ui.colors, S = FUP.stall, run = FUP.run;
    const W = scene.scale.width, H = scene.scale.height, DEPTH = 20000;
    const g = { open: true };
    let parts = [], note = '';
    const fix = (o, d = 1) => { o.setScrollFactor(0).setDepth(DEPTH + d); parts.push(o); return o; };
    const say = (cat) => { if (scene.say) scene.say(cat); };
    const btn = (x, y, w, h, label, fn, opts = {}) => {
      const b = ui.button(scene, x, y, w, h, label, () => { fn(); if (g.open) draw(); }, { size: 13, ...opts });
      fix(b.rect, 2); fix(b.txt, 3);
      if (opts.disabled) b.setEnabled(false);
      return b;
    };
    const stars = d => `${d.name}${d.tier ? ` (${d.tier})` : ''}`;

    const draw = () => {
      parts.forEach(o => o.destroy()); parts = [];
      const s = S.get(uid), tier = S.tier(uid), next = S.nextTier(uid);
      fix(ui.shade(scene, 0.72), 0);
      fix(ui.panel(scene, 20, 20, W - 40, H - 40, 'panel'));
      fix(ui.text(scene, 40, 34, `🏪 ${tier.name.toUpperCase()}`, 20, c.accent, { fontStyle: '700' }), 2);
      fix(ui.text(scene, 40, 62, `Sells one dish every ${Math.round(S.seconds(uid) / 6) / 10} min of play, for ${Math.round((FUP.stallData.premium + FUP.unlocks.perkSum('stallPremium') - 1) * 100)}% more than the Shopkeeper pays. It only sells while you play.`, 12, c.dim, { wordWrap: { width: W - 480 } }), 2);
      btn(W - 136, 32, 96, 34, 'Close', () => g.destroy(), { hot: true, size: 15 });
      // The till
      fix(ui.text(scene, W - 300, 40, `Till: ${s.till} / ${S.tillCap(uid)} 🪙`, 16, s.till >= S.tillCap(uid) ? c.bad : c.ink, { fontStyle: '700' }).setOrigin(1, 0), 2);
      btn(W - 290, 32, 140, 34, `Collect ${s.till} 🪙`, () => { if (S.collect(uid)) { FUP.audio.sfx('coins'); say('stallCollect'); } }, { hot: s.till > 0, disabled: !s.till, size: 14 });

      // Left: what's on the counter (tap = back to your backpack)
      const LX = 40, RX = W / 2 + 10, CW = W / 2 - 60, top = 100, rowH = 25;
      fix(ui.text(scene, LX, top, `ON THE COUNTER  ${s.stock.length}/${S.cap(uid)}`, 14, c.accent, { fontStyle: '700' }), 2);
      if (!s.stock.length) fix(ui.text(scene, LX, top + 26, FUP.narrator.stallEmpty[0], 13, c.dim, { fontStyle: 'italic' }), 2);
      s.stock.forEach((d, i) => {
        btn(LX, top + 24 + i * rowH, CW, rowH - 3, `${stars(d)}  ·  sells for ${S.salePrice(d)} 🪙`, () => {
          if (!S.remove(uid, i)) { note = 'No room in your backpack.'; FUP.audio.sfx('error'); } else note = '';
        }, { size: 12 });
      });

      // Right: dishes in your backpack (tap = onto the counter)
      fix(ui.text(scene, RX, top, 'YOUR BACKPACK', 14, c.accent, { fontStyle: '700' }), 2);
      const stacks = run.dishStacks(), full = s.stock.length >= S.cap(uid);
      if (!stacks.length) fix(ui.text(scene, RX, top + 26, 'No dishes on you. Cook some at home.', 13, c.dim), 2);
      stacks.slice(0, 14).forEach((st, i) => {
        const ok = S.accepts(st.dish);
        btn(RX, top + 24 + i * rowH, CW, rowH - 3, `${stars(st.dish)} x${st.n}${ok ? `  ·  ${S.salePrice(st.dish)} 🪙` : '  ·  nobody buys this'}`, () => {
          if (full) { note = ''; say('stallFull'); FUP.audio.sfx('error'); return; }
          if (S.add(uid, run.satchel[st.idx[0]])) { note = ''; FUP.audio.sfx('click'); }
        }, { size: 12, disabled: !ok || full });
      });

      // Bottom: the next upgrade
      const by = H - 92;
      if (note) fix(ui.text(scene, LX, by - 22, note, 13, c.bad), 2);
      if (next) {
        const missing = FUP.req.missing(next.req), price = FUP.req.coinPrice(S.upgradeCost(uid), { npc: 'carpenter' });
        fix(ui.text(scene, LX, by, `Next: ${next.name}. ${next.blurb}`, 14, c.ink, { fontStyle: '700' }), 2);
        fix(ui.text(scene, LX, by + 22, missing.length ? `Needs: ${missing.join(', ')}` : `Cost: ${FUP.req.costText({ ...next.cost, coins: price })}`, 13, missing.length ? c.bad : c.dim), 2);
        btn(W - 190, by, 150, 38, 'Upgrade', () => {
          const r = S.upgrade(uid);
          if (r === 'ok') { FUP.audio.sfx('fanfare'); note = ''; } else { FUP.audio.sfx('error'); note = r === 'broke' ? "You can't afford that yet." : ''; }
        }, { hot: true, disabled: missing.length > 0 || !FUP.req.canPay(S.upgradeCost(uid), { npc: 'carpenter' }), size: 15 });
      } else fix(ui.text(scene, LX, by + 8, 'Fully upgraded. It is the finest stall in a village with one stall.', 14, c.good), 2);
    };

    g.destroy = () => {
      if (!g.open) return;
      g.open = false;
      parts.forEach(o => o.destroy());
      if (onClose) onClose();
    };
    scene.events.once('shutdown', () => { g.open = false; });
    draw();
    FUP.audio.sfx('select');
    return g;
  },
};
