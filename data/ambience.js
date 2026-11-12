// ============================================================
// AMBIENCE — what makes a map feel alive (v0.63). src/ambience.js reads this.
// Every outdoor map (the village, every World region, the Raid) gets:
//   dressing   extra plants, bushes and rocks on empty grass, in natural clumps
//   wind       grass, flowers, bushes and trees sway; gusts roll across the map
//   critters   little animals with their own habits (chickens peck, rabbits run off)
//   butterflies, birds overhead (with shadows), fireflies at dusk, drifting motes
//   clouds     slow cloud shadows sliding over the ground
//   light      the day clock tints the map (dawn, day, dusk, night); lamps, windows,
//              campfires and glowing mushrooms light up as it gets dark
//   smoke      chimneys puff; the forge puffs more
//   shadows    a soft shadow under you, villagers, enemies and critters; dust when you walk
// Colours are palette keys (data/look.js). Pixel art below: one letter = one pixel,
// '.' = see-through, letters → palette in `pix`. 'c' = a colour picked per critter.
// ============================================================
window.FUP = window.FUP || {};

FUP.ambienceData = {
  pixelScale: 2,          // 1 art pixel = 2 screen pixels (like the map)
  pix: {
    k: 'k0', K: 'k1', w: 'k4', g: 's2', G: 's3', s: 's1', y: 'y1', Y: 'y2', r: 'r2', R: 'r3',
    b: 'w3', B: 'w2', d: 'w4', e: 'w5', n: 'g3', N: 'g4', m: 'g5', u: 'b3', U: 'b4', o: 'x', p: 'p2', t: 't', h: 'g2', H: 'g1',
  },

  // ---------- Pixel art: name → frames ----------
  art: {
    chicken: [
      ['.....RR...', '....kwwk..', '....wwkwY.', '.k..wwwwk.', 'kwk.wwwwk.', 'kwwwwwwwk.', '.kwwwwwk..', '..kkkkk...', '...y..y...'],
      ['.....RR...', '....kwwk..', '....wwkwY.', '.k..wwwwk.', 'kwk.wwwwk.', 'kwwwwwwwk.', '.kwwwwwk..', '..kkkkk...', '....yy....'],
      ['..........', '..........', '.k........', 'kwk.wwww..', 'kwwwwwwwk.', 'kwwwwwwwwR', '.kwwwwwkwY', '..kkkkk...', '...y..y...'],
    ],
    duck: [
      ['......kk..', '.....kNNk.', '.....NkNYY', '.k...kwwk.', 'kdk.kddddk', 'kdddddddk.', '.UUUUUUUU.'],
      ['......kk..', '.....kNNk.', '.....NkNYY', '.k...kwwk.', 'kdk.kddddk', 'kdddddddk.', 'U.UUUUUU.U'],
      ['..........', '..........', '..........', '.k........', 'kdk.......', 'kdddddddkk', '.UUUUUUUU.'],
    ],
    rabbit: [
      ['.....k.k.', '....kekek', '....kekek', '...kdeeek', '..kddekek', '.kddddddk', 'kwddddddk', '.kkdkkdk.'],
      ['.........', '......kk.', '.....keek', '...kdeeek', '.kddddeke', 'kwddddddk', '.kdk..kdk', '.........'],
      ['.........', '.....k.k.', '....kekek', '...kdeeek', '..kddekek', '.kddddddk', 'kwdddddkY', '.kkdkkdk.'],
    ],
    cat: [
      ['..k.k......', '.kgkgk.....', '.kgggkkkkk.', 'kgkgggggggk', 'kggggggggGk', '.kkkkkkkkk.'],
    ],
    frog: [
      ['.k...k.', 'kYk.kYk', 'knnnnnk', 'kNnnnNk', '.kk.kk.'],
      ['.k...k.', 'kYk.kYk', 'knnnnnk', 'knNnNnk', 'k.....k'],
    ],
    crab: [
      ['.k.....k.', 'kRk.k.kRk', '.kRkkkRk.', '..kRRRk..', '.k.k.k.k.'],
      ['.k.....k.', 'kRk.k.kRk', '.kRkkkRk.', '..kRRRk..', 'k.k...k.k'],
    ],
    butterfly: [
      ['cc.cc', 'cckcc', '.ckc.', '..k..'],
      ['.c.c.', '.ckc.', '..k..', '..k..'],
    ],
    bird: [
      ['c.....c', '.c...c.', '..ccc..'],
      ['.......', '..ccc..', '.c...c.'],
    ],
    dragonfly: [
      ['.U.U...', 'tuuuuuk', '.U.U...'],
      ['U...U..', 'tuuuuuk', 'U...U..'],
    ],
    fish: [
      ['.GGk.', 'GGGGG', '.G.G.'],
    ],
    // Plants and stones for the scenery (amb_<name> in the `dressing` lists)
    tallgrass: [['....m....', '.m..N..m.', '.N.mN.NN.', '.NNnN.Nn.', 'nNnNnNnN.', 'nnNnnNnnn', 'hnhnhnnhn', '.hhhhhhh.']],
    flower: [['.c.....', 'cYc..c.', '.c..cYc', '.n...c.', '.n.c.n.', 'hncYcn.', '.hnchh.']],
    daisy: [['.w....w..', 'wYw..wYw.', '.w..w.w..', '...wYw...', '....w....']],
    bush: [['....HHHH....', '..HHnNnnHH..', '.HnNNnnhhhH.', 'HnNnnhhhhhhH', 'HnnhhhhhhhhH', 'HnhhhhhHhhHH', 'HhhhhHhhHHHH', '.HhhHhhHHHH.', '..HHHHHHHH..', '....HHHH....']],
    berrybush: [['....HHHH....', '..HHnNnnHH..', '.HnNNnchhhH.', 'HnNchhhhchhH', 'HnnhhhchhhhH', 'HnchhhhHhcHH', 'HhhhcHhhHHHH', '.HhhHhcHHHH.', '..HHHHHHHH..', '....HHHH....']],
    rock: [['..kkkkk..', '.kGGGGgk.', 'kGGGggggk', 'kGgggggsk', 'kgggssssk', '.kkkkkkk.']],
    toadstool: [['.rRr.', 'rRwRr', 'rrRrr', '.kek.', '.kek.', '..k..']],
    pebbles: [['.Gg..G.', 'Gggs.gs', '.ss....']],
    bigbush: [['.....HHHHHH.....', '...HHnNNnnnHH...', '..HnNmNnnnhhhH..', '.HnNmNnnnhhhhhH.', 'HnNNnnnnhhhhhhhH', 'HnnnnnhhhhhhHhhH', 'HnnhhhhhhhHhhhhH', 'HhnhhhhhHhhhHhHH', '.HhhhHhhhhHHhHH.', '..HHhhhHHhHHHH..', '...HHHHHHHHHH...', '.....HHHHHH.....']],
    flowerpatch: [['.p.....w.....', 'pYp...wYw..U.', '.p.R...w..UYU', '.nRYR.n.w..U.', 'hn.R.hnwYw.n.', '.hn.n..hw.hn.', '..hhnhh.hhh..']],
  },

  // ---------- How each critter behaves ----------
  //   move: wander (walk, stop, do its thing) · hop (jumps) · swim (water only) · sleep · scuttle (sideways)
  //   on: map letters it may stand on · speed px/s · radius: squares from home · idle: [min, max] seconds
  //   flee: runs from you inside this many pixels (0 = doesn't care) · act: frame it shows while idle
  //   colors: random 'c' colour (butterflies, birds)
  critters: {
    chicken: { move: 'wander', on: '.=P', speed: 26, radius: 3, idle: [1, 3.5], act: 2, flee: 60, fleeSpeed: 85, shadow: 8 },
    duck:    { move: 'swim', on: '~', speed: 12, radius: 5, idle: [2, 5], act: 2, flee: 0, shadow: 0 },
    rabbit:  { move: 'hop', on: '.', speed: 60, radius: 4, idle: [1.5, 4], act: 2, flee: 110, fleeSpeed: 150, shadow: 7 },
    cat:     { move: 'sleep', on: '.=', shadow: 9 },
    frog:    { move: 'hop', on: '.', speed: 45, radius: 2, idle: [2, 6], act: 0, flee: 70, fleeSpeed: 120, shadow: 5 },
    crab:    { move: 'scuttle', on: '.=', speed: 22, radius: 3, idle: [1, 3], act: 0, flee: 80, fleeSpeed: 70, shadow: 7 },
  },

  // ---------- Per place (village, or a region id) ----------
  //   critters: { id, n, near: letters it lives beside, within: squares, rows: [from, to] }
  //   butterflies / dragonflies / motes: how many near the camera · birds: flocks fly over
  //   fireflies: 'night' (dusk + night) or 'always' · clouds: cloud shadows
  //   dayNight: how strongly the day clock tints this place (0 = not at all, e.g. underground)
  //   vignette: dark screen corners (0-1)
  //   dress: extra scenery (see `dressing` below), by kind of square. Build zones (your plot, the farm)
//          only get flat things (flowers, grass), so whatever you build sits on top
  places: {
    village: {
      critters: [{ id: 'chicken', n: 6, near: 'pABCDEFHJh', within: 3 }, { id: 'duck', n: 3 }, { id: 'cat', n: 2, near: 'b', within: 1 }],
      butterflies: 7, dragonflies: 2, birds: true, motes: 10, fireflies: 'night', clouds: true, dayNight: 1, vignette: 0.45,
      dress: 'meadow',
    },
    edge: {
      critters: [{ id: 'rabbit', n: 5 }, { id: 'frog', n: 2, near: '~', within: 1 }],
      butterflies: 8, dragonflies: 2, birds: true, motes: 14, fireflies: 'night', clouds: true, dayNight: 1, vignette: 0.45,
      dress: 'woodland',
    },
    tollroad: {
      critters: [{ id: 'rabbit', n: 3 }],
      butterflies: 2, birds: true, motes: 6, fireflies: 'night', clouds: true, dayNight: 0.85, vignette: 0.5,
      dress: 'autumn',
    },
    deepwoods: {
      critters: [{ id: 'frog', n: 4, near: '~', within: 2 }],
      butterflies: 0, birds: false, motes: 16, fireflies: 'night', clouds: false, dayNight: 0.45, vignette: 0.6,
      dress: 'deep',
    },
    marsh: {
      critters: [{ id: 'frog', n: 9, near: '~F', within: 2 }, { id: 'duck', n: 2 }],
      butterflies: 1, dragonflies: 6, birds: false, motes: 10, fireflies: 'night', clouds: true, dayNight: 0.7, vignette: 0.55,
      dress: 'bog',
    },
    docks: {
      critters: [{ id: 'crab', n: 5, rows: [9, 11] }, { id: 'chicken', n: 2, near: 'k', within: 3 }],
      butterflies: 3, birds: 'gulls', motes: 6, fireflies: 'night', clouds: true, dayNight: 1, vignette: 0.4,
      dress: 'coast',
    },
    isle: {
      critters: [{ id: 'crab', n: 3, near: '~F', within: 1 }, { id: 'rabbit', n: 2 }],
      butterflies: 5, birds: 'gulls', motes: 6, fireflies: 'night', clouds: true, dayNight: 1, vignette: 0.4,
      dress: 'coast',
    },
    raid: {
      critters: [], butterflies: 0, birds: false, motes: 18, moteColor: 'g5', fireflies: false, clouds: false, dayNight: 0, vignette: 0.7,
      dress: null,
    },
  },
  fallback: 'edge',     // a region with no entry above uses this one

  birdColors: { birds: ['k1', 'k2'], gulls: ['k4', 'k4', 's3'] },
  butterflyColors: ['k4', 'y2', 'p2', 'b4', 'r3'],
  // Art with a 'c' pixel comes in these colours (butterflies use butterflyColors, birds birdColors)
  artColors: { flower: ['k4', 'p2', 'b4', 'r3', 'y2'], berrybush: ['r3', 'p2', 'b4'] },
  birdEvery: [9, 22],        // seconds between flocks
  birdFlock: [2, 5],
  birdSpeed: 95,
  birdShadow: { dx: 40, dy: 110, alpha: 0.22 },

  // ---------- Extra scenery ----------
  // Only on plain grass ('.') with nothing interesting next to it, away from anything you can use.
  // A slow "clump" noise decides where things gather, so you get thick patches and open lawns.
  //   clump: noise size in squares · open / treeEdge / waterEdge / pathEdge: chance per square there
  //   pick lists: [picture, weight]. deco_* / bush / rock = Blender sprites (assets/sprites);
//   amb_* = the pixel art in `art` above (drawn when the game starts).
  dressing: {
    meadow: {
      clump: 7, open: 0.8, treeEdge: 0.95, waterEdge: 0.9, pathEdge: 0.5, perSquare: [2, 4],
      open_pick: [['amb_tallgrass', 6], ['amb_flower', 3], ['amb_flowerpatch', 1.5], ['amb_daisy', 2], ['amb_bush', 1], ['amb_bigbush', 0.5], ['amb_pebbles', 0.7], ['amb_rock', 0.35]],
      treeEdge_pick: [['amb_bigbush', 2], ['amb_bush', 3], ['deco_fern', 3], ['amb_tallgrass', 2], ['amb_berrybush', 1.2], ['amb_toadstool', 0.8], ['deco_stump', 0.3]],
      waterEdge_pick: [['deco_reeds', 5], ['amb_tallgrass', 2], ['amb_daisy', 1]],
      pathEdge_pick: [['amb_flower', 2], ['amb_daisy', 2], ['amb_tallgrass', 2], ['amb_pebbles', 1]],
    },
    woodland: {
      clump: 6, open: 0.8, treeEdge: 0.95, waterEdge: 0.9, pathEdge: 0.5, perSquare: [2, 4],
      open_pick: [['amb_tallgrass', 6], ['amb_flower', 3], ['amb_flowerpatch', 1.2], ['amb_daisy', 1.5], ['deco_fern', 2], ['amb_bush', 1], ['amb_bigbush', 0.5], ['amb_berrybush', 0.5], ['amb_rock', 0.4], ['amb_toadstool', 0.5]],
      treeEdge_pick: [['deco_fern', 4], ['amb_bush', 3], ['amb_bigbush', 1.5], ['amb_toadstool', 1.5], ['amb_berrybush', 1], ['deco_stump', 0.5], ['deco_log', 0.3], ['amb_tallgrass', 2]],
      waterEdge_pick: [['deco_reeds', 5], ['amb_tallgrass', 2], ['deco_fern', 1]],
      pathEdge_pick: [['amb_tallgrass', 3], ['amb_flower', 2], ['amb_pebbles', 1]],
    },
    autumn: {
      clump: 6, open: 0.7, treeEdge: 0.95, waterEdge: 0.7, pathEdge: 0.4, perSquare: [1, 3],
      open_pick: [['deco_leaves', 5], ['amb_tallgrass', 2], ['amb_bush', 1], ['amb_rock', 0.6], ['amb_toadstool', 0.8], ['amb_pebbles', 0.8]],
      treeEdge_pick: [['deco_leaves', 3], ['amb_bush', 2], ['amb_toadstool', 1.5], ['deco_stump', 0.6], ['deco_fern', 1]],
      waterEdge_pick: [['deco_reeds', 3], ['deco_leaves', 2]],
      pathEdge_pick: [['deco_leaves', 3], ['amb_pebbles', 1]],
    },
    deep: {
      clump: 5, open: 0.75, treeEdge: 0.95, waterEdge: 0.85, pathEdge: 0.4, perSquare: [2, 4],
      open_pick: [['deco_fern', 5], ['deco_glowshroom', 1.4], ['amb_toadstool', 1.2], ['deco_shroom', 1], ['amb_rock', 0.5], ['amb_tallgrass', 1]],
      treeEdge_pick: [['deco_fern', 5], ['deco_glowshroom', 1.5], ['amb_toadstool', 1.5], ['deco_log', 0.4], ['deco_stump', 0.5]],
      waterEdge_pick: [['deco_reeds', 4], ['deco_glowshroom', 1]],
      pathEdge_pick: [['deco_fern', 2], ['amb_pebbles', 1]],
    },
    bog: {
      clump: 5, open: 0.75, treeEdge: 0.9, waterEdge: 0.95, pathEdge: 0.4, perSquare: [2, 4],
      open_pick: [['amb_tallgrass', 4], ['deco_reeds', 2], ['deco_puddle', 1], ['deco_fern', 1], ['amb_toadstool', 0.4]],
      treeEdge_pick: [['deco_reeds', 4], ['amb_tallgrass', 2], ['deco_fern', 1]],
      waterEdge_pick: [['deco_reeds', 6], ['amb_tallgrass', 1]],
      pathEdge_pick: [['amb_tallgrass', 2], ['deco_reeds', 1]],
    },
    coast: {
      clump: 6, open: 0.65, treeEdge: 0.9, waterEdge: 0.7, pathEdge: 0.4, perSquare: [1, 3],
      open_pick: [['amb_tallgrass', 5], ['amb_daisy', 2], ['amb_flower', 1], ['amb_flowerpatch', 0.6], ['amb_rock', 0.6], ['amb_pebbles', 1], ['amb_bush', 0.6], ['amb_bigbush', 0.3]],
      treeEdge_pick: [['amb_bush', 3], ['deco_fern', 2], ['amb_tallgrass', 2]],
      waterEdge_pick: [['deco_reeds', 2], ['amb_rock', 1], ['amb_pebbles', 1]],
      pathEdge_pick: [['amb_tallgrass', 2], ['amb_pebbles', 1]],
    },
  },
  // Things you walk behind (sorted by how low they stand); the rest lie flat on the ground
  standing: ['amb_bigbush', 'amb_bush', 'amb_berrybush', 'amb_rock', 'amb_toadstool', 'bush', 'rock', 'deco_fern', 'deco_reeds', 'deco_stump', 'deco_log', 'deco_glowshroom'],
  dressScale: [0.75, 1.1],   // random size range for Blender scenery (pixel art stays at pixelScale, flipped for variety)

  // ---------- Wind: degrees each kind leans at most ----------
  wind: {
    sway: { deco_tuft: 7, deco_flowers: 6, deco_fern: 5, deco_reeds: 8, bush: 2, deco_glowshroom: 2, deco_shroom: 1.5, tree: 1.4,
            amb_tallgrass: 8, amb_flower: 7, amb_flowerpatch: 5, amb_daisy: 4, amb_bush: 2, amb_bigbush: 1.5, amb_berrybush: 2 },
    speed: 1.3,             // gentle back-and-forth
    gustEvery: [6, 14],     // seconds between gusts
    gustSpeed: 260,         // px/s a gust rolls across the map
    gustWidth: 260,         // px
    gustLean: 2.2,          // a gust multiplies the lean by up to this
  },

  // ---------- Light through the day (share of the day 0-1, data/clock.js) ----------
  // Each key: when, colour, how strong. The map is tinted between keys smoothly.
  daylight: [
    { at: 0.00, color: 'p2', alpha: 0.30 },   // dawn: pink
    { at: 0.12, color: 'y2', alpha: 0.12 },   // early morning gold
    { at: 0.25, color: 'y2', alpha: 0.00 },   // day
    { at: 0.62, color: 'y2', alpha: 0.00 },
    { at: 0.72, color: 'r3', alpha: 0.30 },   // evening orange
    { at: 0.82, color: 'p1', alpha: 0.5 },   // dusk purple
    { at: 0.88, color: 'b2', alpha: 0.64 },   // night blue
    { at: 0.97, color: 'b2', alpha: 0.64 },
    { at: 1.00, color: 'p2', alpha: 0.30 },
  ],
  // How dark it is (0-1) through the day: lamps, windows and fireflies follow this
  darkness: [[0, 0.6], [0.08, 0], [0.68, 0], [0.8, 0.7], [0.86, 1], [0.97, 1], [1, 0.6]],
  // Places that are gloomy even at noon (lights + fireflies at least this strong)
  gloom: { deepwoods: 0.65, marsh: 0.35, raid: 0.6 },
  lights: {
    lamp:    { color: 'y2', radius: 80, alpha: 0.6 },
    window:  { color: 'y2', radius: 34, alpha: 0.45 },
    fire:    { color: 'r3', radius: 110, alpha: 0.5 },
    glow:    { color: 't', radius: 30, alpha: 0.6 },
    player:  { color: 'y2', radius: 85, alpha: 0.28 },
  },
  // Village buildings: where the lit windows and chimneys are, as shares of the picture (0-1 across, 0-1 up from the bottom)
  buildingBits: {
    vil_forge:   { windows: [[0.30, 0.30]], chimney: [0.72, 0.95], smoke: 'heavy' },
    vil_shop:    { windows: [[0.25, 0.32], [0.75, 0.32]], chimney: [0.78, 0.92] },
    vil_kitchen: { windows: [[0.28, 0.32], [0.72, 0.32]], chimney: [0.25, 0.95], smoke: 'heavy' },
    vil_house:   { windows: [[0.28, 0.32], [0.72, 0.32]], chimney: [0.7, 0.9] },
    vil_barn:    { windows: [[0.5, 0.55]] },
  },
  smoke: { every: 0.9, heavyEvery: 0.45, rise: 46, life: 3.2, color: 'k4', alpha: 0.35 },

  // ---------- Other bits ----------
  clouds: { count: 4, size: [260, 420], speed: [7, 13], alpha: 0.11 },
  motes: { color: 'y2', size: 2, alpha: 0.5, speed: 10 },
  fireflyColor: 'g5',
  fireflies: 18,
  shadow: { color: 'k0', alpha: 0.28 },
  // Sun shadows (v0.65): every standing picture whose name starts with one of `keys` casts its own
  // silhouette onto the ground, away from the sun. Through the day the sun swings across: long shadows
  // to the west at dawn, short ones at noon, long ones to the east at dusk; they fade at night.
  sunShadow: {
    keys: ['tree_', 'vil_', 'bush', 'rock', 'deco_stump', 'deco_log', 'deco_scarecrow', 'deco_haybale', 'deco_signpost', 'deco_rentsign',
           'amb_bush', 'amb_bigbush', 'amb_berrybush', 'amb_rock', 'amb_toadstool', 'raid_desk', 'grave', 'campfire'],
    alpha: 0.36,
    angle: [55, -55],         // degrees: dawn → dusk (0 = straight down the screen)
    length: [0.95, 0.4],      // share of the picture's height: dawn/dusk, noon
    night: 0.85,              // how much they fade at full dark
    every: 0.5,               // seconds between sun updates
  },
  dust: { every: 0.22, color: 'w5', alpha: 0.5, life: 0.45 },
  fishJumpEvery: [3, 8],     // seconds between ripples / jumping fish on water in view
};
