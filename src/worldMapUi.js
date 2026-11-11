// ============================================================
// WORLD MAP WINDOW — the 🗺️ button in the village and out in the world.
//   FUP.worldMapUi.open(scene, onClose)  ->  { destroy() }
// One box per region you know about (FUP.world.boxes()), placed by its map box
// (data/world.js), with lines between linked regions. Tap a box for its details.
// No travelling from here: it's a map, not a taxi. Colours/sizes: data/look.js worldMap.
// ============================================================
window.FUP = window.FUP || {};

FUP.worldMapUi = {
  open(scene, onClose) {
    const ui = FUP.ui, c = ui.colors, L = FUP.look.worldMap, B = L.box, Wd = FUP.world;
    const W = scene.scale.width, H = scene.scale.height, DEPTH = 20000;
    const parts = [], btns = [];
    const fix = (o, d = 1) => { o.setScrollFactor(0).setDepth(DEPTH + d); parts.push(o); return o; };
    const boxes = Wd.boxes();
    const cols = boxes.map(b => b.col), rows = boxes.map(b => b.row);
    const c0 = Math.min(...cols), c1 = Math.max(...cols), r0 = Math.min(...rows), r1 = Math.max(...rows);
    const gridW = (c1 - c0 + 1) * B.w + (c1 - c0) * B.gap, gridH = (r1 - r0 + 1) * B.h + (r1 - r0) * B.gap;
    const pw = Math.min(W - 32, Math.max(420, gridW + 48)), ph = Math.min(H - 32, gridH + 160);
    const px = (W - pw) / 2, py = (H - ph) / 2;
    const gx = px + (pw - gridW) / 2, gy = py + 56;
    const at = b => ({ x: gx + (b.col - c0) * (B.w + B.gap), y: gy + (b.row - r0) * (B.h + B.gap) });

    fix(ui.shade(scene, 0.6), 0).setInteractive();   // swallow taps behind the window
    fix(ui.panel(scene, px, py, pw, ph, 'panel'));
    fix(ui.text(scene, px + 16, py + 14, '🗺️ WORLD MAP', 18, c.accent, { fontStyle: '700' }));

    // Lines between linked regions (under the boxes)
    const g = fix(scene.add.graphics(), 2);
    g.lineStyle(3, FUP.look.num(L.line), 0.8);
    for (const [a, b] of Wd.lines(boxes)) {
      const A = at(boxes.find(x => x.id === a)), Bp = at(boxes.find(x => x.id === b));
      g.lineBetween(A.x + B.w / 2, A.y + B.h / 2, Bp.x + B.w / 2, Bp.y + B.h / 2);
    }

    // Details of the box you tapped (starts on where you are)
    const info = fix(ui.text(scene, px + 16, py + ph - 92, '', 13, c.ink, { wordWrap: { width: pw - 32 }, lineSpacing: 3 }), 4);
    const detail = b => {
      const r = Wd.region(b.id);
      if (!b.known) { info.setText(`??? · somewhere you haven't been.\n${b.lock.join('\n')}`).setColor(c.dim); return; }
      const band = b.band ? `Melee ${b.band[0]}-${b.band[1]}` : 'Safe';
      info.setText(`${b.name}${b.here ? '  (you are here)' : ''}\n${band}${r.kind === 'danger' ? ' · enemies, foraging, a campfire' : ''}`).setColor(c.ink);
    };

    for (const b of boxes) {
      const p = at(b), col = b.here ? L.here : b.known ? L.seen : b.lock.length ? L.locked : L.unseen;
      const box = fix(scene.add.rectangle(p.x, p.y, B.w, B.h, FUP.look.num(col), b.known ? 1 : 0.7).setOrigin(0).setStrokeStyle(3, FUP.look.num('k0')), 3);
      const ink = b.here ? c.dark : c.ink;
      fix(ui.text(scene, p.x + B.w / 2, p.y + 18, b.name, 13, ink, { fontStyle: '700', align: 'center', wordWrap: { width: B.w - 10 } }).setOrigin(0.5), 4);
      const sub = b.here ? 'You are here' : b.known ? (b.band ? `Lv ${b.band[0]}-${b.band[1]}` : 'safe') : b.lock.length ? '🔒' : '';
      fix(ui.text(scene, p.x + B.w / 2, p.y + 44, sub, 12, b.here ? c.dark : c.dim, { align: 'center' }).setOrigin(0.5), 4);
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => { FUP.audio.sfx('click'); detail(b); });
    }
    detail(boxes.find(b => b.here) || boxes[0]);

    const close = () => {
      if (!h.open) return;
      h.open = false;
      btns.forEach(b => b.destroy()); parts.forEach(o => o.destroy());
      if (onClose) onClose();
    };
    const x = ui.button(scene, px + pw - 52, py + 10, 40, 32, '✖', close, { size: 16 });
    for (const o of [x.rect, x.txt]) { o.setScrollFactor(0).setDepth(DEPTH + 5); }
    btns.push(x);
    const h = { open: true, destroy: close };
    return h;
  },
};
