// ============================================================
// DISH PICTURES — every finished dish gets a picture that shows
// what's in it: the container for its cooking method (bowl, skewer,
// soup bowl, pie, plate) with little versions of its ingredients.
// Soups and pies are tinted the colour of their ingredients.
// The pieces are Blender sprites (base_*, mini_*). Each recipe's
// picture is built once and reused.
//   FUP.dishArt.key(dish) -> a picture key for FUP.ui.sprite / images
// ============================================================
window.FUP = window.FUP || {};

FUP.dishArt = {
  SIZE: 20,   // pixels (shown at 1.5-6x like other sprites)

  // Where each method puts its container and ingredients. x, y = centre of a mini ingredient.
  layouts: {
    raw:   { base: 'base_bowl',  spots: [[6, 6], [14, 6], [10, 4]] },
    grill: { base: 'base_stick', spots: [[4, 10], [10, 10], [16, 10]], under: true },
    boil:  { base: 'base_soup',  spots: [[7, 7], [13, 7]], broth: [10, 7, 7, 2.6], scale: 0.8 },
    bake:  { base: 'base_pie',   spots: [[10, 8], [7, 10], [13, 10]], broth: [10, 9, 6.5, 3], scale: 0.8 },
    fry:   { base: 'base_plate', spots: [[6, 11], [14, 11], [10, 8]], scale: 0.85, tint: 0xf2c060 },  // golden, battered
  },

  key(dish) {
    if (!dish) return null;
    const tm = FUP.game && FUP.game.textures;
    if (!tm || !dish.ids || !dish.method || dish.burnt) return dish.sprite;   // old saves / burnt: the simple picture
    const lay = this.layouts[dish.method];
    if (!lay || !tm.exists(lay.base)) return dish.sprite;
    const key = 'dishart_' + dish.method + '_' + dish.ids.join('+');
    if (tm.exists(key)) return key;

    const R = FUP.spriteRes || 1, S = this.SIZE * R, dt = tm.addDynamicTexture(key, S, S);   // painted art: R times the pixels
    const mini = id => 'mini_' + id;
    const ids = dish.ids.filter(id => tm.exists(mini(id)));
    const stampMinis = () => lay.spots.forEach(([x, y], i) => {
      if (!ids.length) return;
      dt.stamp(mini(ids[i % ids.length]), null, x * R, y * R, { scale: lay.scale || 1, tint: lay.tint || 0xffffff });
    });

    if (lay.under) stampMinis();                       // skewer: chunks first, then the stick through them
    else dt.stamp(lay.base, null, S / 2, S / 2);       // everything else: container first
    if (lay.broth) {                                   // soup / pie filling in the ingredients' mixed colour
      const [cx, cy, rx, ry] = lay.broth.map(v => v * R);
      const col = this.mix(dish.ids);
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        const w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
        if (w >= 0.5) dt.fill(col, 1, Math.round(cx - w), y, Math.round(w * 2), 1);
      }
    }
    if (lay.under) dt.stamp(lay.base, null, S / 2, S / 2);
    else stampMinis();
    dt.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return key;
  },

  // Average colour of the ingredients (warm soup colour mixed in), as 0xRRGGBB.
  mix(ids) {
    const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    const cols = ids.map(id => FUP.ingredients[id] && FUP.ingredients[id].color).filter(Boolean).map(rgb);
    cols.push(rgb('#c87a3a'));
    const avg = [0, 1, 2].map(i => Math.round(cols.reduce((s, c) => s + c[i], 0) / cols.length));
    return (avg[0] << 16) | (avg[1] << 8) | avg[2];
  },
};
