// ============================================================
// WORLD TUTORIAL — Orientation Isle on the World screen (v0.62).
// Extra functions for WorldScene, used only on the island:
//   the tutors (talk = a dialog card with pages), the goal card (top left,
//   with ⏭ Skip), an arrow to where you go next, the practice farm patch,
//   the sawhorse, the training dummy, and the ferry to Foopville.
// Rules: src/systems/tutorial.js · Content: data/tutorial.js
// Everything here is drawn fresh in create() (Phaser reuses the screen).
// ============================================================
Object.assign(WorldScene.prototype, {

  drawTutorial() {
    const ui = FUP.ui, c = ui.colors, D = FUP.tutorialData, TU = FUP.tutorial, F = this.tiles;
    TU.touch = ui.isTouch(this);
    this.tut = { shown: -1, cardLeft: null, patchKey: null, saidGrown: false };
    this.tutDialog = null;
    this.tutConfirm = null;
    const at = (tx, ty) => F.center(tx, ty);
    const label = (x, y, str, size = 11) => ui.text(this, x, y, str, size, c.ink, { stroke: c.stroke, strokeThickness: 3, align: 'center' }).setOrigin(0.5, 1).setDepth(5000);

    // Tutors: villager pictures with a tint (placeholder looks) and a name tag
    this.tut.tutors = {};
    for (const [id, t] of Object.entries(D.tutors)) {
      const p = at(t.tx, t.ty);
      const s = FUP.anim.sprite(this, p.x, p.y, t.sprite, 'idle', t.emoji, 30).setOrigin(0.5, 0.8).setDepth(p.y + 14);
      if (s.setTint && t.tint) s.setTint(t.tint);
      this.tweens.add({ targets: s, scaleY: s.scaleY * 1.04, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      label(p.x, p.y - s.displayHeight * 0.8 - 2, t.name);
      const spot = { tut: 'tutor', id, x: p.x, y: p.y, sprite: s, label: 'Talk' };
      this.spots.push(spot); this.solid.push({ tx: t.tx, ty: t.ty });
      this.tut.tutors[id] = spot;
    }

    // The practice farm patch: a soil square, its crop, a timer while it grows
    {
      const P = D.patch, p = at(P.tx, P.ty), T = F.size();
      this.tut.patchBg = this.add.rectangle(p.x, p.y, T - 4, T - 4, FUP.look.num('w2')).setStrokeStyle(2, FUP.look.num('k1')).setDepth(-3);
      this.tut.patchPic = null;
      this.tut.patchTimer = ui.text(this, p.x + T / 2 + 4, p.y, '', 12, c.accent, { fontStyle: '700', stroke: c.stroke, strokeThickness: 3 }).setOrigin(0, 0.5).setDepth(5001);   // beside it, clear of the E: prompt
      label(p.x, p.y + 34, 'FARM PATCH', 10).setOrigin(0.5, 0);
      this.tut.patch = { tut: 'patch', x: p.x, y: p.y, label: 'Use' };
      this.spots.push(this.tut.patch);
      this.refreshPatch();
    }
    // The sawhorse
    {
      const S = D.sawhorse, p = at(S.tx, S.ty);
      const s = ui.sprite(this, p.x, p.y, 'vil_sawhorse', '🪚', 26).setOrigin(0.5, 0.8).setDepth(p.y + 10);
      label(p.x, p.y - s.displayHeight * 0.8 - 2, 'SAWHORSE', 10);
      this.tut.saw = { tut: 'saw', x: p.x, y: p.y, sprite: s, label: '🪚 Saw' };
      this.spots.push(this.tut.saw); this.solid.push({ tx: S.tx, ty: S.ty });
    }
    // The training dummy
    {
      const Dm = D.dummy, p = at(Dm.tx, Dm.ty), e = FUP.enemies[Dm.enemy];
      const s = ui.sprite(this, p.x, p.y, e.mapSprite, e.emoji, 28, FUP.ui.pixelScale * 1.2).setOrigin(0.5, 0.9).setDepth(p.y + 10);
      this.tweens.add({ targets: s, angle: { from: -3, to: 3 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      label(p.x, p.y - s.displayHeight * 0.9 - 2, 'TRAINING DUMMY', 10);
      this.tut.dummy = { tut: 'dummy', x: p.x, y: p.y, sprite: s, label: '⚔️ Fight' };
      this.spots.push(this.tut.dummy); this.solid.push({ tx: Dm.tx, ty: Dm.ty });
    }
    // The ferry, bobbing at the end of the pier
    {
      const p = at(D.ferry.tx, D.ferry.ty);
      const boat = this.add.text(p.x, p.y, '⛵', { fontSize: '56px' }).setOrigin(0.5, 0.8).setDepth(p.y);
      this.tweens.add({ targets: boat, y: p.y + 4, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      label(p.x, p.y - 50, 'FERRY TO FOOPVILLE', 11);
    }

    // The arrow: bobs over where you go next; at the screen edge when that's off screen
    this.tut.arrow = ui.text(this, 0, 0, '▼', 26, c.accent, { stroke: c.stroke, strokeThickness: 5 }).setOrigin(0.5, 1).setDepth(5500);
    this.tweens.add({ targets: this.tut.arrow, scale: 1.25, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tut.edge = ui.text(this, 0, 0, '▲', 26, c.accent, { stroke: c.stroke, strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(10500);
    this.drawGoalCard();
  },

  // ---------- The goal card (top left): step n/total, what to do, ⏭ Skip ----------
  drawGoalCard() {
    const ui = FUP.ui, c = ui.colors, TU = FUP.tutorial, D = FUP.tutorialData, Z = 10000;
    for (const o of this.tut.card || []) o.destroy();
    const parts = this.tut.card = [];
    const fix = o => { parts.push(o); return o.setScrollFactor(0).setDepth(Z); };
    const st = TU.step();
    fix(FUP.ui.panel(this, 16, 64, 400, 62, 'hud'));
    fix(ui.text(this, 28, 72, `${D.cardTitle}  ·  ${Math.min(TU.number(), TU.total())}/${TU.total()}`, 12, c.dim, { fontStyle: '700' }));
    this.tut.goalText = fix(ui.text(this, 28, 90, st ? '▶ ' + st.goal : '', 15, c.accent, { fontStyle: '700', wordWrap: { width: 300 } }));
    if (this.tut.goalText.height > 32) this.tut.goalText.setFontSize(13);
    const skip = ui.button(this, 330, 76, 76, 38, '⏭ Skip', () => this.askSkip(), { size: 14 });
    for (const o of [skip.rect, skip.txt]) { parts.push(o); o.setScrollFactor(0).setDepth(Z + 1); }
    this.tut.shown = TU.state.step;
    this.tut.goalBase = st ? st.goal : '';
  },

  // ---------- Every frame on the island ----------
  updateTutorial(dt) {
    const TU = FUP.tutorial, t = this.tut;
    if (!TU.active()) return;
    if (TU.tick(dt)) { this.refreshPatch(); this.sayLine(FUP.tutorialData.patchLines.ready); FUP.audio.sfx('pickup'); }
    if (TU.state.patch && TU.state.patch.s === 'growing') this.refreshPatch(true);
    // A step finished somewhere (here, at the campfire, in a fight): new card, the narrator's line
    if (t.shown !== TU.state.step) {
      this.drawGoalCard();
      FUP.audio.sfx('select');
      this.saveHere();
    }
    if (TU.news) { this.sayLine(TU.news); TU.news = null; }   // also after coming back from the campfire
    // The grow step: show the seconds left on the card
    const st = TU.step();
    if (st && st.grow) {
      const left = TU.growLeft(), str = left ? `▶ ${st.goal} (${left}s)` : '▶ ' + st.goal;
      if (t.goalText.text !== str) t.goalText.setText(str);
    }
    // The action button says what the patch would do now
    const job = TU.patchJob();
    t.patch.label = { hoe: '⛏️ Hoe', plant: '🌱 Plant', water: '💧 Water', harvest: '🧺 Pick', growing: '⏳ Look' }[job] || 'Look';
    this.pointArrow();
  },

  // Where the arrow points for the current step
  tutorialTarget() {
    const st = FUP.tutorial.step();
    if (!st) return null;
    if (st.kind === 'talk') return this.tut.tutors[st.tutor];
    if (st.at === 'pack') return { fixed: true, x: 345, y: this.scale.height - 56 };   // the 🎒 button
    if (st.at === 'patch') return this.tut.patch;
    if (st.at === 'saw') return this.tut.saw;
    if (st.at === 'dummy') return this.tut.dummy;
    if (st.at === 'campfire') return this.campfire;
    if (st.at === 'pond') { const F = this.tiles.find('F')[0]; return F ? this.tiles.center(F.tx, F.ty) : null; }
    return null;
  },

  pointArrow() {
    const t = this.tut, a = t.arrow, e = t.edge, to = this.tutorialTarget(), cam = this.cameras.main;
    if (!to) { a.setVisible(false); e.setVisible(false); return; }
    if (to.fixed) {   // a button on the HUD: the edge arrow points down at it
      a.setVisible(false); e.setVisible(true).setPosition(to.x, to.y - 18).setRotation(Math.PI);
      return;
    }
    const top = to.sprite ? to.y - to.sprite.displayHeight * 0.8 - 18 : to.y - 26;
    a.setVisible(true).setPosition(to.x, top);
    // Off screen? Put an arrow at the screen edge pointing at it
    const sx = to.x - cam.scrollX, sy = to.y - cam.scrollY, W = this.scale.width, H = this.scale.height;
    const off = sx < 20 || sx > W - 20 || sy < 70 || sy > H - 70;
    e.setVisible(off);
    if (!off) return;
    const cx = W / 2, cy = H / 2, ang = Math.atan2(sy - cy, sx - cx);
    const k = Math.min((W / 2 - 40) / Math.abs(Math.cos(ang) || 1e-6), (H / 2 - 90) / Math.abs(Math.sin(ang) || 1e-6));
    e.setPosition(cx + Math.cos(ang) * k, cy + Math.sin(ang) * k).setRotation(ang + Math.PI / 2);
  },

  // ---------- Using things ----------
  tutorUse(s) {
    if (s.tut === 'tutor') return this.talkTutor(s.id);
    if (s.tut === 'patch') return this.usePatch();
    if (s.tut === 'saw') return this.useSaw();
    if (s.tut === 'dummy') return this.fightDummy();
  },

  xpWhere(s) { const cam = this.cameras.main; return { x: s.x - cam.scrollX, y: Math.max(110, s.y - cam.scrollY - 50) }; },

  usePatch() {
    const TU = FUP.tutorial, D = FUP.tutorialData, L = D.patchLines, s = this.tut.patch;
    const r = TU.patchUse(this.xpWhere(s));
    if (r.job === 'early') { this.sayLine(L.early); FUP.audio.sfx('error'); return; }
    if (r.job === 'growing') { this.sayLine(L.growing); return; }
    if (r.job === 'nothing') { this.sayLine(L.nothing); return; }
    if (r.full) { this.say('forestBagFull'); FUP.audio.sfx('error'); return; }
    FUP.audio.sfx(r.job === 'harvest' ? 'pickup' : 'click');
    FUP.fx.burst(this, s.x, s.y, 'pickup', s.y + 20);
    this.refreshPatch();
    this.refreshHud();
  },

  // The patch picture: weeds → soil → seed → sprout (growing) → berries → empty soil
  refreshPatch(timerOnly = false) {
    const TU = FUP.tutorial, p = TU.state.patch || { s: 'done' }, t = this.tut, s = t.patch || {};
    const left = TU.growLeft();
    t.patchTimer.setText(p.s === 'growing' ? `⏳ ${left}s` : p.s === 'ready' ? 'READY!' : '');
    const key = p.s + (p.s === 'growing' && left <= FUP.tutorialData.patch.growSeconds / 2 ? '2' : '');
    if (timerOnly && key === t.patchKey) return;
    t.patchKey = key;
    if (t.patchPic) t.patchPic.destroy();
    t.patchPic = null;
    t.patchBg.setFillStyle(FUP.look.num(p.s === 'weeds' ? 'g2' : p.s === 'seed' || p.s === 'soil' || p.s === 'done' ? 'w2' : 'w3'));
    const emo = { weeds: '🌿', seed: '🌰', growing: '🌱', growing2: '🌿', ready: null }[key];
    if (p.s === 'ready') t.patchPic = FUP.ui.sprite(this, s.x, s.y, FUP.ui.ingKey(FUP.tutorialData.patch.crop), '🫐', 24).setDepth(s.y + 5);
    else if (emo) t.patchPic = this.add.text(s.x, s.y, emo, { fontSize: key === 'growing' || key === 'seed' ? '16px' : '24px' }).setOrigin(0.5).setDepth(s.y + 5);
  },

  useSaw() {
    const r = FUP.tutorial.sawUse(this.xpWhere(this.tut.saw));
    if (r === 'early') { this.sayLine(FUP.tutorialData.sawNotYet); FUP.audio.sfx('error'); return; }
    if (r !== 'ok') { this.say(r === 'full' ? 'sawFull' : 'sawNoBark'); FUP.audio.sfx('error'); return; }
    FUP.audio.sfx('click');
    FUP.fx.burst(this, this.tut.saw.x, this.tut.saw.y, 'pickup', this.tut.saw.y + 20);
    this.refreshHud();
  },

  fightDummy() {
    const TU = FUP.tutorial, D = FUP.tutorialData;
    if (!TU.canFight()) {
      this.sayLine(TU.foughtAlready() ? D.dummyDone : D.dummyNotYet);
      FUP.audio.sfx('error');
      return;
    }
    this.leaving = true;
    this.saveHere();
    FUP.run.battle = { index: -1, type: D.dummy.enemy, result: null, mult: 1, coinMult: 1, areaLevel: 1, dropTier: 1, tutorial: true };
    FUP.audio.sfx('encounter');
    FUP.fx.shake(this, 'encounter');
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(250, () => this.scene.start('Battle', { enemies: [D.dummy.enemy] }));
  },

  // Back from the dummy fight (WorldScene.afterBattle)
  tutorialAfterFight(b) {
    if (FUP.tutorial.fightOver(b.result)) return;   // the card + done line come from updateTutorial
    if (b.result === 'fled') this.sayLine(FUP.tutorialData.dummyFled);
  },

  // ---------- Talking to a tutor: a card with pages ----------
  talkTutor(id) {
    const TU = FUP.tutorial, said = TU.talkFor(id);
    FUP.audio.sfx('click');
    if (said.line) { this.sayLine(said.line); return; }
    this.openTutorDialog(id, said.pages);
  },

  openTutorDialog(id, pages) {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 20000, t = FUP.tutorialData.tutors[id];
    this.leaving = true;   // the island stands still while they talk
    for (const o of [this.actBtn, this.actText, this.prompt]) if (o) o.setVisible(false);
    let parts = [], page = 0;
    const fix = o => { parts.push(o); return o.setScrollFactor(0).setDepth(Z); };
    const close = () => { parts.forEach(o => o.destroy()); parts = []; };
    const draw = () => {
      close();
      const X = 50, Y = H - 262, PW = W - 100, PH = 196;
      fix(ui.shade(this, 0.35));
      fix(FUP.ui.panel(this, X, Y, PW, PH, 'panel'));
      const pic = fix(ui.sprite(this, X + 70, Y + 110, t.sprite, t.emoji, 48, FUP.ui.pixelScale * 2.2));
      if (pic.setTint && t.tint) pic.setTint(t.tint);
      fix(ui.text(this, X + 140, Y + 16, t.name.toUpperCase(), 17, c.accent, { fontStyle: '700' }));
      const body = fix(ui.text(this, X + 140, Y + 44, pages[page], 16, c.ink, { wordWrap: { width: PW - 170 }, lineSpacing: 4 }));
      if (body.height > 104) body.setFontSize(14);
      fix(ui.text(this, X + 140, Y + PH - 30, `${page + 1}/${pages.length}`, 12, c.dim));
      const last = page === pages.length - 1, st = FUP.tutorial.step();
      const label = last ? (st && st.leave ? '⛵ Sail to Foopville' : '✔ Got it') : 'Next ▶';
      const b = ui.button(this, X + PW - (last && st && st.leave ? 230 : 160), Y + PH - 56, last && st && st.leave ? 210 : 140, 42, label, () => this.tutDialog.next(), { hot: true, size: 16 });
      for (const o of [b.rect, b.txt]) { parts.push(o); o.setScrollFactor(0).setDepth(Z + 1); }
      if (page > 0) {
        const back = ui.button(this, X + PW - (last && st && st.leave ? 330 : 260), Y + PH - 56, 90, 42, '◀ Back', () => { page--; draw(); }, { size: 15 });
        for (const o of [back.rect, back.txt]) { parts.push(o); o.setScrollFactor(0).setDepth(Z + 1); }
      }
    };
    this.tutDialog = {
      next: () => {
        FUP.audio.sfx('click');
        if (page < pages.length - 1) { page++; draw(); return; }
        close();
        this.tutDialog = null;
        const s = this.tut.tutors[id], st = FUP.tutorial.finishTalk(id, this.xpWhere(s));
        if (st && st.leave) { this.leaveIsle(false); return; }
        this.leaving = false;
        if (st && st.give) this.refreshHud();
      },
    };
    draw();
  },

  // ---------- Skip ----------
  askSkip() {
    if (this.tutConfirm || this.tutDialog || this.leaving) return;
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, D = FUP.tutorialData, Z = 21000;
    this.leaving = true;
    const parts = [];
    const fix = o => { parts.push(o); return o.setScrollFactor(0).setDepth(Z); };
    fix(ui.shade(this, 0.7));
    fix(FUP.ui.panel(this, W / 2 - 240, 180, 480, 220, 'panel'));
    fix(ui.text(this, W / 2, 205, D.skipAsk, 22, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0));
    fix(ui.text(this, W / 2, 250, D.skipText.replace('{coins}', D.coins), 15, c.ink, { align: 'center', lineSpacing: 5 }).setOrigin(0.5, 0));
    const close = () => { parts.forEach(o => o.destroy()); this.tutConfirm = null; };
    const btn = (x, label, fn, hot) => {
      const b = ui.button(this, x, 330, 190, 46, label, fn, { size: 17, hot });
      for (const o of [b.rect, b.txt]) { parts.push(o); o.setScrollFactor(0).setDepth(Z + 1); }
    };
    btn(W / 2 - 200, '⛵ Skip it', () => { close(); this.leaveIsle(true); });
    btn(W / 2 + 10, 'Keep learning', () => { close(); this.leaving = false; }, true);
    this.tutConfirm = parts;
  },

  // ---------- The ferry: off to Foopville (finished, or skipped) ----------
  leaveIsle(skipped) {
    this.leaving = true;
    FUP.tutorial.finish(skipped);
    FUP.save.write();
    this.say('islandLeave');
    FUP.audio.sfx('coins');
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.time.delayedCall(920, () => this.scene.start('Village', { fresh: true }));
  },
});
