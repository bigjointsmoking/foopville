// ============================================================
// THE HERO PICTURE (Visual Phase 5 / A2, v1.07), built from Jesus's sketches in art/fupville_art.py.
// The hero is drawn in LAYERS that stay stacked on top of each other:
//   body    skin / shirt / scarf in key colours, recoloured to your creator picks (src/looks.js)
//   hair    your hairstyle (key colour, recoloured)
//   bucket  the dented bucket helmet (hidden while a Wardrobe hat is worn: the hat replaces it)
//   weapon  in his hand in fights (your base weapon; upgrades tint it, data/weapons.js handTint)
// Every layer has the same frames, so they always line up:
//   fights  hb_<layer>_<frame>         frames: rest, idle_0-3, attack_0-3, hurt_0-1, defend_0-1
//   maps    hm_<dir>_<layer>_<frame>   dir: side / front / back, frames: rest, walk_0-3
//
//   FUP.heroArt.make(scene, x, y, 'map' | 'battle', { scale })  ->  the body picture (an Image).
//     Use it like any sprite (x, y, depth, flip, tweens): the other layers follow it.
//     On maps he walks by himself whenever the picture moves, facing the way he goes.
//     In fights: body.heroPlay('attack' | 'hurt' | 'defend'), then he goes back to breathing.
//   FUP.heroArt.paint(scene, look)   recolour all the frames (called by FUP.looks.apply)
// Frame speeds: data/look.js heroAnim.
// ============================================================
window.FUP = window.FUP || {};

FUP.heroArt = {
  HAIRS: ['fringe', 'spiky', 'ponytail', 'bald'],
  DIRS: ['side', 'front', 'back'],
  BATTLE_CLIPS: { idle: 4, attack: 4, hurt: 2, defend: 2 },
  MAP_CLIPS: { walk: 4 },

  speeds() { return (FUP.look && FUP.look.heroAnim) || { idle: 0.32, attack: 0.07, hurt: 0.12, defend: 0.14, walk: 0.11 }; },
  frames(mode) {
    const clips = mode === 'battle' ? this.BATTLE_CLIPS : this.MAP_CLIPS, out = ['rest'];
    for (const [c, n] of Object.entries(clips)) for (let i = 0; i < n; i++) out.push(`${c}_${i}`);
    return out;
  },
  base(mode, dir, layer, frame) { return mode === 'battle' ? `hb_${layer}_${frame}` : `hm_${dir}_${layer}_${frame}`; },
  ready(scene) { return scene.textures.exists('hb_body_rest') && scene.textures.exists('hm_side_body_rest'); },
  hairStyle(look) { const h = (look || {}).hairstyle; return this.HAIRS.includes(h) ? h : 'fringe'; },
  look() { return { ...FUP.looksData.default, ...((FUP.run && FUP.run.hero && FUP.run.hero.look) || {}) }; },

  // Recolour every body + hair frame to your look ('<key>_me'). Skipped when nothing changed.
  paint(scene, look) {
    if (!this.ready(scene)) return;
    look = { ...FUP.looksData.default, ...(look || {}) };
    const style = this.hairStyle(look), sig = JSON.stringify(look) + style;
    if (this._sig === sig && scene.textures.exists('hb_body_rest_me')) return;
    this._sig = sig;
    for (const mode of ['battle', 'map']) for (const dir of mode === 'battle' ? ['_'] : this.DIRS) for (const f of this.frames(mode)) {
      for (const layer of ['body', 'hair_' + style]) { const k = this.base(mode, dir, layer, f); FUP.looks.paint(scene, k, k + '_me', look); }
    }
  },
  // A painted key if there is one
  key(scene, k) { return scene.textures.exists(k + '_me') ? k + '_me' : k; },

  // What's on his head: the bucket, unless a Wardrobe hat is worn (Jesus: the hat replaces it)
  showBucket() { return !(FUP.cosmetics && FUP.cosmetics.state && FUP.cosmetics.state.hat); },
  // The weapon in his hand: the base weapon's model, tinted for upgrades
  weapon() {
    const base = (FUP.run && FUP.run.weapon) || 'sword', up = FUP.run && FUP.run.equipped && FUP.run.equipped.weapon;
    const tier = up && FUP.gearData.items[up.key] ? FUP.gearData.items[up.key].tier : 1;
    const tint = ((FUP.weapons[base] || {}).handTint || {})[tier];
    return { id: base, tint: tint ? Phaser.Display.Color.HexStringToColor(tint).color : null };
  },

  make(scene, x, y, mode = 'map', opts = {}) {
    const ui = FUP.ui, scale = ui.artScale(ui.pixelScale * (opts.scale || 1));
    if (!this.ready(scene)) return ui.sprite(scene, x, y, null, '🧍', mode === 'battle' ? 108 : 30);   // (art not loaded: an emoji, like before)
    const look = opts.look || this.look(), style = this.hairStyle(look);
    this.paint(scene, look);
    const dir0 = mode === 'battle' ? '_' : 'side';
    const body = scene.add.image(x, y, this.key(scene, this.base(mode, dir0, 'body', 'rest'))).setScale(scale);
    const layerIds = ['hair_' + style];
    if (opts.bucket !== false && this.showBucket()) layerIds.push('bucket');
    let weapon = null;
    if (mode === 'battle' && opts.weapon !== false) { weapon = this.weapon(); layerIds.push('w_' + weapon.id); }
    const layers = layerIds.map(id => ({ id, img: scene.add.image(x, y, this.key(scene, this.base(mode, dir0, id, 'rest'))).setScale(scale) }));
    if (weapon && weapon.tint) layers[layers.length - 1].img.setTint(weapon.tint);
    const H = body.hero = { mode, dir: dir0, clip: null, frame: 'rest', t: 0, last: null, still: 0, layers };
    body.heroWeapon = weapon ? layers[layers.length - 1].img : null;

    const setFrame = (f) => {
      H.frame = f;
      body.setTexture(this.key(scene, this.base(mode, H.dir, 'body', f)));
      for (const L of layers) L.img.setTexture(this.key(scene, this.base(mode, H.dir, L.id, f)));
    };
    // Fights: play a move once, then breathe again
    body.heroPlay = (clip, onDone) => { H.clip = clip; H.t = 0; H.onDone = onDone || null; };
    body.heroFrame = setFrame;

    const sp = this.speeds();
    const follow = () => {
      if (!body.active) return;
      const dt = Math.min(0.1, scene.game.loop.delta / 1000);
      if (mode === 'battle') {
        const clip = H.clip || 'idle', n = this.BATTLE_CLIPS[clip], step = sp[clip] || 0.15;
        H.t += dt;
        let i = Math.floor(H.t / step);
        if (H.clip && i >= n) { const done = H.onDone; H.clip = null; H.t = 0; i = 0; if (done) done(); }
        const f = `${H.clip || 'idle'}_${i % this.BATTLE_CLIPS[H.clip || 'idle']}`;
        if (f !== H.frame) setFrame(f);
      } else {
        // Maps: walk when the picture moved since last frame; face the way it went
        const p = { x: body.x, y: body.y }, l = H.last; H.last = p;
        const dx = l ? p.x - l.x : 0, dy = l ? p.y - l.y : 0, moved = l && Math.hypot(dx, dy) > 0.05 && Math.hypot(dx, dy) < 40;
        if (moved) {
          H.still = 0;
          const dir = Math.abs(dy) > Math.abs(dx) * 1.2 ? (dy > 0 ? 'front' : 'back') : 'side';
          if (dir !== H.dir) H.dir = dir;
          if (dir === 'side' && Math.abs(dx) > 0.05) body.setFlipX(dx < 0);
          H.t += dt;
          const f = `walk_${Math.floor(H.t / sp.walk) % 4}`;
          if (f !== H.frame || dir !== H.dirShown) { H.dirShown = dir; setFrame(f); }
        } else if ((H.still += dt) > 0.12 && H.frame !== 'rest') { H.dirShown = H.dir; setFrame('rest'); }
      }
      for (let k = 0; k < layers.length; k++) {
        const L = layers[k].img;
        L.setPosition(body.x, body.y).setOrigin(body.originX, body.originY).setScale(body.scaleX, body.scaleY).setFlipX(body.flipX)
          .setAngle(body.angle).setAlpha(body.alpha).setVisible(body.visible).setDepth((body.depth || 0) + 0.01 * (k + 1));
      }
    };
    follow();
    scene.events.on('postupdate', follow);
    const cleanup = () => { scene.events.off('postupdate', follow); for (const L of layers) if (L.img.active) L.img.destroy(); };
    body.once('destroy', cleanup);
    scene.events.once('shutdown', cleanup);
    return body;
  },
};
