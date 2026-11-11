// ============================================================
// BOOT — unpacks the Blender sprites (assets/sprites.js) into the game,
// then opens the Start screen. Anything without a sprite yet falls back
// to its emoji, so a missing picture never breaks the game.
// ============================================================
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const list = Object.entries(FUP.sprites || {});
    let left = list.length, started = false;
    const go = () => {
      if (started) return;
      started = true;
      this.textures.off('addtexture');
      // Snap every sprite to the palette (data/look.js), except the hero
      // colour templates (their pure key colours get painted later).
      if (FUP.look.snapSprites) {
        for (const [key] of list) {
          if (key.startsWith('herokey') || !this.textures.exists(key)) continue;
          try { FUP.ui.snapTexture(this, key); } catch (e) { /* keep the original picture */ }
        }
      }
      FUP.anim.build(this);   // clip frames -> animations (src/anim.js)
      this.scene.start('Start');
    };
    if (!left) { go(); return; }

    const one = key => { if (FUP.sprites[key] && --left <= 0) go(); };
    this.textures.on('addtexture', key => {
      if (!FUP.sprites[key]) return;
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST); // crisp pixels
      one(key);
    });
    this.textures.on('onerror', one);
    for (const [key, data] of list) this.textures.addBase64(key, data);
    this.time.delayedCall(4000, go); // never get stuck here
  }
}
