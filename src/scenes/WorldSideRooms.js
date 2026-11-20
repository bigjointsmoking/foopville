// ============================================================
// WORLD SIDE ROOMS (E3) — the Forest's hidden clearings, on the map
// (extra functions for WorldScene). Rules: src/systems/siderooms.js,
// numbers: data/siderooms.js.
//   patch  = its ingredients are ordinary pickups (drawThings), its guard an ordinary enemy
//   ambush = invisible: step into the middle and a group jumps you
//   stash  = a chest you Dig up
//   hank   = Hooded Hank's little shop window
// ============================================================
Object.assign(WorldScene.prototype, {

  drawSideRooms() {
    (this._sideViews || []).forEach(o => o.destroy());
    this._sideViews = [];
    this.spots = (this.spots || []).filter(s => s.kind !== 'stash' && s.kind !== 'hank');
    this.ambushCalm = null;
    if (!FUP.sideRooms.has(this.f.area)) return;
    const ui = FUP.ui, c = ui.colors, H = FUP.sideRoomData.hank;
    for (const r of FUP.sideRooms.rooms(this.A)) {
      const p = this.tiles.center(r.tx, r.ty);
      if (r.kind === 'stash' && !r.done) {
        const s = ui.sprite(this, p.x, p.y, 'prop_strongbox', '📦', 24).setDepth(p.y + 8);
        this._sideViews.push(s);
        this.spots.push({ kind: 'stash', room: r, x: p.x, y: p.y, label: 'Dig' });
      }
      if (r.kind === 'hank') {
        const s = this.add.text(p.x, p.y, H.emoji, { fontSize: '30px' }).setOrigin(0.5, 0.8).setDepth(p.y + 14);
        this.tweens.add({ targets: s, scaleY: 1.04, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const tag = ui.text(this, p.x, p.y - 30, H.name, 11, c.ink, { stroke: c.stroke, strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(5000);
        this._sideViews.push(s, tag);
        this.spots.push({ kind: 'hank', room: r, x: p.x, y: p.y, sprite: s, label: 'Talk' });
        this.solid.push({ tx: r.tx, ty: r.ty });
      }
    }
  },

  // ---------- Ambush ----------
  checkAmbush() {
    if (!FUP.sideRooms.has(this.f.area) || this.f.time < this.f.graceUntil) return;
    const T = this.tiles.size();
    if (this.ambushCalm) {   // you ran from it: walk away before it can jump you again
      const r = this.ambushCalm;
      if (Math.hypot(this.player.x - (r.tx * T + T / 2), this.player.y - (r.ty * T + T / 2)) > T * 2) this.ambushCalm = null;
      return;
    }
    const r = FUP.sideRooms.ambushAt(this.A, this.player.x, this.player.y);
    if (r) this.startSideAmbush(r);
  },
  startSideAmbush(r) {
    if (this.leaving) return;
    this.saveHere();   // closed during the fight = back here, and they jump you again
    this.leaving = true;
    const reg = FUP.world.region(this.f.area), D = FUP.sideRoomData.ambush;
    FUP.run.battle = { index: -1, side: { tx: r.tx, ty: r.ty }, type: r.foes[0], result: null, mult: this.info.mult, coinMult: this.info.coinMult,
      areaLevel: this.info.level, dropTier: (reg && reg.dropTier) || 1, surprise: 'ambush', gearChanceMult: D.gearChanceMult };
    this.say('sideAmbush');
    FUP.audio.sfx('ambush');
    FUP.fx.shake(this, 'encounter');
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(700, () => this.scene.start('Battle', { enemies: r.foes.slice() }));
  },
  sideAfterBattle(b) {
    const r = FUP.sideRooms.rooms(this.A).find(q => q.tx === b.side.tx && q.ty === b.side.ty);
    if (b.result === 'win' || b.result === 'charmed') { if (r) r.done = true; this.say('sideAfterAmbush'); }
    else if (b.result === 'fled') {
      this.f.graceUntil = this.f.time + FUP.forestData.fleeGraceSeconds;
      if (r && b.survivors) r.foes = r.foes.slice(0, b.survivors);   // only the ones still standing hide again
      this.ambushCalm = r;
      this.say('forestAfterFlee');
    }
    this.checkRevenge(b.pigeonKills || 0);
  },

  // ---------- Treasure stash ----------
  digStash(r) {
    const res = FUP.sideRooms.dig(r);
    if (!res) return;
    if (res.full) { this.say('stashFull'); FUP.audio.sfx('error'); return; }
    if (res.coins != null) { this.say('stashCoins', { item: res.coins }); this.floatText(`+${res.coins} 🪙`, FUP.ui.colors.accent); FUP.audio.sfx('coins'); }
    else { this.say('stashGear', { item: res.gear.name }); FUP.audio.sfx('pickup'); }
    this.drawSideRooms();
    this.refreshHud();
    this.saveHere();
  },

  // ---------- Hooded Hank ----------
  // His own haggle: one try per Hank per day (kept on the room), never carried to the village shops
  openHank(r) {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 26000;
    const S = FUP.sideRooms, V = FUP.village, run = FUP.run, D = FUP.sideRoomData.hank;
    const before = { haggle: run.haggle, retried: run.haggleRetried };
    run.haggle = r.haggle || null; run.haggleRetried = !!r.retried;
    let g = [], status = Phaser.Utils.Array.GetRandom(D.hello);
    const add = (x, d = 0) => { x.setScrollFactor(0).setDepth(Z + d); g.push(x); return x; };
    const close = () => {
      g.forEach(x => x.destroy()); g = [];
      r.haggle = run.haggle; r.retried = run.haggleRetried;
      run.haggle = before.haggle; run.haggleRetried = before.retried;
      this.panel = null;
      this.refreshHud(); this.drawSatchel(); this.saveHere();
    };
    this.panel = { destroy: close };   // walking stops while it's open
    const render = () => {
      g.forEach(x => x.destroy()); g = [];
      const items = S.shown(r), PH = 200 + items.length * 54, top = H / 2 - PH / 2;
      add(ui.shade(this, 0.6));
      add(ui.panel(this, W / 2 - 300, top, 600, PH, 'panel'), 1);
      add(ui.text(this, W / 2, top + 14, `${D.emoji} ${D.name}`, 18, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
      add(ui.text(this, W / 2, top + 42, status, 13, c.ink, { fontStyle: 'italic', align: 'center', wordWrap: { width: 540 } }).setOrigin(0.5, 0), 2);
      items.forEach((o, k) => {
        const y = top + 92 + k * 54;
        const desc = o.type === 'ingredient' ? `${FUP.ingredients[o.id].rarity} ingredient` : FUP.gear.statText(FUP.gearData.items[o.key].stats) + (o.type === 'lantern' ? '' : ` · ${FUP.gearData.slotNames[FUP.gearData.items[o.key].slot]}`);
        add(this.add.text(W / 2 - 270, y + 4, S.emoji(o), { fontSize: '26px' }), 2);
        add(ui.text(this, W / 2 - 230, y, (o.secret ? '🤫 ' : '') + S.name(o), 15, c.ink, { fontStyle: '700' }), 2);
        add(ui.text(this, W / 2 - 230, y + 20, desc, 12, c.inkDim || c.ink), 2);
        const b = ui.button(this, W / 2 + 140, y, 140, 40, o.sold ? 'Sold' : `Buy ${S.price(o)} 🪙`, () => {
          const res = S.buy(o);
          if (res === 'ok') { FUP.audio.sfx('coins'); status = `Bought: ${S.name(o)}. Hank doesn't ask what for. Neither do you.`; }
          else { FUP.audio.sfx('error'); status = res === 'broke' ? 'Not enough coins. Hank looks disappointed, but in a hood.' : 'No room in your backpack.'; }
          render();
        }, { size: 14, hot: !o.sold });
        if (o.sold) b.setEnabled(false);
        [b.rect, b.txt, b.icon].filter(Boolean).forEach(q => add(q, 3));
      });
      if (S.shown(r).every(o => o.sold)) status = D.soldOut;
      add(ui.text(this, W / 2, top + PH - 96, `You carry ${run.coins} 🪙` + (V.haggled() === 'win' ? ' · haggled: cheaper' : V.haggled() === 'fail' ? ' · haggle failed: dearer' : ''), 13, c.ink).setOrigin(0.5, 0), 2);
      const canHaggle = !V.haggled() || V.canRetryHaggle();
      const hb = ui.button(this, W / 2 - 230, top + PH - 64, 220, 44, `🤝 Haggle ${Math.round(V.haggleChance() * 100)}%`, () => {
        const res = V.tryHaggle();
        if (!res) return;
        FUP.audio.sfx(res.won ? 'charm' : 'boo');
        status = res.won ? 'Hank sighs. "Fine. For you. Don\'t tell the other hoods."' : 'Hank is offended. Prices just went up. He also seems a bit hurt.';
        render();
      }, { size: 14 });
      if (!canHaggle) hb.setEnabled(false);
      [hb.rect, hb.txt, hb.icon].filter(Boolean).forEach(q => add(q, 3));
      const lb = ui.button(this, W / 2 + 10, top + PH - 64, 220, 44, 'Leave', close, { size: 14 });
      [lb.rect, lb.txt, lb.icon].filter(Boolean).forEach(q => add(q, 3));
    };
    // The secret extra thing at Rizz 15, said once per visit
    if (r.stock.some(o => o.secret) && S.shown(r).length > D.items) status = D.secretLine;
    render();
  },
});
