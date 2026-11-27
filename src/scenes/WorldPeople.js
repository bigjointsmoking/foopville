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
      if (n.tint && s.setTint) s.setTint(n.tint);   // placeholder looks (Ledgerwick's townsfolk, Phase D)
      this.tweens.add({ targets: s, scaleY: s.scaleY * 1.04, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const tag = ui.text(this, c0.x, c0.y - s.displayHeight * 0.8 - 2, n.name.replace('The ', ''), 11, c.ink, { stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
      this.spots.push({ kind: 'npc', id: p.id, x: c0.x, y: c0.y, sprite: s, tag, label: 'Talk' });
      this.solid.push({ tx: p.tx, ty: p.ty });
    }
    if (this.feature('objects')) for (const o of info.objects || []) {
      const c0 = at(o.tx, o.ty);
      if (o.kind === 'sign') {   // (v0.82: emoji + label for other readable things, like the frog's strongbox)
        // (E4 lore: hidden = nothing drawn, the thing is already on the map; scale = a smaller big picture; solid = walk around it)
        if (o.hidden) { /* no picture */ }
        else if (o.sprite) { const p = ui.sprite(this, c0.x, c0.y, o.sprite, o.emoji || '🪧', 24).setDepth(c0.y + 10); if (o.scale && this.textures.exists(o.sprite)) p.setScale(p.scaleX * o.scale); }   // (v0.84: its own picture)
        else this.add.text(c0.x, c0.y, o.emoji || '🪧', { fontSize: '24px' }).setOrigin(0.5).setDepth(c0.y + 10);
        if (o.solid) this.solid.push({ tx: o.tx, ty: o.ty });
        this.spots.push({ kind: 'sign', x: c0.x, y: c0.y, label: o.label || 'Read', text: o.text });
      }
      if (o.kind === 'office') {   // a boss's office (v0.93: the Senior Partner): book a fight for a fee
        this.add.text(c0.x, c0.y, o.emoji || '🚪', { fontSize: '26px' }).setOrigin(0.5).setDepth(c0.y + 10);
        ui.text(this, c0.x, c0.y - 22, 'OFFICE', 10, c.ink, { stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
        this.spots.push({ kind: 'office', o, x: c0.x, y: c0.y, label: o.label || 'Office' });
        this.solid.push({ tx: o.tx, ty: o.ty });
      }
      if (o.kind === 'lair') {   // (v1.39) a boss in the open (the Causeway Serpent): fight it there, free; it rests after each win
        const boss = FUP.enemies[o.boss];
        const pic = ui.sprite(this, c0.x, c0.y, boss.mapSprite, boss.emoji, 30).setDepth(c0.y + 10);
        this.tweens.add({ targets: pic, y: c0.y - 3, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        ui.text(this, c0.x, c0.y - 24, 'DEEP WATER', 10, c.ink, { stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
        this.spots.push({ kind: 'lair', o, x: c0.x, y: c0.y, label: o.label || 'Look' });
        this.solid.push({ tx: o.tx, ty: o.ty });
      }
    }
    // The old shrine (v0.82): after your first Guardian win (v1.38), feed the Guardian a dish here (src/systems/shrine.js)
    const SH = FUP.raidData.shrine;
    if (SH && SH.region === this.f.area) {
      const c0 = at(SH.tx, SH.ty);
      ui.sprite(this, c0.x, c0.y, 'prop_shrine', '🕯️', 24).setDepth(c0.y + 10);
      ui.text(this, c0.x, c0.y - 22, 'SHRINE', 10, c.ink, { stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
      this.spots.push({ kind: 'shrine', x: c0.x, y: c0.y, label: 'Shrine' });
      this.solid.push({ tx: SH.tx, ty: SH.ty });
    }
    // Quests (v0.79): 🔍 search spots and ❗ / 📜 over villagers out here (redrawn by refreshQuestMarks)
    this._qSig = null; this._qMarks = []; this._guests = [];
    this.refreshQuestMarks(true);
    // Special fishing spots (v0.78): a glint on the water
    for (const sp of (FUP.fishData.specials || []).filter(s => s.region === this.f.area)) {
      const c0 = at(sp.tx, sp.ty);
      const g = this.add.text(c0.x, c0.y, '✨', { fontSize: '20px' }).setOrigin(0.5).setDepth(c0.y + 5);
      this.tweens.add({ targets: g, alpha: { from: 0.35, to: 1 }, scale: { from: 0.8, to: 1.1 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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

  // Quest markers and 🔍 spots on this map; cheap to call every second
  refreshQuestMarks(force = false) {
    const sig = FUP.questUi.signature(this.f.area);
    if (!force && sig === this._qSig) return;
    this._qSig = sig;
    const center = (tx, ty) => this.tiles.center(tx, ty);
    this.drawGuests();
    if (this.placeQuestFoes) this.placeQuestFoes();
    FUP.questUi.marks(this, this.f.area, center, (this.spots || []).filter(s => s.kind === 'npc').map(s => ({ id: s.id, sprite: s.sprite })));
    this.spots = (this.spots || []).filter(s => s.kind !== 'qsearch').concat(FUP.questUi.spots(this.f.area, center));
  },

  // The shrine window (v0.82): pick a dish to leave, and the Guardian comes up to fight
  openShrine() {
    const S = FUP.shrine, L = S.data().lines, o = S.open();
    if (!o.ok) { this.sayLine(o.why); FUP.audio.sfx('click'); return; }
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 26000, list = S.dishes();
    const g = [], add = (x, d = 0) => { x.setScrollFactor(0).setDepth(Z + d); g.push(x); return x; };
    const close = () => { g.forEach(x => x.destroy()); this.panel = null; };
    this.panel = { destroy: close };   // walking stops while it's open
    const h = 150 + (list.length + 1) * 46;
    add(ui.shade(this, 0.6));
    add(ui.panel(this, W / 2 - 260, H / 2 - h / 2, 520, h, 'panel'), 1);
    add(ui.text(this, W / 2, H / 2 - h / 2 + 16, '🕯️ The Old Shrine', 18, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
    add(ui.text(this, W / 2, H / 2 - h / 2 + 46, L.ask + '\nMore stars, better loot. Once every 20 minutes. It\'s the full Guardian.', 13, c.ink, { fontStyle: 'italic', align: 'center', wordWrap: { width: 470 } }).setOrigin(0.5, 0), 2);
    const btn = (k, label, fn, hot) => { const b = ui.button(this, W / 2 - 230, H / 2 - h / 2 + 110 + k * 46, 460, 38, label, fn, { size: 14, hot }); [b.rect, b.txt].forEach(x => add(x, 3)); b.txt.setDepth(Z + 4); };
    list.forEach((e, k) => btn(k, `${e.dish.emoji} ${e.dish.name}  ${'★'.repeat(e.stars)}${'☆'.repeat(5 - e.stars)}${e.n > 1 ? '  ×' + e.n : ''}`, () => {
      const stars = S.feed(k);
      close();
      this.sayLine(L.summon);
      this.saveHere();
      this.leaving = true;
      FUP.run.battle = { index: -1, type: 'guardian', result: null, shrine: true, stars, dropTier: FUP.raidData.dropTier };
      FUP.audio.sfx('shrine');
      FUP.fx.shake(this, 'boss');
      this.cameras.main.fadeOut(900, 30, 0, 40);
      this.time.delayedCall(930, () => this.scene.start('Battle', { enemies: ['guardian'] }));
    }, k === 0));
    btn(list.length, 'Not now', close, false);
  },

  // (v1.39) Seconds of play until a lair boss is back (0 = ready). Fact 'lair:<boss>' = play second of the last win (+1).
  lairWait(o) { const at = FUP.facts.get('lair:' + o.boss); return at ? Math.max(0, (o.restSeconds || 0) - (FUP.clock.now() - (at - 1))) : 0; },
  // (v1.39) A boss in the open (the Causeway Serpent): free fight; after a win it rests `restSeconds` of play
  openLair(o) {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 26000;
    const boss = FUP.enemies[o.boss], wait = this.lairWait(o);
    if (wait > 0) { this.sayLine(Phaser.Utils.Array.GetRandom(FUP.narrator[o.lines.rest]).replace('{min}', Math.max(1, Math.ceil(wait / 60)))); FUP.audio.sfx('error'); return; }
    const g = [], add = (x, d = 0) => { x.setScrollFactor(0).setDepth(Z + d); g.push(x); return x; };
    const close = () => { g.forEach(x => x.destroy()); this.panel = null; };
    this.panel = { destroy: close };   // walking stops while it's open
    add(ui.shade(this, 0.6));
    add(ui.panel(this, W / 2 - 260, H / 2 - 120, 520, 240, 'panel'), 1);
    add(ui.text(this, W / 2, H / 2 - 104, `${boss.emoji} ${boss.name}`, 18, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
    add(ui.text(this, W / 2, H / 2 - 74, Phaser.Utils.Array.GetRandom(FUP.narrator[o.lines.look]) + '\n\nA boss fight: no running away.', 13, c.ink, { fontStyle: 'italic', align: 'center', wordWrap: { width: 470 } }).setOrigin(0.5, 0), 2);
    const btn = (x, label, fn, hot) => { const b = ui.button(this, x, H / 2 + 60, 220, 42, label, fn, { size: 14, hot }); [b.rect, b.txt].forEach(q => add(q, 3)); b.txt.setDepth(Z + 4); };
    btn(W / 2 - 235, '⚔️ Fight it', () => {
      close();
      this.saveHere();
      this.leaving = true;
      const reg = FUP.world.region(this.f.area);
      FUP.run.battle = { index: -1, type: o.boss, result: null, worldOffice: true, lair: { boss: o.boss, opens: o.opens }, dropTier: (reg && reg.dropTier) || 1 };
      FUP.audio.sfx('encounter');
      FUP.fx.shake(this, 'boss');
      this.cameras.main.fadeOut(700, 0, 20, 30);
      this.time.delayedCall(730, () => this.scene.start('Battle', { enemies: [o.boss] }));
    }, true);
    btn(W / 2 + 15, 'Leave', close, false);
  },

  // A boss's office (v0.93, the Senior Partner): the receptionist books you in for o.cost, every visit
  openOffice(o) {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 26000, R = FUP.req, Q = FUP.quests;
    // Phase D (the Bog Notary): `free` = no fee while that quest is on that step; `freeFirst` = no fee until you've beaten that boss once (v1.38);
    // `openAfter` = shut until that quest is done
    const free = (o.free && Q.state.active[o.free.quest] && (Q.state.active[o.free.quest].step || 0) === o.free.step) || (o.freeFirst && !FUP.facts.has('boss:' + o.boss));
    if (o.openAfter && !free && !Q.done(o.openAfter)) { this.say('officeClosed', { item: o.closedText || 'Closed.' }); FUP.audio.sfx('error'); return; }
    if (free) o = { ...o, cost: {}, text: o.freeText || o.text };
    const boss = FUP.enemies[o.boss], cost = { items: o.cost }, ok = R.canPay(cost);
    const have = Object.entries(o.cost).map(([id, n]) => `${R.itemCount(id)}/${n} ${FUP.ingredients[id].name}s`).join(', ');
    const g = [], add = (x, d = 0) => { x.setScrollFactor(0).setDepth(Z + d); g.push(x); return x; };
    const close = () => { g.forEach(x => x.destroy()); this.panel = null; };
    this.panel = { destroy: close };   // walking stops while it's open
    add(ui.shade(this, 0.6));
    add(ui.panel(this, W / 2 - 260, H / 2 - 120, 520, 240, 'panel'), 1);
    add(ui.text(this, W / 2, H / 2 - 104, `🚪 ${boss.name}`, 18, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
    add(ui.text(this, W / 2, H / 2 - 74, o.text + `\n\n${free ? 'No fee this time.' : `You have ${have}.`} A boss fight: no running away.`, 13, c.ink, { fontStyle: 'italic', align: 'center', wordWrap: { width: 470 } }).setOrigin(0.5, 0), 2);
    const btn = (x, label, fn, hot, off) => { const b = ui.button(this, x, H / 2 + 60, 220, 42, label, fn, { size: 14, hot }); if (off) b.setEnabled(false); [b.rect, b.txt].forEach(q => add(q, 3)); b.txt.setDepth(Z + 4); };
    btn(W / 2 - 235, free ? '🚪 Go in' : ok ? '📄 Book the meeting' : 'Not enough forms', () => {
      if (!R.pay(cost)) return;
      close();
      this.say('officeBooked');
      this.saveHere();
      this.leaving = true;
      const reg = FUP.world.region(this.f.area);
      FUP.run.battle = { index: -1, type: o.boss, result: null, worldOffice: true, dropTier: (reg && reg.dropTier) || 1 };   // (v1.00: was `office`, which the raid's Guardian also set)
      FUP.audio.sfx('doorOpen');
      FUP.fx.shake(this, 'boss');
      this.cameras.main.fadeOut(700, 20, 10, 0);
      this.time.delayedCall(730, () => this.scene.start('Battle', { enemies: [o.boss] }));
    }, ok, !ok);
    btn(W / 2 + 15, 'Leave', close, false);
  },

  // Villagers out here for a quest step (FUP.quests.guestsIn): Pip at the pier, the Keeper in the Forest Edge
  drawGuests() {
    const ui = FUP.ui, c = ui.colors, home = (this.info.npcs || []).map(p => p.id);
    (this._guests || []).forEach(o => o.destroy()); this._guests = [];
    this.spots = (this.spots || []).filter(s => !s.guest);
    for (const g of FUP.quests.guestsIn(this.f.area)) {
      const n = FUP.villageData.npcs[g.npc];
      if (!n || home.includes(g.npc) || this.spots.some(s => s.guest && s.id === g.npc)) continue;
      const c0 = this.tiles.center(g.tx, g.ty);
      const s = FUP.anim.sprite(this, c0.x, c0.y, n.sprite, 'idle', n.emoji, 30).setOrigin(0.5, 0.8).setDepth(c0.y + 14);
      if (n.tint && s.setTint) s.setTint(n.tint);
      const tag = ui.text(this, c0.x, c0.y - s.displayHeight * 0.8 - 2, n.name.replace('The ', ''), 11, c.ink, { stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
      this._guests.push(s, tag);
      this.spots.push({ kind: 'npc', id: g.npc, guest: true, x: c0.x, y: c0.y, sprite: s, label: 'Talk' });
    }
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
    return { kind: 'fish', label: w.special ? '✨ Fish' : '🎣 Fish', spot: w.spot, x: c0.x, y: c0.y };
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
    if (s.kind === 'shrine') { this.openShrine(); return; }
    if (s.kind === 'office') { this.openOffice(s.o); return; }
    if (s.kind === 'lair') { this.openLair(s.o); return; }
    if (s.kind === 'stash') { this.digStash(s.room); return; }   // side rooms (E3, WorldSideRooms.js)
    if (s.kind === 'hank') { this.openHank(s.room); return; }
    if (s.kind === 'qsearch') { FUP.questUi.search(this, s, () => this.refreshQuestMarks(true)); return; }
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
    const locked = FUP.fishing.spotMissing(s.spot);   // the deep water: Fishing 26; special spots (v0.78)
    if (locked.length) {
      const line = Phaser.Utils.Array.GetRandom(FUP.narrator[FUP.fishData.spots[s.spot].special ? 'specialLocked' : 'deepLocked']);
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
  // On a trip (v0.73): save the whole trip (where you stand is in this area's state), marked onRun
  saveHere() {
    if (!this.player) return;
    if (!this.safe) { if (this.A && this.A.player) { this.A.player.x = this.player.x; this.A.player.y = this.player.y; } FUP.save.write(true); return; }
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
