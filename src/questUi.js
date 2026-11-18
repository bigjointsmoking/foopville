// ============================================================
// QUEST SCREENS (v0.79): the bits of quests you see, shared by the village and every World region.
//   FUP.questUi.result(scene, id, r, onDone)   show what a step did: a line, a choice card, or QUEST COMPLETE
//   FUP.questUi.choices(scene, id, line, onDone)  the choice card (some choices need Rizz)
//   FUP.questUi.complete(scene, r)              the QUEST COMPLETE card (rewards)
//   FUP.questUi.spots(region, center)           🔍 action spots for this map's quest searches
//   FUP.questUi.marks(scene, region, center, npcs)  draws 🔍 on search squares and ❗ / 📜 over villagers
// Rules: src/systems/quests.js. Quests: data/questlines.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.questUi = {
  // A step happened: say its line, then a choice card or the quest-complete card if needed
  result(scene, id, r, onDone = () => {}) {
    if (!r) return;
    if (r.line && scene.sayLine) scene.sayLine(r.line);
    if (r.choices) { this.choices(scene, id, r.line, onDone); return; }
    if (r.reward) { this.complete(scene, r.reward, r.done); onDone(); return; }
    if (r.coins && scene.sayLine) scene.sayLine(`${r.line ? r.line + '  ' : ''}(Done: ${r.done}. +${r.coins} coins.)`);
    const news = FUP.quests.takeNews();   // things a step handed you (seeds, the jar, the bowl)
    if (r.ok && !r.coins) { const next = FUP.quests.state.active[id] && FUP.quests.stepText(id); if (next || news.length) this.toast(scene, [...news, next ? `📜 ${FUP.quests.def(id).name}: ${next}` : ''].filter(Boolean).join('\n')); }
    FUP.audio.sfx(r.coins ? 'fanfare' : r.ok ? 'select' : 'click');
    onDone();
  },

  // A short note under the top bar (quest updated)
  toast(scene, text) {
    const ui = FUP.ui, W = scene.scale.width;
    const t = ui.text(scene, W / 2, 112, text, 14, ui.colors.accent, { fontStyle: '700', backgroundColor: FUP.look.hex('k0') + 'dd', padding: { x: 10, y: 5 }, wordWrap: { width: 560 }, align: 'center' })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(25000);
    scene.tweens.add({ targets: t, alpha: 0, delay: 3200, duration: 600, onComplete: () => t.destroy() });
  },

  // The choice card: what was said, then one button per choice
  choices(scene, id, line, onDone = () => {}) {
    const ui = FUP.ui, c = ui.colors, W = scene.scale.width, H = scene.scale.height, Z = 26000, q = FUP.quests.def(id);
    const g = [], add = (o, d = 0) => { o.setScrollFactor && o.setScrollFactor(0); o.setDepth && o.setDepth(Z + d); g.push(o); return o; };
    const close = () => { g.forEach(o => o.destroy()); scene.questCard = null; };
    scene.questCard = { close };
    const list = FUP.quests.choiceList(id);
    const st = FUP.quests.step(id), tasting = !!(st && st.taste && !FUP.quests.state.active[id].tasted);   // Grandmother's Soup: pick a bowl, or not now
    if (!list.length) { onDone(); return; }   // (no bowls left to taste)
    const h = 150 + (list.length + (tasting ? 1 : 0)) * 46;
    add(ui.shade(scene, 0.6));
    add(ui.panel(scene, W / 2 - 260, H / 2 - h / 2, 520, h, 'panel'), 1);
    add(ui.text(scene, W / 2, H / 2 - h / 2 + 16, `📜 ${q.name}`, 18, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
    add(ui.text(scene, W / 2, H / 2 - h / 2 + 46, line || '', 14, c.ink, { fontStyle: 'italic', align: 'center', wordWrap: { width: 470 }, lineSpacing: 3 }).setOrigin(0.5, 0), 2);
    list.forEach((ch, k) => {
      const b = ui.button(scene, W / 2 - 230, H / 2 - h / 2 + 110 + k * 46, 460, 38, ch.label, () => {
        const r = FUP.quests.choose(id, ch.i);
        close();
        if (r.retry) { if (scene.sayLine) scene.sayLine(r.line); FUP.audio.sfx('error'); FUP.save.write(); this.choices(scene, id, r.line, onDone); return; }
        FUP.save.write();
        this.result(scene, id, r, onDone);
      }, { size: 14, hot: k === 0 });
      [b.rect, b.txt].forEach(o => add(o, 3)); b.txt.setDepth(Z + 4);
      if (!ch.ok) b.setEnabled(false);
    });
    if (tasting) {
      const b = ui.button(scene, W / 2 - 230, H / 2 - h / 2 + 110 + list.length * 46, 460, 38, 'Not now', () => { close(); onDone(); }, { size: 14 });
      [b.rect, b.txt].forEach(o => add(o, 3)); b.txt.setDepth(Z + 4);
    }
  },

  // QUEST COMPLETE: what you got
  complete(scene, rw, name) {
    const ui = FUP.ui, c = ui.colors, W = scene.scale.width, H = scene.scale.height, Z = 27000;
    const g = [], add = (o, d = 0) => { o.setScrollFactor && o.setScrollFactor(0); o.setDepth && o.setDepth(Z + d); g.push(o); return o; };
    const lines = [`🪙 ${rw.coins} coins`, ...rw.got];   // one per line
    const h = 170 + lines.length * 22 + rw.lines.length * 40;
    add(ui.shade(scene, 0.7));
    add(ui.panel(scene, W / 2 - 240, H / 2 - h / 2, 480, h, 'panel'), 1);
    add(ui.text(scene, W / 2, H / 2 - h / 2 + 18, 'QUEST COMPLETE!', 26, c.accent, { fontStyle: '700', stroke: c.stroke, strokeThickness: 5 }).setOrigin(0.5, 0), 2);
    add(ui.text(scene, W / 2, H / 2 - h / 2 + 58, name, 18, c.ink, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
    add(ui.text(scene, W / 2, H / 2 - h / 2 + 92, lines.join('\n'), 15, c.good, { align: 'center', lineSpacing: 6 }).setOrigin(0.5, 0), 2);
    if (rw.lines.length) add(ui.text(scene, W / 2, H / 2 - h / 2 + 100 + lines.length * 22, rw.lines.join('\n'), 13, c.info, { fontStyle: 'italic', align: 'center', wordWrap: { width: 430 } }).setOrigin(0.5, 0), 2);
    const b = ui.button(scene, W / 2 - 70, H / 2 + h / 2 - 52, 140, 38, 'Nice', () => g.forEach(o => o.destroy()), { hot: true, size: 16 });
    [b.rect, b.txt].forEach(o => add(o, 3)); b.txt.setDepth(Z + 4);
    if (scene.bigMoment) scene.bigMoment('QUEST COMPLETE!'); else if (FUP.fx && FUP.fx.shake) FUP.fx.shake(scene, 'hit');
    FUP.audio.sfx('fanfare');
    FUP.save.write();
  },

  // 🔍 action spots for this map (center(tx, ty) → { x, y } in pixels)
  spots(region, center) {
    return FUP.quests.searchesIn(region).map(s => { const p = center(s.tx, s.ty); return { kind: 'qsearch', quest: s.id, x: p.x, y: p.y, label: '🔍 Search', reach: 46 }; });
  },
  // Search a 🔍 spot (from either kind of map)
  search(scene, s, after = () => {}) {
    const r = FUP.quests.doSearch(s.quest);
    FUP.save.write();
    this.result(scene, s.quest, r, after);
  },
  // A villager's 📜 step (from their window)
  step(scene, id, npc, after = () => {}) {
    const r = FUP.quests.doStep(id, npc);
    FUP.save.write();
    this.result(scene, id, r, after);
    return r;
  },

  // Markers: 🔍 on search squares, ❗ (a quest to start) / 📜 (your next step) over villagers.
  // npcs = [{ id, sprite }]. Call again whenever quests change (cheap: it redraws a handful of texts).
  marks(scene, region, center, npcs = []) {
    (scene._qMarks || []).forEach(o => o.destroy());
    scene._qMarks = [];
    const sig = [];
    for (const s of FUP.quests.searchesIn(region)) {
      const p = center(s.tx, s.ty);
      const m = scene.add.text(p.x, p.y - 6, '🔍', { fontSize: '22px' }).setOrigin(0.5).setDepth(p.y + 30);
      scene.tweens.add({ targets: m, y: p.y - 14, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene._qMarks.push(m); sig.push(s.id);
    }
    for (const n of npcs) {
      if (!n.sprite) continue;
      const mark = FUP.quests.stepsAt(n.id, region).length ? '📜' : FUP.quests.startsAt(n.id).length ? '❗' : null;
      if (!mark) continue;
      const m = scene.add.text(n.sprite.x, n.sprite.y - n.sprite.displayHeight * 0.8 - 18, mark, { fontSize: '20px' }).setOrigin(0.5, 1).setDepth(5001);
      scene.tweens.add({ targets: m, scale: 1.15, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene._qMarks.push(m); sig.push(n.id + mark);
    }
    return sig.join(',');
  },
  // A string that changes when the quest picture changes (so maps only redraw markers when needed)
  signature(region) { return JSON.stringify([FUP.quests.activeIds().map(id => [id, FUP.quests.state.active[id].step, Object.keys(FUP.quests.state.active[id].talked || {}).length]), FUP.quests.available('quest').length, region]); },
};
