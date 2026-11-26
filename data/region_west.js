// ============================================================
// THE WESTERN RUINS — a danger region west of the village (v1.19, plans/GL3.md, Lv 12-16).
// Part of the old village that was never reclaimed: broken streets between toppled houses, walls
// melted glassy where her fire hit. Opens when the West Road is repaired (Restoration Board).
// Ruin Rats, Scrap Goblins, Rubble Crabs, and crumbling walls (w) that drop rubble on you.
// Glass Q3 (the Carpenter) sends you here to pry 4 shards out of melted walls.
// The old village's name is NOT said here (it stays hidden until the Docks).
//
// MAP KEY (like the Forest, data/forest.js):
//   #  broken wall / toppled house (can't walk)   =  old street   .  overgrown yard
//   w  street under a crumbling wall: step in and rubble falls a moment later (src/scenes/WorldRubble.js)
//   C  the campfire   e  a spot where an enemy MIGHT appear
// Squares: tx = column, ty = row, from 0 at the top-left. Map is 48 x 28. East gap = rows 13-14 (to the village). North gap = cols 6-7 (v1.22: the Old Hill Road).
// Check with: tests/world_maps.js
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.west = {
  id: 'west', name: 'Western Ruins',
  tileSize: 40,
  map: [
    '######==########################################',
    '######==########################################',
    '##==========e===============wwwwww==#####=====##',
    '##============.===============e=====#####===e=##',
    '##==##.###==#....#==#....#==#....#==#####==#####',
    '##=e#....#==#....#==#....#==#....#==#...#==#####',
    '##==#....#==#....#==#....#==#....#==#...#==#####',
    '##==######==######==##.###==##.###==##.##==#####',
    '##==wwwwww==######============================##',
    '##==========######====e===============e=======##',
    '##==######==#....#==##############==#...#==#####',
    '##=e######==#....#==##############==#...#==#####',
    '##==######==##.###==##############==##.##==#####',
    '##==================wwwwww======================',
    '##============e===============e=================',
    '##==##.###########==#....#ww#....#==#####==#####',
    '##==#....#########==..C..#ww#....#==#....==#####',
    '##==#....#########==#....#ww#....#==#...#==#####',
    '##==##############==######==##.###==#####==#####',
    '##==######======e=======e===######============##',
    '##==######==================######======e=====##',
    '##==######==######ww######==#############==#####',
    '##==#....#==######ww.....#==#############==#####',
    '##==##.###==######ww######==#############==#####',
    '##==========wwwwww==######=====e====wwwww=====##',
    '##====e=============######==================e=##',
    '################################################',
    '################################################',
  ],
  level: 14, mult: 1.4, coinMult: 1.9,   // PLACEHOLDER numbers (between the Deep Woods and the Marsh)
  enemiesPerRun: 8, ingredientsPerRun: 0,
  forageOdds: { Common: 1, Uncommon: 0, Rare: 0 }, forage: [],
  enemyTypes: { ruinRat: 3, scrapGoblin: 2, rubbleCrab: 2 },
  // Who you fight when you touch each one (w = weight). Ruin Rats always come as a pack of 3.
  groups: {
    ruinRat:     [{ w: 1, foes: ['ruinRat', 'ruinRat', 'ruinRat'] }],
    scrapGoblin: [{ w: 2, foes: ['scrapGoblin'] }, { w: 1, foes: ['scrapGoblin', 'ruinRat'] }],
    rubbleCrab:  [{ w: 2, foes: ['rubbleCrab'] }, { w: 1, foes: ['rubbleCrab', 'scrapGoblin'] }],
  },
  // Crumbling walls (w): a stretch of `chunk` squares drops rubble `delay` s after you step in (-damage x max HP, never below 1)
  rubble: { chunk: 3, delay: 0.9, down: 2.5, damage: 0.08, safeSeconds: 1 },   // PLACEHOLDER (like the Vault's shelves)
  objects: [
    { kind: 'sign', tx: 45, ty: 14, text: 'A board nailed across nothing, painted long ago: KEEP OUT. Underneath, smaller: SERIOUSLY.' },
  ],
  trees: { ruin_wall: 6, ruin_wall_tall: 3, ruin_wall_glass: 2 },   // what stands on the # squares
  decorations: { deco_rubble: 0.08, deco_tuft: 0.05 },
  ground: { ...FUP.look.mood('ruins'), treeShade: 0.35, pathChars: '=w' },
  light: FUP.look.mood('ruins').light,
  weather: null,
  fog: { sight: 4.5, memory: 0.55, campfire: 7 },
};
