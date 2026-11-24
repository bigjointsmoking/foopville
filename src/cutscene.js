// ============================================================
// CUTSCENE PLAYER (v1.13): plays a scene from data/cutscenes.js over whatever screen you're on.
//   FUP.cutscene.play(scene, id, onDone)
// Letterbox bars, a painted backdrop that pans, pictures that move, captions, fire and light.
// Tap / click / any key skips. While it plays the screen underneath is paused (scene.panel is set).
// ============================================================
window.FUP = window.FUP || {};

FUP.cutscene = {
  play(scene, id, onDone = () => {}) {
    const D = FUP.cutsceneData, S = D.scenes[id];
    if (!S) { onDone(); return; }
    const W = scene.scale.width, H = scene.scale.height, Z = 40000, num = FUP.look.num, ui = FUP.ui;
    const parts = [], fix = (o, d = 0) => { o.setScrollFactor(0).setDepth(Z + d); parts.push(o); return o; };
    const actors = {};
    let done = false, finishing = false;
    const before = scene.panel;
    scene.panel = { destroy: () => skip(), cutscene: true };   // pauses the map underneath (ESC there = skip)
    const song = FUP.audio.song;   // back to whatever was playing afterwards
    FUP.audio.stopMusic();

    // Sky, stage (backdrop + actors, pans), ground
    const sky = fix(scene.add.rectangle(0, 0, W, H, num(S.sky || 'b2')).setOrigin(0));
    const stage = scene.add.container(0, 0).setScrollFactor(0).setDepth(Z + 2); parts.push(stage);
    const B = S.backdrop;
    fix(scene.add.rectangle(0, B.bottom - 2, W, H - B.bottom + 2, num(S.ground || 'w2')).setOrigin(0), 1);
    if (scene.textures.exists(B.key)) {
      const bd = scene.add.image(0, B.bottom, B.key).setOrigin(0, 1);
      bd.setScale(B.height / bd.height);
      if (S.tint) bd.setTint(num(S.tint));   // evening light on the old square
      stage.add(bd);
    }
    stage.x = S.pan[0];
    scene.tweens.add({ targets: stage, x: S.pan[1], duration: S.length * 1000, ease: 'Sine.easeInOut' });

    // Fire glow at the edges, embers (screen level, above the stage)
    const edges = [];   // soft fire glow: 4 thin layers per side, strongest at the edge
    for (let k = 1; k <= 4; k++) for (const left of [true, false]) {
      const w = 40 * k;
      edges.push(fix(scene.add.rectangle(left ? 0 : W - w, 0, w, H, 0xffffff, 0).setOrigin(0), 5).setBlendMode(Phaser.BlendModes.ADD));
    }

    // Letterbox, caption, skip hint, the fade in
    fix(scene.add.rectangle(0, 0, W, D.bars, 0x000000).setOrigin(0), 10);
    fix(scene.add.rectangle(0, H - D.bars, W, D.bars, 0x000000).setOrigin(0), 10);
    const caption = fix(ui.text(scene, W / 2, H - D.bars / 2, '', D.captionSize, ui.colors.ink, { fontStyle: 'italic', align: 'center', wordWrap: { width: W - 120 } }).setOrigin(0.5), 11);
    fix(ui.text(scene, W - 16, D.bars / 2, D.skipText, 12, ui.colors.dim).setOrigin(1, 0.5), 11);
    const black = fix(scene.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0), 20);
    scene.tweens.add({ targets: black, alpha: 0, duration: D.fadeInMs });
    const white = fix(scene.add.rectangle(0, 0, W, H, num('k4'), 0).setOrigin(0), 21);

    const picture = (key, emoji, h) => {
      if (scene.textures.exists(key)) { const im = scene.add.image(0, 0, key).setOrigin(0.5, 1); im.setScale(h / im.height); return im; }
      return scene.add.text(0, 0, emoji || '?', { fontSize: Math.round(h * 0.8) + 'px' }).setOrigin(0.5, 1);
    };

    const run = st => {
      if (done) return;
      if (st.caption !== undefined) caption.setText(st.caption);
      if (st.sky) { const from = Phaser.Display.Color.ValueToColor(sky.fillColor), to = Phaser.Display.Color.ValueToColor(num(st.sky.color));
        scene.tweens.addCounter({ from: 0, to: 100, duration: st.sky.dur * 1000, onUpdate: tw => { const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, tw.getValue()); sky.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b)); } }); }
      if (st.add) {
        const a = st.add, o = picture(a.key, a.emoji, a.h);
        o.setPosition(a.x, a.y).setAlpha(a.alpha === undefined ? 1 : a.alpha);
        if (a.top) o.setOrigin(0.5, 0);   // hangs from its top (the bell swings from there)
        if (a.flip && o.setFlipX) o.setFlipX(true);
        if (a.screen) fix(o, 4); else { stage.add(o); if (a.depth) stage.moveTo(o, 1); }   // depth: behind the others (just in front of the backdrop)
        if (S.tint && o.setTint) o.setTint(num(S.tint));
        o.hFor = a.h; actors[a.id] = o;
      }
      if (st.move && actors[st.move.id]) scene.tweens.add({ targets: actors[st.move.id], x: st.move.x, y: st.move.y, duration: st.move.dur * 1000, ease: 'Sine.easeInOut' });
      if (st.swap && actors[st.swap.id] && scene.textures.exists(st.swap.key)) { const o = actors[st.swap.id]; o.setTexture(st.swap.key); o.setScale(o.hFor / o.height); }
      if (st.swing && actors[st.swing.id]) scene.tweens.add({ targets: actors[st.swing.id], angle: { from: -st.swing.angle, to: st.swing.angle }, duration: st.swing.dur * 1000, yoyo: true, repeat: st.swing.times, ease: 'Sine.easeInOut', onComplete: function () { this.targets[0].setAngle(0); } });
      if (st.fade && actors[st.fade.id]) scene.tweens.add({ targets: actors[st.fade.id], alpha: st.fade.alpha, duration: st.fade.dur * 1000 });
      if (st.sweep) {
        const sw = st.sweep, o = fix(picture(sw.key, sw.emoji, sw.h), 6).setOrigin(0.5).setPosition(sw.from, sw.y).setAlpha(0.85);
        if (sw.shadow && o.setTint) o.setTint(num('k0'));   // (the title screen's dragon, drawn as a shadow)
        if (sw.flip && o.setFlipX) o.setFlipX(true);
        scene.tweens.add({ targets: o, x: sw.to, duration: sw.dur * 1000, ease: 'Sine.easeIn' });
      }
      if (st.ring) {
        const r = st.ring, g = scene.add.ellipse(r.x, r.y, r.w, r.h, num(r.color), 0.35).setBlendMode(Phaser.BlendModes.ADD).setScale(0.03);
        g.setStrokeStyle(5, num(r.color), 0.95); stage.add(g);
        scene.tweens.add({ targets: g, scale: 1, duration: r.dur * 1000, ease: 'Cubic.easeOut' });
        scene.tweens.add({ targets: g, alpha: 0.85, duration: 500, yoyo: true, repeat: -1, delay: r.dur * 1000 });
      }
      if (st.edges) for (const e of edges) { e.setFillStyle(num(st.edges.color), e.fillAlpha); scene.tweens.add({ targets: e, fillAlpha: st.edges.alpha / 4, duration: 800 }); scene.tweens.add({ targets: e, alpha: 0.6, duration: 260 + Math.random() * 200, yoyo: true, repeat: -1 }); }
      if (st.embers) for (let k = 0; k < st.embers.n; k++) {
        const p = fix(scene.add.circle(Math.random() * W, H - D.bars - Math.random() * 60, 1.5 + Math.random() * 2, num(Math.random() < 0.5 ? 'y2' : 'r3')), 7).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: p, y: D.bars + Math.random() * 120, x: p.x + (Math.random() - 0.5) * 140, alpha: 0, duration: 2000 + Math.random() * 3000, delay: Math.random() * st.embers.dur * 1000 });
      }
      if (st.shake) scene.cameras.main.shake(st.shake.ms, st.shake.power);
      if (st.flash) scene.tweens.add({ targets: white, alpha: 1, duration: st.flash.ms });
      if (st.sfx) FUP.audio.sfx(st.sfx);
    };
    const timers = S.steps.map(st => scene.time.delayedCall(st.t * 1000, () => run(st)));

    const finish = () => {
      if (done) return;
      done = true;
      timers.forEach(t => t.remove(false));
      scene.input.off('pointerdown', skip); scene.input.keyboard && scene.input.keyboard.off('keydown', skip);
      parts.forEach(o => { scene.tweens.killTweensOf(o); o.destroy(); });
      scene.panel = before;
      if (song) FUP.audio.music(song);
      onDone();
    };
    // Skip (or the scene ends): fade to white, then back to the game
    function skip() {
      if (finishing || done) return;
      finishing = true;
      caption.setText('');
      scene.tweens.add({ targets: white, alpha: 1, duration: D.endFadeMs / 2, onComplete: finish });
    }
    scene.time.delayedCall(600, () => { if (!done) { scene.input.on('pointerdown', skip); scene.input.keyboard && scene.input.keyboard.on('keydown', skip); } });
    scene.time.delayedCall(S.length * 1000, () => { if (!finishing) { finishing = true; finish(); } });
  },
};
