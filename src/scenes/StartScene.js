// ============================================================
// START SCREEN — the title. Foopville at dusk in front of the dark
// Forest, the Mushroom Landlord looming behind the trees and a dragon
// in the sky. Continue your saved life, or start a new one
// (which opens the character creator).
// Colours and positions: data/look.js (title).
// ============================================================
class StartScene extends Phaser.Scene {
  constructor() { super('Start'); }

  create() {
    FUP.audio.music('title');
    const ui = FUP.ui, c = ui.colors, L = FUP.look, TT = L.title;
    const W = this.scale.width, H = this.scale.height;
    this.retired = FUP.save.retireOld();   // a save from before version 2: gone, the narrator says so once
    this.saved = FUP.save.summary();

    // ---------- Back to front: sky, dragon, mountains, Landlord, Forest, village ----------
    this.add.image(0, 0, this.paintSky(W, H)).setOrigin(0).setScale(2).setDepth(-50);
    this.twinkle(W);

    const D = TT.dragon;
    const dragon = FUP.anim.sprite(this, D.x, D.y, 'title_dragon', 'idle', '🐉', 120, D.scale).setDepth(-38);   // in front of the mountains, behind the Landlord
    this.tweens.add({ targets: dragon, x: D.x + D.driftX, y: D.y - D.driftY, duration: D.driftMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.image(0, 0, this.paintMountains(W, H)).setOrigin(0).setScale(2).setDepth(-40);
    this.drawLandlord();

    // The dark Forest: two rows of trees along the horizon
    const keys = TT.treeRow.filter(k => this.textures.exists(k));
    for (let row = 0; row < 2; row++) {
      for (let i = 0, x = row * 40 - 20; x < W + 60; i++, x += 62 + (i % 3) * 10) {
        if (!keys.length) break;
        const t = this.add.image(x, 448 + row * 14, keys[(i + row) % keys.length]).setOrigin(0.5, 1).setScale(2 + row * 0.5).setDepth(-30 + row);
        if (i % 2) t.setFlipX(true);
      }
    }
    this.add.image(0, 0, this.paintGround(W, H)).setOrigin(0).setScale(2).setDepth(-20);
    this.drawVillage(W, H);
    this.fireflies(W);

    // Your hero (in your colours) on the path, facing the Forest
    if (this.saved) FUP.looks.apply(this, this.saved.look);
    ui.sprite(this, W / 2, 590, FUP.looks.key('hero'), '🧍', 60, 2).setOrigin(0.5, 1).setDepth(5);

    // ---------- The title ----------
    const LG = TT.logo;
    const glow = this.add.ellipse(W / 2, LG.y + 6, 640, 120, L.num(LG.glow), 0.16).setDepth(9);
    this.tweens.add({ targets: glow, alpha: 0.3, scaleX: 1.05, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const logo = this.textures.exists('title_logo')
      ? this.add.image(W / 2, LG.y, 'title_logo').setScale(LG.scale)
      : ui.text(this, W / 2, LG.y, 'FOOPVILLE', 80, c.accent, { fontStyle: '700', stroke: c.stroke, strokeThickness: 8 }).setOrigin(0.5);
    logo.setDepth(10).setAlpha(0).setScale(logo.scaleX * 1.6);
    this.tweens.add({ targets: logo, alpha: 1, scale: LG.scale, duration: LG.dropMs, ease: 'Back.easeOut', delay: 250,
      onComplete: () => { FUP.fx.shake(this, 'kill'); FUP.fx.burst(this, W / 2 - 200, LG.y + 30, 'coins', 11); FUP.fx.burst(this, W / 2 + 200, LG.y + 30, 'coins', 11);
        this.tweens.add({ targets: logo, y: LG.y - 4, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); } });
    ui.text(this, W / 2, LG.y + 58, 'HARDCORE OR NORMAL MODE · v0.62', 13, c.dim, { letterSpacing: 3, stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5).setDepth(10);
    this.startQuips(W);

    ui.muteButton(this, W - 30, 30);
    this.drawButtons();
    // Music licence (CC BY 4.0) needs this credit on screen. Full list: CREDITS.md
    ui.text(this, W / 2, H - 30, 'Music: Kevin MacLeod (incompetech.com), CC BY 4.0 · Sounds: Kenney, rubberduck (CC0)', 10, c.dim, { stroke: c.stroke, strokeThickness: 2 }).setOrigin(0.5, 1).setDepth(10);
    ui.text(this, W / 2, H - 10, 'Time doesn\'t stop while you choose an action. In Hardcore, dying wipes everything.', 13, c.dim,
      { stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(10);
  }

  // ---------- Painted layers (palette colours only, half size, shown at 2x) ----------
  paintSky(W, H) {
    const key = 'title_sky';
    if (this.textures.exists(key)) return key;
    const L = FUP.look, TT = L.title, w = W / 2, h = H / 2, G = FUP.forestGround;
    const sky = TT.sky.map(k => G.rgb(L.hex(k))), horizon = 225;
    const tex = this.textures.createCanvas(key, w, h), ctx = tex.getContext(), img = ctx.createImageData(w, h), d = img.data;
    const M = TT.moon, mc = G.rgb(L.hex(M.color)), ms = G.rgb(L.hex(M.shade));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dz = G.bayer[(y & 3) * 4 + (x & 3)] / 16;
      let c = sky[Math.max(0, Math.min(sky.length - 1, Math.floor((y / horizon) * sky.length + dz - 0.5)))];
      const dx = x - M.x / 2, dy = y - M.y / 2, r = M.r / 2;
      if (dx * dx + dy * dy < r * r) c = ((dx + 4) ** 2 + (dy - 3) ** 2 < (r * 0.35) ** 2 || (dx - 5) ** 2 + (dy + 5) ** 2 < (r * 0.25) ** 2) ? ms : mc;   // moon + craters
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); tex.refresh(); tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return key;
  }

  paintMountains(W, H) {
    const key = 'title_mountains';
    if (this.textures.exists(key)) return key;
    const L = FUP.look, TT = L.title, w = W / 2, h = H / 2, G = FUP.forestGround;
    const far = G.rgb(L.hex(TT.mountainsFar)), near = G.rgb(L.hex(TT.mountainsNear));
    const peakFar = x => 150 - Math.abs(((x * 0.9) % 70) - 35) * 0.9 - Math.sin(x * 0.05) * 12;
    const peakNear = x => 185 - Math.sin(x * 0.03 + 1) * 14 - Math.sin(x * 0.11) * 4;
    const tex = this.textures.createCanvas(key, w, h), ctx = tex.getContext(), img = ctx.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = null;
      if (y >= peakNear(x)) c = near; else if (y >= peakFar(x)) c = far;
      if (!c) continue;
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); tex.refresh(); tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return key;
  }

  // Village ground: dark dusk grass and a cobbled road running up to the Forest
  paintGround(W, H) {
    const key = 'title_ground';
    if (this.textures.exists(key)) return key;
    const L = FUP.look, Gd = L.title.ground, w = W / 2, h = H / 2, G = FUP.forestGround;
    const grass = Gd.grass.map(k => G.rgb(L.hex(k))), path = Gd.path.map(k => G.rgb(L.hex(k))), edge = G.rgb(L.hex(Gd.pathEdge));
    const top = 222;
    const tex = this.textures.createCanvas(key, w, h), ctx = tex.getContext(), img = ctx.createImageData(w, h), d = img.data;
    for (let y = top; y < h; y++) for (let x = 0; x < w; x++) {
      const t = (y - top) / (h - top), half = 14 + t * 70, cx = w / 2;
      const dz = G.bayer[(y & 3) * 4 + (x & 3)] / 16;
      let c = grass[G.noise(x * 0.08, y * 0.12) + dz * 0.3 > 0.62 ? 1 : 0];
      const off = Math.abs(x - cx);
      if (off < half) {
        const row = Math.floor((y - top) / (2 + t * 3)), sw = 4 + t * 6;
        const cxp = (x - cx + (row % 2 ? sw / 2 : 0) + 200) % sw;
        c = (cxp < 1 || (y - top) % Math.max(2, Math.round(2 + t * 3)) === 0) ? path[0] : path[G.hash(Math.floor((x - cx + 200) / sw), row) > 0.5 ? 1 : 2];
        if (off > half - 1.2) c = edge;
      }
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); tex.refresh(); tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return key;
  }

  // ---------- Living things ----------
  twinkle(W) {
    const TT = FUP.look.title;
    for (let i = 0; i < TT.stars; i++) {
      const s = this.add.rectangle(Math.random() * W, Math.random() * 230, 2, 2, FUP.look.num(TT.starColors[i % TT.starColors.length])).setDepth(-49);
      this.tweens.add({ targets: s, alpha: 0.15, duration: 600 + Math.random() * 1600, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
    }
  }

  // The Landlord, huge and dusky behind the trees, slowly breathing
  drawLandlord() {
    const LL = FUP.look.title.landlord;
    if (!this.textures.exists('landlord')) return;
    const s = this.add.image(LL.x, LL.y, 'landlord').setOrigin(0.5, 1).setScale(LL.scale).setFlipX(true).setDepth(-35).setAlpha(LL.alpha);
    s.setTint(FUP.look.num(LL.shade));   // darkened into the dusk, still recognisably him
    this.tweens.add({ targets: s, scaleY: LL.scale * 1.02, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  drawVillage(W, H) {
    const TT = FUP.look.title, ui = FUP.ui;
    // Houses either side of the road, nearest at the bottom
    const put = (key, x, y, sc = 2) => this.textures.exists(key) ? this.add.image(x, y, key).setOrigin(0.5, 1).setScale(sc).setDepth(y / 100) : null;
    put('vil_forge', 150, 520); put('vil_house', 70, 610);
    put('vil_kitchen', 760, 520); put('vil_shop', 840, 615);
    put('vil_fence', 300, 560, 2); put('vil_fence', 600, 560, 2); put('vil_barrel', 250, 585, 2); put('vil_well', 660, 595, 2);
    // Lamps with soft glowing light
    for (const [x, y] of [[340, 540], [560, 540]]) {
      const g = this.add.circle(x, y - 40, 34, FUP.look.num(TT.lampGlow), 0.14).setDepth(y / 100 - 0.1);
      this.tweens.add({ targets: g, alpha: 0.26, scale: 1.1, duration: 900 + Math.random() * 500, yoyo: true, repeat: -1 });
      put('vil_lamp', x, y, 2);
    }
    // Chimney smoke from the nearest house
    this.time.addEvent({ delay: 700, loop: true, callback: () => {
      const p = this.add.circle(52, 470, 5, FUP.look.num(TT.smoke), 0.5).setDepth(7);
      this.tweens.add({ targets: p, y: 380, x: 52 + 30, scale: 2.4, alpha: 0, duration: 3200, onComplete: () => p.destroy() });
    } });
  }

  fireflies(W) {
    const TT = FUP.look.title;
    for (let i = 0; i < TT.fireflies; i++) {
      const f = this.add.rectangle(Math.random() * W, 380 + Math.random() * 140, 3, 3, FUP.look.num(TT.fireflyColor)).setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
      const wander = () => this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-60, 60), y: Phaser.Math.Clamp(f.y + Phaser.Math.Between(-40, 40), 360, 540),
        alpha: Math.random(), duration: 1500 + Math.random() * 2000, ease: 'Sine.easeInOut', onComplete: wander });
      wander();
    }
  }

  // A narrator line under the logo that swaps every few seconds
  startQuips(W) {
    const Q = FUP.look.title.quip, c = FUP.ui.colors;
    let lines = FUP.narrator.titleQuips || [];
    if (!lines.length) return;
    let i = Math.floor(Math.random() * lines.length);
    if (this.retired) { lines = [...(FUP.narrator.oldSaveRetired || []), ...lines]; i = 0; }   // first line shown
    const t = FUP.ui.text(this, W / 2, Q.y, '', 17, c.ink, { fontStyle: 'italic', stroke: c.stroke, strokeThickness: 4, align: 'center', wordWrap: { width: W - 120 } })
      .setOrigin(0.5).setDepth(10).setAlpha(0);
    const show = () => {
      t.setText(lines[i % lines.length]); i++;
      this.tweens.add({ targets: t, alpha: 1, duration: Q.fadeMs });
      this.tweens.add({ targets: t, alpha: 0, duration: Q.fadeMs, delay: Q.everyMs - Q.fadeMs });
    };
    this.time.delayedCall(900, () => { show(); this.time.addEvent({ delay: Q.everyMs, loop: true, callback: show }); });
  }

  // ---------- Buttons ----------
  drawButtons() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, s = this.saved;
    if (this.group) this.group.destroy(true);
    const g = this.group = this.add.group();
    const btn = (x, y, w, h, label, fn, opts) => { const b = ui.button(this, x, y, w, h, label, fn, opts); [b.rect, b.txt].forEach(o => o.setDepth(20)); g.addMultiple([b.rect, b.txt]); return b; };

    if (s) {
      btn(W / 2 - 160, 268, 320, 56, `▶ Continue as ${s.name}${s.title ? ' ' + s.title : ''}`, () => this.continueLife(), { hot: true, size: 21 });
      const M = FUP.runData.modes[s.mode] || FUP.runData.modes.hardcore;
      g.add(ui.text(this, W / 2, 334, `${M.emoji} ${M.name} · ${s.runs} run${s.runs === 1 ? '' : 's'} survived · 🪙 ${s.coins}\n${s.levels.map(l => `${FUP.skillData.skills[l.id].emoji} ${FUP.skillData.skills[l.id].name} ${l.level}`).join(' · ')}`,
        14, c.ink, { align: 'center', lineSpacing: 4, stroke: c.stroke, strokeThickness: 4 }).setOrigin(0.5, 0).setDepth(20));
      btn(W / 2 - 90, 384, 180, 36, 'New life', () => this.confirmNew(), { size: 16 });
    } else {
      btn(W / 2 - 140, 290, 280, 60, '✨ New life', () => this.scene.start('Create'), { hot: true, size: 24 });
    }
  }

  continueLife() {
    FUP.audio.sfx('select');
    const res = FUP.save.load();
    if (!res) { this.saved = null; this.drawButtons(); return; }
    // Saved while standing somewhere safe out in the world (the Docks): wake up there
    if (!res.lostRun && FUP.world.resumeVisit()) { this.scene.start('World', { from: 'load' }); return; }
    this.scene.start('Village', { lostRun: res.lostRun });
  }

  // Starting over deletes the saved hero, so ask first.
  confirmNew() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width;
    const g = this.add.group();
    const add = o => { g.add(o); return o.setDepth(100); };
    add(FUP.ui.shade(this, 0.7));
    add(FUP.ui.panel(this, W / 2 - 230, 200, 460, 200, 'panel'));
    add(ui.text(this, W / 2, 230, `Abandon ${this.saved.name}?`, 24, c.bad, { fontStyle: '700' }).setOrigin(0.5, 0));
    add(ui.text(this, W / 2, 272, 'Their levels, coins, gear and cookbook are deleted.\nThere is no undo. That\'s the whole point.', 15, c.ink, { align: 'center', lineSpacing: 4 }).setOrigin(0.5, 0));
    const yes = ui.button(this, W / 2 - 200, 340, 190, 40, 'Yes, start over', () => { FUP.save.wipe(); this.scene.start('Create'); }, { size: 16 });
    const no = ui.button(this, W / 2 + 10, 340, 190, 40, 'Keep playing', () => g.destroy(true), { hot: true, size: 16 });
    for (const b of [yes, no]) { b.rect.setDepth(101); b.txt.setDepth(102); g.addMultiple([b.rect, b.txt]); }
  }
}
