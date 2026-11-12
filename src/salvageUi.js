// ============================================================
// SCRAP PILES ON THE MAP (v0.70) — shared by the village and the World screen.
//   FUP.salvageUi.draw(scene, region, tiles)   (re)draws this region's piles
//   FUP.salvageUi.spots(scene, region, tiles)  action spots for the piles that are full
//   FUP.salvageUi.use(scene, spot, onDone)     pry one apart: you stand still for a moment
// A full pile shows its picture; an emptied one shows a little heap of leftovers.
// Rules in src/systems/salvage.js, numbers in data/salvage.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.salvageUi = {
  draw(scene, region, tiles) {
    (scene._salvageViews || []).forEach(o => o.destroy());
    scene._salvageViews = [];
    const S = FUP.salvage, T = tiles.size ? tiles.size() : FUP.villageData.tileSize;
    S.spots(region).forEach((s, i) => {
      const k = S.kind(s.kind), c = tiles.center(s.tx, s.ty), full = S.ready(region, i);
      const shadow = scene.add.ellipse(c.x, c.y + T * 0.32, T * 0.9, T * 0.3, 0x000000, full ? 0.25 : 0.12).setDepth(c.y - 2);
      let pic;
      if (full) {
        pic = FUP.ui.sprite(scene, c.x, c.y + T * 0.42, k.sprite, k.emoji, 26).setOrigin(0.5, 1);
        if (pic.texture && scene.textures.exists(k.sprite)) pic.setScale(T * 1.45 / pic.width);   // about a square and a half wide
      } else {
        pic = scene.add.text(c.x, c.y + 6, '·∴·', { fontSize: '14px', color: FUP.look.hex('w4') }).setOrigin(0.5).setAlpha(0.6);   // leftovers
      }
      pic.setDepth(c.y + T * 0.42);
      if (full && S.why(s.kind)) pic.setAlpha(0.65);   // too hard for you yet
      scene._salvageViews.push(shadow, pic);
      s._pic = pic;
    });
  },

  spots(scene, region, tiles) {
    const S = FUP.salvage;
    return S.spots(region).map((s, i) => {
      if (!S.ready(region, i)) return null;
      const c = tiles.center(s.tx, s.ty), k = S.kind(s.kind);
      return { kind: 'salvage', region, i, x: c.x, y: c.y, sprite: s._pic, label: S.why(s.kind) ? `🔒 ${k.name}` : '🛠️ Salvage' };
    }).filter(Boolean);
  },

  // Pry pile apart. The scene counts it as a panel (walking stops) until it's done.
  use(scene, spot, onDone) {
    const S = FUP.salvage, s = S.spots(spot.region)[spot.i], k = S.kind(s.kind);
    const why = S.why(s.kind);
    if (why) { scene.sayLine(`${k.name}: too much for you yet. Needs ${why}.`); FUP.audio.sfx('error'); return; }
    if (!S.ready(spot.region, spot.i)) return;
    const job = { destroy() {} };
    scene.panel = job;
    if (scene.player && spot.x !== scene.player.x) scene.player.setFlipX(spot.x < scene.player.x);
    const pic = s._pic, reps = Math.max(2, Math.round(k.seconds / 0.35));
    let n = 0;
    const tick = scene.time.addEvent({ delay: 350, repeat: reps - 1, callback: () => {
      n++;
      FUP.audio.sfx(n % 2 ? 'chop' : 'hit');
      if (pic && pic.active) scene.tweens.add({ targets: pic, x: pic.x + (n % 2 ? 3 : -3), duration: 60, yoyo: true });
      if (n < reps) return;
      const cam = scene.cameras.main, r = S.pry(spot.region, spot.i, Math.random, { x: spot.x - cam.scrollX, y: Math.max(110, spot.y - cam.scrollY - 50) });   // XP pop-up in screen pixels
      if (scene.panel === job) scene.panel = null;
      if (r) {
        const t = FUP.ui.text(scene, spot.x, spot.y - 30, S.gotText(r.got), 15, FUP.ui.colors.accent, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4 }).setOrigin(0.5).setDepth(9000);
        scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 1600, delay: 500, onComplete: () => t.destroy() });
        FUP.audio.sfx('pickup');
        const lines = FUP.narrator['salvage_' + s.kind] || FUP.narrator.salvage;
        if (lines) scene.sayLine(Phaser.Utils.Array.GetRandom(lines) + `  (${S.gotText(r.got)})`);
      }
      FUP.save.write();
      if (onDone) onDone(r);
    } });
    job.destroy = () => { tick.remove(); if (scene.panel === job) scene.panel = null; };
  },
};
