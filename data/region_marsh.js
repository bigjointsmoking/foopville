// ============================================================
// THE SOGGY MARSH — a danger region east of the village (phase W2, Lv 15-22).
// Cross the repaired East Bridge (village east gap) into a foggy maze of reeds and
// bog water: Mosquito Interns, Leech Lawyers and Filing Frogs. One campfire, 4 fishing
// spots (F), and the Bog Notary's office at the east end. Past him (rows 13-14, east edge) the road
// east to the Receiver's town (v1.38: opens by beating the Causeway Serpent, OT-B; was "The Right Form", cut).
//
// MAP KEY (like the Forest, data/forest.js):
//   #  reeds / wall (can't walk)   .  mud   =  path   ~  bog water (can't walk)
//   F  fishing water (can't walk; stand next to it)   C  the campfire
//   i  a spot where an ingredient MIGHT appear   e  a spot where an enemy MIGHT appear
// Squares: tx = column, ty = row, from 0 at the top-left. Map is 48 x 30.
// Check with: tests/world_maps.js
// ============================================================
window.FUP = window.FUP || {};

FUP.worldData.areas.marsh = {
  id: 'marsh', name: 'Soggy Marsh',
  tileSize: 40,
  map: [
    '################################################',
    '#..~i...............i#........#e....#...e....###',
    '#i.#.................#........#.....#........###',
    '#..#..#~~###F..~~##..#..~..#..#..#~##..~..#..###',
    '#...i.......~..~.....#e.#..#...........#.e...###',
    '#..........i~..#...e.~..#..#...........#...e.###',
    '##~~~##..~..#..#..~~#####..#..#..#~##~##..~..###',
    '#.......e#.....#..............~........~.i...###',
    '#........#e....~..........i...#.i......#.....###',
    '#..#F##########~~#~#~##~###~..####..~###..F..###',
    '#.i........e#..........i.e.#........#.....#..###',
    '#...........~..............#........#.....~..###',
    '#..~###~##..~~~#..##########..#..#..~..####..###',
    '=...........#.....#...C.~....i...#..#i.~e.......',
    '=...........#.....#.....~........#e.#..#........',
    '#~~#~##~###~#..~~##..#..#..~#~#~~~#~#..#..######',
    '#..............#.....~.................#..#..###',
    '#.............e#.....~.................#..~..###',
    '#..#..#..#######..#~~#~~##~###~~##..##~#..~..###',
    '#..~..#.e#....i#..#.................#..#...i.###',
    '#..#..#..#.....#..~.......i.........#..~.....###',
    '#..#..~..~..#..#..###~..~##~#######~F..#~##..###',
    '#.....#..#..#..#.....~........#.....#........###',
    '#....i~..~..#..~.....#....e...#i....#........###',
    '#..#..####..#..#..~..#~#~###..#..#..#..#..#..###',
    '#..#.i......#...............e.#..#.....#.....###',
    '#..#........#.................#..~i...i#.....###',
    '################################################',
    '################################################',
    '################################################',
  ],
  level: 18, mult: 1.0, coinMult: 2.4,
  enemiesPerRun: 7, ingredientsPerRun: 9,
  forageOdds: { Common: 0.5, Uncommon: 0.35, Rare: 0.15 },
  forage: ['croakberry', 'mudroot', 'marsh_mint', 'bog_truffle'],        // only these grow here
  enemyTypes: { mosquitoIntern: 3, leechLawyer: 2, filingFrog: 2, paralegalNewt: 2, redTapeEel: 2 },   // v0.93 + newt, eel
  // Who you fight when you touch each one (w = weight)
  groups: {
    mosquitoIntern: [{ w: 1, foes: ['mosquitoIntern', 'mosquitoIntern'] }, { w: 1, foes: ['mosquitoIntern', 'mosquitoIntern', 'mosquitoIntern'] }],
    leechLawyer:    [{ w: 1, foes: ['leechLawyer'] }, { w: 1, foes: ['leechLawyer', 'mosquitoIntern'] }],
    filingFrog:     [{ w: 1, foes: ['leechLawyer', 'filingFrog'] }, { w: 1, foes: ['mosquitoIntern', 'mosquitoIntern', 'filingFrog'] }],
    paralegalNewt:  [{ w: 1, foes: ['leechLawyer', 'paralegalNewt'] }, { w: 1, foes: ['mosquitoIntern', 'mosquitoIntern', 'paralegalNewt'] }],
    redTapeEel:     [{ w: 1, foes: ['redTapeEel'] }, { w: 1, foes: ['redTapeEel', 'mosquitoIntern'] }],
  },
  fish: { F: 'marsh', '~': 'marsh' },   // v0.78: all marsh water
  // The Bog Notary stands outside his office (v0.82; The Old Accounts). His fight: the office below.
  npcs: [{ id: 'notary', tx: 42, ty: 14 }],
  objects: [
    // The Frog and the strongbox (story Phase C): just a thing to find, no quest
    { kind: 'sign', tx: 5, ty: 25, emoji: '🧰', sprite: 'prop_strongbox', label: 'Look', text: 'An old strongbox, lid rusted open, empty. A Filing Frog lives in it now. It files nothing. It just sits there, looking owed.' },
    // The Bog Notary's office (Phase D; v1.38, Jesus: The Right Form is cut, the office is open). Your first fight is free,
    // each rematch after costs 3 Stamped Forms.
    { kind: 'office', tx: 44, ty: 12, boss: 'bogNotary', cost: { stamped_form: 3 }, emoji: '🚪', label: 'Office',
      freeFirst: true,
      freeText: 'The Notary is waiting inside, behind a very large desk. "Come in. Close the door. We\'ll settle this the old way."',
      text: 'OFFICE OF THE BOG NOTARY. Rematches by appointment. Appointments cost three Stamped Forms. Each.' },
    { kind: 'sign', tx: 2, ty: 13, text: 'SOGGY MARSH. Mind the leeches. They bill by the hour.' },
    // The Senior Partner's office (v0.93): his receptionist books you in for 3 Stamped Forms (data/enemies.js seniorPartner)
    { kind: 'office', tx: 44, ty: 25, boss: 'seniorPartner', cost: { stamped_form: 3 }, emoji: '🚪', label: 'Office',
      text: 'LEECH & LEECH, ATTORNEYS. The Senior Partner will see you now. For three Stamped Forms. Each visit.' },
  ],
  trees: { tree_dark: 4, tree_dead: 4, tree_spruce_dark: 2 },
  decorations: { deco_puddle: 0.10, deco_fern: 0.08, deco_glowshroom: 0.02, deco_log: 0.015, deco_stump: 0.01 },
  shoreDeco: ['deco_reeds', 0.6],
  ground: { ...FUP.look.mood('marsh'), treeShade: 0.55, waterChars: '~F' },
  light: FUP.look.mood('marsh').light,
  weather: 'fireflies',
  fog: { sight: 4, memory: 0.55, campfire: 7 },
};
