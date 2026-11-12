// ============================================================
// PLACEMENT — things you can put down on your own land (design/foundation.md 5).
// A zone is a patch of a map you may build on. Slots are the spots inside it
// where buildings go. Ground things (flower beds, later paths and fences) go
// on any free square of the zone that isn't a slot.
// Positions inside a zone count from its top-left corner (0, 0).
// ============================================================
window.FUP = window.FUP || {};

FUP.placeData = {
  zones: {
    // The east meadow in the village: map squares 44-55 across, 7-20 down
    plot: {
      name: 'Your plot', where: { region: 'village', tx: 44, ty: 7 }, w: 12, h: 14,
      slots: [
        { id: 's1', tx: 1, ty: 1, w: 3, h: 2, fits: ['building'] },
        { id: 's2', tx: 5, ty: 1, w: 3, h: 2, fits: ['building'] },
        { id: 's3', tx: 9, ty: 1, w: 3, h: 2, fits: ['building'] },
        { id: 's4', tx: 1, ty: 6, w: 3, h: 2, fits: ['building'] },
        { id: 's5', tx: 5, ty: 6, w: 3, h: 2, fits: ['building'] },
        { id: 's6', tx: 9, ty: 6, w: 3, h: 2, fits: ['building'] },
      ],
    },
    // The big farm south of the village (inside its fence): ground things only, on plain grass (v0.57)
    farm: { name: 'The farm', where: { region: 'village', tx: 5, ty: 42 }, w: 52, h: 15, slots: [], ground: '.' },
    // The floor of your room (v0.68): a walk-around room (src/scenes/HouseScene.js). Furniture goes on any free floor square.
    // where / w / h are set by FUP.home.build() from the house you own (data/home.js rooms); these are the Cottage's.
    home: { name: 'Your room', where: { region: 'home', tx: 1, ty: 2 }, w: 14, h: 8, slots: [], ground: '.' },
  },

  // kind: 'building' (needs a building slot) | 'furniture' (any free square of your room's floor) | 'ground' (any free square)
  // w, h = size in squares. solid = you can't walk through it. cost / req: the shared format (src/systems/req.js).
  // PLACEHOLDER prices.
  items: {
    // max: how many you can own in total. stall: true = it works as a food stall (data/stall.js).
    food_stall: { name: 'Food Stall', emoji: '🏪', kind: 'building', w: 3, h: 2, solid: true, zones: ['plot'], max: 1,
                  cost: { coins: 600, items: { plank: 8 } }, req: { skills: { building: 1 } }, stall: true, blurb: 'Sells your dishes while you are out getting hurt.' },
    bench:      { name: 'Bench', emoji: '🪑', kind: 'building', w: 2, h: 1, solid: true, zones: ['plot'], cost: { coins: 120 }, blurb: 'Somewhere to sit and regret things.' },
    flower_bed: { name: 'Flower Bed', emoji: '🌷', kind: 'ground', w: 1, h: 1, solid: false, zones: ['plot', 'farm'], cost: { coins: 30 }, blurb: 'Flowers. They ask for nothing. Yet.' },
    // Ground things for your plot and the farm (v0.57). free: true = costs nothing with the Building Mastery perk (freeGround)
    path:       { name: 'Dirt Path',  emoji: '🟫', kind: 'ground', w: 1, h: 1, solid: false, zones: ['plot', 'farm'], cost: { coins: 10 }, free: true, blurb: 'Dirt, but organised.' },
    fence:      { name: 'Fence',      emoji: '🪵', kind: 'ground', w: 1, h: 1, solid: true,  zones: ['plot', 'farm'], req: { skills: { building: 3 } },  cost: { coins: 15 }, free: true, blurb: 'Keeps things in. Or out. Depends on the things.' },
    signpost:   { name: 'Signpost',   emoji: '🪧', kind: 'ground', w: 1, h: 1, solid: true,  zones: ['plot', 'farm'], req: { skills: { building: 5 } },  cost: { coins: 60 }, blurb: 'It points. Nobody knows where.' },
    hedge:      { name: 'Hedge',      emoji: '🌳', kind: 'ground', w: 1, h: 1, solid: true,  zones: ['plot', 'farm'], req: { skills: { building: 7 } },  cost: { coins: 25 }, free: true, blurb: 'A fence that grows. Ambitious.' },
    lantern:    { name: 'Lantern',    emoji: '🏮', kind: 'ground', w: 1, h: 1, solid: true,  zones: ['plot', 'farm'], req: { skills: { building: 9 } },  cost: { coins: 80 }, blurb: 'Light for your late-night farming regrets.' },
    stone_path: { name: 'Stone Path', emoji: '⬜', kind: 'ground', w: 1, h: 1, solid: false, zones: ['plot', 'farm'], req: { skills: { building: 12 } }, cost: { coins: 20 }, blurb: 'A path that means business.' },
    // Furniture for your room (purely for looks). solid = you walk round it (rugs you walk on).
    // act: what happens when you walk up and press the button: say = a narrator line (data/narrator.js), bed = works like your bed
    table:      { name: 'Table',        emoji: '🍽️', kind: 'furniture', w: 2, h: 2, solid: true, zones: ['home'], act: { label: '🍽️ Sit down', say: 'furnTable' }, cost: { coins: 200 }, blurb: 'Eat at it. Or under it. No judgement.' },
    chair:      { name: 'Chair',        emoji: '💺', kind: 'furniture', w: 1, h: 1, solid: true, zones: ['home'], act: { label: '💺 Sit', say: 'furnChair' }, cost: { coins: 80 }, blurb: 'For sitting. Revolutionary.' },
    plant:      { name: 'Potted Plant', emoji: '🪴', kind: 'furniture', w: 1, h: 1, solid: true, zones: ['home'], act: { label: '🪴 Look', say: 'furnPlant' }, cost: { coins: 60 }, blurb: 'The only crop you won\'t eat.' },
    rug:        { name: 'Rug',          emoji: '🟥', kind: 'furniture', w: 2, h: 2, zones: ['home'], req: { skills: { building: 4 } },  cost: { coins: 150 }, blurb: 'Ties the room together.' },
    bookshelf:  { name: 'Bookshelf',    emoji: '📚', kind: 'furniture', w: 2, h: 1, solid: true, zones: ['home'], req: { skills: { building: 6 } },  act: { label: '📚 Read', say: 'furnBooks' }, cost: { coins: 300, items: { plank: 4 } }, blurb: 'Books you will absolutely read. Someday.' },
    fireplace:  { name: 'Fireplace',    emoji: '🔥', kind: 'furniture', w: 2, h: 1, solid: true, zones: ['home'], req: { skills: { building: 15 } }, act: { label: '🔥 Warm up', say: 'furnFire' }, cost: { coins: 900, items: { plank: 10 } }, blurb: 'Cosy. Do not cook in it. You have a stove.' },
    fancy_bed:  { name: 'Four-Poster Bed', emoji: '🛏️', kind: 'furniture', w: 2, h: 2, solid: true, zones: ['home'], req: { skills: { building: 18 } }, act: { label: '🛏️ Bed', bed: true }, cost: { coins: 1200, items: { plank: 12 } }, blurb: 'Sleep like royalty. Wake up like you.' },
    // Boss trophies (G1): only from boss chase drops (data/gear.js bossDrops). noShop = never sold anywhere.
    golden_perch:  { name: 'Golden Perch', emoji: '🏆', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'boss', blurb: 'The Godfather sat here. Now you do. Well, a pigeon does.' },
    framed_notice: { name: 'Framed Final Notice', emoji: '📜', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'boss', blurb: 'Evicted the evictor. Framed it.' },
    // Only from the repaired Market (source: 'market': hidden from the Carpenter's Build tab)
    gnome:         { name: 'Judgemental Gnome', emoji: '🧙', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], cost: { coins: 400 }, source: 'market', blurb: 'It has seen what you plant.' },
    weathervane:   { name: 'Weathervane', emoji: '🐓', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], cost: { coins: 600 }, source: 'market', blurb: 'Points at the wind. The wind ignores it.' },
    fancy_rug:     { name: 'Suspiciously Fine Rug', emoji: '🟪', kind: 'furniture', w: 2, h: 2, zones: ['home'], cost: { coins: 500 }, source: 'market', blurb: 'Too nice for you. Nobody asks where it came from.' },
    pigeon_statue: { name: 'Pigeon Statue', emoji: '🐦', kind: 'building', w: 2, h: 1, solid: true, zones: ['plot'], max: 1, cost: { coins: 800 }, source: 'market', blurb: 'A tribute. The pigeons approve. Mostly.' },
  },

  // ---------- Building skill ----------
  xp: { plank: 6, perCoin: 0.25, firstPlace: 20 },   // XP per plank sawn / per coin of a thing's listed price / first time you place a kind of thing
  plankBark: 3,       // Bark per plank at the sawhorse (Tidy Saw perk: 2)
  sawSeconds: 1.0,    // seconds of sawing per plank
  plankPrice: 15,     // the Carpenter sells planks too (no Building XP for those)

  walkable: '.=',   // map squares you may build on (grass and path). A zone's own `ground` overrides it (the farm: grass only)
  buyMany: 5,       // the Carpenter's "Buy 5" button for ground things
  buildColors: { slotFree: 'g5', slotBad: 'r3', zoneEdge: 'y2' },   // palette keys (data/look.js)
};
