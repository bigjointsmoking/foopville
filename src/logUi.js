// ============================================================
// COLLECTION LOG WINDOW (E2) — 📖 Log in the backpack. One tab per page (data/log.js),
// a grid of entries: found = picture + name, not found = a grey "?" (tap it for a hint).
// Also draws the "New in your log" pop-up (src/systems/log.js decides when).
// ============================================================
window.FUP = window.FUP || {};

FUP.logUi = {
  // The pop-up: a small card under the top bar of whatever screen is running
  popup(scene, e) {
    const ui = FUP.ui, c = ui.colors, W = scene.scale.width, P = FUP.logData.popup, Z = 32000;
    const text = e.text || P.text.replace('{emoji}', e.emoji || '').replace('{name}', e.name);   // prizes bring their own text
    const t = ui.text(scene, W / 2, 96, text, 16, c.ink, { fontStyle: '700' }).setOrigin(0.5).setScrollFactor(0).setDepth(Z + 1);
    const w = Math.max(220, t.width + 40);
    const box = ui.panel(scene, W / 2 - w / 2, 76, w, 40, 'panel').setScrollFactor(0).setDepth(Z);
    for (const o of [box, t]) { o.setAlpha(0); scene.tweens.add({ targets: o, alpha: 1, duration: 180 }); }
    scene.time.delayedCall(P.seconds * 1000, () => {
      if (!box.scene) return;   // the screen changed: already gone
      scene.tweens.add({ targets: [box, t], alpha: 0, duration: 300, onComplete: () => { box.destroy(); t.destroy(); } });
    });
  },

  // The window. Returns { destroy() }.
  open(scene, onClose) {
    const ui = FUP.ui, c = ui.colors, W = scene.scale.width, H = scene.scale.height, L = FUP.log, D = FUP.logData;
    const Z = 34000, all = [];
    let page = [];
    const fix = (o, d = 0, list = page) => { o.setScrollFactor && o.setScrollFactor(0); o.setDepth && o.setDepth(Z + d); list.push(o); return o; };
    const fixBtn = (b, list = page) => { fix(b.rect, 2, list); fix(b.txt, 3, list); return b; };
    const PW = 780, PH = 520, px = (W - PW) / 2, py = (H - PH) / 2;
    fix(ui.shade(scene, 0.75), 0, all);
    fix(ui.panel(scene, px, py, PW, PH, 'panel'), 1, all);

    const g = { open: true };
    const esc = () => g.destroy();
    g.destroy = () => {
      if (!g.open) return;
      g.open = false;
      scene.input.keyboard.off('keydown-ESC', esc);
      [...page, ...all].forEach(o => o.destroy());
      if (onClose) onClose();
    };
    scene.input.keyboard.on('keydown-ESC', esc);
    scene.events.once('shutdown', () => { g.open = false; scene.input.keyboard.off('keydown-ESC', esc); });
    fixBtn(ui.button(scene, px + PW - 110, py + 12, 94, 32, 'Close', () => g.destroy(), { hot: true, size: 15 }), all);

    let cur = D.pages[0].id, screen = 0, picked = null;
    const draw = () => {
      page.forEach(o => o.destroy());
      page = [];
      const T = L.total();
      fix(ui.text(scene, px + 20, py + 16, `📖 COLLECTION LOG   ${T.got} / ${T.total}  (${T.total ? Math.floor(T.got / T.total * 100) : 0}%)`, 20, c.accent, { fontStyle: '700' }), 2);
      // Tabs: one per page, with how many you've found
      const labels = D.pages.map(p => { const k = L.counts(p.id); return `${p.emoji} ${p.name} ${k.got}/${k.total}`; });
      const tabW = (PW - 40 - (D.pages.length - 1) * 4) / D.pages.length;
      ui.tabs(scene, px + 20, py + 54, labels, D.pages.findIndex(p => p.id === cur), i => { cur = D.pages[i].id; screen = 0; picked = null; draw(); }, { w: tabW, h: 32, size: 12 })
        .forEach(o => fix(o, 2));

      // The grid
      const es = L.entries(cur), per = D.perScreen, screens = Math.max(1, Math.ceil(es.length / per));
      screen = Math.min(screen, screens - 1);
      const cols = 8, size = 64, gapX = (PW - 40 - cols * size) / (cols - 1), rowH = size + 26, gx = px + 20, gy = py + 100;
      es.slice(screen * per, (screen + 1) * per).forEach((e, i) => {
        const x = gx + (i % cols) * (size + gapX), y = gy + Math.floor(i / cols) * rowH;
        const box = fix(ui.slot(scene, x, y, size, picked === e.key), 2);
        if (e.got) {
          const pic = e.sprite && scene.textures.exists(e.sprite)
            ? fix(scene.add.image(x + size / 2, y + size / 2, e.sprite).setScale(ui.artScale ? ui.artScale(1.4) : 1.4), 3)
            : fix(ui.text(scene, x + size / 2, y + size / 2, e.emoji || '❓', 30).setOrigin(0.5), 3);
          if (pic.displayWidth > size - 8) pic.setScale(pic.scaleX * (size - 8) / pic.displayWidth);
        } else fix(ui.text(scene, x + size / 2, y + size / 2, '?', 28, c.dim).setOrigin(0.5).setAlpha(0.45), 3);
        const name = e.got || !e.secret ? e.name : '???';
        fix(ui.text(scene, x + size / 2, y + size + 3, name, 11, e.got ? c.ink : c.dim, { align: 'center', wordWrap: { width: size + gapX - 4 } }).setOrigin(0.5, 0).setAlpha(e.got ? 1 : 0.6), 3);
        box.setInteractive({ useHandCursor: true }).on('pointerdown', () => scene.time.delayedCall(1, () => { picked = e.key; draw(); }));
      });

      // The line at the bottom: what you tapped
      const sel = es.find(e => e.key === picked);
      const nx = L.nextPrize(cur);
      let line = `Next reward: ${nx.page || 'page complete ✔'}${nx.all ? '  ·  Whole log ' + nx.all : ''}\nTap anything to see what it is and where to find it.`;
      if (sel) {
        const name = sel.got || !sel.secret ? sel.name : 'A secret recipe';
        const counted = sel.got && ['creatures', 'fish', 'dishes'].includes(cur) && sel.count > 1 ? ` · ${{ creatures: 'defeated', fish: 'caught', dishes: 'cooked' }[cur]} ${sel.count}` : '';
        line = sel.got ? `${sel.emoji || ''} ${name}  ✔ found${counted}${sel.extra ? ' · ' + sel.extra : ''}` : `${name}: not found yet. ${sel.hint}`;
      }
      fix(ui.text(scene, px + 24, py + PH - 40, line, 14, sel && sel.got ? c.good : c.ink, { wordWrap: { width: PW - 230 } }).setOrigin(0, 0.5), 2);
      if (screens > 1) {
        const by = py + PH - 56;
        fixBtn(ui.button(scene, px + PW - 200, by, 50, 32, '◀', () => { screen--; draw(); }, { size: 15 })).setEnabled(screen > 0);
        fix(ui.text(scene, px + PW - 120, by + 16, `${screen + 1} / ${screens}`, 13, c.dim).setOrigin(0.5), 2);
        fixBtn(ui.button(scene, px + PW - 76, by, 50, 32, '▶', () => { screen++; draw(); }, { size: 15 })).setEnabled(screen < screens - 1);
      }
    };
    draw();
    return g;
  },
};
