// ============================================================
// VILLAGE FARM — the soil patches on the village map (extra functions for VillageScene).
// Walk onto a patch and press E / the round button (or tap the patch):
//   weeds -> Hoe, soil -> Plant (pick a seed), thirsty -> Water, ready -> Harvest, dead -> Clear.
// Stand next to a pond (or the well, once it's repaired) to fill the watering can.
// Rules are in src/systems/garden.js, numbers in data/garden.js.
// ============================================================
Object.assign(VillageScene.prototype, {

  // ---------- Drawing ----------
  drawFarm() {
    const T = FUP.villageData.tileSize, M = FUP.villageMap;
    this.drawFields();
    this.farmViews = {};
    for (const q of FUP.garden.squares()) {
      const c = M.center(q.tx, q.ty);
      const soil = this.add.image(c.x, c.y, 'farm_weeds').setDisplaySize(T + 2, T + 2).setDepth(-6);
      const crop = this.add.image(c.x, c.y + T * 0.3, 'crop_sprout').setOrigin(0.5, 0.85).setScale(FUP.ui.artScale(2)).setDepth(c.y + T * 0.3).setVisible(false);
      const icon = FUP.ui.text(this, c.x + 13, c.y - 9, '', 13, FUP.ui.colors.ink, { stroke: FUP.ui.colors.stroke, strokeThickness: 3 }).setOrigin(0.5).setDepth(5200);
      this.tweens.add({ targets: icon, y: c.y - 13, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      soil.setInteractive({ useHandCursor: true });
      soil.on('pointerdown', () => { if (!this.panel && !this.busy) this.walkTo = this.patchSpot(q); });
      this.farmViews[q.key] = { q, soil, crop, icon, sig: '' };
    }
    // A sign over each farm plot: its name, and the price while it's for sale
    this.plotSigns = [];
    for (const [ch, fp] of Object.entries(FUP.gardenData.farmPlots)) {
      if (fp.noSign) continue;   // the Village Allotment is spread around: no single sign
      const sq = M.find(ch);
      if (!sq.length) continue;
      const minX = Math.min(...sq.map(q => q.tx)), maxX = Math.max(...sq.map(q => q.tx)), minY = Math.min(...sq.map(q => q.ty));
      const t = FUP.ui.text(this, (minX + maxX + 1) * T / 2, minY * T - 4, '', 12, FUP.ui.colors.accent, { fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 4, align: 'center' }).setOrigin(0.5, 1).setDepth(5000);
      this.plotSigns.push({ ch, fp, t });
    }
    // Water: the well and every pond square
    this.waterTiles = this.findWater();   // the well only counts once it's repaired (VillageRepairs.js)
    this.refreshFarm(true);
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.refreshFarm() });
  },

  // Hollis's fields (data/village.js fields, v0.67): tilled rows, two plants per square, swaying in the wind.
  drawFields() {
    const T = FUP.villageData.tileSize, ui = FUP.ui;
    const n = (x, y, k) => { const v = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
    for (const f of FUP.villageData.fields || []) {
      for (let ty = f.ty; ty < f.ty + f.h; ty++) for (let tx = f.tx; tx < f.tx + f.w; tx++) {
        const x = tx * T, y = ty * T;
        this.add.image(x + T / 2, y + T / 2, 'farm_soil').setDisplaySize(T + 2, T + 2).setDepth(-6);
        for (let k = 0; k < 2; k++) {
          const px = x + T * (0.28 + k * 0.46) + (n(tx, ty, k) - 0.5) * 6, py = y + T * (0.55 + k * 0.35) + (n(tx, ty, k + 3) - 0.5) * 4;
          const s = ui.sprite(this, px, py, f.crop, '', 10).setOrigin(0.5, 0.95).setDepth(py);
          if (n(tx, ty, k + 6) < 0.5 && s.setFlipX) s.setFlipX(true);
        }
      }
    }
  },

  // Redraw patches that changed (crops grow on the real clock, see garden.tick).
  refreshFarm(all = false) {
    const G = FUP.garden, c = FUP.ui.colors;
    if (all && this.plotSigns) for (const { ch, fp, t } of this.plotSigns) {
      const mine = G.owns(ch);
      t.setText(mine ? `${fp.name.toUpperCase()} (YOURS)` : `${fp.name.toUpperCase()} · FOR SALE ${G.plotPrice(ch)} 🪙`).setColor(mine ? c.accent : c.dim);
    }
    for (const v of Object.values(this.farmViews)) {
      const p = G.at(v.q.tx, v.q.ty), look = G.look(p), mine = G.owns(v.q.ch);
      const sig = [look, p.stage, p.crop, p.wet, mine].join('|');
      if (!all && sig === v.sig) continue;
      v.sig = sig;
      v.soil.setTexture(look === 'weeds' ? 'farm_weeds' : 'farm_soil').setDisplaySize(FUP.villageData.tileSize + 2, FUP.villageData.tileSize + 2);
      v.soil.setAlpha(mine ? 1 : 0.92);   // for sale: overgrown, not greyed out (v0.67)
      if (p.wet && look === 'growing') v.soil.setTint(0x8c96b8); else v.soil.clearTint();   // wet soil is darker
      v.crop.setVisible(p.s === 'crop').setRotation(0).clearTint().setScale(FUP.ui.artScale(2));
      if (p.s === 'crop') {
        // v0.67: the painted crops are drawn at their real size (bigger pictures, so no extra scaling)
        let key = 'crop_sprout', scale = 2;
        if (look === 'dead') key = 'crop_dead';
        else if (look === 'ready') key = `crop_${p.crop}_3`;
        else if (p.stage >= 1) { key = `crop_${p.crop}_2`; scale = p.stage === 1 ? 1.7 : 2; }
        v.crop.setTexture(this.textures.exists(key) ? key : 'crop_sprout').setScale(FUP.ui.artScale(scale));
        if (look === 'wilting') v.crop.setTint(0xc8a860).setRotation(0.3);
      }
      const icons = { thirsty: '💧', wilting: '🥀', ready: '✨', dead: '💀' };
      v.icon.setText(mine ? icons[look] || '' : '');
    }
    if (this.farmText) this.refreshFarmHud();
  },

  refreshFarmHud() {
    const G = FUP.garden, c = FUP.ui.colors;
    const ready = G.readyCount(), thirsty = G.thirstyCount();
    const bits = [`💧 Can ${G.state.can}/${G.canMax()}`, `🌰 ${G.seedTotal()} seeds`];
    if (ready) bits.push(`✨ ${ready} ready`);
    if (thirsty) bits.push(`🥀 ${thirsty} thirsty`);
    this.farmText.setText(bits.join('   ')).setColor(thirsty ? c.bad : ready ? c.good : c.ink);
  },

  // ---------- What's under your feet ----------
  patchSpot(q) {
    const c = FUP.villageMap.center(q.tx, q.ty), j = FUP.garden.jobFor(q.tx, q.ty, q.ch);
    return { kind: 'patch', x: c.x, y: c.y, tx: q.tx, ty: q.ty, ch: q.ch, job: j.job, label: j.label };
  },

  // The farm thing you can use from here: the patch you stand on, the nearest patch,
  // or water to fill the can. Returns { spot, dist } or null.
  nearestFarm() {
    const T = FUP.villageData.tileSize, px = this.player.x, py = this.player.y;
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    let best = null, bestD = 30;
    for (const v of Object.values(this.farmViews)) {
      const q = v.q;
      const d = (q.tx === tx && q.ty === ty) ? 0 : Math.hypot(q.tx * T + T / 2 - px, q.ty * T + T / 2 - py);
      if (d < bestD) { best = q; bestD = d; }
    }
    if (best) return { spot: this.patchSpot(best), dist: bestD };
    if (FUP.garden.state.can < FUP.garden.canMax()) {
      for (const w of this.waterTiles) {
        const d = Math.hypot(w.x - px, w.y - py);
        if (d < 54) return { spot: { kind: 'water', x: w.x, y: w.y, label: 'Fill can' }, dist: d };
      }
    }
    return null;
  },

  // ---------- Doing a job ----------
  // Screen position for XP pop-ups (they're drawn on the screen, not the map).
  xpAt(x, y) { const cam = this.cameras.main; return { x: x - cam.scrollX, y: Math.max(110, y - cam.scrollY - 50) }; },

  farmUse(s) {
    const G = FUP.garden, J = FUP.gardenData.jobs;
    if (s.kind === 'water') { this.farmWork(J.fill.seconds, 'water', s, () => { G.fillCan(); this.say('farmFill'); }); return; }
    // Re-check the patch: it may have changed while you walked there
    const fresh = this.patchSpot({ tx: s.tx, ty: s.ty, ch: s.ch });
    const where = this.xpAt(fresh.x, fresh.y), p = G.at(s.tx, s.ty);
    const name = () => (FUP.ingredients[p.crop] || { short: 'crop' }).short || FUP.ingredients[p.crop].name;
    switch (fresh.job) {
      case 'hoe': this.farmWork(J.hoe.seconds, 'hoe', fresh, () => { G.hoe(s.tx, s.ty, where); if (Math.random() < 0.35) this.say('farmHoe'); }); break;
      case 'clear': this.farmWork(J.clear.seconds, 'hoe', fresh, () => { G.hoe(s.tx, s.ty, where); this.say('farmClear'); }); break;
      case 'water': {
        const wilting = p.wilt, item = name();
        this.farmWork(J.water.seconds, 'water', fresh, () => {
          G.water(s.tx, s.ty, where);
          if (wilting) this.say('farmSaved', { item }); else if (Math.random() < 0.3) this.say('farmWater');
        });
        break;
      }
      case 'harvest': this.farmWork(J.harvest.seconds, 'harvest', fresh, () => {
        const r = G.harvest(s.tx, s.ty, where);
        if (!r || !r.got) { FUP.audio.sfx('error'); this.say('gardenBagFull'); return; }
        const ing = FUP.ingredients[r.id];
        this.say(r.left ? 'gardenBagFull' : 'gardenHarvest', { item: `${r.got} ${ing.short || ing.name}` });
        if (r.toPantry) this.sayLine(this.narratorText.text + ` (${r.toPantry} went to the pantry.)`);
        if (r.seed) this.sayLine(this.narratorText.text + ` You also got a ${ing.short || ing.name} seed back.`);
        if (r.golden) this.sayLine(this.narratorText.text + ' And a golden Heartroot. Golden Harvest says hi.');
        if (r.scared) this.sayLine(this.narratorText.text + ' The scarecrow got you one extra. It takes no credit. It has no mouth.');
      }); break;
      case 'plant': this.openSeeds(fresh); break;
      default:
        if (fresh.label === 'For sale') {
          const farm = G.isFarmPlot(s.ch);
          this.say(farm ? 'farmPlotForSale' : 'farmForSale');
          this.openPanel(farm ? 'farmhand' : 'carpenter');
        }
        else if (fresh.label === 'Can empty') this.say('farmCanEmpty');
        else if (G.look(p) === 'dead') this.say('farmDead', { item: name() });
        else FUP.audio.sfx('click');
    }
  },

  // Stand still for a moment doing the job (a little animation), then `done`.
  farmWork(seconds, kind, s, done) {
    this.busy = true;
    this.walkTo = null; this.path = null;
    this.prompt.setVisible(false); this.actBtn.setVisible(false); this.actText.setVisible(false);
    if (s.x !== this.player.x) this.player.setFlipX(s.x < this.player.x);
    const reps = Math.max(1, Math.round(seconds / 0.25));
    this.tweens.add({ targets: this.player, angle: { from: 0, to: kind === 'water' ? 10 : -14 }, scaleY: this.player.scaleY * 0.92, duration: (seconds * 1000) / (reps * 2), yoyo: true, repeat: reps - 1 });
    for (let i = 0; i < reps; i++) this.time.delayedCall((seconds * 1000 / reps) * i, () => { FUP.audio.sfx(kind === 'harvest' ? 'pickup' : kind); this.farmBits(kind, s.x, s.y); });
    this.time.delayedCall(seconds * 1000 + 30, () => {
      this.player.setAngle(0);
      this.busy = false;
      done();
      this.refreshFarm();
      this.refreshHud();
      FUP.save.write();
    });
  },

  // Little flying bits: dirt for hoeing, drops for water, leaves for harvesting.
  farmBits(kind, x, y) {
    FUP.fx.burst(this, x, y + 4, kind, y + 40);   // colours and amounts: data/look.js feel.particles
  },

  // ---------- Picking a seed ----------
  openSeeds(s) {
    const ui = FUP.ui, c = ui.colors, G = FUP.garden, D = FUP.gardenData, W = this.scale.width, H = this.scale.height;
    const ids = G.seedIds();
    if (!ids.length) { FUP.audio.sfx('error'); this.say('farmNoSeeds'); return; }
    const g = this.add.group(), fix = o => { o.setScrollFactor(0).setDepth(17000); g.add(o); return o; };
    const rowH = 54, w = 420, h = 92 + ids.length * rowH, x = (W - w) / 2, y = Math.max(70, (H - h) / 2);
    fix(FUP.ui.shade(this, 0.45));
    fix(FUP.ui.panel(this, x, y, w, h, 'panel').setAlpha(0.97));
    fix(ui.text(this, x + 16, y + 12, 'PLANT A SEED', 18, c.accent, { fontStyle: '700' }));
    fix(ui.text(this, x + 16, y + 36, `Uses 1 seed. Gives back ${D.yieldMin}-${G.maxYield()}. Water it ${D.stages} times.`, 12, c.dim));
    const btns = [];
    const button = (bx, by, bw, bh, label, fn, opts) => { const b = ui.button(this, bx, by, bw, bh, label, fn, opts); for (const o of [b.rect, b.txt]) fix(o); btns.push(b); return b; };
    // Compost (v0.41): on by default when you have some
    const have = G.compostState().ready;
    this.useCompost = have > 0;
    if (have) {
      const cb = button(x + w - 200, y + 10, 184, 26, '', () => { this.useCompost = !this.useCompost; label(); }, { size: 12 });
      const label = () => cb.txt.setText(`${this.useCompost ? '☑' : '☐'} Use Compost (${have})`);
      label();
    }
    ids.forEach((id, i) => {
      const ry = y + 60 + i * rowH, ing = FUP.ingredients[id], crop = D.crops[id], ok = G.canGrow(id);
      fix(FUP.ui.panel(this, x + 12, ry, w - 24, rowH - 6, 'inset'));
      fix(ui.sprite(this, x + 34, ry + (rowH - 6) / 2, 'ing_' + id, ing.emoji, 22));
      fix(ui.text(this, x + 58, ry + 6, `${ing.name} seeds  ×${G.seedCount(id)}`, 14, c.ink, { fontStyle: '700' }));
      fix(ui.text(this, x + 58, ry + 26, ok ? `${G.timeText(G.growTime(id))} to grow · +${crop.plantXp} XP now, +${crop.harvestXp} at harvest` : `🔒 Gardening Lv ${crop.level}`, 11, ok ? c.info : c.dim));
      button(x + w - 92, ry + 8, 72, 32, 'Plant', () => {
        close();
        this.farmWork(D.jobs.plant.seconds, 'plop', s, () => {
          const r = G.plant(s.tx, s.ty, id, this.xpAt(s.x, s.y), Math.random, this.useCompost);
          if (r) this.say(r.composted ? 'gardenCompost' : 'gardenPlant', { item: ing.short || ing.name });
        });
      }, { size: 14, hot: ok, disabled: !ok }).setEnabled(ok);
    });
    button(x + w - 108, y + h - 40, 92, 30, 'Cancel', () => close(), { size: 14 });
    const close = () => {
      if (this.panel !== panel) return;
      btns.forEach(b => b.destroy()); g.destroy(true);
      this.panel = null; this.panelId = null;
    };
    const panel = { destroy: close };
    this.panel = panel; this.panelId = 'seeds';
  },
});
