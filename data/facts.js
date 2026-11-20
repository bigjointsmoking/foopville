// ============================================================
// FACTS — names for the counters the game keeps (src/systems/facts.js).
// A fact is "prefix:id" with a number, like 'boss:guardian': 2.
// These names show up when something is locked ("Repair the Well").
// ============================================================
window.FUP = window.FUP || {};

FUP.factData = {
  // Exact names for single facts
  labels: {
    'built:food_stall': 'Build your Food Stall',   // B3: the Second Stall
    'repair:well': 'Repair the Well',
    'repair:south_road': 'Repair the South Road',
    'repair:east_bridge': 'Repair the East Bridge',
    'repair:cart_stop': 'Repair the Cart Stop',
    'repair:market': 'Repair the Market',
    'repair:windmill': 'Repair the Windmill',
    'repair:fountain': 'Repair the Fountain',
    'got:rightForm': 'Find the Right Form (the Vault, under the Old Storehouse)',   // Phase D
    'road:east': 'Get past the Bog Notary',
    'vault:open': 'Open the iron door in the Guardian\'s Hall',
  },
  // Fallback by prefix. {name} = the thing's own name (enemy, quest...) or its id.
  prefixes: {
    boss: 'Beat {name}',
    kill: 'Defeat {name}',
    quest: 'Finish "{name}"',
    repair: 'Repair: {name}',
    region: 'Visit {name}',
  },
};
