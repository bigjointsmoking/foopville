// ============================================================
// THE FOOPVILLE DOCKS — a safe region south of the village (phase W1).
// A beach, a long pier, Gill the Fishmonger's shack. Fish the sea from the pier.
// Walk north through the gap (cols 19-20) back to the village.
//
// MAP KEY (like the Forest, data/forest.js):
//   #  tree / wall (can't walk)   .  grass   =  path   r  rock (can't walk)
//   ~  sea (can't walk)           b  pier planks (walkable)
//   F  pier fishing water (can't walk)   D  deep water (can't walk; P3 gives it fish)
// People and things are placed by square (tx = column, ty = row, from 0 at the top-left).
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.docks = {
  id: 'docks', name: 'Foopville Docks',
  tileSize: 40,
  map: [
        '###################==###################',
        '#...#.......#.###..==.....##.......#..##',
        '#.......#..........==#..............#..#',
        '#............#.....==..................#',
        '#.....#............==...............#..#',
        '#...#..##.#........==....###.........###',
        '#..................==....###...........#',
        '#..................==..................#',
        '#...================================...#',
        '#..................==..................#',
        '#..r...............==..........r....r..#',
        '#.......r..........==..................#',
        '~~~~~~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~F~~~~~~bb~~~~~~F~~~~~~~~~~~~',
        '~~~~~~~~~~~~bbbbbbbbbbbbbbbb~~~~~~~~~~~~',
        '~~~~~~~~~~~~F~~~~~~bb~~~~~~F~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~bbbbbb~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~D~~D~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  // Map letter → fishing spot in data/fishing.js (stand within 1 square of it, corners count)
  fish: { F: 'pier', D: 'deep' },
  // Villagers who live here (their windows are the same as in the village: data/village.js npcs)
  npcs: [{ id: 'fishmonger', tx: 24, ty: 7 }],
  // Things on the map: trap = a trap square (fish traps arrive in phase V1), sign = read it
  objects: [
    { kind: 'trap', tx: 5, ty: 11, spot: 'pier' }, { kind: 'trap', tx: 10, ty: 11, spot: 'pier' },
    { kind: 'trap', tx: 29, ty: 11, spot: 'pier' }, { kind: 'trap', tx: 34, ty: 11, spot: 'pier' },
    { kind: 'sign', tx: 21, ty: 11, text: 'PIER. Fish at your own risk. The fish certainly do.' },
  ],
  landmarks: [['vil_shop', 26, 6]],                                  // Gill's shack on the wall block, cols 25-27 rows 5-6 (placeholder picture)
  sand: { rows: [9, 11] },                                           // beach rows, tinted with the mood's sand colour
  trees: { tree_birch: 5, tree_round: 3, tree_pine: 2 },             // same as the Forest Edge
  decorations: { deco_flowers: 0.08, deco_tuft: 0.04, deco_shroom: 0.005, deco_stump: 0.005, bush: 0.015 },   // the Edge's, half as many
  ground: { ...FUP.look.mood('docks'), treeShade: 0.85, waterChars: '~FD' },
  light: null, weather: 'sunbeams', fog: null,
  sea: true,                                                         // no pond lily pads out here
  enemyTypes: {}, enemiesPerRun: 0, ingredientsPerRun: 0, level: 0, mult: 1, coinMult: 1,
};
