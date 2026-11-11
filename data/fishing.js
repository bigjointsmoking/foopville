// ============================================================
// FISHING — every number for the Fishing skill (design/fishing.md).
// Stand next to fishing water, cast, tap when it bites, then play Reel:
// hold to lift the green zone, let go to drop it, keep the fish inside.
// ============================================================
window.FUP = window.FUP || {};

FUP.fishData = {
  // ---------- The Reel mini-game ----------
  game: {
    biteMin: 2.5, biteMax: 6,   // seconds you wait for a bite
    hookWindow: 0.9,            // seconds to tap once it bites
    barH: 280,                  // height of the reel bar (pixels)
    zone: 70,                   // height of your catch zone
    zonePerLevel: 1,            // +1 per Fishing level above the fish's level...
    zoneLevelMax: 20,           // ...up to this much
    lift: 520, gravity: 420,    // how fast the zone speeds up while you hold / falls when you let go
    bounce: 0.3,                // how much speed it keeps when it hits an end
    start: 0.35,                // the catch meter starts here (0 to 1)
    fill: 0.30, drain: 0.22,    // meter per second with the fish inside / outside the zone
    perfectXp: 1.25,            // XP multiplier for a Perfect catch (the meter never went down)
    perfectTreasure: 2,         // (read by a later phase)
    fishH: 18,                  // height of the fish marker
  },

  // ---------- Fish (each is also an ingredient in data/ingredients.js) ----------
  // level = Fishing level to catch it. speed = pixels per second. dart = seconds between
  // changes of direction. range = how far it darts, as a share of the bar.
  fish: {
    mudminnow:         { level: 1,  xp: 4, speed: 60,  dart: 1.6, range: 0.25 },
    grumpy_guppy:      { level: 3,  xp: 5, speed: 80,  dart: 1.4, range: 0.35 },
    pond_perch:        { level: 6,  xp: 6, speed: 100, dart: 1.2, range: 0.45 },
    sulking_carp:      { level: 9,  xp: 7, speed: 90,  dart: 1.5, range: 0.6 },
    whiskered_catfish: { level: 12, xp: 9, speed: 130, dart: 1.0, range: 0.6 },
    // Sea fish (the Docks, v0.55): the pier (F squares) and the deep water (D squares)
    salty_sardine:      { level: 10, xp: 8,  speed: 140, dart: 0.8, range: 0.4 },
    dock_herring:       { level: 14, xp: 10, speed: 150, dart: 0.9, range: 0.5 },
    regret_snapper:     { level: 18, xp: 12, speed: 160, dart: 0.9, range: 0.6 },
    bashful_flounder:   { level: 22, xp: 15, speed: 120, dart: 1.6, range: 0.8 },
    sarcastic_mackerel: { level: 26, xp: 19, speed: 210, dart: 0.7, range: 0.7 },
    grudge_tuna:        { level: 30, xp: 23, speed: 190, dart: 1.1, range: 0.9 },
    letter_opener:      { level: 34, xp: 27, speed: 240, dart: 0.6, range: 0.9 },
    // Marsh fish (the Soggy Marsh, W2)
    mud_skipper:        { level: 15, xp: 10, speed: 170, dart: 0.7, range: 0.5 },
    croaker:            { level: 19, xp: 13, speed: 150, dart: 1.0, range: 0.7 },
    bog_eel:            { level: 23, xp: 16, speed: 200, dart: 0.7, range: 0.7 },
  },

  // ---------- Fishing spots: which fish, and how common (bigger number = more common) ----------
  spots: {
    pond: { name: 'The Village Pond', fish: { mudminnow: 5, grumpy_guppy: 4, pond_perch: 3, sulking_carp: 2, whiskered_catfish: 1 } },
    pier: { name: 'The Pier', fish: { salty_sardine: 5, dock_herring: 4, regret_snapper: 3, bashful_flounder: 3 } },   // the Docks (data/region_docks.js)
    marsh: { name: 'Marsh Water', fish: { mud_skipper: 4, croaker: 3, bog_eel: 2 } },   // the Soggy Marsh (data/region_marsh.js)
    deep: { name: 'Deep Water', req: { skills: { fishing: 26 } }, fish: { sarcastic_mackerel: 4, grudge_tuna: 3, letter_opener: 2 } },
  },
  // Where the spots are on the village map (squares, corners included). Only '~' squares inside count.
  villageSpots: [{ spot: 'pond', x0: 22, y0: 12, x1: 26, y1: 14 }],

  // ---------- Bait (sold by Gill in packs). One is used per bite. ----------
  //   biteCut: bites come this much sooner · topWeight: the 2 best fish you can catch are this much more likely
  //   treasureMult: treasure this many times more often
  bait: {
    worm:   { name: 'Worm', emoji: '🪱', price: 2, biteCut: 0.30, blurb: 'Bites come 30% sooner.' },
    cheese: { name: 'Stinky Cheese', emoji: '🧀', price: 5, req: { skills: { fishing: 10 } }, topWeight: 2, blurb: 'The two best fish you can catch bite twice as often.' },
    lure:   { name: 'Shiny Lure', emoji: '✨', price: 10, req: { skills: { fishing: 20 } }, treasureMult: 2, blurb: 'Treasure twice as often.' },
  },
  baitPack: 10,       // bait comes in packs of 10 (price x 10)
  compostWorms: 2,    // free worms for every Compost batch that finishes

  // ---------- Junk and treasure ----------
  // junkChance: a bite is junk instead of a fish (no mini-game, junkXp). treasureChance: after a catch, something extra.
  // treasure kinds (weights): coins (random in `coins`), seeds (`seeds` of one crop you can grow), bottle (a free riddle, else bottleCoins), pearl
  extras: {
    junkChance: 0.10, junkXp: 1, junk: { old_boot: 4, bark: 4, rusty_can: 2 },
    treasureChance: 0.015, treasure: { coins: 5, seeds: 3, bottle: 2, pearl: 2 }, coins: [20, 60], seeds: 3, bottleCoins: 40,
  },

  // ---------- Fish traps (v0.56): set one on a ringed square by the water, come back later ----------
  //   own: how many you can own · fillSeconds: play seconds per fish · cap: fish a trap holds
  //   xpShare: share of the fish's XP when you empty it (at least 1) · wormBoost: fill time x this while it has worms
  //   villageSquares: the ringed squares by the village pond (the Docks' come from data/region_docks.js objects)
  traps: { price: 150, req: { skills: { fishing: 5 } }, own: 2, fillSeconds: 360, cap: 4, xpShare: 0.25, wormBoost: 0.75,
           villageSquares: [{ tx: 21, ty: 13, spot: 'pond' }, { tx: 27, ty: 13, spot: 'pond' }] },

  // Palette keys (data/look.js)
  colors: { bar: 'b1', zone: 'g4', fish: 'y2', meter: 'g5', meterLow: 'r3' },
};
