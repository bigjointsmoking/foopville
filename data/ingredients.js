// ============================================================
// INGREDIENTS — what you find, grow and buy. Recipes use them (data/recipes.js).
//
// (v0.36: flavours, textures and ingredient traits are gone. What a dish does is written
//  on its recipe in data/recipes.js; eating an ingredient raw is in recipeData.raw.)
// sell:    what the Shopkeeper pays for one (v0.40: its own price, was 2/5/12 by rarity)
// short:   the short name used when the game invents a dish name
// color:   main colour, used to tint soups and pie fillings in dish pictures
// element: the ingredient's element, for reference (a dish's thrown element is set on its recipe).
// enabled: false = not in the game right now (kept here in case we bring it back)
// ============================================================
window.FUP = window.FUP || {};

FUP.ingredients = {
  // ---------- Shop basics (always for sale in the village) ----------
  rock_salt: {
    name: 'Rock Salt', short: 'Salt', emoji: '🧂', color: '#e8e4e0', rarity: 'Common', sell: 2, source: 'Forest', price: 3,
  },
  sugar_lump: { enabled: false, // retired 2026-11-08: fewer ingredients
    name: 'Sugar Lump', short: 'Sugar', emoji: '🍬', rarity: 'Common', source: 'Shop', price: 3,
  },
  stale_bread: { enabled: false, // retired 2026-11-08: fewer ingredients
    name: 'Stale Bread', short: 'Bread', emoji: '🍞', rarity: 'Common', source: 'Shop', price: 4,
  },
  // Sawn from Bark at the sawhorse, or bought from the Carpenter. For building, not for eating.
  plank: { name: 'Plank', short: 'Plank', emoji: '🪵', color: '#a47a44', rarity: 'Common', sell: 3, source: 'Carpenter' },
  // ---------- Fish (Fishing skill, data/fishing.js). Weak raw; better cooked (data/recipes.js). ----------
  mudminnow:         { name: 'Mudminnow', short: 'Minnow', emoji: '🐟', color: '#7a6a4a', rarity: 'Common', sell: 1, source: 'Fishing' },
  // Sea fish (the Docks, v0.54-0.55)
  salty_sardine:      { name: 'Salty Sardine', short: 'Sardine', emoji: '🐟', color: '#9ab0c0', rarity: 'Common', sell: 4, source: 'Fishing' },
  dock_herring:       { name: 'Dock Herring', short: 'Herring', emoji: '🐟', color: '#8aa0b8', rarity: 'Common', sell: 5, source: 'Fishing' },
  regret_snapper:     { name: 'Regret Snapper', short: 'Snapper', emoji: '🐠', color: '#c8604a', rarity: 'Uncommon', sell: 7, source: 'Fishing' },
  bashful_flounder:   { name: 'Bashful Flounder', short: 'Flounder', emoji: '🐟', color: '#b0946a', rarity: 'Uncommon', sell: 8, source: 'Fishing' },
  sarcastic_mackerel: { name: 'Sarcastic Mackerel', short: 'Mackerel', emoji: '🐟', color: '#5a7a9a', rarity: 'Uncommon', sell: 9, source: 'Fishing' },
  grudge_tuna:        { name: 'Grudge Tuna', short: 'Tuna', emoji: '🐟', color: '#4a5a8a', rarity: 'Rare', sell: 11, source: 'Fishing' },
  letter_opener:      { name: 'Letter Opener', short: 'Swordfish', emoji: '🗡️', color: '#6a8ab0', rarity: 'Rare', sell: 12, source: 'Fishing' },
  // Junk and treasure off the line (v0.55): can't be eaten or cooked, only sold. throw = for when raw items can be thrown
  old_boot:  { name: 'Old Boot', short: 'Boot', emoji: '🥾', color: '#6a4a2a', rarity: 'Common', sell: 1, source: 'Junk', throw: 6 },
  rusty_can: { name: 'Rusty Can', short: 'Can', emoji: '🥫', color: '#8a6a5a', rarity: 'Common', sell: 1, source: 'Junk', throw: 4 },
  pearl:     { name: 'Pearl', short: 'Pearl', emoji: '🦪', color: '#e8e4f0', rarity: 'Rare', sell: 60, source: 'Junk', throw: 1 },
  grumpy_guppy:      { name: 'Grumpy Guppy', short: 'Guppy', emoji: '🐠', color: '#d88a3a', rarity: 'Common', sell: 2, source: 'Fishing' },
  pond_perch:        { name: 'Pond Perch', short: 'Perch', emoji: '🐟', color: '#6a9a4a', rarity: 'Common', sell: 3, source: 'Fishing' },
  sulking_carp:      { name: 'Sulking Carp', short: 'Carp', emoji: '🐡', color: '#b05a3a', rarity: 'Common', sell: 4, source: 'Fishing' },
  whiskered_catfish: { name: 'Suspicious Catfish', short: 'Catfish', emoji: '🐟', color: '#5a5a6a', rarity: 'Common', sell: 5, source: 'Fishing' },
  tear_jerk_onion: { // back 2026-11-09 as a farm-only crop (data/garden.js)
    name: 'Tear-Jerk Onion', short: 'Onion', emoji: '🧅', rarity: 'Common', sell: 4, source: 'Farm', price: 4,
  },
  dragons_sneeze_chili: {
    name: "Dragon's Sneeze Chili", short: 'Chili', emoji: '🌶️', color: '#d8312a', rarity: 'Uncommon', sell: 6, source: 'Forest', price: 6, element: 'fire',
  },
  grumpy_lemon: { // back 2026-11-09 as a farm-only crop (data/garden.js)
    name: 'Grumpy Lemon', short: 'Lemon', emoji: '🍋', rarity: 'Common', sell: 7, source: 'Farm', price: 5,
  },

  // ---------- Forest finds (foraged on the map) ----------
  glowcap_mushroom: {
    name: 'Glowcap Mushroom', short: 'Glowcap', emoji: '🍄', color: '#55c8f0', rarity: 'Common', sell: 3, source: 'Forest',
  },
  grumpleberry: {
    name: 'Grumpleberry', short: 'Grumpleberry', emoji: '🍇', color: '#6a3a9a', rarity: 'Common', sell: 3, source: 'Forest',
  },
  bark: {
    name: 'Bark of Questionable Origin', short: 'Bark', emoji: '🪵', color: '#6b4426', rarity: 'Common', sell: 2, source: 'Forest',
  },
  squirrel_jerky: {
    name: 'Squirrel Jerky', short: 'Jerky', emoji: '🍖', color: '#8a2e22', rarity: 'Common', sell: 4, source: 'Forest (squirrel drop, 40%)',
  },
  sap_of_regret: { enabled: false, // retired 2026-11-08: fewer ingredients
    name: 'Sap of Regret', short: 'Sap', emoji: '🍯', rarity: 'Uncommon', source: 'Forest',
  },
  ember_pepper: { // back 2026-11-09 as a farm-only crop (data/garden.js)
    name: 'Ember Pepper', short: 'Ember', emoji: '🔥', rarity: 'Uncommon', sell: 11, source: 'Farm',
  },
  spore_b_gone_moss: {
    name: 'Spore-B-Gone Moss', short: 'Moss', emoji: '🌿', color: '#3f8a3a', rarity: 'Uncommon', sell: 8, source: 'Forest',
  },
  heartroot: {
    name: 'Heartroot', short: 'Heartroot', emoji: '🥕', color: '#c8304a', rarity: 'Rare', sell: 22, source: 'Forest',
  },
  // From the repaired Windmill (R2). Not sold in the general shop, can't be eaten raw.
  flour: {
    name: 'Flour', short: 'Flour', emoji: '🌾', color: '#e8e0c8', rarity: 'Common', sell: 1, source: 'Miller', price: 3,
  },
  // ---------- The Soggy Marsh (W2) ----------
  croakberry:   { name: 'Croakberry', short: 'Croakberry', emoji: '🫐', color: '#4a5aa0', rarity: 'Common', sell: 5, source: 'Marsh' },
  mudroot:      { name: 'Mudroot', short: 'Mudroot', emoji: '🥔', color: '#7a5a3a', rarity: 'Common', sell: 5, source: 'Marsh' },
  marsh_mint:   { name: 'Marsh Mint', short: 'Mint', emoji: '🌿', color: '#5aa07a', rarity: 'Uncommon', sell: 12, source: 'Marsh' },
  bog_truffle:  { name: 'Bog Truffle', short: 'Truffle', emoji: '🍄', color: '#4a3a2a', rarity: 'Rare', sell: 30, source: 'Marsh' },
  stamped_form: { name: 'Stamped Form', short: 'Form', emoji: '📄', color: '#e8e0c8', rarity: 'Common', sell: 4, source: 'Drop', throw: 5 },   // throw-only; 3 open the Notary (W3)
  // Marsh fish (Fishing at the 4 F squares)
  mud_skipper:  { name: 'Mud Skipper', short: 'Skipper', emoji: '🐟', color: '#7a6a4a', rarity: 'Common', sell: 6, source: 'Fishing' },
  croaker:      { name: 'Off-Key Croaker', short: 'Croaker', emoji: '🐟', color: '#6a8a5a', rarity: 'Uncommon', sell: 7, source: 'Fishing' },
  bog_eel:      { name: 'Bog Eel', short: 'Eel', emoji: '🐍', color: '#3a4a2a', rarity: 'Uncommon', sell: 9, source: 'Fishing' },
};
