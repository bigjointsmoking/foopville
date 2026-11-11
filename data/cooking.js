// ============================================================
// COOKING RULES — the numbers behind every recipe (Refinement Phase 2).
// RuneScape-style: recipes are fully visible, quality comes from your level,
// burning fades out as you level. No hidden flavours, no luck in quality.
// The recipes themselves are in data/recipes.js.
// ALL NUMBERS ARE PLACEHOLDERS (decided with Jesus 2026-11-09).
// ============================================================
window.FUP = window.FUP || {};

FUP.cookingData = {
  // ---------- Pot size: how many ingredients at once ----------
  slotsByLevel: [
    { level: 1, slots: 2 },
    { level: 10, slots: 3 },
    { level: 25, slots: 4 },
  ],
  minIngredients: 1,      // simple 1-ingredient cooks (Roasted Grumpleberry, Grilled Glowcap...)

  // ---------- Cooking methods ----------
  // Which method a recipe uses is part of the recipe. unlock = Cooking level needed.
  methods: {
    raw:   { name: 'Raw',   emoji: '🥗', unlock: 1,  blurb: 'Salads and the like. Never burns.' },
    grill: { name: 'Grill', emoji: '🍢', unlock: 1,  blurb: 'Skewers and roasts.' },
    boil:  { name: 'Boil',  emoji: '🍲', unlock: 5,  blurb: 'Soups, stews and broths.' },
    bake:  { name: 'Bake',  emoji: '🥧', unlock: 12, blurb: 'Pies and tarts.' },
    fry:   { name: 'Fry',   emoji: '🍳', unlock: 20, blurb: 'Fritters and fry-ups.' },
  },

  // ---------- Stars (quality) ----------
  // v0.41 (Jesus): a dish's stars come from the RECIPE, not your level. Your Cooking level only
  // lowers burning. Stars = 1 + recipe level / levelsPerStar (Lv 1-9 = 1★, 10-19 = 2★ ... 40+ = 5★).
  // Every recipe does exactly what data/recipes.js says (mult 1 for every star level).
  levelsPerStar: 10,
  tiers: [
    { id: 'inedible',  name: 'Burnt',     stars: 0, mult: 0, color: '#ff6b5e' },
    { id: 'edible',    name: 'Edible',    stars: 1, mult: 1, color: '#a3b08f' },
    { id: 'tasty',     name: 'Tasty',     stars: 2, mult: 1, color: '#f1ead2' },
    { id: 'delicious', name: 'Delicious', stars: 3, mult: 1, color: '#8be06a' },
    { id: 'gourmet',   name: 'Gourmet',   stars: 4, mult: 1, color: '#6ab4ff' },
    { id: 'legendary', name: 'Legendary', stars: 5, mult: 1, color: '#f2b84b' },
  ],

  // ---------- Burning (like RuneScape) ----------
  // At the recipe's own level: burnStart chance. It drops evenly to 0 at recipe level + stopBurnAfter.
  // Stoves (data/house.js burnCut) take a flat amount off. Raw recipes never burn.
  burnStart: 0.35,
  stopBurnAfter: 15,

  // Burnt food and failed experiments: no XP (Jesus: like RuneScape).
  // Eating something burnt makes you gag and lose this much of your max HP. Throw it instead.
  inedibleSelfDamage: 0.05,

  // Secret recipes: the first time you discover one, x this XP (plus a fanfare).
  discoveryXpMult: 3,

  // ---------- Testing helper ----------
  // A button in the kitchen that gives free XP so you can see unlocks.
  // Set to false before the real game.
  devXpButton: false,   // turned off in v0.40 (friends are playing)
  devXpAmount: 200,
};
