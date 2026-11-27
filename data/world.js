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
                   // v1.19: the West Road (a repair) opens the Western Ruins (plans/GL3.md)
                   W: { to: 'west', edge: 'E', req: { facts: { 'repair:west_road': 1 } }, lockEmoji: '🪨',
                        lockText: 'Rubble fills the old road west. Nobody\'s been west in years. Nobody\'s wanted to.' },
                 } },
    edge:      { name: 'Forest Edge', kind: 'danger', scene: 'World', box: { col: 0, row: 2 }, band: [1, 5], dropTier: 1,
                 features: ['enemies', 'forage', 'fog', 'campfire', 'fishing', 'objects'], links: { W: { to: 'village', edge: 'N' }, E: { to: 'tollroad', edge: 'W' } } },
    tollroad:  { name: 'Goblin Toll Road', kind: 'danger', scene: 'World', box: { col: 1, row: 2 }, band: [5, 9], dropTier: 2,
                 respawn: { enemies: 420 },   // 7 min
                 features: ['enemies', 'forage', 'fog', 'campfire', 'fishing', 'objects'], links: { W: { to: 'edge', edge: 'E' }, E: { to: 'deepwoods', edge: 'W' } } },
    deepwoods: { name: 'Deep Woods', kind: 'danger', scene: 'World', box: { col: 2, row: 2 }, band: [9, 13], dropTier: 2,
                 respawn: { enemies: 540 },   // 9 min
                 features: ['enemies', 'forage', 'fog', 'campfire', 'fishing', 'objects'], links: { W: { to: 'tollroad', edge: 'E' },
                          // v1.10: the road north to Three Scales opens once you beat the Mushroom Guardian
                          N: { to: 'north', edge: 'S', req: { facts: { 'boss:guardian': 1 } }, lockEmoji: '🏰',
                               lockText: 'The road north climbs to a fortress gate. The guards look at you, then at your bucket. Not today.' } } },
    // v1.19: the Western Ruins, part of the old village never reclaimed (Glass Q3). Map in data/region_west.js
    west:      { name: 'Western Ruins', kind: 'danger', scene: 'World', box: { col: -1, row: 3 }, band: [12, 16], dropTier: 2,
                 respawn: { enemies: 540 },   // 9 min
                 features: ['enemies', 'fog', 'campfire', 'objects'], links: { E: { to: 'village', edge: 'W' }, N: { to: 'hill', edge: 'S' } } },   // v1.22: N = the Old Hill Road
    // v1.22: the Old Hill Road, from the back of the Western Ruins up to the high clearing (Staff Q4). Map in data/region_hill.js
    hill:      { name: 'Old Hill Road', kind: 'danger', scene: 'World', box: { col: -1, row: 2 }, band: [18, 22], dropTier: 3,
                 respawn: { enemies: 540 },   // 9 min (PLACEHOLDER)
                 features: ['enemies', 'fog', 'objects'], links: { S: { to: 'west', edge: 'N' },
                          // v1.27: the way up to the Old Quarry opens once Glass Q5 is taken (Jesus)
                          N: { to: 'quarry', edge: 'S', req: { quests: ['glass5'] }, lockEmoji: '🪨',
                               lockText: 'Fallen rock and old timber block the track above the clearing. Nobody has been up there in a long, long time. Nobody has had a reason.' } } },
    // v1.27: the Old Quarry, above the clearing (Glass Q5). Only Jarvin the Stone Warden lives there. Map in data/region_quarry.js
    quarry:    { name: 'The Old Quarry', kind: 'danger', scene: 'World', box: { col: -1, row: 1 }, band: [25, 30], dropTier: 3,
                 respawn: { enemies: 540 },   // PLACEHOLDER
                 features: ['enemies', 'fog', 'objects'], links: { S: { to: 'hill', edge: 'N' } } },
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
                          // v1.38: the road east opens by beating the Causeway Serpent (plans/OT.md OT-B, not built yet); saves that opened it keep it
                          E: { to: 'east', edge: 'W', req: { facts: { 'road:east': 1 } }, lockEmoji: '📜',
                               lockText: 'The old road east is blocked for now. Something big lives where it crosses the deep water.' } } },
    // v1.10: Three Scales, the market town north of the Deep Woods. Safe, like the Docks. Map in data/region_north.js
    north:     { name: 'Three Scales', kind: 'cozy', scene: 'World', box: { col: 2, row: 1 }, features: ['npcs', 'objects'],
                 links: { S: { to: 'deepwoods', edge: 'N' },
                          // v1.29: the north gate opens once Ash Q4 sends you (Jesus)
                          N: { to: 'highsnows', edge: 'S', req: { quests: ['ash4'] }, lockEmoji: '🏔️',
                               lockText: 'The north gate guards cross their spears. "Highlands. Nobody goes up without a reason, and nobody comes back with one."' } } },
    // v1.29: the High Snows, above Three Scales (Ash Q4). Map in data/region_highsnows.js
    highsnows: { name: 'The High Snows', kind: 'danger', scene: 'World', box: { col: 2, row: 0 }, band: [18, 24], dropTier: 3,
                 respawn: { enemies: 540 },   // PLACEHOLDER
                 features: ['enemies', 'fog', 'campfire', 'objects'], links: { S: { to: 'north', edge: 'N' } } },
    // Phase D (v1.00): the Receiver's town. Safe, like the Docks. Map in data/region_east.js
    east:      { name: 'Ledgerwick', kind: 'cozy', scene: 'World', box: { col: 2, row: 3 }, features: ['npcs', 'objects', 'fishing', 'campfire'],
                 links: { W: { to: 'marsh', edge: 'E' } } },
  },

  // Maps for regions that aren't Forest areas: each data/region_<id>.js file adds its own. Forest regions use data/forest.js.
  areas: {},
};
