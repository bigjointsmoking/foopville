// ============================================================
// AMBIENCE — the life layer on every outdoor map (v0.63). Numbers + pixel art: data/ambience.js.
//   FUP.ambience.attach(scene, opts)   at the END of a map screen's create()
//   FUP.ambience.update(scene, dt)     every frame (even while a window is open)
// opts: { place: 'village' | region id | 'raid', tiles: map ({ tileAt, width, height }),
//         T: square size in px, region: placement region for FUP.place, lamps: 'l' }
// Draws: extra scenery, wind sway, critters, butterflies, birds, fireflies, motes, cloud
// shadows, day/night tint + lights, chimney smoke, water ripples, shadows, footstep dust.
// Nothing here changes the game: it's all looks. Everything is reset per visit
// (Phaser reuses screens), and lives on scene.amb.
// ============================================================
window.FUP = window.FUP || {};

FUP.ambience = {
  D() { return FUP.ambienceData; },
  num(k) { return FUP.look.num(k); },
  rnd(a, b) { return a + Math.random() * (b - a); },
  hash(x, y, k = 0) { const n = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453; return n - Math.floor(n); },
  pick(list) {   // [[key, weight], ...] → key
    let r = Math.random() * list.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of list) { r -= w; if (r <= 0) return k; }
    return list[0][0];
  },
  place(id) { const P = this.D().places; return P[id] || P[this.D().fallback]; },

  // ---------- Textures (made once, kept for the whole game) ----------
  makeTextures(scene) {
    const D = this.D(), tx = scene.textures, hex = k => FUP.look.hex(k);
    const pixel = (key, rows, colour) => {
      if (tx.exists(key)) return;
      const w = rows[0].length, h = rows.length, c = tx.createCanvas(key, w, h), g = c.getContext();
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.') return;
        g.fillStyle = ch === 'c' ? hex(colour) : hex(D.pix[ch] || 'k0');
        g.fillRect(x, y, 1, 1);
      }));
      c.refresh(); c.setFilter(Phaser.Textures.FilterMode.NEAREST);
    };
    for (const [name, frames] of Object.entries(D.art)) {
      const coloured = frames.some(f => f.join('').includes('c'));
      const colours = !coloured ? [null] : name === 'butterfly' ? D.butterflyColors
        : name === 'bird' ? [...new Set([].concat(...Object.values(D.birdColors)))] : (D.artColors[name] || ['k4']);
      for (const col of colours) frames.forEach((f, i) => pixel(`amb_${name}_${i}${col ? '_' + col : ''}`, f, col));
    }
    const soft = (key, w, h, draw) => {
      if (tx.exists(key)) return;
      const c = tx.createCanvas(key, w, h); draw(c.getContext(), w, h); c.refresh();
    };
    // A soft white glow (lights, fireflies, smoke), tinted when used
    soft('amb_glow', 64, 64, (g, w) => {
      const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });
    // A soft round shadow
    soft('amb_shadow', 32, 16, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.setTransform(1, 0, 0, 0.5, 0, h / 4); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });
    // A cloud's shadow: a few soft blobs together
    soft('amb_cloud', 256, 160, (g, w, h) => {
      for (const [cx, cy, r] of [[80, 90, 60], [130, 70, 70], [180, 95, 55], [120, 110, 50], [60, 105, 38], [205, 80, 40]]) {
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.7, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }
    });
    // Dark screen corners
    const W = scene.scale.width, H = scene.scale.height;
    soft('amb_vignette', W, H, (g) => {
      const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.56);
      gr.addColorStop(0, 'rgba(15,14,12,0)'); gr.addColorStop(1, 'rgba(15,14,12,1)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
    pixel('amb_dot', ['ww', 'ww'], null);
  },

  // ---------- Start a visit ----------
  attach(scene, opts) {
    const D = this.D();
    this.makeTextures(scene);
    const P = this.place(opts.place);
    const A = scene.amb = {
      ...opts, P, t: 0, sway: [], critters: [], flyers: [], motes: [], flies: [], clouds: [], birds: [],
      lights: [], smokers: [], shadows: new Map(), dustT: 0, birdT: this.rnd(2, 6), rippleT: this.rnd(1, 4),
      gustX: -9999, gustT: this.rnd(2, 6), lastP: null, lightT: 0,
      gloom: (D.gloom && D.gloom[opts.place]) || 0,
    };
    A.W = A.tiles.width() * A.T; A.H = A.tiles.height() * A.T;
    A.avoid = this.avoidMap(scene, A);
    this.dress(scene, A);
    this.collectSway(scene, A);
    this.collectLights(scene, A);
    this.spawnCritters(scene, A);
    this.makeSky(scene, A);
    this.update(scene, 0);
  },

  // Squares where nothing extra may go: near anything you use, buildable zones, ruins
  avoidMap(scene, A) {
    const TW = A.tiles.width(), TH = A.tiles.height(), T = A.T, bad = new Uint8Array(TW * TH);
    const mark = (tx, ty, r = 1) => {
      for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (x >= 0 && y >= 0 && x < TW && y < TH) bad[y * TW + x] = 1;
    };
    for (const s of scene.spots || []) mark(Math.floor(s.x / T), Math.floor(s.y / T), 1);
    // Pictures already standing on the map (villagers, signs, campfire, tutorial bits); not trees or scenery
    for (const o of scene.children.list) {
      const key = o.texture && o.texture.key;
      if (!key || o.depth < 0 || o.scrollFactorX === 0 || /^(tree_|deco_|bush|rock|__)/.test(key)) continue;
      if (o.type !== 'Image' && o.type !== 'Sprite') continue;
      mark(Math.floor(o.x / T), Math.floor((o.y - 2) / T), 1);
    }
    if (A.region === 'village') {
      // Build zones: flat things only (2), so what you build sits on top of them
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) if (FUP.place && FUP.place.zoneAt('village', x, y) && !bad[y * TW + x]) bad[y * TW + x] = 2;
      for (const r of (FUP.repairs && FUP.repairs.list()) || []) {
        const s = r.site;
        if (s) for (let y = s.ty - 1; y <= s.ty + s.h; y++) for (let x = s.tx - 1; x <= s.tx + s.w; x++) mark(x, y, 0);
        for (const c of r.clutter || []) mark(c.tx, c.ty, 1);
      }
    }
    return bad;
  },

  // ---------- Extra scenery in natural clumps ----------
  dress(scene, A) {
    const D = this.D(), R = A.P.dress && D.dressing[A.P.dress];
    if (!R) return;
    const F = A.tiles, T = A.T, TW = F.width(), TH = F.height(), G = FUP.forestGround;
    const water = '~', path = '=bB', plainOk = '.#~=bBP';
    const standing = new Set(D.standing);
    for (let ty = 1; ty < TH - 1; ty++) {
      for (let tx = 1; tx < TW - 1; tx++) {
        const av = A.avoid[ty * TW + tx];
        if (F.tileAt(tx, ty) !== '.' || av === 1) continue;
        let quiet = true, tree = false, wat = false, pth = false;
        for (let dy = -1; dy <= 1 && quiet; dy++) for (let dx = -1; dx <= 1; dx++) {
          const ch = F.tileAt(tx + dx, ty + dy);
          if (!plainOk.includes(ch)) { quiet = false; break; }
          if (dx && dy) continue;
          if (ch === '#') tree = true; else if (water.includes(ch)) wat = true; else if (path.includes(ch)) pth = true;
        }
        if (!quiet) continue;
        const where = tree ? 'treeEdge' : wat ? 'waterEdge' : pth ? 'pathEdge' : 'open';
        const clump = G.fbm(tx / R.clump + 31.7, ty / R.clump + 11.3);
        const dens = where === 'open' ? R.open * Math.max(0, Math.min(1, (clump - 0.3) / 0.3)) : R[where] * (0.45 + 0.55 * clump);
        if (this.hash(tx, ty, 41) > dens) continue;
        const n = R.perSquare[0] + Math.floor(this.hash(tx, ty, 42) * (R.perSquare[1] - R.perSquare[0] + 1));
        for (let i = 0; i < n; i++) {
          const picks = av === 2 ? R[where + '_pick'].filter(([k]) => !standing.has(k)) : R[where + '_pick'];
          if (!picks.length) break;
          const key = this.pickSeeded(picks, this.hash(tx, ty, 43 + i));
          const art = key.startsWith('amb_'), cols = art && D.artColors[key.slice(4)];
          const tex = !art ? key : cols ? `${key}_0_${cols[Math.floor(this.hash(tx, ty, 90 + i) * cols.length)]}` : `${key}_0`;
          if (!scene.textures.exists(tex)) continue;
          const x = tx * T + T * (0.15 + this.hash(tx, ty, 50 + i) * 0.7), y = ty * T + T * (0.3 + this.hash(tx, ty, 60 + i) * 0.65);
          const sc = art ? D.pixelScale : FUP.ui.pixelScale * (D.dressScale[0] + this.hash(tx, ty, 70 + i) * (D.dressScale[1] - D.dressScale[0]));
          const o = scene.add.image(x, y, tex).setOrigin(0.5, 1).setScale(sc).setDepth(standing.has(key) ? y : -5 + i * 0.01);
          if (this.hash(tx, ty, 80 + i) < 0.5) o.setFlipX(true);
        }
      }
    }
  },
  pickSeeded(list, r) {
    r *= list.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of list) { r -= w; if (r <= 0) return k; }
    return list[0][0];
  },

  // ---------- Wind: everything with a bottom origin that's a plant or tree ----------
  collectSway(scene, A) {
    const S = this.D().wind.sway;
    for (const o of scene.children.list) {
      const key = o.texture && o.texture.key;
      if (!key || o.originY < 0.85) continue;
      const base = key.startsWith('amb_') ? key.replace(/_\d+(_\w+)?$/, '') : key;   // amb_flower_0_p2 → amb_flower
      const amp = S[base] || (key.startsWith('tree_') ? S.tree : 0);
      if (amp) A.sway.push({ o, amp, ph: o.x * 0.011 + o.y * 0.006, base: o.angle });
    }
  },

  // ---------- Lights: lamps, windows, campfires, glowing mushrooms ----------
  collectLights(scene, A) {
    const D = this.D(), L = D.lights, T = A.T, F = A.tiles;
    const add = (x, y, kind) => {
      if (A.lights.length >= 70) return;
      const l = L[kind];
      const o = scene.add.image(x, y, 'amb_glow').setTint(this.num(l.color)).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(l.radius * 2, l.radius * 2).setDepth(6505).setAlpha(0);
      A.lights.push({ o, kind, ph: Math.random() * 6 });
    };
    if (A.lamps) for (let ty = 0; ty < F.height(); ty++) for (let tx = 0; tx < F.width(); tx++)
      if (F.tileAt(tx, ty) === A.lamps) add(tx * T + T / 2, ty * T + T * 0.2, 'lamp');
    for (const o of scene.children.list.slice()) {
      const key = o.texture && o.texture.key;
      if (!key) continue;
      if (key === 'campfire') add(o.x, o.y, 'fire');
      else if (key === 'deco_glowshroom') add(o.x, o.y - 6, 'glow');
      else {
        const bits = Object.entries(D.buildingBits).find(([k]) => key === k || key.startsWith(k + '_'));
        if (!bits || o.originY < 0.9) continue;
        const b = bits[1], w = o.displayWidth, h = o.displayHeight, left = o.x - w * o.originX, bottom = o.y + h * (1 - o.originY);
        for (const [fx, fy] of b.windows || []) add(left + fx * w, bottom - fy * h, 'window');
        if (b.chimney) A.smokers.push({ x: left + b.chimney[0] * w, y: bottom - b.chimney[1] * h, heavy: b.smoke === 'heavy', t: Math.random() });
      }
    }
    if (scene.player) {
      const l = L.player;
      A.playerLight = scene.add.image(0, 0, 'amb_glow').setTint(this.num(l.color)).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(l.radius * 2, l.radius * 2).setDepth(6505).setAlpha(0);
    }
  },

  // ---------- Critters ----------
  spawnCritters(scene, A) {
    const D = this.D(), F = A.tiles, T = A.T, TW = F.width(), TH = F.height();
    for (const spec of A.P.critters || []) {
      const C = D.critters[spec.id];
      if (!C) continue;
      const nearOk = (tx, ty) => {
        if (!spec.near) return true;
        const r = spec.within || 2;
        for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (spec.near.includes(F.tileAt(x, y))) return true;
        return false;
      };
      let cand = [];
      for (let ty = 1; ty < TH - 1; ty++) for (let tx = 1; tx < TW - 1; tx++) {
        if (!C.on.includes(F.tileAt(tx, ty)) || A.avoid[ty * TW + tx] === 1 && C.move !== 'swim') continue;
        if (spec.rows && (ty < spec.rows[0] || ty > spec.rows[1])) continue;
        if (C.move !== 'swim' && this.blockedAt(A, tx, ty)) continue;
        cand.push([tx, ty]);
      }
      const near = cand.filter(([x, y]) => nearOk(x, y));
      if (near.length) cand = near;
      for (let i = 0; i < spec.n && cand.length; i++) {
        const [tx, ty] = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
        const x = tx * T + T / 2, y = ty * T + T * 0.7;
        const s = scene.add.image(x, y, `amb_${spec.id}_0`).setOrigin(0.5, 1).setScale(D.pixelScale).setDepth(y);
        const shadow = C.shadow ? scene.add.image(x, y, 'amb_shadow').setTint(this.num(D.shadow.color)).setAlpha(D.shadow.alpha)
          .setDisplaySize(C.shadow * 2.4, C.shadow).setDepth(-4) : null;
        const cr = { id: spec.id, C, s, shadow, x, y, home: { x, y }, mode: 'idle', t: this.rnd(0, 2), frame: 0, ft: 0, hop: 0, dir: Math.random() < 0.5 ? -1 : 1, zT: this.rnd(1, 4) };
        if (C.move === 'sleep') this.sleepTween(scene, cr);
        s.setFlipX(cr.dir < 0);
        A.critters.push(cr);
      }
    }
  },
  sleepTween(scene, cr) {
    scene.tweens.add({ targets: cr.s, scaleY: cr.s.scaleY * 1.08, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
  blockedAt(A, tx, ty) {
    if (A.region === 'village') return FUP.villageMap.blockedTile(tx, ty) || (FUP.place && FUP.place.blocked('village', tx, ty));
    return false;
  },
  canStand(A, C, x, y) {
    const tx = Math.floor(x / A.T), ty = Math.floor(y / A.T);
    if (!C.on.includes(A.tiles.tileAt(tx, ty))) return false;
    return C.move === 'swim' || !this.blockedAt(A, tx, ty);
  },
  newTarget(A, cr, awayFrom) {
    const T = A.T, C = cr.C;
    for (let k = 0; k < 10; k++) {
      let ang = Math.random() * Math.PI * 2, dist = this.rnd(0.6, C.radius) * T;
      if (awayFrom) { ang = Math.atan2(cr.y - awayFrom.y, cr.x - awayFrom.x) + this.rnd(-0.7, 0.7); dist = this.rnd(1.5, 3) * T; }
      const bx = awayFrom ? cr.x : cr.home.x, by = awayFrom ? cr.y : cr.home.y;
      const x = bx + Math.cos(ang) * dist, y = by + Math.sin(ang) * dist * 0.8;
      if (this.canStand(A, C, x, y)) return { x, y };
    }
    return null;
  },
  updateCritters(scene, A, dt) {
    const p = scene.player, view = this.view(scene, 80);
    for (const cr of A.critters) {
      const C = cr.C, s = cr.s;
      if (!s.active) continue;
      const on = view.contains(cr.x, cr.y);
      s.setVisible(on); if (cr.shadow) cr.shadow.setVisible(on);
      if (!on) continue;
      // Run away from you
      if (C.flee && p && cr.mode !== 'flee' && Phaser.Math.Distance.Between(p.x, p.y, cr.x, cr.y) < C.flee) {
        const tgt = this.newTarget(A, cr, p);
        if (tgt) { cr.mode = 'flee'; cr.tgt = tgt; if (cr.id === 'chicken' && Math.random() < 0.5) this.feathers(scene, cr); }
      }
      cr.ft += dt;
      if (C.move === 'sleep') {
        cr.zT -= dt;
        if (cr.zT <= 0) { cr.zT = this.rnd(2.5, 4.5); this.zzz(scene, cr); }
      } else if (cr.mode === 'idle') {
        cr.t -= dt;
        // Idle habits: peck / nibble / dive now and then
        if (cr.ft > 0.35) { cr.ft = 0; cr.frame = Math.random() < 0.4 ? C.act : 0; }
        if (C.move === 'swim' && cr.ft === 0 && Math.random() < 0.5) cr.frame = cr.frame === 1 ? 0 : 1;
        if (cr.t <= 0) {
          const tgt = this.newTarget(A, cr);
          if (tgt) { cr.tgt = tgt; cr.mode = 'move'; } else cr.t = this.rnd(...C.idle);
        }
      } else {
        const speed = cr.mode === 'flee' ? C.fleeSpeed || C.speed * 2 : C.speed;
        const dx = cr.tgt.x - cr.x, dy = cr.tgt.y - cr.y, d = Math.hypot(dx, dy);
        if (d < 3) { cr.mode = 'idle'; cr.t = this.rnd(...(C.idle || [2, 4])); cr.frame = 0; cr.hop = 0; }
        else {
          const step = Math.min(d, speed * dt), nx = cr.x + dx / d * step, ny = cr.y + dy / d * step;
          if (!this.canStand(A, C, nx, ny)) { cr.mode = 'idle'; cr.t = this.rnd(0.5, 1.5); }
          else {
            cr.x = nx; cr.y = ny;
            if (C.move !== 'scuttle' && Math.abs(dx) > 1) { cr.dir = dx < 0 ? -1 : 1; s.setFlipX(cr.dir < 0); }
            if (C.move === 'hop') { cr.hop = (cr.hop + dt * (speed / 40) * 2.2) % 1; cr.frame = cr.hop < 0.8 ? 1 : 0; }
            else if (cr.ft > (C.move === 'swim' ? 0.5 : 0.14)) { cr.ft = 0; cr.frame = cr.frame === 0 ? 1 : 0; }
          }
        }
      }
      const lift = C.move === 'hop' && cr.mode !== 'idle' ? Math.sin(cr.hop * Math.PI) * 7 : 0;
      s.setPosition(cr.x, cr.y - lift).setDepth(cr.y);
      const key = `amb_${cr.id}_${cr.frame}`;
      if (s.texture.key !== key && scene.textures.exists(key)) s.setTexture(key);
      if (cr.shadow) cr.shadow.setPosition(cr.x, cr.y - 1).setScale((C.shadow * 2.4 / 32) * (1 - lift / 20), (C.shadow / 16) * (1 - lift / 20));
    }
  },
  zzz(scene, cr) {
    const z = FUP.ui.text(scene, cr.x + 8, cr.y - 14, 'z', 11, FUP.look.hex('k4'), { fontStyle: '700', stroke: FUP.look.hex('k0'), strokeThickness: 3 }).setDepth(cr.y + 1);
    scene.tweens.add({ targets: z, x: z.x + 10, y: z.y - 22, alpha: 0, duration: 1800, onComplete: () => z.destroy() });
  },
  feathers(scene, cr) {
    for (let i = 0; i < 4; i++) {
      const f = scene.add.image(cr.x, cr.y - 10, 'amb_dot').setScale(1.2).setDepth(cr.y + 2);
      scene.tweens.add({ targets: f, x: f.x + this.rnd(-18, 18), y: f.y + this.rnd(-16, 6), alpha: 0, angle: 180, duration: 700, onComplete: () => f.destroy() });
    }
  },

  // ---------- Sky things: clouds, the day tint, vignette, flyers, motes, fireflies ----------
  makeSky(scene, A) {
    const D = this.D(), P = A.P, W = scene.scale.width, H = scene.scale.height;
    if (P.clouds) for (let i = 0; i < D.clouds.count; i++) {
      const sz = this.rnd(...D.clouds.size);
      const c = scene.add.image(this.rnd(0, A.W), this.rnd(0, A.H), 'amb_cloud').setDisplaySize(sz, sz * 0.62).setDepth(6450).setAlpha(D.clouds.alpha);
      A.clouds.push({ o: c, v: this.rnd(...D.clouds.speed) });
    }
    if (P.dayNight) A.tint = scene.add.rectangle(0, 0, W, H, 0xffffff, 0).setOrigin(0).setScrollFactor(0).setDepth(6480).setBlendMode(Phaser.BlendModes.MULTIPLY);
    if (P.vignette) scene.add.image(0, 0, 'amb_vignette').setOrigin(0).setScrollFactor(0).setDepth(6510).setAlpha(P.vignette);
    const flyer = (kind, n, colours) => {
      for (let i = 0; i < n; i++) {
        const col = colours ? colours[Math.floor(Math.random() * colours.length)] : null;
        const o = scene.add.image(0, 0, `amb_${kind}_0${col ? '_' + col : ''}`).setScale(D.pixelScale).setDepth(4900).setVisible(false);
        A.flyers.push({ kind, o, col, x: 0, y: 0, vx: 0, vy: 0, ft: Math.random(), frame: 0, live: false, t: 0 });
      }
    };
    flyer('butterfly', P.butterflies || 0, D.butterflyColors);
    flyer('dragonfly', P.dragonflies || 0, null);
    for (let i = 0; i < (P.motes || 0); i++) {
      const o = scene.add.image(0, 0, 'amb_glow').setTint(this.num(P.moteColor || D.motes.color)).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(7, 7).setDepth(4950).setVisible(false);
      A.motes.push({ o, live: false, ph: Math.random() * 6 });
    }
    if (P.fireflies) for (let i = 0; i < D.fireflies; i++) {
      const o = scene.add.image(0, 0, 'amb_glow').setTint(this.num(D.fireflyColor)).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(14, 14).setDepth(6506).setVisible(false);
      A.flies.push({ o, live: false, ph: Math.random() * 6, vx: 0, vy: 0 });
    }
  },

  // Somewhere on screen that isn't a wall or water (for butterflies / motes)
  spotInView(scene, A, chars) {
    const v = scene.cameras.main.worldView, T = A.T;
    for (let k = 0; k < 12; k++) {
      const x = this.rnd(v.x, v.right), y = this.rnd(v.y, v.bottom);
      if (chars.includes(A.tiles.tileAt(Math.floor(x / T), Math.floor(y / T)))) return { x, y };
    }
    return null;
  },
  view(scene, pad) {
    const v = scene.cameras.main.worldView;
    return new Phaser.Geom.Rectangle(v.x - pad, v.y - pad, v.width + pad * 2, v.height + pad * 2);
  },

  // How dark it is now (0-1), from the day clock, the place's gloom and its tint strength
  darkness(A) {
    const K = this.D().darkness, s = FUP.clock ? FUP.clock.share() : 0.4;
    let d = 0;
    for (let i = 1; i < K.length; i++) if (s <= K[i][0]) { const [a, va] = K[i - 1], [b, vb] = K[i]; d = va + (vb - va) * ((s - a) / (b - a || 1)); break; }
    return Math.max(d * (A.P.dayNight || 0), A.gloom);
  },
  daylight() {
    const K = this.D().daylight, s = FUP.clock ? FUP.clock.share() : 0.4;
    for (let i = 1; i < K.length; i++) if (s <= K[i].at) {
      const a = K[i - 1], b = K[i], f = (s - a.at) / (b.at - a.at || 1);
      const ca = Phaser.Display.Color.IntegerToColor(this.num(a.color)), cb = Phaser.Display.Color.IntegerToColor(this.num(b.color));
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 1, f);
      return { color: Phaser.Display.Color.GetColor(c.r, c.g, c.b), alpha: a.alpha + (b.alpha - a.alpha) * f };
    }
    return { color: 0xffffff, alpha: 0 };
  },

  // ---------- Every frame ----------
  update(scene, dt) {
    const A = scene.amb;
    if (!A || !scene.cameras || !scene.cameras.main) return;
    const D = this.D(), P = A.P, cam = scene.cameras.main;
    A.t += dt;
    const t = A.t;
    // Light (every quarter second is plenty)
    A.lightT -= dt;
    if (A.lightT <= 0) {
      A.lightT = 0.25;
      A.dark = this.darkness(A);
      if (A.tint) { const dl = this.daylight(); A.tint.setFillStyle(dl.color, dl.alpha * P.dayNight); }
      for (const b of scene.sunbeams || []) b.setVisible(A.dark < 0.35);   // no sunbeams at dusk or night
    }
    const dark = A.dark || 0;
    for (const l of A.lights) {
      const L = D.lights[l.kind], base = l.kind === 'fire' ? 0.35 + dark * 0.65 : l.kind === 'glow' ? Math.max(dark, 0.35) : dark;
      l.o.setAlpha(L.alpha * base * (0.9 + 0.1 * Math.sin(t * (l.kind === 'fire' ? 9 : 2.5) + l.ph)));
    }
    if (A.playerLight && scene.player) A.playerLight.setPosition(scene.player.x, scene.player.y - 6).setAlpha(D.lights.player.alpha * Math.max(0, dark - 0.25) / 0.75);

    this.updateWind(scene, A, dt);
    this.updateCritters(scene, A, dt);
    this.updateFlyers(scene, A, dt, dark);
    this.updateBirds(scene, A, dt, dark);
    this.updateSmoke(scene, A, dt);
    this.updateRipples(scene, A, dt);
    this.updateShadows(scene, A, dt);
    for (const c of A.clouds) {
      c.o.x += c.v * dt; c.o.y += c.v * 0.25 * dt;
      if (c.o.x - c.o.displayWidth / 2 > A.W) { c.o.x = -c.o.displayWidth / 2; c.o.y = this.rnd(0, A.H); }
      if (c.o.y - c.o.displayHeight / 2 > A.H) c.o.y = -c.o.displayHeight / 2;
      c.o.setAlpha(D.clouds.alpha * (1 - dark));
    }
  },

  updateWind(scene, A, dt) {
    const W = this.D().wind, t = A.t, v = this.view(scene, 60);
    A.gustT -= dt;
    if (A.gustT <= 0) { A.gustT = this.rnd(...W.gustEvery); A.gustX = scene.cameras.main.worldView.x - W.gustWidth; }
    A.gustX += W.gustSpeed * dt;
    for (const s of A.sway) {
      const o = s.o;
      if (!o.active || !v.contains(o.x, o.y)) continue;
      const g = Math.exp(-((((o.x + o.y * 0.3) - A.gustX) / W.gustWidth) ** 2));
      const wave = Math.sin(t * W.speed + s.ph) * 0.6 + Math.sin(t * W.speed * 2.3 + s.ph * 1.7) * 0.25;
      o.angle = s.base + s.amp * (wave * (1 + g * (W.gustLean - 1)) + g * 0.9);
    }
  },

  updateFlyers(scene, A, dt, dark) {
    const D = this.D(), v = this.view(scene, 120), t = A.t;
    for (const f of A.flyers) {
      const want = f.kind === 'butterfly' ? dark < 0.4 : dark < 0.6;
      if (!f.live) {
        if (!want || Math.random() > dt * 1.5) { f.o.setVisible(false); continue; }
        const at = this.spotInView(scene, A, f.kind === 'dragonfly' ? '~F' : '.');
        if (!at) continue;
        f.x = at.x; f.y = at.y; f.live = true; f.t = 0; f.home = { ...at }; f.o.setVisible(true).setAlpha(0);
      }
      f.t += dt;
      if (f.kind === 'butterfly') {
        // Flutter: wobbly drift around where it started
        f.vx += (Math.random() - 0.5) * 140 * dt + (f.home.x - f.x) * 0.15 * dt;
        f.vy += (Math.random() - 0.5) * 140 * dt + (f.home.y - f.y) * 0.15 * dt;
        f.vx *= 0.97; f.vy *= 0.97;
        f.x += f.vx * dt; f.y += f.vy * dt + Math.sin(t * 9 + f.ft * 10) * 0.6;
        f.ft += dt; if (f.ft > 0.11) { f.ft = 0; f.frame ^= 1; }
      } else {
        // Dragonfly: darts, hovers, darts
        if (!f.dart || f.t > f.dart) { f.dart = f.t + this.rnd(0.5, 1.6); const a = Math.random() * 6.28, sp = this.rnd(30, 120); f.vx = Math.cos(a) * sp; f.vy = Math.sin(a) * sp * 0.6; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.94; f.vy *= 0.94;
        f.ft += dt; if (f.ft > 0.05) { f.ft = 0; f.frame ^= 1; }
        f.o.setFlipX(f.vx < 0);
      }
      const key = `amb_${f.kind}_${f.frame}${f.col ? '_' + f.col : ''}`;
      if (f.o.texture.key !== key) f.o.setTexture(key);
      f.o.setPosition(f.x, f.y - 18).setAlpha(Math.min(1, f.t * 2) * (want ? 1 : Math.max(0, 1 - f.t)));
      if (!v.contains(f.x, f.y) || f.t > 25 || !want) { f.live = false; f.o.setVisible(false); }
    }
    // Motes: tiny specks of sunlight (or spores) drifting
    for (const m of A.motes) {
      const want = A.P.moteColor ? true : dark < 0.5;
      if (!m.live) {
        if (!want || Math.random() > dt * 2) { m.o.setVisible(false); continue; }
        const vv = scene.cameras.main.worldView;
        m.x = this.rnd(vv.x, vv.right); m.y = this.rnd(vv.y, vv.bottom); m.t = 0; m.life = this.rnd(4, 8); m.live = true; m.o.setVisible(true);
      }
      m.t += dt;
      m.x += Math.sin(t * 0.7 + m.ph) * D.motes.speed * dt + 4 * dt; m.y -= D.motes.speed * 0.5 * dt;
      m.o.setPosition(m.x, m.y).setAlpha(D.motes.alpha * Math.sin(Math.PI * Math.min(1, m.t / m.life)) * (0.6 + 0.4 * Math.sin(t * 3 + m.ph)));
      if (m.t >= m.life) { m.live = false; m.o.setVisible(false); }
    }
    // Fireflies: out when it's dark (or gloomy), blinking slowly
    const fireOn = Math.max(0, (dark - 0.3) / 0.7);
    for (const f of A.flies) {
      if (!f.live) {
        if (fireOn <= 0 || Math.random() > dt * 2) { f.o.setVisible(false); continue; }
        const at = this.spotInView(scene, A, '.~#=');
        if (!at) continue;
        f.x = at.x; f.y = at.y; f.t = 0; f.life = this.rnd(6, 12); f.live = true; f.o.setVisible(true);
      }
      f.t += dt;
      f.vx += (Math.random() - 0.5) * 30 * dt; f.vy += (Math.random() - 0.5) * 30 * dt;
      f.vx *= 0.98; f.vy *= 0.98;
      f.x += f.vx * dt; f.y += f.vy * dt;
      const blink = Math.max(0, Math.sin(t * 1.6 + f.ph)) ** 2;
      f.o.setPosition(f.x, f.y).setAlpha(fireOn * blink * Math.sin(Math.PI * Math.min(1, f.t / f.life)));
      if (f.t >= f.life) { f.live = false; f.o.setVisible(false); }
    }
  },

  updateBirds(scene, A, dt, dark) {
    const D = this.D(), kind = A.P.birds;
    if (kind && dark < 0.5) {
      A.birdT -= dt;
      if (A.birdT <= 0) {
        A.birdT = this.rnd(...D.birdEvery);
        const v = scene.cameras.main.worldView, fromLeft = Math.random() < 0.5, n = Math.round(this.rnd(...D.birdFlock));
        const cols = D.birdColors[kind === 'gulls' ? 'gulls' : 'birds'], y0 = this.rnd(v.y + 40, v.y + v.height * 0.6), vy = this.rnd(-20, 25);
        for (let i = 0; i < n; i++) {
          const col = cols[Math.floor(Math.random() * cols.length)];
          const x = fromLeft ? v.x - 40 - i * 26 : v.right + 40 + i * 26, y = y0 + (i % 2 ? 14 : -10) * Math.ceil(i / 2);
          const o = scene.add.image(x, y, `amb_bird_0_${col}`).setScale(D.pixelScale).setDepth(6470).setFlipX(!fromLeft);
          const sh = scene.add.image(x + D.birdShadow.dx, y + D.birdShadow.dy, `amb_bird_0_${col}`).setScale(D.pixelScale).setTintFill(this.num('k0')).setAlpha(D.birdShadow.alpha).setDepth(-3);
          A.birds.push({ o, sh, col, vx: (fromLeft ? 1 : -1) * D.birdSpeed * this.rnd(0.9, 1.1), vy, ft: Math.random() * 0.3, frame: 0, life: 0 });
        }
      }
    }
    for (const b of A.birds) {
      b.life += dt; b.ft += dt;
      if (b.ft > 0.18) { b.ft = 0; b.frame ^= 1; const k = `amb_bird_${b.frame}_${b.col}`; b.o.setTexture(k); b.sh.setTexture(k); }
      b.o.x += b.vx * dt; b.o.y += b.vy * dt;
      b.sh.setPosition(b.o.x + D.birdShadow.dx, b.o.y + D.birdShadow.dy);
      if (b.life > 30) { b.o.destroy(); b.sh.destroy(); b.dead = true; }
    }
    A.birds = A.birds.filter(b => !b.dead);
  },

  updateSmoke(scene, A, dt) {
    const S = this.D().smoke, v = this.view(scene, 60);
    for (const c of A.smokers) {
      if (!v.contains(c.x, c.y)) continue;
      c.t -= dt;
      if (c.t > 0) continue;
      c.t = (c.heavy ? S.heavyEvery : S.every) * this.rnd(0.7, 1.3);
      const o = scene.add.image(c.x + this.rnd(-2, 2), c.y, 'amb_glow').setTint(this.num(S.color)).setDisplaySize(10, 10).setAlpha(S.alpha).setDepth(c.y + 400);
      scene.tweens.add({ targets: o, y: c.y - S.rise * this.rnd(0.8, 1.2), x: o.x + this.rnd(8, 22), displayWidth: 30, displayHeight: 30, alpha: 0, duration: S.life * 1000, ease: 'Sine.easeOut', onComplete: () => o.destroy() });
    }
  },

  // Rings on water in view, and now and then a fish jumps
  updateRipples(scene, A, dt) {
    const D = this.D();
    A.rippleT -= dt;
    if (A.rippleT > 0) return;
    A.rippleT = this.rnd(...D.fishJumpEvery);
    const at = this.spotInView(scene, A, '~');
    if (!at) return;
    const ring = (delay) => {
      const r = scene.add.ellipse(at.x, at.y, 8, 4).setStrokeStyle(1.5, this.num('b4'), 0.8).setDepth(-4);
      scene.tweens.add({ targets: r, scaleX: 4, scaleY: 4, alpha: 0, duration: 1400, delay, onComplete: () => r.destroy() });
    };
    ring(0); ring(350);
    if (Math.random() < 0.45 && A.place !== 'raid') {
      const f = scene.add.image(at.x - 10, at.y, 'amb_fish_0').setScale(D.pixelScale).setDepth(-3);
      scene.tweens.add({ targets: f, x: at.x + 14, duration: 600, onComplete: () => { f.destroy(); ring(0); } });
      scene.tweens.add({ targets: f, y: at.y - 18, angle: 40, duration: 300, yoyo: true, ease: 'Sine.easeOut' });
    }
  },

  // Soft shadows under you, villagers and enemies; dust when you walk
  updateShadows(scene, A, dt) {
    const D = this.D(), list = [scene.player, ...(scene.enemySprites || [])];
    for (const s of scene.spots || []) if (s.kind === 'npc' && s.sprite) list.push(s.sprite);
    const seen = new Set();
    for (const s of list) {
      if (!s || !s.active || !s.texture) continue;
      seen.add(s);
      let sh = A.shadows.get(s);
      if (!sh) { sh = scene.add.image(0, 0, 'amb_shadow').setTint(this.num(D.shadow.color)).setDepth(-4); A.shadows.set(s, sh); }
      const w = Math.max(14, s.displayWidth * 0.6);
      sh.setPosition(s.x, s.y + s.displayHeight * (1 - s.originY) - 3).setDisplaySize(w, w * 0.38)
        .setAlpha(D.shadow.alpha * (s.visible ? s.alpha : 0));
    }
    for (const [s, sh] of A.shadows) if (!seen.has(s)) { sh.destroy(); A.shadows.delete(s); }
    // Dust puffs at your feet
    const p = scene.player;
    if (!p) return;
    const moved = A.lastP ? Math.hypot(p.x - A.lastP.x, p.y - A.lastP.y) : 0;
    A.lastP = { x: p.x, y: p.y };
    A.dustT -= dt;
    if (moved > 0.6 && A.dustT <= 0) {
      A.dustT = D.dust.every;
      const fy = p.y + p.displayHeight * (1 - p.originY) - 2;
      const o = scene.add.image(p.x + this.rnd(-4, 4), fy, 'amb_glow').setTint(this.num(D.dust.color)).setDisplaySize(8, 6).setAlpha(D.dust.alpha).setDepth(-3);
      scene.tweens.add({ targets: o, y: fy - 6, displayWidth: 18, displayHeight: 12, alpha: 0, duration: D.dust.life * 1000, onComplete: () => o.destroy() });
    }
  },
};
