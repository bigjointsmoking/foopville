// ============================================================
// FISHING RULES — no drawing. Numbers in data/fishing.js.
// The mini-game itself is drawn by src/fishingUi.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.fishing = {
  // bait: { id: how many } · using: the bait on your hook (null = none) · traps: phase V1 · perfects = Perfect catches this life
  // trapsOwned: traps you've bought · traps: the ones set on the map [{ region, tx, ty, spot, bait, t, fish: [] }]
  state: { bait: {}, using: null, traps: [], trapsOwned: 0, perfects: 0 },
  wormsNews: 0,   // worms the Compost Bin just gave you (the village says so once)
  reset() { this.state = { bait: {}, using: null, traps: [], trapsOwned: 0, perfects: 0 }; this.wormsNews = 0; },

  level() { return FUP.skills.level('fishing'); },

  // Village: the fishing water next to the hero's square (diagonals count), or null.
  // Returns { spot, tx, ty } for the closest water square.
  spotNear(tx, ty) {
    let best = null;
    for (const s of FUP.fishData.villageSpots) {
      for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) {
        if (x < s.x0 || x > s.x1 || y < s.y0 || y > s.y1 || FUP.villageMap.tileAt(x, y) !== '~') continue;
        const d = Math.abs(x - tx) + Math.abs(y - ty);
        if (!best || d < best.d) best = { spot: s.spot, tx: x, ty: y, d };
      }
    }
    return best ? { spot: best.spot, tx: best.tx, ty: best.ty } : null;
  },

  // Out in the world (the Docks): an F / D square within 1 square of the hero (corners count),
  // turned into a spot by the region's `fish` letters (data/region_docks.js). Spots without fish yet are skipped.
  spotNearRegion(id, tx, ty) {
    const W = FUP.world, letters = (W.area(id) || {}).fish || {};
    let best = null;
    for (let y = ty - 1; y <= ty + 1; y++) for (let x = tx - 1; x <= tx + 1; x++) {
      const spot = letters[W.tile(id, x, y)];
      if (!spot || !FUP.fishData.spots[spot]) continue;
      const d = Math.abs(x - tx) + Math.abs(y - ty);
      if (!best || d < best.d) best = { spot, tx: x, ty: y, d };
    }
    return best ? { spot: best.spot, tx: best.tx, ty: best.ty } : null;
  },

  // What a spot still needs from you (the deep water needs Fishing 26), as text lines. Empty = you can fish it.
  spotMissing(spotId) { return FUP.req.missing(FUP.fishData.spots[spotId].req); },

  // Fish in this spot you're good enough to catch AND have backpack room for: [[id, weight]]
  // Stinky Cheese: the two best of those bite more often.
  catchable(spotId) {
    const spot = FUP.fishData.spots[spotId];
    if (spot.req && this.spotMissing(spotId).length) return [];
    const list = Object.entries(spot.fish).filter(([id]) => FUP.fishData.fish[id].level <= this.level() && FUP.run.canAddIng(id));
    const top = (this.baitData() || {}).topWeight;
    if (!top) return list;
    const best = list.map(([id]) => id).sort((a, b) => FUP.fishData.fish[b].level - FUP.fishData.fish[a].level).slice(0, 2);
    return list.map(([id, w]) => [id, best.includes(id) ? w * top : w]);
  },

  // ---------- Bait ----------
  baitCount(id) { return this.state.bait[id] || 0; },
  // The bait on your hook, if you still have some (its data), else null
  baitData() { const id = this.state.using; return id && this.baitCount(id) > 0 ? FUP.fishData.bait[id] : null; },
  setBait(id) { this.state.using = id && this.baitCount(id) > 0 ? id : null; },
  // Next bait you own after the one on the hook (none → worm → cheese → lure → none)
  cycleBait() {
    const ids = [null, ...Object.keys(FUP.fishData.bait).filter(id => this.baitCount(id) > 0)];
    const i = ids.indexOf(this.baitData() ? this.state.using : null);
    this.setBait(ids[(i + 1) % ids.length]);
    return this.state.using;
  },
  baitPrice(id) { return FUP.req.coinPrice({ coins: FUP.fishData.bait[id].price * FUP.fishData.baitPack }, { npc: 'fishmonger' }); },
  // A pack of 10 from Gill: 'ok' · 'locked' · 'broke'
  buyBait(id) {
    const b = FUP.fishData.bait[id];
    if (!FUP.req.met(b.req)) return 'locked';
    if (!FUP.req.pay({ coins: b.price * FUP.fishData.baitPack }, { npc: 'fishmonger' })) return 'broke';
    this.state.bait[id] = this.baitCount(id) + FUP.fishData.baitPack;
    if (!this.state.using) this.state.using = id;
    return 'ok';
  },
  // A bite uses one bait (unless a perk saves it). Returns true if one was used up.
  useBait(rng = Math.random) {
    const id = this.state.using;
    if (!id || this.baitCount(id) <= 0) return false;
    if (rng() < FUP.unlocks.perkBest('baitSave', 0)) return false;
    this.state.bait[id]--;
    if (!this.state.bait[id]) { delete this.state.bait[id]; this.state.using = null; }
    return true;
  },
  // The Compost Bin gives worms when a batch finishes (src/systems/garden.js compostTick)
  addWorms(batches) {
    const n = batches * FUP.fishData.compostWorms;
    if (!n) return;
    this.state.bait.worm = this.baitCount('worm') + n;
    this.wormsNews += n;
  },

  // ---------- Fish traps (data/fishing.js traps) ----------
  trapData() { return FUP.fishData.traps; },
  trapLimit() { return this.trapData().own + (FUP.place && FUP.place.bonus ? FUP.place.bonus('trapBonus') : 0); },
  trapsFree() { return this.state.trapsOwned - this.state.traps.length; },
  trapPrice() { return FUP.req.coinPrice({ coins: this.trapData().price }, { npc: 'fishmonger' }); },
  // Buy one from Gill: 'ok' · 'locked' (Fishing 5) · 'max' · 'broke'
  buyTrap() {
    const T = this.trapData();
    if (!FUP.req.met(T.req)) return 'locked';
    if (this.state.trapsOwned >= this.trapLimit()) return 'max';
    if (!FUP.req.pay({ coins: T.price }, { npc: 'fishmonger' })) return 'broke';
    this.state.trapsOwned++;
    return 'ok';
  },
  // The ringed squares in a region where a trap can go: [{ tx, ty, spot }]
  trapSquares(region) {
    if (region === 'village') return this.trapData().villageSquares;
    const a = FUP.world && FUP.world.area(region);
    return ((a && a.objects) || []).filter(o => o.kind === 'trap').map(o => ({ tx: o.tx, ty: o.ty, spot: o.spot }));
  },
  trapAt(region, tx, ty) { return this.state.traps.find(t => t.region === region && t.tx === tx && t.ty === ty) || null; },
  // Put a trap down: needs a free one and an empty trap square. Returns the trap or null.
  setTrap(region, tx, ty, spot) {
    if (this.trapsFree() <= 0 || this.trapAt(region, tx, ty)) return null;
    if (!this.trapSquares(region).some(q => q.tx === tx && q.ty === ty)) return null;
    const trap = { region, tx, ty, spot, bait: 0, t: 0, fish: [] };
    this.state.traps.push(trap);
    return trap;
  },
  // Move up to n worms from your bait into the trap (traps only take worms). Returns how many.
  baitTrap(trap, n) {
    const k = Math.min(n, this.baitCount('worm'));
    if (k <= 0) return 0;
    this.state.bait.worm -= k;
    if (!this.state.bait.worm) { delete this.state.bait.worm; if (this.state.using === 'worm') this.state.using = null; }
    trap.bait += k;
    return k;
  },
  trapCap() { return this.trapData().cap + FUP.unlocks.perkSum('trapCap'); },
  // A fish for a trap: any fish of the spot at or under your level, by weight. No junk, treasure or bait tricks.
  trapFish(spotId, rng = Math.random) {
    const list = Object.entries(FUP.fishData.spots[spotId].fish).filter(([id]) => FUP.fishData.fish[id].level <= this.level());
    if (!list.length) return null;
    return this.pick(Object.fromEntries(list), rng);
  },
  // Play time passing (FUP.clock.every, src/main.js): traps fill up. A full trap's timer waits at 0.
  tickTraps(dt, rng = Math.random) {
    const T = this.trapData();
    for (const trap of this.state.traps) {
      if (trap.fish.length >= this.trapCap()) { trap.t = 0; continue; }
      trap.t += dt;
      const need = T.fillSeconds * (trap.bait > 0 ? T.wormBoost : 1);
      if (trap.t < need) continue;
      const id = this.trapFish(trap.spot, rng);
      if (!id) { trap.t = 0; continue; }   // nothing there you could catch yet
      trap.t -= need;
      trap.fish.push(id);
      if (trap.bait > 0) trap.bait--;
    }
  },
  // Into your bag while there's room (the rest wait in the trap). XP: a quarter of a normal catch, at least 1.
  // Returns the ids moved.
  emptyTrap(trap, where = null) {
    const moved = [];
    while (trap.fish.length && FUP.run.addToBag(trap.fish[0])) {
      const id = trap.fish.shift();
      moved.push(id);
      FUP.facts.add('fish:' + id);
      FUP.skills.addXp('fishing', Math.max(1, Math.round(FUP.fishData.fish[id].xp * this.trapData().xpShare)), where);
    }
    return moved;
  },
  // Take an empty trap back (you still own it). Its worms come back too.
  pickUpTrap(trap) {
    if (trap.fish.length) return false;
    if (trap.bait) this.state.bait.worm = this.baitCount('worm') + trap.bait;
    this.state.traps = this.state.traps.filter(t => t !== trap);
    return true;
  },
  trapFishTotal() { return this.state.traps.reduce((n, t) => n + t.fish.length, 0); },

  // ---------- Junk and treasure ----------
  // A bite that's junk instead of a fish: its id, or null
  rollJunk(rng = Math.random) {
    const E = FUP.fishData.extras;
    if (rng() >= E.junkChance) return null;
    return this.pick(E.junk, rng);
  },
  pick(weights, rng = Math.random) {
    const list = Object.entries(weights), total = list.reduce((t, [, w]) => t + w, 0);
    let roll = rng() * total;
    for (const [id, w] of list) { if (roll < w) return id; roll -= w; }
    return list[list.length - 1][0];
  },
  // Pull it in: into the bag if there's room, a little XP. Returns { id, xp, kept }
  landJunk(id, where = null) {
    const kept = FUP.run.addToBag(id), xp = FUP.fishData.extras.junkXp;
    FUP.skills.addXp('fishing', xp, where);
    return { id, xp, kept };
  },
  // After a catch: maybe something else was on the line. Returns { kind, text } or null (and gives it to you).
  rollTreasure(perfect, rng = Math.random) {
    const D = FUP.fishData, E = D.extras, bait = this.baitData() || {};
    const chance = E.treasureChance * FUP.unlocks.perkBest('treasureMult', 1) * (bait.treasureMult || 1) * (perfect ? D.game.perfectTreasure : 1);
    if (rng() >= chance) return null;
    const kind = this.pick(E.treasure, rng);
    if (kind === 'coins') { const n = E.coins[0] + Math.floor(rng() * (E.coins[1] - E.coins[0] + 1)); FUP.run.coins += n; return { kind, n, text: `${n} 🪙` }; }
    if (kind === 'seeds') {
      const C = FUP.gardenData.crops, lv = FUP.skills.level('gardening'), ok = Object.keys(C).filter(id => C[id].level <= lv);
      const id = ok[Math.floor(rng() * ok.length)];
      FUP.garden.state.seeds[id] = (FUP.garden.state.seeds[id] || 0) + E.seeds;
      return { kind, n: E.seeds, text: `${E.seeds} ${FUP.ingredients[id].name} seeds` };
    }
    if (kind === 'bottle') {
      // A message in a bottle: one of Marrowbone's riddles, free. Know them all? Coins instead.
      const r = FUP.village.riddlesForSale ? FUP.village.riddlesForSale()[0] : null;
      if (r) { FUP.cooking.cookbook.riddles[r.name] = true; return { kind, text: 'a message in a bottle: a recipe riddle! (see your recipe book)' }; }
      FUP.run.coins += E.bottleCoins;
      return { kind, n: E.bottleCoins, text: `a message in a bottle with ${E.bottleCoins} 🪙 in it` };
    }
    if (FUP.run.addToBag('pearl')) return { kind: 'pearl', text: 'a Pearl' };
    FUP.run.coins += FUP.ingredients.pearl.sell;   // no room: Gill buys it off you on the spot
    return { kind: 'pearl', n: FUP.ingredients.pearl.sell, text: `a Pearl (no room: sold for ${FUP.ingredients.pearl.sell} 🪙)` };
  },

  // Room in the backpack for at least one kind of fish here?
  canCast(spotId = 'pond') { return this.catchable(spotId).length > 0; },

  // Seconds until the bite
  biteWait(rng = Math.random) {
    const G = FUP.fishData.game;
    const bait = this.baitData() || {};   // a Worm: bites come 30% sooner
    return (G.biteMin + rng() * (G.biteMax - G.biteMin)) * Math.max(0.2, 1 - FUP.unlocks.perkSum('biteCut') - (bait.biteCut || 0));
  },

  // Which fish bites (weighted), or null if nothing can
  rollFish(spotId, rng = Math.random) {
    const pool = this.catchable(spotId);
    let roll = rng() * pool.reduce((t, [, w]) => t + w, 0);
    for (const [id, w] of pool) { if (roll < w) return id; roll -= w; }
    return pool.length ? pool[pool.length - 1][0] : null;
  },

  // Height of your catch zone against this fish
  zoneSize(fishId) {
    const G = FUP.fishData.game, U = FUP.unlocks;
    const fromLevel = Math.max(0, Math.min(G.zoneLevelMax, (this.level() - FUP.fishData.fish[fishId].level) * G.zonePerLevel));
    return Math.max(G.zone, G.zone + U.perkSum('zoneAdd') + U.perkSum('rodZone') + fromLevel);
  },
  drainRate() { return FUP.fishData.game.drain * (1 - FUP.unlocks.perkSum('drainCut')); },

  // The fish is yours: into the bag, Fishing XP, counters. `where` = { x, y } for the XP pop-up.
  // Returns { id, xp, perfect, extra } (extra = a second fish from Double Hook / Mastery).
  land(fishId, perfect, where = null, rng = Math.random) {
    const G = FUP.fishData.game, U = FUP.unlocks;
    FUP.run.addToBag(fishId);
    const xp = Math.round(FUP.fishData.fish[fishId].xp * (perfect ? G.perfectXp : 1));
    FUP.facts.add('fish:' + fishId);
    if (perfect) this.state.perfects++;
    // A second fish (no extra XP), if there's room
    const lucky = (perfect && U.perkBest('perfectDouble', 0)) || rng() < U.perkBest('doubleFish', 0);
    const extra = !!(lucky && FUP.run.addToBag(fishId));
    if (extra) FUP.facts.add('fish:' + fishId);
    FUP.quests.event('fish', { id: fishId });
    FUP.skills.addXp('fishing', xp, where);
    return { id: fishId, xp, perfect: !!perfect, extra };
  },
};
