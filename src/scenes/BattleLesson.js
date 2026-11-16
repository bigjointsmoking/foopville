// ============================================================
// BATTLE LESSON — Sergeant Bruise's combat lesson on Orientation Isle (v0.73).
// Extra functions for BattleScene, used only when FUP.run.battle.lesson is set.
// Time stops. A card explains one button at a time, only that button works,
// and an arrow points at it. You press it, see what it did, read why, go on.
// Last step: Flee, which always works here and ends the lesson.
// The dummy can't drop below 1 HP and neither can you. Bruise lends Practice
// Biscuits for Eat and Throw; leftovers vanish when the fight ends.
// Texts and the biscuit: data/tutorial.js `lesson`.
// Hooks in BattleScene: create (startLesson), update (frozen), refreshHud
// (lessonAllows), act (lessonActed), doFlee (always works), endBattle (lessonEnd).
// ============================================================
Object.assign(BattleScene.prototype, {

  startLesson() {
    const L = FUP.tutorialData.lesson;
    this.lesson = { i: -1, phase: 'card', parts: [], arrow: null };
    for (let k = 0; k < L.biscuits; k++) this.satchel.push({ ...L.biscuit });
    this.nextLessonStep();
  },

  lessonStep() { return FUP.tutorialData.lesson.steps[this.lesson.i] || null; },

  // Which buttons work right now (only the one being taught, plus ← Back)
  lessonAllows(item) {
    const L = this.lesson, st = this.lessonStep();
    if (!L || L.phase !== 'press' || !st) return false;
    if (item.back) return true;
    return (st.allow || [st.press]).includes(item.id);
  },

  nextLessonStep() {
    const L = this.lesson;
    L.i++;
    const st = this.lessonStep();
    if (!st) return;
    const p = this.player;
    p.defending = false;
    if (st.press) {
      L.phase = 'press';
      p.gauge = 100;   // your turn: the taught button lights up
      if (st.press === 'skills') {   // enough Focus for your Special, even if the Attack missed
        const sp = this.allSkills().find(k => this.skillKnown(k));
        if (sp) p.focus = Math.max(p.focus || 0, this.skillCost(sp));
      }
    } else {
      L.phase = 'card';
      p.gauge = 0;
    }
    this.setMenu('main');
    this.drawLessonCard(this.lessonText(st.text), !st.press);
  },

  lessonText(t) {
    const sp = this.allSkills().find(k => this.skillKnown(k));
    return String(t).replace(/\{special\}/g, sp ? sp.name : 'Special').replace(/\{cost\}/g, sp ? this.skillCost(sp) : 30);
  },

  // The card under the narrator bar. withNext = a Next ▶ button (otherwise: press the lit button)
  drawLessonCard(text, withNext) {
    const ui = FUP.ui, c = ui.colors, L = this.lesson, Z = 600, W = this.scale.width;
    for (const o of L.parts) o.destroy();
    L.parts = [];
    const add = o => { L.parts.push(o); return o.setDepth(Z); };
    const st = this.lessonStep(), D = FUP.tutorialData.lesson;
    const n = D.steps.length;
    // Left half, under the narrator bar: the dummy's HP bar and its "what's coming" icon stay in view
    const X = 16, Y = 60, PW = 520, PH = 176;
    add(FUP.ui.panel(this, X, Y, PW, PH, 'panel'));
    add(ui.text(this, X + 16, Y + 10, `🥊 SERGEANT BRUISE · ${L.i + 1}/${n}`, 12, c.dim, { fontStyle: '700' }));
    const body = add(ui.text(this, X + 16, Y + 30, text, 15, c.ink, { wordWrap: { width: PW - 32 }, lineSpacing: 3 }));
    if (body.height > 92) body.setFontSize(13);
    if (body.height > 92) body.setFontSize(12);
    if (withNext) {
      const b = ui.button(this, X + PW - 156, Y + PH - 50, 140, 40, 'Next ▶', () => this.lessonNext(), { hot: true, size: 16 });
      for (const o of [b.rect, b.txt]) { L.parts.push(o); o.setDepth(Z + 1); }
    } else if (st && st.press) {
      add(ui.text(this, X + PW - 16, Y + PH - 12, `▶ ${D.pressLabel[st.press] || 'Press the lit button'}`, 14, c.accent, { fontStyle: '700' }).setOrigin(1, 1));
    }
    this.pointLessonArrow();
    this.refreshHud();
  },

  // A bouncing arrow over the button you're meant to press
  pointLessonArrow() {
    const L = this.lesson;
    if (L.arrow) { this.tweens.killTweensOf(L.arrow); L.arrow.destroy(); L.arrow = null; }
    if (L.phase !== 'press') return;
    const b = this.buttons.find(x => !x.item.back && this.lessonAllows(x.item));
    if (!b) return;
    const x = b.txt.x, y = b.txt.y - 24;   // the label sits in the button's middle
    L.arrow = FUP.ui.text(this, x, y - 4, '▼', 24, FUP.ui.colors.accent, { stroke: FUP.ui.colors.stroke, strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(620);
    this.tweens.add({ targets: L.arrow, y: y - 14, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },

  // A button press finished (act → here). Show what it was about, then Next.
  lessonActed(cat) {
    const L = this.lesson, st = this.lessonStep();
    if (!L || !st || L.phase !== 'press') return;
    if (cat !== { attack: 'attack', skills: 'skill', defend: 'defend', rizz: 'rizz', eat: 'eat', throw: 'throw', flee: 'flee' }[st.press]) return;
    if (st.press === 'flee') { FUP.run.battle.lessonDone = true; return; }   // the fight is over: back to the island
    L.phase = 'wait';
    this.player.gauge = 0;
    this.setMenu('main');
    this.pointLessonArrow();
    const show = () => { if (this.over) return; L.phase = 'result'; this.drawLessonCard(this.lessonText(st.done), true); };
    if (st.enemyHits) {
      // Defend: the dummy swings at you now, so you can see the guard work
      this.time.delayedCall(600, () => {
        const e = this.liveReal()[0];
        if (e && !this.over) this.enemyAct(e);
        this.time.delayedCall(1000, show);
      });
    } else this.time.delayedCall(900, show);
  },

  lessonNext() {
    FUP.audio.sfx('click');
    this.nextLessonStep();
  },

  // The fight ended (Flee): take back the biscuits you didn't use, clear the card
  lessonEnd() {
    const L = this.lesson;
    if (!L) return;
    for (const o of L.parts) o.destroy();
    L.parts = [];
    if (L.arrow) { this.tweens.killTweensOf(L.arrow); L.arrow.destroy(); L.arrow = null; }
    for (let k = this.satchel.length - 1; k >= 0; k--) if (this.satchel[k].practice) this.satchel.splice(k, 1);
  },
});
