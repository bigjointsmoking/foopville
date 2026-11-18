// ============================================================
// QUEST TRACKER — your taken quests, always on screen (Jesus, 2026-11-18: "make it visible all the time").
// Top right in the village and every outside region (the Forest, the Docks, the Marsh, the raid).
//   FUP.questTracker.draw(scene, y)  → tracker; call tracker.refresh() on a timer
// One line per quest: what to do next (side stories) or progress (challenges).
// ============================================================
window.FUP = window.FUP || {};

FUP.questTracker = {
  draw(scene, y) {
    const ui = FUP.ui, c = ui.colors, W = scene.scale.width, Q = FUP.quests;
    const txt = ui.text(scene, W - 20, y, '', 12, c.ink, { align: 'right', lineSpacing: 3, wordWrap: { width: 330 },
      backgroundColor: FUP.look.hex('k0') + 'cc', padding: { x: 8, y: 5 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(10000);
    const tracker = {
      refresh() {
        const ids = Q.activeIds();
        if (!ids.length || (FUP.tutorial && FUP.tutorial.active())) { txt.setVisible(false); return; }
        const lines = ids.map(id => {
          const q = Q.def(id), ready = Q.complete(id);
          return `${ready ? '✔' : Q.isSide(id) ? '📜' : '⚔️'} ${q.name}: ${ready ? 'hand it in at the board' : Q.progressText(id)}`;
        });
        txt.setText(lines.join('\n')).setVisible(true);
      },
    };
    tracker.refresh();
    return tracker;
  },
};
