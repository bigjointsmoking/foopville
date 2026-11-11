// ============================================================
// RUN STATE — your bag of ingredients and your satchel of dishes.
// Camp (cooking) and Battle both read and change this, so what you
// cook is what you fight with, and what you find is what you cook.
// ============================================================
window.FUP = window.FUP || {};

FUP.run = {
  weapon: 'sword',
  bag: {},       // { ingredient id: how many }
  satchel: [],   // cooked dishes, ready to eat in a fight
  fights: 0,     // fights survived this life
  hp: null,      // your health between fights (null = full)
  limit: 0,      // your Limit bar between fights (0-100)
  runs: 0,       // Forest runs finished this life
  coins: 0,      // carried coins (the Landlord wants them)
  forest: null,  // the Forest you're walking right now (null = not on a run)
  battle: null,  // which Forest enemy you're fighting, and how it ended
  equipped: {},  // gear you're wearing: { weapon, head, body, legs, trinket } (null = empty)
  stash: [],     // gear in your backpack (not worn). v0.41: carried, takes backpack slots. Spare gear at home is in FUP.house.state.gear
  packTier: 0,   // satchels bought (data/run.js packUpgrades)
  hero: { name: 'You', look: null, mode: 'normal' },  // name, looks and game mode from the character creator
  haggle: null,  // haggling with the Shopkeeper this visit: null, 'win' or 'fail'
  secrets: {},   // villager Rizz secrets you've heard: { 'smith:10': true } (src/systems/unlocks.js)

  // A brand new life: fresh bag, empty satchel, levels and cookbook wiped (blueprint 5).
  newLife(weaponKey, hero) {
    this.weapon = weaponKey;
    this.hero = { name: 'You', look: null, ...(hero || {}) };
    if (!FUP.runData.modes[this.hero.mode]) this.hero.mode = FUP.runData.defaultMode;
    this.haggle = null;
    this.secrets = {};
    this.bag = { ...FUP.runData.startingBag };
    this.satchel = [];
    this.fights = 0;
    this.hp = null;
    this.limit = 0;
    this.runs = 0;
    this.coins = 0;
    this.forest = null;
    this.battle = null;
    this.stash = [];
    this.packTier = 0;
    this.equipped = {};
    for (const slot of FUP.gearData.slots) this.equipped[slot] = null;
    for (const [key, it] of Object.entries(FUP.gearData.items)) if (it.starter) this.equipped[it.slot] = FUP.gear.fromShop(key);
    FUP.save.resetParts();   // skills, cookbook, garden, house, quests, grave, facts... (src/systems/save.js)
  },

  // Game mode (picked in the character creator, locked for life)
  mode() { return this.hero.mode; },
  isHardcore() { return this.mode() === 'hardcore'; },
  modeInfo() { return FUP.runData.modes[this.mode()]; },

  bagCount(id) { return this.bag[id] || 0; },
  bagTotal() { return Object.values(this.bag).reduce((a, b) => a + b, 0); },

  // ---------- Backpack (v0.41) ----------
  // Slots: base + Lunchbox (gear 'satchel' stat) + Manor + satchels you bought.
  packMax() {
    const up = FUP.runData.packUpgrades[this.packTier - 1];
    return FUP.runData.packSlots + FUP.gear.totals().satchel + FUP.house.houseSum('satchelBonus') + (up ? up.slots : 0);
  },
  dishKey(d) { return `${d.name}|${d.tier}`; },
  // Dishes grouped into stacks: [{ key, dish, idx: [satchel indexes], n }]
  dishStacks() {
    const S = FUP.runData.stack.dish, groups = {}, out = [];
    this.satchel.forEach((d, i) => { const k = this.dishKey(d); (groups[k] = groups[k] || { key: k, dish: d, idx: [] }).idx.push(i); });
    for (const g of Object.values(groups)) for (let a = 0; a < g.idx.length; a += S) out.push({ key: g.key, dish: g.dish, idx: g.idx.slice(a, a + S), n: Math.min(S, g.idx.length - a) });
    return out;
  },
  slotsUsed() {
    const S = FUP.runData.stack;
    const ing = Object.values(this.bag).reduce((t, n) => t + Math.ceil(n / S.ingredient), 0);
    return ing + this.dishStacks().length + this.stash.length;
  },
  freeSlots() { return Math.max(0, this.packMax() - this.slotsUsed()); },
  // Room for one more of this ingredient? (A stack with space, or a free slot.)
  canAddIng(id) { const n = this.bagCount(id); return (n > 0 && n % FUP.runData.stack.ingredient !== 0) || this.freeSlots() > 0; },
  // Room for one more of this dish (name + stars)?
  canAddDish(name, tier) {
    const n = this.satchel.filter(d => d.name === name && d.tier === tier).length;
    return (n > 0 && n % FUP.runData.stack.dish !== 0) || this.freeSlots() > 0;
  },
  canAddGear() { return this.freeSlots() > 0; },
  // Put gear in the backpack. Returns false if there's no room.
  addGear(item) { if (!this.canAddGear()) return false; this.stash.push(item); return true; },
  // Satchels from the Shopkeeper
  nextPackUpgrade() { return FUP.runData.packUpgrades[this.packTier] || null; },
  buyPackUpgrade(price) {
    const n = this.nextPackUpgrade();
    if (!n || this.coins < price) return false;
    this.coins -= price; this.packTier++;
    return true;
  },

  // Add one ingredient. Returns false if the backpack is full.
  addToBag(id) {
    if (!this.canAddIng(id)) return false;
    this.bag[id] = this.bagCount(id) + 1;
    return true;
  },

  takeFromBag(ids) {
    for (const id of ids) {
      this.bag[id] = this.bagCount(id) - 1;
      if (this.bag[id] <= 0) delete this.bag[id];
    }
  },

  // Your max HP right now (from Melee level + weapon).
  maxHp() { return FUP.combat.makePlayer(FUP.skills.level('melee'), FUP.weapons[this.weapon]).maxHp; },
  currentHp() { return this.hp === null ? this.maxHp() : Math.min(this.hp, this.maxHp()); },

  // Eat a dish outside a fight: only the healing counts (buffs fade before the next fight).
  // Burnt food still hurts (you gag), but can't kill you at camp. Returns HP gained (can be negative).
  eatAtCamp(index) {
    if (index < 0) return 0;
    const [dish] = this.satchel.splice(index, 1);
    if (!dish) return 0;
    const max = this.maxHp(), before = this.currentHp();
    const g = FUP.gear.totals(), tough = false;   // (Iron Stomach was dropped in v0.58)
    let hp = Math.min(max, before + Math.round(dish.heal * FUP.weapons[this.weapon].healMult * (1 + g.heal)));
    if (tough) { this.hp = hp; return { dish, change: hp - before }; }  // Iron Stomach: nothing hurts
    if (dish.inedible) hp = Math.max(1, hp - Math.max(1, Math.round(max * FUP.cookingData.inedibleSelfDamage))); // you gag
    this.hp = hp;
    return { dish, change: hp - before };
  },

  // Eat one ingredient raw from the bag outside a fight: only the healing counts.
  eatRawAtCamp(id) {
    const dish = FUP.cooking.rawDish(id);
    if (!dish || this.bagCount(id) <= 0) return null;
    this.takeFromBag([id]);
    const max = this.maxHp(), before = this.currentHp();
    const g = FUP.gear.totals();
    let hp = Math.min(max, before + Math.round(dish.heal * FUP.weapons[this.weapon].healMult * (1 + g.heal)));
    if (dish.hpCost) hp = Math.max(1, hp - dish.hpCost);
    this.hp = hp;
    return { dish, change: hp - before };
  },

  // (Old names, kept so older code still works: the satchel is part of the backpack now.)
  satchelMax() { return this.packMax(); },
  satchelFull() { return this.freeSlots() <= 0; },

  // ---------- Gear ----------
  // Wear an item from your stash. Whatever was in that slot goes back to the stash.
  // Weapon upgrades need a Melee level (data/unlocks.js). Returns false if you can't wear it.
  equip(item) {
    const i = this.stash.indexOf(item);
    if (i < 0 || !FUP.unlocks.canWear(item)) return false;
    this.stash.splice(i, 1);
    if (this.equipped[item.slot]) this.stash.push(this.equipped[item.slot]);
    this.equipped[item.slot] = item;
    this.capHp();
    return true;
  },
  unequip(slot) {
    if (!this.equipped[slot] || !this.canAddGear()) return false;   // needs a free backpack slot (v0.41)
    this.stash.push(this.equipped[slot]);
    this.equipped[slot] = null;
    this.capHp();
    return true;
  },
  // Buy from the shop. It's worn straight away if that slot is empty (and you're strong enough). Returns the item or null.
  // price = after haggling (src/systems/village.js); defaults to the list price.
  buy(key, price) {
    const d = FUP.gearData.items[key];
    if (price === undefined) price = d ? d.price : 0;
    if (!d || this.coins < price) return null;
    this.coins -= price;
    const item = FUP.gear.fromShop(key);
    // Worn straight away if that slot is empty; otherwise it needs a backpack slot (v0.41)
    if (!this.equipped[item.slot] && FUP.unlocks.canWear(item)) { this.equipped[item.slot] = item; this.capHp(); }
    else if (!this.addGear(item)) { this.coins += price; return null; }
    return item;
  },
  sell(item, price = item.sell) {
    const i = this.stash.indexOf(item);
    if (i < 0) return;
    this.stash.splice(i, 1);
    this.coins += price;
  },
  // Taking off a +HP item can't leave you above your new max.
  capHp() { if (this.hp !== null) this.hp = Math.min(this.hp, this.maxHp()); },

  // Turn a cooking result into something you can eat in a fight.
  // Returns false (and keeps nothing) if the backpack has no room for it.
  addDish(result) {
    const fx = result.effects;
    if (!this.canAddDish(result.name, result.tier.name)) return false;
    this.satchel.push({
      name: result.name, emoji: result.emoji, tier: result.tier.name, tierColor: result.tier.color,
      sprite: result.burnt ? 'dish_burnt' : 'dish_' + result.method,  // fallback picture
      ids: result.ids.slice(), method: result.method, burnt: !!result.burnt, // what's in it (for its picture)
      heal: fx.heal, buffs: fx.buffs, resists: fx.resists, inedible: !!fx.inedible,
      throwDamage: fx.throwDamage, element: fx.element, elementFrom: fx.elementFrom,
      sell: result.burnt ? 1 : result.sellPrice,   // what the Shopkeeper pays
    });
    return true;
  },

  // A random Forest ingredient, rolled by rarity. Each Forest area has its own odds (data/forest.js).
  // `only` = a region's own forage list (the Marsh); otherwise any Forest ingredient.
  rollIngredient(rng = Math.random, odds = FUP.forestData.areas[0].forageOdds, only = null) {
    const forest = only ? only.slice() : Object.keys(FUP.ingredients).filter(id => FUP.ingredients[id].source === 'Forest' && FUP.ingredients[id].enabled !== false);
    let roll = rng(), rarity = 'Common';
    for (const [r, chance] of Object.entries(odds)) { if (roll < chance) { rarity = r; break; } roll -= chance; }
    let pool = forest.filter(id => FUP.ingredients[id].rarity === rarity);
    if (!pool.length) pool = forest;   // a short list may not have every rarity
    return pool[Math.floor(rng() * pool.length)];
  },

  // After a fight you survived: the enemy's drops go in your bag.
  // Returns { kept, lost } (lost = didn't fit in the bag).
  loot(enemyKey, rng = Math.random) {
    const found = [];
    for (const [id, chance] of (FUP.runData.drops[enemyKey] || [])) if (rng() < chance) found.push(id);
    const kept = [], lost = [];
    for (const id of found) (this.addToBag(id) ? kept : lost).push(id);
    return { kept, lost };
  },

  // ---------- Forest runs ----------
  startForest(rng = Math.random) {
    this.forest = FUP.forest.makeRun(rng);
    this.battle = null;
    this.haggle = null;        // leaving the village ends this visit's haggling
    this.haggleRetried = false;
    FUP.quests.startRun();
  },

  // Called when you finish at the campfire. Returns a summary for the screen.
  // Walk home from the campfire without fighting the Landlord. The trip ends,
  // but you keep your bag, satchel, coins and gear. Doesn't count as a finished run.
  retreat() {
    this.forest = null;
    this.battle = null;
  },

  finishRun() {
    const f = this.forest;
    this.runs++;
    this.forest = null;
    return { time: f.time, fights: f.fights, found: f.found };
  },
};
