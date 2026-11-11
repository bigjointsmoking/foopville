// ============================================================
// YOUR ROOM — the Decorate button at home (phase B2). Purely for looks.
//   FUP.roomUi.open(scene, onClose)  ->  { destroy() }
// A 10x6 room: the top row is the wall (5 spots for wall things), the floor has
// 10 slots of 2x2 for furniture. Tap an empty slot → pick something you own that
// fits. Tap something placed → Move it (then tap a free slot) or Take it back.
// Built fresh every time it opens (Phaser reuses the house screen).
// Rules in src/systems/place.js (zone 'home'), things in data/place.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.roomUi = {
  SQ: 44,   // pixels per room square

  open(scene, onClose) {
    const ui = FUP.ui, c = ui.colors, L = FUP.look, P = FUP.place, Z = 'home', z = P.zone(Z), S = this.SQ;
    const W = scene.scale.width, H = scene.scale.height, DEPTH = 19000;
    const RW = z.w * S, RH = z.h * S, rx = (W - RW) / 2, ry = 96;
    const g = { open: true };
    let parts = [], btns = [], picking = null, moving = null, note = '';
    const fix = (o, d = 0) => { o.setDepth(DEPTH + d); parts.push(o); return o; };
    const btn = (x, y, w, h, label, fn, opts = {}) => { const b = ui.button(scene, x, y, w, h, label, () => { fn(); if (g.open) draw(); }, { size: 13, ...opts }); b.rect.setDepth(DEPTH + 5); b.txt.setDepth(DEPTH + 6); btns.push(b); if (opts.off) b.setEnabled(false); return b; };
    const slotOf = (tx, ty) => z.slots.find(s => tx >= s.tx && tx < s.tx + s.w && ty >= s.ty && ty < s.ty + s.h);
    const fitsHere = s => Object.keys(P.state.owned).filter(id => (P.item(id).zones || []).includes(Z) && P.canPut(id, Z, s.tx, s.ty));

    const draw = () => {
      btns.forEach(b => b.destroy()); parts.forEach(o => o.destroy()); btns = []; parts = [];
      fix(ui.shade(scene, 0.75)).setInteractive();   // nothing behind can be tapped
      fix(ui.panel(scene, 20, 20, W - 40, H - 40, 'panel'), 1);
      fix(ui.text(scene, 40, 34, `🛋️ ${FUP.house.houseName().toUpperCase()}: DECORATE`, 20, c.accent, { fontStyle: '700' }), 2);
      // The room: wall row, floor, slot outlines
      fix(scene.add.rectangle(rx, ry, RW, S, L.num('w2')).setOrigin(0), 2);
      fix(scene.add.rectangle(rx, ry + S, RW, RH - S, L.num('w4')).setOrigin(0), 2);
      fix(scene.add.rectangle(rx, ry, RW, RH).setOrigin(0).setStrokeStyle(4, L.num('k0')), 3);
      for (const s of z.slots) {
        const taken = P.at(Z, s.tx, s.ty), hot = picking === s;
        const col = hot ? L.num('y2') : moving && !taken && P.canPut(P.byUid(moving).item, Z, s.tx, s.ty, moving) ? L.num('g5') : L.num('k3');
        fix(scene.add.rectangle(rx + s.tx * S + 2, ry + s.ty * S + 2, s.w * S - 4, s.h * S - 4).setOrigin(0).setStrokeStyle(2, col, taken ? 0.25 : 0.8), 3);
      }
      for (const p of P.list(Z)) {
        const it = P.item(p.item), cx = rx + (p.tx + it.w / 2) * S, cy = ry + (p.ty + it.h / 2) * S;
        fix(ui.sprite(scene, cx, cy, 'place_' + p.item, it.emoji, Math.round(S * Math.min(it.w, it.h) * 0.8)), 4);
        if (moving === p.uid) fix(scene.add.rectangle(rx + p.tx * S, ry + p.ty * S, it.w * S, it.h * S).setOrigin(0).setStrokeStyle(3, L.num('y2')), 5);
      }
      // A big invisible tap area over the room
      const hit = fix(scene.add.rectangle(rx, ry, RW, RH, 0x000000, 0.001).setOrigin(0), 7).setInteractive();
      hit.on('pointerdown', ptr => tap(Math.floor((ptr.x - rx) / S), Math.floor((ptr.y - ry) / S)));

      // Below the room: what to do now
      const by = ry + RH + 18;
      const help = moving ? `${P.item(P.byUid(moving).item).name}: tap a free slot to move it there.`
        : picking ? (picking.fits.includes('wall') ? 'Pick something for the wall:' : 'Pick something for this spot:')
        : 'Tap an empty slot to put something there. Tap a placed thing to move it or take it back.';
      fix(ui.text(scene, 40, by, note || help, 13, note ? c.bad : c.dim, { wordWrap: { width: W - 80 } }), 2);
      if (picking) {
        const ids = fitsHere(picking);
        ids.slice(0, 5).forEach((id, i) => btn(40 + i * 160, by + 28, 152, 34, `${P.item(id).emoji} ${P.item(id).name} x${P.ownedCount(id)}`, () => {
          if (P.put(id, Z, picking.tx, picking.ty)) FUP.audio.sfx('guard');
          picking = null;
        }, { size: 12 }));
        if (!ids.length) fix(ui.text(scene, 40, by + 34, 'You own nothing that fits here. Planksworth the Carpenter sells furniture (Build tab).', 13, c.ink), 2);
        btn(W - 160, by + 76, 120, 32, 'Cancel', () => { picking = null; });
      } else if (moving) {
        btn(40, by + 28, 140, 34, '↩ Take back', () => { P.take(moving); moving = null; FUP.audio.sfx('pickup'); });
        btn(190, by + 28, 110, 34, 'Cancel', () => { moving = null; });
      }
      btn(W - 150, 30, 110, 34, '✖ Done', () => g.destroy(), { hot: true });
    };

    const tap = (tx, ty) => {
      note = '';
      const s = slotOf(tx, ty), p = P.at(Z, tx, ty);
      if (moving) {
        if (p && p.uid !== moving) { moving = p.uid; FUP.audio.sfx('click'); }
        else if (s && P.move(moving, s.tx, s.ty)) { FUP.audio.sfx('guard'); moving = null; }
        else { note = "It doesn't fit there."; FUP.audio.sfx('error'); }
      } else if (p) { moving = p.uid; picking = null; FUP.audio.sfx('click'); }
      else if (s) { picking = s; FUP.audio.sfx('click'); }
      draw();
    };

    g.destroy = () => {
      if (!g.open) return;
      g.open = false;
      btns.forEach(b => b.destroy()); parts.forEach(o => o.destroy());
      FUP.save.write();
      if (onClose) onClose();
    };
    scene.events.once('shutdown', () => { g.open = false; });
    draw();
    if (scene.say) scene.say('decorateOpen');
    return g;
  },
};
