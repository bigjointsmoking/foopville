// ============================================================
// VILLAGE RULES — prices, haggling, buying, selling, Chef's hints.
// No drawing. Numbers come from data/village.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.village = {
  // ---------- The Sir Foop legends (story Phase B) ----------
  // Does this villager have a legend to tell?
  hasLegend(npc) { const n = FUP.villageData.npcs[npc]; return !!(n && n.legend); },
  // Will they tell it? Guarded villagers (legendRizz) only at that Rizz, or while their quest is taken.
  willTell(npc) {
    const n = FUP.villageData.npcs[npc];
    if (!n || !n.legend) return false;
    if (!n.legendRizz) return true;
    const onQuest = !!(n.legendQuest && FUP.quests.state.active[n.legendQuest]);
    return onQuest || FUP.skills.level('rizz') >= n.legendRizz;
  },
  // What they say when you ask: the legend plus a reaction for every clue you've found, or a brush-off
  legendText(npc) {
    const n = FUP.villageData.npcs[npc];
    if (!this.willTell(npc)) return Phaser.Utils.Array.GetRandom(n.brushOff || ['Not now.']);
    const extra = (n.reacts || []).filter(r => FUP.facts.has(r.fact)).map(r => r.line);
    return [n.legend, ...extra].join('\n\n');
  },

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
    return Math.max(1, Math.round(base * mult * FUP.villageData.sellMult));   // v0.78: everything sells for 50% more
  },

  haggleChance() {
    const h = FUP.villageData.haggle;
    return Math.min(0.95, h.baseChance + h.perLevel * FUP.skills.level('rizz') + (FUP.gear.totals().rizz || 0));
  },
  // Haggler perk (Rizz 27): one retry per visit after a failed haggle.
  canRetryHaggle() { return FUP.run.haggle === 'fail' && !FUP.run.haggleRetried && (FUP.unlocks.hasPerk('haggleRetry') || FUP.facts.has('perk:keptSign')); },   // (or the sign you kept: Clearing Out)
  // One try per visit. Returns { won, levels } or null if already tried.
  tryHaggle(rng = Math.random) {
    if (this.haggled() && !this.canRetryHaggle()) return null;
    if (this.haggled()) FUP.run.haggleRetried = true;
    const won = rng() < this.haggleChance();
    FUP.run.haggle = won ? 'win' : 'fail';
    if (FUP.tutorial) FUP.tutorial.note('haggle');   // Orientation Isle
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
  // Ready-made food (v0.78): 'ok' | 'broke' | 'full'
  snackPrice(id) { return this.buyPrice(FUP.villageData.shopSnacks[id].price, 'shop'); },
  buySnack(id) {
    const s = FUP.villageData.shopSnacks[id], price = this.snackPrice(id), run = FUP.run;
    if (run.coins < price) return 'broke';
    if (!run.canAddDish(s.name, 'Snack')) return 'full';
    run.coins -= price;
    run.satchel.push({ name: s.name, emoji: s.emoji, tier: 'Snack', sprite: null, heal: s.heal, buffs: [], resists: [], throwDamage: s.throwDamage, element: 'blunt', sell: s.sell });
    return 'ok';
  },
  // Never sell something back for more than 90% of what the shop charges for it right now (v0.78: no buy-low-sell-high loop)
  resaleCap(price, buyPrice) { return buyPrice ? Math.max(1, Math.min(price, Math.floor(buyPrice * FUP.villageData.resaleCap))) : price; },
  gearSellPrice(item) {
    const sold = FUP.villageData.smithStock.includes(item.key) || FUP.villageData.shopTrinkets.includes(item.key);
    return this.resaleCap(this.sellPrice(item.sell), sold && FUP.gearData.items[item.key] ? this.gearPrice(item.key) : 0);
  },
  sellGear(item) { const p = this.gearSellPrice(item); FUP.run.sell(item, p); this.sold(); return p; },
  sold() { if (FUP.tutorial) FUP.tutorial.note('sell'); if (FUP.facts && !(FUP.tutorial && FUP.tutorial.active())) FUP.facts.add('did:sell'); },   // Orientation Isle: "sell something"

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
    this.sold();
    return p;
  },

  ingredientSellPrice(id) { const ing = FUP.ingredients[id]; return this.resaleCap(this.sellPrice(ing.sell || FUP.villageData.ingredientSellPrice[ing.rarity] || 1), FUP.villageData.shopIngredients[id] ? this.ingredientPrice(id) : 0); },   // each ingredient has its own price (v0.40)
  sellIngredient(id) {
    if (FUP.run.bagCount(id) <= 0) return 0;
    const p = this.ingredientSellPrice(id);
    FUP.run.takeFromBag([id]);
    FUP.run.coins += p;
    this.sold();
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
    if (sold) this.sold();
    return sold * price;
  },

  // ---------- Chef Marrowbone's riddles ----------
  // Secret recipes you haven't discovered or bought a riddle for yet, lowest level first.
  riddlesForSale() {
    const cb = FUP.cooking.cookbook;
    return FUP.recipeData.list.filter(r => r.secret && !r.noRiddle && !cb.discovered[r.name] && !cb.riddles[r.name]).sort((a, b) => a.level - b.level);
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
