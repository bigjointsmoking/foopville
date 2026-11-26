// ============================================================
// THE OLD QUARRY — a danger region above the Old Hill Road (v1.27, plans/GL5.md, Lv ~25-30).
// An abandoned quarry past the top of the high clearing: an old cart road climbs between cut stone walls
// to a wide pit with old tools left lying where they were dropped. Empty and quiet. The only one here is
// Jarvin the Stone Warden, the quarry's last guard (a quest fight, Glass Q5; placed by the quest in part 2).
// The way in opens once Glass Q5 starts (data/world.js: req quests).
//
// MAP KEY (like the Forest, data/forest.js):
//   #  quarry rock (can't walk)   =  the old cart road   .  bare stone floor
// Squares: tx = column, ty = row, from 0 at the top-left. Map is 30 x 36. South gap = cols 14-15 (to the Old Hill Road).
// The pit is the open floor at the top (rows 1-11); its middle is about (15, 6). Check with: tests/world_maps.js
// Name, map, numbers: PLACEHOLDERS.
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.quarry = {
  id: 'quarry', name: 'The Old Quarry',
  tileSize: 40,
  map: [
    '##############################',
    '#####....................#####',
    '###........................###',
    '##..........................##',
    '##..........................##',
    '##..........................##',
    '##..........................##',
    '###........................###',
    '####.........====.........####',
    '######.......====.......######',
    '#########....====....#########',
    '###########..====..###########',
    '############.====.############',
    '############.====.############',
    '#############====#############',
    '#############====.############',
    '############.====..###########',
    '###########..====...##########',
    '###########..=====..##########',
    '############..====..##########',
    '#############.====.###########',
    '############..====############',
    '###########...====############',
    '###########..=====.###########',
    '############=====..###########',
    '###########=====...###########',
    '###########====...############',
    '############====..############',
    '#############====.############',
    '#############.====############',
    '############..====.###########',
    '############..====..##########',
    '#############.====.###########',
    '#############.====.###########',
    '##############====############',
    '##############==##############',
  ],
  level: 28, mult: 1.9, coinMult: 2.8,   // PLACEHOLDER numbers (past the Old Hill Road)
  enemiesPerRun: 0, ingredientsPerRun: 0,   // Jesus: only the boss lives here
  forageOdds: { Common: 1, Uncommon: 0, Rare: 0 }, forage: [],
  enemyTypes: {},
  objects: [],
  trees: { quarry_wall: 5, quarry_wall_tall: 3, quarry_wall_cut: 2 },   // what stands on the # squares
  decorations: { deco_rubble: 0.05, deco_quarry_tools: 0.015 },
  ground: { ...FUP.look.mood('quarry'), pathStyle: 'dirt', treeShade: 0.4, pathChars: '=' },   // a dirt cart track (cobbles drew like a wall)
  light: FUP.look.mood('quarry').light,
  weather: null,
  fog: { sight: 5, memory: 0.6, campfire: 7 },
};
