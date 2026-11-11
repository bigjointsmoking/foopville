// ============================================================
// WORLD — a region of the world outside the village (today: the 3 Forest regions).
// Walk around, pick up ingredients, bump into enemies.
// Move with WASD / arrow keys, or hold the mouse (or a finger) where
// you want to go. Walk off the map through a gap in its edge (a glowing sign)
// to reach the next region (data/world.js, src/systems/world.js). Each area has a campfire, its
// own trees, light and weather, and fog of war. A hidden hole in the Deep
// Woods leads down into the Landlord's Basement (RaidScene.js).
// Everything on the map lives in FUP.run.forest (one entry per region),
// so leaving for a fight or the campfire puts you exactly where you were.
// ============================================================
class WorldScene extends Phaser.Scene {
  // key: the Raid screen (RaidScene.js) borrows this one's walking, fights and HUD
  constructor(key = 'World') { super(key); }

  // data.from: 'campfire' = you just left this area's campfire
  init(data) { this.arrive = data || {}; }

  create() {
    const F = FUP.forest, d = FUP.forestData, T = d.tileSize;
    this.f = FUP.world.here();                  // your trip, or a visit to a safe region (the Docks)
    this.safe = !!this.f.safe;
    this.tiles = F;                             // the map you walk on (the Raid uses FUP.raid)
    F.use(this.f.area);
    this.A = this.f.areas[this.f.area];        // this area's state (items, enemies, where you stand)
    this.info = F.area();                       // this area's data (name, map, multiplier)
    this.dropOldGround();
    if (this.arrive.from === 'campfire') this.A.player = F.besideCampfire();
    this.leaving = false;
    this.pack = null;           // backpack screen (reset: Phaser reuses this screen)
    this.panel = null; this.panelId = null;   // a villager's window (WorldPeople.js)
    this.campfireArmed = this.arrive.from !== 'campfire'; // walk away from the fire before it opens again
    this.worldW = F.width() * T;
    this.worldH = F.height() * T;

    this.drawMap();
    this.drawExits();
    this.drawThings();
    this.drawPeople();          // villagers, signs, traps, fishing water (WorldPeople.js; only where `features` say so)
    this.drawHole();
    this.drawGrave();
    this.fogTex = null;
    if (this.feature('fog')) this.drawFog();
    this.drawLight();
    this.drawHud();
    this.tut = null;            // Orientation Isle, the tutorial (WorldTutorial.js): only on the island
    if (this.scene.key === 'World' && this.f.area === FUP.tutorial.region()) this.drawTutorial();
    this.setupInput();
    FUP.progressUi.attach(this);   // "+XP" pop-ups (a good toll haggle gives Rizz XP)

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.fadeIn(250, 0, 0, 0);

    this.afterBattle();
    this.updateSight();
    FUP.audio.music(FUP.audio.songFor(this.f.area, this.safe));   // each region has its own song (data/audio.js regionSongs)
    if (this.safe) this.keepSaving();
    this.stepTimer = 0;
  }

  // ---------- Coming back from a fight (or arriving) ----------
  afterBattle() {
    const b = FUP.run.battle;
    FUP.run.battle = null;
    if (b && b.tutorial) { this.tutorialAfterFight(b); return; }   // the training dummy (WorldTutorial.js)
    if (!b) {
      if (this.safe) { this.greetSafe(); return; }
      if (this.arrive.from === 'campfire') this.say('forestFromCampfire');
      else if (this.A.fresh) this.say('forestEnter_' + this.info.id);   // first time in this area this trip
      else this.say('forestBack');
      this.A.fresh = false;
      return;
    }
    const enemy = this.A.enemies[b.index];
    if (b.result === 'win' || b.result === 'charmed') {
      enemy.alive = false;
      if (this.enemySprites[b.index]) this.enemySprites[b.index].destroy();
      this.say(b.result === 'win' ? (FUP.narrator['forestAfterWin_' + enemy.type] ? 'forestAfterWin_' + enemy.type : 'forestAfterWin') : 'forestAfterCharm');
    } else if (b.result === 'fled') {
      this.f.graceUntil = this.f.time + FUP.forestData.fleeGraceSeconds;
      if (enemy.count && b.survivors) enemy.count = b.survivors;   // a flock you ran from keeps only its survivors
      if (enemy.group && b.survivors) enemy.group = enemy.group.slice(0, b.survivors);
      this.say('forestAfterFlee');
    }
    this.checkRevenge(b.pigeonKills || 0);
  }

  // ---------- Revenge rule (blueprint 18.2): too many dead pigeons and the Godfather comes ----------
  // The count is hidden (Jesus, 2026-11-09): no counter, no warnings. He just shows up.
  checkRevenge(kills) {
    const f = this.f, d = FUP.forestData;
    f.pigeonKills = (f.pigeonKills || 0) + kills;
    if (f.godfatherSpawned || f.pigeonKills < d.revengeKills) return;
    const i = FUP.forest.spawnGodfather(f);
    if (!i) return;
    this.time.delayedCall(1800, () => this.say('godfatherArrives'));
    if (i === f.area) {
      // He's in this area: give him a picture right now
      const e = this.A.enemies[this.A.enemies.length - 1];
      this.enemySprites.push(this.enemySprite(e));
    }
  }

  // ---------- Drawing the map (once) ----------
  drawMap() {
    const F = FUP.forest, T = FUP.forestData.tileSize;
    const ui = FUP.ui, d = FUP.forestData;
    // The painted floor (grass, paths, water), made once per area from its map and colours
    const ground = F.ground();
    this.add.image(0, 0, FUP.forestGround.make(this, F, ground.colors, ground.key)).setOrigin(0).setScale(T / d.ground.pixelsPerSquare).setDepth(-10);
    // A beach (the Docks): grass squares on these rows tinted the mood's sand colour
    if (this.info.sand && ground.colors.sand) {
      const sg = this.add.graphics().setDepth(-9), [r0, r1] = this.info.sand.rows;
      sg.fillStyle(FUP.look.num(ground.colors.sand), 0.55);
      for (let ty = r0; ty <= r1; ty++) for (let tx = 0; tx < F.width(); tx++) if ('.'.includes(F.tileAt(tx, ty))) sg.fillRect(tx * T, ty * T, T, T);
    }
    const decos = F.decorations(), decoKeys = Object.keys(decos);
    // Same "random" wobble every time for a given square, so the map doesn't flicker.
    const noise = (x, y, k = 0) => { const n = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453; return n - Math.floor(n); };
    // This area's trees (data/forest.js `trees`): pick one by weight for each tree square
    const trees = Object.entries(this.info.trees || { tree_pine: 1, tree_round: 1 });
    const treeTotal = trees.reduce((s, [, w]) => s + w, 0);
    const pickTree = n => { let r = n * treeTotal; for (const [k, w] of trees) { r -= w; if (r <= 0) return k; } return trees[0][0]; };
    const shore = this.info.shoreDeco;   // e.g. reeds on grass next to water
    const nextToWater = (tx, ty) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => F.tileAt(tx + dx, ty + dy) === '~');

    for (let ty = 0; ty < F.height(); ty++) {
      for (let tx = 0; tx < F.width(); tx++) {
        const ch = F.tileAt(tx, ty), x = tx * T, y = ty * T, n = noise(tx, ty);

        if (ch === '~') {
          // Lily pads, and a glint that comes and goes
          if (!this.info.sea && n < d.lilyPadChance) ui.sprite(this, x + T * (0.3 + noise(tx, ty, 7) * 0.4), y + T * (0.3 + noise(tx, ty, 8) * 0.4), 'deco_lily', '', 10).setDepth(-5);
          if (noise(tx, ty, 9) > 0.55) {
            const g = this.add.rectangle(x + noise(tx, ty, 10) * 30, y + noise(tx, ty, 11) * 30, 6, 2, FUP.look.num('b4')).setAlpha(0).setDepth(-4);
            this.tweens.add({ targets: g, alpha: 0.8, duration: 500, yoyo: true, repeat: -1, delay: noise(tx, ty, 12) * 3000, repeatDelay: 1500 + noise(tx, ty, 13) * 3000 });
          }
        } else if (this.info.fish && this.info.fish[ch]) {
          // Fishing water (the Docks: F pier, D deep): rings that spread, so you can see where to cast
          const cx = x + T / 2, cy = y + T / 2;
          for (let k = 0; k < 2; k++) {
            const ring = this.add.circle(cx, cy, 6).setStrokeStyle(2, FUP.look.num('b4'), 0.9).setDepth(-4);
            this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 1600, delay: k * 800, repeat: -1 });
          }
        } else if (ch === 'b' || ch === 'B') {
          // Bridge planks over the river: planks across with dark gaps, nails, rails on the open sides
          const B = FUP.look.map.bridge, N = FUP.look.num, g = this.add.graphics().setDepth(-4), ph = T / B.planks;
          for (let k = 0; k < B.planks; k++) {
            const py = y + k * ph;
            g.fillStyle(N(B.gap)); g.fillRect(x, py, T, ph);
            g.fillStyle(N(B.plank)); g.fillRect(x, py + 2, T, ph - 4);
            g.fillStyle(N(B.plankLight)); g.fillRect(x, py + 2, T, 2);
            g.fillStyle(N(B.nail)); g.fillRect(x + 6, py + ph / 2 - 1, 2, 2); g.fillRect(x + T - 8, py + ph / 2 - 1, 2, 2);
          }
          const plank = c => c === 'b' || c === 'B';
          g.fillStyle(N(B.rail));
          if (!plank(F.tileAt(tx - 1, ty))) g.fillRect(x, y, 6, T);
          if (!plank(F.tileAt(tx + 1, ty))) g.fillRect(x + T - 6, y, 6, T);
        } else if (ch === '.' && shore && nextToWater(tx, ty) && noise(tx, ty, 17) < shore[1]) {
          const dx = x + T * (0.3 + noise(tx, ty, 15) * 0.4), dy = y + T * (0.6 + noise(tx, ty, 16) * 0.35);
          ui.sprite(this, dx, dy, shore[0], '', 10).setOrigin(0.5, 1).setDepth(dy);
        } else if (ch === '.') {
          // Flowers, tufts, little mushrooms, stumps, logs, bushes. You walk over (or behind) them.
          let roll = noise(tx, ty, 14);
          for (const key of decoKeys) {
            if (roll < decos[key]) {
              const dx = x + T * (0.25 + noise(tx, ty, 15) * 0.5), dy = y + T * (0.45 + noise(tx, ty, 16) * 0.45);
              ui.sprite(this, dx, dy, key, '', 10).setOrigin(0.5, 1).setDepth(key === 'deco_flowers' || key === 'deco_tuft' ? -5 : dy);
              break;
            }
            roll -= decos[key];
          }
        } else if (ch === 'r') {
          ui.sprite(this, x + T / 2, y + T * 0.85, 'rock', '🪨', 26).setOrigin(0.5, 1).setDepth(y + T * 0.85);
        } else if (ch === '#') {
          // Trees are sorted by how low they stand, so you walk behind the ones above you.
          const ox = (noise(tx, ty, 3) - 0.5) * 12, oy = (noise(tx, ty, 4) - 0.5) * 8;
          const tree = ui.sprite(this, x + T / 2 + ox, y + T + oy, pickTree(noise(tx, ty, 5)), '🌲', 40);
          tree.setOrigin(0.5, 0.92).setDepth(y + T + oy);
          if (tree.setFlipX && noise(tx, ty, 6) < 0.5) tree.setFlipX(true); // variety without leaving the palette
        }
      }
    }

    // Landmarks: fixed pictures on fixed squares (signposts, stump circles, FOR RENT signs...)
    for (const [key, tx, ty] of this.info.landmarks || []) {
      const x = tx * T + T / 2, y = ty * T + T * 0.85;
      ui.sprite(this, x, y, key, '', 14).setOrigin(0.5, 1).setDepth(y);
    }

    // This area's campfire: cook, rest, change gear, head home
    this.campfire = null;
    const C = F.find('C')[0];
    if (!C || !this.feature('campfire')) return;
    const cc = F.center(C.tx, C.ty);
    const glow = this.add.circle(cc.x, cc.y, T * 1.4, 0xf2b84b, 0.12).setDepth(1);
    glow.setDepth(cc.y - 30);
    this.tweens.add({ targets: glow, alpha: 0.28, scale: 1.12, duration: 700, yoyo: true, repeat: -1 });
    ui.sprite(this, cc.x, cc.y, 'campfire', '🔥', 34).setDepth(cc.y + 20);
    FUP.ui.text(this, cc.x, cc.y + 34, 'CAMPFIRE', 13, FUP.ui.colors.accent, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4 }).setOrigin(0.5).setDepth(5000);
    this.campfire = cc;
  }

  // ---------- Exit signs: a glowing sign on each linked gap in the map's edge ----------
  drawExits() {
    const F = FUP.forest, W = FUP.world, id = this.f.area;
    this.exits = [];
    const arrow = { W: e => '← ' + e, E: e => e + ' →', N: e => '↑ ' + e, S: e => '↓ ' + e };
    for (const edge of W.EDGES) {
      const link = W.linkAt(edge, id);
      if (!link) continue;
      const gap = W.gap(id, edge);
      gap.forEach(s => this.exits.push({ tx: s.tx, ty: s.ty, edge }));
      const mid = gap[Math.floor((gap.length - 1) / 2)];
      if (!mid) continue;
      const c = F.center(mid.tx, mid.ty);
      const glow = this.add.circle(c.x, c.y, 22, 0xf2e8c8, 0.15).setDepth(c.y - 30);
      this.tweens.add({ targets: glow, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
      // Keep the label on screen even when the exit is at the map's edge
      const lx = Math.min(Math.max(c.x, 90), this.worldW - 90), ly = Math.min(Math.max(c.y - 30, 20), this.worldH - 20);
      FUP.ui.text(this, lx, ly, arrow[edge](W.region(link.to).name), 13, FUP.ui.colors.ink, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4 }).setOrigin(0.5).setDepth(5000);
    }
  }

  // ---------- Ingredients, enemies, you ----------
  drawThings() {
    const A = this.A;
    this.itemSprites = A.items.map(it => {
      if (it.taken) return null;
      const c = FUP.forest.center(it.tx, it.ty);
      const s = FUP.ui.sprite(this, c.x, c.y, FUP.ui.ingKey(it.id), FUP.ingredients[it.id].emoji, 24).setDepth(c.y);
      this.tweens.add({ targets: s, y: c.y - 4, duration: 800 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return s;
    });

    this.enemySprites = A.enemies.map(e => e.alive ? this.enemySprite(e) : null);

    this.player = FUP.ui.sprite(this, A.player.x, A.player.y, FUP.looks.key('hero_map'), '🧍', 30).setOrigin(0.5, 0.72).setDepth(A.player.y + 16);
    this.hat = FUP.cosmetics.attachHat(this, this.player, 'map');   // your hat, if you wear one (G2)
  }

  enemySprite(e) {
    const data = FUP.enemies[e.type];
    return FUP.anim.sprite(this, e.x, e.y, data.mapSprite, 'walk', data.emoji, e.godfather ? 40 : 30).setOrigin(0.5, 0.7).setDepth(e.y + 16);
  }

  // ---------- The hidden hole (Deep Woods): one of the "H" spots, picked each trip ----------
  drawHole() {
    const h = this.A.hole;
    this.holePos = null;
    if (!h) return;
    this.holePos = FUP.forest.center(h.tx, h.ty);
    this.holeSprite = FUP.ui.sprite(this, this.holePos.x, this.holePos.y, 'hole', '🕳️', 30).setDepth(this.holePos.y - 10).setVisible(false);
    this.holeArmed = true;
  }

  // Walk into the hole: "Climb down? There's no coming back."
  checkHole() {
    if (!this.holePos) return;
    const d = Math.hypot(this.holePos.x - this.player.x, this.holePos.y - this.player.y);
    if (!this.holeArmed) { if (d > 60) this.holeArmed = true; return; }
    if (d < FUP.forestData.holeTouch) this.openHolePrompt();
  }

  openHolePrompt() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 20000;
    this.leaving = true;      // freezes the Forest while the question is up
    const parts = [];
    const fix = o => { parts.push(o); return o.setScrollFactor(0).setDepth(Z); };
    fix(FUP.ui.shade(this, 0.7));
    fix(FUP.ui.panel(this, W / 2 - 250, 170, 500, 250, 'panel'));
    fix(ui.text(this, W / 2, 200, 'Climb down? There\'s no coming back.', 22, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0));
    fix(ui.text(this, W / 2, 245, 'The Landlord\'s Basement is down there: 4 rooms, then his Office.\nNo campfire, no heading home, no running from him.\nWhat\'s in your satchel is what you\'ve got.', 14, c.ink, { align: 'center', lineSpacing: 5 }).setOrigin(0.5, 0));
    const close = () => parts.forEach(p => p.destroy());
    const btn = (x, label, fn, hot) => {
      const b = ui.button(this, x, 340, 190, 48, label, fn, { size: 18, hot });
      for (const o of [b.rect, b.txt, b.icon].filter(Boolean)) { o.setScrollFactor(0).setDepth(Z + 1); parts.push(o); }
    };
    btn(W / 2 - 205, '🕳️ Climb down', () => {
      close();
      this.say('holeClimb');
      FUP.audio.sfx('encounter');
      this.cameras.main.fadeOut(700, 0, 0, 0);
      // Down into the Landlord's Basement (blueprint 18.6): 4 rooms, then his Office
      this.time.delayedCall(720, () => { FUP.raid.start(this.f); this.scene.start('Raid', {}); });
    }, true);
    btn(W / 2 + 15, 'Not yet', () => { close(); this.leaving = false; this.holeArmed = false; this.say('holeNotYet'); });
  }

  // ---------- Your grave (Normal mode, src/systems/grave.js) ----------
  // Shown above the fog so you can always see where it is in its area.
  drawGrave() {
    const G = FUP.grave.state;
    this.graveSprite = null;
    if (!G || G.region !== this.f.area || this.f.raid) return;
    this.graveGlow = this.add.circle(G.x, G.y, 22, FUP.look.num('r3'), 0.3).setDepth(6090);
    this.tweens.add({ targets: this.graveGlow, scale: 1.4, alpha: 0.08, duration: 900, yoyo: true, repeat: -1 });
    this.graveSprite = FUP.ui.sprite(this, G.x, G.y, 'grave', '🪦', 30).setOrigin(0.5, 0.75).setDepth(6100);
  }

  checkGrave() {
    if (!this.graveSprite) return;
    const G = FUP.grave.state;
    if (!G) { this.removeGrave(); return; }   // it crumbled while you walked
    if (Math.hypot(G.x - this.player.x, G.y - this.player.y) > FUP.runData.grave.touch) { this.graveWarned = false; return; }
    if (this.graveWarned) return;
    const got = FUP.grave.loot();
    const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const bits = [got.coins && `${got.coins} 🪙`, got.gear && `${got.gear} gear`, got.ings && pl(got.ings, 'ingredient', 'ingredients'), got.dishes && pl(got.dishes, 'dish', 'dishes')].filter(Boolean);
    this.floatGrave('Got back: ' + (bits.join(', ') || 'nothing'));
    FUP.audio.sfx('pickup');
    FUP.fx.burst(this, G.x, G.y, 'pickup', G.y + 20);
    if (got.left) { this.graveWarned = true; this.say('graveFoundPartly'); }
    else { this.say('graveFound'); this.removeGrave(); }
    this.drawSatchel();
  }

  removeGrave() {
    if (this.graveSprite) this.graveSprite.destroy();
    if (this.graveGlow) this.graveGlow.destroy();
    this.graveSprite = this.graveGlow = null;
  }

  floatGrave(str) {
    const t = FUP.ui.text(this, this.player.x, this.player.y - 40, str, 15, FUP.ui.colors.good, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4 }).setOrigin(0.5).setDepth(9000);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, delay: 1200, duration: 800, onComplete: () => t.destroy() });
  }

  // ---------- Fog of war (blueprint 18.6) ----------
  // You see a circle around you. Squares you've seen stay dim (no enemies shown there).
  // The campfire lights a bigger circle. Drawn as a tiny picture (2 dots per square) stretched
  // over the map, so the edges come out soft.
  drawFog() {
    const F = this.tiles, T = F.size(), key = 'forest_fog';
    if (this.textures.exists(key)) this.textures.remove(key);
    this.fogW = F.width() * 2; this.fogH = F.height() * 2;
    this.fogTex = this.textures.createCanvas(key, this.fogW, this.fogH);
    this.fogTex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.fogImg = this.fogTex.getContext().createImageData(this.fogW, this.fogH);
    this.add.image(0, 0, key).setOrigin(0).setScale(T / 2).setDepth(6000);
    this.fogAt = null;
    // The campfire's light: those squares count as seen from the start
    const fog = this.fogData();
    if (this.campfire) {
      const cx = this.campfire.x / T, cy = this.campfire.y / T;
      for (let ty = 0; ty < F.height(); ty++) for (let tx = 0; tx < F.width(); tx++)
        if (Math.hypot(tx + 0.5 - cx, ty + 0.5 - cy) <= fog.campfire) this.A.seen[ty * F.width() + tx] = 1;
    }
    this.updateFog();
  }

  updateFog() {
    if (!this.fogTex) return;   // no fog in this region (data/world.js features)
    const F = this.tiles, T = F.size(), fog = this.fogData(), A = this.A, TW = F.width();
    const px = this.player.x / T, py = this.player.y / T;
    if (this.fogAt && Math.abs(this.fogAt.x - px) < 0.05 && Math.abs(this.fogAt.y - py) < 0.05) return; // you haven't moved
    this.fogAt = { x: px, y: py };
    const R = fog.sight, CR = this.campfire ? fog.campfire : 0, cx = this.campfire ? this.campfire.x / T : -99, cy = this.campfire ? this.campfire.y / T : -99;
    // Squares inside your sight circle are now "seen"
    for (let ty = Math.floor(py - R); ty <= py + R; ty++) for (let tx = Math.floor(px - R); tx <= px + R; tx++)
      if (tx >= 0 && ty >= 0 && tx < TW && ty < F.height() && Math.hypot(tx + 0.5 - px, ty + 0.5 - py) <= R) A.seen[ty * TW + tx] = 1;
    const out = this.fogImg.data;
    for (let sy = 0; sy < this.fogH; sy++) {
      const fy = (sy + 0.5) / 2;
      for (let sx = 0; sx < this.fogW; sx++) {
        const fx = (sx + 0.5) / 2;
        const lit = Math.max(Math.min(1, Math.max(0, R - Math.hypot(fx - px, fy - py))), Math.min(1, Math.max(0, CR - Math.hypot(fx - cx, fy - cy))));
        const base = A.seen[Math.floor(fy) * TW + Math.floor(fx)] ? fog.memory : 1;
        const i = (sy * this.fogW + sx) * 4;
        out[i] = 6; out[i + 1] = 8; out[i + 2] = 6; out[i + 3] = Math.round(255 * base * (1 - lit));
      }
    }
    this.fogTex.getContext().putImageData(this.fogImg, 0, 0);
    this.fogTex.refresh();
  }

  // Can you see this spot right now? (inside your sight circle, or in the campfire's light)
  inSight(x, y) {
    const T = this.tiles.size(), fog = this.fogData();
    return Math.hypot(x - this.player.x, y - this.player.y) < fog.sight * T || (this.campfire && Math.hypot(x - this.campfire.x, y - this.campfire.y) < fog.campfire * T);
  }

  // This area's fog settings (the Raid has its own)
  fogData() { return this.info.fog; }

  // Enemies only show inside your sight. The hole too (and the narrator notices it once).
  updateSight() {
    this.A.enemies.forEach((e, i) => {
      const s = this.enemySprites[i];
      if (!s || !e.alive) return;
      const see = this.inSight(e.x, e.y);
      s.setVisible(see);
      if (see && e.godfather && !e.seen) { e.seen = true; this.say('godfatherSeen'); }
    });
    if (this.holePos) {
      const near = Math.hypot(this.holePos.x - this.player.x, this.holePos.y - this.player.y) < this.info.fog.sight * FUP.forestData.tileSize;
      this.holeSprite.setVisible(near);
      if (near && !this.A.holeSeen) { this.A.holeSeen = true; this.say('holeFound'); }
    }
  }

  // ---------- Each area's light and weather (data/forest.js `light`, `weather`) ----------
  drawLight() {
    const W = this.scale.width, H = this.scale.height, L = this.info.light;
    if (L) this.add.rectangle(0, 0, W, H, L.color, L.alpha).setOrigin(0).setScrollFactor(0).setDepth(6500).setBlendMode(Phaser.BlendModes[L.blend || 'NORMAL']);
    this.weather = [];
    const kind = this.info.weather, rnd = Math.random;
    if (kind === 'sunbeams') {
      for (let k = 0; k < 4; k++) {
        const beam = this.add.rectangle(120 + k * 220, H / 2, 70 + rnd() * 60, H * 1.6, 0xfff2c0, 0.07).setAngle(28).setScrollFactor(0).setDepth(6600).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: beam, alpha: 0.02, x: beam.x + 40, duration: 3000 + rnd() * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    } else if (kind === 'leaves') {
      const cols = [0xd8742a, 0xe8a03a, 0xb8502a, 0xf0c050];
      for (let k = 0; k < 16; k++) {
        const leaf = this.add.rectangle(rnd() * W, rnd() * H, 7, 4, cols[k % 4]).setScrollFactor(0).setDepth(6600);
        this.weather.push({ o: leaf, vx: -20 - rnd() * 25, vy: 35 + rnd() * 30, sway: rnd() * 6, spin: 90 + rnd() * 120 });
      }
    } else if (kind === 'fireflies') {
      for (let k = 0; k < 18; k++) {
        const fly = this.add.circle(rnd() * W, rnd() * H, 2.5, 0xd8ff7a).setScrollFactor(0).setDepth(6600).setBlendMode(Phaser.BlendModes.ADD);
        this.weather.push({ o: fly, vx: (rnd() - 0.5) * 30, vy: (rnd() - 0.5) * 30, blink: rnd() * 6, fly: true });
      }
    }
  }

  updateWeather(dt) {
    const W = this.scale.width, H = this.scale.height, t = this.time.now / 1000;
    for (const p of this.weather) {
      const o = p.o;
      if (p.fly) {
        p.vx += (Math.random() - 0.5) * 20 * dt; p.vy += (Math.random() - 0.5) * 20 * dt;
        o.x += p.vx * dt; o.y += p.vy * dt;
        o.setAlpha(0.3 + 0.7 * Math.max(0, Math.sin(t * 2 + p.blink)));
      } else {
        o.x += (p.vx + Math.sin(t * 2 + p.sway) * 25) * dt; o.y += p.vy * dt; o.angle += p.spin * dt;
      }
      if (o.x < -10) o.x = W + 10; if (o.x > W + 10) o.x = -10;
      if (o.y > H + 10) o.y = -10; if (o.y < -10) o.y = H + 10;
    }
  }

  // ---------- Screen overlay: timer, area, HP, bag, satchel ----------
  drawHud() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height;
    const fix = o => o.setScrollFactor(0).setDepth(10000);

    // Top bar: only shows when the narrator speaks (Jesus, v0.41). No timer (it still counts for quests).
    const bar = fix(FUP.ui.panel(this, 16, 12, W - 32, 46, 'hud'));
    const label = fix(ui.text(this, W - 70, 35, this.hudLabel(), 14, c.dim, { fontStyle: '700' }).setOrigin(1, 0.5));
    // The narrator line wraps before it reaches the area name (long room names in the raid)
    this.narratorText = fix(ui.text(this, 32, 35, '', 17, c.ink, { fontStyle: 'italic', wordWrap: { width: W - 70 - label.width - 52 } }).setOrigin(0, 0.5));
    this.timerText = fix(ui.text(this, W - 62, 35, '', 20, c.accent, { fontStyle: '700' }).setOrigin(1, 0.5)).setVisible(false);
    this.showBar = FUP.ui.autoHide(this, [bar, label, this.narratorText], 5000);
    ui.muteButton(this, W - 36, 35, true);

    fix(FUP.ui.panel(this, 16, H - 58, W - 32, 46, 'hud'));
    fix(ui.text(this, 30, H - 35, 'HP', 14, c.dim, { fontStyle: '700' }).setOrigin(0, 0.5));
    this.hpBar = ui.bar(this, 58, H - 43, 150, 16, c.hp);
    fix(this.hpBar.bg); fix(this.hpBar.fill);
    this.hpText = fix(ui.text(this, 216, H - 35, '', 14, c.ink).setOrigin(0, 0.5));
    // Backpack button (v0.41). The Forest pauses while it's open.
    const pb = ui.button(this, 290, H - 50, 110, 30, '', () => this.openPack(), { size: 13 });
    // World map button (v0.53, not in the raid): M key too
    if (this.scene.key === 'World') {
      const mb = ui.button(this, 404, H - 50, 40, 30, '🗺️', () => this.openMap(), { size: 15 });
      fix(mb.rect).setDepth(10001); fix(mb.txt).setDepth(10002);
    }
    pb.rect.setScrollFactor(0).setDepth(10001); pb.txt.setScrollFactor(0).setDepth(10002);
    this.bagText = pb.txt;
    this.satchelText = fix(ui.text(this, 450, H - 35, 'Food:', 14, c.ink).setOrigin(0, 0.5));
    this.helpText = fix(ui.text(this, W - 30, H - 35, FUP.ui.isTouch(this) ? 'Drag anywhere to walk' : 'WASD / arrows / drag to walk', 12, c.dim).setOrigin(1, 0.5));
    this.drawSatchel();
    this.dayText = fix(ui.text(this, W - 20, 66, '', 13, c.dim, { backgroundColor: FUP.look.hex('k0') + 'cc', padding: { x: 8, y: 3 } }).setOrigin(1, 0));   // Day 3 ☀️ (data/clock.js)
    // Normal mode: your grave's timer
    this.graveText = fix(ui.text(this, W / 2, 66, '', 14, c.bad, { fontStyle: '700', backgroundColor: FUP.look.hex('k0') + 'cc', padding: { x: 8, y: 4 } }).setOrigin(0.5, 0));
    this.refreshHud();
  }

  // Satchel pictures in the bottom bar (in the Forest it can't change while you walk:
  // you eat in fights and at camp. The Raid lets you eat from it: see RaidScene.js).
  drawSatchel() {
    const ui = FUP.ui, H = this.scale.height;
    for (const o of this.satchelParts || []) o.destroy();
    this.satchelParts = [];
    const fix = o => { this.satchelParts.push(o); return o.setScrollFactor(0).setDepth(10000); };
    // One picture per stack of the same dish, with how many (v0.41 backpack)
    const stacks = FUP.run.dishStacks(), n = stacks.length, step = Math.min(36, 300 / Math.max(1, n));
    this.satchelIdx = [];
    stacks.forEach((st, i) => {
      fix(ui.sprite(this, 540 + i * step, H - 35, FUP.dishArt.key(st.dish), st.dish.emoji, 18, 1.5));
      if (st.n > 1) this.satchelParts.push(ui.text(this, 540 + i * step + 12, H - 24, String(st.n), 11, ui.colors.ink, { fontStyle: '700', stroke: ui.colors.stroke, strokeThickness: 3 }).setOrigin(1, 1).setScrollFactor(0).setDepth(10001));
      this.satchelIdx.push(st.idx[0]);
    });
    if (this.helpText) this.helpText.setVisible(n <= 3);
    if (!FUP.run.satchel.length) fix(ui.text(this, 530, H - 35, 'no food', 14, ui.colors.dim).setOrigin(0, 0.5));
    return this.satchelParts;
  }

  refreshHud() {
    const run = FUP.run, c = FUP.ui.colors;
    const hp = run.currentHp(), max = run.maxHp();
    this.hpBar.set(hp / max);
    this.hpBar.color(hp < max * 0.3 ? c.hpLow : c.hp);
    this.hpText.setText(`${hp}/${max}`);
    this.bagText.setText(`🎒 ${run.slotsUsed()}/${run.packMax()}  🪙 ${run.coins}`);
    const s = Math.floor(this.f.time);
    this.timerText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    if (this.graveText) this.graveText.setText(FUP.grave.hudText()).setVisible(FUP.grave.active());
    if (FUP.grave.crumbled) { FUP.grave.crumbled = false; this.say('graveCrumbled'); }
    if (this.dayText) this.dayText.setText(FUP.clock.label());
    if (FUP.clock.rolled) { FUP.clock.rolled = 0; this.say('newDay'); }   // a new day started while you walked
  }

  // 'Forest Edge · Lv 1-5'
  hudLabel() { const r = FUP.world.region(this.f.area), b = r && r.band; return b ? `${this.info.name} · Lv ${b[0]}-${b[1]}` : this.info.name; }

  // Is this part of the screen on in this region? (data/world.js features; the Raid has none = all on)
  feature(name) { return FUP.world.has(this.f.area, name); }

  // One region's ground picture in memory at a time: forget the others
  dropOldGround() {
    const keep = FUP.forest.ground().key;
    for (const id of FUP.forest.ids().concat(Object.keys(FUP.worldData.areas))) { const k = 'forest_ground_' + id; if (k !== keep && this.textures.exists(k)) this.textures.remove(k); }
  }

  // The 🗺️ world map (src/worldMapUi.js): the region pauses while it's open
  openMap() {
    if (this.leaving || this.pack || this.panel) return;
    this.leaving = true;
    this.pack = FUP.worldMapUi.open(this, () => { this.pack = null; this.leaving = false; });
  }

  openPack() {
    if (this.leaving || this.pack || this.panel) return;
    this.leaving = true;
    FUP.tutorial.note('pack');   // Orientation Isle: "open your backpack"
    this.pack = FUP.backpack.open(this, { home: false, onChange: () => this.refreshHud(), onClose: () => { this.pack = null; this.leaving = false; this.drawSatchel(); this.refreshHud(); } });
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard.on('keydown-I', () => this.openPack());
    // Talk / read / fish (WorldPeople.js), and ESC closes a villager's window
    for (const k of ['E', 'SPACE', 'ENTER']) this.input.keyboard.on('keydown-' + k, () => { if (this.interact) this.interact(); });
    this.input.keyboard.on('keydown-ESC', () => { if (this.panel && this.closePanel) this.closePanel(); });
    if (this.scene.key === 'World') this.input.keyboard.on('keydown-M', () => this.openMap());
    this.stick = FUP.ui.joystick(this, () => !this.leaving);
  }

  // ---------- Every frame ----------
  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    this.updateWeather(dt);       // leaves and fireflies keep moving even while a question is up
    if (this.leaving || this.panel) return;
    const f = this.f;
    f.time += dt;
    this.movePlayer(dt);
    this.updateAction();
    if (this.tut) this.updateTutorial(dt);
    if (this.leaving) return;
    this.pickUpItems();
    this.moveEnemies(dt);
    this.updateFog();
    this.updateSight();
    if (!this.leaving) this.checkCampfire();
    if (!this.leaving) this.checkExits();
    if (!this.leaving) this.checkHole();
    if (!this.leaving) this.checkGrave();
    this.refreshHud();
  }

  movePlayer(dt) {
    const k = this.keys, d = FUP.forestData;
    let dx = 0, dy = 0;
    if (k.A.isDown || k.LEFT.isDown) dx -= 1;
    if (k.D.isDown || k.RIGHT.isDown) dx += 1;
    if (k.W.isDown || k.UP.isDown) dy -= 1;
    if (k.S.isDown || k.DOWN.isDown) dy += 1;

    // On-screen joystick (finger or mouse drag)
    if (!dx && !dy && (this.stick.dx || this.stick.dy)) { dx = this.stick.dx; dy = this.stick.dy; }
    if (!dx && !dy) return;
    // Footsteps
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) { this.stepTimer = 0.28; FUP.audio.sfx('step'); }

    const len = Math.hypot(dx, dy), step = d.playerSpeed * dt;
    this.slide(this.player, (dx / len) * step, (dy / len) * step, 12);
    if (dx) this.player.setFlipX(dx < 0);
    this.player.setDepth(this.player.y + 16); // in front of trees above you, behind trees below
    this.A.player.x = this.player.x;
    this.A.player.y = this.player.y;
  }

  // Move a sprite, sliding along walls instead of sticking to them.
  slide(sprite, mx, my, half) {
    const F = this.tiles, hit = (x, y) => F.blockedBox(x, y, half) || (this.solidAt && this.solidAt(x, y, half));   // villagers block their square
    if (!hit(sprite.x + mx, sprite.y)) sprite.x += mx;
    if (!hit(sprite.x, sprite.y + my)) sprite.y += my;
  }

  pickUpItems() {
    const run = FUP.run;
    this.A.items.forEach((it, i) => {
      if (it.taken) return;
      const c = FUP.forest.center(it.tx, it.ty);
      if (Math.hypot(c.x - this.player.x, c.y - this.player.y) > 24) return;
      if (!run.addToBag(it.id)) {
        if (!it.warned) { it.warned = true; this.say('forestBagFull'); FUP.audio.sfx('error'); }
        return;
      }
      it.taken = true;
      this.f.found.push(it.id);
      const s = this.itemSprites[i];
      this.tweens.killTweensOf(s);
      this.tweens.add({ targets: s, y: s.y - 30, alpha: 0, scale: s.scale * 1.6, duration: 400, onComplete: () => s.destroy() });
      FUP.fx.burst(this, s.x, s.y, 'pickup', s.y + 20);
      this.say('forestPickup', { item: FUP.ingredients[it.id].name });
      FUP.audio.sfx('pickup');
    });
  }

  moveEnemies(dt) {
    const d = FUP.forestData, T = d.tileSize, f = this.f;
    const calm = f.time < f.graceUntil;
    this.A.enemies.forEach((e, i) => {
      if (!e.alive) return;
      const s = this.enemySprites[i];
      const touch = e.touch ? e.touch : e.bridge ? d.toll.bridgeTouch : e.godfather ? d.godfatherTouch : d.touchDistance;
      if (!calm && Math.hypot(this.player.x - e.x, this.player.y - e.y) < touch) { this.startBattle(i); return; }
      if (e.still) { s.setAlpha(calm ? 0.5 : 1); return; }   // the bridge goblin and the Godfather hold their ground
      const toPlayer = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      const fromHome = Math.hypot(e.x - e.homeX, e.y - e.homeY);
      let tx, ty, speed;

      if (!calm && toPlayer < d.enemyChaseRange * T && fromHome < d.enemyLeashRange * T) {
        tx = this.player.x; ty = this.player.y; speed = d.enemyChaseSpeed; // chase!
        e.wander = null;
      } else {
        // Wander: pick a spot near home, walk to it, pause, repeat.
        if (!e.wander || e.wander.wait <= 0 && Math.hypot(e.wander.x - e.x, e.wander.y - e.y) < 6) {
          e.wander = { x: e.homeX + (Math.random() - 0.5) * T * 4, y: e.homeY + (Math.random() - 0.5) * T * 4, wait: 1 + Math.random() * 2 };
        }
        if (Math.hypot(e.wander.x - e.x, e.wander.y - e.y) < 6) { e.wander.wait -= dt; s.setAlpha(calm ? 0.5 : 1); return; }
        tx = e.wander.x; ty = e.wander.y; speed = d.enemyWanderSpeed;
      }

      const vx = tx - e.x, vy = ty - e.y, len = Math.hypot(vx, vy) || 1;
      const bx = e.x, by = e.y;
      s.x = e.x; s.y = e.y;
      this.slide(s, (vx / len) * speed * dt, (vy / len) * speed * dt, 12);
      e.x = s.x; e.y = s.y;
      if (e.wander && e.x === bx && e.y === by) e.wander = null; // stuck on a tree: pick a new spot
      if (vx) s.setFlipX(vx < 0);
      s.setDepth(s.y + 16);
      s.setAlpha(calm ? 0.5 : 1);
    });
  }

  // Touching an enemy. The Moss Goblin asks for his toll first; pigeons come as a flock.
  startBattle(index, opts = {}) {
    if (this.leaving) return;
    this.leaving = true;
    const e = this.A.enemies[index];
    if (e.type === 'goblin' && !opts.enraged) { this.openToll(index); return; }
    // mult = this area's multiplier: tougher enemies, more XP and coins (blueprint 18.6)
    const reg = FUP.world.region(this.f.area);
    FUP.run.battle = { index, type: e.type, result: null, mult: this.info.mult, coinMult: this.info.coinMult, areaLevel: this.info.level, dropTier: (reg && reg.dropTier) || 1 };
    const enemies = e.group ? e.group.slice() : e.count ? new Array(e.count).fill(e.type) : [e.type];
    FUP.audio.sfx('encounter');
    FUP.fx.shake(this, 'encounter');
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(250, () => this.scene.start('Battle', { enemies, enraged: !!opts.enraged }));
  }

  // ---------- The Moss Goblin's toll (blueprint 18.2): Pay / Rizz / Refuse ----------
  openToll(index) {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 20000;
    const run = FUP.run, T = FUP.forestData.toll, e = this.A.enemies[index], data = FUP.enemies.goblin;
    const g = FUP.gear.totals();
    // "of the Tax-Exempt" gear cuts the toll too (rentLess)
    const cost = share => run.coins > 0 ? Math.max(1, Math.ceil(run.coins * share * (1 - (g.rentLess || 0)))) : 0;
    const share = FUP.unlocks.tollShare();   // smaller toll at Rizz 15 and 30 (data/forest.js payByRizz)
    const pay = cost(share), haggled = cost(share * T.haggledShare);
    const chance = FUP.combat.rizzChance('charm', FUP.skills.level('rizz'), FUP.weapons[run.weapon], data, g.rizz);
    const parts = [];
    const fix = o => { parts.push(o); return o.setScrollFactor(0).setDepth(Z); };
    fix(FUP.ui.shade(this, 0.7));
    fix(FUP.ui.panel(this, W / 2 - 300, 150, 600, 270, 'panel'));
    fix(ui.sprite(this, W / 2 - 240, 215, data.sprite, data.emoji, 60, 1.6));
    fix(ui.text(this, W / 2 + 30, 180, data.name, 20, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0));
    const ask = Phaser.Utils.Array.GetRandom(FUP.narrator.tollAsk);
    const line = run.coins > 0 ? `${ask}\nHe wants ${pay} 🪙 (you carry ${run.coins}).` : `${ask}\n${FUP.narrator.tollBroke[0]}`;
    fix(ui.text(this, W / 2 + 30, 215, line, 14, c.ink, { align: 'center', lineSpacing: 5, wordWrap: { width: 420 } }).setOrigin(0.5, 0));
    const close = () => parts.forEach(p => p.destroy());
    const btn = (x, w, label, fn, hot, enabled = true) => {
      const b = ui.button(this, x, 340, w, 52, label, fn, { size: 15, hot });
      for (const o of [b.rect, b.txt, b.icon].filter(Boolean)) { o.setScrollFactor(0).setDepth(Z + 1); parts.push(o); }
      if (!enabled) b.setEnabled(false);
    };
    // He's paid (or charmed by your haggling): he walks off for the rest of the trip
    const leave = () => {
      e.alive = false;
      const s = this.enemySprites[index];
      if (s) this.tweens.add({ targets: s, alpha: 0, y: s.y - 20, duration: 600, onComplete: () => s.destroy() });
      this.leaving = false;
      this.f.graceUntil = this.f.time + FUP.worldData.arriveGraceSeconds;
      this.time.delayedCall(2600, () => { if (!this.leaving) this.say('tollAfterPay'); });
    };
    // Refused or haggled badly: fight him Enraged (the screen stays frozen until the fight starts)
    const fight = say => { close(); this.say(say); this.time.delayedCall(700, () => { this.leaving = false; this.startBattle(index, { enraged: true }); }); };
    const X = W / 2 - 280;
    btn(X, 180, run.coins > 0 ? `🪙 Pay ${pay}` : '🪙 Pay\n(no coins)', () => {
      close(); run.coins -= pay; FUP.audio.sfx('coins'); this.say('tollPay', { item: pay }); leave();
    }, false, run.coins > 0);
    btn(X + 190, 180, `💬 Rizz ${Math.round(chance * 100)}%\n(talk it down to ${haggled})`, () => {
      if (Math.random() < chance) {
        close(); run.coins -= haggled; FUP.audio.sfx('charm');
        FUP.skills.addXp('rizz', T.haggleRizzXp, { x: W / 2, y: H / 2 });
        this.say('tollHaggle', { item: haggled }); leave();
      } else { FUP.audio.sfx('boo'); fight('tollHaggleFail'); }
    }, true);
    btn(X + 380, 180, '✊ Refuse\n(he gets angry)', () => fight('tollRefuse'));
  }

  checkCampfire() {
    if (!this.campfire) return;
    const dist = Math.hypot(this.campfire.x - this.player.x, this.campfire.y - this.player.y);
    if (!this.campfireArmed) { if (dist > 60) this.campfireArmed = true; return; }
    if (dist > 30) return;
    this.leaving = true;
    this.A.campfireVisited = true;   // the Godfather now waits on the way to the hole instead
    if (!this.safe) FUP.quests.event('campfire', { area: FUP.forest.number(this.f.area) });
    FUP.audio.sfx('campfire');
    if (this.safe) this.saveHere();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('Cook', { mode: this.safe ? 'isle' : 'campfire' }));   // a safe campfire = Orientation Isle's (no trip)
  }

  // Step onto a gap in the map's edge: cross into the next region (or home to the village).
  checkExits() {
    const T = FUP.forestData.tileSize, tx = Math.floor(this.player.x / T), ty = Math.floor(this.player.y / T);
    const ex = this.exits.find(x => x.tx === tx && x.ty === ty);
    if (!ex) return;
    const r = FUP.world.cross(ex.edge);
    if (!r) return;
    if (r.locked) {
      // Can't go that way yet: say why and step back inside
      this.narratorText.setText(r.locked.join(' · '));
      if (this.showBar) this.showBar();
      const step = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[ex.edge];
      this.player.x += step[0] * T; this.player.y += step[1] * T;
      return;
    }
    this.leaving = true;
    const ms = FUP.worldData.fadeMs;
    this.cameras.main.fadeOut(ms, 0, 0, 0);
    if (r.scene === 'Village') {
      // Out the way you came: a trip ends safely, like Head home at a campfire. From the Docks: just a walk.
      FUP.save.write();
      if (!this.safe) this.say('forestWalkHome');
      this.time.delayedCall(ms + 20, () => this.scene.start('Village', { from: this.safe ? 'walk' : 'retreat', at: r.arrive }));
      return;
    }
    FUP.save.write(!FUP.world.safe(r.to));   // on a trip: closing the page now loses the bag
    this.time.delayedCall(ms + 20, () => this.scene.start(r.scene, {}));
  }

  // ---------- Narrator ----------
  say(category, vars = {}) {
    const lines = FUP.narrator[category];
    if (!lines || !lines.length) return;
    const line = Phaser.Utils.Array.GetRandom(lines).replace(/\{item\}/g, vars.item !== undefined ? vars.item : 'something').replace(/\{day\}/g, FUP.clock.day());
    this.narratorText.setFontSize(17).setText(line);
    if (this.narratorText.height > 44) this.narratorText.setFontSize(14);   // long line: smaller, so it stays in the bar
    if (this.showBar) this.showBar();
    this.narratorText.setAlpha(0.2);
    this.tweens.add({ targets: this.narratorText, alpha: 1, duration: 250 });
  }
}
