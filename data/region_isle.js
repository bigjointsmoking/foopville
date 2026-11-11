// ============================================================
// ORIENTATION ISLE — the tutorial island (v0.62). Every new life (first
// one in a browser, or with Tutorial ON) wakes up here. One tutor per
// station; the ferry at the end of the pier goes to Foopville, one way.
// Tutors, steps and texts: data/tutorial.js. No links: you leave by ferry.
//
// MAP KEY (like the Docks, data/region_docks.js):
//   #  tree (can't walk)   .  grass   =  path   r  rock (can't walk)
//   ~  water (can't walk)  b  pier planks      C  the campfire (walk into it to cook)
//   F  fishing water by the pond (can't walk; stand next to it)
// The farm patch, sawhorse and training dummy sit on squares set in data/tutorial.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.isle = {
  id: 'isle', name: 'Orientation Isle',
  tileSize: 40,
  map: [
        '########################################',
        '####.....###...#.##.......####...#..####',
        '##...................................###',
        '#...................=..................#',
        '#..........====================........#',
        '#...~~~~...=........=..............r...#',
        '#..~~~~~F..=........=..................#',
        '#..~~~~~~..=........=..................#',
        '#..~~~~~F..=........=======C===........#',
        '#...~F~~...=........=.........=.......##',
        '##.........=........=.........=.......##',
        '##.........=........=.........=........#',
        '##.........==========.........=........#',
        '#...r...............=.........=........#',
        '#...................=..................#',
        '#...................=======............#',
        '##..................=...rrr..rrr.....###',
        '##.......r..........=...r......r.......#',
        '#.............r.....=...r......r..r....#',
        '~~..................=...rrrrrrrr......~~',
        '~~~~~~.............bb.............~~~~~~',
        '~~~~~~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~bbbbbb~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  fish: { F: 'isle' },          // map letter → fishing spot (data/fishing.js)
  npcs: [], objects: [],        // the tutors are drawn by WorldTutorial.js (data/tutorial.js tutors)
  landmarks: [],
  sand: { rows: [18, 20] },     // beach rows by the sea
  trees: { tree_round: 4, tree_birch: 3, tree_pine: 2 },
  decorations: { deco_flowers: 0.08, deco_tuft: 0.04, deco_shroom: 0.005, deco_stump: 0.005, bush: 0.015 },
  ground: { ...FUP.look.mood('docks'), treeShade: 0.85, waterChars: '~F' },
  light: null, weather: 'sunbeams', fog: null,
  sea: true,
  enemyTypes: {}, enemiesPerRun: 0, ingredientsPerRun: 0, level: 0, mult: 1, coinMult: 1,
};
