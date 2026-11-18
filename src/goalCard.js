// ============================================================
// FIRST-DAY GOALS CARD — top left in the village (data/goals.js).
//   FUP.goals.state      { closed } (save part 'goals')
//   FUP.goals.show()     should the card be on screen?
//   FUP.goalCard.draw(scene, x, y)   draws it; call card.refresh() on a timer
// ============================================================
window.FUP = window.FUP || {};

FUP.goals = {
  state: { closed: false },
  reset() { this.state = { closed: false }; },
  done(g) { return FUP.facts.has(g.fact); },
  left() { return FUP.goalData.list.filter(g => !this.done(g)).length; },
  show() { return !this.state.closed && this.left() > 0 && !(FUP.tutorial && FUP.tutorial.active()); },
  close() { this.state.closed = true; },
};

FUP.goalCard = {
  draw(scene, x, y) {
    const ui = FUP.ui, c = ui.colors, D = FUP.goalData, W = 270;
    const fix = o => o.setScrollFactor(0).setDepth(10000);
    const parts = [];
    const panel = fix(ui.panel(scene, x, y, W, 30 + D.list.length * 20, 'hud')); parts.push(panel);
    parts.push(fix(ui.text(scene, x + 12, y + 8, D.title, 13, c.accent, { fontStyle: '700' })));
    const lines = D.list.map((g, i) => { const t = fix(ui.text(scene, x + 12, y + 28 + i * 20, '', 12, c.ink, { wordWrap: { width: W - 24 }, maxLines: 1 })); parts.push(t); return t; });
    const shut = ui.button(scene, x + W - 30, y + 4, 24, 22, '✕', () => { FUP.goals.close(); FUP.save.write(); card.refresh(); }, { size: 12 });
    for (const o of [shut.rect, shut.txt]) { o.setScrollFactor(0).setDepth(10001); parts.push(o); }
    shut.txt.setDepth(10002);
    const card = {
      wasLeft: FUP.goals.left(),
      refresh() {
        const on = FUP.goals.show();
        parts.forEach(o => o.setVisible(on));
        D.list.forEach((g, i) => { const ok = FUP.goals.done(g); lines[i].setText((ok ? '✅ ' : '⬜ ') + g.text).setColor(ok ? c.dim : c.ink); });
        const left = FUP.goals.left();
        if (left === 0 && this.wasLeft > 0 && scene.sayLine) scene.sayLine(D.doneLine);   // the last goal just ticked
        this.wasLeft = left;
      },
    };
    card.refresh();
    return card;
  },
};
