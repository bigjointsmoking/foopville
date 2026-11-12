// ============================================================
// SALVAGE — building materials come from the mess the world is in (v0.70,
// Jesus 2026-11-11: "building doesn't seem fleshed out"; picked scavenging,
// commissions and building over time, plus a scarecrow and a rain barrel).
// Walk up to a scrap pile (broken cart, collapsed shed, storm-felled tree,
// washed-up wreckage, sunken crate), press the button, pry it apart. You get
// materials and Building XP. An emptied pile is back the next day.
// Materials live in their own pouch (they don't take backpack slots).
// Rules in src/systems/salvage.js, drawing in src/salvageUi.js. PLACEHOLDER numbers.
// ============================================================
window.FUP = window.FUP || {};

FUP.salvageData = {
  // The materials. Costs anywhere in the game name them like items: { items: { plank: 4, nails: 2 } }
  materials: {
    plank:  { name: 'Plank',          emoji: '🪵', blurb: 'Wood, flattened by force.' },
    nails:  { name: 'Nails',          emoji: '🔩', blurb: 'Bent, but they don\'t know that.' },
    stone:  { name: 'Stone',          emoji: '🪨', blurb: 'A rock with ambitions.' },
    brass:  { name: 'Brass Fittings', emoji: '🔔', blurb: 'Shiny bits off a shipwreck. Rare.' },
    glass:  { name: 'Stained Glass',  emoji: '🪟', blurb: 'Pretty, sharp, from somewhere under the Marsh. Rare.' },
  },
  order: ['plank', 'nails', 'stone', 'brass', 'glass'],

  // Kinds of scrap pile. need = Building level to pry it apart. seconds = how long you work.
  //   loot: [{ id, min, max, chance }] (chance defaults to 1) · xp = Building XP per pile
  kinds: {
    shed:  { name: 'Collapsed Shed',     emoji: '🏚️', sprite: 'salvage_shed',  need: 1,  seconds: 2.2, xp: 18,
             loot: [{ id: 'plank', min: 2, max: 3 }, { id: 'nails', min: 1, max: 2 }, { id: 'stone', min: 0, max: 1 }] },
    tree:  { name: 'Storm-Felled Tree',  emoji: '🪵', sprite: 'salvage_tree',  need: 1,  seconds: 2.5, xp: 20,
             loot: [{ id: 'plank', min: 3, max: 4 }] },
    cart:  { name: 'Broken Cart',        emoji: '🛒', sprite: 'salvage_cart',  need: 3,  seconds: 2.2, xp: 26,
             loot: [{ id: 'plank', min: 2, max: 3 }, { id: 'nails', min: 2, max: 3 }] },
    wreck: { name: 'Washed-Up Wreckage', emoji: '⚓', sprite: 'salvage_wreck', need: 8,  seconds: 2.8, xp: 40,
             loot: [{ id: 'plank', min: 2, max: 4 }, { id: 'nails', min: 1, max: 3 }, { id: 'brass', min: 1, max: 1, chance: 0.35 }] },
    crate: { name: 'Sunken Crate',       emoji: '📦', sprite: 'salvage_crate', need: 15, seconds: 2.8, xp: 55,
             loot: [{ id: 'nails', min: 2, max: 4 }, { id: 'stone', min: 1, max: 3 }, { id: 'glass', min: 1, max: 1, chance: 0.35 }] },
  },

  // Where the piles are, per region (map squares). Each pile refills the day after you empty it.
  spots: {
    village:   [{ kind: 'shed', tx: 2, ty: 19 }, { kind: 'shed', tx: 59, ty: 30 }, { kind: 'tree', tx: 17, ty: 21 }, { kind: 'tree', tx: 45, ty: 37 }, { kind: 'tree', tx: 59, ty: 12 }],
    edge:      [{ kind: 'cart', tx: 11, ty: 23 }, { kind: 'tree', tx: 40, ty: 22 }, { kind: 'tree', tx: 2, ty: 14 }],
    tollroad:  [{ kind: 'cart', tx: 5, ty: 17 }, { kind: 'tree', tx: 35, ty: 16 }, { kind: 'cart', tx: 17, ty: 8 }],
    deepwoods: [{ kind: 'tree', tx: 5, ty: 8 }, { kind: 'cart', tx: 34, ty: 14 }, { kind: 'cart', tx: 20, ty: 23 }],
    docks:     [{ kind: 'wreck', tx: 5, ty: 11 }, { kind: 'wreck', tx: 28, ty: 11 }, { kind: 'wreck', tx: 37, ty: 11 }],
    marsh:     [{ kind: 'crate', tx: 6, ty: 16 }, { kind: 'crate', tx: 30, ty: 19 }, { kind: 'crate', tx: 44, ty: 22 }],
  },

  // Perks (data/unlocks.js building): extraChance = chance of one more of each material · rareMult = rare finds more often
};
