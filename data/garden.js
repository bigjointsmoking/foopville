// ============================================================
// FARMING — the patches around the village (GAME_DESIGN.md section 18.7).
// Each patch is one square of soil on the village map (p = public, 1/2/3 = a house's plot,
// A-J = a plot in the big farm south of the village, bought from Hollis the Farmhand).
// You plant SEEDS (bought from Pip the Seed Seller), not ingredients. Seeds live in your
// seed pouch, which doesn't use bag space. A harvest sometimes gives a seed back.
// The life of a patch:
//   weeds --Hoe--> soil --Plant--> 3 growth stages --> ready --Harvest--> soil
// Every growth stage needs one watering. Watered = it grows; when a stage finishes
// the soil dries out again. Left dry too long, a crop wilts, then dies.
// Everything runs in REAL TIME: watered crops keep growing while the game is closed
// (but thirsty ones only wilt while you're playing).
// ALL NUMBERS ARE PLACEHOLDERS for Jesus to tweak.
// ============================================================
window.FUP = window.FUP || {};

FUP.gardenData = {
  // Growth: 3 stages. Each stage takes a third of the crop's growSeconds and needs water.
  stages: 3,

  // Gardening level makes crops faster: every level = fasterPerLevel quicker,
  // but never below minGrowShare of the full time.
  fasterPerLevel: 0.02,   // 2% faster per level...
  minGrowShare: 0.4,      // ...down to 40% of the time at most

  // Thirst (seconds a growing crop has been dry):
  wiltAfter: 20 * 60,     // dry 20 minutes = wilting (water it to save it, but it gives 1 less)
  dieAfter: 60 * 60,      // dry 60 minutes = dead (hoe it away)
  weedsAfter: 15 * 60,    // bare soil left empty 15 minutes grows weeds again
  // Jesus (2026-11-09): no dying overnight. While the game is closed (or the tab is hidden),
  // watered crops keep growing but thirsty crops don't dry out any further.
  dryWhileAway: false,
  awayGap: 10,            // a jump of more than 10 seconds between clock checks = you were away

  // Watering can: how much water it holds. Fill it at the well or a pond.
  canMax: 10,

  // How long each job takes (seconds, you stand still) and its Gardening XP.
  // (v0.38: all Gardening XP halved so it levels at the same speed as the other skills.)
  jobs: {
    hoe:     { seconds: 0.7, xp: 4 },
    plant:   { seconds: 0.5 },          // XP is per crop, below
    water:   { seconds: 0.5, xp: 2 },
    harvest: { seconds: 0.6 },          // XP is per crop, below
    clear:   { seconds: 0.7, xp: 1 },   // hoeing away a dead crop
    fill:    { seconds: 0.8 },
  },

  // What a harvest gives back: a random number from yieldMin to yieldMax,
  // and yieldMax goes up by 1 every `bonusYieldEvery` Gardening levels.
  yieldMin: 2,
  yieldMax: 4,
  bonusYieldEvery: 10,

  // Crops: which ingredients you can grow, from which Gardening level,
  // how long they take in real time (all 3 stages, at Gardening 1), the XP,
  // and what one seed costs at Pip's seed stall (before Rizz discounts).
  // Onion, Lemon and Ember Pepper only come from the farm (not found in the Forest).
  crops: {
    grumpleberry:         { level: 1,  growSeconds: 6 * 60,  plantXp: 8, harvestXp: 22,  seedPrice: 3 },
    glowcap_mushroom:     { level: 1,  growSeconds: 6 * 60,  plantXp: 8, harvestXp: 22,  seedPrice: 3 },
    tear_jerk_onion:      { level: 3,  growSeconds: 8 * 60,  plantXp: 10, harvestXp: 30,  seedPrice: 4 },
    dragons_sneeze_chili: { level: 5,  growSeconds: 12 * 60, plantXp: 12, harvestXp: 40,  seedPrice: 6 },
    grumpy_lemon:         { level: 8,  growSeconds: 15 * 60, plantXp: 18, harvestXp: 55, seedPrice: 8 },
    spore_b_gone_moss:    { level: 10, growSeconds: 20 * 60, plantXp: 20, harvestXp: 65, seedPrice: 10 },
    ember_pepper:         { level: 15, growSeconds: 25 * 60, plantXp: 30, harvestXp: 100, seedPrice: 15 },
    heartroot:            { level: 20, growSeconds: 40 * 60, plantXp: 40, harvestXp: 150, seedPrice: 25 },
  },

  // ---------- Seeds ----------
  startSeeds: { grumpleberry: 3, glowcap_mushroom: 3 },   // a new life starts with these in the seed pouch
  seedBackChance: 0.3,    // 30% chance a harvest also gives 1 seed back

  // ---------- Compost Bin (v0.41, Jesus: burnt food shouldn't be useless) ----------
  // Next to your Cottage. Put in burnt food or any ingredient. Every `perBatch` items start a batch
  // that turns into 1 Compost after `minutes` (real time, like crops). Use Compost when planting:
  // that crop grows `growFaster` faster and gives `bonusYield` more.
  compost: { spot: { tx: 2, ty: 16 }, perBatch: 3, minutes: 10, growFaster: 0.25, bonusYield: 1 },

  // ---------- The big farm (south of the village) ----------
  // 8 plots of 12 patches (4 x 3), bought in any order from Hollis the Farmhand.
  // The letter is the plot's square on the map in data/village.js.
  farmPlots: {   // prices doubled in v0.41, then x4 in v0.43
    // v0.41 (Jesus): only your house plot is free. The 9 patches around the village are a plot you buy.
    p: { name: 'Village Allotment (9 patches around the village)', price: 320, noSign: true },
    A: { name: 'Plot 1', price: 480 },
    B: { name: 'Plot 2', price: 960 },
    C: { name: 'Plot 3', price: 1600 },
    D: { name: 'Plot 4', price: 2400 },
    E: { name: 'Plot 5', price: 3600 },
    F: { name: 'Plot 6', price: 5200 },
    H: { name: 'Plot 7', price: 7200 },
    J: { name: 'Plot 8', price: 9600 },
  },
};
