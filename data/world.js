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
  respawnSeconds: 300,       // play seconds before a danger region is reshuffled on your next trip
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
                 features: ['enemies', 'forage', 'fog', 'campfire'], links: { W: { to: 'village', edge: 'N' }, E: { to: 'tollroad', edge: 'W' } } },
    tollroad:  { name: 'Goblin Toll Road', kind: 'danger', scene: 'World', box: { col: 1, row: 2 }, band: [5, 9], dropTier: 2,
                 features: ['enemies', 'forage', 'fog', 'campfire'], links: { W: { to: 'edge', edge: 'E' }, E: { to: 'deepwoods', edge: 'W' } } },
    deepwoods: { name: 'Deep Woods', kind: 'danger', scene: 'World', box: { col: 2, row: 2 }, band: [9, 13], dropTier: 2,
                 features: ['enemies', 'forage', 'fog', 'campfire'], links: { W: { to: 'tollroad', edge: 'E' } } },
    // Safe: no trip, no enemies, no fog. Map in data/region_docks.js (v0.54)
    docks:     { name: 'Foopville Docks', kind: 'cozy', scene: 'World', box: { col: 0, row: 4 }, features: ['npcs', 'objects', 'fishing'],
                 links: { N: { to: 'village', edge: 'S' } } },
    // The tutorial island (v0.62): where a new life wakes up. No links: the ferry (data/tutorial.js) goes to the village, one way.
    isle:      { name: 'Orientation Isle', kind: 'cozy', scene: 'World', box: { col: 1, row: 4 }, features: ['npcs', 'objects', 'fishing', 'campfire', 'tutorial'],
                 links: {} },
    // East of the village over the repaired bridge (W2). Map in data/region_marsh.js
    marsh:     { name: 'Soggy Marsh', kind: 'danger', scene: 'World', box: { col: 1, row: 3 }, band: [15, 22], dropTier: 3,
                 features: ['enemies', 'forage', 'fog', 'campfire', 'fishing', 'objects'], links: { W: { to: 'village', edge: 'E' } } },
  },

  // Maps for regions that aren't Forest areas: each data/region_<id>.js file adds its own. Forest regions use data/forest.js.
  areas: {},
};
