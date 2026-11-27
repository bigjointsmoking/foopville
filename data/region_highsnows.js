// ============================================================
// THE HIGH SNOWS — a danger region above Three Scales (v1.29, plans/AL4.md, Lv ~21).
// Snowfields, pines and cliffs in the highlands behind the fortress town. Old Whitepaw, the giant snow cat
// nobody has killed, lives up here (its lair is the cave at the top; the cat itself comes with Ash Q5).
// Through the north gate at the back of Three Scales, which opens once Ash Q4 sends you (data/world.js).
// Ridge Goats, Frost Wolverines and Highland Eagles (Jesus picked the mountain animals).
//
// MAP KEY (like the Forest, data/forest.js):
//   #  snowy pines and rock (can't walk)   =  a trail   .  snow
//   C  the campfire   e  a spot where an enemy MIGHT appear   W  the cave mouth (a picture stands on it)
// Squares: tx = column, ty = row, from 0 at the top-left. Map is 40 x 40. South gap = cols 19-20 (to Three Scales).
// The lair's shelf: rows 1-6, cols 14-26; the cave mouth is the W block (cols 18-22, rows 1-3). Check with: tests/world_maps.js
// Name, map, numbers: PLACEHOLDERS.
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.highsnows = {
  id: 'highsnows', name: 'The High Snows',
  tileSize: 40,
  map: [
    '########################################',
    '##############....WWWWW....#############',
    '##############....WWWWW....#############',
    '##############....WWWWW....#############',
    '##############......==.....#############',
    '##############..e..===..e..#############',
    '##############.....==......#############',
    '#################====###################',
    '####..........=====#####################',
    '####..........==.######.............####',
    '####...e....====.######......e......####',
    '####........==...######...e.........####',
    '####.....e..==...######.............####',
    '####........====.######.............####',
    '####........e.==.#####========...e..####',
    '####..........==.#####==............####',
    '##############=====###==............####',
    '#################=======################',
    '##########..........==.........#########',
    '##########..........==.........#########',
    '##########..e.......==.........#########',
    '##########..........==..C......#########',
    '##########........====.....e...#########',
    '##########........==...........#########',
    '##########.....=====...........#########',
    '###############==#==####################',
    '###............==#==============########',
    '###......========########.....==.....###',
    '###..e.........====######.....==.....###',
    '###............##==######...e........###',
    '###............##==######............###',
    '###............##==######............###',
    '###........e...##==######.........e..###',
    '###............##====####............###',
    '###############....==................###',
    '###############....==....###############',
    '###############....==....###############',
    '###############....==....###############',
    '###############....==....###############',
    '###################==###################',
  ],
  level: 21, mult: 1.7, coinMult: 2.5,   // PLACEHOLDER numbers (about the Old Hill Road)
  enemiesPerRun: 9, ingredientsPerRun: 0,
  forageOdds: { Common: 1, Uncommon: 0, Rare: 0 }, forage: [],
  enemyTypes: { ridgeGoat: 3, frostWolverine: 3, highlandEagle: 2 },
  // Who you fight when you touch each one (w = weight)
  groups: {
    ridgeGoat:      [{ w: 2, foes: ['ridgeGoat'] }, { w: 1, foes: ['ridgeGoat', 'ridgeGoat'] }],
    frostWolverine: [{ w: 2, foes: ['frostWolverine'] }, { w: 1, foes: ['frostWolverine', 'highlandEagle'] }],
    highlandEagle:  [{ w: 2, foes: ['highlandEagle'] }, { w: 1, foes: ['ridgeGoat', 'highlandEagle'] }],
  },
  buildings: [{ sprite: 'hs_cave', tx: 20.5, ty: 3, size: 220 }],   // the cave mouth at the top (Old Whitepaw's lair)
  objects: [
    { kind: 'sign', tx: 21, ty: 37, text: 'A Road House notice, half buried: HUNTERS BEYOND THIS POINT DO SO AT THEIR OWN RISK. Someone has scratched underneath: AND THEY DO.' },
  ],
  trees: { tree_pine_snow: 4, hs_rock: 2 },   // what stands on the # squares
  decorations: { deco_rubble: 0.01 },
  ground: { ...FUP.look.mood('snow'), pathStyle: 'dirt', treeShade: 0.85, pathChars: '=' },
  light: null, weather: 'snow',
  fog: { sight: 5, memory: 0.6, campfire: 7 },
};
