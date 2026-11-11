// ============================================================
// LOOK — every colour and visual number in the game (VISUAL_PLAN.md).
// Palette "Old Kingdom" (picked by Jesus 2026-11-09): 32 colours, each
// ramp goes dark → light. Everything on screen should come from here.
// ============================================================
window.FUP = window.FUP || {};

FUP.look = {
  palette: {
    // greys / ink: near-black → cream
    k0: '#0f0e0c', k1: '#24211c', k2: '#3e3a32', k3: '#7a7264', k4: '#e6dcc2',
    // greens
    g1: '#1a2614', g2: '#2f4220', g3: '#4e6630', g4: '#7e9a44', g5: '#bcc878',
    // wood / earth
    w1: '#24180e', w2: '#4a3018', w3: '#74502a', w4: '#a47a44', w5: '#d2b07a',
    // stone
    s1: '#48484c', s2: '#76767a', s3: '#aaa8a2',
    // water / sky
    b1: '#141e30', b2: '#283e5a', b3: '#4a6e8e', b4: '#8eb2c4',
    // reds
    r1: '#4a1414', r2: '#8e2a20', r3: '#c85a34',
    // gold
    y1: '#c8962a', y2: '#f0d06a',
    // purple / pink
    p1: '#4e2e5a', p2: '#a46a8e',
    // skin, teal, rust
    sk: '#e0b08a', t: '#2e4e48', x: '#8a4a22',
  },

  // Snap every Blender sprite to the palette when the game starts.
  // (The hero's custom colours are left alone. Phase 3-5 re-render the art properly.)
  snapSprites: true,

  // ---------- Text ----------
  font: '"Pixelify Sans", "Trebuchet MS", sans-serif',
  text: { ink: 'k4', dim: 's3', accent: 'y2', good: 'g5', bad: 'r3', crit: 'y2', info: 'b4', dark: 'k0' },
  textStroke: 'k0',          // outline colour for big titles and floating numbers

  // ---------- Backgrounds behind screens ----------
  screen: { sky: 'k1', canopy: 'g1', ground: 'g2', groundDark: 'g1', shade: 'k0', shadeAlpha: 0.72 },

  // ---------- UI kit: framed boxes that stretch to any size ----------
  // Every frame is: a dark outline (corners notched off), a light bevel on the
  // top/left, a dark bevel on the bottom/right, then the fill.
  // Sizes are in screen pixels. Each style picks palette colours.
  frame: { outline: 3, bevel: 3, notch: true },
  frames: {
    panel:    { fill: 'k2', hi: 'k3', lo: 'k1', out: 'k0' },   // windows and menus
    hud:      { fill: 'k1', hi: 'k2', lo: 'k0', out: 'k0' },   // top / bottom bars on the map
    inset:    { fill: 'k1', hi: 'k0', lo: 'k2', out: 'k0' },   // sunken rows, slots, text boxes
    slot:     { fill: 'k1', hi: 'k0', lo: 'k2', out: 'k0' },
    tooltip:  { fill: 'k0', hi: 'k1', lo: 'k0', out: 'k3' },
    paper:    { fill: 'w5', hi: 'k4', lo: 'w4', out: 'w1' },   // notes, the quest board
    btn:      { fill: 'w2', hi: 'w3', lo: 'w1', out: 'k0' },   // normal button
    btnHover: { fill: 'w3', hi: 'w4', lo: 'w2', out: 'k0' },
    btnDown:  { fill: 'w1', hi: 'w1', lo: 'w2', out: 'k0' },
    hot:      { fill: 'y1', hi: 'y2', lo: 'x',  out: 'k0' },   // the main choice on a screen
    hotHover: { fill: 'y2', hi: 'k4', lo: 'y1', out: 'k0' },
    tab:      { fill: 'k1', hi: 'k2', lo: 'k0', out: 'k0' },
    tabOn:    { fill: 'k2', hi: 'y1', lo: 'k2', out: 'k0' },
  },
  buttonText: { normal: 'k4', hot: 'k0' },
  disabledAlpha: 0.4,
  pressDepth: 2,             // a pressed button's label drops this many pixels

  // Highlight edges (selected slot, "click to remove", hover on a card)
  edges: { select: 'y2', hover: 'y1', danger: 'r3', muted: 'k2' },

  // ---------- Maps (Phase 2) ----------
  map: {
    shadowReach: 0.55,   // squares: how far trees / buildings cast a shadow downward
    lipPixels: 2,        // the dark lip where grass meets the top of a path
    bankPixels: 3,       // the dark bank where land meets the top of water
    ditherStrength: 0.10, // how much grass shades mix at their borders (0 = hard bands)
    cobble: { w: 6, h: 4 },   // stone size in map pixels (1 map pixel = 2 screen pixels)
    bridge: { plank: 'w3', plankLight: 'w4', gap: 'w1', rail: 'k1', nail: 's2', planks: 4 },
  },

  // ---------- Feel ("juice", Phase 3): every effect number ----------
  // The 🗺️ world map panel (src/worldMapUi.js): box size in pixels, colours for each kind of box
  worldMap: { box: { w: 150, h: 64, gap: 14 }, here: 'y2', seen: 'k2', unseen: 'k1', locked: 'r2', line: 's3' },

  feel: {
    transitionMs: 220,          // fade to black between screens (0 = off)
    menuPopMs: 160,             // windows slide up + fade in when they open (0 = off)
    menuPopRise: 14,            // pixels they rise while opening
    hitFlashMs: 70,             // a hit turns the target cream for this long
    hitFlashColor: 'k4',
    squash: 0.14,               // how much a hit target squashes (0 = off)
    knockback: 10,              // pixels a hit target is pushed back
    // Screen shake: [milliseconds, strength]
    shake: { hit: [90, 0.003], crit: [200, 0.009], hurt: [140, 0.005], heavy: [220, 0.01], kill: [120, 0.004], boss: [300, 0.01],
      enraged: [150, 0.004], limit: [300, 0.01], encounter: [200, 0.006], chute: [1800, 0.003], burnt: [200, 0.006], door: [160, 0.006], trap: [150, 0.005], big: [260, 0.012] },
    // Big moments (Refinement Phase 3): a short freeze, a camera punch-in, a big banner across the fight.
    hitStopMs: 90,              // fights freeze this long on crits, heavy hits, counters, guard breaks
    punchZoom: 1.05,            // camera zooms in this much for a moment
    punchMs: 110,
    banner: { size: 40, holdMs: 700, fadeMs: 350 },
    // Damage numbers
    numbers: { size: 28, critSize: 40, popScale: 1.6, popMs: 120, riseMs: 900, rise: 48, spread: 22 },
    // Particle bursts: how many bits, colours, speed. maxLive caps them so phones stay smooth.
    particles: {
      maxLive: 60, size: 4, lifeMs: 420, speed: [40, 110], gravity: 220,
      kinds: {
        hit:    { n: 6,  colors: ['k4', 'y2'] },
        crit:   { n: 12, colors: ['y2', 'y1', 'r3', 'k4'] },
        hurt:   { n: 6,  colors: ['r3', 'r2'] },
        heal:   { n: 8,  colors: ['g5', 'g4', 'k4'], up: true },
        poison: { n: 6,  colors: ['g5', 'p2'], up: true },
        poof:   { n: 14, colors: ['s3', 'k3', 'k4'] },
        coins:  { n: 8,  colors: ['y2', 'y1'] },
        pickup: { n: 8,  colors: ['y2', 'k4'], up: true },
        hoe:    { n: 6,  colors: ['w3', 'w2'] },
        water:  { n: 6,  colors: ['b4', 'b3'] },
        harvest:{ n: 6,  colors: ['g4', 'g5'] },
        plop:   { n: 5,  colors: ['w3', 'w4'] },
      },
    },
  },

  // ---------- Battle backgrounds (layered, back to front) ----------
  // sky = bands top → horizon. far = distant hills. trees = tree pictures in the middle row.
  // ground = bands from the horizon down. front = dark grass tufts along the bottom edge.
  battleBg: {
    edge:      { sky: ['b3', 'b4', 'b4', 'k4'], far: 'g3', farTop: 'g4', trees: ['tree_birch', 'tree_round', 'tree_pine'], ground: ['g4', 'g3', 'g3'], front: 'g2', light: null, clouds: true },
    tollroad:  { sky: ['w4', 'w5', 'w5', 'k4'], far: 'w3', farTop: 'x',  trees: ['tree_autumn', 'tree_autumn_red', 'tree_dead'], ground: ['g3', 'g2', 'w3'], front: 'g1', light: null, clouds: true },
    deepwoods: { sky: ['k0', 'b1', 'b1', 'b2'], far: 'g1', farTop: 't',  trees: ['tree_dark', 'tree_spruce_dark', 'tree_dead'], ground: ['g2', 'g1', 'g1'], front: 'k0', light: { color: 'b3', alpha: 0.25 } },
    boss:      { sky: ['k0', 'p1', 'p1', 'p2'], far: 'k1', farTop: 'p1', trees: ['tree_dead', 'tree_dark'], ground: ['k2', 'k1', 'k1'], front: 'k0', light: null },
    treeAlpha: 1, cloudCount: 3, cloudColor: 'k4', cloudAlpha: 0.35, cloudDriftMs: 40000,
  },

  // ---------- Animation clips (Phase 4) ----------
  // Frames come from the Blender script (<sprite>_<clip>_<n>). fps = frames per second.
  anim: {
    fps: { idle: 4, walk: 8, attack: 12, hurt: 10 },
    loop: { idle: true, walk: true, attack: false, hurt: false },
    randomStart: true,     // groups of the same enemy don't breathe in sync
  },

  // ---------- Title screen ----------
  title: {
    sky: ['k0', 'b1', 'b1', 'p1', 'p1', 'r1', 'r2', 'x', 'y1'],   // top → horizon (dusk)
    stars: 70, starColors: ['k4', 's3', 'b4'],
    moon: { x: 790, y: 92, r: 34, color: 'k4', shade: 's3' },
    mountainsFar: 'b2', mountainsNear: 'k1',
    dragon: { x: 132, y: 300, scale: 2, driftX: 20, driftY: 12, driftMs: 7000 },
    landlord: { x: 700, y: 470, scale: 3, shade: 'p2', alpha: 1 },   // shade = dusk colour laid over him
    treeRow: ['tree_dark', 'tree_spruce_dark', 'tree_dead'],
    ground: { grass: ['g1', 'g2'], path: ['k2', 's1', 's2'], pathEdge: 'k1' },
    lampGlow: 'y2', smoke: 's3', fireflies: 18, fireflyColor: 'y2',
    logo: { y: 118, scale: 2, dropMs: 650, glow: 'y1' },
    quip: { y: 212, everyMs: 5200, fadeMs: 500 },
  },

  // ---------- Bars ----------
  bars: {
    back: 'k0', frame: 'k0', empty: 'k1', shine: 0.28, // shine = top strip brightness
    hp: 'g4', hpLow: 'r3', enemyHp: 'r3', atb: 'b3', atbFull: 'y2', limit: 'y1', xp: 'b4',
  },

  // ---------- Area moods: map ground colours + light (src/forestGround.js paints them) ----------
  // Each list is dark → light. pathStyle: 'cobble' (stones) or 'dirt'.
  // floor = ground under tree walls. foam = edge of water. bank = shadow where land drops into water.
  // detail = chance per grass square of a tuft / flower clump / pebble / fallen leaves.
  moods: {
    village: {
      grass: ['g2', 'g3', 'g3', 'g4'], grassTuft: 'g5', flowers: ['k4', 'y2', 'p2', 'b4'],
      dirt: ['s1', 's2', 's3'], dirtEdge: 'k2', pebble: 's3',            // cobbles
      water: ['b1', 'b2', 'b3'], shore: 'w3', sparkle: 'b4',
      pathStyle: 'cobble', floor: 'g1', foam: 'b4', bank: 'k0',
      detail: { tuft: 0.9, flower: 0.28, pebble: 0.08, leaf: 0 },
    },
    forestEdge: {
      grass: ['g3', 'g3', 'g4', 'g4'], grassTuft: 'g5', flowers: ['k4', 'y2', 'p2', 'b4'],
      dirt: ['w3', 'w4', 'w5'], dirtEdge: 'w2', pebble: 's3',
      water: ['b1', 'b2', 'b3'], shore: 'w3', sparkle: 'b4',
      pathStyle: 'dirt', floor: 'g1', foam: 'b4', bank: 'k0',
      detail: { tuft: 0.95, flower: 0.3, pebble: 0.06, leaf: 0 },
      light: { color: 'y2', alpha: 0.03, blend: 'ADD' },
    },
    docks: {   // the Foopville Docks (v0.54): Forest Edge grass, sand by the sea, no tint
      grass: ['g3', 'g3', 'g4', 'g4'], grassTuft: 'g5', flowers: ['k4', 'y2', 'b4'],
      dirt: ['w3', 'w4', 'w5'], dirtEdge: 'w2', pebble: 's3',
      water: ['b1', 'b2', 'b3'], shore: 'y1', sparkle: 'b4',
      pathStyle: 'dirt', floor: 'g1', foam: 'b4', bank: 'k0',
      detail: { tuft: 0.8, flower: 0.18, pebble: 0.07, leaf: 0 },
      sand: 'y1',
    },
    tollRoad: {
      grass: ['g2', 'g3', 'g3', 'w4'], grassTuft: 'y1', flowers: ['x', 'y1'],
      dirt: ['w1', 'w2', 'w3'], dirtEdge: 'k1', pebble: 's2',
      water: ['b1', 'b2', 'b3'], shore: 'w2', sparkle: 'b4',
      pathStyle: 'dirt', floor: 'g1', foam: 'b4', bank: 'k0',
      detail: { tuft: 0.4, flower: 0.03, pebble: 0.08, leaf: 0.35 },
      light: { color: 'w5', alpha: 0.30, blend: 'MULTIPLY' },
    },
    deepWoods: {
      grass: ['g1', 'g1', 'g2', 'g2'], grassTuft: 't', flowers: ['b4', 'p2'],   // glowy bits
      dirt: ['w1', 'k2', 'w2'], dirtEdge: 'k0', pebble: 'k3',
      water: ['b1', 'b1', 'b2'], shore: 'k2', sparkle: 't',
      pathStyle: 'dirt', floor: 'k0', foam: 't', bank: 'k0',
      detail: { tuft: 0.35, flower: 0.08, pebble: 0.04, leaf: 0.1 },
      light: { color: 'b3', alpha: 0.55, blend: 'MULTIPLY' },
    },
    marsh: {   // the Soggy Marsh (W2): murky greens and browns, foggy
      grass: ['g1', 'g2', 'g2', 'g3'], grassTuft: 'g4', flowers: ['b4', 'y1'],
      dirt: ['w1', 'w2', 'w3'], dirtEdge: 'k1', pebble: 'k3',
      water: ['g1', 'b1', 'b2'], shore: 'w2', sparkle: 'g5',
      pathStyle: 'dirt', floor: 'k1', foam: 'g4', bank: 'k0',
      detail: { tuft: 0.6, flower: 0.05, pebble: 0.04, leaf: 0.05 },
      light: { color: 'g1', alpha: 0.25, blend: 'MULTIPLY' },
    },
    raid: {
      floor: 'w2', floorAlt: 'w1', floorLine: 'k1',
      wall: 'k2', wallTop: 's1', wallLine: 'k0',
      clutter: 'w3', clutterEdge: 'w1', washer: 's3',
      crack: 'k0', pit: 'k0',
      door: 'w3', doorLocked: 'r2', doorOpen: 'g3',
      spore: 'g5', pipe: 's2', pipeDark: 's1', steam: 'k4',
      carpet: 'r1', carpetEdge: 'y1', office: 'p1',
    },
  },
};

// Colour helpers so data files can say FUP.look.hex('g3') or FUP.look.num('g3').
FUP.look.hex = k => FUP.look.palette[k] || k;
FUP.look.num = k => parseInt(FUP.look.hex(k).slice(1), 16);
// A mood with every role swapped for its '#rrggbb' colour (lists stay lists).
FUP.look.mood = name => {
  const m = FUP.look.moods[name], out = {};
  for (const k in m) {
    const v = m[k];
    out[k] = Array.isArray(v) ? v.map(FUP.look.hex)
      : (v && typeof v === 'object') ? (v.color ? { ...v, color: FUP.look.num(v.color) } : { ...v })
      : FUP.look.hex(v);
  }
  return out;
};
