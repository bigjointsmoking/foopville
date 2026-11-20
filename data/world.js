// ============================================================
// WORLD — the regions of the world and how they connect (phase F3).
// Walk off a map edge where there's a gap and you arrive in the next region.
//   kind:   hub (village) / cozy (safe, later) / danger (enemies; a trip starts when you enter)
//   scene:  which screen draws it ('Village' or 'World')
//   box:    where it sits on the world map panel (col, row)
//   band:   the Melee levels it is meant for (shown on the HUD: "Lv 1-5")
//   links:  { edge: { to: region, edge: the edge you arrive at there, req } }
//           edges: N S E W. The gap = the open squares on that border of the map.
//   features: what the World screen turns on there
// Rules in src/systems/world.js. The Forest maps themselves are in data/forest.js (same ids).
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData = {
  maxSize: 64,               // no region map wider or taller than this (squares)
  // E1a (Jesus 2026-11-19, design/exploration-e0.md): danger regions are built once per life and kept.
  // Each enemy / ingredient spot comes back on its own timer, counted in PLAY seconds (nothing refills
  // while the game is closed). A region can override any of these with its own `respawn: { ... }`.
  respawn: {
    enemies: 300,      // a beaten enemy's spot gets a new enemy after this long (Forest Edge: 5 min)
    items: 600,        // a picked ingredient grows back after this long (10 min)
    rest: 600,         // campfire Rest cooldown (10 min)
    graveRadius: 6,    // squares: nothing respawns this close to your grave while it waits
    sightMargin: 2,    // squares beyond your sight: things only come back where you can't see them
  },
  fadeMs: 250,               // screen fade when you cross into another region
  arriveGraceSeconds: 1.5,   // after walking into a region, enemies leave you alone this long

  regions: {
    village:   { name: 'Foopville', kind: 'hub', scene: 'Village', box: { col: 0, row: 3 },
                 links: {
                   N: { to: 'edge', edge: 'W' },   // the gate
                   // lockEmoji is drawn on the gap while it's locked; lockText + what's missing is said when you walk into it.
                   // soonText: said once it's unlocked but the region isn't built yet (built: false below).
                   S: { to: 'docks', edge: 'N', req: { facts: { 'repair:south_road': 1 } }, lockEmoji: '🪨',
                        lockText: 'The road south is washed out. Someone should fix that. Someone with coins.', soonText: 'The Docks: still being imagined.' },
                   E: { to: 'marsh', edge: 'W', req: { facts: { 'repair:east_bridge': 1 } }, lockEmoji: '🌉',
                        lockText: 'The east bridge is mostly a suggestion now.' },
                 } },
    edge:      { name: 'Forest Edge', kind: 'danger', scene: 'World', box: { col: 0, row: 2 }, band: [1, 5], dropTier: 1,
                 features: ['enemies', 'forage', 'fog', 'campfire', 'fishing', 'objects'], links: { W: { to: 'village', edge: 'N' }, E: { to: 'tollroad', edge: 'W' } } },
    tollroad:  { name: 'Goblin Toll Road', kind: 'danger', scene: 'World', box: { col: 1, row: 2 }, band: [5, 9], dropTier: 2,
                 respawn: { enemies: 420 },   // 7 min
                 features: ['enemies', 'forage', 'fog', 'campfire', 'fishing', 'objects'], links: { W: { to: 'edge', edge: 'E' }, E: { to: 'deepwoods', edge: 'W' } } },
    deepwoods: { name: 'Deep Woods', kind: 'danger', scene: 'World', box: { col: 2, row: 2 }, band: [9, 13], dropTier: 2,
                 respawn: { enemies: 540 },   // 9 min
                 features: ['enemies', 'forage', 'fog', 'campfire', 'fishing', 'objects'], links: { W: { to: 'tollroad', edge: 'E' } } },
    // Safe: no trip, no enemies, no fog. Map in data/region_docks.js (v0.54)
    docks:     { name: 'Foopville Docks', kind: 'cozy', scene: 'World', box: { col: 0, row: 4 }, features: ['npcs', 'objects', 'fishing'],
                 links: { N: { to: 'village', edge: 'S' } } },
    // The tutorial island (v0.62): where a new life wakes up. No links: the ferry (data/tutorial.js) goes to the village, one way.
    isle:      { name: 'Orientation Isle', kind: 'cozy', scene: 'World', box: { col: 1, row: 4 }, features: ['npcs', 'objects', 'fishing', 'campfire', 'tutorial'],
                 links: {} },
    // East of the village over the repaired bridge (W2). Map in data/region_marsh.js
    marsh:     { name: 'Soggy Marsh', kind: 'danger', scene: 'World', box: { col: 1, row: 3 }, band: [15, 22], dropTier: 3,
                 respawn: { enemies: 600 },   // 10 min
                 features: ['enemies', 'forage', 'fog', 'campfire', 'fishing', 'objects', 'npcs'],
                 links: { W: { to: 'village', edge: 'E' },
                          // Phase D: the road east past the Bog Notary opens when "The Right Form" is done
                          E: { to: 'east', edge: 'W', req: { facts: { 'road:east': 1 } }, lockEmoji: '📜',
                               lockText: 'The road east goes past the Notary\'s office. Nobody gets past the Notary without the right form.' } } },
    // Phase D (v1.00): the Receiver's town. Safe, like the Docks. Map in data/region_east.js
    east:      { name: 'Ledgerwick', kind: 'cozy', scene: 'World', box: { col: 2, row: 3 }, features: ['npcs', 'objects', 'fishing', 'campfire'],
                 links: { W: { to: 'marsh', edge: 'E' } } },
  },

  // Maps for regions that aren't Forest areas: each data/region_<id>.js file adds its own. Forest regions use data/forest.js.
  areas: {},
};
