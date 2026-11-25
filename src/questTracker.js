// ============================================================
// QUEST TRACKER — your taken quests, always on screen (Jesus, 2026-11-18: "make it visible all the time").
// Top right in the village and every outside region (the Forest, the Docks, the Marsh, the raid).
//   FUP.questTracker.draw(scene, y)  → tracker; call tracker.refresh() on a timer
// (v1.18, Jesus: "looks ugly and crammed") A tidy box: a 📜 QUESTS (n) header, then each quest's
// name with its next step under it, smaller and dimmer, shortened so nothing wraps.
// Tap the header to fold it down to the header alone (remembered while you play, not saved).
// ============================================================
window.FUP = window.FUP || {};

FUP.questTracker = {
  folded: false,
  W: 270,           // box width in pixels
  NAME_MAX: 32,     // characters before a name gets "…"
  STEP_MAX: 40,     // characters before a next step gets "…"

  cut(s, n) { return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; },

  draw(scene, y) {
    const self = this, ui = FUP.ui, c = ui.colors, Q = FUP.quests, BW = this.W;
    let parts = [], sig = null;
    const x0 = () => scene.scale.width - 20 - BW;
    const fix = (o, d = 0) => { o.setScrollFactor(0).setDepth(10000 + d); parts.push(o); return o; };

    const build = (rows) => {
      parts.forEach(o => o.destroy()); parts = [];
      if (!rows) return;
      const X = x0(), PAD = 10;
      let yy = y + PAD;
      const lines = [];
      const head = ui.text(scene, X + PAD, yy, `📜 QUESTS (${rows.length})`, 13, c.accent, { fontStyle: '700' });
      const arrow = ui.text(scene, X + BW - PAD, yy, self.folded ? '▸' : '▾', 13, c.accent, { fontStyle: '700' }).setOrigin(1, 0);
      lines.push(head, arrow);
      yy += 20;
      if (!self.folded) {
        for (const r of rows) {
          yy += 4;
          lines.push(ui.text(scene, X + PAD, yy, self.cut(r.name, self.NAME_MAX), 12, r.ready ? c.good : c.ink, { fontStyle: '700' }));
          yy += 16;
          lines.push(ui.text(scene, X + PAD + 12, yy, self.cut(r.step, self.STEP_MAX), 11, r.ready ? c.good : c.dim));
          yy += 15;
        }
      }
      const h = yy - y + PAD - 2;
      const bg = fix(scene.add.graphics(), 0);
      bg.fillStyle(FUP.look.num('k0'), 0.82).fillRoundedRect(X, y, BW, h, 6);
      bg.lineStyle(1, FUP.look.num('k3'), 0.7).strokeRoundedRect(X + 0.5, y + 0.5, BW - 1, h - 1, 6);
      lines.forEach(o => fix(o, 1));
      // Tap anywhere on the header line to fold / unfold (an invisible hit box over it)
      const hit = fix(scene.add.rectangle(X, y, BW, 30, 0x000000, 0).setOrigin(0), 2);
      hit.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        self.folded = !self.folded; FUP.audio.sfx('click'); sig = null; tracker.refresh();
      });
    };

    const tracker = {
      refresh() {
        const ids = Q.activeIds();
        const off = !ids.length || (FUP.tutorial && FUP.tutorial.active());
        const rows = off ? null : ids.map(id => {
          const q = Q.def(id), ready = Q.complete(id);
          return { name: (ready ? '✔ ' : '') + q.name, step: ready ? 'Hand it in at the board' : Q.progressText(id), ready };
        });
        const now = JSON.stringify([rows, self.folded, scene.scale.width]);
        if (now === sig) return;   // nothing changed: don't redraw
        sig = now;
        build(rows);
      },
    };
    scene.events.once('shutdown', () => { parts.forEach(o => o.destroy()); parts = []; });
    tracker.refresh();
    return tracker;
  },
};
