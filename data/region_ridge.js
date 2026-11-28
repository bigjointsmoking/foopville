// ============================================================
// WINDY RIDGE — a danger region off the west side of the Old Quarry (v1.46, plans/MQ3.md MQ3-A, Lv ~30-38).
// A high, windy mountain ridge: ledges of rock and tough grass climbing west and up to a small lookout hut
// at the top, where the elders kept watch (Main Quest 3 uses it in MQ3-B; the hut stays sealed until then).
// Reached across the Rope Bridge at the Quarry (a repair: Building 25 + 20 planks, data/repairs.js).
// Cliff Shrikes, Crag Lizards and Tumbleburrs (Jesus picked the names, 2026-11-28).
//
// MAP KEY (like the Forest, data/forest.js):
//   #  rock (can't walk)   =  a trail   .  rock and tough grass
//   C  the campfire   e  a spot where an enemy MIGHT appear   W  the lookout hut (a picture stands on it)
// Squares: tx = column, ty = row, from 0 at the top-left. Map is 48 x 27. East gap = rows 22-23 (to the Old Quarry).
// The summit shelf: rows 1-6, cols 3-16; the hut is the W block (cols 7-11, rows 1-3). Check with: tests/world_maps.js
// Map, numbers: PLACEHOLDERS.
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.ridge = {
  id: 'ridge', name: 'Windy Ridge',
  tileSize: 40,
  map: [
    '################################################',
    '#####..WWWWW...#################################',
    '###....WWWWW.....###############################',
    '###....WWWWW.....###############################',
    '###..e...==......###############################',
    '###......==......############............#######',
    '###......==......##########...............######',
    '#########==################....e...........#####',
    '#########==################................#####',
    '#####....==............####...........e....#####',
    '#######..==........e..=====................#####',
    '#####....==================.......e........#####',
    '#####.........e........####........==......#####',
    '#####................##############==###########',
    '###################################==###########',
    '###..............#..........................####',
    '###..............#...........................###',
    '###...e..........#.......e...............e...###',
    '###.......==========================.........###',
    '###..............#...................==......###',
    '###..............#...........e..C....==........#',
    '###....e.........###.................==........#',
    '###.........e....####################===.......=',
    '###..............####################===.......=',
    '####............########################...e..##',
    '#####...........#########################.....##',
    '################################################',
  ],
  level: 34, mult: 2.2, coinMult: 3.2,   // PLACEHOLDER numbers (past the Old Quarry)
  enemiesPerRun: 9, ingredientsPerRun: 0,
  forageOdds: { Common: 1, Uncommon: 0, Rare: 0 }, forage: [],
  enemyTypes: { cliffShrike: 3, cragLizard: 3, tumbleburr: 2 },
  // Who you fight when you touch each one (w = weight)
  groups: {
    cliffShrike: [{ w: 2, foes: ['cliffShrike'] }, { w: 1, foes: ['cliffShrike', 'cliffShrike'] }],
    cragLizard:  [{ w: 2, foes: ['cragLizard'] }, { w: 1, foes: ['cragLizard', 'cliffShrike'] }],
    tumbleburr:  [{ w: 2, foes: ['tumbleburr'] }, { w: 1, foes: ['tumbleburr', 'cragLizard'] }],
  },
  buildings: [{ sprite: 'ridge_hut', tx: 9.5, ty: 3, size: 190 }],   // the elders' lookout hut at the top (sealed)
  objects: [
    { kind: 'sign', tx: 9, ty: 5, text: 'A small hut of dark wood and iron bands, built into the rock. The door is sealed shut. Not locked: sealed. There\'s no keyhole at all.' },   // PLACEHOLDER (MQ3-B opens it)
  ],
  trees: { quarry_wall: 3, quarry_wall_tall: 2, tree_pine: 1 },   // what stands on the # squares
  decorations: { deco_rubble: 0.02 },
  ground: { ...FUP.look.mood('ridge'), pathStyle: 'dirt', treeShade: 0.6, pathChars: '=' },
  light: FUP.look.mood('ridge').light, weather: 'leaves',   // leaves blowing past: the wind
  fog: { sight: 5, memory: 0.6, campfire: 7 },
};
