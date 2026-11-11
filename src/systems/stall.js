// ============================================================
// FOOD STALL RULES — stock, selling over play time, the till, upgrades.
// No drawing. Numbers in data/stall.js. One entry per placed stall,
// keyed by the placed thing's uid (src/systems/place.js).
// ============================================================
window.FUP = window.FUP || {};

FUP.stall = {
  // byUid: { uid: { tier, stock: [dish, ...], till, t } }   (t = play seconds since its last sale)
  state: { byUid: {} },
  reset() { this.state = { byUid: {} }; },

  // Every placed stall: [placed entry, ...]
  placed() { return FUP.place.state.placed.filter(p => (FUP.place.item(p.item) || {}).stall); },
  get(uid) {
    if (!this.state.byUid[uid]) this.state.byUid[uid] = { tier: 0, stock: [], till: 0, t: 0 };
    return this.state.byUid[uid];
  },
  tier(uid) { return FUP.stallData.tiers[this.get(uid).tier]; },
  nextTier(uid) { return FUP.stallData.tiers[this.get(uid).tier + 1] || null; },
  cap(uid) { return this.tier(uid).stock; },
  tillCap(uid) { return this.tier(uid).till * FUP.unlocks.perkBest('tillMult', 1); },
  // Play seconds between sales
  seconds(uid) {
    const market = FUP.facts.has('repair:market') && FUP.repairData && FUP.repairData.market ? FUP.repairData.market.stallSpeed : 1;
    return (this.tier(uid).sellSeconds || FUP.stallData.sellSeconds) * (1 - FUP.unlocks.perkSum('stallSpeedCut')) * market;
  },

  // Will customers buy this dish?
  accepts(dish) { return !dish.burnt && !dish.inedible && !FUP.stallData.refuse.includes(dish.name); },
  // What one sale puts in the till: the Shopkeeper's plain price (no Rizz, no haggle) plus the premium
  salePrice(dish) { return Math.round(FUP.village.dishBasePrice(dish) * (FUP.stallData.premium + FUP.unlocks.perkSum('stallPremium'))); },

  // Backpack -> stall. `dish` is one of FUP.run.satchel.
  add(uid, dish) {
    const s = this.get(uid), i = FUP.run.satchel.indexOf(dish);
    if (i < 0 || s.stock.length >= this.cap(uid) || !this.accepts(dish)) return false;
    s.stock.push(...FUP.run.satchel.splice(i, 1));
    return true;
  },
  // Stall -> backpack (needs room)
  remove(uid, i) {
    const s = this.get(uid), d = s.stock[i];
    if (!d || !FUP.run.canAddDish(d.name, d.tier)) return false;
    FUP.run.satchel.push(...s.stock.splice(i, 1));
    return true;
  },

  // Called once per second of play (FUP.clock.every, below)
  tick(dt = 1, rng = Math.random) {
    for (const p of this.placed()) {
      const s = this.get(p.uid);
      s.t += dt;
      if (s.t < this.seconds(p.uid)) continue;
      s.t = 0;   // a long gap never sells more than one dish
      if (!s.stock.length || s.till >= this.tillCap(p.uid)) continue;
      const [dish] = s.stock.splice(Math.floor(rng() * s.stock.length), 1);
      s.till = Math.min(this.tillCap(p.uid), s.till + this.salePrice(dish));
      FUP.facts.add('stallSold');
    }
  },

  // Take the coins. Returns how many.
  collect(uid) {
    const s = this.get(uid), n = s.till;
    FUP.run.coins += n; s.till = 0;
    return n;
  },

  // 'ok' | 'max' | 'locked' | 'broke'
  // The next upgrade's cost after the hammer's discount (data/tools.js buildCut)
  upgradeCost(uid) {
    const n = this.nextTier(uid);
    return n ? { ...n.cost, coins: Math.round((n.cost.coins || 0) * (1 - FUP.unlocks.perkSum('buildCut'))) } : null;
  },
  upgrade(uid) {
    const n = this.nextTier(uid);
    if (!n) return 'max';
    if (!FUP.req.met(n.req)) return 'locked';
    if (!FUP.req.pay(this.upgradeCost(uid), { npc: 'carpenter' })) return 'broke';
    this.get(uid).tier++;
    FUP.skills.addXp('building', Math.round((n.cost.coins || 0) * FUP.placeData.xp.perCoin));
    return 'ok';
  },

  // The stall is taken back into your pocket: its dishes go to the backpack (or home storage), the till is paid out.
  closeDown(uid) {
    const s = this.state.byUid[uid];
    if (!s) return;
    for (const d of s.stock) {
      if (FUP.run.canAddDish(d.name, d.tier)) FUP.run.satchel.push(d);
      else FUP.house.state.dishes.push(d);
    }
    FUP.run.coins += s.till;
    delete this.state.byUid[uid];
  },
};

// Stalls sell on play time: once a second while the clock runs (not on the title, not while the game is closed)
if (FUP.clock) FUP.clock.every(1, 'stall', () => FUP.stall.tick(1));
