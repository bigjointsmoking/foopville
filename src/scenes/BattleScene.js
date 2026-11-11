// ============================================================
// BATTLE SCREEN — Active Time Battle, one or more enemies.
// Time never stops: every gauge fills every frame, even while you pick.
// Tap an enemy to target it. The boss (Mushroom Landlord) has phases,
// summons minions, poisons you, takes rent and casts Fever Dream.
// Start it with: this.scene.start('Battle', { enemies: ['landlord'] })
//            or: this.scene.start('Battle', { enemy: 'squirrel' })
// ============================================================

// Where enemies stand. (x, y) is the centre of the enemy.
const BATTLE_SLOTS = {
  normal: [[650, 285], [510, 335], [810, 335], [540, 205], [800, 205]],
  boss: [660, 290],
  minions: [[505, 340], [830, 345], [520, 200], [835, 205]],
  fever: [[640, 290], [460, 275], [790, 270]], // the real Landlord and 2 fakes get shuffled into these
};

class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  init(data) {
    this.weaponKey = FUP.run.weapon;
    this.enemyKeys = data.enemies || [data.enemy || 'squirrel'];
    this.startEnraged = !!data.enraged;   // the Moss Goblin, after you refused his toll
  }

  create() {
    const C = FUP.combat;
    this.weapon = FUP.weapons[this.weaponKey];
    this.player = C.makePlayer(FUP.skills.level('melee'), this.weapon);
    this.player.hp = FUP.run.currentHp(); // you bring your wounds with you
    // The Limit bar carries between fights too (Jesus, 2026-11-10). Battle Hunger's 10 is the minimum.
    this.player.limit = Math.min(FUP.balance.limitMax, Math.max(this.player.limit, FUP.run.limit || 0));
    this.player.resists = [];             // from eaten dishes: [{ element, reduction, turns }]
    this.player.poison = 0;               // poison stacks
    this.satchel = FUP.run.satchel;       // the dishes you cooked. Eaten/thrown/stolen ones are gone.
    this.player.focus = 0;                // Focus: skills cost it (v0.41, BattleSkills.js). Starts every fight at 0.
    this.frozenFor = 0;                   // "hit stop": the fight freezes for a moment on big hits
    this.deductMult = 1;                  // the Mold Accountant's audit halves this action
    this.lastAction = null;               // 'attack' | 'skill' | 'throw' | 'eat' | 'rizz' | 'defend' ...
    // Phaser reuses this screen for every fight, so everything per-fight starts fresh here.
    // (v0.41 bug: lastEnemyAct carried over, so enemies waited until the new fight caught up with the old one's time.)
    this.lastEnemyAct = -99;              // when an enemy last acted (enemies take turns, balance.enemyTurnGap)
    this.usedUnbreakable = false;         // Unbreakable perk: once per fight
    this.bannersUp = 0;                   // big-moment banners on screen
    this.afterTarget = null;              // the action waiting for you to pick a target

    this.enemies = [];
    this.killed = [];
    this.charmed = [];
    this.meleeXp = 0;       // XP earned so far this fight (given the moment each enemy goes down)
    this.rizzXp = 0;
    this.sweetGifts = [];   // what Sweet Talk got you this fight (for the results screen)
    this.startLevels = { melee: FUP.skills.level('melee'), rizz: FUP.skills.level('rizz') };
    FUP.progressUi.attach(this);
    this.questNews = [];    // quests finished during this fight
    this.targetIdx = 0;
    this.fever = 0;         // player turns left in a Fever Dream
    this.over = false;
    this.elapsed = 0;
    this.readyFor = 0;
    this.nagged = false;
    this.saidLowHp = false;
    this.saidPoison = false;
    this.buttons = [];
    this.menuMode = 'main';
    this.startCount = this.enemyKeys.length;   // how many enemies the fight began with (the Mosquito Intern's Overtime)
    this.isBossFight = this.enemyKeys.some(k => FUP.enemies[k].boss);
    this.isMiniBoss = this.enemyKeys.some(k => FUP.enemies[k].miniBoss);   // the Pigeon Godfather
    const rb = FUP.run.battle || {};
    this.inRaid = !!(FUP.run.forest && FUP.run.forest.raid);   // the Landlord's Basement (RaidScene.js)
    this.noFleeTurns = rb.noFleeTurns || 0;                     // a raid ambush: no running on your first turn

    this.drawBackground();
    this.drawPlayer();
    this.drawHud();
    this.enemyKeys.forEach(k => this.spawnEnemy(k));
    // Refused the toll (or haggled badly): he starts the fight Enraged (blueprint 18.2)
    if (this.startEnraged) for (const e of this.enemies) {
      FUP.combat.addBuff(e, 'atk', 1 + FUP.balance.enrageAtkBonus, FUP.balance.enrageTurns, 'Enraged');
    }
    this.setMenu('main');
    const first = this.enemyKeys[0];
    this.say(this.isBossFight ? 'bossStart' : this.isMiniBoss ? 'godfatherStart' : rb.tutorial ? 'dummyStart' : first === 'pigeon' ? 'pigeonStart' : rb.ambush ? 'raidAmbushStart' : first === 'sporeBouncer' ? 'bouncerStart' : 'start');
    // Spored in a raid hazard room: you start this fight with that many Poison stacks
    const R = this.inRaid && FUP.run.forest.raid;
    if (R && R.spored) {
      this.player.poison = Math.min(FUP.balance.poisonMaxStacks, R.spored);
      R.spored = 0;
      this.time.delayedCall(900, () => { if (!this.over) this.say('sporedStart', { item: this.player.poison }); });
    }
    FUP.audio.music(this.isBossFight || this.isMiniBoss ? 'boss' : 'battle');
    if (this.player.hp < this.player.maxHp * 0.3) { this.saidLowHp = true; this.say('startWounded'); }
  }

  // ---------- Runs every frame ----------
  update(time, delta) {
    if (this.over) return;
    const dt = Math.min(delta, 100) / 1000;
    const C = FUP.combat, p = this.player;
    this.elapsed += dt;
    if (FUP.run.forest) FUP.run.forest.time += dt; // the run timer keeps going in fights
    if (this.feverFx) this.feverFx.hue(this.elapsed * 140);
    if (this.frozenFor > 0) { this.frozenFor -= dt; this.refreshHud(); return; }   // big hit: a moment of stillness

    if (p.gauge < 100) {
      p.gauge = Math.min(100, p.gauge + C.turnFill(p) * dt);
      if (p.gauge >= 100) this.onPlayerReady();
    } else {
      this.readyFor += dt;
      if (!this.nagged && this.readyFor > FUP.balance.hesitateSeconds) { this.nagged = true; this.say('hesitate'); }
    }

    // Every real enemy's gauge keeps filling no matter what you're doing.
    // Enemies take turns: never two within balance.enemyTurnGap seconds of each other (v0.41)
    for (const e of this.enemies.slice()) {
      if (this.over) break;
      if (e.gone || e.fake) continue;
      e.gauge = Math.min(100, e.gauge + C.turnFill(e) * dt);
      if (e.gauge >= 100 && this.elapsed - (this.lastEnemyAct || -99) >= FUP.balance.enemyTurnGap) { this.lastEnemyAct = this.elapsed; this.enemyAct(e); }
    }
    if (!this.over) this.refreshHud();
  }

  // ---------- Who's still standing ----------
  live() { return this.enemies.filter(e => !e.gone); }
  liveReal() { return this.enemies.filter(e => !e.gone && !e.fake); }
  boss() { return this.enemies.find(e => e.boss && !e.fake && !e.gone); }
  target() {
    let t = this.enemies[this.targetIdx];
    if (!t || t.gone) {
      const next = this.live()[0];
      this.targetIdx = next ? this.enemies.indexOf(next) : 0;
      t = next;
    }
    return t;
  }
  setTarget(e) {
    if (e.gone || this.over) return;
    this.targetIdx = this.enemies.indexOf(e);
    if (this.menuMode === 'throw' || this.menuMode === 'rizz') this.setMenu(this.menuMode); // numbers depend on the target
    this.refreshHud();
  }

  // ---------- Drawing ----------
  drawBackground() {
    if (this.inRaid) { this.drawBasement(); return; }
    const L = FUP.look, BG = L.battleBg, W = this.scale.width;
    const area = FUP.run.forest ? FUP.forest.area(FUP.run.forest.area || 'edge') : null;
    const id = this.isBossFight ? 'boss' : (area && BG[area.id] ? area.id : 'edge'), b = BG[id];
    this.add.image(0, 0, this.paintBackdrop(id, b, W)).setOrigin(0).setScale(2).setDepth(-20);

    // Clouds drifting across the sky (blocky, see-through)
    if (b.clouds) for (let i = 0; i < BG.cloudCount; i++) {
      const cy = 30 + i * 46, cw = 70 + i * 30, cl = this.add.container(Phaser.Math.Between(0, W), cy).setDepth(-19).setAlpha(BG.cloudAlpha);
      const col = L.num(BG.cloudColor);
      cl.add([this.add.rectangle(0, 0, cw, 12, col), this.add.rectangle(-cw * 0.15, -8, cw * 0.5, 10, col), this.add.rectangle(cw * 0.2, -6, cw * 0.35, 8, col)]);
      this.tweens.add({ targets: cl, x: cl.x + W * 0.5, duration: BG.cloudDriftMs * (1 + i * 0.4), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // Two rows of trees: a smaller row further back, a bigger row at the horizon
    const keys = b.trees.filter(k => this.textures.exists(k));
    const row = (y, scale, xs) => xs.forEach((x, i) => {
      if (!keys.length) return;
      const t = this.add.image(x, y, keys[i % keys.length]).setScale(scale).setOrigin(0.5, 1).setDepth(-18 + scale).setAlpha(BG.treeAlpha);
      if (i % 2) t.setFlipX(true);
    });
    row(262, 1.5, [30, 110, 200, 330, 450, 560, 680, 760, 870]);
    row(304, 2.6, [55, 160, 420, 520, 800, 885]);
    if (b.light) this.add.rectangle(0, 0, W, 420, L.num(b.light.color), b.light.alpha).setOrigin(0).setDepth(-10);
    this.add.ellipse(240, 350, 120, 20, L.num('k0'), 0.3);
  }

  // The still part of a battle backdrop, painted once in palette colours at half size:
  // sky bands, far hills, ground bands with tufts, dark grass along the front.
  paintBackdrop(id, b, W) {
    const key = 'battlebg_' + id;
    if (this.textures.exists(key)) return key;
    const L = FUP.look, w = W / 2, h = 210, rgb = k => FUP.forestGround.rgb(L.hex(k));
    const tex = this.textures.createCanvas(key, w, h), ctx = tex.getContext(), img = ctx.createImageData(w, h), d = img.data;
    const sky = b.sky.map(rgb), ground = b.ground.map(rgb), far = rgb(b.far), farTop = rgb(b.farTop), front = rgb(b.front);
    const bayer = FUP.forestGround.bayer, hash = (x, y) => FUP.forestGround.hash(x, y);
    const hill = x => 112 + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.011 + 2) * 10 + Math.sin(x * 0.09) * 2;
    const H0 = 150;   // horizon (300 on screen)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dz = bayer[(y & 3) * 4 + (x & 3)] / 16;
      let c;
      if (y < H0) {
        const hy = hill(x);
        if (y >= hy) c = y < hy + 1 ? farTop : far;                                  // far hills
        else { const t = Math.min(sky.length - 1, Math.floor((y / H0) * sky.length + dz - 0.5)); c = sky[Math.max(0, t)]; }
      } else {
        const t = (y - H0) / (h - H0);
        c = ground[Math.min(ground.length - 1, Math.max(0, Math.floor(t * ground.length * 1.4 + dz - 0.5)))];
        if (y === H0) c = ground[1];
        if (hash(x, y) > 0.985) c = ground[0];                                      // little light blades
        if (y > h - 8 + Math.sin(x * 0.7) * 2 + (hash(x, 3) > 0.6 ? -3 : 0)) c = front;   // dark grass along the front
      }
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); tex.refresh(); tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return key;
  }

  // Raid fights happen in the Landlord's Basement: brick walls, a plank floor, pipes
  drawBasement() {
    const W = this.scale.width, C = FUP.raidData.colors, office = this.isBossFight;
    this.add.rectangle(0, 0, W, 420, office ? C.office : C.wall).setOrigin(0);
    const g = this.add.graphics();
    g.lineStyle(2, office ? C.wallLine : C.wallLine);
    for (let y = 20; y < 300; y += 24) {
      g.lineBetween(0, y, W, y);
      for (let x = (y / 24) % 2 ? 0 : 30; x < W; x += 60) g.lineBetween(x, y, x, y + 24);
    }
    g.fillStyle(C.pipeDark); g.fillRect(0, 60, W, 14);
    g.fillStyle(C.pipe); g.fillRect(0, 63, W, 6);
    if (office) { g.fillStyle(C.carpet); g.fillRect(300, 110, 120, 80); g.lineStyle(4, C.carpetEdge); g.strokeRect(300, 110, 120, 80); }  // his portrait
    this.add.rectangle(0, 300, W, 120, office ? C.carpet : C.floor).setOrigin(0);
    this.add.rectangle(0, 300, W, 6, C.wallTop).setOrigin(0);
    this.add.ellipse(240, 350, 120, 20, 0x000000, 0.3);
  }

  drawPlayer() {
    this.playerSprite = FUP.ui.sprite(this, 240, 290, FUP.looks.key('hero'), '🧍', 108).setDepth(300);
    this.hat = FUP.cosmetics.attachHat(this, this.playerSprite, 'battle');   // your hat (G2)
    // Upgraded weapon (from the gear shop) shows in your hand
    const up = FUP.run.equipped && FUP.run.equipped.weapon;
    this.weaponSprite = FUP.ui.sprite(this, 292, 312, up ? FUP.gear.spriteKey(up) : this.weapon.sprite, this.weapon.emoji, 48).setDepth(301);
    this.guardIcon = this.add.text(178, 300, '🛡️', { fontSize: '40px' }).setOrigin(0.5).setVisible(false).setDepth(302);
    this.playerSprite.baseX = this.playerSprite.x;
    this.playerSprite.baseY = this.playerSprite.y;
  }

  // An enemy is a Container: picture, (hat), HP bar, turn bar, tell, name.
  // Moving the container moves all of it.
  spawnEnemy(key, opts = {}) {
    const ui = FUP.ui, c = ui.colors, data = FUP.enemies[key];
    const e = FUP.combat.makeEnemy(data);
    e.key = key;
    // Deeper Forest areas: tougher enemies, more XP and coins (area multiplier, data/forest.js)
    const rb = FUP.run.battle || {}, mult = rb.mult;
    // Raid enemies can be worth more than usual (Tenant Shrooms you meet, not the ones the boss calls)
    if (rb.raid) Object.assign(e, (FUP.raidData.raidEnemy || {})[key] || {});
    if (mult && mult !== 1 && !e.boss) {
      for (const k of ['maxHp', 'atk', 'def', 'xp']) if (e[k]) e[k] = Math.round(e[k] * mult);
      e.hp = e.maxHp;
    }
    // Coins: each Forest area has its own coin multiplier (v0.40); the raid uses its normal one. x coinRate (v0.41)
    const cm = (e.boss ? 1 : (rb.coinMult || mult || 1)) * FUP.balance.coinRate;
    if (e.coins) e.coins = Math.max(1, Math.round(e.coins * cm));
    // Enemies scale with you: +HP/ATK for every Melee level you are above the area's level (v0.41)
    const ES = FUP.balance.enemyScale, above = FUP.skills.level('melee') - (e.boss ? (e.level || 15) : (rb.areaLevel || 1));
    if (above > 0) {
      const k = 1 + Math.min(ES.max, ES.perLevel * above);
      e.maxHp = Math.round(e.maxHp * k); e.hp = e.maxHp; e.atk = e.atk * k;
    }
    e.fake = !!opts.fake;
    e.gone = false;
    e.movesDone = 0;
    // Pigeon Diplomacy (the Godfather's chase pin): pigeons start at half ATK. Not the Godfather.
    if (e.pigeon && !e.noDiplomacy && (this.player.effects || []).includes('pigeonDiplomacy')) {
      FUP.combat.addBuff(e, 'atk', FUP.gearData.effects.pigeonDiplomacy.atk, 999, 'Calm');
    }
    if (e.boss) { e.phase = 0; e.turnInPhase = 0; e.feverUsed = {}; e.noticeUsed = {}; e.notice = null; }
    if (e.fake) e.gauge = 0;
    else e.gauge = -FUP.balance.enemyStartSpread * this.liveReal().length;   // turn bars start spread out (v0.41)

    const [x, y] = opts.pos || this.freeSlot(e);
    e.slot = opts.pos ? null : [x, y];
    // The picture: Blender sprite (facing left, toward you) or the emoji fallback.
    const useArt = data.sprite && this.textures.exists(data.sprite);
    const animated = useArt && FUP.anim.has(this, data.sprite, 'idle');   // Blender clip frames (src/anim.js)
    const pic = useArt
      ? (animated ? this.add.sprite(0, 0, data.sprite) : this.add.image(0, 0, data.sprite)).setScale(FUP.ui.pixelScale * (data.artScale || 1)).setFlipX(true)   // artScale: a small picture drawn bigger (the training dummy)
      : this.add.text(0, 0, data.emoji, { fontSize: (data.size || 104) + 'px' }).setOrigin(0.5);
    const size = useArt ? pic.displayHeight : (data.size || 104);
    const top = -size / 2 - (!useArt && data.hat ? size * 0.4 : 0);
    const barW = Math.max(80, Math.min(150, size));

    const box = this.add.container(x, y).setDepth(y);
    box.add(this.add.ellipse(0, size / 2 - 4, size * 0.7, size * 0.14, 0x000000, 0.3)); // shadow
    box.add(pic);
    if (!useArt && data.hat) box.add(this.add.text(0, -size * 0.46, data.hat, { fontSize: Math.round(size * 0.45) + 'px' }).setOrigin(0.5));
    e.hpBar = ui.bar(this, -barW / 2, top - 20, barW, 9, c.enemyHp);
    e.atbBar = ui.bar(this, -barW / 2, top - 9, barW, 6, c.atb);
    e.tellText = ui.text(this, 0, top - 40, '', 15, c.accent, { backgroundColor: FUP.look.hex('k0'), padding: { x: 6, y: 3 } }).setOrigin(0.5);
    e.nameText = ui.text(this, 0, size / 2 + 4, '', 14, c.dim, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4 }).setOrigin(0.5, 0);
    box.add([e.hpBar.bg, e.hpBar.fill, e.atbBar.bg, e.atbBar.fill, e.tellText, e.nameText]);

    // Tap to target
    box.setSize(size, size).setInteractive({ useHandCursor: true });
    box.on('pointerdown', () => this.setTarget(e));

    if (animated) FUP.anim.loop(pic, data.sprite, 'idle');   // breathing clip
    else this.tweens.add({ targets: pic, y: -6, duration: 600 + Math.random() * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    e.pic = pic;
    box.baseX = x; box.baseY = y;
    e.view = box;

    // Pop in
    box.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut' });

    this.enemies.push(e);
    if (!e.fake) this.planMove(e);
    return e;
  }

  freeSlot(e) {
    if (e.boss) return BATTLE_SLOTS.boss;
    const list = this.isBossFight ? BATTLE_SLOTS.minions : BATTLE_SLOTS.normal;
    const taken = this.live().map(o => o.slot && o.slot.join(','));
    return list.find(s => !taken.includes(s.join(','))) || list[list.length - 1];
  }

  moveEnemy(e, [x, y]) {
    e.view.setPosition(x, y).setDepth(y);
    e.view.baseX = x; e.view.baseY = y;
    e.slot = null;
  }

  drawHud() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width;

    // Narrator box: hidden until the narrator has something worth saying (Jesus, v0.41). No timer.
    const bar = FUP.ui.panel(this, 16, 12, W - 32, 58, 'panel').setDepth(400);
    this.narratorText = ui.text(this, 34, 41, '', 17, c.ink, { fontStyle: 'italic', wordWrap: { width: W - 140 } }).setOrigin(0, 0.5).setDepth(401);
    this.timerText = ui.text(this, W - 62, 41, '', 16, c.dim).setOrigin(1, 0.5).setDepth(401).setVisible(false);
    this.showBar = FUP.ui.autoHide(this, [bar, this.narratorText]);
    ui.muteButton(this, W - 36, 41);

    // Boss phase banner
    this.phaseText = ui.text(this, 660, 86, '', 15, FUP.look.hex('p2'), { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4 }).setOrigin(0.5).setDepth(401);
    // The Landlord's Final Notice countdown (BattleSkills.js), top left so it doesn't hide his tells
    this.noticeLabel = ui.text(this, 24, 84, '', 15, c.crit, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4, wordWrap: { width: 330 } }).setDepth(401);

    // Bottom panel
    FUP.ui.panel(this, 0, 420, W, 180, 'panel').setDepth(400);
    const d = o => o.setDepth(401);
    d(ui.text(this, 24, 434, 'YOU · ' + this.weapon.name, 18, c.accent, { fontStyle: '700' }));
    d(ui.text(this, 24, 470, 'HP', 14, c.dim).setOrigin(0, 0.5));
    this.hpBar = ui.bar(this, 70, 461, 240, 18, c.hp);
    this.hpText = d(ui.text(this, 318, 470, '', 15, c.ink).setOrigin(0, 0.5));
    d(ui.text(this, 24, 500, 'TURN', 14, c.dim).setOrigin(0, 0.5));
    this.atbBar = ui.bar(this, 70, 494, 240, 12, c.atb);
    this.readyText = d(ui.text(this, 318, 500, '', 15, c.crit, { fontStyle: '700' }).setOrigin(0, 0.5));
    d(ui.text(this, 24, 526, 'LIMIT', 14, c.dim).setOrigin(0, 0.5));
    this.limitBar = ui.bar(this, 70, 520, 240, 12, c.limit);
    this.limitText = d(ui.text(this, 318, 526, '', 15, c.accent).setOrigin(0, 0.5));
    d(ui.text(this, 24, 552, 'FOCUS', 14, c.dim).setOrigin(0, 0.5));
    this.focusBar = ui.bar(this, 70, 546, 240, 12, FUP.look.num('b4'));
    this.focusText = d(ui.text(this, 318, 552, '', 15, c.info).setOrigin(0, 0.5));
    this.buffText = d(ui.text(this, 24, 568, '', 12, c.info, { wordWrap: { width: 375 }, lineSpacing: 2 }));
    [this.hpBar, this.atbBar, this.limitBar, this.focusBar].forEach(b => { b.bg.setDepth(401); b.fill.setDepth(402); });
  }

  refreshHud() {
    const p = this.player, c = FUP.ui.colors, bal = FUP.balance;
    const ready = this.isReady();

    this.hpBar.set(p.hp / p.maxHp);
    this.hpBar.color(p.hp < p.maxHp * 0.3 ? c.hpLow : c.hp);
    this.hpText.setText(`${p.hp} / ${p.maxHp}`);
    this.atbBar.set(p.gauge / 100);
    this.atbBar.color(ready ? c.atbFull : c.atb);
    this.readyText.setText(ready ? (Math.floor(this.elapsed * 3) % 2 ? 'YOUR TURN' : 'YOUR TURN ◀') : '');
    this.limitBar.set(p.limit / bal.limitMax);
    this.limitText.setText(p.limit >= bal.limitMax ? 'READY!' : Math.floor(p.limit) + '%');
    this.focusBar.set(p.focus / bal.focus.max);
    this.focusText.setText(String(Math.floor(p.focus)));
    const status = p.buffs.map(b => `${b.label} (${b.turns})`);
    for (const r of p.resists) status.push(`${this.cap(r.element)} resist -${Math.round(r.reduction * 100)}% (${r.turns})`);
    if (p.poison) status.unshift(`☠️ Poison x${p.poison}`);
    if (this.fever) status.unshift(`🌀 Fever Dream (${this.fever})`);
    if (p.riposte) status.unshift('🤺 Riposte ready');
    const audits = [...new Set(this.liveReal().filter(o => o.audit).map(o => this.catName(o.audit)))];
    if (audits.length) status.unshift(`📝 Audited: ${audits.join(', ')} (half effect)`);
    this.buffText.setText(status.join('  ·  '));
    this.guardIcon.setVisible(p.defending);

    // Fakes copy the real Landlord so you can't tell them apart.
    const boss = this.boss();
    const t = this.target();
    for (const e of this.enemies) {
      if (e.gone) continue;
      const src = e.fake && boss ? boss : e;
      e.hpBar.set(src.hp / src.maxHp);
      e.atbBar.set(Math.min(1, src.gauge / 100));
      e.tellText.setText(src.nextMove ? `${src.nextMove.tell} ${src.nextMove.tellText}` : '');
      const buffs = src.buffs.map(b => b.label).join(', ');
      const flags = this.enemyFlags(src);
      const label = e.name + (buffs ? ` (${buffs})` : '') + (flags ? ' ' + flags : '');
      e.nameText.setText(e === t ? `▶ ${label} ◀` : label);
      e.nameText.setColor(e === t ? c.accent : c.dim);
    }
    this.phaseText.setText(boss ? `PHASE ${boss.phase + 1} · ${boss.bossRules.phases[boss.phase].name.toUpperCase()}` : '');
    this.noticeLabel.setText(this.noticeText(boss));

    const s = Math.floor(this.elapsed);
    this.timerText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

    // Everything waits for your turn (Rizz, Eat and Throw too). Only '← Back' always works.
    for (const b of this.buttons) b.setEnabled(b.item.back ? true : ready && (b.item.needs ? b.item.needs() : true));
  }

  // ---------- The action menu ----------
  setMenu(mode) {
    this.menuMode = mode;
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];
    if (mode === 'none' || this.over) return;

    const p = this.player, bal = FUP.balance, C = FUP.combat, sp = this.weapon.special;
    const t = this.target();
    let items = [], cols = 4;

    if (mode === 'main') {
      items = [
        { label: 'Attack', act: () => this.withTarget(() => this.doAttack()) },
        { label: `Skills (${this.allSkills().filter(k => this.skillReady(k)).length})`, nav: () => this.setMenu('skills') },
        { label: 'Defend', act: () => this.doDefend() },
        { label: 'Rizz', nav: () => this.setMenu('rizz') },
        { label: `Eat (${this.satchel.length})`, nav: () => this.setMenu(this.satchel.length ? 'eat' : 'eatRaw'), needs: () => this.satchel.length > 0 || this.rawIds().length > 0 },
        { label: `Throw (${this.satchel.length})`, nav: () => this.setMenu('throw'), needs: () => this.satchel.length > 0 },
        { label: 'Flee', act: () => this.doFlee(), needs: () => this.canFlee() },
      ];
      // Limit Break: one known = one button. More (Melee 10, 25, 40) = a menu of all of them.
      if (p.limit >= bal.limitMax) {
        const known = FUP.unlocks.limits();
        if (known.length === 1) items.push({ label: `⚡ LIMIT BREAK: ${known[0].name}`, act: () => this.doLimit(known[0]), span: 4, hot: true });
        else items.push({ label: `⚡ LIMIT BREAK (${known.length} known)`, nav: () => this.setMenu('limit'), span: 4, hot: true });
      }
      // Fever Dream: buttons swap places and get silly names. They still do their real thing.
      if (this.fever) {
        const names = Phaser.Utils.Array.Shuffle(FUP.narrator.feverLabels.slice());
        Phaser.Utils.Array.Shuffle(items);
        items.forEach((it, i) => { it.label = names[i % names.length]; it.span = 1; it.hot = false; it.size = 17; });
      }
    } else if (mode === 'eat' || mode === 'throw') {
      cols = 3;
      // One button per stack of the same dish (v0.41 backpack)
      items = FUP.run.dishStacks().map(st => {
        const d = st.dish, i = st.idx[0], pic = FUP.dishArt.key(d), art = pic && this.textures.exists(pic);
        const pre = (art ? '' : d.emoji + ' ') + (st.n > 1 ? `×${st.n} ` : '');
        if (mode === 'eat') return { label: `${pre}${d.tier}\n${this.dishFx(d)}`, act: () => this.doEat(i), size: 13, icon: pic };
        // No weakness hints (Jesus, v0.41): you find out by throwing it
        return { label: `${pre}${d.tier}\n${d.element} ${d.throwDamage}`, act: () => this.withTarget(() => this.doThrow(i)), size: 13, icon: pic };
      });
      if (mode === 'eat' && this.rawIds().length) items.push({ label: `🌿 Raw from bag\n(${this.rawIds().length} kinds)`, nav: () => this.setMenu('eatRaw'), size: 13 });
      items.push({ label: '← Back', nav: () => this.setMenu('main'), size: 15, back: true });
    } else if (mode === 'skills') {
      // Your Special + weapon skills (data/weapons.js), unlocked by Melee level
      cols = 2;
      items = this.allSkills().map(k => {
        if (!this.skillKnown(k)) return { label: `🔒 ${k.name}\nMelee ${k.level}`, act: () => {}, needs: () => false, size: 13 };
        const cost = this.skillCost(k), ok = this.player.focus >= cost;
        return { label: `${k.name} · ${cost} Focus\n${k.desc}`, act: () => this.useSkill(k), needs: () => this.skillReady(k), size: 11, hot: ok };
      });
      items.push({ label: '← Back', nav: () => this.setMenu('main'), back: true, size: 15 });
    } else if (mode === 'helping') {
      // Second Helping (Frying Pan): pick the dish to eat at +50%
      cols = 3;
      const sk = this.allSkills().find(k => k.eatBoost);
      items = FUP.run.dishStacks().map(st => {
        const d = st.dish, i = st.idx[0], pic = FUP.dishArt.key(d), art = pic && this.textures.exists(pic);
        return { label: `${art ? '' : d.emoji + ' '}${st.n > 1 ? `×${st.n} ` : ''}${d.tier}\n${this.dishFx(d)} (+50%)`, act: () => this.act(() => { const [dish] = this.satchel.splice(i, 1); this.runSkill(sk, dish); }, { cat: 'skill', skillId: sk.id }), size: 12, icon: pic };
      });
      items.push({ label: '← Back', nav: () => this.setMenu('skills'), back: true, size: 15 });
    } else if (mode === 'target') {
      // Pick who to hit (v0.41, Jesus): with 2+ enemies every attack asks first
      cols = 2;
      const t0 = this.target();
      items = this.live().map(e => ({
        label: `${e === t0 ? '▶ ' : ''}${e.name}\n${Math.max(0, Math.ceil((e.fake && this.boss() ? this.boss() : e).hp))} HP`,
        act: () => { const go = this.afterTarget; this.afterTarget = null; this.setTarget(e); if (go) go(); }, size: 13, hot: e === t0,
      }));
      items.push({ label: '← Back', nav: () => { this.afterTarget = null; this.setMenu('main'); }, back: true, size: 15 });
    } else if (mode === 'eatRaw') {
      // Eat an ingredient straight from the bag (small effect, no cooking needed)
      cols = 3;
      const run = FUP.run;
      items = this.rawIds().map(id => {
        const ing = FUP.ingredients[id], pic = FUP.ui.ingKey(id), art = this.textures.exists(pic);
        return { label: `${art ? '' : ing.emoji + ' '}${ing.short} x${run.bagCount(id)}\n${FUP.cooking.rawText(id)}`, act: () => this.doEat(id, true), size: 12, icon: pic };
      });
      items.push({ label: '← Back', nav: () => this.setMenu(this.satchel.length ? 'eat' : 'main'), size: 15, back: true });
    } else if (mode === 'limit') {
      // Every Limit Break you know (Melee level, data/balance.js)
      cols = 2;
      items = FUP.unlocks.limits().map(lb => ({ label: `⚡ ${lb.name}\n${lb.desc}`, act: () => this.doLimit(lb), size: 14, hot: true }));
      items.push({ label: '← Back', nav: () => this.setMenu('main'), back: true });
    } else if (mode === 'rizz') {
      cols = 3;
      const U = FUP.unlocks, M = FUP.unlockData.rizzMoves, pct = k => t ? Math.round(this.rizzOdds(k, t) * 100) : 0;
      // Charm: never on real bosses; mini-bosses (the Godfather) only from Rizz 30
      const charmable = t && U.canCharm(t);
      const charmLabel = charmable ? `💕 Charm  ${pct('charm')}%\nthey leave`
        : t && t.miniBoss && !t.noCharm ? `💕 Charm\n🔒 Rizz ${M.charmMiniBoss.level}` : '💕 Charm\nwon\'t work';
      items = [
        { label: charmLabel, act: () => this.withTarget(() => this.doRizz('charm')), needs: () => t && U.canCharm(t) && !t.fake, size: 15 },
        { label: `🔥 Roast  ${pct('roast')}%\nATK down`, act: () => this.withTarget(() => this.doRizz('roast')), size: 15 },
      ];
      // Sweet Talk (Rizz 10): it gives you one of its things. One try per enemy.
      const st = M.sweetTalk;
      if (!U.has('sweetTalk')) items.push({ label: `${st.emoji} ${st.name}\n🔒 Rizz ${st.level}`, act: () => {}, needs: () => false, size: 14 });
      else {
        const tries = U.perkBest('sweetTries', 1), used = (t && t.sweetTalked) || 0;   // Persuasive perk: 2 tries
        const can = t && !t.fake && used < tries && U.sweetGifts(t).length > 0;
        const why = !t || t.fake ? '' : used >= tries ? 'already tried' : !U.sweetGifts(t).length ? 'has nothing' : `${pct('sweet')}% · a gift`;
        items.push({ label: `${st.emoji} ${st.name}\n${why}`, act: () => this.withTarget(() => this.doRizz('sweet')), needs: () => can, size: 14 });
      }
      // Hype Yourself (Rizz 20): your ATK up for a few turns
      const hy = M.hype;
      if (!U.has('hype')) items.push({ label: `${hy.emoji} ${hy.name}\n🔒 Rizz ${hy.level}`, act: () => {}, needs: () => false, size: 14 });
      else items.push({ label: `${hy.emoji} ${hy.name}\n${pct('hype')}% · ATK +${Math.round((hy.atkMult - 1) * 100)}%`, act: () => this.doRizz('hype'), size: 14 });
      items.push({ label: '← Back', nav: () => this.setMenu('main'), back: true });
    }

    // Lay buttons out in a grid on the right side of the bottom panel.
    const x0 = 410, y0 = 434, areaW = 474, h = 46, gap = 8;
    const w = (areaW - gap * (cols - 1)) / cols;
    let slot = 0;
    for (const item of items) {
      const span = Math.min(item.span || 1, cols);
      if ((slot % cols) + span > cols) slot += cols - (slot % cols);
      const col = slot % cols, row = Math.floor(slot / cols);
      const bw = w * span + gap * (span - 1);
      const btn = FUP.ui.button(this, x0 + col * (w + gap), y0 + row * (h + gap), bw, h, item.label,
        item.act || item.nav, { size: item.size || 17, hot: item.hot, icon: item.icon });
      btn.rect.setDepth(410); btn.txt.setDepth(411);
      if (btn.icon) btn.icon.setDepth(411);
      btn.item = item;
      this.buttons.push(btn);
      slot += span;
    }
    this.refreshHud();
  }

  // With more than one enemy, ask which one first (v0.41). Then run `fn`.
  withTarget(fn) {
    if (this.live().length <= 1) { fn(); return; }
    this.afterTarget = fn;
    this.setMenu('target');
  }

  // Ingredients in your bag that can be eaten raw.
  rawIds() { return Object.keys(FUP.run.bag).filter(id => FUP.run.bagCount(id) > 0 && FUP.cooking.rawDish(id)); }

  // Short text for what a dish does when eaten, e.g. "+18 HP · ATK +10%"
  dishFx(d) {
    const parts = [];
    if (d.heal) parts.push(`+${Math.round(d.heal * this.weapon.healMult)} HP`);
    for (const b of d.buffs || []) parts.push(`${b.stat.toUpperCase()} +${Math.round((b.mult - 1) * 100)}%`);
    for (const r of d.resists || []) parts.push(`${this.cap(r.element)} res`);
    if (d.inedible) parts.push('gross!');
    return parts.join(' · ') || 'does nothing';
  }

  // How a thrown dish's element works against this enemy.
  elementMult(e, element) {
    const el = (element || '').toLowerCase(), bal = FUP.balance;
    if (!el || el === 'blunt') return { mult: 1 };
    if (e.weak === el) return { mult: bal.weaknessMultiplier, tag: 'weak' };
    if ((e.resists || []).includes(el)) return { mult: bal.resistMultiplier, tag: 'resist' };
    return { mult: 1 };
  }

  isReady() { return !this.over && this.player.gauge >= 100; }

  onPlayerReady() {
    const p = this.player;
    p.defending = false;
    p.defendMult = 0;      // (an audited Defend only blocks a quarter)
    p.riposte = 0;         // Riposte only lasts until your next turn
    this.readyFor = 0;
    this.nagged = false;
    this.tweens.add({ targets: this.playerSprite, scale: this.playerSprite.scale * 1.08, duration: 120, yoyo: true });
    FUP.audio.sfx('ready');

    // Poison hurts at the start of each of your turns. Poison-resist food cuts it.
    if (p.poison > 0) {
      const res = this.resistValue('poison');
      const dmg = Math.round(p.maxHp * FUP.balance.poisonPerStack * p.poison * (1 - res));
      if (dmg > 0) this.hurtPlayer({ amount: dmg, crit: false }, false, '☠️ ');
    }
  }

  // Best protection against an element: from food you ate, or from your gear (whichever is bigger).
  resistValue(element) {
    const food = this.player.resists.filter(r => r.element === element).reduce((m, r) => Math.max(m, r.reduction), 0);
    return Math.max(food, (this.player.gearResist || {})[element] || 0);
  }

  // Every player action goes through here: spend the turn, run the action, tidy up.
  act(fn, opts = {}) {
    if (!this.isReady() || !this.target()) return;
    const p = this.player;
    p.gauge = 0;
    this.readyFor = 0;
    // A skill costs Focus (v0.41)
    if (opts.skillId) { const sk = this.allSkills().find(k => k.id === opts.skillId); if (sk) p.focus = Math.max(0, p.focus - this.skillCost(sk)); }
    // The Mold Accountant is auditing this kind of action: it only works half as well
    this.deductMult = opts.cat ? this.deductFor(opts.cat) : 1;
    if (this.deductMult < 1) { this.popup(this.playerSprite, 'DEDUCTED', 'bad', -70); this.say('deducted', { item: this.catName(opts.cat) }); }
    fn();
    this.deductMult = 1;
    if (opts.cat) this.lastAction = opts.cat;

    if (this.noFleeTurns > 0) this.noFleeTurns--;
    FUP.combat.tickBuffs(p);
    for (const r of p.resists) r.turns--;
    p.resists = p.resists.filter(r => r.turns > 0);
    if (this.fever > 0 && !this.over) { this.fever--; if (this.fever === 0) this.endFever(); }
    if (!this.over) this.setMenu('main');
  }

  // ---------- Player actions ----------
  doAttack() {
    this.act(() => { this.lunge(this.playerSprite, 1); if (this.hitEnemy(this.target(), 1.0, 0, false, { kind: 'attack' })) this.addFocus(FUP.balance.focus.perAttack); }, { cat: 'attack' });   // landed Attacks build Focus
  }

  doSpecial() {
    const sp = this.weapon.special;
    this.act(() => {
      const e = this.target();
      this.lunge(this.playerSprite, 1);
      let landed = false;
      for (let i = 0; i < sp.hits && !e.gone; i++) landed = this.hitEnemy(e, sp.power, i * 180, false, { kind: 'skill' }) || landed;
      if (!landed) return;   // bounced off Arms Crossed, or a fake: no stun / squeak
      if (!e.gone && !e.fake && sp.stunChance && Math.random() < sp.stunChance) {
        e.gauge = 0;
        this.popup(e.view, 'STUNNED', 'info', -40);
        this.say('stun', { enemy: e.name });
      }
      if (!e.gone && !e.fake && sp.debuff) {
        FUP.combat.addBuff(e, sp.debuff.stat, sp.debuff.mult, sp.debuff.turns, sp.debuff.label);
        this.popup(e.view, 'ATK DOWN', 'info', -40);
        this.say('squeak', { enemy: e.name });
      }
      // Rubber Chicken: sometimes the squeak confuses it (its next move hits itself)
      if (!e.gone && !e.fake && sp.confuseChance && Math.random() < sp.confuseChance) {
        e.confused = true;
        this.popup(e.view, 'CONFUSED', 'info', -70);
        this.say('squeakConfused', { enemy: e.name });
      }
    }, { cat: 'skill', skillId: 'special' });
  }

  doDefend() {
    this.act(() => {
      this.player.defending = true;
      if (this.deductMult < 1) this.player.defendMult = 0.75;   // audited: a weak guard
      this.addLimit(FUP.balance.limitPerDefend);
      this.popup(this.playerSprite, 'GUARD', 'info');
      this.say('defend');
      FUP.audio.sfx('guard');
    }, { cat: 'defend' });
  }

  // index = satchel slot, or (raw = true) an ingredient id to eat raw from the bag.
  doEat(index, raw = false) {
    this.act(() => {
      let dish;
      if (raw) {
        if (FUP.run.bagCount(index) <= 0) return;
        FUP.run.takeFromBag([index]);
        dish = FUP.cooking.rawDish(index);
      } else [dish] = this.satchel.splice(index, 1);
      if (dish) this.eatDish(dish);
    }, { cat: 'eat' });
  }

  // Eat one dish: heal, buffs, resistances. boost = Second Helping (+50%). Audited = half.
  eatDish(dish, boost = 1) {
    const p = this.player, k = boost * this.deductMult;
    const heal = Math.round(dish.heal * this.weapon.healMult * (1 + (p.healBonus || 0)) * k);
    const before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + heal);
    if (heal) { this.popup(this.playerSprite, '+' + (p.hp - before), 'good'); FUP.fx.burst(this, this.playerSprite.x, this.playerSprite.y, 'heal'); }
    let n = 0;
    for (const b of dish.buffs || []) {
      FUP.combat.addBuff(p, b.stat, 1 + (b.mult - 1) * k, b.turns, b.label, true);
      this.popup(this.playerSprite, b.label, 'info', -40 - 34 * n++);
    }
    for (const r of dish.resists || []) {
      p.resists = p.resists.filter(x => x.element !== r.element);
      p.resists.push({ element: r.element, reduction: Math.min(0.9, r.reduction * k), turns: r.turns + 1 }); // +1: this turn doesn't count
      this.popup(this.playerSprite, `${r.element.toUpperCase()} RESIST`, 'info', -40 - 34 * n++);
    }
    if (p.hp >= p.maxHp * 0.3) this.saidLowHp = false;
    this.say('eat', { item: dish.name });
    FUP.audio.sfx(heal ? 'heal' : 'eat');
    const tough = false;   // (Iron Stomach was dropped in v0.58)
    if (dish.hpCost && !tough) this.time.delayedCall(400, () => { if (!this.over) this.hurtPlayer({ amount: dish.hpCost, crit: false }, false, '🌶️ '); });
    if (dish.inedible && !tough) { // gag
      const gag = Math.max(1, Math.round(p.maxHp * FUP.cookingData.inedibleSelfDamage));
      this.time.delayedCall(400, () => { if (!this.over) { this.hurtPlayer({ amount: gag, crit: false }, false, '🤢 '); this.say('ateInedible', { item: dish.name }); } });
    }
  }

  doThrow(index) {
    this.act(() => {
      const e = this.target();
      const [dish] = this.satchel.splice(index, 1);
      if (!dish || !e) return;
      this.questNews.push(...FUP.quests.event('throw'));
      // The dish flies across the screen
      FUP.audio.sfx('throw');
      const fly = FUP.ui.sprite(this, this.playerSprite.x + 40, this.playerSprite.y - 20, FUP.dishArt.key(dish), dish.emoji, 40, 2.5).setDepth(450);
      this.tweens.add({ targets: fly, x: e.view.x, y: e.view.y, angle: 720, duration: 320, ease: 'Quad.easeIn', onComplete: () => fly.destroy() });

      if (e.fake) { this.time.delayedCall(320, () => this.popFake(e)); return; }
      // A thrown dish rips the Goblin's ledger and stuns him (thrown food isn't an Attack)
      if (e.ledger) { e.ledger = false; e.gauge = 0; this.questNews.push(...FUP.quests.event('ledger')); this.bigMoment('LEDGER RIPPED!'); this.say('ledgerRip', { enemy: e.name }); }
      const em = this.elementMult(e, dish.element);
      const amount = Math.max(1, Math.round(dish.throwDamage * em.mult * this.takenMult(e) * this.deductMult));
      this.applyDamage(e, amount);
      this.time.delayedCall(320, () => {
        this.popup(e.view, String(amount), em.tag === 'weak' ? 'crit' : em.tag === 'resist' ? 'info' : 'ink');   // no "WEAK!" label: the narrator hints
        this.blink(e.view);
        FUP.audio.sfx('splat');
      });
      this.say(em.tag === 'weak' ? 'throwWeak' : em.tag === 'resist' ? 'throwResist' : 'throwHit', { item: dish.name });
      this.afterDamage(e);
    }, { cat: 'throw' });
  }

  // Chance a Rizz move works on this enemy. Sweet Talk and Hype are easier than Charm (data/unlocks.js `ease`).
  rizzOdds(kind, e) {
    const C = FUP.combat, lvl = FUP.skills.level('rizz'), M = FUP.unlockData.rizzMoves;
    const move = { sweet: M.sweetTalk, hype: M.hype }[kind];
    if (!move) return C.rizzChance(kind, lvl, this.weapon, e, this.player.rizzBonus);
    return C.rizzChance('charm', lvl, this.weapon, e, this.player.rizzBonus + move.ease);
  }

  // kind: 'charm' | 'roast' | 'sweet' (Sweet Talk) | 'hype' (Hype Yourself). Failing any of them = Enraged.
  doRizz(kind) {
    const C = FUP.combat, bal = FUP.balance, M = FUP.unlockData.rizzMoves;
    this.act(() => {
      const e = this.target();
      if (e.fake) { this.popFake(e); return; }
      if (kind === 'charm' && !FUP.unlocks.canCharm(e)) { this.say('charmMiniBossNo', { enemy: e.name }); return; }
      if (kind === 'sweet') e.sweetTalked = (e.sweetTalked || 0) + 1;   // one try per enemy (two with Persuasive)
      const chance = Math.min(0.95, (this.rizzOdds(kind, e) + (this.player.rizzNext || 0)) * this.deductMult);
      this.player.rizzNext = 0;   // Distraction's bonus is used up
      if (Math.random() < chance) {
        if (kind === 'sweet') {
          this.sweetTalkGift(e);
        } else if (kind === 'hype') {
          C.addBuff(this.player, 'atk', M.hype.atkMult, FUP.unlocks.perkBest('hypeTurns', M.hype.turns), 'Hyped', true);
          this.popup(this.playerSprite, 'HYPED', 'good', -40);
          this.say('hypeWin', { enemy: e.name });
          FUP.audio.sfx('charm');
        } else if (kind === 'charm') {
          this.popup(e.view, '💕', 'good');
          this.say('charmWin', { enemy: e.name });
          FUP.audio.sfx('charm');
          this.removeEnemy(e, 'charmed');
        } else {
          const turns = bal.roastTurns + FUP.unlocks.perkSum('roastTurns');   // Smooth Talker perk
          C.addBuff(e, 'atk', 1 - bal.roastAtkDrop, turns, 'Roasted');
          if (FUP.unlocks.hasPerk('roastDef')) C.addBuff(e, 'def', 1 - bal.roastAtkDrop, turns, 'Roasted DEF');   // Rizz Mastery
          this.popup(e.view, 'ROASTED', 'info');
          this.say('roastWin', { enemy: e.name });
          FUP.audio.sfx('charm');
        }
      } else if (Math.random() < FUP.unlocks.perkSum('noEnrage')) {
        this.popup(e.view, 'unimpressed', 'info');   // Silver Tongue perk: no Enrage this time
        this.say('rizzFail', { enemy: e.name });
      } else {
        C.addBuff(e, 'atk', 1 + bal.enrageAtkBonus, bal.enrageTurns, 'Enraged');
        this.popup(e.view, 'ENRAGED', 'bad');
        FUP.fx.shake(this, 'enraged');
        this.say('rizzFail', { enemy: e.name });
        FUP.audio.sfx('boo');
      }
    }, { cat: 'rizz' });
  }

  // No running from the Landlord or the Pigeon Godfather.
  canFlee() { return !this.boss() && !this.liveReal().some(o => o.noFlee) && !this.noFleeTurns; }

  doFlee() {
    if (this.noFleeTurns) { this.say('ambushNoFlee'); return; }
    if (!this.canFlee()) { this.say('godfatherNoFlee'); return; }
    this.act(() => {
      if (FUP.unlocks.hasPerk('fleeAlways') || Math.random() < FUP.balance.fleeChance) {   // Smooth Exit perk
        this.say('fleeWin');
        this.endBattle('fled', true);
      } else {
        this.say('fleeFail');
        FUP.audio.sfx('error');
      }
    }, { cat: 'flee' });
  }

  // Sweet Talk worked: the enemy hands over one of its things (data/unlocks.js gifts).
  sweetTalkGift(e) {
    const run = FUP.run, list = FUP.unlocks.sweetGifts(e);
    const g = list[Math.floor(Math.random() * list.length)];
    let label, text;
    if (typeof g === 'object' && g.coins) {
      run.coins += g.coins; label = `+${g.coins} 🪙`; text = `${g.coins} coins`;
      FUP.audio.sfx('coins');
    } else {
      const ing = FUP.ingredients[g];
      text = `a ${ing.name}`;
      if (!run.addToBag(g)) { this.popup(e.view, 'bag full', 'info'); this.say('sweetFull', { enemy: e.name, item: text }); return; }
      label = `+${ing.emoji}`;
      FUP.audio.sfx('charm');
    }
    this.sweetGifts.push(label);
    this.popup(e.view, '🍬 ' + label, 'good');
    this.say('sweetWin', { enemy: e.name, item: text });
  }

  // lb = one Limit Break from data/balance.js (hits, power, healPct, ignoreDef)
  doLimit(lb = FUP.unlocks.limits()[0]) {
    this.act(() => {
      const p = this.player;
      p.limit = 0;
      this.cameras.main.flash(200, 255, 220, 120);
      FUP.fx.shake(this, 'limit');
      this.lunge(this.playerSprite, 2.5);
      this.say(lb.say || 'limit', { enemy: this.target().name });
      FUP.audio.sfx('limit');
      // Second Wind: heal first
      if (lb.healPct) {
        const before = p.hp;
        p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * lb.healPct));
        this.popup(this.playerSprite, '+' + (p.hp - before), 'good'); FUP.fx.burst(this, this.playerSprite.x, this.playerSprite.y, 'heal');
        FUP.audio.sfx('heal');
      }
      // Several hits (Flurry): if the target goes down, the rest go to the next enemy
      for (let i = 0; i < (lb.hits || 1); i++) {
        let e = this.target();
        if (!e || e.gone) e = this.liveReal()[0];
        if (!e) break;
        this.hitEnemy(e, lb.power, i * 160, lb.ignoreDef, { kind: 'limit' });
      }
      if (this.liveReal().length || this.killed.length) this.bigMoment(lb.name.toUpperCase() + '!', FUP.ui.colors.accent);
    }, { cat: 'limit' });
  }

  // o.kind: 'attack' (plain Attack) | 'skill' | 'counter' | 'limit'. o.guardBreak, o.element ('fire'), o.burn.
  hitEnemy(e, power, delay = 0, ignoreDef = false, o = {}) {
    if (!e || e.gone) return;
    if (e.fake) { this.time.delayedCall(delay, () => this.popFake(e)); return; }
    const kind = o.kind || 'attack';
    const guard = this.checkGuards(e, { ...o, kind });     // the Goblin's ledger, the Bouncer's Arms Crossed
    if (guard.blocked) return false;
    const exec = e.hp / e.maxHp < FUP.unlocks.perkBest('executeBelow', 0) ? FUP.unlocks.perkBest('executeMult', 1) : 1;   // Executioner perk
    const r = FUP.combat.damage(this.player, e, power * exec * (guard.mult || 1) * (kind === 'counter' ? 1 : this.deductMult), ignoreDef);
    const em = o.element ? this.elementMult(e, o.element) : { mult: 1 };
    r.amount = Math.max(1, Math.round(r.amount * em.mult * this.takenMult(e)));
    if (guard.bounce) {
      // Arms Crossed: it bounces back at you
      const back = Math.max(1, Math.round(r.amount * guard.bounce));
      this.time.delayedCall(delay, () => { if (e.view.active) this.popup(e.view, 'BOUNCED', 'info'); });
      this.time.delayedCall(delay + 150, () => { if (!this.over) { this.hurtPlayer({ amount: back, crit: false }, false); this.say('stanceBounce', { enemy: e.name }); } });
      return false;
    }
    this.applyDamage(e, r.amount);
    if (o.burn && e.hp > 0) e.burn = { dmg: Math.max(1, Math.round(e.maxHp * o.burn.pct)), turns: o.burn.turns };
    const big = r.crit || power >= 2 || em.tag === 'weak';
    this.time.delayedCall(delay, () => {
      if (!e.view.active) return;
      if (big) this.bigMoment(null);   // crits and huge hits freeze the fight for a beat
      this.popup(e.view, (r.crit ? 'CRIT ' : '') + r.amount, r.crit || em.tag === 'weak' ? 'crit' : 'ink');
      if (em.tag === 'weak') this.say('throwWeak'); else if (em.tag === 'resist') this.say('throwResist');
      FUP.audio.sfx(r.crit ? 'crit' : 'hit');
      FUP.fx.hit(this, e.view, 1);
      FUP.anim.once(e.pic, 'hurt');
      FUP.fx.burst(this, e.view.x, e.view.y - 10, r.crit ? 'crit' : 'hit');
      FUP.fx.shake(this, r.crit ? 'crit' : 'hit');
    });
    if (r.crit) this.say('playerCrit');
    this.afterDamage(e);
    return true;   // it landed
  }

  // After an enemy loses HP: did it die? Did the boss change phase?
  afterDamage(e) {
    this.onEnemyHurt(e);   // a squirrel drops the snack it stole (BattleSkills.js)
    if (e.hp <= 0) { this.removeEnemy(e, 'killed'); return; }
    if (e.boss) this.checkPhase(e);
  }

  // An enemy leaves the fight: killed, charmed, or (minions) running off after the boss dies.
  removeEnemy(e, how) {
    if (e.gone) return;
    e.gone = true;
    this.onEnemyGone(e, how);   // formations break, bodyguards fall, stolen food comes back
    if (how === 'killed') this.killed.push(e);
    if (how === 'charmed') this.charmed.push(e);
    // XP right away, with a pop-up over the enemy (the results screen adds it all up)
    const at = { x: e.view.x, y: e.view.y - 90 };
    if (how === 'killed' && !e.fake) { FUP.facts.add(`kill:${e.key}`); if (e.boss || e.miniBoss) FUP.facts.add(`boss:${e.key}`); }
    if (how === 'killed' && e.xp) { this.meleeXp += e.xp; FUP.skills.addXp('melee', e.xp, at); }
    if (how === 'charmed' && e.xp) { const x = Math.round(e.xp * FUP.balance.charmXpShare * FUP.unlocks.perkBest('charmXpMult', 1)); this.rizzXp += x; FUP.skills.addXp('rizz', x, at); }
    // Quests count kills and charms (not the fake Landlords from the Fever Dream)
    if (!e.fake && (how === 'killed' || how === 'charmed')) this.questNews.push(...FUP.quests.event(how === 'killed' ? 'kill' : 'charm', { enemy: e.key }));
    e.view.disableInteractive();
    e.tellText.setVisible(false);
    if (how === 'charmed' || how === 'flee') this.tweens.add({ targets: e.view, x: 1000, alpha: 0, duration: 900, ease: 'Sine.easeIn', onComplete: () => e.view.destroy() });
    else {
      this.tweens.add({ targets: e.view, angle: 540, scale: 0, alpha: 0, duration: 700, ease: 'Back.easeIn', onComplete: () => e.view.destroy() });
      if (how === 'killed') { this.time.delayedCall(450, () => FUP.fx.burst(this, e.view.x, e.view.y, 'poof')); FUP.fx.shake(this, 'kill'); }
    }

    // Boss down: the fever breaks and the tenants run.
    if (e.boss && !e.fake) {
      if (this.fever) this.endFever(true);
      for (const o of this.live()) this.removeEnemy(o, 'flee');
      if (this.isBossFight) this.time.delayedCall(400, () => this.say('allFlee'));
    }
    // Godfather down (or charmed): the family flies off.
    if (e.miniBoss && how !== 'flee') {
      const rest = this.live();
      for (const o of rest) this.removeEnemy(o, 'flee');
      if (rest.length) this.time.delayedCall(400, () => this.say('familyFlee'));
    }
    this.checkEnd();
  }

  checkEnd() {
    if (this.over || this.liveReal().length) return;
    const bossDead = this.killed.some(k => k.boss);
    if (bossDead) { this.say('bossWin'); this.endBattle('boss', true); return; }
    this.endBattle(this.killed.length ? 'win' : 'charmed', true);
    if (this.killed.length) this.say('win', { enemy: this.killed[this.killed.length - 1].name });
  }

  // ---------- Enemy turns ----------
  // Pick (and show) what this enemy does next.
  planMove(e) {
    // Summoners (the Pigeon Godfather): every `every` of his moves he calls for help
    if (e.summon) {
      const S = e.summon, family = this.liveReal().filter(o => o.key === S.minion).length;
      if ((e.movesDone + 1) % S.every === 0 && family < S.max) { e.nextMove = S.move; return; }
    }
    if (!e.boss) {
      // Signature tricks (BattleSkills.js) come first, then a normal move
      const sig = this.planSignature(e);
      if (sig) e.nextMove = sig; else FUP.combat.planEnemyMove(e);
      return;
    }
    const b = e.bossRules, n = e.turnInPhase + 1, N = b.notice;
    const minions = this.liveReal().filter(o => o.minion).length;
    if (e.notice && e.notice.left <= 1) e.nextMove = N.evict;                       // Final Notice runs out: EVICTION
    else if (n === b.feverOnTurn && !e.feverUsed[e.phase]) e.nextMove = b.special.fever;
    else if (N && n >= N.onTurn && !e.noticeUsed[e.phase] && !e.notice) e.nextMove = N.serve;
    else if (e.phase === 0 && n % b.summonEvery === 0 && minions < b.maxMinions) e.nextMove = b.special.summon;
    else if (e.phase === 2 && n % b.rentEvery === 0) e.nextMove = b.special.rent;
    else FUP.combat.planEnemyMove(e);
  }

  enemyAct(e) {
    const C = FUP.combat, m = e.nextMove, p = this.player;
    e.gauge = 0;
    if (!this.enemyTurnStart(e)) return;   // burning; last move's guard / audit ends (BattleSkills.js)
    FUP.anim.once(e.pic, 'attack');
    // Confused (Rubber Chicken's SQUEAK): this move hits itself instead
    if (e.confused) {
      e.confused = false;
      this.moveCallout(e, 'Confused');
      e.formation = false;   // a confused signaller forgets the formation
      const r = C.damage(e, e, this.weapon.special.confusePower || 0.8);
      this.applyDamage(e, r.amount);
      this.popup(e.view, String(r.amount), 'ink');
      FUP.audio.sfx('hit');
      FUP.fx.hit(this, e.view, 1);
      this.say('confusedHit', { enemy: e.name });
      this.afterDamage(e);
      e.movesDone++;
      C.tickBuffs(e);
      if (!this.over && !e.gone) this.planMove(e);
      return;
    }
    this.lunge(e.view, -1);
    this.moveCallout(e, m.name);

    if (this.actSignature(e, m)) {
      // handled: ledger, stance, audit, formation, bodyguard, eating your snack, Final Notice
    } else if (m.type === 'attack' || m.type === 'steal') {
      const landed = this.strike(e, m.power, m.power >= 1.5, !!m.eviction);   // Perfect Block / Riposte can stop it
      if (landed && m.poison && !this.over) this.addPoison(m.poison);
      if (m.type === 'steal' && landed && !this.over) {
        if (this.satchel.length) {
          const [item] = this.satchel.splice(Phaser.Math.Between(0, this.satchel.length - 1), 1);
          if (e.signature && e.signature.id === 'hoarder') e.stolen = item;   // it'll eat it next turn unless you hit it
          this.popup(this.playerSprite, 'lost ' + item.emoji, 'info', -40);
          this.say('stolen', { item: item.name, enemy: e.name });
          const sub = this.menuMode === 'eat' || this.menuMode === 'throw';
          this.setMenu(sub && this.satchel.length === 0 ? 'main' : this.menuMode);
        } else {
          this.say('stolenNothing', { enemy: e.name });
        }
      }
    } else if (m.type === 'debuff') {
      // Lowers one of YOUR stats (the Mold Accountant's Itemized Deduction)
      C.addBuff(p, m.stat, m.mult, m.turns, m.label);
      this.popup(this.playerSprite, m.label.toUpperCase(), 'bad', -40);
      this.say('enemyDebuff', { enemy: e.name });
    } else if (m.type === 'buff') {
      C.addBuff(e, m.stat, m.mult, m.turns, m.label, true);
      this.popup(e.view, m.label.toUpperCase(), 'info');
      this.say('enemyBuff', { enemy: e.name });
    } else if (m.type === 'summon' && e.summon) {
      // The Godfather calls the family
      if (this.liveReal().filter(o => o.key === e.summon.minion).length < e.summon.max) {
        this.spawnEnemy(e.summon.minion);
        this.say('godfatherSummon');
        FUP.audio.sfx('summon');
      }
    } else if (m.type === 'summon') {
      if (this.liveReal().filter(o => o.minion).length < e.bossRules.maxMinions) {
        this.spawnEnemy(e.bossRules.minion);
        this.say('bossSummon');
        FUP.audio.sfx('summon');
      }
    } else if (m.type === 'lateFee') {
      // Moss Goblin: a light hit, and he helps himself to some of your coins
      const landed = this.strike(e, m.power, false);
      const take = landed && FUP.run.coins > 0 ? Math.max(1, Math.floor(FUP.run.coins * m.steal * (1 - (p.rentLess || 0)))) : 0;
      if (!this.over && landed) {
        if (take > 0) {
          FUP.run.coins -= take;
          this.popup(this.playerSprite, `-${take} 🪙`, 'bad', -40);
          this.say('lateFee', { item: take });
          FUP.audio.sfx('coins');
        } else this.say('lateFeeBroke');
      }
    } else if (m.type === 'rally') {
      // Coo Menacingly: every pigeon in the fight gets the buff
      for (const o of this.liveReal().filter(o => o.pigeon)) {
        C.addBuff(o, m.stat, m.mult, m.turns, m.label, o === e);
        this.popup(o.view, m.label.toUpperCase(), 'info');
      }
      this.say('pigeonRally');
    } else if (m.type === 'rent') {
      this.strike(e, m.power, false);
      const keyHolder = (p.effects || []).includes('rentImmune');   // the Master Key: no rent
      const take = keyHolder ? 0 : Math.floor(FUP.run.coins * e.bossRules.rentTake * (1 - (p.rentLess || 0)));
      if (take > 0) {
        FUP.run.coins -= take;
        this.popup(this.playerSprite, `-${take} 🪙`, 'bad', -40);
        this.say('bossRent', { item: take });
        FUP.audio.sfx('coins');
      } else {
        this.say('bossRentBroke');
      }
    } else if (m.type === 'fever') {
      this.startFever(e);
    }

    e.movesDone++;
    if (e.boss && !this.over) {
      this.bossTurnEnd(e, m);   // Tenants pay rent, the Final Notice counts down
      e.turnInPhase++;
      if (e.phase === 1) this.addPoison(e.bossRules.poisonPerTurn); // Spore Season
    }
    C.tickBuffs(e);
    if (!this.over && !e.gone) this.planMove(e);
  }

  addPoison(n) {
    const p = this.player, max = FUP.balance.poisonMaxStacks;
    if (p.poison >= max) return;
    p.poison = Math.min(max, p.poison + n);
    this.popup(this.playerSprite, `☠️ x${p.poison}`, 'info', -80);
    if (!this.saidPoison) { this.saidPoison = true; this.time.delayedCall(700, () => { if (!this.over) this.say('poisonFirst'); }); }
  }

  // ---------- Boss phases ----------
  checkPhase(e) {
    const phases = e.bossRules.phases, ratio = e.hp / e.maxHp;
    let phase = 0;
    phases.forEach((ph, i) => { if (ratio < ph.below) phase = i; });
    if (phase <= e.phase) return;
    e.phase = phase;
    e.turnInPhase = 0;
    this.planMove(e);
    this.cameras.main.flash(300, 200, 120, 255);
    FUP.fx.shake(this, 'boss');
    this.say('bossPhase' + phase);
    FUP.audio.sfx('phase');
    const banner = FUP.ui.text(this, 450, 230, `PHASE ${phase + 1}\n${phases[phase].name.toUpperCase()}`, 44, FUP.look.hex('p2'), {
      fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 8, align: 'center',
    }).setOrigin(0.5).setDepth(470).setScale(0.5);
    this.tweens.add({ targets: banner, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: banner, alpha: 0, delay: 1400, duration: 500, onComplete: () => banner.destroy() });
  }

  // ---------- Fever Dream ----------
  startFever(boss) {
    const b = boss.bossRules;
    boss.feverUsed[boss.phase] = true;
    this.fever = b.feverTurns;

    // The real one and the fakes get shuffled into the same spots.
    const spots = Phaser.Utils.Array.Shuffle(BATTLE_SLOTS.fever.slice());
    this.moveEnemy(boss, spots[0]);
    this.fakes = [];
    for (let i = 1; i <= b.fakes; i++) this.fakes.push(this.spawnEnemy(boss.key, { fake: true, pos: spots[i] }));
    this.setTarget(Phaser.Utils.Array.GetRandom([boss, ...this.fakes]));

    // Wavy, colourful screen
    const cam = this.cameras.main;
    if (this.renderer.type === Phaser.WEBGL && cam.postFX) this.feverFx = cam.postFX.addColorMatrix();
    cam.setRotation(-0.02);
    this.feverTween = this.tweens.add({ targets: cam, rotation: 0.02, zoom: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.say('feverStart');
    FUP.audio.sfx('fever');
    this.setMenu('main');
  }

  endFever(silent = false) {
    this.fever = 0;
    for (const f of this.fakes || []) if (!f.gone) this.popFake(f, true);
    this.fakes = [];
    const cam = this.cameras.main;
    if (this.feverFx) { cam.postFX.remove(this.feverFx); this.feverFx = null; }
    if (this.feverTween) { this.feverTween.stop(); this.feverTween = null; }
    cam.setRotation(0).setZoom(1);
    if (!silent) this.say('feverEnd');
  }

  // A fake Landlord vanishes. If you hit it, you wasted your turn.
  popFake(e, quiet = false) {
    if (e.gone) return;
    e.gone = true;
    e.view.disableInteractive();
    this.tweens.add({ targets: e.view, alpha: 0, scale: 1.4, duration: 350, onComplete: () => e.view.destroy() });
    if (!quiet) { this.popup(e.view, 'FAKE!', 'info'); this.say('feverFake'); }
  }

  hurtPlayer(r, heavy, prefix = '') {
    const p = this.player, bal = FUP.balance;
    p.hp = Math.max(0, p.hp - r.amount);
    // Unbreakable perk: once per fight, a killing blow leaves you at 1 HP
    if (p.hp <= 0 && !this.usedUnbreakable && FUP.unlocks.hasPerk('unbreakable')) {
      this.usedUnbreakable = true; p.hp = 1;
      this.time.delayedCall(10, () => { if (!this.over) this.bigMoment('UNBREAKABLE!', FUP.ui.colors.good); });
    }
    this.popup(this.playerSprite, prefix + (r.crit ? 'CRIT ' : '') + '-' + r.amount, r.crit ? 'crit' : 'bad');
    FUP.audio.sfx(prefix ? 'poison' : 'hurt');
    FUP.fx.hit(this, this.playerSprite, -1);
    FUP.fx.burst(this, this.playerSprite.x, this.playerSprite.y - 10, prefix ? 'poison' : 'hurt');
    FUP.fx.shake(this, r.crit ? 'crit' : heavy ? 'heavy' : 'hurt');
    if (r.crit) this.say('enemyCrit', { enemy: (this.target() || {}).name });
    this.addLimit(r.amount / p.maxHp * 100 * bal.limitPerPercentHpLost);
    if (!prefix) this.addFocus(FUP.balance.focus.perHit);   // getting hit builds Focus (not poison)

    if (p.hp <= 0 && (FUP.run.battle || {}).tutorial) p.hp = 1;   // Orientation Isle: the dummy can't kill you (v0.62)
    if (p.hp <= 0) this.endBattle('lose');
    else if (!this.saidLowHp && p.hp < p.maxHp * 0.3) { this.saidLowHp = true; this.say('lowHp'); }
  }

  addLimit(amount) {
    const p = this.player, max = FUP.balance.limitMax;
    const was = p.limit;
    amount *= FUP.unlocks.perkBest('limitRate', 1);              // Melee Mastery perk
    p.limit = Math.min(max, p.limit + amount);
    if (was < max && p.limit >= max && !this.over) {
      this.say('limitReady');
      if (this.menuMode === 'main') this.setMenu('main');
    }
  }

  // ---------- End of fight ----------
  // result: 'win' | 'charmed' | 'fled' | 'lose' | 'boss' (beat the Landlord)
  endBattle(result, alreadySaid = false) {
    if (this.over) return;
    this.over = true;
    if (this.fever) this.endFever(true);
    this.setMenu('none');
    for (const e of this.enemies) if (!e.gone) e.tellText.setVisible(false);
    if (!alreadySaid) {
      const who = (this.boss() || this.target() || {}).name;
      this.say(result === 'lose' ? (this.isBossFight ? 'bossLose' : 'lose') : 'win', { enemy: who });
    }
    if (result === 'fled') {
      this.tweens.add({ targets: [this.playerSprite, this.weaponSprite], x: '-=400', duration: 600, ease: 'Sine.easeIn' });
    } else if (result === 'lose') {
      this.tweens.add({ targets: [this.playerSprite, this.weaponSprite], angle: -90, alpha: 0.4, duration: 600 });
    }
    // Music stops; a little tune says how it went
    FUP.audio.stopMusic();
    FUP.audio.sfx({ lose: 'lose', fled: 'flee', boss: 'fanfare' }[result] || 'win');
    this.time.delayedCall(1300, () => this.showResults(result));
  }

  showResults(result) {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, run = FUP.run;
    const survived = result !== 'lose';
    const fmt = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
    const p = this.player;
    run.hp = p.hp; // health carries to camp and the next fight
    run.limit = p.limit; // so does the Limit bar
    if (run.battle) {
      run.battle.result = result === 'boss' ? 'win' : result; // the Forest needs to know how it ended
      run.battle.pigeonKills = this.killed.filter(e => e.key === 'pigeon').length; // revenge rule
      run.battle.survivors = this.liveReal().length;                              // a flock you ran from
    }
    if (survived) run.fights++;
    if (survived && run.forest) run.forest.fights++;

    const lines = [];
    if (survived && result !== 'fled') {
      // XP, coins and drops
      const meleeXp = this.meleeXp, rizzXp = this.rizzXp, L = this.startLevels;
      const paid = FUP.unlocks.hasPerk('charmCoins') ? [...this.killed, ...this.charmed] : this.killed;   // Fan Club perk
      const coins = paid.reduce((s, e) => s + (e.coins || 0), 0);
      run.coins += coins;
      const gained = [];
      const lvl = id => FUP.skills.level(id) > L[id] ? ` · LEVEL ${FUP.skills.level(id)}!` : '';
      if (meleeXp) gained.push(`+${meleeXp} Melee XP` + lvl('melee'));
      if (rizzXp) gained.push(`+${rizzXp} Rizz XP` + lvl('rizz'));
      if (coins) gained.push(`+${coins} 🪙 (${run.coins} total)`);
      const kept = [], lost = [];
      for (const e of [...this.killed, ...this.charmed]) { const l = run.loot(e.key); kept.push(...l.kept); lost.push(...l.lost); }
      const show = ids => ids.map(id => FUP.ingredients[id].emoji).join(' ');
      lines.push(`Fight time: ${fmt(this.elapsed)}`, ...gained);
      if (kept.length) lines.push(`Dropped: ${show(kept)}`);
      if (this.sweetGifts.length) lines.push(`🍬 Sweet-talked: ${this.sweetGifts.join(' ')}`);
      if (lost.length) lines.push(`Backpack full. Left behind: ${show(lost)}`);
      // Gear drops (normal enemies sometimes, the Landlord always)
      for (const e of this.killed) {
        if (e.noGear) continue;   // the training dummy drops nothing
        const chance = (run.battle && run.battle.gearChanceMult) || 1;   // a raid ambush: x2
        const tier = (run.battle && run.battle.dropTier) || 1;            // the region's dropTier (G1): never better than its shop tier
        const item = FUP.gear.rollDrop(!!(e.boss || e.gearMin), Math.random, e.gearMin, chance, tier);   // Godfather: always Rare+
        // Drops go in your backpack (v0.41); no room = left behind
        if (item) { if (run.addGear(item)) { lines.push(`🎁 ${item.rarity} gear: ${item.name} (in your backpack)`); this.gotGear = true; } else lines.push(`🎁 ${item.rarity} ${item.name} dropped, but your backpack is full. Left behind.`); }
        // Boss chase drops (G1, data/gear.js bossDrops): each row rolls on its own, with pity
        if ((e.boss || e.miniBoss) && FUP.gearData.bossDrops[e.key]) {
          const got = FUP.gear.rollChase(e.key);
          for (const d of got) {
            lines.push(d.lost ? `★ RARE DROP: ${d.emoji} ${d.name}, but your backpack is full. It rolls away. Painful.` : `★ RARE DROP: ${d.emoji} ${d.name}${d.place ? ' (a trophy: place it on your plot)' : d.hat ? ' (a hat: wear it from the backpack, Wardrobe)' : ' (in your backpack)'}`);
            if (d.gear) this.gotGear = true;
          }
          if (got.length) { this.time.delayedCall(200, () => { this.bigMoment('RARE DROP!', FUP.ui.colors.accent); this.say('chaseDrop'); FUP.audio.sfx('fanfare'); }); }
          // Nothing hidden: what this boss can drop, and how long you've gone without each
          lines.push('Rare drops: ' + FUP.gear.chaseInfo(e.key).map(c => `${c.name} ${c.rateText} (dry ${c.dry}/${c.pity})`).join(' · '));
        }
      }
      lines.push(`HP left: ${p.hp}/${p.maxHp}`);
    } else if (result === 'fled') {
      const kept = [this.meleeXp && `+${this.meleeXp} Melee XP`, this.rizzXp && `+${this.rizzXp} Rizz XP`].filter(Boolean);
      lines.push(kept.length ? `You keep the XP you earned (${kept.join(', ')}).` : 'No XP.', 'No dignity. No ingredients.', `HP left: ${p.hp}/${p.maxHp}`);
    } else if (run.isHardcore()) {
      lines.push(`You lasted ${fmt(this.elapsed)}.`, 'Hardcore: your levels, cookbook, coins and bag are gone.', 'Start a new life.');
    } else {
      // Normal mode: everything you carried and wore goes into a grave (src/systems/grave.js)
      const dug = FUP.grave.dig();
      const G = FUP.grave.state;
      lines.push(Phaser.Utils.Array.GetRandom(FUP.narrator[dug.replaced ? 'graveReplaced' : 'graveDeath']),
        `Your bag, satchel, ${G.coins} 🪙 and worn gear are in a grave in ${FUP.forest.area(G.region).name}.`,
        `Get back to it within ${FUP.runData.grave.minutes} minutes of play.`,
        'You wake up at home with full HP.');
    }

    // Beat the Landlord: the run is over. Show the run summary too.
    let summary = null;
    if (result === 'boss' && run.forest) {
      this.questNews.push(...FUP.quests.event('boss', { time: run.forest.time }));
      summary = run.finishRun();
      lines.unshift(`RUN TIME: ${fmt(summary.time)}`);
    }
    if (!survived && run.isHardcore()) FUP.save.wipe();   // hardcore: this life is over, the save goes with it
    else if (!survived) FUP.save.write(false);             // normal: save the grave right away
    else if (this.questNews.length) lines.push(`📜 Quest done: ${this.questNews.join(', ')}!`);

    const titles = { win: 'VICTORY', lose: this.isBossFight ? 'EVICTED' : 'YOU DIED', charmed: 'CHARMED', fled: 'ESCAPED', boss: 'LANDLORD EVICTED' };
    const colors = { win: c.good, lose: c.bad, charmed: FUP.look.hex('p2'), fled: c.dim, boss: c.accent };
    ui.shade(this, 0.7).setDepth(500);
    FUP.ui.panel(this, W / 2 - 250, 110, 500, 370, 'panel').setDepth(501);
    ui.text(this, W / 2, 158, titles[result], result === 'boss' ? 40 : 52, colors[result], { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 6 }).setOrigin(0.5).setDepth(502);
    ui.text(this, W / 2, 300, lines.join('\n'), 18, c.ink, { align: 'center', lineSpacing: 7, wordWrap: { width: 460 } }).setOrigin(0.5).setDepth(502);

    let label, go;
    if (!survived && run.isHardcore()) { label = 'New life'; go = () => this.scene.start('Start'); }
    else if (!survived) { label = '🏠 Wake up at home'; go = () => this.scene.start('Village', { from: 'respawn' }); }
    else if (result === 'boss') { label = '🛝 Eviction Chute'; go = () => this.evictionChute(); }
    else if (run.battle && run.battle.tutorial) { label = '🏝️ Back to the island'; go = () => this.scene.start('World', { from: 'tutorialFight' }); }   // Orientation Isle (v0.62)
    else if (run.forest && run.forest.raid && !this.isBossFight) { label = '🚪 Back to the basement'; go = () => this.scene.start('Raid', {}); }
    else if (run.forest && !this.isBossFight) { label = '🌲 Back to the Forest'; go = () => this.scene.start('World', {}); }
    else if (run.forest) { label = '🔥 Back to camp'; go = () => this.scene.start('Cook', { mode: 'campfire' }); }
    else { label = '🏘️ Back to Foopville'; go = () => this.scene.start('Village', { from: 'run' }); }
    const next = ui.button(this, W / 2 - 120, 420, 240, 46, label, go, { hot: true });
    next.rect.setDepth(502); next.txt.setDepth(503);
  }

  // The Landlord is down: a chute opens under his desk and you slide all the way home (blueprint 18.6).
  evictionChute() {
    if (this.sliding) return;
    this.sliding = true;
    const W = this.scale.width, H = this.scale.height, ui = FUP.ui;
    this.add.rectangle(0, 0, W, H, FUP.look.num('k0'), 1).setOrigin(0).setDepth(900);
    // A long tube going down and to the right, and you, sliding down it
    const tube = this.add.graphics().setDepth(901);
    tube.lineStyle(70, FUP.look.num('w3')); tube.lineBetween(-40, 80, W + 40, H - 60);
    tube.lineStyle(56, FUP.look.num('k1')); tube.lineBetween(-40, 80, W + 40, H - 60);
    const hero = ui.sprite(this, -20, 70, FUP.looks.key('hero_map'), '🧍', 40).setDepth(902).setAngle(30).setScale(FUP.ui.pixelScale * 1.4);
    ui.text(this, W / 2, 60, 'THE EVICTION CHUTE', 30, ui.colors.accent, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 6 }).setOrigin(0.5).setDepth(903);
    const line = Phaser.Utils.Array.GetRandom(FUP.narrator.chuteSlide);
    ui.text(this, W / 2, H - 40, line, 17, ui.colors.ink, { fontStyle: 'italic', align: 'center', wordWrap: { width: W - 80 } }).setOrigin(0.5).setDepth(903);
    FUP.audio.sfx('flee');
    this.tweens.add({ targets: hero, x: W + 40, y: H - 70, angle: 30 + 720, duration: 1800, ease: 'Quad.easeIn' });
    FUP.fx.shake(this, 'chute');
    this.time.delayedCall(1900, () => this.cameras.main.fadeOut(300, 0, 0, 0));
    this.time.delayedCall(2250, () => this.scene.start('Village', { from: 'chute' }));
  }

  // ---------- Little effects ----------
  cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  say(category, vars = {}) {
    const lines = FUP.narrator[category];
    if (!lines || !lines.length) return;
    // Routine chatter doesn't pop the bar up; only things worth reading do (v0.41)
    if (FUP.narrator.quietInFights.includes(category) || category.startsWith('skill_')) return;
    const fallback = (this.target() || this.enemies[0] || {}).name || 'enemy';
    const who = vars.enemy || fallback;
    const line = Phaser.Utils.Array.GetRandom(lines)
      .replace(/\b([Tt]he) \{enemy\}/g, (m, t) => who.startsWith('The ') ? `${t} ${who.slice(4)}` : `${t} ${who}`)   // no "The The Mushroom Landlord"
      .replace(/\{enemy\}/g, who)
      .replace(/\{item\}/g, vars.item !== undefined ? vars.item : 'snack');
    this.narratorText.setText(line);
    this.showBar();
    this.narratorText.setAlpha(0.2);
    this.tweens.add({ targets: this.narratorText, alpha: 1, duration: 250 });
  }

  popup(target, str, kind = 'ink', dy = 0) {
    const c = FUP.ui.colors;
    const color = { ink: c.ink, bad: c.bad, good: c.good, crit: c.crit, info: c.info }[kind] || c.ink;
    FUP.fx.number(this, target.x, target.y - 70 + dy, str, color, kind === 'crit');   // pops big, floats up (src/fx.js)
  }

  moveCallout(e, name) {
    const t = FUP.ui.text(this, e.view.x, e.view.y + 40, name + '!', 18, FUP.ui.colors.accent, {
      fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 5,
    }).setOrigin(0.5).setDepth(455);
    this.tweens.add({ targets: t, alpha: 0, delay: 1500, duration: 500, onComplete: () => t.destroy() });
  }

  lunge(sprite, dir) {
    this.tweens.add({
      targets: sprite, x: sprite.baseX + 34 * dir, duration: 90, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => { if (sprite.active && !this.over) sprite.x = sprite.baseX; },
    });
  }

  blink(sprite) { FUP.fx.hit(this, sprite, sprite === this.playerSprite ? -1 : 1); }
}
