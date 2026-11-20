// ============================================================
// VILLAGE SURPRISE EVENTS (phase V3): the rules, no drawing.
//   FUP.events.enterVillage(rng)   called when you walk into the village: may start one
//   FUP.events.is(id)              that event is going on right now (other systems ask this)
//   FUP.events.begin(id) / end(done)
//   + one function per event for what you do with it (buyOffer, openMail, feedTourist, shoo,
//     handInChallenge, glitterCatch, openCrate), used by src/scenes/VillageEvents.js.
// Numbers and words: data/events.js. Times are seconds of play (FUP.clock.now()).
// Saved as the 'events' part (src/systems/save.js). Hardcore: wiped. Normal: kept.
// ============================================================
window.FUP = window.FUP || {};

FUP.events = {
  state: { active: null, lastEnd: -900, seen: {} },
  fresh() { return { active: null, lastEnd: -FUP.eventData.gapSeconds, seen: {} }; },
  reset() { this.state = this.fresh(); },

  now() { return FUP.clock ? FUP.clock.now() : 0; },
  def(id) { return FUP.eventData.list[id]; },
  active() { const a = this.state.active; return a && !this.expired() ? a : null; },
  expired() { const a = this.state.active; return !!a && this.now() - a.start >= FUP.eventData.lifeSeconds; },
  is(id) { const a = this.active(); return !!a && a.id === id; },
  data() { const a = this.active(); return a ? a.data : null; },

  // ---------- Starting and ending ----------
  growing() { const P = FUP.garden && FUP.garden.state ? FUP.garden.state.patches || {} : {}; return Object.keys(P).filter(k => P[k].s === 'crop' && !P[k].dead); },
  cookedNames() { const c = FUP.cooking.cookbook.cooked || {}; return Object.keys(c).filter(n => c[n] > 0 && FUP.recipeData.list.some(r => r.name === n)); },
  needsMet(key) {
    if (!key) return true;
    if (key === 'growingCrop') return this.growing().length > 0;
    if (key === 'threeRecipes') return this.cookedNames().length >= 3;
    if (key === 'stall') return !!(FUP.stall && FUP.stall.placed().length);
    return false;
  },
  canRun(id) { const e = this.def(id); return !!e && this.needsMet(e.needs) && (!e.req || FUP.req.met(e.req)); },
  // Weighted pick among the events that can run now
  pick(rng = Math.random) {
    const ids = Object.keys(FUP.eventData.list).filter(id => this.canRun(id));
    let roll = rng() * ids.reduce((t, id) => t + this.def(id).w, 0);
    for (const id of ids) { if (roll < this.def(id).w) return id; roll -= this.def(id).w; }
    return ids[ids.length - 1] || null;
  },
  // Walking into the village. Returns the id of an event that just started, or null.
  enterVillage(rng = Math.random) {
    const D = FUP.eventData, s = this.state, now = this.now();
    if (s.active && this.expired()) this.end(false);
    if (s.active) return null;
    if (D.debugForce && this.def(D.debugForce)) return this.begin(D.debugForce, rng);
    if (now - s.lastEnd < D.gapSeconds) return null;
    const id = rng() < D.chance ? this.pick(rng) : null;
    if (!id) { s.lastEnd = now - D.gapSeconds + D.retrySeconds; return null; }   // try again in 5 min of play
    return this.begin(id, rng);
  },
  begin(id, rng = Math.random) {
    const data = this.rollData(id, rng);
    if (!data) return null;
    this.state.active = { id, start: this.now(), data };
    this.state.seen[id] = (this.state.seen[id] || 0) + 1;
    return id;
  },
  end(done) {
    const a = this.state.active;
    this.state.active = null;
    this.state.lastEnd = this.now();
    if (done && a && FUP.facts) FUP.facts.add('did:event');
    return a ? a.id : null;
  },

  // ---------- What each event rolls when it starts ----------
  one(list, rng) { return list.length ? list[Math.floor(rng() * list.length)] : null; },
  between(r, rng) { return r[0] + Math.floor(rng() * (r[1] - r[0] + 1)); },
  ingPool(rarity) {
    const src = FUP.eventData.ingredientSources;
    return Object.keys(FUP.ingredients).filter(k => { const g = FUP.ingredients[k]; return g.enabled !== false && g.rarity === rarity && src.includes(g.source); });
  },
  rollPrize(table, rng) {
    let roll = rng() * table.reduce((t, p) => t + p.w, 0), p = table[table.length - 1];
    for (const t of table) { if (roll < t.w) { p = t; break; } roll -= t.w; }
    if (p.coins) return { coins: this.between(p.coins, rng) };
    if (p.ingredient) { const id = this.one(this.ingPool(p.ingredient), rng); if (id) return { ing: id, n: p.n }; }
    if (p.curio) {
      const items = FUP.placeData.items, id = this.one(Object.keys(items).filter(k => items[k].source === 'market' && FUP.place.total(k) === 0), rng);
      if (id) return { curio: id };
    }
    return { coins: this.def('mystery_crate').curioCoins };
  },
  rollData(id, rng) {
    const e = this.def(id);
    if (id === 'peddler') {
      const crops = Object.keys(FUP.gardenData.crops).filter(k => FUP.gardenData.crops[k].shop !== false && FUP.garden.canGrow(k));
      const seed = this.one(crops, rng);
      const baits = Object.keys(FUP.fishData.bait).filter(k => FUP.req.met(FUP.fishData.bait[k].req));
      const bait = this.one(baits, rng);
      const ground = this.one(e.ground.filter(k => FUP.placeData.items[k] && FUP.req.met(FUP.placeData.items[k].req)), rng);
      const offers = [];
      if (seed) offers.push({ kind: 'seeds', id: seed, n: e.seeds, bought: false });
      if (bait) offers.push({ kind: 'bait', id: bait, n: e.bait, bought: false });
      else { const s2 = this.one(crops.filter(k => k !== seed), rng); if (s2) offers.push({ kind: 'seeds', id: s2, n: e.seeds, bought: false }); }
      if (ground) offers.push({ kind: 'place', id: ground, n: 1, bought: false });
      return offers.length ? { offers } : null;
    }
    if (id === 'pigeon_mail') {
      const riddles = FUP.village.riddlesForSale();
      if (rng() < e.coinsChance || !riddles.length) return { coins: this.between(e.coins, rng) };
      return { riddle: this.one(riddles, rng).name, coins: this.between(e.coins, rng) };   // coins if the riddle is gone by the time you read it
    }
    if (id === 'lost_tourist') { const ing = this.one(this.ingPool('Uncommon'), rng); return ing ? { ing } : null; }
    if (id === 'crop_thieves') {
      const P = this.growing().map(k => k.split(',').map(Number)), taken = new Set(P.map(([x, y]) => x + ',' + y)), near = [];
      for (const [x, y] of P) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const tx = x + dx, ty = y + dy, k = tx + ',' + ty;
        if (taken.has(k) || FUP.garden.isPatch(tx, ty) || !this.open(tx, ty)) continue;
        taken.add(k); near.push({ tx, ty });
      }
      const from = near.length >= e.count ? near : near.concat(P.map(([tx, ty]) => ({ tx, ty })));   // tight farms: on the patches themselves
      const squares = [];
      while (squares.length < e.count && from.length) squares.push({ ...from.splice(Math.floor(rng() * from.length), 1)[0], gone: false });
      return squares.length ? { squares, until: this.now() + e.seconds } : null;
    }
    if (id === 'chef_challenge') { const r = this.one(this.cookedNames(), rng); return r ? { recipe: r } : null; }
    if (id === 'glitter_pond') return { left: e.catches };
    if (id === 'mystery_crate') return { spot: this.one(e.spots, rng), prize: this.rollPrize(e.table, rng) };
    return {};   // rain, market day
  },
  // A square you can stand on in the village
  open(tx, ty) { return FUP.world && FUP.world.walkable ? FUP.world.walkable('village', tx, ty) && !(FUP.place && FUP.place.blocked && FUP.place.blocked('village', tx, ty)) : !FUP.villageMap.blockedTile(tx, ty); },

  // ---------- Peddler ----------
  basePrice(o) {
    if (o.kind === 'seeds') return FUP.gardenData.crops[o.id].seedPrice * o.n;
    if (o.kind === 'bait') return FUP.fishData.bait[o.id].price * o.n;
    return (FUP.placeData.items[o.id].cost || {}).coins || 0;
  },
  offerPrice(o) { return FUP.village.buyPrice(this.basePrice(o) * (1 - this.def('peddler').discount)); },
  offerName(o) {
    if (o.kind === 'seeds') return `${o.n} ${FUP.ingredients[o.id].name} seeds`;
    if (o.kind === 'bait') return `${o.n} ${FUP.fishData.bait[o.id].name}`;
    return FUP.placeData.items[o.id].name;
  },
  // 'ok' | 'broke' | 'gone'
  buyOffer(i) {
    const d = this.is('peddler') && this.data(), o = d && d.offers[i];
    if (!o || o.bought) return 'gone';
    const p = this.offerPrice(o);
    if (FUP.run.coins < p) return 'broke';
    FUP.run.coins -= p;
    o.bought = true;
    if (o.kind === 'seeds') FUP.garden.state.seeds[o.id] = FUP.garden.seedCount(o.id) + o.n;
    else if (o.kind === 'bait') { FUP.fishing.state.bait[o.id] = FUP.fishing.baitCount(o.id) + o.n; if (!FUP.fishing.state.using) FUP.fishing.state.using = o.id; }
    else FUP.place.state.owned[o.id] = FUP.place.ownedCount(o.id) + o.n;
    if (d.offers.every(x => x.bought)) this.end(true);
    return 'ok';
  },

  // ---------- Pigeon Mail ----------
  // Returns { coins } or { riddle } (what was in the letter)
  openMail() {
    const d = this.is('pigeon_mail') && this.data();
    if (!d) return null;
    const cb = FUP.cooking.cookbook, r = d.riddle && FUP.recipeData.list.find(x => x.name === d.riddle);
    let out;
    if (r && !cb.discovered[r.name] && !cb.riddles[r.name]) { cb.riddles[r.name] = true; out = { riddle: r.riddle, level: r.level }; }
    else { FUP.run.coins += d.coins; out = { coins: d.coins }; }
    this.end(true);
    return out;
  },

  // ---------- Lost Tourist ----------
  touristDishes() {
    const min = this.def('lost_tourist').minStars;
    return FUP.run.dishStacks().filter(st => !st.dish.burnt && !st.dish.inedible && FUP.cooking.stars(st.dish.tier) >= min);
  },
  // Give him one dish (index in the backpack). 'ok' | 'full' | 'gone'
  feedTourist(index) {
    const d = this.is('lost_tourist') && this.data(), dish = FUP.run.satchel[index];
    if (!d || !dish) return 'gone';
    if (!FUP.run.canAddIng(d.ing)) return 'full';
    FUP.run.satchel.splice(index, 1);
    FUP.run.addToBag(d.ing);
    this.lastGift = d.ing;
    FUP.skills.addXp('rizz', this.def('lost_tourist').rizzXp);
    this.end(true);
    return 'ok';
  },

  // ---------- Crop Thieves ----------
  // Shoo squirrel i: +1 reward (if there's room). Returns true when it was there to shoo.
  shoo(i) {
    const d = this.is('crop_thieves') && this.data(), q = d && d.squares[i];
    if (!q || q.gone) return false;
    q.gone = true;
    FUP.run.addToBag(this.def('crop_thieves').reward);
    if (d.squares.every(x => x.gone)) this.end(true);
    return true;
  },
  // After `seconds` the rest run off (nothing is ever stolen). True = they just left.
  thievesTick() {
    const d = this.is('crop_thieves') && this.data();
    if (!d || this.now() < d.until) return false;
    this.end(d.squares.some(x => x.gone));
    return true;
  },

  // ---------- Chef's Challenge ----------
  challengeRecipe() { const d = this.is('chef_challenge') && this.data(); return d ? FUP.recipeData.list.find(r => r.name === d.recipe) || null : null; },
  // Backpack index of a dish he'd take (fewest stars first), or -1
  challengeHave() {
    const r = this.challengeRecipe();
    if (!r) return -1;
    const name = FUP.cooking.title(r.name), C = FUP.cooking;
    let best = -1;
    FUP.run.satchel.forEach((d, i) => { if (d.name === name && !d.burnt && (best < 0 || C.stars(d.tier) < C.stars(FUP.run.satchel[best].tier))) best = i; });
    return best;
  },
  challengeReward(dish) {
    const e = this.def('chef_challenge'), r = this.challengeRecipe();
    return { coins: Math.round(e.coinMult * FUP.village.dishBasePrice(dish)), xp: Math.round(e.xpMult * ((r && r.xp) || 0)) };
  },
  // Returns { coins, xp } or null
  handInChallenge() {
    const i = this.challengeHave();
    if (i < 0) return null;
    const dish = FUP.run.satchel[i], pay = this.challengeReward(dish);
    FUP.run.satchel.splice(i, 1);
    FUP.run.coins += pay.coins;
    FUP.skills.addXp('cooking', pay.xp);
    this.end(true);
    return pay;
  },

  // ---------- The Pond Glitters ----------
  // After a catch at a village pond: one more of the same fish (if there's room). Returns { left } or null.
  glitterCatch(spotId, fishId) {
    const d = this.is('glitter_pond') && this.data();
    if (!d || spotId !== 'pond' || d.left <= 0 || !FUP.run.addToBag(fishId)) return null;
    FUP.facts.add('fish:' + fishId);
    d.left--;
    if (d.left <= 0) this.end(true);
    return { left: d.left };
  },

  // ---------- Mystery Crate ----------
  prizeText(p) {
    if (p.coins) return `${p.coins} coins`;
    if (p.ing) return `${p.n > 1 ? p.n + ' ' : ''}${FUP.ingredients[p.ing].name}`;
    return `a ${FUP.placeData.items[p.curio].name} (in your Build list)`;
  },
  // Returns { text } or 'full' (no room for what's inside: it stays shut)
  openCrate() {
    const d = this.is('mystery_crate') && this.data();
    if (!d) return null;
    const p = d.prize;
    if (p.ing) {
      if (!FUP.run.canAddIng(p.ing)) return 'full';
      for (let i = 0; i < p.n; i++) FUP.run.addToBag(p.ing);
    } else if (p.curio) FUP.place.state.owned[p.curio] = FUP.place.ownedCount(p.curio) + 1;
    else FUP.run.coins += p.coins;
    this.end(true);
    return { text: this.prizeText(p) };
  },

  // ---------- Hooks other systems read ----------
  biteMult() { return this.is('rain') && FUP.world && FUP.world.state && FUP.world.state.region === 'village' ? 1 - this.def('rain').biteCut : 1; },
  stallMult() { return this.is('market_day') ? this.def('market_day').stallSpeed : 1; },

  // Where it is on the map: { tx, ty } or null (rain, market day)
  spotOf() {
    const a = this.active();
    if (!a) return null;
    const e = this.def(a.id), V = FUP.villageData;
    let s = a.data.spot || e.spot;
    if (s === 'chef') s = V.npcs.chef.spot;
    if (s === 'door') { const i = Math.max(0, V.doors.findIndex((_, k) => FUP.house.owns(k))); s = V.doors[i]; }
    return s || null;
  },
  // For the away card: "A Mystery Crate in the village."
  activeLine() { const a = this.active(); return a ? `${this.def(a.id).name} in the village.` : null; },
};
