// ============================================================
// THE OLD HILL ROAD — a danger region above the Western Ruins (v1.22, plans/ST4.md, Lv ~20).
// An old overgrown road climbs from the back of the ruins to a high clearing in the hills. Generations ago
// the elders met there; nobody remembers it now. Staff Q4 (the Blacksmith) sends you up here (quest: next build).
// Three of the road's everyday crowd live here, one of each, standing at their own spot (fixedFoes):
//   G = Gurrow, the Gate-Troll (the road's mouth)   O = Brannock, the Penitent Ogre (halfway)
//   K = Old Carrow, the Huntsman (near the top)   (not H: H is the Forest's hidden hole)
// The road is wide: you can walk past them. No fight at the clearing (Jesus).
//
// MAP KEY (like the Forest, data/forest.js):
//   #  trees (can't walk)   =  the old road   .  long grass
// Squares: tx = column, ty = row, from 0 at the top-left. Map is 30 x 40. South gap = cols 14-15 (to the Western Ruins). North gap = cols 14-15 (v1.27: the Old Quarry, opens with Glass Q5).
// The clearing is the open grass at the top (rows 1-6). Check with: tests/world_maps.js
// Name, map, numbers: PLACEHOLDERS.
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.hill = {
  id: 'hill', name: 'Old Hill Road',
  tileSize: 40,
  map: [
    '##############..##############',   // v1.27: north gap cols 14-15, the way up to the Old Quarry
    '######..................######',
    '####......................####',
    '###........................###',
    '###........................###',
    '####......................####',
    '#######.......====.......#####',
    '##########.###====###.########',
    '############..====..##########',
    '#############.====K.##########',
    '##############====############',
    '#########.....====....########',
    '########..=========...########',
    '########..====.#####..########',
    '#########.====.###############',
    '##########====..##############',
    '##########=====...############',
    '###########=====..############',
    '############=====.############',
    '##########...=====O###########',
    '#########.....====..##########',
    '########......====...#########',
    '#######.....=====....#########',
    '######.....=====...###########',
    '######....=====....###########',
    '#######...====....############',
    '########..====..##############',
    '#########.====.###############',
    '#########.=====...############',
    '##########=======.############',
    '###########..=====...#########',
    '############..====....########',
    '#############.====G...########',
    '##############====..##########',
    '#############.====.###########',
    '############..====..##########',
    '###########...====...#########',
    '############..====..##########',
    '#############.====.###########',
    '##############==##############',
  ],
  level: 20, mult: 1.6, coinMult: 2.4,   // PLACEHOLDER numbers (a little past the Marsh)
  enemiesPerRun: 0, ingredientsPerRun: 0,
  forageOdds: { Common: 1, Uncommon: 0, Rare: 0 }, forage: [],
  enemyTypes: {},
  // One of each, always on its own square, standing its ground (comes back like any enemy after the respawn time)
  fixedFoes: { G: 'gurrow', O: 'brannock', K: 'carrow' },
  objects: [],
  trees: { tree_pine: 4, tree_autumn: 3, tree_dead: 2 },
  decorations: { deco_fern: 0.08, deco_log: 0.02, deco_stump: 0.015 },
  ground: { ...FUP.look.mood('tollRoad'), treeShade: 0.7, pathChars: '=GOK' },
  light: FUP.look.mood('tollRoad').light,
  weather: null,
  fog: { sight: 5, memory: 0.6, campfire: 7 },
};
