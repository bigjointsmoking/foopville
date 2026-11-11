// ============================================================
// BACKPACK SCREEN (v0.41, Jesus: "make the inventory more apparent, think Minecraft or RuneScape").
// One grid of slots for everything you carry: ingredients stack to 10, dishes to 5,
// gear takes a slot each. Your 5 worn slots on the left. Tap an item for what you can do.
// At home there's a Storage tab for spare gear and food (and the pantry for ingredients).
// Rules live in src/systems/run.js (packMax, slotsUsed, canAddIng...). Numbers in data/run.js.
//
//   FUP.backpack.open(scene, { home: true/false, onChange(), onClose() })   returns { destroy() }
// ============================================================
window.FUP = window.FUP || {};

FUP.backpack = {
  open(scene, opts = {}) {
    const bp = { scene, opts, objs: [], sel: null, tab: 'pack', confirm: null, open: true };
    bp.destroy = () => {
      if (!bp.open) return;
      bp.open = false;
      bp.objs.forEach(o => o.destroy());
      scene.input.keyboard.off('keydown-ESC', bp.destroy);
      if (opts.onClose) opts.onClose();
    };
    scene.input.keyboard.on('keydown-ESC', bp.destroy);
    scene.events.once('shutdown', () => { bp.open = false; });
    this.draw(bp);
    FUP.audio.sfx('select');
    return bp;
  },

  // Everything in the backpack as slot entries, in a steady order.
  entries() {
    const run = FUP.run, S = FUP.runData.stack, out = [];
    for (const id of Object.keys(run.bag).sort()) {
      let n = run.bagCount(id);
      while (n > 0) { const k = Math.min(S.ingredient, n); out.push({ kind: 'ing', id, n: k }); n -= k; }
    }
    for (const st of run.dishStacks()) out.push({ kind: 'dish', dish: st.dish, idx: st.idx, n: st.n });
    run.stash.forEach(it => out.push({ kind: 'gear', item: it, n: 1 }));
    return out;
  },
  // Home storage (spare gear + food), as slot entries
  storeEntries() {
    const H = FUP.house.state, out = [];
    const groups = {};
    (H.dishes || []).forEach((d, i) => { const k = FUP.run.dishKey(d); (groups[k] = groups[k] || { dish: d, idx: [] }).idx.push(i); });
    for (const g of Object.values(groups)) out.push({ kind: 'sdish', dish: g.dish, idx: g.idx, n: g.idx.length });
    (H.gear || []).forEach(it => out.push({ kind: 'sgear', item: it, n: 1 }));
    return out;
  },

  draw(bp) {
    const s = bp.scene, ui = FUP.ui, c = ui.colors, run = FUP.run, W = s.scale.width, H = s.scale.height, Z = 30000;
    bp.objs.forEach(o => o.destroy());
    bp.objs = [];
    const add = (o, d = 0) => { o.setScrollFactor && o.setScrollFactor(0); o.setDepth && o.setDepth(Z + d); bp.objs.push(o); return o; };
    const btn = (x, y, w, h, label, fn, o = {}) => {
      const b = ui.button(s, x, y, w, h, label, () => { fn(); if (bp.open) this.draw(bp); if (bp.opts.onChange) bp.opts.onChange(); }, { size: 13, ...o });
      [b.rect, b.txt, b.icon].filter(Boolean).forEach(x2 => add(x2, 2));
      if (o.disabled) b.setEnabled(false);
      return b;
    };
    add(ui.shade(s, 0.72));
    const PX = 40, PY = 36, PW = W - 80, PH = H - 72;
    add(ui.panel(s, PX, PY, PW, PH, 'panel'), 1);
    add(ui.text(s, PX + 20, PY + 14, { pack: '🎒 BACKPACK', store: '🏠 STORAGE AT HOME', wardrobe: '🎩 WARDROBE' }[bp.tab], 22, c.accent, { fontStyle: '700' }), 2);
    // Your name + title (G2), then this tab's info line (kept left so the tab buttons fit on narrow screens)
    const info = bp.tab === 'pack' ? `${run.slotsUsed()} / ${run.packMax()} slots   ·   🪙 ${run.coins}` : bp.tab === 'store' ? 'Spare gear and food.' : 'Hats and titles. No stats, all style.';
    add(ui.text(s, PX + 20, PY + 42, `${FUP.cosmetics.nameLine()}   ·   ${info}`, 13, c.ink, { fontStyle: '700' }), 2);
    btn(PX + PW - 110, PY + 10, 94, 32, 'Close', () => bp.destroy(), { hot: true, size: 15 });
    if (bp.opts.home) btn(PX + PW - 204, PY + 10, 90, 32, '🏠 Storage', () => { bp.tab = 'store'; bp.sel = null; }, { hot: bp.tab === 'store' });
    if (bp.opts.home || bp.tab === 'wardrobe') btn(PX + PW - 300, PY + 10, 90, 32, '🎒 Pack', () => { bp.tab = 'pack'; bp.sel = null; }, { hot: bp.tab === 'pack' });
    btn(PX + PW - 410, PY + 10, 104, 32, '🎩 Wardrobe', () => { bp.tab = 'wardrobe'; bp.sel = null; }, { hot: bp.tab === 'wardrobe' });
    if (bp.tab === 'wardrobe') { this.drawWardrobe(bp, add, btn, PX, PY, PW); return; }

    // ----- Left: what you're wearing -----
    const G = FUP.gearData, EX = PX + 20, EY = PY + 60;
    add(ui.text(s, EX, EY, 'WEARING', 12, c.dim, { fontStyle: '700' }), 2);
    G.slots.forEach((slot, i) => {
      const y = EY + 18 + i * 66, it = run.equipped[slot], selected = bp.sel && bp.sel.kind === 'worn' && bp.sel.slot === slot;
      const box = add(ui.slot(s, EX, y, 58, selected), 2);
      if (it) add(ui.sprite(s, EX + 29, y + 29, FUP.gear.spriteKey(it), it.emoji, 26, 2), 3);
      else add(ui.text(s, EX + 29, y + 29, G.slotEmoji[slot], 22, c.dim).setOrigin(0.5).setAlpha(0.35), 3);
      add(ui.text(s, EX + 66, y + 20, G.slotNames[slot], 11, c.dim), 2);
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => s.time.delayedCall(1, () => { bp.sel = { kind: 'worn', slot }; bp.confirm = null; this.draw(bp); }));
    });

    // ----- Middle: the grid -----
    const list = bp.tab === 'pack' ? this.entries() : this.storeEntries();
    const total = bp.tab === 'pack' ? run.packMax() : Math.max(16, list.length + (4 - list.length % 4) % 4);
    const cols = Math.max(4, Math.ceil(total / 4)), size = Math.min(62, Math.floor(380 / cols)), GX = PX + 150, GY = PY + 78;
    for (let i = 0; i < total; i++) {
      const x = GX + (i % cols) * (size + 6), y = GY + Math.floor(i / cols) * (size + 6), e = list[i];
      const selected = e && bp.sel && bp.sel.i === i && bp.sel.tab === bp.tab;
      const box = add(ui.slot(s, x, y, size, selected), 2);
      if (!e) continue;
      const pic = e.kind === 'ing' ? [ui.ingKey(e.id), FUP.ingredients[e.id].emoji] : (e.kind === 'dish' || e.kind === 'sdish') ? [FUP.dishArt.key(e.dish), e.dish.emoji] : [FUP.gear.spriteKey(e.item), e.item.emoji];
      add(ui.sprite(s, x + size / 2, y + size / 2, pic[0], pic[1], 24, size >= 56 ? 2 : 1.5), 3);
      if (e.n > 1) add(ui.text(s, x + size - 4, y + size - 3, String(e.n), 13, c.ink, { fontStyle: '700', stroke: c.stroke, strokeThickness: 3 }).setOrigin(1, 1), 4);
      if (e.kind === 'gear' || e.kind === 'sgear') add(s.add.rectangle(x + 3, y + 3, 6, 6, Phaser.Display.Color.HexStringToColor(e.item.color || '#f1ead2').color), 4);
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => s.time.delayedCall(1, () => { bp.sel = { ...e, i, tab: bp.tab }; bp.confirm = null; this.draw(bp); }));
    }
    if (!list.length) add(ui.text(s, GX, GY + 4 * (size + 6) + 6, bp.tab === 'pack' ? 'Empty. Go pick things up.' : 'Nothing stored yet.', 13, c.dim), 2);

    // ----- Right: the selected item -----
    this.drawInfo(bp, add, btn, PX + PW - 250, PY + 60, 230);
  },

  // ---------- Wardrobe (G2): hats and titles, data/cosmetics.js ----------
  drawWardrobe(bp, add, btn, PX, PY, PW) {
    const s = bp.scene, ui = FUP.ui, c = ui.colors, C = FUP.cosmetics, D = FUP.cosmeticData;
    const redrawHat = () => {   // the hat on the map / in the fight changes straight away
      if (s.hat && s.hat.active) s.hat.destroy();
      const hero = s.playerSprite || s.player;
      if (hero) s.hat = C.attachHat(s, hero, s.playerSprite ? 'battle' : 'map');
      FUP.save.write();
    };
    // Hats
    const X = PX + 24, Y = PY + 70, colW = (PW - 72) / 2;
    add(ui.text(s, X, Y, 'HATS', 13, c.dim, { fontStyle: '700' }), 2);
    const hats = Object.keys(D.hats).filter(id => C.has(id));
    if (!hats.length) add(ui.text(s, X, Y + 24, 'No hats yet. The Shopkeeper sells some (Hats tab). Bosses drop rarer ones.', 13, c.dim, { wordWrap: { width: colW - 10 } }), 2);
    hats.forEach((id, i) => {
      const h = D.hats[id], on = C.state.hat === id, y = Y + 24 + i * 46;
      add(ui.text(s, X, y + 4, h.emoji, 24, c.ink), 2);
      add(ui.text(s, X + 40, y + 8, h.name + (on ? '  (wearing)' : ''), 14, on ? c.good : c.ink, { fontStyle: '700' }), 2);
      btn(X + colW - 110, y, 100, 32, on ? 'Take off' : 'Wear', () => { C.wear('hat', on ? null : id); redrawHat(); }, { hot: !on });
    });
    // Titles
    const TX = X + colW + 24;
    add(ui.text(s, TX, Y, 'TITLES', 13, c.dim, { fontStyle: '700' }), 2);
    const got = C.titles();
    Object.entries(D.titles).forEach(([id, t], i) => {
      const y = Y + 24 + i * 52, on = C.state.title === id, ok = got.includes(id);
      add(ui.text(s, TX, y + 2, `"${t.text}"` + (on ? '  (using)' : ''), 14, on ? c.good : ok ? c.ink : c.dim, { fontStyle: '700' }), 2);
      add(ui.text(s, TX, y + 22, ok ? 'Unlocked.' : '🔒 ' + FUP.req.missing(t.req).join(', '), 11, ok ? c.info : c.dim, { wordWrap: { width: colW - 130 } }), 2);
      if (ok) btn(TX + colW - 110, y, 100, 32, on ? 'Remove' : 'Use', () => { C.wear('title', on ? null : id); FUP.save.write(); }, { hot: !on });
    });
  },

  drawInfo(bp, add, btn, X, Y, w) {
    const s = bp.scene, ui = FUP.ui, c = ui.colors, run = FUP.run, sel = bp.sel, home = bp.opts.home, Hs = FUP.house;
    bp.compare = null;
    add(ui.panel(s, X, Y, w, 420, 'inset'), 2);
    if (!sel) { add(ui.text(s, X + 12, Y + 12, 'Tap something to see what it does.', 13, c.dim, { wordWrap: { width: w - 24 } }), 3); return; }
    let title = '', lines = [], color = c.ink;
    const acts = [];
    const drop = (label, fn) => {
      // Dropping needs a second tap
      if (bp.confirm === label) acts.push([`Really drop?`, () => { fn(); bp.sel = null; bp.confirm = null; FUP.audio.sfx('error'); }, { hot: true }]);
      else acts.push([label, () => { bp.confirm = label; }]);
    };
    if (sel.kind === 'worn') {
      const it = run.equipped[sel.slot];
      if (!it) { title = FUP.gearData.slotNames[sel.slot]; lines = ['Nothing worn here.']; }
      else {
        title = it.name; color = it.color || c.ink;
        const fx = FUP.gear.effectInfo(it);
        lines = [`${FUP.gearData.slotNames[it.slot]} · worn`, FUP.gear.statText(it.stats), fx ? `★ ${fx.name}: ${fx.text}` : ''];
        acts.push(['Take off', () => { if (!run.unequip(sel.slot)) FUP.audio.sfx('error'); else FUP.audio.sfx('guard'); }, { disabled: !run.canAddGear() }]);
        if (home) acts.push(['Take off + store', () => { Hs.state.gear.push(it); run.equipped[sel.slot] = null; run.capHp(); }]);
        if (!run.canAddGear()) lines.push('Backpack full: no room to take it off.');
      }
    } else if (sel.kind === 'ing') {
      const ing = FUP.ingredients[sel.id], raw = FUP.cooking.rawDish(sel.id);
      title = ing.name;
      lines = [`x${run.bagCount(sel.id)} in your backpack`, FUP.cooking.rawText(sel.id), `Sells for ${FUP.village.ingredientSellPrice(sel.id)} 🪙 each`];
      if (raw && raw.heal > 0) acts.push(['Eat one raw', () => { const r = run.eatRawAtCamp(sel.id); if (r) FUP.audio.sfx(r.change > 0 ? 'heal' : 'eat'); if (!run.bagCount(sel.id)) bp.sel = null; }]);
      if (home) acts.push(['Store in pantry', () => { if (!Hs.store(sel.id, sel.n)) FUP.audio.sfx('error'); bp.sel = null; }, { disabled: Hs.pantryFull() }]);
      drop('Drop one', () => run.takeFromBag([sel.id]));
    } else if (sel.kind === 'dish') {
      const d = sel.dish;
      title = d.name; color = d.tierColor || c.ink;
      const n = FUP.cooking.stars(d.tier);
      lines = [`${'★'.repeat(n)}${'☆'.repeat(5 - n)} ${d.tier}   ·   x${sel.n} in this stack`, ...FUP.cooking.dishLines(d).map(l => `${l.icon} ${l.text}`), `Sells for ${FUP.village.dishSellPrice(d)} 🪙`];
      acts.push(['Eat one', () => { const r = run.eatAtCamp(run.satchel.indexOf(d)); if (r && r.change !== undefined) FUP.audio.sfx(r.change > 0 ? 'heal' : 'eat'); bp.sel = null; }]);
      if (home) acts.push(['Store one', () => { const i = run.satchel.indexOf(d); if (i >= 0) Hs.state.dishes.push(...run.satchel.splice(i, 1)); bp.sel = null; }]);
      drop('Drop one', () => { const i = run.satchel.indexOf(d); if (i >= 0) run.satchel.splice(i, 1); });
    } else if (sel.kind === 'gear') {
      const it = sel.item, need = FUP.unlocks.wearLevel(it), ok = FUP.unlocks.canWear(it);
      title = it.name; color = it.color || c.ink;
      const fx = FUP.gear.effectInfo(it), wt = FUP.unlocks.wearText(it);
      lines = [`${FUP.gearData.slotNames[it.slot]} · ${it.rarity}${it.tier ? ' · T' + it.tier : ''}`, FUP.gear.statText(it.stats), fx ? `★ ${fx.name}: ${fx.text}` : '', ok ? '' : `Needs ${wt} to wear`, `Sells for ${FUP.village.gearSellPrice(it)} 🪙`];
      bp.compare = it;   // show it next to what you wear (v0.42)
      acts.push([ok ? 'Equip' : wt, () => { if (run.equip(it)) FUP.audio.sfx('guard'); bp.sel = null; }, { disabled: !ok, hot: ok }]);
      if (home) acts.push(['Store', () => { const i = run.stash.indexOf(it); if (i >= 0) Hs.state.gear.push(...run.stash.splice(i, 1)); bp.sel = null; }]);
      drop('Drop', () => { const i = run.stash.indexOf(it); if (i >= 0) run.stash.splice(i, 1); });
    } else if (sel.kind === 'sdish' || sel.kind === 'sgear') {
      const gear = sel.kind === 'sgear', it = gear ? sel.item : sel.dish;
      title = it.name; color = (gear ? it.color : it.tierColor) || c.ink;
      if (gear) bp.compare = it;
      lines = gear ? [`${FUP.gearData.slotNames[it.slot]} · stored at home`, FUP.gear.statText(it.stats)] : [`x${sel.n} stored at home`, ...FUP.cooking.dishLines(it).map(l => `${l.icon} ${l.text}`)];
      const room = gear ? run.canAddGear() : run.canAddDish(it.name, it.tier);
      acts.push(['Take one', () => {
        if (gear) { const i = Hs.state.gear.indexOf(it); if (i >= 0 && run.addGear(it)) Hs.state.gear.splice(i, 1); }
        else { const i = Hs.state.dishes.indexOf(it); if (i >= 0 && run.canAddDish(it.name, it.tier)) run.satchel.push(...Hs.state.dishes.splice(i, 1)); }
        bp.sel = null;
      }, { disabled: !room, hot: room }]);
      if (!room) lines.push('Backpack full.');
    }
    add(ui.text(s, X + 12, Y + 12, title, 16, color, { fontStyle: '700', wordWrap: { width: w - 24 } }), 3);
    const body = add(ui.text(s, X + 12, Y + 56, lines.filter(Boolean).join('\n'), 12, c.ink, { wordWrap: { width: w - 24 }, lineSpacing: 4 }), 3);
    // Gear: compared with what you wear in that slot, green = better, red = worse (v0.42, Jesus)
    if (bp.compare) {
      const cmp = FUP.gear.compare(bp.compare), cy = Y + 64 + body.height;
      const head = !cmp.worn ? 'You wear nothing there.' : `vs your ${cmp.worn.name}:`;
      add(ui.text(s, X + 12, cy, head, 12, c.dim, { fontStyle: '700', wordWrap: { width: w - 24 } }), 3);
      const verdict = { better: ['▲ BETTER', c.good], worse: ['▼ WORSE', c.bad], mixed: ['◆ SOME BETTER, SOME WORSE', c.accent], same: ['= SAME', c.dim], empty: ['▲ PURE UPGRADE', c.good] }[cmp.verdict];
      add(ui.text(s, X + 12, cy + 18, verdict[0], 13, verdict[1], { fontStyle: '700' }), 3);
      cmp.diffs.slice(0, 5).forEach((d, k) => add(ui.text(s, X + 12, cy + 38 + k * 16, `${d.good ? '▲' : '▼'} ${d.text}`, 12, d.good ? c.good : c.bad), 3));
      bp.compare = null;
    }
    acts.forEach(([label, fn, o], i) => btn(X + 12, Y + 290 + i * 40, w - 24, 34, label, fn, o || {}));
  },
};
