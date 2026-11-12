// ============================================================
// WORLD PEOPLE — villagers, signs, traps and fishing water out in the world
// (extra functions for WorldScene; phase W1, the Docks).
// What a region has comes from its map data (data/region_<id>.js: npcs, objects, fish)
// and is switched on by its `features` in data/world.js.
// Walk up to something and press E / Space / the round button.
// Villagers open the same windows as in the village (VillagePanels.js).
// ============================================================
Object.assign(WorldScene.prototype, {

  // ---------- Drawing (every visit: this screen is reused) ----------
  drawPeople() {
    const ui = FUP.ui, c = ui.colors, F = this.tiles, info = this.info;
    this.spots = []; this.solid = [];
    const at = (tx, ty) => F.center(tx, ty);
    if (this.feature('npcs')) for (const p of info.npcs || []) {
      const n = FUP.villageData.npcs[p.id], c0 = at(p.tx, p.ty);
      const s = FUP.anim.sprite(this, c0.x, c0.y, n.sprite, 'idle', n.emoji, 30).setOrigin(0.5, 0.8).setDepth(c0.y + 14);
      this.tweens.add({ targets: s, scaleY: s.scaleY * 1.04, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      ui.text(this, c0.x, c0.y - s.displayHeight * 0.8 - 2, n.name.replace('The ', ''), 11, c.ink, { stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
      this.spots.push({ kind: 'npc', id: p.id, x: c0.x, y: c0.y, sprite: s, label: 'Talk' });
      this.solid.push({ tx: p.tx, ty: p.ty });
    }
    if (this.feature('objects')) for (const o of info.objects || []) {
      const c0 = at(o.tx, o.ty);
      if (o.kind === 'sign') {
        this.add.text(c0.x, c0.y, '🪧', { fontSize: '24px' }).setOrigin(0.5).setDepth(c0.y + 10);
        this.spots.push({ kind: 'sign', x: c0.x, y: c0.y, label: 'Read', text: o.text });
      }
    }
    // Fish traps (src/trapUi.js): rings on the trap squares, your traps, and their action spots
    this._trapViews = null; this.trapSig = null;
    if (this.feature('fishing')) {
      FUP.trapUi.draw(this, this.f.area, F);
      this.spots.push(...FUP.trapUi.spots(this.f.area, F));
    }
    // Scrap piles (v0.70, src/salvageUi.js): every region that has some
    FUP.salvageUi.draw(this, this.f.area, F);
    this.spots.push(...FUP.salvageUi.spots(this, this.f.area, F));
    // The round action button (bottom right) and the "E: Talk" prompt, like in the village
    const W = this.scale.width, H = this.scale.height;
    this.actBtn = this.add.circle(W - 70, H - 120, 42, c.btnHot, 0.95).setStrokeStyle(3, c.btnHotEdge).setScrollFactor(0).setDepth(16000).setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.actBtn.on('pointerdown', () => { FUP.audio.sfx('click'); this.time.delayedCall(1, () => this.interact()); });
    this.actText = ui.text(this, W - 70, H - 120, '', 15, c.ink, { fontStyle: '700', align: 'center', wordWrap: { width: 76 } }).setOrigin(0.5).setScrollFactor(0).setDepth(16001).setVisible(false);
    this.prompt = ui.text(this, 0, 0, '', 13, c.accent, { fontStyle: '700', backgroundColor: FUP.look.hex('k0'), padding: { x: 6, y: 3 } }).setOrigin(0.5, 1).setDepth(6000).setVisible(false);
  },

  // Villagers stand on their square: you walk around them
  solidAt(x, y, half) {
    const T = this.tiles.size();
    return (this.solid || []).some(q => x + half > q.tx * T && x - half < (q.tx + 1) * T && y + half > q.ty * T && y - half < (q.ty + 1) * T);
  },

  // ---------- What's in reach ----------
  nearestThing() {
    let best = null, bestD = FUP.villageData.interactDistance;
    for (const s of this.spots || []) {
      const d = Math.hypot(s.x - this.player.x, s.y - this.player.y);
      if (d < bestD && (!s.reach || d < s.reach)) { best = s; bestD = d; }   // reach: trap squares only count when you're on them
    }
    if (best || !this.feature('fishing')) return best;
    const T = this.tiles.size(), w = FUP.fishing.spotNearRegion(this.f.area, Math.floor(this.player.x / T), Math.floor(this.player.y / T));
    if (!w) return null;
    const c0 = this.tiles.center(w.tx, w.ty);
    return { kind: 'fish', label: '🎣 Fish', spot: w.spot, x: c0.x, y: c0.y };
  },

  updateAction() {
    if (!this.actBtn) return;
    if (this.feature('fishing')) {   // a trap caught something: redraw its count
      const ts = JSON.stringify(FUP.fishing.state.traps.map(t => [t.region, t.tx, t.ty, t.fish.length]));
      if (ts !== this.trapSig) { this.trapSig = ts; FUP.trapUi.draw(this, this.f.area, this.tiles); }
    }
    const s = this.nearestThing();
    this.actBtn.setVisible(!!s); this.actText.setVisible(!!s); this.prompt.setVisible(!!s);
    if (!s) return;
    this.actText.setText(s.label);
    this.prompt.setText(FUP.ui.isTouch(this) ? s.label : `E: ${s.label}`).setPosition(s.x, s.y - (s.sprite ? s.sprite.displayHeight * 0.8 + 16 : 30));
  },

  interact() {
    if (this.tutDialog) { this.tutDialog.next(); return; }   // Orientation Isle: E / Space turns the tutor's page
    if (this.leaving || this.panel || this.pack) return;
    const s = this.nearestThing();
    if (!s) return;
    this.actBtn.setVisible(false); this.actText.setVisible(false); this.prompt.setVisible(false);
    if (s.tut) { this.tutorUse(s); return; }   // tutors, the farm patch, sawhorse, dummy (WorldTutorial.js)
    if (s.kind === 'npc') { this.openPanel(s.id); return; }
    if (s.kind === 'sign') { this.sayLine(s.text); FUP.audio.sfx('click'); return; }
    if (s.kind === 'trap') { FUP.trapUi.use(this, this.f.area, s, this.tiles); return; }
    if (s.kind === 'salvage') {
      FUP.salvageUi.use(this, s, () => {
        FUP.salvageUi.draw(this, this.f.area, this.tiles);
        this.spots = this.spots.filter(q => q.kind !== 'salvage').concat(FUP.salvageUi.spots(this, this.f.area, this.tiles));
      });
      return;
    }
    if (s.kind === 'fish') this.goFish(s);
  },

  // Cast a line from the pier (src/fishingUi.js). Counts as a panel: walking stops.
  goFish(s) {
    const locked = FUP.fishing.spotMissing(s.spot);   // the deep water: Fishing 26
    if (locked.length) {
      const line = Phaser.Utils.Array.GetRandom(FUP.narrator.deepLocked);
      this.sayLine(`${line} (${locked.join(', ')})`);
      FUP.audio.sfx('error');
      return;
    }
    if (!FUP.fishing.canCast(s.spot)) {
      const fish = Object.keys(FUP.fishData.spots[s.spot].fish), low = Math.min(...fish.map(id => FUP.fishData.fish[id].level));
      if (FUP.fishing.level() < low) this.say('fishTooLow', { item: low });
      else this.say('fishFull');
      FUP.audio.sfx('error');
      return;
    }
    if (!FUP.facts.has('flag:rodFound')) { FUP.facts.set('flag:rodFound', 1); this.say('rodFound'); }
    const g = FUP.fishingUi.open(this, s.spot, { x: s.x, y: s.y }, () => {
      if (this.panel === g) { this.panel = null; this.panelId = null; }
      this.drawSatchel(); this.refreshHud(); this.saveHere();
    });
    this.panel = g; this.panelId = 'fish';
  },

  // ---------- Safe regions: greetings and saving ----------
  // A line when you arrive: the region's own first-visit line once, then its "back again" line (if it has one)
  greetSafe() {
    const id = this.f.area, flag = 'flag:greeted_' + id;
    if (!FUP.facts.has(flag)) { FUP.facts.set(flag, 1); this.say(id + 'Arrive'); }
    else this.say(id + 'Back');
  },
  // Safe regions save where you stand, so a reload wakes you here (not on a trip: nothing to lose)
  saveHere() {
    if (!this.safe) return;
    FUP.world.remember(this.player.x, this.player.y);
    FUP.save.write(false);
  },
  keepSaving() {
    this.saveHere();
    this.time.addEvent({ delay: 5000, loop: true, callback: () => { if (!this.leaving) this.saveHere(); } });
  },

  // The narrator bar with a line that isn't from data/narrator.js (signs, villagers' news)
  sayLine(line) {
    this.narratorText.setFontSize(17).setText(line);
    if (this.narratorText.height > 44) this.narratorText.setFontSize(14);
    if (this.showBar) this.showBar();
  },
});
