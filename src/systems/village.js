// ============================================================
// VILLAGE RULES — prices, haggling, buying, selling, Chef's hints.
// No drawing. Numbers come from data/village.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.village = {
  // Always-on Rizz discount (blueprint 10): 1% per level, up to 30%.
  rizzCut() {
    const d = FUP.villageData;
    return Math.min(d.rizzDiscountMax, d.rizzDiscountPerLevel * FUP.skills.level('rizz'));
  },
  // How haggling went this visit: null (not tried), 'win' or 'fail'.
  haggled() { return FUP.run.haggle || null; },

  // npc (optional) = which villager is selling: secrets you've heard can give a lasting discount there.
  buyPrice(base, npc = null) {
    const h = FUP.villageData.haggle;
    let mult = 1 - this.rizzCut() - FUP.unlocks.npcCut(npc);
    if (this.haggled() === 'win') mult -= h.winDiscount;
    if (this.haggled() === 'fail') mult += h.failMarkup;
    return Math.max(1, Math.round(base * mult));
  },
  sellPrice(base) {
    let mult = 1 + this.rizzCut() + FUP.unlocks.perkSum('sellBonus');   // Bargain Hunter perk
    if (this.haggled() === 'win') mult += FUP.villageData.haggle.winDiscount;
    return Math.max(1, Math.round(base * mult));
  },

  haggleChance() {
    const h = FUP.villageData.haggle;
    return Math.min(0.95, h.baseChance + h.perLevel * FUP.skills.level('rizz') + (FUP.gear.totals().rizz || 0));
  },
  // Haggler perk (Rizz 27): one retry per visit after a failed haggle.
  canRetryHaggle() { return FUP.run.haggle === 'fail' && !FUP.run.haggleRetried && FUP.unlocks.hasPerk('haggleRetry'); },
  // One try per visit. Returns { won, levels } or null if already tried.
  tryHaggle(rng = Math.random) {
    if (this.haggled() && !this.canRetryHaggle()) return null;
    if (this.haggled()) FUP.run.haggleRetried = true;
    const won = rng() < this.haggleChance();
    FUP.run.haggle = won ? 'win' : 'fail';
    return { won, levels: FUP.skills.addXp('rizz', FUP.villageData.haggle.xp) };
  },

  // ---------- Buying ----------
  gearPrice(key) { return this.buyPrice(FUP.gearData.items[key].price, FUP.villageData.smithStock.includes(key) ? 'smith' : 'shop'); },
  buyGear(key) { return FUP.run.buy(key, this.gearPrice(key)); },

  ingredientPrice(id) { return this.buyPrice(FUP.villageData.shopIngredients[id], 'shop'); },
  // Returns 'ok', 'broke' or 'full'.
  buyIngredient(id) {
    const run = FUP.run, price = this.ingredientPrice(id);
    if (run.coins < price) return 'broke';
    if (!run.addToBag(id)) return 'full';
    run.coins -= price;
    return 'ok';
  },

  // ---------- Selling (to the Shopkeeper) ----------
  gearSellPrice(item) { return this.sellPrice(item.sell); },
  sellGear(item) { const p = this.gearSellPrice(item); FUP.run.sell(item, p); return p; },

  // A dish's plain price (no Rizz bonus, no haggling): food stalls use this
  dishBasePrice(dish) {
    const byTier = { Inedible: 1, Edible: 6, Tasty: 14, Delicious: 25, Legendary: 40 };
    return dish.sell !== undefined ? dish.sell : (byTier[dish.tier] || 5);
  },
  dishSellPrice(dish) { return this.sellPrice(this.dishBasePrice(dish)); },
  sellDish(index) {
    const dish = FUP.run.satchel[index];
    if (!dish) return 0;
    const p = this.dishSellPrice(dish);
    FUP.run.satchel.splice(index, 1);
    FUP.run.coins += p;
    return p;
  },

  ingredientSellPrice(id) { const ing = FUP.ingredients[id]; return this.sellPrice(ing.sell || FUP.villageData.ingredientSellPrice[ing.rarity] || 1); },   // each ingredient has its own price (v0.40)
  sellIngredient(id) {
    if (FUP.run.bagCount(id) <= 0) return 0;
    const p = this.ingredientSellPrice(id);
    FUP.run.takeFromBag([id]);
    FUP.run.coins += p;
    return p;
  },

  // ---------- Gill the Fishmonger: pays more for raw fish ----------
  fishBonus() { return FUP.villageData.fishBonus + FUP.unlocks.giftSum('fishmonger', 'fishBonus'); },
  fishPrice(id) { return this.sellPrice(FUP.ingredients[id].sell * this.fishBonus()); },
  // Fish you own: in the backpack first, then the pantry at home. [{ id, n }]
  fishOwned() {
    const pantry = FUP.house.state.pantry || {};
    return Object.keys(FUP.ingredients).filter(id => FUP.ingredients[id].source === 'Fishing')
      .map(id => ({ id, n: FUP.run.bagCount(id) + (pantry[id] || 0) })).filter(f => f.n > 0);
  },
  // Sell up to `n` of one fish (backpack first, then pantry). Returns the coins earned.
  sellFish(id, n = 1) {
    const pantry = FUP.house.state.pantry || {}, price = this.fishPrice(id);
    let sold = 0;
    while (sold < n) {
      if (FUP.run.bagCount(id) > 0) FUP.run.takeFromBag([id]);
      else if (pantry[id] > 0) { pantry[id]--; if (!pantry[id]) delete pantry[id]; }
      else break;
      sold++;
    }
    FUP.run.coins += sold * price;
    if (sold) FUP.quests.event('sellFish', { id, count: sold });
    return sold * price;
  },

  // ---------- Chef Marrowbone's riddles ----------
  // Secret recipes you haven't discovered or bought a riddle for yet, lowest level first.
  riddlesForSale() {
    const cb = FUP.cooking.cookbook;
    return FUP.recipeData.list.filter(r => r.secret && !cb.discovered[r.name] && !cb.riddles[r.name]).sort((a, b) => a.level - b.level);
  },
  // Rizz 20+: Marrowbone charges half (data/village.js riddleHalfPriceRizz)
  riddlePrice(r) {
    const d = FUP.villageData, P = d.riddlePrice, half = FUP.skills.level('rizz') >= d.riddleHalfPriceRizz ? d.riddleRizzMult : 1;
    return this.buyPrice((P.base + P.perLevel * r.level) * half, 'chef');
  },
  buyRiddle(r) {
    const p = this.riddlePrice(r);
    if (FUP.run.coins < p) return false;
    FUP.run.coins -= p;
    FUP.cooking.cookbook.riddles[r.name] = true;   // the recipe book shows it from now on
    return true;
  },
};
