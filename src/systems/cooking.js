// ============================================================
// COOKING RULES — pure math, no drawing (Refinement Phase 2).
// RuneScape-style: every dish is a recipe from data/recipes.js.
//   - You can cook a recipe once your Cooking level reaches its level.
//   - Stars (quality) = how far your level is above the recipe's. No luck.
//   - Burn chance fades to 0 at the recipe's level + stopBurnAfter.
//   - Any other combo is an experiment: a secret recipe, or burnt junk.
// Numbers come from data/cooking.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.cooking = {
  // What you've done with cooking this life:
  //   discovered: secret recipes you've found { name: true }
  //   riddles:    Marrowbone riddles you've bought { name: true }
  //   cooked:     how many times you've cooked each recipe { name: n }
  cookbook: { discovered: {}, riddles: {}, cooked: {} },

  // A recipe's id for facts: 'Berry Skewer' -> 'berry_skewer'
  recipeId(recipe) { return recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); },
  resetCookbook() { this.cookbook = { discovered: {}, riddles: {}, cooked: {} }; },

  // ---------- Recipes ----------
  // The same ingredients in any order, plus the method, as one key.
  comboKey(ids, methodId) { return ids.slice().sort().join('+') + '@' + methodId; },

  // The recipe these ingredients + method make (known or not), or null.
  matchRecipe(ids, methodId) {
    const key = this.comboKey(ids, methodId);
    return FUP.recipeData.list.find(r => this.comboKey(r.ids, r.method) === key) || null;
  },

  // Do you know this recipe exists? (Normal recipes: always. Secrets: once discovered.)
  isVisible(r) { return !r.secret || !!this.cookbook.discovered[r.name]; },

  // Can you cook it right now (level, and found it if it's a secret)?
  canCook(r, level) { return this.isVisible(r) && level >= r.level; },

  // 'known' (can cook) | 'locked' (level too low) | 'secret' (not discovered yet)
  status(r, level) {
    if (!this.isVisible(r)) return 'secret';
    return level >= r.level ? 'known' : 'locked';
  },

  // A recipe's stars come from the recipe itself (v0.41): Lv 1-9 = 1★, 10-19 = 2★ ... 40+ = 5★. `level` is ignored.
  recipeStars(r, level) {
    return Math.max(1, Math.min(5, 1 + Math.floor(r.level / FUP.cookingData.levelsPerStar)));
  },
  tierForStars(stars) { return FUP.cookingData.tiers.find(t => t.stars === stars) || FUP.cookingData.tiers[1]; },

  // Burn chance for a recipe at your level (0 to 1). Raw recipes never burn.
  burnChance(r, level) {
    if (!r || r.method === 'raw') return 0;
    const d = FUP.cookingData;
    const left = 1 - (level - r.level) / d.stopBurnAfter;     // 1 at the recipe's level, 0 at +stopBurnAfter
    return Math.max(0, d.burnStart * Math.max(0, left) - FUP.house.stoveBurnCut());
  },
  // The Cooking level at which you stop burning this recipe.
  stopBurnLevel(r) { return r.level + FUP.cookingData.stopBurnAfter; },

  // Do you have everything for this recipe in your bag?  Returns the ids you're missing.
  missingFor(recipe, bagCount) {
    const need = {};
    for (const id of recipe.ids) need[id] = (need[id] || 0) + 1;
    const missing = [];
    for (const [id, n] of Object.entries(need)) for (let i = bagCount(id); i < n; i++) missing.push(id);
    return missing;
  },

  // ---------- What a recipe does at a given star level ----------
  // Same shape every dish in the satchel uses (heal, buffs, resists, element, throwDamage).
  effects(r, stars) {
    const mult = this.tierForStars(stars).mult;
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    return {
      heal: Math.round((r.heal || 0) * mult),
      buffs: (r.buffs || []).map(b => ({ stat: b.stat, mult: Math.round((1 + b.pct * mult) * 1000) / 1000, turns: b.turns, label: `${b.stat.toUpperCase()} up` })),
      resists: (r.resists || []).map(x => ({ element: x.element, reduction: Math.round(x.amount * mult * 100) / 100, turns: x.turns })),
      inedible: false,
      element: r.element ? cap(r.element) : 'Blunt',
      elementFrom: null,
      throwDamage: Math.max(1, Math.round((r.throw || 0) * mult)),
    };
  },
  sellFor(r, stars) { return Math.max(1, Math.round((r.sell || 1) * this.tierForStars(stars).mult)); },

  // Burnt junk: can't be eaten, only thrown or sold.
  junkEffects() {
    const J = FUP.recipeData.junk;
    return { heal: 0, buffs: [], resists: [], inedible: true, element: 'Blunt', elementFrom: null, throwDamage: J.throw };
  },

  // ---------- A look at the dish BEFORE you cook it ----------
  // kind: 'recipe' (you can cook it) | 'locked' (level too low) | 'experiment' (unknown combo)
  preview(ids, methodId, level) {
    const r = this.matchRecipe(ids, methodId);
    if (r && this.isVisible(r)) {
      if (level < r.level) return { kind: 'locked', recipe: r, need: r.level };
      const stars = this.recipeStars(r, level), tier = this.tierForStars(stars);
      return { kind: 'recipe', recipe: r, stars, tier, fx: this.effects(r, stars), burn: this.burnChance(r, level), xp: r.xp, sell: this.sellFor(r, stars) };
    }
    return { kind: 'experiment' };   // a secret recipe or junk: you find out when you cook it
  },

  // ---------- Eating an ingredient raw ----------
  // Returns a dish-like object (same shape as a satchel dish) or null if it can't be eaten alone.
  rawDish(id) {
    const raw = FUP.recipeData.raw[id];
    if (!raw) return null;
    const ing = FUP.ingredients[id];
    const buffs = raw.buff ? [{ stat: raw.buff.stat, mult: 1 + raw.buff.pct, turns: raw.buff.turns, label: `${raw.buff.stat.toUpperCase()} up` }] : [];
    const resists = raw.resist ? [{ element: raw.resist.element, reduction: raw.resist.amount, turns: raw.resist.turns }] : [];
    return { raw: true, id, name: `Raw ${ing.short}`, emoji: ing.emoji, heal: raw.heal || 0, hpCost: raw.hpCost || 0, buffs, resists };
  },

  // Short text like "+5 HP" or "ATK +5% · costs 2 HP".
  rawText(id) {
    const d = this.rawDish(id);
    if (!d) return 'Can\'t be eaten alone';
    const parts = [];
    if (d.heal) parts.push(`+${d.heal} HP`);
    for (const b of d.buffs) parts.push(`${b.stat.toUpperCase()} +${Math.round((b.mult - 1) * 100)}%`);
    for (const r of d.resists) parts.push(`${r.element.charAt(0).toUpperCase() + r.element.slice(1)} resist`);
    if (d.hpCost) parts.push(`costs ${d.hpCost} HP`);
    return 'Raw: ' + parts.join(' · ');
  },

  // How many recipes you can cook right now use this ingredient.
  recipesUsing(id, level) { return FUP.recipeData.list.filter(r => this.canCook(r, level) && r.ids.includes(id)).length; },

  // ---------- What your level unlocks ----------
  slotsFor(level) {
    let slots = 0;
    for (const s of FUP.cookingData.slotsByLevel) if (level >= s.level) slots = s.slots;
    return slots;
  },
  // The level at which slot number `index` (0 = first) unlocks.
  slotUnlockLevel(index) {
    const row = FUP.cookingData.slotsByLevel.find(s => s.slots >= index + 1);
    return row ? row.level : null;
  },
  methodUnlocked(id, level) { return level >= FUP.cookingData.methods[id].unlock; },

  // ---------- Describing a dish in plain words ----------
  stars(tierName) {
    const t = FUP.cookingData.tiers.find(t => t.name === tierName);
    return t ? t.stars : 0;
  },

  // One line of what a recipe does at some stars: "+18 HP · ATK +10% (3 turns) · Fire throw 18"
  fxText(fx) {
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1), names = { atk: 'ATK', def: 'DEF', spd: 'SPD' };
    const parts = [];
    if (fx.heal) parts.push(`+${fx.heal} HP`);
    for (const b of fx.buffs) parts.push(`${names[b.stat] || b.stat} +${Math.round((b.mult - 1) * 100)}% (${b.turns} turns)`);
    for (const x of fx.resists) parts.push(`${cap(x.element)} resist ${Math.round(x.reduction * 100)}% (${x.turns} turns)`);
    parts.push(fx.element === 'Blunt' ? `Throw ${fx.throwDamage}` : `${fx.element} throw ${fx.throwDamage}`);
    return parts.join(' · ');
  },

  // Lines like "Eat it: heals 16 HP" for a satchel dish. Each is { icon, text }.
  dishLines(d) {
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const names = { atk: 'Attack', def: 'Defense', spd: 'Speed' };
    const lines = [];
    if (d.inedible) lines.push({ icon: '🤢', text: `Eat it: you'd gag and lose ${Math.round(FUP.cookingData.inedibleSelfDamage * 100)}% of your HP. Throw it instead.` });
    if (d.heal) lines.push({ icon: '❤️', text: `Eat it: heals ${d.heal} HP` });
    for (const b of d.buffs || []) lines.push({ icon: '💪', text: `Eat it: ${names[b.stat] || b.stat} +${Math.round((b.mult - 1) * 100)}% for ${b.turns} turns` });
    for (const r of d.resists || []) lines.push({ icon: '🛡️', text: `Eat it: take ${Math.round(r.reduction * 100)}% less ${cap(r.element)} damage for ${r.turns} turns` });
    if (!lines.length) lines.push({ icon: '🍽️', text: 'Eat it: does nothing (but you can still throw it)' });

    // Throwing: say who is weak to it, so it's obvious when to use it
    // No "who is weak to it" hints (Jesus, v0.41): players find out by throwing things
    const el = (d.element || 'Blunt').toLowerCase();
    lines.push({ icon: '🎯', text: el === 'blunt' ? `Throw it: ${d.throwDamage} damage` : `Throw it: ${d.throwDamage} ${cap(el)} damage` });
    return lines;
  },

  // ---------- COOK! ----------
  // ids: ingredient ids in the pot. Gives Cooking XP and returns everything the screen needs.
  // Returns null if it's a recipe you know but can't cook yet (the screen blocks that anyway).
  cook(ids, methodId, rng = Math.random) {
    const d = FUP.cookingData, J = FUP.recipeData.junk;
    const level = FUP.skills.level('cooking');
    const match = this.matchRecipe(ids, methodId);
    if (match && this.isVisible(match) && level < match.level) return null;

    // A recipe you can make: known, or a secret you just stumbled on (still needs the level)
    const recipe = match && level >= match.level ? match : null;
    const discovered = !!(recipe && recipe.secret && !this.cookbook.discovered[recipe.name]);
    const close = !!(match && match.secret && !recipe);   // the right secret combo, but you're not good enough yet

    let burnt = !recipe, stars = 0, tier = d.tiers[0], fx, name, xp = 0, sellPrice = J.sell;
    if (recipe) {
      burnt = rng() < this.burnChance(recipe, level);
      if (discovered) this.cookbook.discovered[recipe.name] = true;   // found it, even if you burned it
      if (!burnt) {
        stars = this.recipeStars(recipe, level);
        tier = this.tierForStars(stars);
        fx = this.effects(recipe, stars);
        sellPrice = this.sellFor(recipe, stars);
        xp = recipe.xp * (discovered ? d.discoveryXpMult : 1);
        this.cookbook.cooked[recipe.name] = (this.cookbook.cooked[recipe.name] || 0) + 1;
      }
      name = burnt ? J.burntName.replace('{dish}', recipe.name) : recipe.name;
    } else {
      name = J.name;   // an experiment that wasn't a secret recipe
    }
    if (burnt) fx = this.junkEffects();

    const levels = xp ? FUP.skills.addXp('cooking', xp) : { from: level, to: level };
    return {
      name, emoji: burnt ? '💨' : d.methods[methodId].emoji,
      ids: ids.slice(), method: methodId,
      recipe, stars, tier, burnt, discovered, close, experiment: !match || !this.isVisible(match) || discovered,
      burnChance: recipe ? this.burnChance(recipe, level) : 0,
      effects: fx, sellPrice, xp,
      levels, unlocks: FUP.skills.unlocksBetween('cooking', levels.from, levels.to),
    };
  },
};
