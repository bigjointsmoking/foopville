// ============================================================
// LEDGERWICK — the town east of the Soggy Marsh (Phase D, v1.00, Jesus 2026-11-19, design/phase-d.md).
// Home of "R": the Resident Receiver, a polite collector who takes the "dues" from every village and
// sends it up the mountain, and honestly thinks that's fair. Mr. Tally's old employer.
// A safe region (no trip, no enemies, no fog). Reached through the Marsh's east edge, past the Bog
// Notary, once the road east is open (fact 'road:east'; v1.38: the Causeway Serpent, OT-B). Walk west through the gap (rows 13-14) back.
// First version: 3 townsfolk (the Receiver, the Town Clerk with a quest board, Mrs. Pennywise's
// Repossessed Goods), a pond to fish, a campfire. The Receiver's story chapter comes later.
// Town name, people, lines and prices are all PLACEHOLDERS.
//
// MAP KEY (like the Docks, data/region_docks.js):
//   #  tree / wall (can't walk)   .  grass   =  path   ~  pond (can't walk)
//   F  fishing water (can't walk; stand next to it)   C  the campfire
// Check with: tests/east_town.js
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.east = {
  id: 'east', name: 'Ledgerwick',
  tileSize: 40,
  map: [
      '########################################',
      '##.....##..#######..##.##.##.....#######',
      '#.....................................##',
      '#................######...............##',
      '##...............######................#',
      '##...............######...............##',
      '##...............######...............##',
      '##.................==..................#',
      '##...####..........==.......####......##',
      '#....####..........==.......####.......#',
      '#....####..........==.......####......##',
      '#......=...........==.........=.......##',
      '#......=...........==.........=.......##',
      '======================================##',
      '======================================.#',
      '##.................==..................#',
      '#..................==.................##',
      '#..................==.................##',
      '##.................==..........###....##',
      '#..................==..........###....##',
      '##.....~~~F~~~.....==..................#',
      '##....~~~~~~~~~....==.....C...........##',
      '#.....~~~~~~~~F....==..................#',
      '##....F~~~~~~~~....==..................#',
      '#.....~~~~~~~~~....==..................#',
      '#......~~~F~~~.....==.................##',
      '#..................==.................##',
      '##.....................................#',
      '##.#.#....#.##.#.#..#.#####...#..#.#####',
      '########################################',
  ],
  fish: { F: 'tollRiver', '~': 'tollRiver' },   // PLACEHOLDER: the Toll River's fish until the town gets its own
  // Townsfolk (their windows: data/village.js npcs + src/scenes/VillagePanels.js)
  npcs: [{ id: 'receiver', tx: 18, ty: 7 }, { id: 'clerk', tx: 8, ty: 11 }, { id: 'pennywise', tx: 31, ty: 11 }],
  objects: [
    { kind: 'sign', tx: 3, ty: 12, text: 'LEDGERWICK. Population: counted. Dues: due. Have a pleasant stay. It will be itemised.' },
    { kind: 'sign', tx: 23, ty: 7, text: 'THE COUNTING HOUSE. Office of the Resident Receiver. All payments welcome. All payments expected.' },
    { kind: 'sign', tx: 27, ty: 11, text: 'REPOSSESSED GOODS. Everything here belonged to somebody. Now it belongs to a price tag.' },
  ],
  landmarks: [['vil_house', 19, 6], ['vil_board', 6, 10], ['vil_shop', 29, 10]],   // placeholder pictures on the wall blocks
  trees: { tree_birch: 4, tree_round: 4, tree_pine: 2 },
  decorations: { deco_flowers: 0.06, deco_stump: 0.005, bush: 0.012 },
  ground: { ...FUP.look.mood('docks'), treeShade: 0.85, waterChars: '~F' },
  light: null, weather: 'sunbeams', fog: null,
  enemyTypes: {}, enemiesPerRun: 0, ingredientsPerRun: 0, level: 0, mult: 1, coinMult: 1,
};
