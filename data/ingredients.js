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
  // v0.82 story quest items (source 'Quest': can't be eaten, cooked or sold for much). Carried in your bag: lost at the grave like anything else.
  ash_jar:  { name: 'Sealed Jar of Ash', short: 'Ash Jar', emoji: '🫙', color: '#3a3a3a', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'Ash from Pip\'s old plot, lid screwed tight. It glows. Nobody in Foopville knows why.' },
  // v1.13: the Glass line (the Carpenter): stone melted by her fire. Hold it up at the forge to see a moment of the bad day.
  melted_lump: { name: 'Melted Lump', short: 'Lump', emoji: '🪨', color: '#5a7a8a', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'Stone from the well, melted smooth as glass. Stone doesn\'t melt. This did.' },
  glass_shard: { name: 'Glass Shard', short: 'Shard', emoji: '🔷', color: '#7aa8c8', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'A sliver of melted stone. Something moves in it if you hold it to a flame.' },
  // v1.14: the staff thread (the Blacksmith). You carry the staff to the Carpenter; it goes back on the bench after.
  broken_staff: { name: 'Broken Battle Staff', short: 'Staff', emoji: '🪵', color: '#3a2418', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'The Blacksmith\'s find from the old ruins. Cracked, warm, humming. Orange in the cracks. You can\'t use it. You checked.' },
  wood_sample: { name: 'Wood Sample', short: 'Sample', emoji: '🪵', color: '#b88a58', rarity: 'Common', sell: 0, source: 'Quest', throw: 1, blurb: 'Ordinary wood. Dry, plain, boring. That\'s the point.' },
  head_cap: { name: 'The Staff\'s Head Cap', short: 'Head Cap', emoji: '🔩', color: '#b8a070', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'The third fitting. Fire-proof metal, the little hammer over three lines. Warm. It wants to be on the staff.' },   // v1.24 staff Q5
  // v1.23 staff Q4 (The Tended Wood): the sliver off the tended tree, and the Hillwood crop (data/garden.js) with what it gives
  hill_sliver: { name: 'Sliver of Hillwood', short: 'Sliver', emoji: '🪵', color: '#6a4a2a', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'Off the tree you tended at the high clearing. Same grain as the staff. Swirls, stops, swirls back.' },
  hillwood: { name: 'Hillwood', short: 'Hillwood', emoji: '🌳', color: '#5a7a3a', rarity: 'Rare', sell: 0, source: 'Quest', blurb: 'It\'s a tree. A very well looked-after one.' },   // the crop itself (you plant it; a harvest gives Straight Poles)
  straight_pole: { name: 'Straight Pole', short: 'Pole', emoji: '🪵', color: '#8a6a3a', rarity: 'Uncommon', sell: 8, source: 'Farm', countsAs: 'plank', build: true, blurb: 'Grown straight from Hillwood. Counts as a Plank in any building job.' },   // countsAs: pays for a Plank cost (1 for 1), planks used first
  hillwood_sap: { name: 'Hillwood Sap', short: 'Sap', emoji: '🍯', color: '#c88a30', rarity: 'Rare', sell: 15, source: 'Farm', blurb: 'Sweet and sticky. Not magic. Just sap from a tree somebody cared about.' },
  clay_print: { name: 'Clay Print of the Mark', short: 'Clay Print', emoji: '🟫', color: '#9a6a48', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'The maker\'s mark off the staff\'s band, pressed into clay. Also a thumbprint. The Blacksmith\'s. Probably.' },   // v1.21 staff Q3
  smith_letter: { name: 'The Blacksmith\'s Letter', short: 'Letter', emoji: '📜', color: '#d8c8a0', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'Smith to smith, addressed to the Iron House. The third draft. The first two are in the bin, where they belong.' },   // v1.21 staff Q3
  // v1.12: The Inspector (ash line quest 3)
  sealed_crate: { name: 'Sealed Crate', short: 'Crate', emoji: '📦', color: '#8a6a40', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'Sealed. Heavy. Addressed to the Iron House. Not to you.' },
  frostroot: { name: 'Frostroot', short: 'Frostroot', emoji: '🥕', color: '#d8e4ee', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'A pale root that only grows under the snow. Cold enough to sting.' },
  old_bowl: { name: 'Licked-Clean Bowl', short: 'Bowl', emoji: '🥣', color: '#a87a4a', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'A wooden bowl with a little mark on the bottom. Found by the Guardian\'s feeding spot.' },
  right_form: { name: 'The Right Form', short: 'Right Form', emoji: '📜', color: '#e8dcb0', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'Form R-1: Passage East. Filled in, signed, dated. Correct in every way. Suspiciously correct.' },   // Phase D: the Archivist drops it
  old_key:  { name: 'Old Key', short: 'Old Key', emoji: '🗝️', color: '#c8a84a', rarity: 'Rare', sell: 0, source: 'Quest', throw: 1, blurb: 'Heavy, plain, older than the village. It opens something down there.' },
  // v0.81 quest crops (data/garden.js): Bitterroot from Grandmother's Soup, Sea Kale from Never Seen the Sea
  bitterroot: { name: 'Bitterroot', short: 'Bitterroot', emoji: '🫚', color: '#8a6a3a', rarity: 'Uncommon', sell: 5, source: 'Farm' },
  sea_kale:   { name: 'Sea Kale', short: 'Sea Kale', emoji: '🥬', color: '#5a9a8a', rarity: 'Common', sell: 6, source: 'Farm' },
  // v0.92 fruit from your own fruit trees (Farming 2.0 F-D, data/garden.js trees). Names are Jesus's picks; numbers PLACEHOLDERS.
  // Farming 2.0 F-E (v0.99.4): animal feed crops and animal produce. Names are PLACEHOLDERS.
  grumblegrain: { name: 'Grumblegrain', short: 'Grain', emoji: '🌾', color: '#c8a850', rarity: 'Common', sell: 2, source: 'Farm', feed: true },   // chicken feed (feed: true = for animals, not the pot)
  meadow_hay:   { name: 'Meadow Hay', short: 'Hay', emoji: '🌿', color: '#9ab050', rarity: 'Common', sell: 3, source: 'Farm', feed: true },       // cow feed
  egg:          { name: 'Grumpy Egg', short: 'Egg', emoji: '🥚', color: '#f0e6c8', rarity: 'Common', sell: 4, source: 'Farm' },
  milk:         { name: 'Cow Milk', short: 'Milk', emoji: '🥛', color: '#f4f0e8', rarity: 'Uncommon', sell: 8, source: 'Farm' },
  honey:        { name: 'Unionised Honey', short: 'Honey', emoji: '🍯', color: '#e0a030', rarity: 'Uncommon', sell: 10, source: 'Farm' },
  grumbleplum: { name: 'Grumbleplum', short: 'Plum', emoji: '🫐', color: '#6a3a7a', rarity: 'Uncommon', sell: 8, source: 'Farm' },
  sourapple:   { name: 'Sourapple', short: 'Sourapple', emoji: '🍏', color: '#8ac04a', rarity: 'Uncommon', sell: 12, source: 'Farm' },
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
  // Forest fish (v0.78, PLACEHOLDER names): the Forest's ponds, the Toll River, the Deep Woods pool, and special spots
  speckled_trout: { name: 'Speckled Trout', short: 'Trout', emoji: '🐟', color: '#8a9a6a', rarity: 'Common', sell: 5, source: 'Fishing' },
  golden_minnow:  { name: 'Golden Minnow', short: 'Minnow', emoji: '🐠', color: '#e8c04a', rarity: 'Uncommon', sell: 9, source: 'Fishing' },
  petty_pike:     { name: 'Petty Pike', short: 'Pike', emoji: '🐟', color: '#6a7a4a', rarity: 'Uncommon', sell: 8, source: 'Fishing' },
  gloomfin:       { name: 'Gloomfin', short: 'Gloomfin', emoji: '🐟', color: '#3a3a5a', rarity: 'Uncommon', sell: 10, source: 'Fishing' },
  dodger_trout:   { name: 'Toll-Dodger Trout', short: 'Trout', emoji: '🐟', color: '#a07a4a', rarity: 'Rare', sell: 13, source: 'Fishing' },
  moon_carp:      { name: 'Moon Carp', short: 'Carp', emoji: '🐡', color: '#c8d0e8', rarity: 'Rare', sell: 18, source: 'Fishing' },
  old_gnarl:    { name: 'Old Gnarl', short: 'Gnarl', emoji: '🐉', color: '#5a6a4a', rarity: 'Rare', sell: 1, source: 'Quest' },   // The One That Got Away: Gill wants it
  bog_eel:      { name: 'Bog Eel', short: 'Eel', emoji: '🐍', color: '#3a4a2a', rarity: 'Uncommon', sell: 9, source: 'Fishing' },
};
