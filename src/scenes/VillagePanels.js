// ============================================================
// VILLAGE PANELS — the screens that open when you talk to someone:
// Blacksmith, Shopkeeper, Chef Marrowbone, the Quest Board, and the gate.
// These are extra functions for VillageScene (same scene, split into
// two files to keep each one readable). WorldScene borrows them too (villagers out in the world). Rules live in src/systems/village.js.
// ============================================================
FUP.villagePanels = {

  openPanel(id) {
    this.panelId = id;
    this.panelTab = id === 'shop' ? 'buy' : id === 'carpenter' ? 'house' : null;
    this.panelPage = 0;
    const n = FUP.villageData.npcs[id], obj = (FUP.villageData.objects || {})[id];
    this.speech = n ? Phaser.Utils.Array.GetRandom(n.greet) : obj ? Phaser.Utils.Array.GetRandom(obj.greet) : '';
    if (id === 'quest' && !FUP.quests.available().length && !FUP.quests.activeIds().length) this.speech = n.empty[0];
    if (id === 'carpenter' && FUP.house.LINES.every(l => !FUP.house.next(l))) this.speech = n.maxed[0];
    if (id === 'farmhand' && Object.keys(FUP.gardenData.farmPlots).every(ch => FUP.garden.owns(ch))) this.speech = n.maxed[0];
    // Rizz secrets (blueprint 18.8): at Rizz 10 / 20 / 30 each villager tells you something once.
    // After that, they sometimes greet you with one of those lines.
    const U = FUP.unlocks, secret = n && U.nextSecret(id);
    if (secret) {
      const gift = U.claim(id, secret);
      this.speech = `😎 ${secret.line}` + (gift ? `\n\n(${gift})` : '');
      FUP.audio.sfx('charm');
      FUP.save.write();
    } else if (n && U.heardLine(id) && Math.random() < FUP.unlockData.rizzGreetChance) this.speech = `😎 ${U.heardLine(id)}`;
    FUP.audio.sfx('select');
    this.renderPanel();
  },

  closePanel() {
    if (!this.panel) return;
    const wasGate = this.panelId === 'gate';
    this.panel.destroy(true);
    this.panel = null;
    this.panelId = null;
    this.refreshHud();
    FUP.save.write();
    if (wasGate) this.stepBack();
  },

  // A villager says something (random line from data/village.js).
  talk(key) {
    const lines = FUP.villageData.npcs[this.panelId][key];
    if (lines && lines.length) this.speech = Phaser.Utils.Array.GetRandom(lines);
  },

  // ---------- Building blocks ----------
  pAdd(o) {
    this.panel.add(o);
    if (o.setScrollFactor) o.setScrollFactor(0);
    if (o.setDepth) o.setDepth(20001);
    return o;
  },
  // A button that runs fn, saves, then redraws the panel.
  pBtn(x, y, w, h, label, fn, opts = {}) {
    const b = FUP.ui.button(this, x, y, w, h, label, () => { fn(); if (this.panel) { FUP.save.write(); this.renderPanel(); } }, { size: 14, ...opts });
    for (const o of [b.rect, b.txt, b.icon]) if (o) { this.panel.add(o); o.setScrollFactor(0).setDepth(20002); }
    b.txt.setDepth(20003);
    if (opts.disabled) b.setEnabled(false);
    return b;
  },
  pText(x, y, str, size, color, extra) { return this.pAdd(FUP.ui.text(this, x, y, str, size, color, extra)); },
  pPic(x, y, key, emoji, scale = 1.5) { return this.pAdd(FUP.ui.sprite(this, x, y, key, emoji, 18, scale)); },

  // A list of rows with paging. Each row: { pic, emoji, name, color, sub, btn, fn, disabled, btn2, fn2 }
  pRows(rows, x, y, w, perPage, rowH = 40) {
    const ui = FUP.ui, c = ui.colors;
    const pages = Math.max(1, Math.ceil(rows.length / perPage));
    this.panelPage = Math.min(this.panelPage, pages - 1);
    rows.slice(this.panelPage * perPage, (this.panelPage + 1) * perPage).forEach((r, i) => {
      const ry = y + i * rowH;
      this.pAdd(FUP.ui.panel(this, x, ry, w, rowH - 4, 'inset'));
      if (r.pic !== undefined) this.pAdd(FUP.ui.slot(this, x + 18 - (rowH - 10) / 2, ry + 3, rowH - 10));
      if (r.pic !== undefined) this.pPic(x + 18, ry + (rowH - 4) / 2, r.pic, r.emoji);
      const tx = r.pic !== undefined ? x + 40 : x + 10, bw = (r.btn ? 104 : 0) + (r.btn2 ? 78 : 0);
      this.pText(tx, ry + 3, r.name, 14, r.color || c.ink, { fontStyle: '700', wordWrap: { width: w - (tx - x) - bw - 12 }, maxLines: 1 });
      if (r.sub) this.pText(tx, ry + 20, r.sub, 11, r.subColor || c.info, { wordWrap: { width: w - (tx - x) - bw - 12 }, maxLines: rowH > 44 ? 3 : 1, lineSpacing: 1 });
      if (r.btn) this.pBtn(x + w - 100, ry + (rowH - 4) / 2 - 14, 96, 28, r.btn, r.fn, { disabled: r.disabled, hot: r.hot, size: 13 });
      if (r.btn2) this.pBtn(x + w - 100 - 78, ry + (rowH - 4) / 2 - 14, 72, 28, r.btn2, r.fn2, { size: 12 });
    });
    if (!rows.length) return;
    if (pages > 1) {
      const py = y + perPage * rowH + 2;
      this.pBtn(x, py, 40, 26, '◀', () => { this.panelPage = (this.panelPage + pages - 1) % pages; }, { size: 13 });
      this.pText(x + 52, py + 13, `page ${this.panelPage + 1}/${pages}`, 12, c.dim).setOrigin(0, 0.5);
      this.pBtn(x + 130, py, 40, 26, '▶', () => { this.panelPage = (this.panelPage + 1) % pages; }, { size: 13 });
    }
  },

  // ---------- The frame every villager shares ----------
  renderPanel() {
    if (this.panel) this.panel.destroy(true);
    this.panel = this.add.group();
    if (this.panelId === 'gate') { this.renderGate(); return; }
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height;
    const n = FUP.villageData.npcs[this.panelId] || FUP.villageData.objects[this.panelId];

    this.pAdd(FUP.ui.shade(this, 0.72)).setDepth(20000);
    this.pAdd(FUP.ui.panel(this, 20, 20, W - 40, H - 40, 'panel'));
    // Left: who you're talking to, and what they just said
    this.pAdd(FUP.ui.panel(this, 36, 36, 216, H - 72, 'inset'));
    this.pAdd(FUP.anim.sprite(this, 144, 170, n.portrait, 'idle', n.emoji, 80, 3)).setOrigin(0.5, 0.7);
    this.pText(144, 262, n.name, 16, c.accent, { fontStyle: '700', align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5, 0);
    this.pText(48, 300, `"${this.speech}"`, 14, c.ink, { fontStyle: 'italic', wordWrap: { width: 192 }, lineSpacing: 4 });
    // Top right: coins and Close
    this.pText(W - 44, 72, `🪙 ${FUP.run.coins}`, 16, c.accent, { fontStyle: '700' }).setOrigin(1, 0);
    this.pBtn(W - 136, 32, 96, 34, 'Close', () => this.closePanel(), { hot: true, size: 15 });

    const X = 270, RW = W - 40 - X;
    ({ smith: this.renderSmith, shop: this.renderShop, chef: this.renderChef, quest: this.renderQuests, carpenter: this.renderCarpenter, farmhand: this.renderFarmhand, seeds: this.renderSeeds, compost: this.renderCompost, fishmonger: this.renderFishmonger })[this.panelId].call(this, X, RW);
  },

  // ---------- Blacksmith: weapon upgrades and armor ----------
  renderSmith(X, RW) {
    const ui = FUP.ui, c = ui.colors, G = FUP.gearData, V = FUP.village, run = FUP.run;
    this.pText(X, 36, 'WEAPONS & ARMOR', 20, c.accent, { fontStyle: '700' });
    this.pText(X, 64, this.priceNote(), 12, c.dim);
    const rows = FUP.villageData.smithStock.map(k => {
      const d = G.items[k], price = V.gearPrice(k), worn = run.equipped[d.slot];
      const need = FUP.unlocks.wearLevel(k), weak = !FUP.unlocks.canWear(k);   // weapon upgrades need Melee (data/unlocks.js)
      return {
        // Name + tier + style tag (G1): "Flat Cap · T2 Dapper"
        pic: FUP.gear.spriteKey(k), emoji: d.emoji, name: `${d.names ? d.names[run.weapon] : d.name} · T${d.tier || 1}${d.cut ? ' ' + G.cutNames[d.cut] : ''}`,
        // Compared with what you wear in that slot (v0.42, Jesus): green better, red worse
        sub: weak ? `${G.slotNames[d.slot]} · ${FUP.gear.statText(d.stats)}   ⚔️ Needs ${FUP.unlocks.wearText(k)} to wear` : this.cmpLine(k),
        subColor: weak ? c.bad : this.cmpColor(k),
        btn: `${price} 🪙`, disabled: run.coins < price,
        fn: () => {
          if (!V.buyGear(k)) { this.talk('broke'); return; }
          FUP.audio.sfx('coins');
          if (weak) this.speech = Phaser.Utils.Array.GetRandom(FUP.villageData.npcs.smith.tooWeak).replace(/\{item\}/g, FUP.unlocks.wearText(k));
          else this.talk('bought');
        },
      };
    });
    this.pRows(rows, X, 90, RW, 9);   // 9 a page so the page arrows fit above the note
    this.pText(X, 518, `New gear goes on straight away if that slot is empty. Change what you wear at home. Your Melee: ${FUP.skills.level('melee')} · Combat: ${FUP.req.combatLevel()}.`, 12, c.dim);
  },

  // ---------- Shopkeeper: buy ingredients + trinkets, sell anything ----------
  renderShop(X, RW) {
    const ui = FUP.ui, c = ui.colors, V = FUP.village, run = FUP.run, d = FUP.villageData, G = FUP.gearData;
    this.pBtn(X, 32, 110, 32, 'Buy', () => { this.panelTab = 'buy'; this.panelPage = 0; }, { hot: this.panelTab === 'buy', size: 15 });
    this.pBtn(X + 118, 32, 110, 32, 'Sell', () => { this.panelTab = 'sell'; this.panelPage = 0; }, { hot: this.panelTab === 'sell', size: 15 });
    this.pBtn(X + 236, 32, 110, 32, '🎩 Hats', () => { this.panelTab = 'hats'; this.panelPage = 0; }, { hot: this.panelTab === 'hats', size: 15 });
    if (this.panelTab === 'hats') { this.renderHats(X, RW); return; }

    // Haggle: once per visit
    const h = V.haggled();
    if (!h || V.canRetryHaggle()) {
      this.pBtn(X + 358, 32, 190, 32, `😎 Haggle (${Math.round(V.haggleChance() * 100)}%)`, () => {
        const r = V.tryHaggle();
        if (!r) return;
        this.talk(r.won ? 'haggleWin' : 'haggleFail');
        FUP.audio.sfx(r.won ? 'charm' : 'error');
        if (r.levels.to > r.levels.from) this.sayLine(`Rizz level ${r.levels.to}! Haggling has made you slightly more charming. Slightly.`);
      }, { size: 14 });
    } else {
      this.pText(X + 362, 48, h === 'win' ? 'Haggled: better prices this visit' : 'Haggle failed: prices up this visit', 12, h === 'win' ? c.good : c.bad).setOrigin(0, 0.5);
    }
    this.pText(X, 72, this.priceNote(), 12, c.dim);

    let rows = [];
    if (this.panelTab === 'buy') {
      const full = run.freeSlots() <= 0;
      for (const [id, base] of Object.entries(d.shopIngredients)) {
        const ing = FUP.ingredients[id], price = V.ingredientPrice(id);
        rows.push({
          pic: ui.ingKey(id), emoji: ing.emoji, name: ing.name, sub: `${FUP.cooking.rawText(id)} · in bag: ${run.bagCount(id)}`,
          btn: `${price} 🪙`, disabled: run.coins < price || !run.canAddIng(id),
          fn: () => { const r = V.buyIngredient(id); if (r === 'ok') { FUP.audio.sfx('coins'); this.talk('bought'); } else if (r === 'broke') this.talk('broke'); },
        });
      }
      // Satchels (v0.41): a bigger backpack, bought in order
      const up = run.nextPackUpgrade();
      if (up) {
        const price = V.buyPrice(up.price, 'shop');
        rows.unshift({
          pic: null, emoji: '🎒', name: `${up.name} (backpack ${run.packMax()} → ${run.packMax() - (FUP.runData.packUpgrades[run.packTier - 1] || { slots: 0 }).slots + up.slots} slots)`, sub: up.blurb,
          btn: `${price} 🪙`, disabled: run.coins < price, hot: run.coins >= price,
          fn: () => { if (run.buyPackUpgrade(price)) { FUP.audio.sfx('fanfare'); this.talk('bought'); } else this.talk('broke'); },
        });
      }
      for (const k of d.shopTrinkets) {
        const it = G.items[k], price = V.gearPrice(k);
        rows.push({
          pic: FUP.gear.spriteKey(k), emoji: it.emoji, name: it.name, sub: this.cmpLine(k), subColor: this.cmpColor(k),
          btn: `${price} 🪙`, disabled: run.coins < price,
          fn: () => { if (V.buyGear(k)) { FUP.audio.sfx('coins'); this.talk('bought'); } else this.talk('broke'); },
        });
      }
      this.pRows(rows, X, 96, RW, 10);
      this.pText(X, 516, `Backpack ${run.slotsUsed()}/${run.packMax()} slots` + (full ? '  (full)' : ''), 12, full ? c.bad : c.dim);
      return;
    }
    // Sell: dishes, then spare gear, then ingredients
    run.satchel.forEach((dish, i) => rows.push({
      pic: FUP.dishArt.key(dish), emoji: dish.emoji, name: dish.name, color: dish.tierColor, sub: `Dish · ${dish.tier}`,
      btn: `Sell ${V.dishSellPrice(dish)}`, fn: () => { V.sellDish(i); FUP.audio.sfx('coins'); this.talk('sold'); },
    }));
    run.stash.forEach(it => rows.push({
      pic: FUP.gear.spriteKey(it), emoji: it.emoji, name: it.name, color: it.color, sub: `${G.slotNames[it.slot]} · ${FUP.gear.statText(it.stats)}`,
      btn: `Sell ${V.gearSellPrice(it)}`, fn: () => { V.sellGear(it); FUP.audio.sfx('coins'); this.talk('sold'); },
    }));
    Object.keys(run.bag).forEach(id => rows.push({
      pic: ui.ingKey(id), emoji: FUP.ingredients[id].emoji, name: `${FUP.ingredients[id].name}  x${run.bagCount(id)}`, sub: 'Ingredient',
      btn: `Sell ${V.ingredientSellPrice(id)}`, fn: () => { V.sellIngredient(id); FUP.audio.sfx('coins'); this.talk('sold'); },
    }));
    if (!rows.length) this.pText(X, 100, 'You have nothing to sell. The Shopkeeper looks at you with pity.', 14, c.dim);
    this.pRows(rows, X, 96, RW, 10);
    this.pText(X, 516, 'Gear you\'re wearing isn\'t listed: take it off at home first.', 12, c.dim);
  },

  // Shop rows: an item's stats compared with what you wear (v0.42)
  cmpLine(k) {
    const cmp = FUP.gear.compare(k), it = FUP.gearData.items[k];
    const mark = { better: '▲ better', worse: '▼ worse', mixed: '◆ mixed', same: '= same', empty: '▲ slot empty' }[cmp.verdict];
    return `${FUP.gearData.slotNames[it.slot]} · ${FUP.gear.statText(it.stats)}   ${mark}` + (cmp.worn && cmp.diffs.length ? `: ${cmp.diffs.map(d => d.text).join(', ')}` : '');
  },
  cmpColor(k) {
    const c = FUP.ui.colors, v = FUP.gear.compare(k).verdict;
    return v === 'better' || v === 'empty' ? c.good : v === 'worse' ? c.bad : v === 'mixed' ? c.accent : c.dim;
  },

  // "Your Rizz gets you 3% off" etc.
  priceNote() {
    const cut = Math.round(FUP.village.rizzCut() * 100);
    return cut ? `Your Rizz (level ${FUP.skills.level('rizz')}) gets you ${cut}% better prices.` : 'Prices get better as your Rizz levels up.';
  },

  // ---------- Chef Marrowbone: riddles about secret recipes ----------
  renderChef(X, RW) {
    const ui = FUP.ui, c = ui.colors, V = FUP.village, run = FUP.run, cb = FUP.cooking.cookbook;
    this.pText(X, 36, 'SECRET RECIPE RIDDLES', 20, c.accent, { fontStyle: '700' });
    const halfAt = FUP.villageData.riddleHalfPriceRizz, half = FUP.skills.level('rizz') >= halfAt;
    this.pText(X, 64, 'Some recipes aren\'t in any book. A riddle hints at what goes in. You still need the Cooking level.' + (half ? `  😎 Half price (Rizz ${halfAt}).` : ''), 12, half ? c.good : c.dim, { wordWrap: { width: RW - 100 } });
    const forSale = V.riddlesForSale();
    if (!forSale.length) this.speech = this.speech || FUP.villageData.npcs.chef.allKnown[0];
    const rows = forSale.map(r => {
      const price = V.riddlePrice(r);
      return {
        pic: null, emoji: '🔮', name: `Secret recipe (Cooking ${r.level})`, sub: 'A riddle about what goes in it', subColor: c.dim,
        btn: `Riddle ${price} 🪙`, disabled: run.coins < price,
        fn: () => {
          if (!V.buyRiddle(r)) { this.talk('broke'); return; }
          FUP.audio.sfx('coins');
          this.talk('hint');
          this.speech += `\n\n"${r.riddle}"`;
        },
      };
    });
    if (!forSale.length) this.pText(X, 100, 'You\'ve bought or found every secret. Marrowbone is visibly disappointed.', 14, c.dim);
    this.pRows(rows, X, 96, RW, 6, 46);
    const found = FUP.recipeData.list.filter(r => r.secret && cb.discovered[r.name]).length;
    const total = FUP.recipeData.list.filter(r => r.secret).length;
    this.pText(X, 474, `Secret recipes found: ${found} / ${total}. Riddles you bought are in your recipe book at home.`, 12, c.dim, { wordWrap: { width: RW } });
  },

  // ---------- Carpenter: houses (each with a farm plot), stove, pantry ----------
  renderCarpenter(X, RW) {
    const ui = FUP.ui, c = ui.colors, H = FUP.house, D = FUP.houseData, run = FUP.run;
    this.pBtn(X, 32, 110, 32, 'House', () => { this.panelTab = 'house'; this.panelPage = 0; }, { hot: this.panelTab === 'house', size: 15 });
    this.pBtn(X + 118, 32, 110, 32, 'Build', () => { this.panelTab = 'build'; this.panelPage = 0; }, { hot: this.panelTab === 'build', size: 15 });
    this.pText(X + 244, 44, this.priceNote(), 12, c.dim, { wordWrap: { width: RW - 350 } });
    if (this.panelTab === 'build') { this.renderCarpenterBuild(X, RW); return; }
    this.pText(X, 72, 'YOUR HOUSE', 16, c.accent, { fontStyle: '700' });
    const titles = { houses: '🏠 House', stoves: '🔥 Stove', pantries: '🗄️ Pantry' };
    const rows = H.LINES.map(line => {
      const now = H.current(line), nxt = H.next(line), price = H.nextPrice(line);
      const tier = `${H.state[line] + 1}/${D[line].length}`;
      if (!nxt) return { name: `${titles[line]}: ${now.name}  (${tier})`, sub: `${now.blurb}\nFully upgraded.`, subColor: c.good };
      return {
        name: `${titles[line]}: ${now.name}  →  ${nxt.name}`, sub: `Now: ${now.blurb}\nNext: ${nxt.blurb}`,
        btn: `${price} 🪙`, disabled: run.coins < price, hot: run.coins >= price,
        fn: () => {
          const r = H.buy(line);
          if (r === 'ok') { FUP.audio.sfx('fanfare'); this.talk('bought'); this.sayLine(`Bought: ${nxt.name}.`); if (line === 'houses') this.refreshHouses(); }
          else if (r === 'broke') this.talk('broke');
        },
      };
    });
    this.pRows(rows, X, 96, RW, 3, 86);
    const extra = [];
    extra.push(`Your houses: ${D.houses.filter((h, i) => H.owns(i)).map(h => h.name).join(', ')}`);
    extra.push(`Burn chance: -${Math.round(H.stoveBurnCut() * 100)}% from your stove`);
    extra.push(H.pantryMax() ? `Pantry: ${H.pantryTotal()}/${H.pantryMax()}` : 'No pantry yet');
    this.pText(X, 410, extra.join('   ·   '), 13, c.ink);
    this.pText(X, 440, 'New houses stand in the east and south-east of the village, each with its own farm plot. Your stove and pantry move in with you.', 12, c.dim);
  },

  // The Carpenter's Build tab: things to put on your plot (data/place.js)
  renderCarpenterBuild(X, RW) {
    const c = FUP.ui.colors, P = FUP.place, run = FUP.run;
    this.pText(X, 72, 'THINGS TO BUILD', 16, c.accent, { fontStyle: '700' });
    const rows = Object.entries(FUP.placeData.items).filter(([, it]) => it.source !== 'market' && !it.noShop).map(([id, it]) => {
      const price = P.price(id), missing = FUP.req.missing(it.req), placed = P.state.placed.filter(p => p.item === id).length;
      const have = P.ownedCount(id) + placed;
      if (it.max && P.total(id) >= it.max) return { emoji: it.emoji, pic: 'place_' + id, name: it.name, sub: placed ? 'You have it, and it is on your plot.' : 'You have it. Stand on your plot and tap 🔨 Build.', subColor: c.good };
      const where = it.kind === 'ground' ? (it.zones.includes('farm') ? 'plot or farm' : 'plot') : it.kind === 'building' ? 'needs a plot slot' : 'for your room';
      const buy = n => { const r = P.buy(id, n); if (r === 'ok') { FUP.audio.sfx('coins'); this.talk('bought'); } else if (r === 'broke') this.talk('broke'); };
      const many = it.kind === 'ground' ? FUP.placeData.buyMany : 0;
      return {
        emoji: it.emoji, pic: 'place_' + id, name: `${it.name}  (${it.w}x${it.h}, ${where})`,
        sub: missing.length ? `Needs: ${missing.join(', ')}` : `${it.blurb || ''}${have ? `  ·  You have ${have}${placed ? ` (${placed} placed)` : ''}` : ''}`,
        subColor: missing.length ? c.bad : undefined,
        // Ground things: Buy 5 (main button) and Buy 1
        btn: many ? `${many} for ${P.price(id, many)} 🪙` : FUP.req.costText({ ...P.cost(id), coins: price }),
        disabled: missing.length > 0 || !FUP.req.canPay(P.cost(id, many || 1), { npc: 'carpenter' }),
        fn: () => buy(many || 1),
        btn2: many ? `1: ${price}` : undefined, fn2: () => buy(1),
      };
    });
    // Planks first: sawn from Bark at the sawhorse outside, or bought here
    const pp = P.plankPrice(), buyP = n => { if (P.buyPlanks(n)) { FUP.audio.sfx('coins'); this.talk('bought'); } else this.talk('broke'); };
    rows.unshift({
      emoji: '🪵', pic: FUP.ui.ingKey('plank'), name: `Plank  (you have ${run.bagCount('plank') + FUP.house.pantryCount('plank')})`,
      sub: `Or saw your own at the sawhorse outside: ${P.plankBark()} Bark each, and it trains Building.`,
      btn: `5 for ${pp * 5} 🪙`, disabled: run.coins < pp, fn: () => buyP(5), btn2: `1: ${pp}`, fn2: () => buyP(1),
    });
    // The hammer (data/tools.js): cheaper building
    const T = FUP.tools, hn = T.next('hammer'), hm = hn ? FUP.req.missing(hn.req) : [];
    rows.splice(1, 0, hn ? {
      emoji: '🔨', pic: 'ing_none', name: `Hammer: ${T.current('hammer').name}  →  ${hn.name}`, sub: hm.length ? `Needs: ${hm.join(', ')}` : hn.blurb, subColor: hm.length ? c.bad : c.info,
      btn: `${T.price('hammer')} 🪙`, disabled: hm.length > 0 || FUP.run.coins < T.price('hammer'), hot: !hm.length,
      fn: () => { if (T.buy('hammer') === 'ok') { FUP.audio.sfx('fanfare'); this.talk('bought'); this.say('hammerBought'); } else this.talk('broke'); },
    } : { emoji: '🔨', pic: 'ing_none', name: `Hammer: ${T.current('hammer').name}`, sub: 'The best hammer there is. Planksworth is in mourning.', subColor: c.good });
    this.pRows(rows, X, 96, RW, 8, 46);
    this.pText(X, 486, 'Ground things go on your plot (the meadow east of the village) or inside the farm fence: stand there and tap 🔨 Build. Furniture: Decorate, at home.', 12, c.dim, { wordWrap: { width: RW } });
  },

  // The Shopkeeper's Hats tab (G2, data/cosmetics.js): hats for coins, no stats
  renderHats(X, RW) {
    const c = FUP.ui.colors, C = FUP.cosmetics;
    this.pText(X, 72, 'Hats do nothing. That is the point. Wear them from the 🎒 backpack, Wardrobe tab.', 12, c.dim);
    const rows = Object.entries(FUP.cosmeticData.hats).filter(([, h]) => h.price).map(([id, h]) => {
      const price = C.price(id), has = C.has(id);
      return {
        emoji: h.emoji, pic: 'ing_none', name: h.name, sub: has ? 'Yours. ' + h.blurb : h.blurb, subColor: has ? c.good : c.info,
        btn: has ? 'Owned' : `${price} 🪙`, disabled: has || FUP.run.coins < price, hot: !has && FUP.run.coins >= price,
        fn: () => {
          const r = C.buy(id);
          if (r === 'ok') { FUP.audio.sfx('fanfare'); this.talk('bought'); C.wear('hat', id); if (this.hat) this.hat.destroy(); this.hat = C.attachHat(this, this.player, 'map'); FUP.save.write(); }
          else if (r === 'broke') this.talk('broke');
        },
      };
    });
    this.pRows(rows, X, 96, RW, 10);
  },

  // A shop row for a tool line (data/tools.js): the next tier, what it needs, Buy
  toolRow(id) {
    const c = FUP.ui.colors, T = FUP.tools, L = T.line(id), n = T.next(id), miss = n ? FUP.req.missing(n.req) : [];
    if (!n) return { emoji: L.emoji, pic: 'ing_none', name: `${L.name}: ${T.current(id).name}`, sub: 'The best there is. ' + (T.current(id).blurb || ''), subColor: c.good };
    return {
      emoji: L.emoji, pic: 'ing_none', name: `${L.name}: ${T.current(id).name}  →  ${n.name}`,
      sub: miss.length ? `Needs: ${miss.join(', ')}` : n.blurb, subColor: miss.length ? c.bad : c.info,
      btn: `${T.price(id)} 🪙`, disabled: miss.length > 0 || FUP.run.coins < T.price(id), hot: !miss.length,
      fn: () => { if (T.buy(id) === 'ok') { FUP.audio.sfx('fanfare'); this.talk('bought'); this.sayLine(`Bought: ${n.name}.`); if (this.refreshFarm) this.refreshFarm(true); } else this.talk('broke'); },
    };
  },

  // ---------- Hollis the Farmhand: plots in the big farm ----------
  renderFarmhand(X, RW) {
    const ui = FUP.ui, c = ui.colors, G = FUP.garden, run = FUP.run;
    this.pText(X, 36, 'FARM PLOTS', 20, c.accent, { fontStyle: '700' });
    this.pText(X, 64, this.priceNote(), 12, c.dim);
    const rows = Object.entries(FUP.gardenData.farmPlots).map(([ch, fp]) => {
      const n = FUP.villageMap.find(ch).length;
      if (G.owns(ch)) return { emoji: '🟫', pic: null, name: `${fp.name} (yours)`, sub: `${n} patches.`, subColor: c.good };
      const price = G.plotPrice(ch);
      return {
        emoji: '🟫', pic: null, name: fp.name, sub: `${n} patches of good dirt. Weeds included.`,
        btn: `${price} 🪙`, disabled: run.coins < price, hot: run.coins >= price,
        fn: () => {
          const r = G.buyPlot(ch);
          if (r === 'ok') { FUP.audio.sfx('fanfare'); this.talk('bought'); this.sayLine(`Bought: ${fp.name}. It's the one with the sign.`); this.refreshFarm(true); }
          else if (r === 'broke') this.talk('broke');
        },
      };
    });
    const plots = rows.length;
    rows.unshift(this.toolRow('hoe'));   // the hoe (G2, data/tools.js)
    this.pRows(rows, X, 90, RW, 8, 48);
    const owned = Object.keys(FUP.gardenData.farmPlots).filter(ch => G.owns(ch)).length;
    this.pText(X, 520, `You own ${owned} of ${plots} plots. Buy them in any order. Dying loses them, like everything else.`, 12, c.dim);
  },

  // ---------- Compost Bin (v0.41) ----------
  // ---------- Gill the Fishmonger: buys raw fish for more than the Shopkeeper ----------
  renderFishmonger(X, RW) {
    const c = FUP.ui.colors, V = FUP.village, tab = this.panelTab || 'sell';
    // Tabs (v0.55): sell fish, buy a better rod, buy bait
    [['sell', 'Sell fish'], ['rods', 'Rods'], ['bait', 'Bait'], ['traps', 'Traps']].forEach(([id, label], i) =>
      this.pBtn(X + i * 104, 32, 98, 32, label, () => { this.panelTab = id; this.panelPage = 0; }, { hot: tab === id, size: 14 }));
    if (tab === 'rods') { this.renderGillRods(X, RW); return; }
    if (tab === 'traps') { this.renderGillTraps(X, RW); return; }
    if (tab === 'bait') { this.renderGillBait(X, RW); return; }
    this.pText(X, 72, `Gill pays ${Math.round((V.fishBonus() - 1) * 100)}% more for raw fish than the Shopkeeper. Fish in your pantry count too.`, 12, c.dim);
    const rows = V.fishOwned().map(f => {
      const ing = FUP.ingredients[f.id], price = V.fishPrice(f.id);
      const sell = n => { V.sellFish(f.id, n); FUP.audio.sfx('coins'); this.talk('sold'); };
      return {
        pic: FUP.ui.ingKey(f.id), emoji: ing.emoji, name: `${ing.name} x${f.n}`, sub: `${price} 🪙 each`,
        btn: `Sell all ${price * f.n}`, fn: () => sell(f.n), btn2: 'Sell 1', fn2: () => sell(1),
      };
    });
    if (!rows.length) this.pText(X, 110, FUP.villageData.npcs.fishmonger.nothing[0], 15, c.dim, { fontStyle: 'italic', wordWrap: { width: RW } });
    this.pRows(rows, X, 96, RW, 9);
  },

  // Gill's rods (data/tools.js): the one you have, and the next one up
  renderGillRods(X, RW) {
    const c = FUP.ui.colors, T = FUP.tools, now = T.current('rod'), nxt = T.next('rod');
    this.pText(X, 76, `Your rod: ${now.name}. ${now.blurb}`, 13, c.ink, { wordWrap: { width: RW } });
    if (!nxt) { this.pText(X, 110, 'You own the best rod there is. Gill is still not over it.', 14, c.good, { fontStyle: 'italic' }); return; }
    const missing = FUP.req.missing(nxt.req), price = T.price('rod');
    this.pRows([{
      emoji: '🎣', pic: 'ing_none', name: `Next: ${nxt.name}`, sub: `${nxt.blurb}
Catch zone +${nxt.rodZone}, bites ${Math.round(nxt.biteCut * 100)}% sooner.` + (missing.length ? `
🔒 Needs ${missing.join(', ')}` : ''),
      subColor: missing.length ? c.bad : c.info, btn: `${price} 🪙`, disabled: !!missing.length || FUP.run.coins < price, hot: !missing.length,
      fn: () => {
        const r = T.buy('rod');
        if (r === 'ok') { FUP.audio.sfx('fanfare'); this.talk('sold'); this.sayLine(`Bought: ${nxt.name}.`); }
        else { FUP.audio.sfx('error'); this.speech = r === 'locked' ? 'Come back when you can hold it the right way round.' : 'That rod costs money. Money is not fish.'; }
      },
    }], X, 110, RW, 1, 90);
    this.pText(X, 220, 'Rods only get better: your old one goes in the sea.', 12, c.dim);
  },

  // Gill's fish traps (data/fishing.js traps, v0.56)
  renderGillTraps(X, RW) {
    const c = FUP.ui.colors, F = FUP.fishing, T = F.trapData(), missing = FUP.req.missing(T.req), price = F.trapPrice();
    const owned = F.state.trapsOwned, max = F.trapLimit();
    this.pText(X, 76, `Set a trap on a ringed square by the water (by the village pond, or on the Docks beach). It catches a fish every ${Math.round(T.fillSeconds / 60)} minutes of play, up to ${F.trapCap()}. Worms make it ${Math.round((1 - T.wormBoost) * 100)}% faster.`, 12, c.dim, { wordWrap: { width: RW } });
    this.pRows([{
      emoji: '🪤', pic: 'ing_none', name: `Fish Trap  (you own ${owned} / ${max}, ${F.state.traps.length} set)`,
      sub: missing.length ? `🔒 Needs ${missing.join(', ')}` : owned >= max ? 'You have all the traps you can use.' : 'Catches fish while you do something else. Gill takes no responsibility.',
      subColor: missing.length ? c.bad : c.info, btn: `${price} 🪙`, disabled: !!missing.length || owned >= max || FUP.run.coins < price, hot: !missing.length && owned < max,
      fn: () => { const r = F.buyTrap(); if (r === 'ok') { FUP.audio.sfx('coins'); this.talk('sold'); } else FUP.audio.sfx('error'); },
    }], X, 130, RW, 1, 64);
  },

  // Gill's bait (data/fishing.js bait): packs of 10, one used per bite. Pick it on the fishing screen.
  renderGillBait(X, RW) {
    const c = FUP.ui.colors, F = FUP.fishing, D = FUP.fishData;
    this.pText(X, 76, `Packs of ${D.baitPack}. One is used per bite. Switch bait on the fishing screen.` + (D.compostWorms ? ` The Compost Bin gives ${D.compostWorms} free worms per batch.` : ''), 12, c.dim, { wordWrap: { width: RW } });
    const rows = Object.entries(D.bait).map(([id, b]) => {
      const missing = FUP.req.missing(b.req), price = F.baitPrice(id);
      return {
        emoji: b.emoji, pic: 'ing_none', name: `${b.name}  (you have ${F.baitCount(id)})`, sub: b.blurb + (missing.length ? `   🔒 Needs ${missing.join(', ')}` : ''),
        subColor: missing.length ? c.bad : c.info, btn: `${D.baitPack} for ${price}`, disabled: !!missing.length || FUP.run.coins < price,
        fn: () => { const r = F.buyBait(id); if (r === 'ok') { FUP.audio.sfx('coins'); this.talk('sold'); } else FUP.audio.sfx('error'); },
      };
    });
    this.pRows(rows, X, 110, RW, 3, 56);
  },

  renderCompost(X, RW) {
    const ui = FUP.ui, c = ui.colors, G = FUP.garden, D = FUP.gardenData.compost, run = FUP.run, st = G.compostState();
    G.compostTick();
    this.pText(X, 36, 'COMPOST BIN', 20, c.accent, { fontStyle: '700' });
    this.pText(X, 62, `Every ${D.perBatch} things you put in become 1 Compost after ${D.minutes} minutes. Use Compost when planting: the crop grows ${Math.round(D.growFaster * 100)}% faster and gives +${D.bonusYield}.`, 12, c.dim, { wordWrap: { width: RW - 100 } });
    const next = st.batches.length ? Math.max(0, Math.ceil((Math.min(...st.batches) - Date.now()) / 1000)) : 0;
    this.pText(X, 100, `In the bin: ${st.bin}/${D.perBatch}   ·   Rotting: ${st.batches.length}${st.batches.length ? ` (next in ${Math.floor(next / 60)}:${String(next % 60).padStart(2, '0')})` : ''}   ·   🟫 Compost ready: ${st.ready}`, 14, c.ink, { fontStyle: '700' });
    const put = (label) => { if (G.addToCompost()) this.sayLine('A batch starts rotting. Lovely.'); else FUP.audio.sfx('plop'); };
    const rows = [];
    // Burnt food from your satchel first (that's what it's for), then ingredients
    run.satchel.forEach((d, i) => { if (d.inedible) rows.push({ pic: FUP.dishArt.key(d), emoji: d.emoji, name: d.name, sub: 'Burnt food', btn: 'Compost it', fn: () => { run.satchel.splice(i, 1); put(); } }); });
    Object.keys(run.bag).forEach(id => rows.push({ pic: ui.ingKey(id), emoji: FUP.ingredients[id].emoji, name: `${FUP.ingredients[id].name}  x${run.bagCount(id)}`, sub: 'Ingredient', btn: 'Compost 1', fn: () => { run.takeFromBag([id]); put(); } }));
    if (!rows.length) this.pText(X, 140, 'Nothing to compost on you. Burn something. You will.', 14, c.dim);
    this.pRows(rows, X, 126, RW, 8, 44);
  },

  // ---------- Pip the Seed Seller ----------
  renderSeeds(X, RW) {
    const ui = FUP.ui, c = ui.colors, G = FUP.garden, D = FUP.gardenData, run = FUP.run;
    this.pText(X, 36, 'SEEDS', 20, c.accent, { fontStyle: '700' });
    this.pText(X, 64, `${this.priceNote()}  Seeds go in your seed pouch (no bag space).`, 12, c.dim);
    const rows = Object.entries(D.crops).map(([id, crop]) => {
      const ing = FUP.ingredients[id], price = G.seedPrice(id), ok = G.canGrow(id);
      const buy = n => () => { const got = G.buySeeds(id, n); if (got) { FUP.audio.sfx('coins'); this.talk('bought'); } else this.talk('broke'); };
      return {
        pic: ui.ingKey(id), emoji: ing.emoji, name: `${ing.name} seeds  ×${G.seedCount(id)}`,
        sub: (ok ? '' : `🔒 Grow it at Gardening Lv ${crop.level}. `) + `${G.timeText(G.growTime(id))} to grow · +${crop.harvestXp} XP at harvest`,
        subColor: ok ? c.info : c.dim,
        btn: `${price} 🪙`, disabled: run.coins < price, fn: buy(1),
        btn2: `×5`, fn2: buy(5),
      };
    });
    rows.unshift(this.toolRow('can'));   // the watering can (G2, data/tools.js)
    this.pRows(rows, X, 90, RW, 8, 48);
    this.pText(X, 520, `Pouch: ${G.seedTotal()} seeds. A harvest gives a seed back ${Math.round(G.seedBack() * 100)}% of the time.`, 12, c.dim);
  },

  // ---------- Quest Board ----------
  renderQuests(X, RW) {
    const ui = FUP.ui, c = ui.colors, Q = FUP.quests;
    this.pText(X, 36, 'QUEST BOARD', 20, c.accent, { fontStyle: '700' });
    this.pText(X, 64, `Taken: ${Q.activeIds().length}/${FUP.questData.maxActive}. Hand them in here. The board refills; done quests return later.`, 12, c.dim);

    const active = Q.activeIds().map(id => {
      const q = Q.def(id), done = Q.complete(id);
      return {
        name: `${q.name}  ·  ${q.reward} 🪙`, color: done ? c.good : c.ink, sub: `${q.text}\n${Q.progressText(id)}`, subColor: done ? c.good : c.info,
        btn: done ? 'Hand in' : null, hot: true,
        fn: () => { const coins = Q.handIn(id); if (coins) { FUP.audio.sfx('fanfare'); this.talk('done'); this.sayLine(`Quest done: ${q.name}. +${coins} coins.`); } },
        btn2: 'Drop', fn2: () => { Q.drop(id); },
      };
    });
    let y = 90;
    if (active.length) {
      this.pText(X, y, 'YOUR QUESTS', 12, c.dim, { fontStyle: '700' });
      const saved = this.panelPage; this.panelPage = 0;
      this.pRows(active, X, y + 18, RW, 3, 62);
      this.panelPage = saved;
      y += 18 + active.length * 62 + 8;
    }
    const avail = Q.available().map(id => {
      const q = Q.def(id);
      return {
        name: `${q.name}  ·  ${q.reward} 🪙`, sub: q.text, subColor: c.dim,
        btn: 'Take', disabled: !Q.canTake(),
        fn: () => { if (Q.take(id)) { FUP.audio.sfx('select'); this.talk('taken'); } else this.talk('tooMany'); },
      };
    });
    if (!avail.length) { this.pText(X, y, active.length ? '' : 'The board is empty. You did everything. Show-off.', 14, c.dim); return; }
    this.pText(X, y, 'ON THE BOARD', 12, c.dim, { fontStyle: '700' });
    const room = Math.max(1, Math.floor((520 - y - 18 - 30) / 54));
    this.pRows(avail, X, y + 18, RW, room, 54);
  },

  // ---------- The gate: ready to go? ----------
  renderGate() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, run = FUP.run;
    this.pAdd(FUP.ui.shade(this, 0.6)).setDepth(20000);
    const px = W / 2 - 250, py = 130;
    this.pAdd(FUP.ui.panel(this, px, py, 500, 320, 'panel'));
    this.pText(W / 2, py + 20, 'INTO THE FOREST?', 24, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0);
    const hp = run.currentHp(), max = run.maxHp();
    const lines = [
      `❤️ HP ${hp}/${max}` + (hp < max * 0.5 ? '  (eat something at home first?)' : ''),
      `🍲 Food in your backpack: ${run.satchel.length}` + (run.satchel.length ? '' : '  (none! cook at home)'),
      `🎒 Backpack: ${run.slotsUsed()}/${run.packMax()} slots`,
      `📜 Quests taken: ${FUP.quests.activeIds().length}`,
    ];
    this.pText(px + 40, py + 70, lines.join('\n'), 16, c.ink, { lineSpacing: 10 });
    this.pText(W / 2, py + 210, 'The run timer starts when you step through.', 13, c.dim).setOrigin(0.5, 0);
    this.pBtn(px + 40, py + 250, 200, 44, '🌲 Let\'s go', () => this.enterForest(), { hot: true, size: 18 });
    this.pBtn(px + 260, py + 250, 200, 44, 'Not yet', () => this.closePanel(), { size: 18 });
  },
};
Object.assign(VillageScene.prototype, FUP.villagePanels);
// The same windows work out in the world (Gill on the Docks, v0.54). The World screen keeps its own versions of anything it already has.
for (const [k, fn] of Object.entries(FUP.villagePanels)) if (!(k in WorldScene.prototype)) WorldScene.prototype[k] = fn;
