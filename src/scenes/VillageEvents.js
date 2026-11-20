// ============================================================
// VILLAGE SURPRISE EVENTS (phase V3) — extra functions for VillageScene.
// Draws whatever is going on (a peddler, a letter, a tourist, squirrels, rain, a crate,
// sparkles on the pond, a ❗ over Marrowbone) and handles walking up to it.
// Rules in src/systems/events.js, numbers and words in data/events.js.
// ============================================================
Object.assign(VillageScene.prototype, {

  // End of create(): maybe start one, then draw it.
  startEvents() {
    this._evViews = []; this._evRain = null; this._evSig = null;
    const started = FUP.events.enterVillage();
    this.drawEvent();
    if (started) this.time.delayedCall(1200, () => { if (!this.leaving) this.say('eventStart.' + started); });
  },
  eventSig() { const a = FUP.events.active(); return a ? a.id + JSON.stringify(a.data) : ''; },

  // (Re)draw the current event. Safe to call again.
  drawEvent() {
    (this._evViews || []).forEach(o => { if (o.active) { this.tweens.killTweensOf(o); o.destroy(); } });
    this._evViews = []; this._evRain = null;
    this.spots = (this.spots || []).filter(s => s.kind !== 'event');
    this._evSig = this.eventSig();
    const E = FUP.events, a = E.active();
    if (!a) return;
    const e = E.def(a.id), M = FUP.villageMap, ui = FUP.ui, c = ui.colors, keep = o => { this._evViews.push(o); return o; };
    const bob = (o, dy = 5) => this.tweens.add({ targets: o, y: o.y - dy, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const mark = (x, y) => bob(keep(this.add.text(x, y, '❗', { fontSize: '20px' }).setOrigin(0.5, 1).setDepth(5200)));
    const tapWalk = (o, s) => { o.setInteractive({ useHandCursor: true }); o.on('pointerdown', () => { if (!this.panel && FUP.ui.tapToWalk(this)) this.walkTo = s; }); };
    const sp = E.spotOf();

    if (a.id === 'rain') {
      // Streaks over the screen + a blue-grey wash (no ❗: nothing to do but fish)
      const W = this.scale.width, H = this.scale.height;
      keep(this.add.rectangle(0, 0, W, H, FUP.look.num('b2'), 0.22).setOrigin(0).setScrollFactor(0).setDepth(9000));
      this._evRain = [];
      for (let i = 0; i < 90; i++) {
        const d = keep(this.add.rectangle(Math.random() * W, Math.random() * H, 2, 14 + Math.random() * 8, FUP.look.num('b4'), 0.7).setScrollFactor(0).setDepth(9001).setAngle(12));
        d.speed = 380 + Math.random() * 180; this._evRain.push(d);
      }
      return;
    }
    if (a.id === 'market_day') return;   // the stall just sells faster (narrator line on start)
    if (a.id === 'chef_challenge') {
      const n = (this.spots || []).find(s => s.kind === 'npc' && s.id === 'chef');
      if (n) mark(n.x, n.y - n.sprite.displayHeight * 0.8 - 18);
      return;
    }
    if (a.id === 'glitter_pond' && sp) {
      const p = M.center(sp.tx, sp.ty);
      for (let i = 0; i < 6; i++) {
        const s = keep(this.add.text(p.x + (Math.random() - 0.5) * 90, p.y + (Math.random() - 0.5) * 40, '✨', { fontSize: '14px' }).setOrigin(0.5).setDepth(p.y + 5).setAlpha(0));
        this.tweens.add({ targets: s, alpha: 1, duration: 500 + Math.random() * 400, delay: Math.random() * 900, yoyo: true, repeat: -1 });
      }
      return;
    }
    if (a.id === 'crop_thieves') {
      a.data.squares.forEach((q, i) => {
        if (q.gone) return;
        const p = M.center(q.tx, q.ty);
        const s = keep(ui.sprite(this, p.x, p.y, 'squirrel', '🐿️', 22, ui.pixelScale * 0.28).setOrigin(0.5, 0.8).setDepth(p.y + 12));
        this.tweens.add({ targets: s, y: p.y - 6, duration: 260 + i * 40, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
        const spot = { kind: 'event', ev: 'shoo', sq: i, x: p.x, y: p.y, sprite: s, label: '🐿️ Shoo' };
        tapWalk(s, spot); this.spots.push(spot);
      });
      return;
    }
    // Something standing on the map you walk up to: the peddler, the tourist, the crate, the letter
    if (!sp) return;
    const p = M.center(sp.tx, sp.ty), y = a.id === 'pigeon_mail' ? p.y - 6 : p.y;
    const s = keep(ui.sprite(this, p.x + (a.id === 'pigeon_mail' ? 18 : 0), y, null, e.emoji, a.id === 'mystery_crate' ? 26 : 28).setOrigin(0.5, 0.8).setDepth(y + 12));
    if (a.id !== 'mystery_crate') this.tweens.add({ targets: s, scaleY: s.scaleY * 1.05, duration: 800, yoyo: true, repeat: -1 });
    mark(s.x, y - 30);
    const label = { peddler: '🧳 Browse', pigeon_mail: '✉️ Read', lost_tourist: 'Talk', mystery_crate: '📦 Open' }[a.id] || 'Look';
    const spot = { kind: 'event', ev: a.id, x: s.x, y, sprite: s, label };
    tapWalk(s, spot); this.spots.push(spot);
  },

  // Every frame (from update): rain, squirrels, and redraw when the event changed or ended.
  eventTick(dt) {
    if (this._evRain) for (const d of this._evRain) { d.y += d.speed * dt; d.x += d.speed * dt * 0.2; if (d.y > this.scale.height + 10) { d.y = -10; d.x = Math.random() * this.scale.width; } }
    const E = FUP.events;
    if (E.is('crop_thieves')) {
      if (E.thievesTick()) {   // time's up: the rest ran off
        this.say('thievesGone');
      } else if (!this.panel && this.player) {
        for (const s of this.spots) if (s.kind === 'event' && s.ev === 'shoo' && Math.hypot(s.x - this.player.x, s.y - this.player.y) < 18) { this.shooSquirrel(s); break; }
      }
    }
    if (this.eventSig() !== this._evSig) this.drawEvent();
  },

  shooSquirrel(s) {
    if (!FUP.events.shoo(s.sq)) return;
    FUP.audio.sfx('select');
    if (FUP.fx && FUP.fx.burst) FUP.fx.burst(this, s.x, s.y, 'poof', s.y + 20);
    const ing = FUP.ingredients[FUP.eventData.list.crop_thieves.reward];
    if (!FUP.events.is('crop_thieves')) this.say('eventDone.crop_thieves');
    else this.sayLine(`Shooed! It dropped a ${ing.name}.`);
    this.refreshHud();
  },

  // Walked up to it and pressed the button
  eventUse(s) {
    const E = FUP.events;
    if (s.ev === 'shoo') { this.shooSquirrel(s); return; }
    if (s.ev === 'pigeon_mail') {
      const r = E.openMail();
      if (!r) return;
      FUP.audio.sfx('coins');
      this.sayLine(r.coins ? `A letter! Inside: ${r.coins} coins and a note that just says "for the well". You'll take it.` : `A letter! It's one of Marrowbone's riddles (Cooking ${r.level}), unsigned: "${r.riddle}" It's in your recipe book now.`);
      this.refreshHud(); FUP.save.write(); return;
    }
    if (s.ev === 'mystery_crate') {
      const r = E.openCrate();
      if (r === 'full') { this.sayLine('Something rattles inside. Your backpack is full, so it stays shut.'); FUP.audio.sfx('error'); return; }
      if (!r) return;
      FUP.audio.sfx('coins');
      if (FUP.fx && FUP.fx.burst) FUP.fx.burst(this, s.x, s.y - 10, 'poof', s.y + 20);
      this.sayLine(`The crate creaks open: ${r.text}. ` + Phaser.Utils.Array.GetRandom(FUP.narrator.eventDone.mystery_crate));
      this.refreshHud(); FUP.save.write(); return;
    }
    if (s.ev === 'peddler' || s.ev === 'lost_tourist') this.openEventWindow(s.ev);
  },

  // A small window for the peddler's deals and the tourist's dish (counts as a panel)
  openEventWindow(id) {
    if (this.panel) return;
    this.walkTo = null;
    const ui = FUP.ui, c = ui.colors, E = FUP.events, D = FUP.eventData, e = E.def(id), run = FUP.run;
    const W = this.scale.width, H = this.scale.height, DEPTH = 20000, PW = 560, PH = 330, px = (W - PW) / 2, py = (H - PH) / 2;
    const g = { open: true };
    let parts = [], line = Phaser.Utils.Array.GetRandom(id === 'peddler' ? D.peddlerGreet : D.touristGreet), note = '';
    const fix = (o, d = 1) => { o.setScrollFactor(0).setDepth(DEPTH + d); parts.push(o); return o; };
    const btn = (x, y, w, h, label, fn, opts = {}) => {
      const b = ui.button(this, x, y, w, h, label, () => { fn(); if (g.open) draw(); }, { size: 13, ...opts });
      fix(b.rect, 2); fix(b.txt, 3); if (b.icon) fix(b.icon, 3);
      if (opts.disabled) b.setEnabled(false);
      return b;
    };
    const close = () => g.destroy();
    const draw = () => {
      parts.forEach(o => o.destroy()); parts = [];
      if (!E.is(id)) { close(); return; }   // bought everything / he left
      fix(ui.shade(this, 0.6), 0);
      fix(ui.panel(this, px, py, PW, PH, 'panel'));
      fix(ui.text(this, px + 20, py + 16, `${e.emoji} ${e.name.toUpperCase()}`, 19, c.accent, { fontStyle: '700' }), 2);
      btn(px + PW - 96, py + 12, 80, 32, 'Close', close, { hot: true, size: 14 });
      fix(ui.text(this, px + 20, py + 50, `"${line}"`, 13, c.ink, { fontStyle: 'italic', wordWrap: { width: PW - 40 } }), 2);
      let y = py + 92;
      if (id === 'peddler') {
        fix(ui.text(this, px + 20, y, `Each deal once, ${Math.round(e.discount * 100)}% off.`, 12, c.dim), 2);
        E.data().offers.forEach((o, i) => {
          const price = E.offerPrice(o), ry = y + 22 + i * 46;
          fix(ui.panel(this, px + 20, ry, PW - 40, 40, 'inset'), 1);
          fix(ui.text(this, px + 34, ry + 20, `${o.kind === 'seeds' ? '🌱' : o.kind === 'bait' ? FUP.fishData.bait[o.id].emoji : FUP.placeData.items[o.id].emoji}  ${E.offerName(o)}`, 14, o.bought ? c.dim : c.ink).setOrigin(0, 0.5), 2);
          btn(px + PW - 160, ry + 5, 130, 30, o.bought ? 'Sold' : `Buy ${price} 🪙`, () => {
            const r = E.buyOffer(i);
            if (r === 'ok') { FUP.audio.sfx('coins'); note = o.kind === 'place' ? 'In your Build list (🔨).' : ''; if (!E.is(id)) this.say('eventDone.peddler'); }
            else if (r === 'broke') { FUP.audio.sfx('error'); note = 'Not enough coins.'; }
          }, { disabled: o.bought || run.coins < price, size: 13 });
        });
      } else {
        const stacks = E.touristDishes();
        if (!stacks.length) fix(ui.text(this, px + 20, y, D.touristNothing[0] + `\n(He wants a dish of ${e.minStars}★ or better.)`, 13, c.dim, { wordWrap: { width: PW - 40 } }), 2);
        else fix(ui.text(this, px + 20, y, `Give him one dish (${e.minStars}★ or better). He'll give you something back.`, 12, c.dim), 2);
        stacks.slice(0, 5).forEach((st, i) => {
          btn(px + 20, y + 22 + i * 34, PW - 40, 30, `${st.dish.name} (${st.dish.tier}) x${st.n}  ·  Give one`, () => {
            const r = E.feedTourist(st.idx[0]);
            if (r === 'full') { FUP.audio.sfx('error'); note = 'Your backpack is full: make room for what he gives you.'; return; }
            if (r === 'ok') {
              FUP.audio.sfx('eat');
              this.sayLine(`"${Phaser.Utils.Array.GetRandom(D.touristThanks)}" You got a ${FUP.ingredients[E.lastGift].name} and ${e.rizzXp} Rizz XP.`);
            }
          }, { size: 13 });
        });
      }
      if (note) fix(ui.text(this, px + 20, py + PH - 30, note, 13, c.bad), 2);
      this.refreshHud();
    };
    g.destroy = () => {
      if (!g.open) return;
      g.open = false; parts.forEach(o => o.destroy()); parts = [];
      if (this.panel === g) { this.panel = null; this.panelId = null; }
      this.refreshHud(); FUP.save.write();
    };
    this.panel = g; this.panelId = 'event';
    draw();
    return g;
  },
});
