// ============================================================
// "WHILE YOU WERE OUT" — one card when you arrive in the village, listing
// what's waiting for you: ripe or thirsty crops, fish in your traps, your
// stall's till, your grave. Shown only when something changed since the last card.
//   FUP.awayCard.lines()     [{ emoji, text }] (empty = nothing to say)
//   FUP.awayCard.show(scene) called at the end of VillageScene.create()
// Every source is checked with "if that system exists", so later phases
// (daily orders, the market, village events) just add a line here.
// ============================================================
window.FUP = window.FUP || {};

FUP.awayCard = {
  graceSeconds: 60,   // never in the first minute of a new life

  lines() {
    const out = [], add = (emoji, text) => out.push({ emoji, text }), pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const G = FUP.garden;
    if (G && G.readyCount) {
      const ready = G.readyCount(), thirsty = G.thirstyCount();
      if (ready) add('✨', `${pl(ready, 'crop is', 'crops are')} ready to harvest.`);
      if (thirsty) add('🥀', `${pl(thirsty, 'crop needs', 'crops need')} water.`);
    }
    const F = FUP.fishing;
    if (F && F.trapFishTotal) { const n = F.trapFishTotal(); if (n) add('🪤', `${pl(n, 'fish is', 'fish are')} waiting in your traps.`); }
    const S = FUP.stall;
    if (S && S.placed) for (const p of S.placed()) {
      const st = S.get(p.uid);
      if (st.till > 0) add('🪙', `Your stall has ${st.till} coins in the till.`);
      else if (!st.stock.length) add('💤', 'Your stall is out of food.');
    }
    const R = FUP.grave;
    if (R && R.active && R.active()) add('🪦', R.hudText().replace('🪦 ', '') + ' left.');
    // Later phases: daily orders (V2), the market (R2), village events (V3)
    if (FUP.quests && FUP.quests.dailyLine) { const l = FUP.quests.dailyLine(); if (l) add('📜', l); }
    if (FUP.repairs && FUP.repairs.marketLine) { const l = FUP.repairs.marketLine(); if (l) add('🏬', l); }
    if (FUP.events && FUP.events.activeLine) { const l = FUP.events.activeLine(); if (l) add('🎪', l); }
    return out;
  },

  signature(lines = this.lines()) { return lines.map(l => l.text).join('|'); },
  lastShown() { return (FUP.clock.state.timers || {}).awayCard || ''; },

  // Should the card show now? (something to say, it's new, and not in the first minute of a life)
  due(lines = this.lines()) {
    if (FUP.clock.now() < this.graceSeconds) return false;
    const sig = this.signature(lines);
    return !!sig && sig !== this.lastShown();
  },

  show(scene) {
    const lines = this.lines();
    if (!this.due(lines) || scene.panel) return null;
    FUP.clock.state.timers.awayCard = this.signature(lines);   // remembered in the save: no repeat after a reload
    const ui = FUP.ui, c = ui.colors, W = scene.scale.width, H = scene.scale.height, parts = [];
    const fix = (o, d = 0) => { o.setScrollFactor(0).setDepth(18000 + d); parts.push(o); return o; };
    const w = 440, h = 92 + lines.length * 34, x = (W - w) / 2, y = Math.max(70, (H - h) / 2);
    const close = () => {
      if (!g.open) return;
      g.open = false;
      parts.forEach(o => o.destroy());
      if (scene.panel === g) { scene.panel = null; scene.panelId = null; }
      if (scene.say) scene.say('awayCard');
    };
    const g = { open: true, destroy: close };
    fix(ui.shade(scene, 0.5)).setInteractive().on('pointerdown', close);
    fix(ui.panel(scene, x, y, w, h, 'panel'), 1).setInteractive().on('pointerdown', close);
    fix(ui.text(scene, W / 2, y + 16, 'WHILE YOU WERE OUT', 20, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
    lines.forEach((l, i) => fix(ui.text(scene, x + 24, y + 52 + i * 34, `${l.emoji}  ${l.text}`, 15, c.ink, { wordWrap: { width: w - 48 } }), 2));
    fix(ui.text(scene, W / 2, y + h - 22, 'Tap anywhere to close', 12, c.dim).setOrigin(0.5), 2);
    scene.panel = g; scene.panelId = 'away';
    return g;
  },
};
