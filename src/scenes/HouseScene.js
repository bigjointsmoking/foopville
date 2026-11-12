// ============================================================
// HOUSE — the inside of your house (v0.68). Walk around like in the village
// (WASD / arrows / drag), walk up to things and press E / Space / the round button.
//   🛏️ Bed      = Nap (full heal), or Sleep until morning in the second half of the day
//   🧰 Storage  = the backpack with your home storage (spare gear and food)
//   🗄️ Pantry   = ingredients kept at home (once you buy a pantry shelf)
//   🔥 Stove    = cook (the cooking screen). No stove = no cooking at home:
//                 Planksworth the Carpenter sells them.
//   Furniture   = some of it does something (sit, read, warm up: data/place.js `act`)
//   🔨 Decorate = put furniture on any free floor square (build mode, src/buildUi.js)
//   The door at the bottom = back out to the village.
// The room comes from the best house you own (data/home.js, src/systems/home.js).
// Phaser reuses this screen: everything per-visit is reset in create().
// ============================================================
class HouseScene extends Phaser.Scene {
  constructor() { super('House'); }

  init(data) { this.arrive = data || {}; }

  create() {
    const T = FUP.villageData.tileSize, ui = FUP.ui;
    // Reset everything from last visit
    this.panel = null; this.leaving = false; this.walkTo = null; this.stepTimer = 0;
    this._placeViews = null; this.spots = []; this.fireGlow = null;
    FUP.looks.apply(this, FUP.run.hero.look);
    const M = FUP.home.build();
    FUP.home.tidy();
    this.RW = M.width() * T; this.RH = M.height() * T;

    this.add.rectangle(-2000, -2000, 6000, 6000, FUP.look.num(FUP.homeData.colors.outside)).setOrigin(0).setDepth(-20);
    this.drawRoom();
    this.drawFixtures();
    FUP.buildUi.drawPlaced(this, 'home', T);

    // You: at the stove if you just cooked, otherwise just inside the door
    const st = FUP.home.fixture('stove'), bed = FUP.home.fixture('bed'), D = FUP.home.door, from = this.arrive.from;
    const start = from === 'stove' ? M.center(st.tx, st.ty + 1) : from === 'slept' ? M.center(bed.tx + bed.w, bed.ty + 1) : M.center(D.tx, D.ty - 1);
    this.player = ui.sprite(this, start.x, start.y, FUP.looks.key('hero_map'), '🧍', 30).setOrigin(0.5, 0.72).setDepth(start.y + 16);
    this.hat = FUP.cosmetics.attachHat(this, this.player, 'map');

    this.drawHud();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E');
    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-SPACE', () => this.interact());
    this.input.keyboard.on('keydown-ENTER', () => this.interact());
    this.input.keyboard.on('keydown-ESC', () => this.closePanel());
    this.input.keyboard.on('keydown-I', () => this.openPack());
    this.input.keyboard.on('keydown-B', () => this.openDecorate());
    this.input.keyboard.on('keydown-K', () => this.openSkills());
    FUP.progressUi.attach(this);
    this.stick = FUP.ui.joystick(this, () => !this.panel && !this.leaving);

    this.cameras.main.setBounds(-2000, -2000, this.RW + 4000, this.RH + 4000);
    this.centerCam();
    this.cameras.main.fadeIn(250, 0, 0, 0);
    FUP.audio.music('home');
    FUP.save.write();
    this.say(from === 'stove' ? 'houseFromStove' : from === 'slept' ? 'sleepDay' : 'houseArrive');
  }

  // The whole room fits on screen: keep it in the middle (a little below centre, under the top bar)
  centerCam() {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.centerOn(this.RW / 2, this.RH / 2 - 6);
  }

  // ---------- Drawing the room: floorboards, the back wall with windows, side walls, the door ----------
  drawRoom() {
    const T = FUP.villageData.tileSize, M = FUP.homeMap, C = FUP.homeData.colors, L = FUP.look, n = k => L.num(C[k]);
    const w = M.width(), h = M.height(), top = FUP.homeData.wallRows;
    const g = this.add.graphics().setDepth(-10);
    // Floor: planks running across, seams staggered
    const fx = T, fy = top * T, fw = (w - 2) * T, fh = (h - top - 1) * T, plank = T / 2;
    g.fillStyle(n('floor')).fillRect(fx, fy, fw, fh);
    for (let r = 0, y = fy; y < fy + fh; r++, y += plank) {
      g.fillStyle(n('floorLight'), 0.18).fillRect(fx, y + 1, fw, 2);
      g.fillStyle(n('floorLine')).fillRect(fx, y + plank - 2, fw, 2);
      for (let x = fx + ((r * 37) % 80); x < fx + fw; x += 80 + ((r * 13) % 30)) g.fillRect(x, y, 2, plank - 2);
    }
    // A soft shadow along the back wall
    g.fillStyle(0x000000, 0.25).fillRect(fx, fy, fw, 8);
    // Back wall: dark top, plaster, a wooden wainscot along the bottom
    g.fillStyle(n('wallTop')).fillRect(0, 0, w * T, T * 0.5);
    g.fillStyle(n('wall')).fillRect(T * 0.5, T * 0.5, (w - 1) * T, top * T - T * 0.5);
    g.fillStyle(n('wainscot')).fillRect(T * 0.5, top * T - T * 0.55, (w - 1) * T, T * 0.55);
    g.fillStyle(n('trim')).fillRect(T * 0.5, top * T - T * 0.6, (w - 1) * T, 3);
    for (let x = T; x < (w - 1) * T; x += T * 0.5) g.fillStyle(n('wallTop'), 0.5).fillRect(x, top * T - T * 0.5, 2, T * 0.5);
    // Windows on the back wall: one every 4 squares. Night outside = dark glass.
    const night = ['evening', 'night'].includes(FUP.clock.phase().id);
    for (let x = 3; x < w - 3; x += 4) {
      const wx = x * T + T * 0.15, wy = T * 0.55, ww = T * 1.1, wh = T * 0.85;
      g.fillStyle(n('frame')).fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      g.fillStyle(n(night ? 'windowNight' : 'window')).fillRect(wx, wy, ww, wh);
      g.fillStyle(0xffffff, night ? 0.08 : 0.22).fillRect(wx + 3, wy + 3, ww * 0.35, wh * 0.4);
      g.fillStyle(n('frame')).fillRect(wx + ww / 2 - 1, wy, 3, wh).fillRect(wx, wy + wh / 2 - 1, ww, 3);
      g.fillStyle(n('trim')).fillRect(wx - 6, wy + wh + 3, ww + 12, 4);   // sill
    }
    // Side walls and the bottom wall (seen from above: thick dark strips)
    g.fillStyle(n('wallTop'));
    g.fillRect(0, 0, T * 0.5, h * T).fillRect((w - 0.5) * T, 0, T * 0.5, h * T);
    g.fillRect(0, (h - 1) * T + T * 0.45, w * T, T * 0.55);
    g.fillStyle(n('wall')).fillRect(T * 0.5, T * 0.5, 4, (h - 1) * T).fillRect((w - 0.5) * T - 4, T * 0.5, 4, (h - 1) * T);
    // The door: a gap in the bottom wall with a frame, and a doormat inside
    const D = FUP.home.door, dx = D.tx * T, dy = D.ty * T;
    g.fillStyle(n('outside')).fillRect(dx + 4, dy + T * 0.45, T - 8, T * 0.55);
    g.fillStyle(n('frame')).fillRect(dx, dy + T * 0.4, 5, T * 0.6).fillRect(dx + T - 5, dy + T * 0.4, 5, T * 0.6);
    g.fillStyle(n('matEdge')).fillRect(dx + 4, dy - T + 10, T - 8, T - 16);
    g.fillStyle(n('mat')).fillRect(dx + 7, dy - T + 13, T - 14, T - 22);
    this.add.text(dx + T / 2, dy + T * 0.72, '▼', { fontSize: '12px', color: L.hex('k4') }).setOrigin(0.5).setAlpha(0.6).setDepth(-9);
  }

  // ---------- The fixtures: bed, storage chest, pantry shelf, stove (or an empty nook) ----------
  drawFixtures() {
    const T = FUP.villageData.tileSize, C = FUP.homeData.colors, L = FUP.look, n = k => L.num(C[k]), H = FUP.house, ui = FUP.ui;
    const box = id => { const f = FUP.home.fixture(id); return { x: f.tx * T, y: f.ty * T, w: f.w * T, h: f.h * T }; };
    const gfx = b => this.add.graphics().setDepth(b.y + b.h);
    // Bed: frame, pillow, blanket with a fold
    let b = box('bed'), g = gfx(b);
    g.fillStyle(0x000000, 0.25).fillRect(b.x + 6, b.y + b.h - 6, b.w - 8, 8);
    g.fillStyle(n('bedFrame')).fillRect(b.x + 4, b.y - 10, b.w - 8, b.h + 4);
    g.fillStyle(n('pillow')).fillRect(b.x + 12, b.y - 2, b.w - 24, 16);
    g.fillStyle(n('blanket')).fillRect(b.x + 8, b.y + 18, b.w - 16, b.h - 30);
    g.fillStyle(n('blanketLight')).fillRect(b.x + 8, b.y + 18, b.w - 16, 8);
    g.fillStyle(n('bedFrame')).fillRect(b.x + 4, b.y + b.h - 14, b.w - 8, 8);
    this.spots.push({ kind: 'bed', box: b, label: '🛏️ Bed' });
    // Storage chest
    b = box('chest'); g = gfx(b);
    g.fillStyle(0x000000, 0.25).fillRect(b.x + 4, b.y + b.h - 6, b.w - 8, 6);
    g.fillStyle(n('chest')).fillRect(b.x + 5, b.y + 6, b.w - 10, b.h - 10);
    g.fillStyle(n('bedFrame')).fillRect(b.x + 5, b.y + 6, b.w - 10, 10);
    g.fillStyle(n('chestBand')).fillRect(b.x + 11, b.y + 6, 4, b.h - 10).fillRect(b.x + b.w - 15, b.y + 6, 4, b.h - 10);
    g.fillStyle(L.num('y2')).fillRect(b.x + b.w / 2 - 3, b.y + 14, 6, 6);
    this.spots.push({ kind: 'chest', box: b, label: '🧰 Storage' });
    // Pantry shelf: three shelves, jars once you own a pantry
    b = box('pantry'); g = gfx(b);
    g.fillStyle(n('bedFrame')).fillRect(b.x + 3, b.y - 26, b.w - 6, b.h + 22);
    g.fillStyle(n('wallTop')).fillRect(b.x + 7, b.y - 22, b.w - 14, b.h + 14);
    for (let i = 0; i < 3; i++) {
      const sy = b.y - 22 + (i + 1) * (b.h + 14) / 3;
      g.fillStyle(n('shelf')).fillRect(b.x + 5, sy - 3, b.w - 10, 4);
      if (H.pantryMax() > 0) for (let j = 0; j < 3; j++) g.fillStyle(L.num(['y1', 'r3', 'g4'][(i + j) % 3])).fillRect(b.x + 9 + j * 9, sy - 13, 7, 10);
    }
    this.spots.push({ kind: 'pantry', box: b, label: H.pantryMax() > 0 ? '🗄️ Pantry' : '🗄️ Shelf' });
    // Stove: iron body, fire window, a pipe up the wall. No stove = a cold brick nook.
    b = box('stove'); g = gfx(b);
    g.fillStyle(n('brick')).fillRect(b.x, b.y - T * 1.4, b.w, T * 1.4 + 4);
    for (let r = 0; r < 5; r++) for (let x = (r % 2) * 10; x < b.w; x += 20) g.fillStyle(n('brickLine')).fillRect(b.x + x, b.y - T * 1.4 + r * 11, 2, 10).fillRect(b.x, b.y - T * 1.4 + r * 11 + 10, b.w, 1);
    if (H.canCook()) {
      g.fillStyle(0x000000, 0.3).fillRect(b.x + 4, b.y + b.h - 4, b.w - 8, 6);
      g.fillStyle(n('stoveIron')).fillRect(b.x + 6, b.y - 8, b.w - 12, b.h + 6);
      g.fillStyle(n('stoveTop')).fillRect(b.x + 4, b.y - 12, b.w - 8, 8);
      g.fillStyle(n('stoveIron')).fillRect(b.x + b.w - 22, b.y - T * 1.4, 10, T * 1.4 - 10);   // the pipe
      g.fillStyle(L.num('k0')).fillRect(b.x + 16, b.y + 6, b.w - 32, b.h - 18);
      this.fireGlow = this.add.rectangle(b.x + b.w / 2, b.y + 6 + (b.h - 18) / 2, b.w - 38, b.h - 24, n('fire')).setDepth(b.y + b.h + 1);
      this.tweens.add({ targets: this.fireGlow, alpha: 0.55, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      g.fillStyle(L.num('s3')).fillCircle(b.x + 18, b.y - 8, 4).fillCircle(b.x + 36, b.y - 8, 4);   // knobs / burners
    } else {
      g.fillStyle(n('coldNook')).fillRect(b.x + 4, b.y - 6, b.w - 8, b.h + 2);
      g.lineStyle(2, L.num('k3'), 0.8);
      for (let x = b.x + 8; x < b.x + b.w - 8; x += 10) g.lineBetween(x, b.y - 2, x + 5, b.y - 2).lineBetween(x, b.y + b.h - 8, x + 5, b.y + b.h - 8);
      ui.text(this, b.x + b.w / 2, b.y + b.h / 2 - 4, 'NO STOVE', 10, ui.colors.dim, { fontStyle: '700' }).setOrigin(0.5).setDepth(b.y + b.h + 1);
    }
    this.spots.push({ kind: 'stove', box: b, label: H.canCook() ? '🔥 Cook' : '🔥 Stove' });
    this.spots.push({ kind: 'door', box: { x: FUP.home.door.tx * T, y: (FUP.home.door.ty - 1) * T, w: T, h: T * 2 }, label: '🚪 Go out' });
  }

  // Furniture that does something (data/place.js `act`): added to the spots each time it's drawn
  furnitureSpots() {
    const T = FUP.villageData.tileSize, out = [];
    for (const p of FUP.place.list('home')) {
      const it = FUP.place.item(p.item);
      if (!it.act) continue;
      out.push({ kind: 'furn', act: it.act, item: p.item, box: FUP.buildUi.box(p, T), label: it.act.label });
    }
    return out;
  }

  // ---------- Screen overlay: narrator, coins, day, HP, buttons ----------
  drawHud() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height;
    const fix = o => o.setScrollFactor(0).setDepth(10000);
    const fixB = b => { b.rect.setScrollFactor(0).setDepth(10001); b.txt.setScrollFactor(0).setDepth(10002); return b; };
    const bar = fix(ui.panel(this, 16, 12, W - 32, 46, 'hud'));
    this.narratorText = fix(ui.text(this, 32, 35, '', 16, c.ink, { fontStyle: 'italic', wordWrap: { width: W - 230 } }).setOrigin(0, 0.5));
    this.showBar = ui.autoHide(this, [bar, this.narratorText], 5000);
    this.coinText = fix(ui.text(this, W - 62, 35, '', 18, c.accent, { fontStyle: '700', stroke: c.stroke, strokeThickness: 4 }).setOrigin(1, 0.5));
    ui.muteButton(this, W - 36, 35, true);
    this.dayText = fix(ui.text(this, W - 20, 72, '', 13, c.dim, { backgroundColor: FUP.look.hex('k0') + 'cc', padding: { x: 8, y: 3 } }).setOrigin(1, 0));
    fix(ui.text(this, 20, 72, `🏠 ${FUP.house.houseName().toUpperCase()}`, 14, c.accent, { fontStyle: '700', backgroundColor: FUP.look.hex('k0') + 'cc', padding: { x: 8, y: 3 } }));

    fix(ui.panel(this, 16, H - 58, W - 32, 46, 'hud'));
    fix(ui.text(this, 30, H - 35, 'HP', 14, c.dim, { fontStyle: '700' }).setOrigin(0, 0.5));
    this.hpBar = ui.bar(this, 58, H - 43, 120, 16, c.hp);
    fix(this.hpBar.bg); fix(this.hpBar.fill);
    this.hpText = fix(ui.text(this, 186, H - 35, '', 14, c.ink).setOrigin(0, 0.5));
    this.packBtn = fixB(ui.button(this, 256, H - 50, 130, 30, '', () => this.openPack(), { size: 13 }));
    FUP.progressUi.guideButton(this, 392, H - 50, 100, 30, { fixed: true, size: 13, skill: 'building', canOpen: () => !this.panel && !this.leaving, onOpen: g => this.openSkills(g) });
    fixB(ui.button(this, 498, H - 50, 130, 30, '🔨 Decorate', () => this.openDecorate(), { size: 13 }));
    fix(ui.text(this, W - 30, H - 35, ui.isTouch(this) ? 'Drag to walk · tap the button to use' : 'Walk: WASD / drag · Use: E', 12, c.dim).setOrigin(1, 0.5));

    // Round action button + the floating prompt (same as the village)
    this.actBtn = this.add.circle(W - 70, H - 120, 42, c.btnHot, 0.95).setStrokeStyle(3, c.btnHotEdge).setScrollFactor(0).setDepth(16000).setVisible(false).setInteractive({ useHandCursor: true });
    this.actBtn.on('pointerdown', () => { FUP.audio.sfx('click'); this.time.delayedCall(1, () => this.interact()); });
    this.actText = ui.text(this, W - 70, H - 120, '', 15, c.ink, { fontStyle: '700', align: 'center', wordWrap: { width: 76 } }).setOrigin(0.5).setScrollFactor(0).setDepth(16001).setVisible(false);
    this.prompt = ui.text(this, 0, 0, '', 13, c.accent, { fontStyle: '700', backgroundColor: FUP.look.hex('k0'), padding: { x: 6, y: 3 } }).setOrigin(0.5, 1).setDepth(6000).setVisible(false);
    this.refreshHud();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshHud() });
  }

  refreshHud() {
    const run = FUP.run, c = FUP.ui.colors, hp = run.currentHp(), max = run.maxHp();
    this.hpBar.set(hp / max);
    this.hpBar.color(hp < max * 0.3 ? c.hpLow : c.hp);
    this.hpText.setText(`${hp}/${max}`);
    this.packBtn.txt.setText(`🎒 Bag ${run.slotsUsed()}/${run.packMax()}`);
    this.coinText.setText(`🪙 ${run.coins}`);
    this.dayText.setText(FUP.clock.label());
    if (FUP.clock.rolled) { FUP.clock.rolled = 0; if (!this.panel) this.say('newDay'); }
  }

  // ---------- Every frame ----------
  update(time, delta) {
    if (this.leaving || this.panel) { this.hidePrompt(); return; }
    this.movePlayer(Math.min(delta, 100) / 1000);
    this.updatePrompt();
    // Walked out through the door
    const T = FUP.villageData.tileSize;
    if (this.player.y > FUP.home.door.ty * T + 6) this.goOut();
  }

  movePlayer(dt) {
    const k = this.keys;
    let dx = 0, dy = 0;
    if (k.A.isDown || k.LEFT.isDown) dx -= 1;
    if (k.D.isDown || k.RIGHT.isDown) dx += 1;
    if (k.W.isDown || k.UP.isDown) dy -= 1;
    if (k.S.isDown || k.DOWN.isDown) dy += 1;
    if (!dx && !dy && (this.stick.dx || this.stick.dy)) { dx = this.stick.dx; dy = this.stick.dy; }
    if (dx || dy) this.walkTo = null;
    if (!dx && !dy && this.walkTo) {   // tapped a fixture: walk straight at it, use it on arrival
      const t = this.walkTo;
      if (this.distTo(t) < FUP.homeData.reach - 10) { this.walkTo = null; this.use(t); return; }
      const cx = t.box.x + t.box.w / 2, cy = t.box.y + t.box.h + 14;
      dx = cx - this.player.x; dy = cy - this.player.y;
    }
    if (!dx && !dy) return;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) { this.stepTimer = 0.3; FUP.audio.sfx('step'); }
    const len = Math.hypot(dx, dy), step = FUP.homeData.playerSpeed * dt, s = this.player, T = FUP.villageData.tileSize;
    const mx = dx / len * step, my = dy / len * step, bx = s.x, by = s.y;
    const hit = (x, y) => FUP.homeMap.blockedBox(x, y, 12) || FUP.place.blockedBox('home', x, y, 12, T);
    if (!hit(s.x + mx, s.y)) s.x += mx;
    if (!hit(s.x, s.y + my)) s.y += my;
    if (this.walkTo && bx === s.x && by === s.y) this.walkTo = null;   // stuck: give up
    if (dx) s.setFlipX(dx < 0);
    s.setDepth(s.y + 16);
  }

  // Pixels from you to the nearest edge of a spot's box
  distTo(sp) {
    const b = sp.box, p = this.player;
    const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h));
    return Math.hypot(dx, dy);
  }
  nearest() {
    let best = null, bestD = FUP.homeData.reach;
    let bestScore = Infinity;
    for (const s of this.spots.concat(this.furnitureSpots())) {
      const d = this.distTo(s);
      if (d >= bestD) continue;
      // Tie-break between neighbours (bed and chest): the one whose middle is closer wins
      const score = d + 0.3 * Math.hypot(s.box.x + s.box.w / 2 - this.player.x, s.box.y + s.box.h / 2 - this.player.y);
      if (score < bestScore) { best = s; bestScore = score; }
    }
    return best;
  }
  hidePrompt() { if (this.prompt) { this.prompt.setVisible(false); this.actBtn.setVisible(false); this.actText.setVisible(false); } }
  updatePrompt() {
    const s = this.nearest();
    if (!s) { this.hidePrompt(); return; }
    const label = s.kind === 'bed' || (s.act && s.act.bed) ? (FUP.clock.canSleep() ? '🛏️ Sleep' : '😴 Nap') : s.label;
    this.prompt.setVisible(true).setText(FUP.ui.isTouch(this) ? label : `E: ${label}`).setPosition(s.box.x + s.box.w / 2, s.box.y - 12).setDepth(6000);
    this.actBtn.setVisible(true); this.actText.setVisible(true).setText(label);
  }

  interact() {
    if (this.panel || this.leaving) return;
    const s = this.nearest();
    if (s) this.use(s);
  }

  use(s) {
    this.hidePrompt();
    const H = FUP.house;
    if (s.kind === 'door') { this.goOut(); return; }
    if (s.kind === 'bed' || (s.act && s.act.bed)) { this.sleep(); return; }
    if (s.kind === 'chest') { this.say('houseChest'); this.openPack(true); return; }
    if (s.kind === 'pantry') {
      if (H.pantryMax() <= 0) { this.say('houseNoPantry'); FUP.audio.sfx('error'); return; }
      const g = FUP.pantryUi.open(this, () => { if (this.panel === g) this.panel = null; this.refreshHud(); });
      this.panel = g;
      return;
    }
    if (s.kind === 'stove') {
      if (!H.canCook()) { this.say('houseNoStove'); FUP.audio.sfx('error'); return; }
      this.leaving = true;
      FUP.audio.sfx('select');
      FUP.save.write();
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.time.delayedCall(270, () => this.scene.start('Cook', { mode: 'home' }));
      return;
    }
    if (s.kind === 'furn') { FUP.audio.sfx('click'); this.say(s.act.say); }
  }

  // Your bed: Nap (full heal) early in the day, Sleep until morning in the second half
  sleep() {
    const can = FUP.clock.canSleep();
    if (!can && FUP.run.currentHp() >= FUP.run.maxHp()) { this.say('houseFull'); return; }
    FUP.run.hp = null;   // full HP
    FUP.audio.sfx('heal');
    if (can) {
      FUP.clock.sleep(); FUP.clock.rolled = 0;
      this.leaving = true;   // stand still while the screen is dark
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(450, () => { this.scene.restart({ from: 'slept' }); });
      this.time.delayedCall(440, () => FUP.save.write());
      return;
    }
    this.say('homeNap');
    this.refreshHud();
    FUP.save.write();
  }

  // ---------- Windows (they count as a panel: walking stops, ESC closes) ----------
  openPack(store = false) {
    if (this.panel || this.leaving) return;
    const bp = FUP.backpack.open(this, { home: true, onChange: () => this.refreshHud(), onClose: () => { if (this.panel === bp) this.panel = null; this.refreshHud(); FUP.save.write(); } });
    if (store) { bp.tab = 'store'; FUP.backpack.draw(bp); }
    this.panel = bp;
  }
  openSkills(g) {
    if (!g) { if (this.panel || this.leaving) return; g = FUP.progressUi.openGuide(this, 'building'); }
    this.panel = g;
    const close = g.destroy;
    g.destroy = () => { close(); if (this.panel === g) this.panel = null; };
  }
  openDecorate() {
    if (this.panel || this.leaving) return;
    this.walkTo = null;
    this.hidePrompt();
    const g = FUP.buildUi.open(this, 'home', () => {
      if (this.panel === g) this.panel = null;
      this.centerCam();   // build mode re-follows you; the room stays put instead
      FUP.save.write();
    });
    this.panel = g;
    this.say('decorateOpen');
  }
  closePanel() { if (this.panel && this.panel.destroy) this.panel.destroy(); }

  goOut() {
    if (this.leaving) return;
    this.leaving = true;
    FUP.save.write();
    FUP.audio.sfx('select');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => this.scene.start('Village', { from: 'home' }));
  }

  // ---------- Narrator ----------
  say(category, vars = {}) {
    const lines = FUP.narrator[category];
    if (!lines || !lines.length) return;
    this.narratorText.setText(Phaser.Utils.Array.GetRandom(lines).replace(/\{name\}/g, vars.name || FUP.run.hero.name).replace(/\{day\}/g, FUP.clock.day()));
    if (this.showBar) this.showBar();
  }
}
