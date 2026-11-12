// ============================================================
// HOUSE — which upgrades you own, buying them, and the pantry. No drawing.
// Numbers live in data/house.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.house = {
  // Tier owned on each line (0 = what you start with), and what's in the pantry.
  // gear / dishes: spare gear and food kept at home (v0.41 storage; no limit)
  state: { houses: 0, stoves: 0, pantries: 0, pantry: {}, gear: [], dishes: [], stoveLine: 2 },

  // The upgrade lines, in the order the Carpenter shows them.
  LINES: ['houses', 'stoves', 'pantries'],

  reset() { this.state = { houses: 0, stoves: 0, pantries: 0, pantry: {}, gear: [], dishes: [], stoveLine: 2 }; },
  // stoveLine 2 (v0.68): 'No stove' became tier 0. Older saves owned at least the Old Stove, so they move up one.

  // What you own on a line, and the next thing you could buy (null = all bought).
  current(line) { return FUP.houseData[line][this.state[line]]; },
  next(line) { return FUP.houseData[line][this.state[line] + 1] || null; },
  nextPrice(line) { const n = this.next(line); return n ? FUP.village.buyPrice(n.price, 'carpenter') : null; },

  // Buy the next tier. Returns 'ok', 'broke' or 'maxed'.
  buy(line) {
    const n = this.next(line);
    if (!n) return 'maxed';
    const price = this.nextPrice(line);
    if (FUP.run.coins < price) return 'broke';
    FUP.run.coins -= price;
    this.state[line]++;
    return 'ok';
  },

  houseName() { return this.current('houses').name; },          // the best house you own
  owns(i) { return i <= this.state.houses; },                   // house i (0 = Cottage) is yours
  // Does this map square's patch belong to you? '1'/'2'/'3' = a house's plot. ('p' is a farm plot you buy, v0.41.)
  ownsPatch(ch) {
    const i = FUP.houseData.houses.findIndex(h => h.plotChar === ch);
    return i >= 0 && this.owns(i);
  },
  houseForPatch(ch) { return FUP.houseData.houses.findIndex(h => h.plotChar === ch); },
  stoveBurnCut() { return this.current('stoves').burnCut; },
  canCook() { return this.current('stoves').canCook !== false; },   // you own a stove (v0.68)

  // ---------- Pantry ----------
  // Perks from every house you own (they add up)
  houseSum(key) { return FUP.houseData.houses.filter((h, i) => this.owns(i)).reduce((t, h) => t + (h[key] || 0), 0); },
  canNap() { return FUP.houseData.houses.some((h, i) => h.nap && this.owns(i)); },
  pantryMax() { return this.current('pantries').slots + this.houseSum('pantryBonus'); },
  pantryCount(id) { return this.state.pantry[id] || 0; },
  pantryTotal() { return Object.values(this.state.pantry).reduce((a, b) => a + b, 0); },
  pantryFull() { return this.pantryTotal() >= this.pantryMax(); },

  // Put one in the pantry (from nowhere: the caller already took it). Returns true if it fit.
  addOne(id) {
    if (this.pantryFull()) return false;
    this.state.pantry[id] = this.pantryCount(id) + 1;
    return true;
  },
  // Bag -> pantry, n of them (or as many as fit). Returns how many moved.
  store(id, n = 1) {
    let moved = 0;
    while (moved < n && FUP.run.bagCount(id) > 0 && !this.pantryFull()) {
      FUP.run.takeFromBag([id]); this.addOne(id); moved++;
    }
    return moved;
  },
  // Pantry -> bag. Returns how many moved.
  take(id, n = 1) {
    let moved = 0;
    while (moved < n && this.pantryCount(id) > 0 && FUP.run.addToBag(id)) {
      this.state.pantry[id]--; moved++;
    }
    if (!this.state.pantry[id]) delete this.state.pantry[id];
    return moved;
  },
};
