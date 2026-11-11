// ============================================================
// FISH TRAPS ON THE MAP — the rings, the 🪤 pictures, and the small trap window.
// Used by the village (pond) and the World screen (the Docks).
//   FUP.trapUi.draw(scene, region, map)    rings + traps (call again to redraw)
//   FUP.trapUi.spots(region, map)          action-button spots, one per trap square
//   FUP.trapUi.use(scene, region, spot)    set a trap, or open the trap window
// `map` = something with center(tx, ty) (FUP.villageMap, FUP.forest).
// Rules in src/systems/fishing.js, numbers in data/fishing.js traps.
// ============================================================
window.FUP = window.FUP || {};

FUP.trapUi = {
  draw(scene, region, map) {
    (scene._trapViews || []).forEach(o => { if (o.active) { scene.tweens.killTweensOf(o); o.destroy(); } });
    scene._trapViews = [];
    const F = FUP.fishing, keep = o => { scene._trapViews.push(o); return o; };
    for (const q of F.trapSquares(region)) {
      const c = map.center(q.tx, q.ty), trap = F.trapAt(region, q.tx, q.ty);
      // A faint ring so you can find the trap squares
      keep(scene.add.circle(c.x, c.y, 15).setStrokeStyle(2, FUP.look.num('b3'), 0.4).setDepth(-3));
      if (!trap) continue;
      keep(scene.add.text(c.x, c.y, '🪤', { fontSize: '22px' }).setOrigin(0.5).setDepth(c.y + 8));
      if (trap.fish.length) {
        const b = keep(FUP.ui.text(scene, c.x + 12, c.y - 12, String(trap.fish.length), 12, FUP.ui.colors.dark, { fontStyle: '700', backgroundColor: FUP.look.hex('y2'), padding: { x: 4, y: 1 } }).setOrigin(0.5).setDepth(5200));
        scene.tweens.add({ targets: b, y: b.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
  },

  // Spots for the action button: only when you stand on (or right next to) the square
  spots(region, map) {
    return FUP.fishing.trapSquares(region).map(q => {
      const c = map.center(q.tx, q.ty), trap = FUP.fishing.trapAt(region, q.tx, q.ty);
      return { kind: 'trap', region, tx: q.tx, ty: q.ty, spot: q.spot, x: c.x, y: c.y, reach: 30, label: trap ? '🪤 Trap' : '🪤 Set trap' };
    });
  },

  // Refresh the labels of trap spots in a scene's spot list (after setting / picking up)
  relabel(list, region) {
    for (const s of list) if (s.kind === 'trap') s.label = FUP.fishing.trapAt(region, s.tx, s.ty) ? '🪤 Trap' : '🪤 Set trap';
  },

  use(scene, region, s, map) {
    const F = FUP.fishing, trap = F.trapAt(region, s.tx, s.ty), redraw = () => { this.draw(scene, region, map); this.relabel(scene.spots || [], region); };
    if (!trap) {
      if (F.trapsFree() <= 0) { scene.say('trapNone'); FUP.audio.sfx('error'); return; }
      F.setTrap(region, s.tx, s.ty, s.spot);
      FUP.audio.sfx('plop');
      // Nothing here you can catch yet (sea fish start at Fishing 10): say so, or it would just sit there
      if (!F.trapFish(s.spot)) {
        const low = Math.min(...Object.keys(FUP.fishData.spots[s.spot].fish).map(id => FUP.fishData.fish[id].level));
        scene.say('fishTooLow', { item: low });
      } else scene.say('trapSet');
      redraw(); FUP.save.write();
      return;
    }
    this.open(scene, trap, redraw);
  },

  // The small window over a set trap: how full, Empty, Add worms, Pick up
  open(scene, trap, redraw) {
    const ui = FUP.ui, c = ui.colors, F = FUP.fishing, W = scene.scale.width, H = scene.scale.height;
    const parts = [], btns = [], fix = (o, d = 0) => { o.setScrollFactor(0).setDepth(17000 + d); parts.push(o); return o; };
    const w = 380, h = 190, x = (W - w) / 2, y = (H - h) / 2;
    const close = () => {
      if (!g.open) return;
      g.open = false;
      btns.forEach(b => b.destroy()); parts.forEach(o => o.destroy());
      if (scene.panel === g) { scene.panel = null; scene.panelId = null; }
      redraw();
      if (scene.refreshHud) scene.refreshHud();
      FUP.save.write();
    };
    const g = { open: true, destroy: close };
    const draw = () => {
      btns.forEach(b => b.destroy()); parts.forEach(o => o.destroy()); btns.length = 0; parts.length = 0;
      fix(ui.shade(scene, 0.45));
      fix(ui.panel(scene, x, y, w, h, 'panel'), 1);
      fix(ui.text(scene, x + 16, y + 12, '🪤 FISH TRAP', 18, c.accent, { fontStyle: '700' }), 2);
      const names = trap.fish.map(id => FUP.ingredients[id].emoji).join(' ');
      fix(ui.text(scene, x + 16, y + 42, `${trap.fish.length} / ${F.trapCap()} fish ${names}`, 15, c.ink), 2);
      fix(ui.text(scene, x + 16, y + 68, trap.bait ? `🪱 ${trap.bait} worms inside: fills faster.` : 'No worms inside. Worms make it fill faster.', 12, c.dim, { wordWrap: { width: w - 32 } }), 2);
      const btn = (bx, label, fn, on) => { const b = ui.button(scene, bx, y + h - 52, 112, 36, label, fn, { size: 13, hot: on }); fix(b.rect, 3); fix(b.txt, 4); btns.push(b); if (!on) b.setEnabled(false); return b; };
      btn(x + 12, 'Empty', () => {
        const moved = F.emptyTrap(trap, scene.xpAt ? scene.xpAt(scene.player.x, scene.player.y) : null);
        if (moved.length) { FUP.audio.sfx('pickup'); scene.say(trap.fish.length ? 'trapFull' : 'trapEmpty', { item: moved.length }); }
        else { FUP.audio.sfx('error'); scene.say('trapFull', { item: 0 }); }
        draw();
      }, trap.fish.length > 0);
      btn(x + 134, `Add worms (${Math.min(5, F.baitCount('worm'))})`, () => { F.baitTrap(trap, 5); FUP.audio.sfx('plop'); draw(); }, F.baitCount('worm') > 0);
      btn(x + 256, 'Pick up', () => { F.pickUpTrap(trap); FUP.audio.sfx('select'); close(); }, trap.fish.length === 0);
      const xb = ui.button(scene, x + w - 46, y + 8, 36, 30, '✖', close, { size: 14 }); fix(xb.rect, 3); fix(xb.txt, 4); btns.push(xb);
    };
    draw();
    scene.panel = g; scene.panelId = 'trap';
    return g;
  },
};
