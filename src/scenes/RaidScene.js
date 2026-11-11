// ============================================================
// RAID — the Landlord's Basement (blueprint 18.6, data/raid.js).
// You came down the hole in the Deep Woods. 4 rooms, one at a time:
// fight → hazard → fight → hazard, then the Landlord's Office.
//   Fight rooms: the door behind you slams, the door ahead stays locked
//                until everyone in the room is beaten or charmed.
//   Hazard rooms: spore vents, crumbling floor or swinging steam pipes.
// No campfire, no going back. You can eat from your satchel while you walk.
// Walking, enemies, fights and the HUD come from WorldScene.
// ============================================================
class RaidScene extends WorldScene {
  constructor() { super('Raid'); }

  create() {
    const R = FUP.raid, T = R.size();
    this.f = FUP.run.forest;
    this.raid = this.f.raid;
    R.use(this.raid.rooms[this.raid.index]);
    this.tiles = R;
    this.A = this.raid.room;            // this room's state (enemies, cracks, where you stand)
    this.info = R.room();               // this room's data (name, map, kind)
    this.leaving = false;
    this.falling = false;
    this.campfire = null;
    this.weather = [];
    this.hz = 0;                        // seconds in this room (hazards run on it)
    this.safeUntil = 0;                 // pipes can't hit you again until then
    this.hasFog = this.info.kind === 'hazard';
    this.fogTex = null;
    this.worldW = R.width() * T;
    this.worldH = R.height() * T;
    R.setLocked(R.locked(this.A));

    this.drawRoom();
    this.drawDoors();
    this.drawThings();
    this.drawHazards();
    if (this.hasFog) this.drawFog();
    this.drawHud();
    this.setupInput();
    FUP.progressUi.attach(this);

    // The room is a bit smaller than the screen: keep it in the middle
    const cam = this.cameras.main, W = this.scale.width;
    cam.setBackgroundColor(FUP.look.num('k0'));
    cam.setBounds((this.worldW - W) / 2, -60, W, this.worldH + 120);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.fadeIn(300, 0, 0, 0);

    this.afterBattle();
    this.updateSight();
    FUP.audio.music(this.info.kind === 'office' ? 'boss' : 'raid');
    this.stepTimer = 0;
    FUP.ambience.attach(this, { place: 'raid', tiles: R, T });   // spores, shadows, dark corners (src/ambience.js)
  }

  hudLabel() {
    const n = this.raid.index + 1, total = this.raid.rooms.length;
    return this.info.kind === 'office' ? this.info.name : `${this.info.name} (${n}/${total - 1})`;
  }
  fogData() { return FUP.raidData.fog; }

  // ---------- Arriving, or coming back from a fight ----------
  afterBattle() {
    const b = FUP.run.battle;
    FUP.run.battle = null;
    if (!b) {
      if (this.A.fresh) this.arriveFresh(); else this.say('raidBack');
      this.A.fresh = false;
      return;
    }
    if (b.ambush) {
      this.say(b.result === 'fled' ? 'forestAfterFlee' : 'raidAfterAmbush');
    } else {
      const e = this.A.enemies[b.index];
      if (e && (b.result === 'win' || b.result === 'charmed')) {
        e.alive = false;
        if (this.enemySprites[b.index]) this.enemySprites[b.index].destroy();
        this.say(b.result === 'win' ? 'forestAfterWin' : 'forestAfterCharm');
      } else if (b.result === 'fled') {
        this.f.graceUntil = this.f.time + FUP.forestData.fleeGraceSeconds;
        this.say('forestAfterFlee');
      }
    }
    this.checkDoor();
  }

  // First steps into a room: the door behind you slams shut.
  arriveFresh() {
    const kind = this.info.kind;
    this.say(this.raid.index === 0 ? 'raidEnter' : kind === 'office' ? 'officeEnter' : kind === 'fight' ? 'raidFightRoom' : 'raidHazard_' + this.info.hazard);
    if (this.backDoor) {
      const d = this.backDoor;
      d.setScale(1, 0.1);
      this.tweens.add({ targets: d, scaleY: 1, duration: 180, delay: 250, ease: 'Bounce.easeOut', onComplete: () => { FUP.fx.shake(this, 'door'); FUP.audio.sfx('guard'); } });
    }
    if (this.A.enemies.some(e => e.type === 'sporeBouncer')) this.time.delayedCall(2600, () => { if (!this.leaving) this.say('bouncerSeen'); });
  }

  // ---------- Drawing the room (walls, floor, clutter) ----------
  drawRoom() {
    const R = FUP.raid, T = R.size(), C = FUP.raidData.colors, ui = FUP.ui;
    const g = this.add.graphics().setDepth(-10);
    const noise = (x, y, k = 0) => { const n = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453; return n - Math.floor(n); };
    const office = this.info.kind === 'office', laundry = this.A.id === 'laundry';
    for (let ty = 0; ty < R.height(); ty++) {
      for (let tx = 0; tx < R.width(); tx++) {
        const ch = R.tileAt(tx, ty), x = tx * T, y = ty * T;
        const wall = (cx, cy) => cy < 0 || cy >= R.height() || cx < 0 || cx >= R.width() || R.tileAt(cx, cy) === '#';
        if (ch === '#') {
          if (!wall(tx, ty + 1)) {
            // Front face of a wall (you see it from the room): light cap, then bricks, dark foot
            g.fillStyle(C.wall); g.fillRect(x, y, T, T);
            g.fillStyle(C.wallTop); g.fillRect(x, y, T, 8);
            g.fillStyle(C.wallLine);
            const bh = (T - 12) / 3;
            for (let k = 0; k < 3; k++) {
              const by = y + 8 + k * bh;
              g.fillRect(x, by, T, 2);
              const off = (k + tx) % 2 ? T / 2 : 0;
              g.fillRect(x + off, by, 2, bh); if (off) g.fillRect(x, by, 2, bh);
            }
            g.fillRect(x, y + T - 4, T, 4);
          } else {
            // Top of the wall: flat, with a dark edge on any side that faces the room
            g.fillStyle(C.wallTop); g.fillRect(x, y, T, T);
            g.fillStyle(C.wallLine);
            if (!wall(tx - 1, ty)) g.fillRect(x, y, 3, T);
            if (!wall(tx + 1, ty)) g.fillRect(x + T - 3, y, 3, T);
            if (!wall(tx, ty - 1)) g.fillRect(x, y, T, 3);
          }
          continue;
        }
        // Floor: two worn planks per square, seams and staggered plank ends
        for (let k = 0; k < 2; k++) {
          const py = y + k * T / 2;
          g.fillStyle((ty * 2 + k) % 3 ? C.floor : C.floorAlt); g.fillRect(x, py, T, T / 2);
          g.fillStyle(C.floorLine); g.fillRect(x, py + T / 2 - 2, T, 2);
          if ((tx + ty + k) % 3 === 0) g.fillRect(x + (k ? T * 0.3 : T * 0.7), py, 2, T / 2);
        }
        // Shadow under a wall
        if (wall(tx, ty - 1)) { g.fillStyle(C.floorLine); g.fillRect(x, y, T, 6); for (let k = 0; k < T; k += 4) g.fillRect(x + k, y + 6, 2, 2); }
        if (office && tx >= 6 && tx <= 13 && ty >= 1 && ty <= 12) {
          g.fillStyle(C.carpet); g.fillRect(x, y, T, T);
          g.fillStyle(C.carpetEdge);
          if (tx === 6) g.fillRect(x, y, 3, T);
          if (tx === 13) g.fillRect(x + T - 3, y, 3, T);
        }
        if (ch === 'k') {
          if (laundry) {
            // A washing machine: white box, round door
            g.fillStyle(C.washer); g.fillRect(x + 3, y + 2, T - 6, T - 4);
            g.lineStyle(2, C.pipeDark); g.strokeRect(x + 3, y + 2, T - 6, T - 4);
            g.fillStyle(FUP.look.num('b2')); g.fillCircle(x + T / 2, y + T / 2 + 3, 11);
            g.lineStyle(2, C.pipe); g.strokeCircle(x + T / 2, y + T / 2 + 3, 11);
          } else {
            // A crate
            g.fillStyle(C.clutter); g.fillRect(x + 3, y + 3, T - 6, T - 6);
            g.lineStyle(2, C.clutterEdge); g.strokeRect(x + 3, y + 3, T - 6, T - 6);
            g.lineBetween(x + 3, y + 3, x + T - 3, y + T - 3); g.lineBetween(x + T - 3, y + 3, x + 3, y + T - 3);
          }
        } else if (ch === '.' && noise(tx, ty) < 0.06 && !office) {
          // Damp stains on the floor
          g.fillStyle(C.floorAlt); g.fillEllipse(x + T * (0.3 + noise(tx, ty, 2) * 0.4), y + T * (0.3 + noise(tx, ty, 3) * 0.4), T * 0.5, T * 0.25);
        }
      }
    }
    // The Landlord's desk (the "d" squares)
    const desk = R.find('d');
    if (desk.length) {
      const cx = desk.reduce((sum, s) => sum + R.center(s.tx, s.ty).x, 0) / desk.length, cy = R.center(desk[0].tx, desk[0].ty).y;
      const pic = ui.sprite(this, cx, cy, 'raid_desk', '', 10).setDepth(cy + 20);
      if (pic.type === 'Text') {   // no picture yet: a plain brown desk
        pic.destroy();
        const g2 = this.add.graphics().setDepth(cy + 20);
        g2.fillStyle(C.clutter); g2.fillRect(cx - desk.length * T / 2, cy - T * 0.4, desk.length * T, T * 0.8);
        g2.lineStyle(2, C.clutterEdge); g2.strokeRect(cx - desk.length * T / 2, cy - T * 0.4, desk.length * T, T * 0.8);
      }
    }
  }

  // ---------- Doors: "<" behind you (shut), ">" ahead (locked in fight rooms) ----------
  drawDoors() {
    const R = FUP.raid, T = R.size(), C = FUP.raidData.colors;
    const back = R.find('<')[0];
    if (back) {
      const c = R.center(back.tx, back.ty);
      this.backDoor = this.add.rectangle(c.x, c.y, T * 0.9, T, C.door).setStrokeStyle(3, C.clutterEdge).setDepth(c.y);
    }
    const ex = R.find('>')[0];
    this.exit = null;
    if (!ex) return;
    const c = R.center(ex.tx, ex.ty);
    this.exit = c;
    this.exitDoor = this.add.rectangle(c.x, c.y, T * 0.9, T, C.door).setStrokeStyle(3, C.clutterEdge).setDepth(c.y);
    this.exitLamp = this.add.circle(c.x, c.y - 4, 6, C.doorLocked).setDepth(c.y + 1);
    const next = this.raid.rooms[this.raid.index + 1];
    const label = next === 'office' ? "The Landlord's Office ↑" : 'Next room ↑';
    this.exitText = FUP.ui.text(this, c.x, c.y + 30, '', 13, FUP.ui.colors.ink, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4 }).setOrigin(0.5).setDepth(5000);
    this.exitLabel = label;
    this.showDoor(R.locked(this.A));
  }

  showDoor(locked) {
    if (!this.exitDoor) return;
    const C = FUP.raidData.colors;
    this.exitLamp.setFillStyle(locked ? C.doorLocked : C.doorOpen);
    this.exitDoor.setFillStyle(locked ? C.door : C.pit);
    this.exitText.setText(locked ? '🔒 LOCKED' : this.exitLabel);
  }

  // Everyone beaten? The door ahead opens.
  checkDoor() {
    const locked = FUP.raid.locked(this.A);
    const was = FUP.raid.BLOCKED === FUP.raid.LOCKED;
    FUP.raid.setLocked(locked);
    this.showDoor(locked);
    if (was && !locked) {
      this.time.delayedCall(1500, () => { if (!this.leaving) this.say('raidDoorOpens'); });
      FUP.audio.sfx('ready');
      if (this.exitDoor) this.tweens.add({ targets: this.exitLamp, scale: 1.8, duration: 300, yoyo: true, repeat: 2 });
    }
  }

  // Through the door ahead: the next room (or the Office)
  checkExit() {
    if (!this.exit) return;
    const near = Math.abs(this.player.x - this.exit.x) < 30 && this.player.y - this.exit.y < 48;
    if (!near) { this.nagged = false; return; }
    if (FUP.raid.locked(this.A)) {
      if (!this.nagged) {
        this.nagged = true;
        const onlyAmbush = !this.A.enemies.some(e => e.alive);   // everyone you can see is beaten
        this.say(onlyAmbush ? 'raidLockedAmbush' : 'raidLocked');
        FUP.audio.sfx('error');
      }
      return;
    }
    this.leaving = true;
    FUP.audio.sfx('step');
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(370, () => { FUP.raid.enter(this.f, this.raid.index + 1); this.scene.start('Raid', {}); });
  }

  enemySprite(e) {
    if (!e.landlord) return super.enemySprite(e);
    const data = FUP.enemies.landlord;
    return FUP.ui.sprite(this, e.x, e.y, data.mapSprite, data.emoji, 52).setOrigin(0.5, 0.8).setDepth(e.y + 16);
  }

  updateSight() {
    this.A.enemies.forEach((e, i) => {
      const s = this.enemySprites[i];
      if (s && e.alive) s.setVisible(!this.hasFog || this.inSight(e.x, e.y));
    });
  }

  // ---------- Fights ----------
  startBattle(index) {
    if (this.leaving) return;
    this.leaving = true;
    const e = this.A.enemies[index], D = FUP.raidData;
    if (e.landlord) {
      // The Section 12 fight, unchanged (no raid multiplier)
      FUP.run.battle = { index, type: 'landlord', result: null, office: true, dropTier: FUP.raidData.dropTier };
      this.say('officeFight');
      FUP.audio.sfx('encounter');
      this.cameras.main.fadeOut(650, 30, 0, 40);
      this.time.delayedCall(680, () => this.scene.start('Battle', { enemies: ['landlord'] }));
      return;
    }
    FUP.run.battle = { index, type: e.type, result: null, mult: D.mult, raid: true, areaLevel: D.level, dropTier: FUP.raidData.dropTier };
    this.launch([e.type]);
  }

  launch(enemies) {
    FUP.audio.sfx('encounter');
    FUP.fx.shake(this, 'encounter');
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(250, () => this.scene.start('Battle', { enemies }));
  }

  // The hidden ambush spot (the Laundry Room)
  checkAmbush() {
    const a = this.A.ambush, D = FUP.raidData;
    if (!a || a.done || this.f.time < this.f.graceUntil) return;
    const c = FUP.raid.center(a.tx, a.ty);
    if (Math.hypot(c.x - this.player.x, c.y - this.player.y) > D.ambush.touch) return;
    a.done = true;
    this.leaving = true;
    this.say('raidAmbush');
    FUP.run.battle = { index: -1, ambush: true, type: 'ambush', result: null, mult: D.mult, raid: true, areaLevel: D.level, dropTier: FUP.raidData.dropTier,
      gearChanceMult: D.ambush.gearChanceMult, noFleeTurns: D.ambush.noFleeTurns };
    const group = FUP.raid.ambushGroup();
    this.time.delayedCall(500, () => this.launch(group));
  }

  // ---------- Hazards ----------
  drawHazards() {
    const R = FUP.raid, T = R.size(), C = FUP.raidData.colors, ui = FUP.ui;
    this.vents = [];
    for (const g of ['1', '2', '3']) for (const s of R.find(g)) {
      const c = R.center(s.tx, s.ty);
      const pic = ui.sprite(this, c.x, c.y, 'raid_vent', '', 10).setDepth(-4);
      if (pic.type === 'Text') { pic.destroy(); const v = this.add.graphics().setDepth(-4); v.fillStyle(C.pipeDark); v.fillCircle(c.x, c.y, 14); v.lineStyle(2, C.wallLine); for (let k = -1; k <= 1; k++) v.lineBetween(c.x - 10, c.y + k * 6, c.x + 10, c.y + k * 6); }
      const cloud = this.add.circle(c.x, c.y, T * (FUP.raidData.vents.reach + 0.5), C.spore, 0).setDepth(4000);
      this.vents.push({ ...s, ...c, group: +g, cloud });
    }
    this.hitCycle = {};

    this.cracks = [];
    for (const s of R.find('x')) {
      const c = R.center(s.tx, s.ty), g = this.add.graphics().setDepth(-3);
      const crack = { ...s, ...c, g, state: 'ok', t: 0 };
      this.drawCrack(crack);
      this.cracks.push(crack);
    }
    this.crackAt = {};
    for (const k of this.cracks) this.crackAt[k.tx + ',' + k.ty] = k;

    this.pipes = (this.info.pipes || []).map(p => {
      const rail = this.add.graphics().setDepth(1);
      const row = R.rows()[p.row], y = p.row * T;
      rail.fillStyle(C.pipeDark); rail.fillRect(row.indexOf('.') * T, y - T * 0.55, (row.lastIndexOf('.') - row.indexOf('.') + 1) * T, 6);
      return { ...p, rod: this.add.graphics(), bob: this.add.circle(0, 0, 15, C.pipe).setStrokeStyle(4, C.pipeDark), steam: this.add.circle(0, 0, 8, C.steam, 0.5) };
    });
    this.updateHazards(0);
  }

  drawCrack(k) {
    const T = FUP.raid.size(), C = FUP.raidData.colors, g = k.g, x = k.tx * T, y = k.ty * T;
    g.clear();
    if (k.state === 'broken') {
      g.fillStyle(C.pit); g.fillRect(x + 2, y + 2, T - 4, T - 4);
      g.lineStyle(2, C.wallLine); g.strokeRect(x + 2, y + 2, T - 4, T - 4);
      return;
    }
    g.fillStyle(k.state === 'crumbling' ? FUP.look.num('x') : C.floorAlt, 1); g.fillRect(x + 1, y + 1, T - 2, T - 2);
    g.lineStyle(2, C.crack);
    g.lineBetween(x + 6, y + 8, x + T / 2, y + T / 2); g.lineBetween(x + T / 2, y + T / 2, x + T - 8, y + 12);
    g.lineBetween(x + T / 2, y + T / 2, x + T / 2 - 4, y + T - 6);
  }

  // Lose a share of max HP to a hazard. Hazards never take you below 1 HP (PLACEHOLDER, data/raid.js).
  hazardHurt(share, line) {
    const run = FUP.run, max = run.maxHp(), dmg = Math.max(1, Math.round(max * share));
    run.hp = Math.max(1, run.currentHp() - dmg);
    this.floatText(`-${dmg}`, FUP.ui.colors.bad);
    FUP.audio.sfx('hurt');
    FUP.fx.shake(this, 'trap');
    if (line) this.say(line);
  }

  floatText(str, color) {
    const t = FUP.ui.text(this, this.player.x, this.player.y - 30, str, 22, color, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 5 }).setOrigin(0.5).setDepth(7000);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  updateHazards(dt) {
    const D = FUP.raidData, V = D.vents, T = FUP.raid.size(), t = this.hz;
    const px = this.player.x, py = this.player.y;

    // Spore vents: each group puffs every V.every seconds, one group after another
    const gap = V.every / V.groups;
    for (const v of this.vents) {
      const local = t - (v.group - 1) * gap;
      const ph = ((local % V.every) + V.every) % V.every, cycle = Math.floor(local / V.every);
      if (ph < V.puff && local >= 0) {
        v.cloud.setAlpha(0.55 * (1 - ph / V.puff)).setScale(0.8 + ph);
        const inside = Math.abs(px - v.x) < T * (V.reach + 0.5) && Math.abs(py - v.y) < T * (V.reach + 0.5);
        if (inside && this.hitCycle[v.group] !== cycle && !this.falling) {
          this.hitCycle[v.group] = cycle;
          this.sporeHit();
        }
      } else if (ph > V.every - V.hiss) {
        v.cloud.setAlpha(0.12 + 0.08 * Math.sin(t * 40)).setScale(0.3);   // the hiss: get out of the way
      } else v.cloud.setAlpha(0);
    }

    // Crumbling floor: cracked tiles break a moment after you step on them
    if (this.cracks.length && !this.falling) {
      const here = this.crackAt[Math.floor(px / T) + ',' + Math.floor(py / T)];
      if (here && here.state === 'broken') { this.fall(); return; }
      if (here && here.state === 'ok') { here.state = 'crumbling'; here.t = D.floor.delay; this.drawCrack(here); }
      for (const k of this.cracks) {
        if (k.state !== 'crumbling') continue;
        k.t -= dt;
        k.g.x = (Math.random() - 0.5) * 2;   // a little shake
        if (k.t <= 0) {
          k.state = 'broken'; k.g.x = 0; this.drawCrack(k); FUP.audio.sfx('splat');
          if (k === here) { this.fall(); return; }
        }
      }
    }

    // Swinging steam pipes
    for (const p of this.pipes) {
      const b = FUP.raid.pipeAt(p, t), railY = p.row * T - T * 0.5;   // it hangs from a rail and swings along it
      p.bob.setPosition(b.x, b.y).setDepth(b.y + 16);
      p.steam.setPosition(b.x + Math.sin(t * 9 + p.row) * 6, b.y - 18).setDepth(b.y + 17).setAlpha(0.3 + 0.2 * Math.sin(t * 7 + p.row));
      p.rod.clear().setDepth(b.y + 15);
      p.rod.lineStyle(8, FUP.raidData.colors.pipeDark); p.rod.lineBetween(b.x, railY, b.x, b.y);
      p.rod.lineStyle(4, FUP.raidData.colors.pipe); p.rod.lineBetween(b.x, railY, b.x, b.y);
      if (this.hz >= this.safeUntil && Math.hypot(px - b.x, py - b.y) < D.pipes.hit) this.pipeHit();
    }
  }

  sporeHit() {
    const D = FUP.raidData, V = D.vents, g = FUP.gear.totals();
    const resist = Math.min(0.9, Math.max(g.resistPoison || 0, this.A.sporeResist || 0));
    this.hazardHurt(V.damage * (1 - resist), null);
    this.raid.spored = Math.min(V.sporedMax, (this.raid.spored || 0) + 1);
    FUP.audio.sfx('poison');
    this.say(resist > 0 ? 'raidSporeResist' : 'raidSpore', { item: this.raid.spored });
    this.refreshSpored();
  }

  // Fall through the floor: hurt, back to the entrance, the floor fixes itself
  fall() {
    if (this.falling) return;
    this.falling = true;
    const p = this.player;
    this.tweens.add({ targets: p, scale: p.scale * 0.2, alpha: 0, angle: 180, duration: 450, onComplete: () => {
      for (const k of this.cracks) { k.state = 'ok'; k.g.x = 0; this.drawCrack(k); }
      const s = FUP.raid.besideEntrance();
      p.setPosition(s.x, s.y).setAngle(0).setAlpha(1).setScale(p.scale * 5);
      this.A.player.x = s.x; this.A.player.y = s.y;
      this.hazardHurt(FUP.raidData.floor.damage, 'raidFall');
      this.time.delayedCall(250, () => { this.falling = false; });
    } });
  }

  // A pipe hit: hurt, knocked back toward the door you came in
  pipeHit() {
    const P = FUP.raidData.pipes, T = FUP.raid.size(), p = this.player;
    this.safeUntil = this.hz + P.safeSeconds;
    this.hazardHurt(P.damage, 'raidPipe');
    let ty = Math.floor(p.y / T);
    const tx = Math.floor(p.x / T);
    for (let k = 0; k < P.knockback && !FUP.raid.blockedTile(tx, ty + 1); k++) ty++;
    const to = FUP.raid.center(tx, ty);
    this.falling = true;   // no walking while you fly backwards
    this.tweens.add({ targets: p, x: to.x, y: to.y, duration: 220, ease: 'Quad.easeOut', onComplete: () => {
      this.A.player.x = p.x; this.A.player.y = p.y; this.falling = false;
    } });
    this.tweens.add({ targets: p, alpha: 0.4, duration: 100, yoyo: true, repeat: 4, onComplete: () => p.setAlpha(1) });
  }

  // ---------- HUD: Spored counter, and eating from the satchel ----------
  drawHud() {
    super.drawHud();
    const H = this.scale.height;
    this.sporedText = FUP.ui.text(this, 30, H - 82, '', 15, '#b8d86a', { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4 }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10000);
    this.refreshSpored();
  }

  refreshSpored() {
    if (!this.sporedText) return;
    const n = this.raid.spored || 0;
    this.sporedText.setText(n ? `☠️ Spored x${n} (Poison at the start of your next fight)` : '');
  }

  // In the raid you can eat while walking: click a dish (phones: tap to see it, tap again to eat)
  drawSatchel() {
    const parts = super.drawSatchel();
    const touch = FUP.ui.isTouch(this);
    // parts = pictures (and count labels) of each dish stack; this.satchelIdx = the satchel index each stack eats from
    const pics = parts.filter(p => p.type !== 'Text');
    (this.satchelIdx || []).forEach((idx, i) => {
      const pic = pics[i], d = FUP.run.satchel[idx];
      if (!pic || !d) return;
      pic.setInteractive({ useHandCursor: true });
      pic.on('pointerdown', () => {
        if (this.leaving || this.falling) return;
        if (touch && this.picked !== i) { this.picked = i; this.say('raidEatPick', { item: d.name }); return; }
        this.picked = null;
        this.eatDish(idx);
      });
    });
    return parts;
  }

  eatDish(i) {
    const r = FUP.run.eatAtCamp(i);
    if (!r) return;
    const res = (r.dish.resists || []).find(x => x.element === 'poison');
    if (res) this.A.sporeResist = Math.max(this.A.sporeResist || 0, res.reduction);
    this.floatText(r.change >= 0 ? `+${r.change}` : `${r.change}`, r.change >= 0 ? FUP.ui.colors.good : FUP.ui.colors.bad);
    FUP.audio.sfx('eat');
    this.say(res ? 'raidEatResist' : 'raidEat', { item: r.dish.name });
    this.drawSatchel();
  }

  // ---------- Every frame ----------
  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    FUP.ambience.update(this, dt);
    if (this.leaving) return;
    this.f.time += dt;
    this.hz += dt;
    if (!this.falling) this.movePlayer(dt);
    this.moveEnemies(dt);
    this.updateHazards(dt);
    if (this.hasFog) this.updateFog();
    this.updateSight();
    if (!this.leaving) this.checkAmbush();
    if (!this.leaving) this.checkExit();
    this.refreshHud();
  }
}
