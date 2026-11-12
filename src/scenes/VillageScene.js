// ============================================================
// VILLAGE — Foopville. Walk around (WASD / arrows / hold the mouse),
// walk up to someone and press E / Space / the round button (or click them) to talk.
// On phones: drag anywhere to walk (joystick), tap the round button to talk.
//   Blacksmith = weapons + armor     Shopkeeper = trinkets, ingredients, buys your stuff
//   Chef Marrowbone = secret-recipe riddles   Quest Board Keeper = quests
//   Your house = walk inside (HouseScene) The gate (top) = walk through it into the Forest Edge
//   The south road and east bridge lead off the map too, once they're fixed (data/world.js).
//   Planksworth = houses, stove, pantry. Farm patches: see VillageFarm.js.
// The game saves every time you arrive here and after every purchase.
// Shop screens are in VillagePanels.js.
// ============================================================
class VillageScene extends Phaser.Scene {
  constructor() { super('Village'); }

  init(data) { this.arrive = data || {}; }

  create() {
    const M = FUP.villageMap, d = FUP.villageData, T = d.tileSize;
    this.worldW = M.width() * T;
    this.worldH = M.height() * T;
    // Phaser reuses this screen between visits, so reset everything from last time
    this.panel = null; this.panelId = null;
    this.mapUi = null;        // the 🗺️ world map window (src/worldMapUi.js)
    this.walkTo = null; this.path = null;
    this.leaving = false;
    this.busy = false;        // doing a farm job (stand still)
    this.farmViews = null; this.spots = null; this.farmText = null; this._placeViews = null; this._stallMarks = null; this.buildBtn = null; this.repairBits = null; this.boardSprite = null; this.repairSprites = {};   // drawn fresh below (old ones were destroyed)
    this.stepTimer = 0;
    FUP.looks.apply(this, FUP.run.hero.look);
    FUP.world.arriveHome();   // however you got here (walked, died, the chute, the boss)

    this.drawMap();
    this.drawBuildings();
    this.drawFarm();
    this.drawPeople();
    this.drawProps();     // benches, the telescope, the statue, the orchard, farm things (data/village.js props)
    this.drawRepairs();   // ruins, the Restoration Board, the well (VillageRepairs.js)
    this._trapViews = null; this.trapSig = null;
    FUP.trapUi.draw(this, 'village', FUP.villageMap);   // fish traps by the pond (src/trapUi.js)
    this.spots.push(...FUP.trapUi.spots('village', FUP.villageMap));
    this.drawHud();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-SPACE', () => this.interact());
    this.input.keyboard.on('keydown-ENTER', () => this.interact());
    this.input.keyboard.on('keydown-ESC', () => this.closePanel());
    this.input.keyboard.on('keydown-K', () => this.openSkills());
    this.input.keyboard.on('keydown-I', () => this.openPack());
    this.input.keyboard.on('keydown-B', () => this.openBuild());
    this.input.keyboard.on('keydown-M', () => this.openMap());
    FUP.progressUi.attach(this);
    this.stick = FUP.ui.joystick(this, () => !this.panel && !this.leaving);

    const cam = this.cameras.main;
    cam.setBounds(0, -60, this.worldW, this.worldH + 120);   // room so the gate isn't hidden under the top bar
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.fadeIn(300, 0, 0, 0);

    FUP.save.write();
    FUP.audio.music('village');
    const a = this.arrive;
    if (a.lostRun) this.say('villageLostRun');
    else if (a.from === 'respawn') this.say('villageRespawn');
    else if (a.fresh) this.say('villageFirst', { name: FUP.run.hero.name });
    else if (a.from === 'chute') this.say('villageChute');
    else if (a.from === 'run') this.say('villageReturn');
    else if (a.from === 'retreat') this.say('villageRetreat');
    else if (a.from === 'home') this.say('villageFromHome');
    else this.say('villageBack', { name: FUP.run.hero.name });
    this.rundownLine();
    this.time.delayedCall(450, () => { if (!this.leaving) FUP.awayCard.show(this); });   // "While you were out" (src/awayCard.js)
    // The life layer: extra scenery, wind, chickens and ducks, birds, day/night light, chimney smoke (src/ambience.js)
    FUP.ambience.attach(this, { place: 'village', tiles: M, T: d.tileSize, region: 'village', lamps: 'l' });
  }

  // ---------- The map: ground, trees, little things ----------
  drawMap() {
    const M = FUP.villageMap, d = FUP.villageData, T = d.tileSize, ui = FUP.ui;
    this.groundImg = this.add.image(0, 0, FUP.forestGround.make(this, M, d.ground, FUP.repairs.groundKey())).setOrigin(0).setScale(T / d.ground.pixelsPerSquare).setDepth(-10);
    const noise = (x, y, k = 0) => { const n = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453; return n - Math.floor(n); };
    const decoKeys = Object.keys(d.decorations);

    for (let ty = 0; ty < M.height(); ty++) {
      for (let tx = 0; tx < M.width(); tx++) {
        const ch = M.tileAt(tx, ty), x = tx * T, y = ty * T, n = noise(tx, ty);
        if (ch === '#') {
          // Trees on a plateau's front edge stand on top of the cliff face (data/look.js map.cliff)
          const lift = d.ground.cliff && M.tileAt(tx, ty + 1) !== '#' && ty + 1 < M.height() ? FUP.look.map.cliff.height * T : 0;
          const ox = (noise(tx, ty, 3) - 0.5) * 12, oy = (noise(tx, ty, 4) - 0.5) * 8 - lift - (lift ? 4 : 0);
          const tree = ui.sprite(this, x + T / 2 + ox, y + T + oy, noise(tx, ty, 5) < 0.5 ? 'tree_pine' : 'tree_round', '🌲', 40);
          tree.setOrigin(0.5, 0.92).setDepth(y + T + oy);
        } else if (ch === '~') {
          if (n < d.lilyPadChance) ui.sprite(this, x + T * 0.5, y + T * 0.5, 'deco_lily', '', 10).setDepth(-5);
        } else if (ch === 'l') {
          const glow = this.add.circle(x + T / 2, y + T * 0.2, T * 0.9, 0xf2d88a, 0.1).setDepth(-4);
          this.tweens.add({ targets: glow, alpha: 0.2, duration: 1200 + n * 600, yoyo: true, repeat: -1 });
          ui.sprite(this, x + T / 2, y + T * 0.9, 'vil_lamp', '🏮', 24).setOrigin(0.5, 1).setDepth(y + T * 0.9);
        } else if (ch === 'k') {
          ui.sprite(this, x + T / 2, y + T * 0.9, n < 0.5 ? 'vil_barrel' : 'vil_crate', '📦', 22).setOrigin(0.5, 1).setDepth(y + T * 0.9);
        } else if (ch === 'h') {
          ui.sprite(this, x + T / 2, y + T * 0.9, 'deco_haybale', '🌾', 22).setOrigin(0.5, 1).setDepth(y + T * 0.9);
        } else if (ch === 'y') {
          ui.sprite(this, x + T / 2, y + T * 0.95, 'deco_scarecrow', '🧍', 26).setOrigin(0.5, 1).setDepth(y + T * 0.95);
        } else if (ch === 'f') {
          ui.sprite(this, x + T / 2, y + T * 0.8, 'vil_fence', '🪵', 20, 1.7).setOrigin(0.5, 1).setDepth(y + T * 0.8);
        } else if (ch === '.') {
          const hc = FUP.hills.at('village', tx, ty);
          if (hc.edge === 'face' || hc.stair) continue;   // nothing pinned on a cliff face or stairs
          let roll = noise(tx, ty, 14);
          for (const key of decoKeys) {
            if (roll < d.decorations[key]) {
              const dx = x + T * (0.25 + noise(tx, ty, 15) * 0.5), dy = y + T * (0.45 + noise(tx, ty, 16) * 0.45);
              ui.sprite(this, dx, dy, key, '', 10).setOrigin(0.5, 1).setDepth(key === 'bush' ? dy : -5);
              break;
            }
            roll -= d.decorations[key];
          }
        }
      }
    }
  }

  drawBuildings() {
    const d = FUP.villageData, T = d.tileSize, ui = FUP.ui, c = ui.colors;
    this.houseLabels = [];
    for (const b of d.buildings) {
      const x = b.tx * T + (b.dx || 0), y = (b.ty + 1) * T + (b.dy || 0);
      const s = ui.sprite(this, x, y, b.sprite, '🏠', 60).setOrigin(0.5, 1).setDepth(y);
      if (b.repair) this.repairSprites[b.repair] = s;   // tinted while ruined (VillageRepairs.js)
      if (!b.label) continue;
      const t = ui.text(this, x, y - s.displayHeight - 4, b.label, 12, c.accent, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4, align: 'center' }).setOrigin(0.5, 1).setDepth(5000);
      if (b.house !== undefined) this.houseLabels.push({ b, t, s });
    }
    this.refreshHouses();
  }

  // Houses: yours say so, the others are for sale (Planksworth sells them, data/house.js).
  refreshHouses() {
    const H = FUP.house, D = FUP.houseData, c = FUP.ui.colors;
    for (const { b, t, s } of this.houseLabels) {
      const h = D.houses[b.house], mine = H.owns(b.house);
      t.setText(mine ? `${h.name.toUpperCase()}\n(YOURS)` : `${h.name.toUpperCase()}\nFOR SALE · ${FUP.village.buyPrice(h.price, 'carpenter')} 🪙`);
      t.setColor(mine ? c.accent : c.dim);
      s.setAlpha(mine ? 1 : 0.8);
    }
    if (this.spots) for (const sp of this.spots) if (sp.door !== undefined) {
      sp.kind = H.owns(sp.door) ? 'home' : 'forsale';
      sp.label = H.owns(sp.door) ? 'Go inside' : 'For sale';
    }
    if (this.farmViews) this.refreshFarm(true);
  }

  // ---------- Props (v0.67): the things on the hills and round the farm. Some you can read. ----------
  drawProps() {
    const T = FUP.villageData.tileSize, ui = FUP.ui;
    for (const p of FUP.villageData.props || []) {
      const x = p.tx * T + T / 2, y = p.ty * T + T * 0.92;
      const s = ui.sprite(this, x, y, p.sprite, '', 10).setOrigin(0.5, 1).setDepth(y);
      if (p.text) this.spots.push({ kind: 'read', x, y: p.ty * T + T / 2, sprite: s, label: '📜 Read', text: p.text });
    }
  }

  // ---------- Villagers, your door, the gate, and you ----------
  drawPeople() {
    const d = FUP.villageData, ui = FUP.ui, c = ui.colors, M = FUP.villageMap;
    this.spots = [];   // everything you can walk up to and use
    for (const [id, n] of Object.entries(d.npcs)) {
      if (!n.spot) continue;   // lives in another region (Gill: the Docks)
      const p = M.center(n.spot.tx, n.spot.ty);
      const s = FUP.anim.sprite(this, p.x, p.y, n.sprite, 'idle', n.emoji, 30).setOrigin(0.5, 0.8).setDepth(p.y + 14);
      this.tweens.add({ targets: s, scaleY: s.scaleY * 1.04, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      ui.text(this, p.x, p.y - s.displayHeight * 0.8 - 2, n.name.replace('The ', ''), 11, c.ink, { stroke: FUP.ui.colors.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
      this.spots.push({ id, kind: 'npc', x: p.x, y: p.y, sprite: s, label: 'Talk' });
    }
    // The Compost Bin next to the Cottage (v0.41)
    {
      const cs = FUP.gardenData.compost.spot, p = M.center(cs.tx, cs.ty), o = d.objects.compost;
      const s = ui.sprite(this, p.x, p.y, 'vil_barrel', o.emoji, 26).setOrigin(0.5, 0.8).setDepth(p.y + 10).setTint(0xa8c878);
      ui.text(this, p.x, p.y - s.displayHeight * 0.8 - 2, 'COMPOST', 10, c.ink, { stroke: FUP.ui.colors.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
      this.spots.push({ id: 'compost', kind: 'object', x: p.x, y: p.y, sprite: s, label: o.label });
    }
    // The sawhorse next to the Carpenter: saw Bark into planks (data/place.js)
    {
      const o = d.objects.sawhorse, p = M.center(o.spot.tx, o.spot.ty);
      const s = ui.sprite(this, p.x, p.y, 'vil_sawhorse', o.emoji, 26).setOrigin(0.5, 0.8).setDepth(p.y + 10);
      ui.text(this, p.x, p.y - s.displayHeight * 0.8 - 2, 'SAWHORSE', 10, c.ink, { stroke: FUP.ui.colors.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
      this.spots.push({ id: 'sawhorse', kind: 'saw', x: p.x, y: p.y, sprite: s, label: o.label });
    }
    // A front door for each house: yours go inside, the others are for sale
    d.doors.forEach((dr, i) => {
      const h = M.center(dr.tx, dr.ty);
      this.spots.push({ id: 'door' + i, door: i, kind: 'home', x: h.x - 20, y: h.y - 24, label: 'Go inside' });
    });
    this.refreshHouses();

    // Where you appear: back from a run = at the gate, from a house = at its door, otherwise at the cottage
    const door = d.doors[FUP.house.state.door || 0], P = M.find('P')[0];
    const start = this.arrive.at ? M.center(this.arrive.at.tx, this.arrive.at.ty)   // walked in from another region (the Docks)
      : (this.arrive.from === 'run' || this.arrive.from === 'retreat' || this.arrive.from === 'chute') ? FUP.world.gapMiddle('village', 'N')   // just inside the gate
      : this.arrive.from === 'home' && door && FUP.house.state.door ? M.center(door.tx, door.ty) : M.center(P.tx, P.ty);
    this.player = ui.sprite(this, start.x, start.y, FUP.looks.key('hero_map'), '🧍', 30).setOrigin(0.5, 0.72).setDepth(start.y + 16);
    this.hat = FUP.cosmetics.attachHat(this, this.player, 'map');   // your hat, if you wear one (G2)
    // Clicking a villager or the door walks you there and opens it
    for (const s of this.spots) {
      if (!s.sprite) continue;
      s.sprite.setInteractive({ useHandCursor: true });
      s.sprite.on('pointerdown', () => { if (!this.panel) this.walkTo = s; });
    }
    // Big round action button (bottom right): tap it instead of pressing E
    const W = this.scale.width, H = this.scale.height;
    this.actBtn = this.add.circle(W - 70, H - 120, 42, c.btnHot, 0.95).setStrokeStyle(3, c.btnHotEdge).setScrollFactor(0).setDepth(16000).setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.actBtn.on('pointerdown', () => { FUP.audio.sfx('click'); this.time.delayedCall(1, () => this.interact()); });
    this.actText = ui.text(this, W - 70, H - 120, '', 15, c.ink, { fontStyle: '700', align: 'center', wordWrap: { width: 76 } }).setOrigin(0.5).setScrollFactor(0).setDepth(16001).setVisible(false);
    this.prompt = ui.text(this, 0, 0, '', 13, c.accent, { fontStyle: '700', backgroundColor: FUP.look.hex('k0'), padding: { x: 6, y: 3 } }).setOrigin(0.5, 1).setDepth(6000).setVisible(false);
  }

  // ---------- Screen overlay ----------
  drawHud() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height;
    const fix = o => o.setScrollFactor(0).setDepth(10000);
    // Top bar: only shows when the narrator or a villager has something to say (v0.41, Jesus). Coins stay visible.
    const bar = fix(FUP.ui.panel(this, 16, 12, W - 32, 46, 'hud'));
    this.narratorText = fix(ui.text(this, 32, 35, '', 16, c.ink, { fontStyle: 'italic', wordWrap: { width: W - 230 } }).setOrigin(0, 0.5));
    this.showBar = FUP.ui.autoHide(this, [bar, this.narratorText], 5000);
    this.coinText = fix(ui.text(this, W - 62, 35, '', 18, c.accent, { fontStyle: '700', stroke: c.stroke, strokeThickness: 4 }).setOrigin(1, 0.5));
    ui.muteButton(this, W - 36, 35, true);
    // Normal mode: your grave's timer (src/systems/grave.js)
    this.graveText = fix(ui.text(this, W / 2, 72, '', 14, c.bad, { fontStyle: '700', backgroundColor: FUP.look.hex('k0') + 'cc', padding: { x: 8, y: 4 } }).setOrigin(0.5, 0));
    this.farmText = fix(ui.text(this, W - 20, 72, '', 14, c.ink, { fontStyle: '700', backgroundColor: FUP.look.hex('k0') + 'cc', padding: { x: 8, y: 4 } }).setOrigin(1, 0));
    this.dayText = fix(ui.text(this, W - 20, 100, '', 13, c.dim, { backgroundColor: FUP.look.hex('k0') + 'cc', padding: { x: 8, y: 3 } }).setOrigin(1, 0));   // Day 3 ☀️ (data/clock.js)
    // 🔨 Build: only shows while you stand on land you can build on (src/buildUi.js)
    this.buildBtn = ui.button(this, 128, 66, 96, 32, '🔨 Build', () => this.openBuild(), { size: 15 });
    this.buildBtn.rect.setScrollFactor(0).setDepth(10001).setVisible(false); this.buildBtn.txt.setScrollFactor(0).setDepth(10002).setVisible(false);
    FUP.buildUi.drawPlaced(this, 'village');
    FUP.progressUi.guideButton(this, 16, 66, 104, 32, { fixed: true, canOpen: () => !this.panel && !this.leaving, onOpen: g => this.openSkills(g) });

    fix(FUP.ui.panel(this, 16, H - 58, W - 32, 46, 'hud'));
    fix(ui.text(this, 30, H - 35, 'HP', 14, c.dim, { fontStyle: '700' }).setOrigin(0, 0.5));
    this.hpBar = ui.bar(this, 58, H - 43, 120, 16, c.hp);
    fix(this.hpBar.bg); fix(this.hpBar.fill);
    this.hpText = fix(ui.text(this, 186, H - 35, '', 14, c.ink).setOrigin(0, 0.5));
    // Backpack button (v0.41): opens everything you carry. I key too.
    const pb = ui.button(this, 256, H - 50, 140, 30, '', () => this.openPack(), { size: 13 });
    pb.rect.setScrollFactor(0).setDepth(10001); pb.txt.setScrollFactor(0).setDepth(10002);
    // World map button (v0.53): M key too
    const mb = ui.button(this, 400, H - 50, 44, 30, '🗺️', () => this.openMap(), { size: 15 });
    mb.rect.setScrollFactor(0).setDepth(10001); mb.txt.setScrollFactor(0).setDepth(10002);
    this.bagText = pb.txt;
    this.questText = fix(ui.text(this, 450, H - 35, '', 14, c.ink).setOrigin(0, 0.5));
    fix(ui.text(this, W - 30, H - 35, FUP.ui.isTouch(this) ? 'Drag to walk · tap the button to talk' : 'Walk: WASD / drag · Talk: E or the button', 12, c.dim).setOrigin(1, 0.5));
    this.refreshHud();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshHud() });   // crops ripen while you walk
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.refreshGrave() });
  }

  refreshHud() {
    const run = FUP.run, c = FUP.ui.colors, Q = FUP.quests;
    const hp = run.currentHp(), max = run.maxHp();
    this.hpBar.set(hp / max);
    this.hpBar.color(hp < max * 0.3 ? c.hpLow : c.hp);
    this.hpText.setText(`${hp}/${max}`);
    this.bagText.setText(`🎒 Bag ${run.slotsUsed()}/${run.packMax()}`);
    if (this.farmText) this.refreshFarmHud();
    const ready = Q.activeIds().filter(id => Q.complete(id)).length;
    this.questText.setText(`📜 Quests ${Q.activeIds().length}/${FUP.questData.maxActive}` + (ready ? `  ·  ${ready} ready to hand in!` : ''));
    this.questText.setColor(ready ? c.good : c.ink);
    this.coinText.setText(`🪙 ${run.coins}`);
    this.dayText.setText(FUP.clock.label());
    FUP.stallUi.marks(this, 'village');   // 🪙 / 💤 over your stall
    const ts = JSON.stringify(FUP.fishing.state.traps.map(t => [t.region, t.tx, t.ty, t.fish.length]));
    if (ts !== this.trapSig && !this.panel) { this.trapSig = ts; FUP.trapUi.draw(this, 'village', FUP.villageMap); }   // a trap caught something
    if (FUP.clock.rolled) { FUP.clock.rolled = 0; if (!this.panel) this.say('newDay'); }   // a new day started while you walked
    if (FUP.fishing.wormsNews && !this.panel) { this.say('compostWorms', { item: FUP.fishing.wormsNews }); FUP.fishing.wormsNews = 0; }   // the Compost Bin made worms
  }

  // The grave's timer, and the news if it just crumbled
  refreshGrave() {
    if (FUP.grave.crumbled) { FUP.grave.crumbled = false; this.say('graveCrumbled'); FUP.save.write(); }
    this.graveText.setText(FUP.grave.hudText()).setVisible(FUP.grave.active());
  }

  // ---------- Every frame ----------
  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    FUP.ambience.update(this, dt);   // critters, wind and light keep going while a window is open
    if (this.leaving || this.panel || this.busy) return;
    this.movePlayer(dt);
    this.updatePrompt();
    this.checkEdges();
  }

  movePlayer(dt) {
    const k = this.keys, d = FUP.villageData;
    let dx = 0, dy = 0;
    if (k.A.isDown || k.LEFT.isDown) dx -= 1;
    if (k.D.isDown || k.RIGHT.isDown) dx += 1;
    if (k.W.isDown || k.UP.isDown) dy -= 1;
    if (k.S.isDown || k.DOWN.isDown) dy += 1;
    if (!dx && !dy && (this.stick.dx || this.stick.dy)) { dx = this.stick.dx; dy = this.stick.dy; }   // on-screen joystick
    if (dx || dy) this.walkTo = null;   // keys / joystick cancel click-to-walk

    // Walking to something you clicked: follow a path around buildings, open it when you get there
    if (!dx && !dy && this.walkTo) {
      const t = this.walkTo;
      if (Math.hypot(t.x - this.player.x, t.y - this.player.y) < d.interactDistance) { this.walkTo = null; this.path = null; this.use(t); return; }
      if (!this.path || this.pathFor !== t) { this.path = this.findPath(t); this.pathFor = t; }
      if (!this.path) { this.walkTo = null; return; }
      while (this.path.length && Math.hypot(this.path[0].x - this.player.x, this.path[0].y - this.player.y) < 6) this.path.shift();
      const next = this.path[0] || t;
      dx = next.x - this.player.x; dy = next.y - this.player.y;
    }
    if (!dx && !dy) return;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) { this.stepTimer = 0.28; FUP.audio.sfx('step'); }

    const len = Math.hypot(dx, dy), step = d.playerSpeed * dt;
    const bx = this.player.x, by = this.player.y;
    this.slide((dx / len) * step, (dy / len) * step, 12);
    if (this.walkTo && bx === this.player.x && by === this.player.y) this.walkTo = null; // stuck: give up
    if (dx) this.player.setFlipX(dx < 0);
    this.player.setDepth(this.player.y + 16);
  }

  // Shortest walk (square by square) to any square close enough to use `t`. Returns square centres, or null.
  findPath(t) {
    const M = FUP.villageMap, T = FUP.villageData.tileSize, W = M.width(), reach = FUP.villageData.interactDistance - 8;
    const start = { tx: Math.floor(this.player.x / T), ty: Math.floor(this.player.y / T) };
    const seen = new Map([[start.tx + ',' + start.ty, null]]), queue = [start];
    while (queue.length) {
      const cur = queue.shift(), c = M.center(cur.tx, cur.ty);
      if (Math.hypot(c.x - t.x, c.y - t.y) < reach) {
        const path = [];
        for (let k = cur.tx + ',' + cur.ty; k; k = seen.get(k)) { const [x, y] = k.split(',').map(Number); path.unshift(M.center(x, y)); }
        return path.slice(1);
      }
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cur.tx + ox, ny = cur.ty + oy, key = nx + ',' + ny;
        if (seen.has(key) || nx < 0 || nx >= W || M.blockedTile(nx, ny) || FUP.place.blocked('village', nx, ny)) continue;
        seen.set(key, cur.tx + ',' + cur.ty);
        queue.push({ tx: nx, ty: ny });
      }
    }
    return null;
  }

  slide(mx, my, half) {
    const M = FUP.villageMap, s = this.player;
    // Trees, water, buildings... and solid things you've placed (benches)
    const T = FUP.villageData.tileSize, hit = (x, y) => M.blockedBox(x, y, half) || FUP.place.blockedBox('village', x, y, half, T);
    if (!hit(s.x + mx, s.y)) s.x += mx;
    if (!hit(s.x, s.y + my)) s.y += my;
  }

  // The thing you're standing next to (or null).
  nearest() {
    let best = null, bestD = FUP.villageData.interactDistance;
    for (const s of this.spots) {
      const dist = Math.hypot(s.x - this.player.x, s.y - this.player.y);
      if (dist < bestD && (!s.reach || dist < s.reach)) { best = s; bestD = dist; }   // reach: trap squares only count when you're on them
    }
    const f = this.nearestFarm();   // a patch under your feet wins over everything
    if (f && (f.dist < bestD || f.dist === 0 || !best)) return f.spot;
    if (best) return best;
    // Your food stall, if you're standing right next to it
    for (const p of FUP.stall.placed()) {
      const T = FUP.villageData.tileSize, b = FUP.buildUi.box(p, T);
      const dx = Math.max(b.x - this.player.x, 0, this.player.x - (b.x + b.w)), dy = Math.max(b.y - this.player.y, 0, this.player.y - (b.y + b.h));
      if (Math.hypot(dx, dy) < 34) return { kind: 'stall', uid: p.uid, label: '🏪 Stall', x: b.x + b.w / 2, y: b.y + 10 };
    }
    // Nothing else in reach: fishing water next to you?
    const T = FUP.villageData.tileSize, w = FUP.fishing.spotNear(Math.floor(this.player.x / T), Math.floor(this.player.y / T));
    if (!w) return null;
    const at = FUP.villageMap.center(w.tx, w.ty);
    return { kind: 'fish', label: '🎣 Fish', spot: w.spot, x: at.x, y: at.y };
  }

  // The zone you're standing in (data/place.js), or null
  buildZone() {
    const T = FUP.villageData.tileSize, z = FUP.place.zoneAt('village', Math.floor(this.player.x / T), Math.floor(this.player.y / T));
    return z ? z.zone : null;
  }
  // Build mode counts as a panel: walking stops, ESC closes it
  openBuild() {
    const zone = this.buildZone();
    if (!zone || this.panel || this.leaving || this.busy) return;
    this.walkTo = null;
    this.prompt.setVisible(false); this.actBtn.setVisible(false); this.actText.setVisible(false);
    this.buildBtn.rect.setVisible(false); this.buildBtn.txt.setVisible(false);
    const g = FUP.buildUi.open(this, zone, () => {
      if (this.panel === g) { this.panel = null; this.panelId = null; }
      this.refreshHud(); FUP.save.write();
    });
    this.panel = g; this.panelId = 'build';
  }

  updatePrompt() {
    const canBuild = !!this.buildZone();
    this.buildBtn.rect.setVisible(canBuild); this.buildBtn.txt.setVisible(canBuild);
    const s = this.nearest();
    this.prompt.setVisible(!!s);
    this.actBtn.setVisible(!!s); this.actText.setVisible(!!s);
    if (s) this.actText.setText(s.label);
    if (s) this.prompt.setText(FUP.ui.isTouch(this) ? s.label : `E: ${s.label}`).setPosition(s.x, s.y - (s.sprite ? s.sprite.displayHeight * 0.8 + 16 : 30));
  }

  // The backpack counts as a panel too: walking stops while it's open (v0.41).
  openPack() {
    if (this.panel || this.leaving || this.busy) return;
    const bp = FUP.backpack.open(this, { home: false, onChange: () => this.refreshHud(), onClose: () => { if (this.panel === bp) { this.panel = null; this.panelId = null; } this.refreshHud(); FUP.save.write(); } });
    this.panel = bp; this.panelId = 'pack';
  }

  // The Skill Guide counts as a panel: walking stops while it's open, ESC closes it.
  openSkills(g) {
    if (!g) { if (this.panel || this.leaving) return; g = FUP.progressUi.openGuide(this, 'cooking'); }
    this.panel = g; this.panelId = 'skills';
    const close = g.destroy;
    g.destroy = () => { close(); if (this.panel === g) { this.panel = null; this.panelId = null; } };
  }

  interact() {
    if (this.panel || this.leaving || this.busy) return;
    const s = this.nearest();
    if (s) this.use(s);
  }

  use(s) {
    this.prompt.setVisible(false); this.actBtn.setVisible(false); this.actText.setVisible(false);
    if (s.kind === 'home') { this.goHome(s.door); return; }
    if (s.kind === 'forsale') { this.openPanel('carpenter'); return; }
    if (s.kind === 'patch' || s.kind === 'water') { this.farmUse(s); return; }
    if (s.kind === 'fish') { this.goFish(s); return; }
    if (s.kind === 'saw') { this.sawPlank(s); return; }
    if (s.kind === 'stall') { this.openStall(s.uid); return; }
    if (['repairBoard', 'repairSite', 'well', 'sign', 'market', 'miller'].includes(s.kind)) { this.repairUse(s); return; }
    if (s.kind === 'read') { this.sayLine(s.text); FUP.audio.sfx('click'); return; }
    if (s.kind === 'trap') { FUP.trapUi.use(this, 'village', s, FUP.villageMap); return; }
    this.openPanel(s.id);   // villagers, and objects like the Compost Bin
  }

  // Saw Bark into a plank at the sawhorse (a job like farming: you stand still while it happens).
  // Keeps going while you hold the button down.
  sawPlank(s) {
    const can = FUP.place.canSaw();
    if (can !== 'ok') { this.say(can === 'full' ? 'sawFull' : 'sawNoBark'); FUP.audio.sfx('error'); return; }
    this.farmWork(FUP.placeData.sawSeconds, 'hoe', s, () => {
      if (!FUP.place.saw(this.xpAt(s.x, s.y))) return;
      FUP.audio.sfx('chop');
      if (Math.random() < 0.4) this.say('sawPlank');
      const held = this.input.activePointer.isDown || this.keys.E && this.keys.E.isDown;
      if (held && FUP.place.canSaw() === 'ok') this.time.delayedCall(40, () => { if (!this.panel && !this.leaving && !this.busy) this.sawPlank(s); });
    });
  }

  // Your food stall's window (src/stallUi.js). Counts as a panel.
  openStall(uid) {
    const g = FUP.stallUi.open(this, uid, () => {
      if (this.panel === g) { this.panel = null; this.panelId = null; }
      this.refreshHud(); FUP.save.write();
    });
    this.panel = g; this.panelId = 'stall';
  }

  // Cast a line into the water next to you (src/fishingUi.js). Counts as a panel: walking stops.
  goFish(s) {
    if (!FUP.fishing.canCast(s.spot)) { this.say('fishFull'); FUP.audio.sfx('error'); return; }
    if (!FUP.facts.has('flag:rodFound')) { FUP.facts.set('flag:rodFound', 1); this.say('rodFound'); }
    const g = FUP.fishingUi.open(this, s.spot, { x: s.x, y: s.y }, () => {
      if (this.panel === g) { this.panel = null; this.panelId = null; }
      this.refreshHud(); FUP.save.write();
    });
    this.panel = g; this.panelId = 'fish';
  }

  goHome(door = 0) {
    if (this.leaving) return;
    this.leaving = true;
    FUP.house.state.door = door;   // come back out of the same door
    FUP.audio.sfx('select');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => this.scene.start('House', {}));   // inside your house (v0.68, HouseScene)
  }

  // ---------- The edges of the village: the gate north, the south road, the east bridge ----------
  // Step onto a gap in the border: walk into the next region (data/world.js links).
  checkEdges() {
    const T = FUP.villageData.tileSize, W = FUP.world, tx = Math.floor(this.player.x / T), ty = Math.floor(this.player.y / T);
    const edge = W.edgeAt('village', tx, ty);
    if (!edge || !W.linkAt(edge, 'village')) return;
    if (!W.gap('village', edge).some(g => g.tx === tx && g.ty === ty)) return;
    const r = W.cross(edge);
    if (!r) return;
    if (r.locked) {
      // Can't go that way yet: say why, step back inside
      this.sayLine(r.locked.join(' · '));
      FUP.audio.sfx('error');
      const step = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[edge];
      this.player.x += step[0] * T; this.player.y += step[1] * T;
      this.walkTo = null; this.path = null;
      return;
    }
    this.leave(r);
  }

  // The 🗺️ world map counts as a panel: walking stops, ESC closes it.
  openMap() {
    if (this.panel || this.leaving || this.busy) return;
    this.walkTo = null;
    const m = FUP.worldMapUi.open(this, () => { if (this.panel === m) { this.panel = null; this.panelId = null; } });
    this.panel = m; this.panelId = 'map';
  }

  // Out of the village into another region (the trip already started in FUP.world.cross)
  leave(r) {
    if (this.leaving) return;
    this.leaving = true;
    if (this.panel) { this.panel.destroy(true); this.panel = null; }
    FUP.save.write(!FUP.world.safe(r.to));   // heading into danger: closing the page now loses this trip (see save.js)
    FUP.audio.sfx('select');
    this.cameras.main.fadeOut(FUP.worldData.fadeMs, 0, 0, 0);
    this.time.delayedCall(FUP.worldData.fadeMs + 20, () => this.scene.start(r.scene, {}));
  }

  // (Old name, kept for the gate window in VillagePanels.js): out the gate into the Forest Edge.
  enterForest() {
    if (this.leaving) return;
    const r = FUP.world.cross('N');   // out the gate: a trip into the Forest Edge starts (src/systems/world.js)
    if (r && !r.locked) this.leave(r);
  }

  // Step back from the gate after saying "not yet".
  stepBack() {
    this.player.y = FUP.villageData.tileSize * 2.3;
    this.time.delayedCall(300, () => { this.gateAsked = false; });
  }

  // ---------- Narrator ----------
  say(category, vars = {}) {
    const lines = category.split('.').reduce((o, k) => o && o[k], FUP.narrator);   // 'repairDone.well' = a line from narrator.repairDone.well
    if (!lines || !lines.length) return;
    this.sayLine(Phaser.Utils.Array.GetRandom(lines).replace(/\{name\}/g, vars.name || FUP.run.hero.name).replace(/\{item\}/g, vars.item || '').replace(/\{day\}/g, FUP.clock.day()));
  }
  sayLine(line) {
    this.narratorText.setText(line);
    if (this.showBar) this.showBar();
  }
}
