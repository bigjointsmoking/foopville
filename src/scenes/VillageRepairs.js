// ============================================================
// VILLAGE REPAIRS — the run-down village (extra functions for VillageScene).
//   The Restoration Board (by the well): every repair, what it costs, what it unlocks.
//   Walk up to a ruin and press E / the round button: pay, hammer it, done.
//   The repaired well: fill your watering can, or make a wish (once a day).
// Rules in src/systems/repairs.js, numbers in data/repairs.js.
// ============================================================
Object.assign(VillageScene.prototype, {

  // ---------- Drawing (every visit: this screen is reused) ----------
  drawRepairs() {
    const R = FUP.repairs, D = FUP.repairData, M = FUP.villageMap, ui = FUP.ui, c = ui.colors;
    (this.repairBits || []).forEach(o => { if (o.active) o.destroy(); });
    this.repairBits = [];
    this.spots = this.spots.filter(s => !s.repair);   // drop last drawing's ruins / well / sign
    const keep = o => { this.repairBits.push(o); return o; };

    // The Restoration Board
    const bp = M.center(D.boardSpot.tx, D.boardSpot.ty);
    if (!this.boardSprite || !this.boardSprite.active) {
      this.boardSprite = ui.sprite(this, bp.x, bp.y + 14, 'vil_board', '📋', 30).setOrigin(0.5, 1).setDepth(bp.y + 14).setTint(0xd8c8a0);
      this.boardSprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (!this.panel && !this.busy) this.walkTo = this.spots.find(s => s.kind === 'repairBoard'); });
      ui.text(this, bp.x, bp.y + 14 - this.boardSprite.displayHeight - 2, 'REPAIRS', 11, c.accent, { fontStyle: '700', stroke: c.stroke, strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(5000);
    }
    this.spots.push({ id: 'repairBoard', kind: 'repairBoard', repair: true, x: bp.x, y: bp.y, sprite: this.boardSprite, label: '📋 Repairs' });

    for (const r of R.list()) {
      if (!r.site) continue;
      const s = r.site, done = R.done(r.id), pic = this.repairSprites && this.repairSprites[r.id];
      if (pic) { if (done || !r.ruinTint) pic.clearTint(); else pic.setTint(FUP.look.num(r.ruinTint)); }
      const talk = M.center(s.talk.tx, s.talk.ty);
      if (!done) {
        for (let ty = s.ty; ty < s.ty + s.h; ty++) for (let tx = s.tx; tx < s.tx + s.w; tx++) {
          if (!r.ruinEmoji) continue;
          const p = M.center(tx, ty);
          keep(this.add.text(p.x, p.y, r.ruinEmoji, { fontSize: '24px' }).setOrigin(0.5).setDepth(p.y + 20));
        }
        for (const k of r.clutter || []) { const p = M.center(k.tx, k.ty); keep(this.add.text(p.x, p.y + 6, k.emoji, { fontSize: '18px' }).setOrigin(0.5).setDepth(p.y + 6)); }
        this.spots.push({ id: r.id, kind: 'repairSite', repair: true, x: talk.x, y: talk.y - 20, label: '🔨 Repair' });
      } else if (r.id === 'well') {
        this.spots.push({ id: 'well', kind: 'well', repair: true, x: talk.x, y: talk.y - 20, label: '⛲ Well' });
      }
      // A repaired building: its picture on the site, and a shop window at the talk square
      if (done && r.doneEmoji) {
        const mid = M.center(s.tx + (s.w - 1) / 2, s.ty + (s.h - 1) / 2), size = Math.min(s.w, 3) * 22 + 10;
        const pic = keep(this.add.text(mid.x, mid.y + 10, r.doneEmoji, { fontSize: size + 'px' }).setOrigin(0.5, 0.75).setDepth(mid.y + 30));
        if (r.id === 'windmill') this.tweens.add({ targets: pic, angle: { from: -5, to: 5 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });   // creaks in the wind
        const kind = r.id === 'market' ? 'market' : r.id === 'windmill' ? 'miller' : null;
        if (kind) this.spots.push({ id: r.id, kind, repair: true, x: talk.x, y: talk.y - 20, label: kind === 'market' ? '🏬 Market' : '🌾 Miller' });
      }
    }
    // Locked ways out of the village (data/world.js links): 🪨 / 🌉 on the gap until it's fixed
    for (const edge of FUP.world.EDGES) {
      const link = FUP.world.blockedBy(edge, 'village');
      if (!link || !link.lockEmoji) continue;
      for (const g of FUP.world.gap('village', edge)) { const p = M.center(g.tx, g.ty); keep(this.add.text(p.x, p.y, link.lockEmoji, { fontSize: '26px' }).setOrigin(0.5).setDepth(p.y + 20)); }
    }
    // (The repaired South Road now leads to the Docks: data/region_docks.js, v0.54)
  },

  // The ground picture changes when a path is repaired
  refreshGround() {
    const key = FUP.repairs.groundKey(), d = FUP.villageData;
    if (this.groundImg && this.groundImg.texture.key !== key) this.groundImg.setTexture(FUP.forestGround.make(this, FUP.villageMap, d.ground, key));
  },

  // First visit of a new life: say how shabby it all is (once)
  rundownLine() {
    if (FUP.facts.has('flag:rundown_seen') || FUP.repairs.list().some(r => FUP.repairs.done(r.id))) return;
    FUP.facts.set('flag:rundown_seen', 1);
    this.time.delayedCall(5200, () => { if (this.scene.isActive()) this.say('rundown'); });
  },

  repairUse(s) {
    if (s.kind === 'repairBoard') { this.openRepairBoard(); return; }
    if (s.kind === 'repairSite') { if (s.id === 'well') this.say('wellBroken'); this.openRepairSite(s); return; }
    if (s.kind === 'well') { this.openWell(s); return; }
    if (s.kind === 'market') { this.renderMarket(); return; }
    if (s.kind === 'miller') { this.renderMiller(); return; }
    if (s.kind === 'sign') { this.sayLine(s.text); FUP.audio.sfx('click'); }
  },

  // ---------- A small window (shared by the board, the ruin, and the well) ----------
  repairWindow(id, w, h, build) {
    const ui = FUP.ui, W = this.scale.width, H = this.scale.height;
    const g = this.add.group(), btns = [], fix = o => { o.setScrollFactor(0).setDepth(17000); g.add(o); return o; };
    const x = (W - w) / 2, y = Math.max(16, (H - h) / 2);
    fix(ui.shade(this, 0.45));
    fix(ui.panel(this, x, y, w, h, 'panel').setAlpha(0.97));
    const button = (bx, by, bw, bh, label, fn, opts) => { const b = ui.button(this, bx, by, bw, bh, label, fn, opts); fix(b.rect); fix(b.txt); btns.push(b); return b; };
    const close = () => {
      if (this.panel !== panel) return;
      btns.forEach(b => b.destroy()); g.destroy(true);
      this.panel = null; this.panelId = null;
      this.refreshHud();
    };
    const panel = { destroy: close };
    this.panel = panel; this.panelId = id;
    this.walkTo = null;
    build({ x, y, w, h, fix, button, close });
    button(x + w - 108, y + h - 42, 92, 30, 'Close', () => close(), { size: 14 });
    return panel;
  },

  // ---------- The Restoration Board ----------
  openRepairBoard() {
    const ui = FUP.ui, c = ui.colors, R = FUP.repairs, list = R.list(), rowH = 56;
    this.say('repairBoard');
    this.repairWindow('repairBoard', 640, 104 + list.length * rowH, ({ x, y, w, fix }) => {
      fix(ui.text(this, x + 16, y + 12, 'RESTORATION BOARD', 18, c.accent, { fontStyle: '700' }));
      fix(ui.text(this, x + 16, y + 36, 'Pay at the ruin itself. Walk up to it and press the button.', 12, c.dim));
      list.forEach((r, i) => {
        const ry = y + 58 + i * rowH, done = R.done(r.id), why = R.why(r.id);
        fix(ui.panel(this, x + 12, ry, w - 24, rowH - 6, 'inset'));
        fix(ui.text(this, x + 24, ry + 8, r.emoji, 22, c.ink));
        fix(ui.text(this, x + 60, ry + 5, `${r.name}  ·  ${FUP.req.costText(R.price(r.id))}`, 14, done ? c.dim : c.ink, { fontStyle: '700' }));
        fix(ui.text(this, x + 60, ry + 26, 'Unlocks: ' + r.unlocks, 11, c.info, { wordWrap: { width: 380 } }));
        const chip = done ? 'Done ✓' : !why.length ? 'Ready. Go to the site.' : why.slice(0, 2).join('\n');
        fix(ui.text(this, x + w - 24, ry + 25, chip, 11, done ? c.good : !why.length ? c.accent : c.dim, { align: 'right', fontStyle: done || !why.length ? '700' : 'normal' }).setOrigin(1, 0.5));
      });
    });
  },

  // ---------- At a ruin: pay and hammer ----------
  openRepairSite(s) {
    const ui = FUP.ui, c = ui.colors, R = FUP.repairs, r = R.get(s.id);
    const why = R.why(r.id), ok = !why.length;
    this.repairWindow('repairSite', 460, 210, ({ x, y, w, fix, button, close }) => {
      fix(ui.text(this, x + 16, y + 12, `${r.emoji} ${r.name.toUpperCase()} (RUINED)`, 18, c.accent, { fontStyle: '700' }));
      fix(ui.text(this, x + 16, y + 42, 'Costs: ' + FUP.req.costText(R.price(r.id)), 14, c.ink, { fontStyle: '700' }));
      fix(ui.text(this, x + 16, y + 66, 'Unlocks: ' + r.unlocks, 12, c.info, { wordWrap: { width: w - 32 } }));
      fix(ui.text(this, x + 16, y + 104, ok ? `+${R.xpFor(r.id)} Building XP` : why.join('\n'), 12, ok ? c.good : c.bad, { wordWrap: { width: w - 150 } }));
      button(x + 16, y + 168 - 4, 120, 32, '🔨 Repair', () => {
        if (!R.can(r.id)) { FUP.audio.sfx('error'); this.say(r.soon || FUP.req.missing(r.req).length ? 'repairLocked' : 'repairBroke'); return; }
        close();
        if (R.start(r.id)) this.hammer(s, r);
      }, { size: 15, hot: ok }).setEnabled(ok);   // greyed out: the red lines above say why
    });
  },

  // Stand still and swing: 3 hits, dust, then the ruin is fixed
  hammer(s, r) {
    const secs = FUP.repairData.workSeconds, swings = 3;
    this.busy = true; this.walkTo = null; this.path = null;
    this.prompt.setVisible(false); this.actBtn.setVisible(false); this.actText.setVisible(false);
    this.refreshHud();
    const site = FUP.villageMap.center(r.site.tx + (r.site.w - 1) / 2, r.site.ty + (r.site.h - 1) / 2);
    this.player.setFlipX(site.x < this.player.x);
    this.tweens.add({ targets: this.player, angle: { from: 0, to: -18 }, duration: (secs * 1000) / (swings * 2), yoyo: true, repeat: swings - 1 });
    for (let i = 0; i < swings; i++) this.time.delayedCall((secs * 1000 / swings) * (i + 0.5), () => { FUP.audio.sfx('chop'); FUP.fx.burst(this, site.x, site.y, 'poof', site.y + 40); });
    this.time.delayedCall(secs * 1000 + 30, () => {
      this.player.setAngle(0);
      this.busy = false;
      FUP.repairs.finish(r.id, this.xpAt(site.x, site.y));
      FUP.fx.burst(this, site.x, site.y, 'crit', site.y + 40); FUP.fx.burst(this, site.x, site.y, 'pickup', site.y + 40);
      FUP.fx.shake(this, 'big');
      FUP.audio.sfx('catch');
      this.drawRepairs(); this.refreshGround();
      if (r.id === 'well') this.waterTiles = this.findWater();
      this.villageBanner(`${r.name.toUpperCase()}: RESTORED`);
      this.say('repairDone.' + r.id);
      this.refreshHud();
      FUP.save.write();
    });
  },

  // A big banner across the screen (like the fights' big moments)
  villageBanner(text) {
    const B = FUP.look.feel.banner, W = this.scale.width;
    const t = FUP.ui.text(this, W / 2, 200, text, B.size, FUP.ui.colors.accent, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 8, align: 'center' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(16500).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: 170, delay: B.holdMs * 2, duration: B.fadeMs, onComplete: () => t.destroy() });
  },

  // ---------- The repaired well ----------
  openWell(s) {
    const ui = FUP.ui, c = ui.colors, R = FUP.repairs, G = FUP.garden, cost = FUP.repairData.wish.cost;
    this.repairWindow('well', 420, 170, ({ x, y, fix, button, close }) => {
      fix(ui.text(this, x + 16, y + 12, '⛲ THE WELL', 18, c.accent, { fontStyle: '700' }));
      const note = R.wishedToday() ? 'You already wished today. Come back tomorrow.' : FUP.run.coins < cost ? `A wish costs ${cost} 🪙. You are short.` : `Toss ${cost} 🪙 in and wish. Once a day.`;
      fix(ui.text(this, x + 16, y + 42, `Watering can: ${G.state.can}/${G.canMax()}`, 13, c.ink));
      fix(ui.text(this, x + 16, y + 64, note, 12, c.dim, { wordWrap: { width: 388 } }));
      const canFill = G.state.can < G.canMax();
      button(x + 16, y + 126, 120, 30, '💧 Fill can', () => {
        close();
        this.farmWork(FUP.gardenData.jobs.fill.seconds, 'water', s, () => { G.fillCan(); this.say('farmFill'); });
      }, { size: 13, disabled: !canFill }).setEnabled(canFill);
      const canWish = R.canWish();
      button(x + 146, y + 126, 140, 30, `🪙 Wish (${cost})`, () => {
        if (!R.canWish()) { FUP.audio.sfx('error'); this.say(R.wishedToday() ? 'wishDone' : 'repairBroke'); return; }
        close();
        this.makeWish(s);
      }, { size: 13, hot: canWish, disabled: !canWish }).setEnabled(canWish);
    });
  },

  makeWish(s) {
    const r = FUP.repairs.wish();
    if (!r) return;
    FUP.audio.sfx('pickup');
    const at = this.xpAt(s.x, s.y + 20);
    FUP.fx.number(this, at.x, at.y, `-${FUP.repairData.wish.cost} 🪙`, FUP.ui.colors.accent, false, 16600).setScrollFactor(0);
    if (r.kind === 'nothing') this.say('wishNothing');
    else {
      this.say('wishWin', { item: r.text });
      this.time.delayedCall(450, () => FUP.fx.number(this, at.x, at.y - 10, '+' + r.text, FUP.ui.colors.good, true, 16600).setScrollFactor(0));
    }
    this.refreshHud(); this.refreshFarm(); FUP.save.write();
  },

  // Water you can fill the can from: ponds always, the well only once it's repaired
  findWater() {
    const M = FUP.villageMap, out = [];
    for (const ch of '~w') {
      if (ch === 'w' && !FUP.repairs.done('well')) continue;
      for (const s of M.find(ch)) out.push(M.center(s.tx, s.ty));
    }
    return out;
  },

  // ---------- The repaired Market: 3 offers a day ----------
  renderMarket(note = '') {
    const ui = FUP.ui, c = ui.colors, R = FUP.repairs, rows = R.marketRows(), names = ['GREENGROCER', 'SEEDS + BAIT', 'CURIOS'];
    if (!note) this.say('marketGreet');
    this.repairWindow('market', 560, 300, ({ x, y, w, fix, button, close }) => {
      fix(ui.text(this, x + 16, y + 12, '🏬 THE MARKET', 18, c.accent, { fontStyle: '700' }));
      fix(ui.text(this, x + 16, y + 36, note || `New offers every day (day ${FUP.clock.day()}). You have ${FUP.run.coins} 🪙.`, 12, note ? c.bad : c.dim));
      rows.forEach((r, i) => {
        const ry = y + 60 + i * 64;
        fix(ui.panel(this, x + 12, ry, w - 24, 58, 'inset'));
        fix(ui.text(this, x + 24, ry + 6, names[i], 10, c.dim, { fontStyle: '700' }));
        if (!r.id) { fix(ui.text(this, x + 24, ry + 26, 'Nothing odd today.', 14, c.dim)); return; }
        fix(ui.text(this, x + 24, ry + 22, `${r.emoji}  ${r.name}`, 15, c.ink, { fontStyle: '700' }));
        fix(ui.text(this, x + 24, ry + 42, `${r.price} 🪙 each · ${r.left} of ${r.stock} left today`, 11, r.left ? c.info : c.dim));
        button(x + w - 130, ry + 13, 104, 32, r.left ? `Buy (${r.price})` : 'Sold out', () => {
          const res = R.buyMarket(i);
          if (res === 'ok') { FUP.audio.sfx('coins'); this.say('marketBought'); close(); this.renderMarket(' '); FUP.save.write(); this.refreshHud(); return; }
          FUP.audio.sfx('error');
          if (res === 'soldOut') this.say('marketSoldOut');
          close(); this.renderMarket(res === 'broke' ? "You can't afford that." : res === 'full' ? 'No room in your backpack.' : ' ');
        }, { size: 13, hot: r.left > 0 && FUP.run.coins >= r.price, disabled: !r.left }).setEnabled(r.left > 0);
      });
    });
  },

  // ---------- The repaired Windmill: flour ----------
  renderMiller(note = '') {
    const ui = FUP.ui, c = ui.colors, R = FUP.repairs, price = R.flourPrice();
    if (!note) this.say('millerGreet');
    this.repairWindow('miller', 440, 180, ({ x, y, fix, button, close }) => {
      fix(ui.text(this, x + 16, y + 12, '🌬️ THE WINDMILL', 18, c.accent, { fontStyle: '700' }));
      fix(ui.text(this, x + 16, y + 42, `🌾 Flour · ${price} 🪙 each`, 15, c.ink, { fontStyle: '700' }));
      fix(ui.text(this, x + 16, y + 66, note.trim() || `For bread, dumplings and pies. You have ${FUP.req.itemCount('flour')}.`, 12, note.trim() ? c.bad : c.dim, { wordWrap: { width: 400 } }));
      const buy = n => () => {
        const got = R.buyFlour(n);
        close();
        if (got) { FUP.audio.sfx('coins'); this.say('millerBought'); FUP.save.write(); this.refreshHud(); this.renderMiller(' '); }
        else { FUP.audio.sfx('error'); this.renderMiller(FUP.run.coins < price ? "You can't afford flour. That's a new low." : 'No room in your backpack.'); }
      };
      button(x + 16, y + 126, 110, 30, `Buy 1 (${price})`, buy(1), { size: 13, hot: true });
      button(x + 136, y + 126, 120, 30, `Buy 5 (${price * 5})`, buy(5), { size: 13 });
    });
  },
});
