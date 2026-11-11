// ============================================================
// RECIPES — the whole cooking system (Refinement Phase 2, RuneScape-style).
// Every dish in the game is one of these. No hidden flavours, no luck in quality.
//
// Put exactly a recipe's ingredients in the pot (any order), pick its method, COOK.
//   - Below the recipe's level you can't cook it ("Needs Cooking 15").
//   - Stars come from how far your level is above the recipe's (data/cooking.js).
//   - Burn chance drops to 0 at the recipe's level + stopBurnAfter (data/cooking.js).
//   - Anything that isn't a recipe is an experiment: it's either a SECRET recipe
//     (secret: true, shown as ??? until you discover it) or burnt junk.
//
// Each recipe:
//   level, name, ids (same ingredient twice = list it twice), method (raw/grill/boil/bake/fry)
//   xp:      Cooking XP every time (no repeat penalty; secrets give x3 the first time).
//            v0.38: all cut to 40% so Cooking levels at the same speed as the other skills.
//   heal:    HP when eaten (at 3 stars; stars scale it)
//   buffs:   [{ stat: 'atk'|'def'|'spd', pct, turns }]   resists: [{ element, amount, turns }]
//   element: what a thrown one hits as ('fire', 'acid'); none = Blunt
//   throw:   thrown damage at 3 stars       sell: coins at the Shopkeeper at 3 stars
//            (v0.40: every dish sells for ~1.6x what its ingredients sell for raw)
//   secret:  true = hidden until discovered   riddle: what Chef Marrowbone tells you about it
// ALL NUMBERS ARE PLACEHOLDERS for Jesus to tweak (decided with Jesus 2026-11-09).
// ============================================================
window.FUP = window.FUP || {};

FUP.recipeData = {
  list: [
    // ---------- Normal recipes (31): one every ~2 levels ----------
    { level: 1,  name: 'Roasted Grumpleberry',  ids: ['grumpleberry'],                                         method: 'grill', xp: 16,  heal: 10, throw: 6,  sell: 5 },
    { level: 1,  name: 'Grilled Glowcap',       ids: ['glowcap_mushroom'],                                     method: 'grill', xp: 18,  heal: 12, throw: 6,  sell: 5 },
    { level: 2,  name: 'Grilled Mudminnow',     ids: ['mudminnow'],                                            method: 'grill', xp: 22, heal: 14, throw: 6,  sell: 2 },
    { level: 3,  name: 'Berry Skewer',          ids: ['grumpleberry', 'rock_salt'],                            method: 'grill', xp: 28,  heal: 18, throw: 8,  sell: 8 },
    { level: 4,  name: 'Forest Salad',          ids: ['grumpleberry', 'glowcap_mushroom'],                     method: 'raw',   xp: 14,  heal: 20, throw: 6,  sell: 10 },
    { level: 5,  name: 'Roasted Chili',         ids: ['dragons_sneeze_chili'],                                 method: 'grill', xp: 32,  buffs: [{ stat: 'atk', pct: 0.10, turns: 3 }], element: 'fire', throw: 18, sell: 10 },
    { level: 6,  name: 'Glowcap Soup',          ids: ['glowcap_mushroom', 'glowcap_mushroom'],                 method: 'boil',  xp: 40, heal: 26, throw: 8,  sell: 10 },
    { level: 7,  name: 'Guppy Skewer',          ids: ['grumpy_guppy', 'grumpleberry'],                         method: 'grill', xp: 43, heal: 24, throw: 8,  sell: 8 },
    { level: 8,  name: 'Crying Onion Broth',    ids: ['tear_jerk_onion', 'glowcap_mushroom'],                  method: 'boil',  xp: 46, heal: 24, buffs: [{ stat: 'def', pct: 0.10, turns: 3 }], throw: 8, sell: 11 },
    { level: 9,  name: 'Perch Soup',            ids: ['pond_perch', 'glowcap_mushroom'],                       method: 'boil',  xp: 51, heal: 30, throw: 8,  sell: 10 },
    { level: 10, name: 'Spicy Jerky',           ids: ['squirrel_jerky', 'dragons_sneeze_chili'],               method: 'grill', xp: 56, buffs: [{ stat: 'atk', pct: 0.15, turns: 3 }], element: 'fire', throw: 22, sell: 16 },
    { level: 11, name: 'Carp Stew',             ids: ['sulking_carp', 'tear_jerk_onion'],                      method: 'boil',  xp: 60, heal: 28, buffs: [{ stat: 'def', pct: 0.10, turns: 3 }], throw: 10, sell: 13 },
    { level: 12, name: 'Bark Stew',             ids: ['bark', 'glowcap_mushroom', 'rock_salt'],                method: 'boil',  xp: 64, heal: 20, buffs: [{ stat: 'def', pct: 0.15, turns: 3 }], throw: 10, sell: 11 },
    { level: 13, name: 'Grumpleberry Pie',      ids: ['grumpleberry', 'grumpleberry', 'rock_salt'],            method: 'bake',  xp: 70, heal: 34, throw: 12, sell: 13 },
    { level: 15, name: 'Spore-B-Gone Broth',    ids: ['spore_b_gone_moss', 'glowcap_mushroom'],                method: 'boil',  xp: 76, heal: 15, resists: [{ element: 'poison', amount: 0.40, turns: 5 }], throw: 10, sell: 18 },
    { level: 16, name: 'Blackened Catfish',     ids: ['whiskered_catfish', 'dragons_sneeze_chili'],            method: 'grill', xp: 80, heal: 30, buffs: [{ stat: 'atk', pct: 0.10, turns: 3 }], element: 'fire', throw: 22, sell: 18 },
    { level: 17, name: 'Sour Lemon Tart',       ids: ['grumpy_lemon', 'grumpleberry'],                         method: 'bake',  xp: 84, heal: 20, resists: [{ element: 'acid', amount: 0.40, turns: 5 }], element: 'acid', throw: 26, sell: 16 },
    { level: 18, name: 'Woodland Skewer',       ids: ['squirrel_jerky', 'glowcap_mushroom', 'tear_jerk_onion'],method: 'grill', xp: 90, heal: 25, buffs: [{ stat: 'atk', pct: 0.10, turns: 3 }], throw: 12, sell: 18 },
    { level: 20, name: 'Dragon Fritters',       ids: ['dragons_sneeze_chili', 'dragons_sneeze_chili', 'rock_salt'], method: 'fry', xp: 104, buffs: [{ stat: 'atk', pct: 0.20, turns: 3 }], element: 'fire', throw: 35, sell: 22 },
    { level: 21, name: 'Salted Sardines',       ids: ['salty_sardine', 'salty_sardine', 'rock_salt'],          method: 'raw',   xp: 108, heal: 36, buffs: [{ stat: 'spd', pct: 0.10, turns: 3 }], throw: 10, sell: 16 },
    { level: 22, name: 'Fried Glowcaps',        ids: ['glowcap_mushroom', 'glowcap_mushroom', 'rock_salt'],    method: 'fry',   xp: 112, heal: 42, throw: 14, sell: 13 },
    { level: 23, name: 'Herring Tart',          ids: ['dock_herring', 'grumpy_lemon'],                         method: 'bake',  xp: 116, heal: 44, resists: [{ element: 'acid', amount: 0.30, turns: 4 }], throw: 12, sell: 19 },
    { level: 24, name: 'Ember Roast',           ids: ['ember_pepper', 'squirrel_jerky'],                       method: 'grill', xp: 120, buffs: [{ stat: 'atk', pct: 0.10, turns: 3 }], resists: [{ element: 'fire', amount: 0.40, turns: 5 }], element: 'fire', throw: 30, sell: 24 },
    { level: 25, name: 'Heartroot Pie',         ids: ['heartroot', 'grumpleberry', 'rock_salt', 'glowcap_mushroom'], method: 'bake', xp: 144, heal: 70, throw: 16, sell: 48 },
    { level: 27, name: 'Bark-Crust Pie',        ids: ['bark', 'bark', 'grumpleberry'],                         method: 'bake',  xp: 152, heal: 20, buffs: [{ stat: 'def', pct: 0.25, turns: 4 }], throw: 18, sell: 11 },
    { level: 28, name: 'Snapper Roast',         ids: ['regret_snapper', 'ember_pepper'],                       method: 'grill', xp: 156, heal: 50, buffs: [{ stat: 'atk', pct: 0.15, turns: 4 }], element: 'fire', throw: 30, sell: 29 },
    { level: 29, name: 'Lemon Moss Tonic',      ids: ['grumpy_lemon', 'spore_b_gone_moss', 'tear_jerk_onion'], method: 'boil',  xp: 160, resists: [{ element: 'poison', amount: 0.40, turns: 5 }, { element: 'acid', amount: 0.40, turns: 5 }], throw: 14, sell: 30 },
    { level: 31, name: 'Inferno Fry-Up',        ids: ['ember_pepper', 'dragons_sneeze_chili', 'squirrel_jerky'], method: 'fry', xp: 176, buffs: [{ stat: 'atk', pct: 0.25, turns: 3 }], element: 'fire', throw: 50, sell: 34 },
    { level: 33, name: 'Forest Feast',          ids: ['glowcap_mushroom', 'grumpleberry', 'tear_jerk_onion', 'squirrel_jerky'], method: 'bake', xp: 188, heal: 55, buffs: [{ stat: 'atk', pct: 0.10, turns: 4 }], throw: 20, sell: 22 },
    { level: 34, name: 'Flounder Pie',          ids: ['bashful_flounder', 'tear_jerk_onion', 'rock_salt'],     method: 'bake',  xp: 196, heal: 70, throw: 14, sell: 23 },   // (the plan's Stale Bread is retired: Rock Salt instead, so 23 not 26 for the 1.6x rule)
    { level: 36, name: 'Heartroot Stew',        ids: ['heartroot', 'glowcap_mushroom', 'tear_jerk_onion'],     method: 'boil',  xp: 208, heal: 85, throw: 20, sell: 46 },
    { level: 37, name: 'Mackerel Skewer',       ids: ['sarcastic_mackerel', 'dragons_sneeze_chili', 'grumpy_lemon'], method: 'grill', xp: 214, heal: 64, buffs: [{ stat: 'spd', pct: 0.20, turns: 4 }], throw: 26, sell: 35 },
    { level: 39, name: 'Fortress Stew',         ids: ['bark', 'bark', 'squirrel_jerky', 'rock_salt'],          method: 'boil',  xp: 224, buffs: [{ stat: 'def', pct: 0.35, turns: 4 }], throw: 22, sell: 16 },
    { level: 40, name: 'Tuna Steak',            ids: ['grudge_tuna', 'ember_pepper', 'rock_salt'],             method: 'grill', xp: 232, heal: 90, buffs: [{ stat: 'atk', pct: 0.20, turns: 4 }], throw: 28, sell: 38 },
    { level: 42, name: "Landlord's Bane",       ids: ['spore_b_gone_moss', 'spore_b_gone_moss', 'ember_pepper', 'rock_salt'], method: 'bake', xp: 248, resists: [{ element: 'poison', amount: 0.60, turns: 6 }], element: 'fire', throw: 45, sell: 46 },
    { level: 43, name: 'Letter Opener Feast',   ids: ['letter_opener', 'heartroot', 'grumpy_lemon'],           method: 'bake',  xp: 256, heal: 110, buffs: [{ stat: 'def', pct: 0.20, turns: 5 }], throw: 30, sell: 66 },
    { level: 45, name: "Dragon's Breakfast",    ids: ['ember_pepper', 'dragons_sneeze_chili', 'heartroot', 'rock_salt'], method: 'fry', xp: 280, heal: 50, buffs: [{ stat: 'atk', pct: 0.30, turns: 4 }], element: 'fire', throw: 60, sell: 66 },
    { level: 48, name: 'Royal Heartroot Roast', ids: ['heartroot', 'heartroot', 'grumpleberry', 'rock_salt'],  method: 'grill', xp: 320, heal: 120, throw: 30, sell: 78 },
    // The Soggy Marsh (W2). Croakberry Jam: sugar is retired, so grumpleberry instead (placeholder)
    { level: 18, name: 'Croakberry Jam',        ids: ['croakberry', 'croakberry', 'grumpleberry'],             method: 'boil',  xp: 90, heal: 40, throw: 8, sell: 18 },
    { level: 24, name: 'Croaker on a Stick',    ids: ['croaker', 'croakberry'],                                method: 'grill', xp: 128, heal: 46, buffs: [{ stat: 'def', pct: 0.10, turns: 3 }], throw: 10, sell: 19 },   // placeholder: no croaker dish was designed
    { level: 26, name: 'Mint Mudcake',          ids: ['mudroot', 'marsh_mint'],                                method: 'bake',  xp: 148, heal: 48, buffs: [{ stat: 'spd', pct: 0.15, turns: 4 }], throw: 10, sell: 27 },
    { level: 30, name: 'Bog Chowder',           ids: ['mud_skipper', 'mudroot', 'marsh_mint'],                 method: 'boil',  xp: 168, heal: 60, resists: [{ element: 'poison', amount: 0.40, turns: 5 }], throw: 12, sell: 37 },
    { level: 35, name: 'Eel Surprise',          ids: ['bog_eel', 'bog_truffle'],                               method: 'fry',   xp: 202, heal: 60, buffs: [{ stat: 'atk', pct: 0.20, turns: 4 }, { stat: 'def', pct: 0.20, turns: 4 }], throw: 20, sell: 62, secret: true,
      riddle: 'Something long from the bog and something rare from under it, fried. Don\'t ask either how it feels.' },
    // Flour from the repaired Windmill (R2)
    { level: 20, name: 'Flatbread',             ids: ['flour', 'rock_salt'],                                   method: 'bake',  xp: 104, heal: 45, throw: 8, sell: 5 },
    { level: 32, name: 'Onion Dumplings',       ids: ['flour', 'tear_jerk_onion', 'tear_jerk_onion'],          method: 'boil',  xp: 184, heal: 70, buffs: [{ stat: 'def', pct: 0.15, turns: 4 }], throw: 12, sell: 14 },
    { level: 46, name: 'Grand Fish Pie',        ids: ['flour', 'grudge_tuna', 'bashful_flounder', 'tear_jerk_onion'], method: 'bake', xp: 290, heal: 130, throw: 16, sell: 38 },

    // ---------- Secret recipes (7): ??? in the book until you discover them by experimenting ----------
    { level: 6,  name: 'Squirrel Surprise',  ids: ['squirrel_jerky', 'grumpleberry'],            method: 'grill', xp: 44, heal: 20, buffs: [{ stat: 'atk', pct: 0.10, turns: 3 }], throw: 10, sell: 11, secret: true,
      riddle: 'What the squirrel stole, grilled with what the squirrel guards.' },
    { level: 14, name: 'Weeping Soup',       ids: ['tear_jerk_onion', 'tear_jerk_onion'],         method: 'boil',  xp: 74, heal: 20, buffs: [{ stat: 'spd', pct: 0.15, turns: 3 }], throw: 10, sell: 13, secret: true,
      riddle: 'Two of the thing that makes you cry, sobbing together in hot water.' },
    { level: 19, name: 'Pucker Punch',       ids: ['grumpy_lemon', 'dragons_sneeze_chili'],       method: 'raw',   xp: 88, buffs: [{ stat: 'spd', pct: 0.10, turns: 3 }], element: 'acid', throw: 34, sell: 21, secret: true,
      riddle: 'Something grumpy and something sneezy. Don\'t cook them. Just introduce them.' },
    { level: 26, name: 'Chewy Bark Jerky',   ids: ['bark', 'squirrel_jerky'],                     method: 'grill', xp: 148, buffs: [{ stat: 'atk', pct: 0.15, turns: 4 }, { stat: 'def', pct: 0.15, turns: 4 }], throw: 18, sell: 10, secret: true,
      riddle: 'A tree\'s skin and a squirrel\'s revenge, on the grill. Chew carefully.' },
    { level: 32, name: 'Glowing Moss Pie',   ids: ['spore_b_gone_moss', 'glowcap_mushroom', 'grumpleberry'], method: 'bake', xp: 184, heal: 40, resists: [{ element: 'poison', amount: 0.50, turns: 6 }], throw: 18, sell: 22, secret: true,
      riddle: 'The moss that hates spores, the mushroom that glows, and a berry that hates everyone. Baked.' },
    { level: 38, name: 'Sneeze Tonic',       ids: ['dragons_sneeze_chili', 'ember_pepper', 'grumpy_lemon'], method: 'boil', xp: 220, buffs: [{ stat: 'spd', pct: 0.25, turns: 4 }], resists: [{ element: 'fire', amount: 0.40, turns: 5 }], throw: 24, sell: 38, secret: true,
      riddle: 'Two kinds of fire and one sour face, simmered until your nose runs faster than you do.' },
    { level: 44, name: 'Eviction Notice',    ids: ['heartroot', 'spore_b_gone_moss', 'dragons_sneeze_chili', 'ember_pepper'], method: 'fry', xp: 272, heal: 60, resists: [{ element: 'poison', amount: 0.60, turns: 6 }], element: 'fire', throw: 70, sell: 75, secret: true,
      riddle: 'A beating root, the anti-spore moss, and both fires of the field. Fried. Serve it to a landlord.' },
  ],

  // ---------- Burnt junk ----------
  // A burnt recipe, or an experiment that wasn't a secret recipe. Can't be eaten (you gag), only thrown or sold.
  junk: { name: 'Burnt Mess', burntName: 'Charred {dish}', throw: 5, sell: 1 },

  // ---------- Eating ingredients raw (no cooking) ----------
  // From your bag, in a fight (Eat → Raw from bag) or at home / the campfire (healing ones only).
  //   heal: HP     hpCost: HP it costs you     buff: { stat, pct, turns }     resist: { element, amount, turns }
  // Ingredients not listed here can't be eaten on their own.
  raw: {
    grumpleberry:         { heal: 5 },
    // Raw fish: 2 + its Fishing level / 3
    mudminnow: { heal: 2 }, grumpy_guppy: { heal: 3 }, pond_perch: { heal: 4 }, sulking_carp: { heal: 5 }, whiskered_catfish: { heal: 6 }, salty_sardine: { heal: 5 },
    mud_skipper: { heal: 7 }, croaker: { heal: 8 }, bog_eel: { heal: 10 },
    // The Soggy Marsh (W2)
    croakberry: { heal: 8 }, mudroot: { heal: 6 }, marsh_mint: { buff: { stat: 'spd', pct: 0.08, turns: 3 } }, bog_truffle: { heal: 28 },
    dock_herring: { heal: 7 }, regret_snapper: { heal: 8 }, bashful_flounder: { heal: 9 }, sarcastic_mackerel: { heal: 11 }, grudge_tuna: { heal: 12 }, letter_opener: { heal: 13 },
    glowcap_mushroom:     { heal: 6 },
    heartroot:            { heal: 20 },
    tear_jerk_onion:      { heal: 3 },
    squirrel_jerky:       { buff: { stat: 'atk', pct: 0.05, turns: 3 } },
    dragons_sneeze_chili: { buff: { stat: 'atk', pct: 0.08, turns: 3 }, hpCost: 2 },
    spore_b_gone_moss:    { resist: { element: 'poison', amount: 0.25, turns: 3 } },
  },
};
