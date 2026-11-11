// ============================================================
// LOOKS — paints your hero in the colours you picked.
// The Blender hero (herokey_*) has skin, hair, outfit and scarf in
// pure "key" colours. We copy the picture and swap each key colour
// for yours, keeping its light and shadow. Result: 'hero_me' (fights,
// creator) and 'hero_map_me' (walking). Old saves without looks use the default.
// ============================================================
window.FUP = window.FUP || {};

FUP.looks = {
  KEY_LEVEL: 188,   // brightness of the key colours in the plain (lit) band

  toLin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); },
  toSrgb(v) { v = Math.max(0, Math.min(1, v)); return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); },
  hexLin(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255].map(v => this.toLin(v)); },

  // Which part of the body a pixel is, from its key colour. null = leave it alone.
  part(r, g, b) {
    const on = v => v > 30, off = v => v <= 4;
    if (on(r) && on(g) && off(b)) return 'skin';
    if (off(r) && on(g) && on(b)) return 'hair';
    if (on(r) && off(g) && on(b)) return 'outfit';
    if (on(r) && off(g) && off(b)) return 'scarf';
    return null;
  },

  // The hero picture to use: yours if it's been painted, else the plain one.
  key(base) { return FUP.game && FUP.game.textures.exists(base + '_me') ? base + '_me' : base; },

  // Make (or remake) the recoloured textures. Call after the look changes.
  apply(scene, look) {
    look = { ...FUP.looksData.default, ...(look || {}) };
    const style = FUP.looksData.hairstyles.some(h => h.id === look.hairstyle) ? look.hairstyle : 'fringe';
    // Same look as last time and already painted: nothing to do (v0.41: avoids swapping a picture a fading screen still uses)
    const sig = JSON.stringify(look) + style;
    if (this._sig === sig && scene.textures.exists('hero_me') && scene.textures.exists('hero_map_me')) return;
    this._sig = sig;
    this.paint(scene, 'herokey_' + style, 'hero_me', look);
    this.paint(scene, 'herokey_map_' + style, 'hero_map_me', look);
  },

  paint(scene, fromKey, toKey, look) {
    const tm = scene.textures;
    if (!tm.exists(fromKey)) return;
    const src = tm.get(fromKey).getSourceImage();
    const w = src.width, h = src.height;
    if (tm.exists(toKey)) tm.remove(toKey);
    const tex = tm.createCanvas(toKey, w, h);
    const ctx = tex.getContext();
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, w, h), px = img.data;
    const keyLin = this.toLin(this.KEY_LEVEL);
    const target = { skin: this.hexLin(look.skin), hair: this.hexLin(look.hair), outfit: this.hexLin(look.outfit), scarf: this.hexLin(look.scarf) };
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      const part = this.part(px[i], px[i + 1], px[i + 2]);
      if (!part) continue;
      const light = this.toLin(Math.max(px[i], px[i + 1], px[i + 2])) / keyLin; // 1 = plain, <1 shadow, >1 lit
      const t = target[part];
      px[i] = this.toSrgb(t[0] * light); px[i + 1] = this.toSrgb(t[1] * light); px[i + 2] = this.toSrgb(t[2] * light);
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  },
};
