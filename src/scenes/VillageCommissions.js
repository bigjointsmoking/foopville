// ============================================================
// VILLAGE COMMISSIONS (v0.70) — extra functions for VillageScene.
// Build sites on the map: a stake + sign (open / locked), scaffolding with a
// timer (building), a ✅ (ready), then the finished build for good.
// Walk up and press the button: the site's window (who wants what, the cost,
// the pay, Start building / Finish).
// Rules in src/systems/commissions.js, the jobs in data/commissions.js.
// ============================================================
Object.assign(VillageScene.prototype, {

  // (Re)draw every site. Safe to call again.
  drawCommissions() {
    (this._comViews || []).forEach(o => o.destroy());
    this._comViews = [];
    this.spots = (this.spots || []).filter(s => s.kind !== 'commission');
    const C = FUP.commissions, T = FUP.villageData.tileSize, ui = FUP.ui, c = ui.colors, keep = o => { this._comViews.push(o); return o; };
    this._comSig = this.commissionSig();
    for (const job of C.list()) {
      const st = C.status(job.id);
      if (st === 'hidden') continue;
      const s = job.site, x = (s.tx + s.w / 2) * T, base = (s.ty + s.h) * T, mid = (s.ty + s.h / 2) * T;
      if (st === 'done') {
        const pic = keep(ui.sprite(this, x, base + 2, job.sprite, job.emoji, 30).setOrigin(0.5, 1));
        if (this.textures.exists(job.sprite)) pic.setScale(s.w * T * (s.w === 1 ? 1.35 : 1.05) / pic.width);   // one-square builds a bit bigger than their square
        pic.setDepth(base);
        keep(this.add.ellipse(x, base - 4, s.w * T * 0.85, T * 0.3, 0x000000, 0.25).setDepth(base - 30));
        continue;   // nothing to use any more
      }
      let pic;
      if (st === 'building' || st === 'ready') {
        pic = keep(ui.sprite(this, x, base + 2, 'build_scaffold', '🏗️', 30).setOrigin(0.5, 1));
        if (this.textures.exists('build_scaffold')) pic.setScale(s.w * T * 1.0 / pic.width);
        const t = keep(ui.text(this, x, base - (pic.displayHeight || 40) - 4, '', 12, st === 'ready' ? c.good : c.accent, { fontStyle: '700', stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000));
        t.update = () => t.setText(C.status(job.id) === 'ready' ? '✅ READY' : '🔨 ' + FUP.garden.timeText(C.secondsLeft(job.id)));
        t.update(); this._comTimers = (this._comTimers || []).filter(o => o.active).concat(t);
      } else {
        // A stake with a sign: open = bright, locked = dim
        const g = keep(this.add.graphics().setDepth(base));
        g.lineStyle(2, FUP.look.num('y2'), st === 'open' ? 0.8 : 0.35);
        g.strokeRect(s.tx * T + 4, s.ty * T + 4, s.w * T - 8, s.h * T - 8);
        pic = keep(ui.sprite(this, x, base - 6, 'deco_signpost', '🪧', 22).setOrigin(0.5, 1).setDepth(base));
        if (st === 'locked') pic.setAlpha(0.5);
        keep(ui.text(this, x, base - (pic.displayHeight || 30) - 8, st === 'open' ? `${job.emoji} JOB` : '🔒', 11, st === 'open' ? c.accent : c.dim, { fontStyle: '700', stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000));
      }
      pic.setDepth(base);
      const label = st === 'ready' ? '✅ Finish' : st === 'building' ? '🏗️ Building' : st === 'open' ? '🔨 Job' : '🔒 Job';
      this.spots.push({ kind: 'commission', id: job.id, x, y: mid + T * 0.4, sprite: pic, label });
    }
  },
  // Changes when a site's state changes (redraw then)
  commissionSig() { return FUP.commissions.list().map(j => FUP.commissions.status(j.id)).join(','); },
  // Every second: timers tick, and a site that just became ready / available redraws
  refreshCommissions() {
    if (this.commissionSig() !== this._comSig) { this.drawCommissions(); return; }
    for (const t of this._comTimers || []) if (t.active) t.update();
  },

  // ---------- The site's window ----------
  openCommission(s) {
    const ui = FUP.ui, c = ui.colors, C = FUP.commissions, job = C.get(s.id), st = C.status(job.id), npc = FUP.villageData.npcs[job.npc];
    if (st === 'ready') { this.finishCommission(job); return; }
    this.repairWindow('commission', 520, 268, ({ x, y, w, fix, button, close }) => {
      fix(ui.text(this, x + 16, y + 12, `${job.emoji} ${job.name.toUpperCase()}`, 17, c.accent, { fontStyle: '700', wordWrap: { width: w - 32 } }));
      fix(ui.text(this, x + 16, y + 40, `${npc.name}:`, 13, c.dim, { fontStyle: '700' }));
      fix(ui.text(this, x + 16, y + 58, `"${job.ask}"`, 13, c.ink, { fontStyle: 'italic', wordWrap: { width: w - 32 } }));
      if (st === 'building') {
        fix(ui.text(this, x + 16, y + 132, `🔨 Under construction: ${FUP.garden.timeText(C.secondsLeft(job.id))} left. It keeps building while you're away.`, 13, c.good, { wordWrap: { width: w - 32 } }));
        return;
      }
      const why = FUP.req.missing(job.req), can = !why.length && C.canPay(job.id);
      fix(ui.text(this, x + 16, y + 118, `Needs: ${FUP.req.costText(job.cost)}`, 14, c.ink, { fontStyle: '700', wordWrap: { width: w - 32 } }));
      fix(ui.text(this, x + 16, y + 142, `You have: ${FUP.mats.text()}`, 12, c.dim, { wordWrap: { width: w - 32 } }));
      fix(ui.text(this, x + 16, y + 162, `Pays ${job.pay} 🪙 + ${job.xp} Building XP  ·  takes ${job.minutes} min to build`, 12, c.info));
      if (why.length) fix(ui.text(this, x + 16, y + 184, 'Needs ' + why.join(', '), 12, c.bad));
      else if (!can) fix(ui.text(this, x + 16, y + 184, 'Not enough materials. Scrap piles: fallen trees, sheds, broken carts, wrecks.', 12, c.bad, { wordWrap: { width: w - 32 } }));
      button(x + 16, y + 226, 160, 30, '🏗️ Start building', () => {
        const r = C.start(job.id);
        if (r !== 'ok') { FUP.audio.sfx('error'); return; }
        close();
        FUP.audio.sfx('chop'); FUP.fx.burst(this, s.x, s.y, 'poof', s.y + 40);
        this.say('commissionStart');
        this.drawCommissions(); this.refreshHud();
        FUP.save.write();
      }, { size: 14, hot: can }).setEnabled(can);
    });
  },

  finishCommission(job) {
    const T = FUP.villageData.tileSize, s = job.site, x = (s.tx + s.w / 2) * T, y = (s.ty + s.h / 2) * T;
    const r = FUP.commissions.finish(job.id, this.xpAt(x, y));
    if (!r) return;
    FUP.fx.burst(this, x, y, 'crit', y + 40); FUP.fx.burst(this, x, y, 'pickup', y + 40);
    FUP.fx.shake(this, 'big');
    FUP.audio.sfx('fanfare');
    this.drawCommissions();
    this.villageBanner(`${job.name.toUpperCase()}: BUILT`);
    const npc = FUP.villageData.npcs[job.npc];
    this.sayLine(`${npc.name.replace('The ', '')}: "${job.thanks}"  (+${r.pay} 🪙)`);
    this.refreshHud();
    FUP.save.write();
  },
});
