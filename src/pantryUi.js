// ============================================================
// PANTRY WINDOW — move ingredients between your backpack and the pantry at home.
//   FUP.pantryUi.open(scene, onClose)  ->  { destroy() }
// Used by the pantry shelf in your house (HouseScene) and the cooking screen at home.
// Rules in src/systems/house.js. Built fresh every time it opens.
// ============================================================
window.FUP = window.FUP || {};

FUP.pantryUi = {
  open(scene, onClose) {
    const ui = FUP.ui, c = ui.colors, run = FUP.run, H = FUP.house, W = scene.scale.width, Hh = scene.scale.height, Z = 19000;
    const g = { open: true };
    let parts = [];
    const add = (o, d = 1) => { if (o.setScrollFactor) o.setScrollFactor(0); o.setDepth(Z + d); parts.push(o); return o; };
    const btn = (x, y, w, h, label, fn, opts = {}) => {
      const b = ui.button(scene, x, y, w, h, label, () => { fn(); if (g.open) draw(); }, { size: 13, ...opts });
      b.rect.setScrollFactor(0).setDepth(Z + 2); b.txt.setScrollFactor(0).setDepth(Z + 3); parts.push(b);
      if (opts.disabled) b.setEnabled(false);
      return b;
    };
    const draw = () => {
      parts.forEach(o => o.destroy()); parts = [];
      add(ui.shade(scene, 0.75), 0).setInteractive();   // nothing behind can be tapped
      add(ui.panel(scene, 20, 20, W - 40, Hh - 40, 'panel'));
      add(ui.text(scene, 40, 34, `🗄️ ${H.current('pantries').name.toUpperCase()}`, 22, c.accent, { fontStyle: '700' }));
      btn(W - 136, 30, 96, 32, 'Close', () => g.destroy(), { size: 15, hot: true });
      const bagFull = run.freeSlots() <= 0;
      add(ui.text(scene, 40, 70, `Backpack ${run.slotsUsed()}/${run.packMax()} slots     Pantry ${H.pantryTotal()}/${H.pantryMax()}     (the pantry stays at home; take things out to cook or carry them)`, 13, bagFull || H.pantryFull() ? c.bad : c.dim));
      const ids = Object.keys(FUP.ingredients).filter(id => run.bagCount(id) > 0 || H.pantryCount(id) > 0);
      if (!ids.length) add(ui.text(scene, 40, 110, 'Nothing in your bag or the pantry. The shelves echo.', 15, c.dim));
      add(ui.text(scene, 330, 98, 'BAG', 12, c.dim, { fontStyle: '700' }).setOrigin(0.5, 0));
      add(ui.text(scene, 690, 98, 'PANTRY', 12, c.dim, { fontStyle: '700' }).setOrigin(0.5, 0));
      ids.forEach((id, i) => {
        const y = 118 + i * 46, ing = FUP.ingredients[id], inBag = run.bagCount(id), inP = H.pantryCount(id);
        add(ui.panel(scene, 36, y, W - 72, 40, 'inset'));
        add(ui.sprite(scene, 58, y + 20, ui.ingKey(id), ing.emoji, 18, 1.4));
        add(ui.text(scene, 82, y + 11, ing.name, 14, c.ink, { fontStyle: '700' }));
        add(ui.text(scene, 330, y + 20, `x${inBag}`, 15, inBag ? c.accent : c.dim, { fontStyle: '700' }).setOrigin(0.5));
        btn(380, y + 6, 110, 28, 'Store all →', () => H.store(id, 99), { disabled: !inBag || H.pantryFull() });
        btn(496, y + 6, 90, 28, 'Store 1 →', () => H.store(id, 1), { disabled: !inBag || H.pantryFull() });
        add(ui.text(scene, 690, y + 20, `x${inP}`, 15, inP ? c.accent : c.dim, { fontStyle: '700' }).setOrigin(0.5));
        btn(724, y + 6, 66, 28, '← 1', () => H.take(id, 1), { disabled: !inP || bagFull });
        btn(796, y + 6, 66, 28, '← all', () => H.take(id, 99), { disabled: !inP || bagFull });
      });
    };
    g.destroy = () => {
      if (!g.open) return;
      g.open = false;
      parts.forEach(o => o.destroy()); parts = [];
      FUP.save.write();
      if (onClose) onClose();
    };
    scene.events.once('shutdown', () => { g.open = false; });
    draw();
    return g;
  },
};
