// ============================================================
// FARM — the soil patches around the village: hoe, plant, water, grow,
// wilt, harvest. No drawing (VillageScene draws them). Numbers in data/garden.js.
// Runs in REAL TIME: tick() looks at the clock, so crops also grow while
// the game is closed (the saved time is checked when you come back).
// ============================================================
window.FUP = window.FUP || {};

FUP.garden = {
  // patches: { 'tx,ty': patch }. A patch:
  //   s: 'weeds' | 'soil' | 'crop'
  //   crop, need (seconds for all stages), stage (0..stages), grown (seconds into this stage),
  //   wet (watered this stage), dry (seconds thirsty), wilt, dead,
  //   yield, left (still to pick), paid (harvest XP given), idle (seconds as empty soil)
  // seeds: { ingredient id: how many } (the seed pouch). plots: { 'A': true } = farm plots you bought.
  // tilled: { 'tx,ty': plot letter } = soil you dug yourself · flat: { 'tx,ty': true } = a starting patch you turned back into grass (v0.87)
  state: { patches: {}, can: 0, lastTick: 0, seeds: {}, plots: {}, tilled: {}, flat: {} },

  // A new life: every patch is weeds, the watering can is full, a few starter seeds.
  reset() {
    const G = FUP.gardenData;
    this.state = { patches: {}, can: G.canMax, lastTick: Date.now(), seeds: { ...G.startSeeds }, plots: {}, compost: this.freshCompost(), tilled: {}, flat: {} };
    this.patchList = null; this.landBoxes = null;
  },
  // ---------- Compost Bin (v0.41) ----------
  //   bin: items waiting for a batch · batches: [times they're ready] · ready: Compost you can use
  freshCompost() { return { bin: 0, batches: [], ready: 0 }; },
  compostState() { if (!this.state.compost) this.state.compost = this.freshCompost(); return this.state.compost; },
  // Put one item in. Every perBatch items start a batch. Returns true if a batch started.
  addToCompost() {
    const c = this.compostState(), D = FUP.gardenData.compost;
    c.bin++;
    if (c.bin < D.perBatch) return false;
    c.bin -= D.perBatch;
    c.batches.push(Date.now() + D.minutes * 60 * 1000);
    return true;
  },
  // Finished batches become Compost (real clock). Called by tick().
  compostTick(now = Date.now()) {
    const c = this.compostState(), done = c.batches.filter(t => t <= now).length;
    if (done) { c.batches = c.batches.filter(t => t > now); c.ready += done; if (FUP.fishing && FUP.fishData) FUP.fishing.addWorms(done); }   // + free worms for fishing
    return done;
  },
  // Gardening perks (data/unlocks.js): a bigger can, more seeds back
  canMax() { return FUP.unlocks.perkBest('canMax', FUP.gardenData.canMax) + FUP.unlocks.perkSum('canBonus'); },   // + the watering can tool (G2)
  seedBack() { return FUP.unlocks.perkBest('seedBack', FUP.gardenData.seedBackChance); },
  fresh() { return { s: 'weeds', crop: null, need: 0, stage: 0, grown: 0, wet: false, dry: 0, wilt: false, dead: false, yield: 0, left: 0, paid: false, idle: 0, scared: false, giantTried: false, giantOf: null, giant: false }; },

  // Every patch on the village map: [{ tx, ty, ch, key }] = the starting patches (map letters) you haven't
  // flattened, plus the soil you tilled yourself (v0.87). ch = whose land it is.
  squares() {
    if (!this.patchList) {
      const flat = this.state.flat || {};
      this.patchList = [];
      for (const ch of this.patchChars()) for (const s of FUP.villageMap.find(ch)) { const key = s.tx + ',' + s.ty; if (!flat[key]) this.patchList.push({ ...s, ch, key }); }
      for (const [key, ch] of Object.entries(this.state.tilled || {})) { const [tx, ty] = key.split(',').map(Number); this.patchList.push({ tx, ty, ch, key, tilled: true }); }
    }
    return this.patchList;
  },
  isPatch(tx, ty) { return this.squares().some(q => q.tx === tx && q.ty === ty); },

  // ---------- Your land (Farming 2.0 F-A, v0.87) ----------
  // The land boxes: { ch: { x0, y0, x1, y1 } } (data/garden.js land; pad = around that plot's patches)
  boxes() {
    if (!this.landBoxes) {
      this.landBoxes = {};
      for (const [ch, L] of Object.entries(FUP.gardenData.land || {})) {
        if (L.w) { this.landBoxes[ch] = { x0: L.tx, y0: L.ty, x1: L.tx + L.w - 1, y1: L.ty + L.h - 1 }; continue; }
        const sq = FUP.villageMap.find(ch);
        if (!sq.length) continue;
        if (L.pad === 0) { this.landBoxes[ch] = { squares: sq.map(s => s.tx + ',' + s.ty) }; continue; }   // scattered single squares
        this.landBoxes[ch] = { x0: Math.min(...sq.map(s => s.tx)) - L.pad, y0: Math.min(...sq.map(s => s.ty)) - L.pad, x1: Math.max(...sq.map(s => s.tx)) + L.pad, y1: Math.max(...sq.map(s => s.ty)) + L.pad };
      }
    }
    return this.landBoxes;
  },
  // Whose land is this square on? (a plot letter, or null)
  landOf(tx, ty) {
    for (const [ch, b] of Object.entries(this.boxes())) {
      if (b.squares ? b.squares.includes(tx + ',' + ty) : (tx >= b.x0 && tx <= b.x1 && ty >= b.y0 && ty <= b.y1)) return ch;
    }
    return null;
  },
  // How many squares of land you own, and how many are soil (for the HUD / Hollis)
  landSize(ch) { const b = this.boxes()[ch]; return !b ? 0 : b.squares ? b.squares.length : (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1); },
  // Can you dig new soil here? Your own land, plain grass (or a starting patch you flattened), nothing standing on it.
  canTill(tx, ty) {
    const ch = this.landOf(tx, ty);
    if (!ch || !this.owns(ch) || this.isPatch(tx, ty)) return null;
    const M = FUP.villageMap, c = M.tileAt(tx, ty), key = tx + ',' + ty;
    if (!(c === '.' || (this.patchChars().includes(c) && (this.state.flat || {})[key]))) return null;
    if (M.blockedTile(tx, ty)) return null;                                   // props, fields, ruins, hills
    const z = FUP.place && FUP.place.zoneAt && FUP.place.zoneAt('village', tx, ty);
    if (z && FUP.place.at(z.zone, z.tx, z.ty)) return null;                    // a path / fence / scarecrow you placed
    return ch;
  },
  // Dig it: a fresh, empty patch (no weeds yet). No XP (see data/garden.js jobs.till).
  till(tx, ty) {
    const ch = this.canTill(tx, ty);
    if (!ch) return null;
    const key = tx + ',' + ty;
    if ((this.state.flat || {})[key]) delete this.state.flat[key];   // a starting patch coming back
    else this.state.tilled[key] = ch;
    this.state.patches[key] = { ...this.fresh(), s: 'soil' };
    this.patchList = null;
    return { tx, ty, ch, key };
  },
  // Turn an empty patch (soil or weeds, no crop) back into grass. Returns true if done.
  canFlatten(tx, ty) { const p = this.state.patches[tx + ',' + ty]; return this.isPatch(tx, ty) && (!p || p.s !== 'crop'); },
  flatten(tx, ty) {
    if (!this.canFlatten(tx, ty)) return false;
    const key = tx + ',' + ty;
    if (this.state.tilled[key]) delete this.state.tilled[key];
    else this.state.flat[key] = true;
    delete this.state.patches[key];
    this.patchList = null;
    return true;
  },
  // Map letters that are farm patches: public, the 3 houses, the farm plots.
  patchChars() { return 'p' + FUP.houseData.houses.map(h => h.plotChar).join('') + Object.keys(FUP.gardenData.farmPlots).join(''); },

  // Is this patch yours to farm? '1'/'2'/'3' = a house you own; 'p' (Village Allotment) and 'A'..'J' = farm plots you bought.
  owns(ch) {
    if (FUP.gardenData.farmPlots[ch]) return !!this.state.plots[ch];
    return FUP.house.ownsPatch(ch);
  },
  isFarmPlot(ch) { return !!FUP.gardenData.farmPlots[ch]; },

  // ---------- Buying (Hollis the Farmhand, Pip the Seed Seller) ----------
  plotPrice(ch) { return FUP.village.buyPrice(FUP.gardenData.farmPlots[ch].price, 'farmhand'); },
  // Returns 'ok', 'broke' or 'owned'.
  buyPlot(ch) {
    if (this.state.plots[ch]) return 'owned';
    const price = this.plotPrice(ch);
    if (FUP.run.coins < price) return 'broke';
    FUP.run.coins -= price;
    this.state.plots[ch] = true;
    return 'ok';
  },
  seedPrice(id) { return FUP.village.buyPrice(FUP.gardenData.crops[id].seedPrice, 'seeds'); },
  seedCount(id) { return this.state.seeds[id] || 0; },
  seedTotal() { return Object.values(this.state.seeds).reduce((a, b) => a + b, 0); },
  // Buy n seeds (or as many as you can afford). Returns how many you bought.
  buySeeds(id, n = 1) {
    let got = 0;
    while (got < n && FUP.run.coins >= this.seedPrice(id)) { FUP.run.coins -= this.seedPrice(id); got++; }
    if (got) this.state.seeds[id] = this.seedCount(id) + got;
    return got;
  },

  at(tx, ty) {
    const k = tx + ',' + ty;
    if (!this.state.patches[k]) this.state.patches[k] = this.fresh();
    return this.state.patches[k];
  },

  // ---------- Crops ----------
  canGrow(id) { const c = FUP.gardenData.crops[id]; return !!c && FUP.skills.level('gardening') >= c.level; },
  growTime(id, level = FUP.skills.level('gardening')) {
    const G = FUP.gardenData, c = G.crops[id];
    const share = Math.max(G.minGrowShare, 1 - G.fasterPerLevel * (level - 1));
    return Math.round(c.growSeconds * share);
  },
  maxYield(level = FUP.skills.level('gardening')) {
    const G = FUP.gardenData;
    return G.yieldMax + Math.floor(level / G.bonusYieldEvery);
  },
  // Seeds in your pouch (any you have at least one of).
  seedIds() { return Object.keys(FUP.gardenData.crops).filter(id => this.seedCount(id) > 0); },

  // ---------- What a patch looks like right now ----------
  // 'weeds' | 'soil' | 'thirsty' (crop needs water) | 'growing' (watered) | 'wilting' | 'dead' | 'ready'
  look(p) {
    if (p.s !== 'crop') return p.s;
    if (p.dead) return 'dead';
    if (p.stage >= FUP.gardenData.stages) return 'ready';
    if (p.wilt) return 'wilting';
    return p.wet ? 'growing' : 'thirsty';
  },
  // Seconds until this crop is fully grown, if you keep watering it.
  secondsLeft(p) {
    const st = FUP.gardenData.stages, per = p.need / st;
    return Math.max(0, Math.ceil((st - p.stage) * per - p.grown));
  },

  // Which job pressing the button does on this patch: { job, label } or { job: null, label: why not }.
  jobFor(tx, ty, ch) {
    if (!this.owns(ch)) return { job: null, label: 'For sale' };
    const p = this.at(tx, ty), look = this.look(p), G = FUP.gardenData;
    const ing = id => (FUP.ingredients[id] || { name: id }).name;
    switch (look) {
      case 'weeds': return { job: 'hoe', label: 'Hoe' };
      case 'soil': return { job: 'plant', label: 'Plant' };
      case 'thirsty': case 'wilting': return this.state.can > 0 ? { job: 'water', label: 'Water' } : { job: null, label: 'Can empty' };
      case 'growing': return { job: null, label: `${ing(p.crop)}: ${this.timeText(this.secondsLeft(p))}` };
      case 'ready': return { job: 'harvest', label: 'Harvest' };
      case 'dead': return { job: 'clear', label: 'Clear' };
    }
    return { job: null, label: '' };
  },
  timeText(sec) { const m = Math.floor(sec / 60), s = sec % 60; return m ? (s ? `${m}m ${String(s).padStart(2, '0')}s` : `${m} min`) : `${s}s`; },

  // ---------- The jobs. Each returns a result object, or null if it can't be done. ----------
  xp(amount, where) { return amount ? FUP.skills.addXp('gardening', amount, where) : null; },

  hoe(tx, ty, where) {
    const p = this.at(tx, ty), look = this.look(p);
    if (look !== 'weeds' && look !== 'dead') return null;
    const xp = look === 'dead' ? FUP.gardenData.jobs.clear.xp : FUP.gardenData.jobs.hoe.xp;
    Object.assign(p, this.fresh(), { s: 'soil' });
    this.xp(xp, where);
    return { cleared: look === 'dead' };
  },

  // compost = true: use 1 Compost (faster growth, +1 harvest)
  plant(tx, ty, id, where, rng = Math.random, compost = false) {
    const p = this.at(tx, ty), G = FUP.gardenData;
    if (this.look(p) !== 'soil' || !this.canGrow(id) || this.seedCount(id) <= 0) return null;
    const useCompost = compost && this.compostState().ready > 0;
    if (useCompost) this.compostState().ready--;
    this.state.seeds[id]--;
    if (!this.state.seeds[id]) delete this.state.seeds[id];
    const max = this.maxYield();
    Object.assign(p, this.fresh(), {
      s: 'crop', crop: id, need: this.growTime(id),
      yield: G.yieldMin + Math.floor(rng() * (max - G.yieldMin + 1)) + (rng() < FUP.unlocks.perkSum('bonusYieldChance') ? 1 : 0),   // Green Thumb
    });
    if (useCompost) { p.need = Math.round(p.need * (1 - G.compost.growFaster)); p.yield += G.compost.bonusYield; p.composted = true; }
    p.left = p.yield;
    const pal = this.companionBonus(tx, ty);   // a companion next door (F-B): both get the bonus
    if (FUP.facts) FUP.facts.add('did:plant');   // first-day goals (data/goals.js)
    this.xp(G.crops[id].plantXp, where);
    return { id, composted: useCompost, pal };
  },

  // ---------- Companion crops (F-B, v0.87; data/garden.js companions) ----------
  // The pair rule for two crops, or null
  companionOf(a, b) { return (FUP.gardenData.companions || []).find(c => (c.a === a && c.b === b) || (c.a === b && c.b === a)) || null; },
  // Crops that go well with this one: [{ id, rule }]
  companionsFor(id) { return (FUP.gardenData.companions || []).filter(c => c.a === id || c.b === id).map(c => ({ id: c.a === id ? c.b : c.a, rule: c })); },
  // Give a patch its companion bonus once (yield: +amount still to pick; speed: the rest grows faster)
  giveCompanion(p, rule) {
    if (p.pal || p.s !== 'crop' || p.dead || p.paid) return false;
    p.pal = rule.bonus;
    if (rule.bonus === 'yield') { p.yield += rule.amount; p.left += rule.amount; }
    else { const st = FUP.gardenData.stages, done = p.stage * (p.need / st) + p.grown; p.need = Math.round(done + (p.need - done) * (1 - rule.amount)); }
    return true;
  },
  // A crop was just planted at (tx, ty): pair it with any neighbour (edges touching). Returns the rule, or null.
  companionBonus(tx, ty) {
    const p = this.at(tx, ty);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = (tx + dx) + ',' + (ty + dy), n = this.state.patches[k];
      if (!n || n.s !== 'crop' || n.dead || !this.isPatch(tx + dx, ty + dy)) continue;
      const rule = this.companionOf(p.crop, n.crop);
      if (!rule) continue;
      const a = this.giveCompanion(p, rule), b = this.giveCompanion(n, rule);
      if (a || b) return rule;
    }
    return null;
  },

  water(tx, ty, where) {
    const p = this.at(tx, ty), look = this.look(p);
    if ((look !== 'thirsty' && look !== 'wilting') || this.state.can <= 0) return null;
    this.state.can--;
    const saved = p.wilt;
    if (saved) { p.yield = Math.max(1, p.yield - 1); p.left = Math.min(p.left, p.yield); }
    Object.assign(p, { wet: true, dry: 0, wilt: false });
    this.xp(FUP.gardenData.jobs.water.xp, where);
    return { saved };
  },

  // Pick a ready crop into your backpack; what doesn't fit waits in the patch (v0.72: nothing slips into the pantry).
  // The first pick can also give a seed back (seedBackChance).
  harvest(tx, ty, where, rng = Math.random) {
    const p = this.at(tx, ty);
    if (p.giantOf) return this.harvestGiant(p.giantOf, where);   // part of a giant crop (F-D)
    if (this.look(p) !== 'ready') return null;
    const id = p.crop;
    // A scarecrow nearby (v0.70): sometimes one extra
    let scared = false;
    if (!p.paid && !p.scared) { p.scared = true; const h = this.helperNear(tx, ty, 'scarecrow'); if (h && rng() < h.def.chance) { p.left++; scared = true; } }
    let buzzed = false;   // a beehive nearby (F-B, v0.87): its own chance of one extra
    if (!p.paid && !p.buzzed) { p.buzzed = true; const h = this.helperNear(tx, ty, 'hive'); if (h && rng() < h.def.chance) { p.left++; buzzed = true; } }
    let got = 0;
    while (p.left > 0 && FUP.run.addToBag(id)) { p.left--; got++; }
    let seed = false, golden = false;
    if (!p.paid && got > 0) {
      p.paid = true;
      this.xp(FUP.gardenData.crops[id].harvestXp, where);
      if (rng() < this.seedBack()) { this.state.seeds[id] = this.seedCount(id) + 1; seed = true; }
      // Golden Harvest perk: sometimes a bonus Heartroot
      if (rng() < FUP.unlocks.perkSum('goldenChance') && FUP.run.addToBag('heartroot')) golden = true;
    }
    const left = p.left;
    if (left <= 0) Object.assign(p, this.fresh(), { s: 'soil' });
    return { id, got, left, seed, golden, scared, buzzed, pal: p.pal || null };
  },

  fillCan() {
    if (this.state.can >= this.canMax()) return false;
    this.state.can = this.canMax();
    return true;
  },

  // ---------- Counts for the HUD ----------
  count(look) {
    return this.squares().filter(q => this.owns(q.ch) && this.look(this.at(q.tx, q.ty)) === look).length;
  },
  readyCount() { return this.count('ready'); },
  thirstyCount() { return this.count('thirsty') + this.count('wilting'); },

  // ---------- Time ----------
  // Moves every patch forward by the real time since the last tick. Call it often.
  // Returns true if something changed that you'd see (a stage finished, a crop wilted...).
  tick(now = Date.now()) {
    this.compostTick();   // compost batches finish on the real clock too
    const dt = Math.max(0, (now - (this.state.lastTick || now)) / 1000);
    this.state.lastTick = now;
    if (!dt) return false;
    const away = dt > FUP.gardenData.awayGap;   // the game was closed or hidden
    let changed = false;
    for (const [key, p] of Object.entries(this.state.patches)) if (this.advance(p, dt, away, key)) changed = true;
    if (this.barrelWater()) changed = true;
    if (this.treeTick(now)) changed = true;    // fruit trees (F-D)
    if (this.giantCheck()) changed = true;     // giant crops (F-D)
    return changed;
  },

  // ---------- Farm helpers you build (v0.70, data/place.js `helper`) ----------
  // The nearest placed helper of this kind that reaches square (tx, ty): { p, def } or null
  helperNear(tx, ty, kind) {
    if (!FUP.place || !FUP.place.state) return null;
    for (const p of FUP.place.state.placed) {
      const it = FUP.place.item(p.item), z = FUP.place.zone(p.zone);
      if (!it || !it.helper || it.helper.kind !== kind || !z || z.where.region !== 'village') continue;
      const hx = z.where.tx + p.tx, hy = z.where.ty + p.ty;
      if (Math.max(Math.abs(hx - tx), Math.abs(hy - ty)) <= it.helper.radius && (kind !== 'barrel' || this.barrelLeft(p) > 0) && (kind !== 'sprinkler' || (p.tank || 0) > 0)) return { p, def: it.helper };
    }
    return null;
  },
  // Waterings a rain barrel has left today (it refills every morning)
  barrelLeft(p) { const it = FUP.place.item(p.item), today = FUP.clock ? FUP.clock.day() : 1; return it.helper.water - (p.usedDay === today ? p.used || 0 : 0); },
  // Thirsty crops next to a barrel (or a sprinkler with water in it, F-C) get watered
  // (no XP: it did it, not you). The barrel goes first. Returns true if any were.
  barrelWater() {
    let any = false;
    for (const [key, p] of Object.entries(this.state.patches)) {
      if (p.s !== 'crop' || p.wet || p.dead || p.stage >= FUP.gardenData.stages) continue;
      const [tx, ty] = key.split(',').map(Number), h = this.helperNear(tx, ty, 'barrel') || this.helperNear(tx, ty, 'sprinkler');
      if (!h) continue;
      if (h.def.kind === 'sprinkler') h.p.tank--;
      else {
        const today = FUP.clock ? FUP.clock.day() : 1;
        if (h.p.usedDay !== today) { h.p.usedDay = today; h.p.used = 0; }
        h.p.used++;
      }
      p.wet = true; p.dry = 0; p.wilt = false;
      any = true;
    }
    return any;
  },

  // ---------- Fruit trees (F-D, v0.92; data/garden.js trees) ----------
  // A tree's state lives on its placed thing (data/place.js *_tree), so it moves with it in Build mode:
  //   p.tree = { stage (0..treeStages), grown (seconds into this stage or batch), wet, fruit (ready to pick), at (last clock check) }
  trees() { return FUP.place && FUP.place.state ? FUP.place.state.placed.filter(p => { const it = FUP.place.item(p.item); return it && it.tree; }) : []; },
  treeDef(p) { return FUP.gardenData.trees[FUP.place.item(p.item).tree]; },
  treeState(p) { if (!p.tree) p.tree = { stage: 0, grown: 0, wet: false, fruit: 0, at: Date.now() }; return p.tree; },
  // 'thirsty' | 'growing' | 'fruiting' (grown, making fruit) | 'ripe' (fruit to pick)
  treeLook(p) {
    const t = this.treeState(p);
    if (t.fruit > 0) return 'ripe';
    return t.wet ? (t.stage >= FUP.gardenData.treeStages ? 'fruiting' : 'growing') : 'thirsty';
  },
  // Seconds until the next stage / batch, if it's watered
  treeLeft(p) {
    const t = this.treeState(p), d = this.treeDef(p), G = FUP.gardenData;
    return Math.max(0, Math.ceil((t.stage >= G.treeStages ? d.fruitSeconds : d.growSeconds / G.treeStages) - t.grown));
  },
  // Real time passes for every tree (each keeps its own clock, t.at, so time while the game was closed counts).
  // Watered trees grow; dry ones just wait. Returns true if one changed.
  treeTick(now = Date.now(), rng = Math.random) {
    let changed = false;
    const G = FUP.gardenData;
    for (const p of this.trees()) {
      const t = this.treeState(p), d = this.treeDef(p), dt = Math.max(0, (now - (t.at || now)) / 1000);
      t.at = now;
      if (!t.wet || t.fruit > 0 || dt <= 0) continue;
      t.grown += dt;
      const need = t.stage >= G.treeStages ? d.fruitSeconds : d.growSeconds / G.treeStages;
      if (t.grown < need) continue;
      t.grown = 0; t.wet = false; changed = true;
      if (t.stage < G.treeStages) t.stage++;
      else t.fruit = d.fruitMin + Math.floor(rng() * (d.fruitMax - d.fruitMin + 1));
    }
    return changed;
  },
  // Water a thirsty tree from your can (Gardening XP). Returns true if done.
  waterTree(p, where) {
    const t = this.treeState(p);
    if (this.treeLook(p) !== 'thirsty' || this.state.can <= 0) return false;
    this.state.can--; t.wet = true;
    this.xp(this.treeDef(p).waterXp, where);
    return true;
  },
  // Pick the fruit into your backpack (what doesn't fit stays on the tree). XP once per batch.
  pickTree(p, where) {
    const t = this.treeState(p), d = this.treeDef(p);
    if (t.fruit <= 0) return null;
    let got = 0;
    while (t.fruit > 0 && FUP.run.addToBag(d.fruit)) { t.fruit--; got++; }
    if (got && !t.paid) { t.paid = true; this.xp(d.pickXp, where); }
    if (t.fruit <= 0) t.paid = false;
    return { id: d.fruit, got, left: t.fruit };
  },
  // Its picture: tree_<id>_0 sapling · _1 young (stages 1-2) · _2 grown · _3 grown with fruit
  treeSize(p) { return FUP.gardenData.treeSizes[Number(this.treeSprite(p).slice(-1))] || 1; },
  treeSprite(p) {
    const t = this.treeState(p), id = FUP.place.item(p.item).tree;
    return `tree_${id}_${t.fruit > 0 ? 3 : t.stage >= FUP.gardenData.treeStages ? 2 : t.stage >= 1 ? 1 : 0}`;
  },

  // ---------- Giant crops (F-D, v0.92; data/garden.js giant) ----------
  // A patch key's 3x3 squares that it could anchor (top-left corners whose square contains it)
  giantCheck(rng = Math.random) {
    const G = FUP.gardenData, gd = G.giant;
    if (!gd) return false;
    let changed = false;
    for (const [key, p] of Object.entries(this.state.patches)) {
      if (p.giantTried || p.giantOf || this.look(p) !== 'ready' || !gd.crops.includes(p.crop) || p.paid) continue;
      const [tx, ty] = key.split(',').map(Number);
      for (let ox = -2; ox <= 0 && !p.giantTried; ox++) for (let oy = -2; oy <= 0 && !p.giantTried; oy++) {
        const keys = [];
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) keys.push((tx + ox + x) + ',' + (ty + oy + y));
        const all = keys.map(k => this.state.patches[k]);
        if (!all.every((q, i) => q && !q.giantTried && !q.giantOf && !q.paid && q.crop === p.crop && this.look(q) === 'ready' && this.isPatch(...keys[i].split(',').map(Number)))) continue;
        all.forEach(q => { q.giantTried = true; });   // one roll per square
        if (rng() >= gd.chance) continue;
        const anchor = keys[0];
        all.forEach(q => { q.giantOf = anchor; });
        Object.assign(this.state.patches[anchor], { giant: true, left: gd.worth });
        changed = true;
      }
    }
    return changed;
  },
  // Pick a giant crop (anchor key). All 9 patches go back to soil once it's all picked.
  harvestGiant(anchor, where) {
    const a = this.state.patches[anchor];
    if (!a || !a.giant) return null;
    const id = a.crop;
    let got = 0;
    while (a.left > 0 && FUP.run.addToBag(id)) { a.left--; got++; }
    if (got && !a.paid) { a.paid = true; this.xp(FUP.gardenData.crops[id].harvestXp * FUP.gardenData.giant.xpTimes, where); if (FUP.facts) FUP.facts.add('did:giant'); }   // (F-F: Pip's giant order counts these)
    const left = a.left;
    if (left <= 0) for (const [k, q] of Object.entries(this.state.patches)) if (q.giantOf === anchor) Object.assign(q, this.fresh(), { s: 'soil' });
    return { id, got, left, giant: true };
  },
  // The 9 keys of a giant crop (for drawing)
  giantParts(anchor) { return Object.keys(this.state.patches).filter(k => this.state.patches[k].giantOf === anchor); },

  // ---------- Sprinklers (F-C, v0.91) ----------
  sprinklerTank(p) { return p.tank || 0; },
  sprinklerMax(p) { return FUP.place.item(p.item).helper.tank; },
  // Pour your watering can into a sprinkler: 'empty' (your can) / 'full' (the tank) / number poured
  fillSprinkler(p) {
    const room = this.sprinklerMax(p) - this.sprinklerTank(p);
    if (room <= 0) return 'full';
    if (this.state.can <= 0) return 'empty';
    const n = Math.min(room, this.state.can);
    this.state.can -= n; p.tank = this.sprinklerTank(p) + n;
    return n;
  },

  // One patch, dt seconds later (dt can be hours if the game was closed: away = true).
  advance(p, dt, away = false, key = '') {
    const G = FUP.gardenData, before = this.look(p) + p.stage;
    if (p.s === 'soil') {
      p.idle += dt;
      if (p.idle >= G.weedsAfter) Object.assign(p, this.fresh());
    }
    while (p.s === 'crop' && !p.dead && p.stage < G.stages && dt > 0) {
      if (p.wet) {
        // Watered: grow until this stage is done, then the soil dries out
        const per = p.need / G.stages, step = Math.min(dt, per - p.grown);
        p.grown += step; dt -= step;
        if (p.grown >= per - 1e-6) { p.stage++; p.grown = 0; p.wet = false; p.dry = 0; }
      } else {
        // Thirsty: the dry clock runs (not while you're away, unless data says so)
        if (!away || FUP.gardenData.dryWhileAway) p.dry += key && this.helperNear(Number(key.split(',')[0]), Number(key.split(',')[1]), 'hedge') ? dt / 2 : dt;   // a hedge next to it: half as fast (F-B)
        dt = 0;
        if (p.dry >= G.dieAfter && !FUP.unlocks.hasPerk('noDeath')) { p.dead = true; p.wilt = false; }   // Hardy Crops perk: never die
        else if (p.dry >= FUP.unlocks.perkBest('wiltAfter', G.wiltAfter)) p.wilt = true;                  // Deep Roots perk
      }
    }
    return this.look(p) + p.stage !== before;
  },
};

FUP.garden.reset();
