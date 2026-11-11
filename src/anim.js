// ============================================================
// ANIM — turns the Blender clip frames (<sprite>_<clip>_<n>) into Phaser
// animations and plays them. Speeds in data/look.js (anim).
// Anything without frames just stays a still picture, so nothing breaks.
// ============================================================
window.FUP = window.FUP || {};

FUP.anim = {
  // Called once at start-up (BootScene), after the sprites are loaded.
  build(scene) {
    const A = FUP.look.anim, clips = {};
    for (const key of Object.keys(FUP.sprites || {})) {
      const m = key.match(/^(.*)_(idle|walk|attack|hurt)_(\d+)$/);
      if (!m || !scene.textures.exists(key)) continue;
      const id = m[1] + '_' + m[2];
      (clips[id] = clips[id] || { clip: m[2], frames: [] }).frames[+m[3]] = key;
    }
    for (const [id, c] of Object.entries(clips)) {
      if (scene.anims.exists(id)) continue;
      scene.anims.create({
        key: id, frames: c.frames.filter(Boolean).map(k => ({ key: k })),
        frameRate: A.fps[c.clip] || 8, repeat: A.loop[c.clip] ? -1 : 0,
      });
    }
  },

  has(scene, base, clip) { return scene.anims.exists(base + '_' + clip); },

  // A sprite that loops `clip` if it has frames, else a still picture (or the emoji).
  sprite(scene, x, y, key, clip = 'idle', emoji = '❓', emojiSize = 32, scale = FUP.ui.pixelScale) {
    if (!this.has(scene, key, clip)) return FUP.ui.sprite(scene, x, y, key, emoji, emojiSize, scale);
    const s = scene.add.sprite(x, y, key).setScale(scale);
    this.loop(s, key, clip);
    return s;
  },

  loop(s, key, clip) {
    if (!s.play || !this.has(s.scene, key, clip)) return;
    s.animBase = key; s.animLoop = clip;
    const a = s.scene.anims.get(key + '_' + clip);
    s.play({ key: key + '_' + clip, startFrame: FUP.look.anim.randomStart ? Math.floor(Math.random() * a.frames.length) : 0 });
  },

  // Play a one-off clip (attack, hurt), then go back to the looping one.
  once(s, clip) {
    if (!s || !s.active || !s.play || !s.animBase || !this.has(s.scene, s.animBase, clip)) return;
    s.play(s.animBase + '_' + clip);
    s.once('animationcomplete', () => { if (s.active) this.loop(s, s.animBase, s.animLoop); });
  },
};
