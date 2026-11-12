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
  state: { patches: {}, can: 0, lastTick: 0, seeds: {}, plots: {} },

  // A new life: every patch is weeds, the watering can is full, a few starter seeds.
  reset() {
    const G = FUP.gardenData;
    this.state = { patches: {}, can: G.canMax, lastTick: Date.now(), seeds: { ...G.startSeeds }, plots: {}, compost: this.freshCompost() };
    this.patchList = null;
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
  fresh() { return { s: 'weeds', crop: null, need: 0, stage: 0, grown: 0, wet: false, dry: 0, wilt: false, dead: false, yield: 0, left: 0, paid: false, idle: 0, scared: false }; },

  // Every patch square on the village map: [{ tx, ty, ch, key }]
  squares() {
    if (!this.patchList) {
      this.patchList = [];
      for (const ch of this.patchChars()) for (const s of FUP.villageMap.find(ch)) this.patchList.push({ ...s, ch, key: s.tx + ',' + s.ty });
    }
    return this.patchList;
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
    this.xp(G.crops[id].plantXp, where);
    return { id, composted: useCompost };
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

  // Pick a ready crop: bag first, then the pantry at home; the rest waits in the patch.
  // The first pick can also give a seed back (seedBackChance).
  harvest(tx, ty, where, rng = Math.random) {
    const p = this.at(tx, ty);
    if (this.look(p) !== 'ready') return null;
    const id = p.crop;
    // A scarecrow nearby (v0.70): sometimes one extra
    let scared = false;
    if (!p.paid && !p.scared) { p.scared = true; const h = this.helperNear(tx, ty, 'scarecrow'); if (h && rng() < h.def.chance) { p.left++; scared = true; } }
    let got = 0, toPantry = 0;
    while (p.left > 0 && FUP.run.addToBag(id)) { p.left--; got++; }
    while (p.left > 0 && FUP.house.addOne(id)) { p.left--; got++; toPantry++; }
    let seed = false, golden = false;
    if (!p.paid && got > 0) {
      p.paid = true;
      this.xp(FUP.gardenData.crops[id].harvestXp, where);
      if (rng() < this.seedBack()) { this.state.seeds[id] = this.seedCount(id) + 1; seed = true; }
      // Golden Harvest perk: sometimes a bonus Heartroot
      if (rng() < FUP.unlocks.perkSum('goldenChance') && (FUP.run.addToBag('heartroot') || FUP.house.addOne('heartroot'))) golden = true;
    }
    const left = p.left;
    if (left <= 0) Object.assign(p, this.fresh(), { s: 'soil' });
    return { id, got, left, toPantry, seed, golden, scared };
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
    for (const p of Object.values(this.state.patches)) if (this.advance(p, dt, away)) changed = true;
    if (this.barrelWater()) changed = true;
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
      if (Math.max(Math.abs(hx - tx), Math.abs(hy - ty)) <= it.helper.radius && (kind !== 'barrel' || this.barrelLeft(p) > 0)) return { p, def: it.helper };
    }
    return null;
  },
  // Waterings a rain barrel has left today (it refills every morning)
  barrelLeft(p) { const it = FUP.place.item(p.item), today = FUP.clock ? FUP.clock.day() : 1; return it.helper.water - (p.usedDay === today ? p.used || 0 : 0); },
  // Thirsty crops next to a barrel get watered (no XP: the barrel did it). Returns true if any were.
  barrelWater() {
    let any = false;
    for (const [key, p] of Object.entries(this.state.patches)) {
      if (p.s !== 'crop' || p.wet || p.dead || p.stage >= FUP.gardenData.stages) continue;
      const [tx, ty] = key.split(',').map(Number), h = this.helperNear(tx, ty, 'barrel');
      if (!h) continue;
      const today = FUP.clock ? FUP.clock.day() : 1;
      if (h.p.usedDay !== today) { h.p.usedDay = today; h.p.used = 0; }
      h.p.used++;
      p.wet = true; p.dry = 0; p.wilt = false;
      any = true;
    }
    return any;
  },

  // One patch, dt seconds later (dt can be hours if the game was closed: away = true).
  advance(p, dt, away = false) {
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
        if (!away || FUP.gardenData.dryWhileAway) p.dry += dt;
        dt = 0;
        if (p.dry >= G.dieAfter && !FUP.unlocks.hasPerk('noDeath')) { p.dead = true; p.wilt = false; }   // Hardy Crops perk: never die
        else if (p.dry >= FUP.unlocks.perkBest('wiltAfter', G.wiltAfter)) p.wilt = true;                  // Deep Roots perk
      }
    }
    return this.look(p) + p.stage !== before;
  },
};

FUP.garden.reset();
