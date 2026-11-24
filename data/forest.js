// ============================================================
// FOREST — the three Forest areas you walk, and everything you can tweak.
// Blueprint 18.6. A trip goes: Foopville gate → Forest Edge → Goblin Toll
// Road → Deep Woods. Each area is a maze with its own look, enemies,
// ingredients and a campfire. Somewhere in the Deep Woods is a hidden hole:
// the Guardian is at the bottom. Walk into an exit to change area.
//
// MAP KEY (each character is one square):
//   #  tree (can't walk through)     .  grass       =  dirt path
//   ~  water (can't walk through)    r  rock (can't walk through)
//   ,  shallow ford (you CAN walk through it: the Toll Road's secret crossing)
//   b  bridge planks (walkable)      B  bridge, where the Toll goblin always stands
//   <  exit back (Forest Edge: back to Foopville)   >  exit to the next area
//   C  the campfire (cook, rest once, change gear, head home)
//   i  a spot where an ingredient MIGHT appear (shuffled each trip)
//   e  a spot where an enemy MIGHT appear (shuffled each trip)
//   H  a possible hole spot (Deep Woods). Each trip ONE of them is the real hole.
//   S  a side-room slot. Not used yet: side rooms come in step 5.
// Every row must be 48 squares long, and there must be 26 rows.
// Keep every letter reachable. Check with: tests/forest_maps.js
// DRAFT mazes (blueprint 18.6): Jesus walks them, then sketches revisions.
//
// LOOK (per area):
//   trees        which tree pictures, and how often (weights)
//   decorations  little things on the grass (chance per grass square)
//   shoreDeco    a picture for grass squares next to water (and its chance)
//   landmarks    fixed pictures on fixed squares: [picture, column, row]
//   ground       floor colours (see the shared ones further down)
//   light        a colour laid over the whole screen. blend 'ADD' = brighter, 'MULTIPLY' = darker/tinted
//   weather      'sunbeams', 'leaves' or 'fireflies'
//   fog          sight = squares you can see around you; memory = how dark squares you've
//                already seen stay (0 = clear, 1 = black); campfire = squares a campfire lights up
// ============================================================
window.FUP = window.FUP || {};

FUP.forestData = {
  tileSize: 40,          // pixels per square

  areas: [
    // ---------- Area 1: sunny birch wood, the gentle warm-up ----------
    {
      id: 'edge', fish: { '~': 'edgePond' }, name: 'Forest Edge',
      enemiesPerRun: 5,      // enemy spots used per trip (of 10 "e" on the map)
      ingredientsPerRun: 8,  // ingredient spots used per trip (of 16 "i")
      enemyTypes: { squirrel: 3, hedgehog: 1 },   // squirrels, and since v0.93 the odd Grumpy Hedgehog (Jesus)
      forageOdds: { Common: 0.75, Uncommon: 0.22, Rare: 0.03 },
      mult: 1.0,             // enemy HP / ATK / DEF and their XP are multiplied by this
      coinMult: 1.0,         // ...and their coins by this (v0.40: deeper = better money)
      level: 3,              // the Melee level this area is meant for: enemies scale up if you're above it (v0.41)
      trees: { tree_birch: 5, tree_round: 3, tree_pine: 2 },
      decorations: { deco_flowers: 0.16, deco_shroom: 0.01, deco_stump: 0.01, bush: 0.03 },
      landmarks: [['deco_stump', 28, 16], ['deco_stump', 32, 16], ['deco_stump', 28, 20], ['deco_stump', 32, 20]],
      // Lore objects (E4, Jesus 2026-11-19): walk up and Read / Look. Spots are PLACEHOLDERS.
      // kind 'sign' like the Marsh's: sprite (or emoji), label, text; hidden = no picture; solid = you walk around it
      objects: [
        { kind: 'sign', tx: 2, ty: 18, sprite: 'deco_signpost', text: 'FOOPVILLE → (probably). The arrow\'s paint is much newer than the board it\'s nailed to.' },
        { kind: 'sign', tx: 30, ty: 18, hidden: true, label: 'Look', text: 'Five stumps in a neat ring, all cut level at once. Someone sat here to talk about something. Nobody sits here now.' },
      ],
      ground: { ...FUP.look.mood('forestEdge'), treeShade: 0.78 },   // colours: data/look.js
      light: FUP.look.mood('forestEdge').light,
      weather: 'sunbeams',
      fog: { sight: 5, memory: 0.45, campfire: 7 },
      map: [
        '################################################',
        '#.............i...#.S.....i......#...........###',
        '#i................#..............#...........###',
        '##########..#..#..##########..#..#..#######..###',
        '#e......S#..#e.#......e....#..#..#.............>',
        '#........#..#..#...........#..#..#...........###',
        '#..#..####..#..##########..#..#..#..C..#..######',
        '#e....#.....#........#..#...e.#..#.....#.....###',
        '#.....#.....#........#i.#.....#..#.....#.....###',
        '#..#..#..##########..#..#######..####..####..###',
        '#..#.....#...........#.i.e.....e.#..#.....#..###',
        '#..#.....#...........#...........#i.#...i.#..###',
        '#..#######..##########..#..#..#..#..#..####..###',
        '#.....#.i...#..........i#..#.....#...e.#.i...###',
        '#.....#.....#.~~~.......#..#.....#.....#.....###',
        '#..#..#..####.~~~.####..#..#############..######',
        '#.....#.i#.i..~~~....#..#........#.....#.i...###',
        '#.....#..#...........#..#....r...#.....#.....###',
        '#..#..#..#..####..#..#..####.....#..#..#..#..###',
        '<..#.i...#..#..#...e....#......r....#..#..#..###',
        '#..#.....#..#i.#........#...........#..#i.#..###',
        '#..#..#..#..#..#..#######..#..####..#..####..###',
        '#......e.#.....#...........#.................###',
        '#........#.....#...........#.................###',
        '################################################',
        '################################################',
      ],
    },
    // ---------- Area 2: autumn, mud, a river and one rickety bridge ----------
    {
      id: 'tollroad', fish: { '~': 'tollRiver' }, name: 'Goblin Toll Road',
      enemiesPerRun: 6,      // of 12
      ingredientsPerRun: 8,  // of 16
      enemyTypes: { squirrel: 4, goblin: 3, pigeon: 2, debtRunner: 2 },   // weights (PLACEHOLDER mix; v0.93 + Debt Runner)
      flock: { min: 2, max: 2 },             // pigeons per fight here: "the odd pair"
      forageOdds: { Common: 0.60, Uncommon: 0.30, Rare: 0.10 },
      mult: 1.15,
      coinMult: 1.4,
      level: 7,
      trees: { tree_autumn: 4, tree_autumn_red: 3, tree_dead: 3 },
      decorations: { deco_leaves: 0.14, deco_puddle: 0.07, deco_log: 0.012, deco_stump: 0.01 },
      shoreDeco: ['deco_reeds', 0.55],
      landmarks: [['deco_fence', 8, 11], ['deco_fence', 14, 11], ['deco_fence', 26, 11], ['deco_fence', 32, 11]],
      objects: [   // lore (E4). Spots are PLACEHOLDERS
        { kind: 'sign', tx: 22, ty: 11, text: 'TOLL: 4 COINS. ALWAYS HAS BEEN. The 4 is painted over a 3, over a 2, over something scratched out.' },
        { kind: 'sign', tx: 2, ty: 5, emoji: '🪨', label: 'Look', solid: true, text: 'A stone milestone. One face is worn smooth. The other says FOOPVILLE in fresh chalk.' },
        { kind: 'sign', tx: 21, ty: 16, text: 'NOTICE: Complaints must be filed in person, in triplicate. The filing fee is 4 coins.' },
      ],
      ground: { ...FUP.look.mood('tollRoad'), treeShade: 0.75 },     // colours: data/look.js
      light: FUP.look.mood('tollRoad').light,
      weather: 'leaves',
      fog: { sight: 5, memory: 0.5, campfire: 7 },
      map: [
        '################################################',
        '#.....#e...S#.......i...#.....#......e..e....###',
        '#i....#.....#...........#.....#i.............###',
        '####..#..####..####..#..#..#..####..#..#..#..###',
        '<.....#.......i...#.......i#...e.#...e....#..###',
        '#.....#...........#........#.....#........#..###',
        '#..#############..#..#..#######..#######..#..###',
        '#........#.....#.....#..#........#.....#..#..###',
        '#........#.....#.....#..#........#.....#..#..###',
        '#######..#..#..#..####..#..#######..#..#..#..###',
        '#.S....e....#.....#.S..........e....#e....#..###',
        '#...........#.....#.................#.....#i.###',
        '#~~~,~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~~~~~~~~#',
        '#~~~,~~~~~~~~~~~~~~Bb~~~~~~~~~~~~~~~~~~~~~~~~~~#',
        '#~~~,~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~~~~~~~~#',
        '#~~~,~~~~~~~~~~~~~~bb~~~~~~~~~~~~~~~~~~~~~~~~~~#',
        '#.......i.....i...#..........i#..............###',
        '#.................#i..........#..............###',
        '#..#############..####..####..#..####..C..#..###',
        '#.i............#.....#e.#..#e.#...........#....>',
        '#..............#.....#..#i.#..#...........#..###',
        '#..####..#..#..####..#..#..#..#######..#..#..###',
        '#.i...#e....#....i......#.........e.......#..###',
        '#...i.#.....#...........#.................#i.###',
        '################################################',
        '################################################',
      ],
    },
    // ---------- Area 3: dark, huge old trees, glowing mushrooms. The hole is here ----------
    {
      id: 'deepwoods', fish: { '~': 'darkPool' }, name: 'Deep Woods',
      enemiesPerRun: 8,      // of 15
      ingredientsPerRun: 10, // of 20
      enemyTypes: { squirrel: 2, goblin: 2, pigeon: 4, mossBear: 2 },   // weights (PLACEHOLDER mix; v0.93 + Moss Bear)
      flock: { min: 2, max: 3 },             // pigeons per fight here
      godfather: true,                       // the revenge rule puts the Pigeon Godfather here
      forageOdds: { Common: 0.45, Uncommon: 0.35, Rare: 0.20 },
      mult: 1.3,
      coinMult: 1.9,
      level: 11,
      trees: { tree_dark: 5, tree_spruce_dark: 4, tree_dead: 1 },
      decorations: { deco_glowshroom: 0.05, deco_fern: 0.12, deco_shroom: 0.03, deco_log: 0.02, deco_stump: 0.01, deco_oldsign: 0.006 },
      landmarks: [['deco_glowshroom', 35, 17], ['deco_glowshroom', 37, 17], ['deco_glowshroom', 35, 19], ['deco_glowshroom', 37, 19],
        ['deco_oldsign', 14, 1], ['deco_oldsign', 31, 13], ['deco_oldsign', 20, 22]],
      objects: [   // lore (E4). Spots are PLACEHOLDERS
        { kind: 'sign', tx: 15, ty: 1, sprite: 'ruin_crushed', emoji: '🏚️', label: 'Look', solid: true, scale: 0.35, text: 'A shack folded flat, like something sat on it. A sign in the rubble, in letters nobody in Foopville uses.' },
        { kind: 'sign', tx: 33, ty: 13, sprite: 'tree_dead', emoji: '🪵', label: 'Look', solid: true, text: 'Scorch marks ring this trunk higher than any campfire could reach. The bark grew back around them. It took a long time.' },
        { kind: 'sign', tx: 6, ty: 19, emoji: '🪜', label: 'Look', text: 'Stone steps that start in the dirt and climb into nothing. Whoever built them knew where they were going. You don\'t.' },
      ],
      ground: { ...FUP.look.mood('deepWoods'), treeShade: 0.5 },     // colours: data/look.js
      light: FUP.look.mood('deepWoods').light,
      weather: 'fireflies',
      fog: { sight: 4.5, memory: 0.7, campfire: 7 },
      map: [
        '################..##############################',   // v1.10: the road north to Three Scales (cols 16-17)
        '#....i...#..............#.....#.....#........###',
        '#.H......#..............#.....#.H...#........###',
        '#######..#..#######..#..#..#..####..#..####..###',
        '#e.......#.....#.....#.i#e...i......#..#.i..i###',
        '#........#...i.#.....#..#...........#..#.....###',
        '#..#######..####..####..#..##########..#..######',
        '#........#..#e...i#e.......#..........i#.....###',
        '#........#i.#.....#........#...........#.....###',
        '#######..####..####..#..C..#..#############..###',
        '#...........#..#....i......#.....#..#......e.~~#',
        '#...........#..#.H.........#.....#i.#........~~#',
        '#..#..####..#..#######..#..####..#..#..#########',
        '#.S#...e.#e.#......e.#e....#........#e..e....###',
        '#..#.....#..#........#.....#........#........###',
        '#######..#..#..####..#######..##########..#..###',
        '#........#..#e....#.i........i#........#..#e.###',
        '#........#..#...i.#...........#........#.H#..###',
        '#..#######..#######..##########..#.....####..###',
        '<........#.......i#.....#......e.#.....#.....###',
        '#........#........#....H#........#.....#.....###',
        '#..####..#######..#######..#######..#..#..#..###',
        '#.i...#e...i...............#.S........i...#..###',
        '#...i.#....................#..............#i.###',
        '################################################',
        '################################################',
      ],
    },
  ],

  // --- Movement (pixels per second) ---
  playerSpeed: 190,
  enemyWanderSpeed: 45,
  enemyChaseSpeed: 105,  // slower than you, so you can outrun them if you're careful
  enemyChaseRange: 4,    // squares: closer than this and it comes for you
  hintRange: 6,          // squares: a first-time hint (napping, hidden, runner...) shows when one is this close (v0.95)
  enemyLeashRange: 7,    // squares from home before it gives up and wanders back
  touchDistance: 26,     // pixels: this close to an enemy = fight

  // --- How fights start (v0.94, Jesus approved 2026-11-18). Not every enemy chases you. ---
  // types: enemy -> the share of that enemy that does this (1 = all of them). Every region uses these.
  // Numbers are PLACEHOLDERS.
  encounters: {
    // Napping (💤): doesn't move. Touch it asleep = sneak attack (free hit, its turn bar starts empty).
    // Each second you're within wakeRange squares it may wake (wakePerSecond), then it chases as usual.
    sleep:  { types: { hedgehog: 1, mossBear: 1, squirrel: 0.33 }, wakeRange: 3, wakePerSecond: 0.35 },
    // Hidden (only a ripple / rustling bush shows). Step within triggerRange squares and it jumps out:
    // enemies start with full turn bars and you can't flee on turn 1.
    ambush: { types: { redTapeEel: 1, leechLawyer: 0.33 }, triggerRange: 1.3 },
    // Runs from you once you're within fleeRange squares. Catch him in escapeSeconds: he starts stunned
    // and drops coinMult x coins. Too slow: gone for this trip.
    runner: { types: { debtRunner: 1 }, fleeRange: 4, fleeSpeed: 150, escapeSeconds: 8, coinMult: 2 },
    // Stops you to talk first (the Paralegal Newt's waiver): sign (pay signShare of your coins), Rizz, or refuse.
    talk:   { types: { paralegalNewt: 1 }, signShare: 0.10, rizzXp: 15 },
  },
  fleeGraceSeconds: 2.5, // after running away, enemies can't start a fight for this long
  // arriveGraceSeconds moved to data/world.js (v0.52)

  // --- How the ground is painted (src/forestGround.js) ---
  // Each map square is painted as 20x20 chunky pixels (shown at 2x).
  // Each area swaps any of these colours with its own `ground` (above).
  ground: {
    pixelsPerSquare: 20,
    // Fallback colours (each area overrides most of them via data/look.js moods)
    ...FUP.look.mood('village'),
    treeShade: 0.7,        // grass right next to trees is this much darker
    edgeWobble: 0.35,      // how wiggly path and pond edges are (0 = blocky squares)
    pathChars: '=<>',      // map letters painted as dirt path
    waterChars: '~,bB',    // map letters painted as water (the ford looks like water: it's hidden; planks go on top of b/B)
  },
  lilyPadChance: 0.3,      // per water square

  // --- Moss Goblin Tax Collector's toll (blueprint 18.2) ---
  toll: {
    // He asks for this share of the coins you carry. Better Rizz = smaller toll (blueprint 18.8).
    payByRizz: [{ level: 1, pay: 0.20 }, { level: 15, pay: 0.15 }, { level: 30, pay: 0.10 }, { level: 46, pay: 0 }],   // 46 = Living Legend (v0.38)
    haggledShare: 0.5,   // a good Rizz talks it down to half of that
    haggleRizzXp: 15,    // Rizz XP for a good haggle (v0.78: 45 -> 15, Jesus: Rizz too fast; PLACEHOLDER)
    bridgeTouch: 52,     // pixels: the bridge goblin blocks both plank columns
  },
  // --- Revenge rule (blueprint 18.2): kill this many pigeons within revengeSeconds of play and the Godfather comes ---
  revengeKills: 5,
  revengeSeconds: 600,   // 10 min (E1b, Jesus 2026-11-19; was "in one trip"). He then stays until beaten.
  godfatherTouch: 40,    // pixels: he blocks the trail

  restHealPercent: 0.30, // Rest heals 30% of max HP; then that campfire waits (data/world.js respawn.rest, E1a)
  holeTouch: 24,         // pixels: this close to the real hole = "Climb down?"
};
