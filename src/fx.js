// ============================================================
// FX — "juice": hit flashes, screen shake, damage numbers, particle
// bursts, fades between screens and windows that pop open.
// Every number lives in data/look.js (feel).
// ============================================================
window.FUP = window.FUP || {};

FUP.fx = {
  live: 0,   // particles on screen right now (capped by feel.particles.maxLive)

  cfg() { return FUP.look.feel; },

  // Screen shake by name: hit, crit, hurt, heavy, kill, boss.
  shake(scene, kind = 'hit') {
    const s = this.cfg().shake[kind];
    if (s && scene.cameras && scene.cameras.main) scene.cameras.main.shake(s[0], s[1]);
  },

  // A hit: the target flashes cream, squashes and gets knocked back a little.
  // obj = an image, a text, or a container (the first picture inside flashes).
  // dir = which way it's pushed (+1 right, -1 left).
  hit(scene, obj, dir = 1) {
    if (!obj || !obj.active) return;
    const F = this.cfg();
    const pics = obj.list ? obj.list.filter(o => o.type === 'Image' || o.type === 'Sprite') : [obj];
    const canTint = scene.renderer.type === Phaser.WEBGL;
    for (const p of pics) {
      if (canTint && p.setTintFill) {
        p.setTintFill(FUP.look.num(F.hitFlashColor));
        scene.time.delayedCall(F.hitFlashMs, () => { if (p.active) p.clearTint(); });
      } else {
        scene.tweens.add({ targets: p, alpha: 0.25, duration: F.hitFlashMs, yoyo: true, onComplete: () => { if (p.active) p.setAlpha(1); } });
      }
    }
    const pic = pics[0];
    if (pic && F.squash) {
      const sx = pic.scaleX, sy = pic.scaleY;
      scene.tweens.add({ targets: pic, scaleX: sx * (1 + F.squash), scaleY: sy * (1 - F.squash), duration: 60, yoyo: true,
        onComplete: () => { if (pic.active) pic.setScale(sx, sy); } });
    }
    if (F.knockback && obj.x !== undefined) {
      const x0 = obj.baseX !== undefined ? obj.baseX : obj.x;
      scene.tweens.add({ targets: obj, x: x0 + dir * F.knockback, duration: 70, yoyo: true, ease: 'Quad.easeOut',
        onComplete: () => { if (obj.active && obj.baseX !== undefined) obj.x = obj.baseX; } });
    }
  },

  // A damage (or heal, or word) number that pops big, then floats up and fades.
  number(scene, x, y, str, color, big = false, depth = 460) {
    const N = this.cfg().numbers;
    const t = FUP.ui.text(scene, x + Phaser.Math.Between(-N.spread, N.spread), y, str, big ? N.critSize : N.size, color, {
      fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: big ? 8 : 6,
    }).setOrigin(0.5).setDepth(depth).setScale(N.popScale);
    if (big) t.setAngle(Phaser.Math.Between(-8, 8));
    scene.tweens.add({ targets: t, scale: 1, duration: N.popMs, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: t, y: t.y - N.rise, alpha: 0, delay: N.popMs, duration: N.riseMs, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
    return t;
  },

  // A burst of little square bits (palette colours) flying out from (x, y).
  burst(scene, x, y, kind = 'hit', depth = 470) {
    const P = this.cfg().particles, k = P.kinds[kind];
    if (!k) return;
    const n = Math.min(k.n, P.maxLive - this.live);
    for (let i = 0; i < n; i++) {
      const col = FUP.look.num(k.colors[i % k.colors.length]);
      const b = scene.add.rectangle(x, y, P.size, P.size, col).setDepth(depth);
      const a = k.up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
      const v = Phaser.Math.Between(P.speed[0], P.speed[1]) * P.lifeMs / 1000;
      const dx = Math.cos(a) * v, dy = Math.sin(a) * v + (k.up ? 0 : P.gravity * (P.lifeMs / 1000) ** 2 / 2);
      this.live++;
      scene.tweens.add({ targets: b, x: x + dx, y: y + dy, alpha: 0, angle: Phaser.Math.Between(-180, 180), duration: P.lifeMs, ease: 'Quad.easeOut',
        onComplete: () => { this.live--; b.destroy(); } });
    }
  },

  // ---------- Fades between screens ----------
  // Every scene.start() fades the screen out first, and every screen fades in.
  installTransitions(game) {
    const ms = this.cfg().transitionMs;
    if (!ms) return;
    const proto = Phaser.Scenes.ScenePlugin.prototype, start = proto.start;
    proto.start = function (key, data) {
      const scene = this.scene, cam = scene.cameras && scene.cameras.main;
      if (!cam || this.key === 'Boot' || !scene.sys.isActive()) return start.call(this, key, data);
      if (scene._fxLeaving) return this;                   // already on its way out
      const fade = cam.fadeEffect;
      if (fade.isRunning || (fade.isComplete && fade.direction)) return start.call(this, key, data);   // already black
      scene._fxLeaving = true;
      cam.fadeOut(ms, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => start.call(this, key, data));
      return this;
    };
    game.events.once('ready', () => {
      for (const s of game.scene.scenes) {
        if (s.sys.settings.key === 'Boot') continue;
        s.sys.events.on('create', () => { s._fxLeaving = false; s.cameras.main.fadeIn(ms, 0, 0, 0); });
      }
    });
  },

  // ---------- Windows that pop open ----------
  // Called by FUP.ui.shade(): everything added right after the dark layer
  // (the window and its contents) rises a little and fades in.
  popOpen(scene, shade) {
    const F = this.cfg();
    if (!F.menuPopMs) return;
    const now = scene.time.now;
    shade.once('destroy', () => { scene._shadeGoneAt = scene.time.now; });
    // A window redrawing itself after a button press shouldn't pop again,
    // but a redraw while it's still opening keeps animating.
    const opening = scene._popUntil !== undefined && now <= scene._popUntil;
    if (!opening && scene._shadeGoneAt !== undefined && now - scene._shadeGoneAt < 100) return;
    if (!opening) scene._popUntil = now + F.menuPopMs + 50;
    const list = scene.children.list, from = list.indexOf(shade);
    const a0 = shade.alpha;
    shade.setAlpha(0);
    scene.tweens.add({ targets: shade, alpha: a0, duration: F.menuPopMs });
    scene.time.delayedCall(0, () => {
      if (!shade.active) return;   // the window redrew in the same moment: its new shade animates instead (else every object on screen faded)
      const objs = scene.children.list.slice(scene.children.list.indexOf(shade) + 1);
      for (const o of objs) {
        if (!o.active || o.alpha === undefined) continue;
        const a = o.alpha, y = o.y;
        o.setAlpha(0); o.y = y + F.menuPopRise;
        scene.tweens.add({ targets: o, alpha: a, y, duration: F.menuPopMs, ease: 'Cubic.easeOut' });
      }
    });
    return from;
  },
};
