// ============================================================
// THREE SCALES — the market town north of the Deep Woods (v1.10, Jesus 2026-11-24, archive/plans-done/TS1.md,
// story/MAIN_QUEST_LINE.md section 8). A rich mountain fortress in the snow, run by a council of three
// rival trading houses: the Grain House (land and food), the Road House (the road and the caravans),
// the Iron House (metal and crafts). House names are placeholders by trade until Jesus names the families.
// A safe region (no trip, no enemies, no fog). Opens once you beat the Mushroom Guardian (data/world.js).
// First version: walls, gate, three terraces, the three halls, the council hall, a market square,
// 5 townsfolk with lines. No shops yet; the contact and Quest 3 come later.
// Lines and positions are PLACEHOLDERS.
//
// MAP KEY:
//   #  snowy pines (can't walk)   .  snow   =  cleared cobbled street
//   X  the fortress wall (can't walk; a wall piece is drawn on each square)
//   W  a building's ground (can't walk; the picture comes from `buildings`)
// Terraces are hills (src/systems/hills.js): the market terrace, and the council terrace on top of it.
// Check with: tests/north_town.js
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.north = {
  id: 'north', name: 'Three Scales',
  tileSize: 40,
  map: [
      '#XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX#',
      '#X............................................X#',
      '#X............................................X#',
      '#X..........WWWW....WWWWWWWW....WWWW..........X#',
      '#X..........WWWW....WWWWWWWW....WWWW..........X#',
      '#X..........WWWW....WWWWWWWW....WWWW..........X#',
      '#X.........==========================.........X#',
      '#X.....................==.....................X#',
      '#X.....................==.....................X#',
      '#X.....................==.....................X#',
      '#X..WWWWWW....====================....WWWWWW..X#',
      '#X..WWWWWW....====================....WWWWWW..X#',
      '#X..WWWWWW....==WW============WW==....WWWWWW..X#',
      '#X............====================............X#',
      '#X............====================............X#',
      '#X..WWWWWW....==WW============WW==.....WWWW...X#',
      '#X..WWWWWW....====================.....WWWW...X#',
      '#X..WWWWWW....====================............X#',
      '#X.....................==.....................X#',
      '#X.....................==.....................X#',
      '#X..WWWW..WWWW.........==.........WWWW..WWWW..X#',
      '#X.#WWWW..WWWW.........==.........WWWW..WWWW#.X#',
      '#X..WWWW..WWWW.........==.........WWWW..WWWW..X#',
      '#X.....................==.....................X#',
      '#X.==========================================.X#',
      '#X.....................==.....................X#',
      '#X.#...................==...................#.X#',
      '#X.##...............WWW==WWW...............##.X#',
      '#XXXXXXXXXXXXXXXXXXXWWW==WWWXXXXXXXXXXXXXXXXXXX#',
      '#######################==#######################',
  ],
  hills: [
    { tx: 2, ty: 1, w: 44, h: 19, stairs: [[23, 19], [24, 19]] },   // the market terrace
    { tx: 10, ty: 2, w: 28, h: 7, stairs: [[23, 8], [24, 8]] },     // the council terrace, on top of it
  ],
  // Pictures standing on the W squares: tx = the building's middle (in squares), ty = its bottom row
  buildings: [
    { sprite: 'ts_tower', tx: 21.5, ty: 28, size: 120 }, { sprite: 'ts_tower', tx: 26.5, ty: 28, size: 120 },
    { sprite: 'ts_gate', tx: 24, ty: 28, size: 110, over: true },
    { sprite: 'ts_grain_hall', tx: 7, ty: 12, size: 240, label: 'THE GRAIN HOUSE' },
    { sprite: 'ts_road_hall', tx: 41, ty: 12, size: 240, label: 'THE ROAD HOUSE' },
    { sprite: 'ts_iron_hall', tx: 7, ty: 17, size: 240, label: 'THE IRON HOUSE' },
    { sprite: 'ts_council', tx: 24, ty: 5, size: 320, label: 'COUNCIL HALL' },
    { sprite: 'ts_townhouse_a', tx: 14, ty: 5, size: 150 }, { sprite: 'ts_townhouse_b', tx: 34, ty: 5, size: 150 },
    { sprite: 'ts_townhouse_b', tx: 41, ty: 16, size: 150 },
    { sprite: 'ts_townhouse_a', tx: 6, ty: 22, size: 150 }, { sprite: 'ts_townhouse_b', tx: 12, ty: 22, size: 150 },
    { sprite: 'ts_townhouse_a', tx: 36, ty: 22, size: 150 }, { sprite: 'ts_townhouse_b', tx: 42, ty: 22, size: 150 },
    { sprite: 'ts_stall', tx: 17, ty: 12, size: 80 }, { sprite: 'ts_stall', tx: 31, ty: 12, size: 80 },
    { sprite: 'ts_stall', tx: 17, ty: 15, size: 80 }, { sprite: 'ts_stall', tx: 31, ty: 15, size: 80 },
  ],
  walls: { along: 'ts_wall', up: 'ts_wall_v' },   // the picture for an X square in a row / in a column of wall
  npcs: [{ id: 'ts_guard', tx: 21, ty: 25 }, { id: 'ts_grain', tx: 10, ty: 13 }, { id: 'ts_road', tx: 37, ty: 13 },
         { id: 'ts_iron', tx: 10, ty: 18 }, { id: 'ts_crier', tx: 20, ty: 14 },
         { id: 'ts_assayer', tx: 11, ty: 16 }],   // v1.12: The Inspector's contact, by the Iron House
  objects: [
    { kind: 'sign', tx: 22, ty: 26, text: 'THREE SCALES. Three houses. One council. Mind the ice.' },
    { kind: 'sign', tx: 6, ty: 13, text: 'THE GRAIN HOUSE. Every loaf in Three Scales passes through here. So does every coin for it.' },
    { kind: 'sign', tx: 41, ty: 13, text: 'THE ROAD HOUSE. Caravans in, caravans out, tolls in between.' },
    { kind: 'sign', tx: 6, ty: 18, text: 'THE IRON HOUSE. If it\'s sharp, heavy or expensive, it was made here.' },
    { kind: 'sign', tx: 13, ty: 13, text: 'THE MARKET SQUARE. Everything is for sale. Some of it is even worth it.' },
    { kind: 'sign', tx: 21, ty: 7, text: 'COUNCIL IN SESSION. Always.' },
  ],
  trees: { tree_pine_snow: 1 },
  decorations: {},
  ground: { ...FUP.look.mood('snow'), treeShade: 0.9, waterChars: '~', pathChars: '=X' },
  light: null, weather: 'snow', fog: null,
  enemyTypes: {}, enemiesPerRun: 0, ingredientsPerRun: 0, level: 0, mult: 1, coinMult: 1,
};
