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
  // PLACEHOLDER prices. (v0.78, Jesus "too cheap": every Carpenter coin price x3; Market curios unchanged.)
  items: {
    // max: how many you can own in total. stall: true = it works as a food stall (data/stall.js).
    food_stall: { name: 'Food Stall', emoji: '🏪', kind: 'building', w: 3, h: 2, solid: true, zones: ['plot'], max: 1,
                  cost: { coins: 1800, items: { plank: 8 } }, req: { skills: { building: 1 } }, stall: true, blurb: 'Sells your dishes while you are out getting hurt.' },
    // B3 (Jesus 2026-11-20: prices x3 like the rest of the Carpenter's; the Shed opens your home storage + 20 pantry space)
    // storage: walk up to it on the plot = your home storage · pantryBonus / trapBonus: count only while it stands (FUP.place.bonus)
    // noUpgrade: a stall that keeps its first-tier numbers forever · say: narrator line when you place it
    shed:         { name: 'Shed', emoji: '🛖', kind: 'building', w: 3, h: 2, solid: true, zones: ['plot'], max: 1, storage: true, pantryBonus: 20, say: 'shedBuilt',
                    req: { skills: { building: 10 } }, cost: { coins: 6000, items: { plank: 15 } }, blurb: 'Reach your home storage from your plot. +20 pantry space while it stands.' },
    trap_rack:    { name: 'Trap Rack', emoji: '🪤', kind: 'building', w: 2, h: 1, solid: true, zones: ['plot'], max: 1, trapBonus: 2, say: 'rackBuilt',
                    req: { skills: { building: 16 } }, cost: { coins: 4500, items: { plank: 12 } }, blurb: 'Own and set 2 more fish traps.' },
    food_stall_2: { name: 'Second Stall', emoji: '🏪', sprite: 'place_food_stall', kind: 'building', w: 3, h: 2, solid: true, zones: ['plot'], max: 1, stall: true, noUpgrade: true, say: 'stall2Built',
                    req: { skills: { building: 24 }, facts: { 'built:food_stall': 1 } }, cost: { coins: 15000, items: { plank: 25 } }, blurb: 'A second stall with its own stock. It stays small.' },
    bench:      { name: 'Bench', emoji: '🪑', kind: 'building', w: 2, h: 1, solid: true, zones: ['plot'], cost: { coins: 360 }, blurb: 'Somewhere to sit and regret things.' },
    flower_bed: { name: 'Flower Bed', emoji: '🌷', kind: 'ground', w: 1, h: 1, solid: false, zones: ['plot', 'farm'], cost: { coins: 90 }, blurb: 'Flowers. They ask for nothing. Yet.' },
    // Ground things for your plot and the farm (v0.57). free: true = costs nothing with the Building Mastery perk (freeGround)
    path:       { name: 'Dirt Path',  emoji: '🟫', kind: 'ground', w: 1, h: 1, solid: false, zones: ['plot', 'farm'], cost: { coins: 30 }, free: true, blurb: 'Dirt, but organised.' },
    fence:      { name: 'Fence',      emoji: '🪵', kind: 'ground', w: 1, h: 1, solid: true,  zones: ['plot', 'farm'], req: { skills: { building: 3 } },  cost: { coins: 45 }, free: true, blurb: 'Keeps things in. Or out. Depends on the things.' },
    signpost:   { name: 'Signpost',   emoji: '🪧', kind: 'ground', w: 1, h: 1, solid: true,  zones: ['plot', 'farm'], req: { skills: { building: 5 } },  cost: { coins: 180 }, blurb: 'It points. Nobody knows where.' },
    hedge:      { name: 'Hedge',      emoji: '🌳', kind: 'ground', w: 1, h: 1, solid: true,  zones: ['plot', 'farm'], req: { skills: { building: 7 } },  cost: { coins: 75 }, free: true, blurb: 'A fence that grows. Ambitious.' },
    lantern:    { name: 'Lantern',    emoji: '🏮', kind: 'ground', w: 1, h: 1, solid: true,  zones: ['plot', 'farm'], req: { skills: { building: 9 } },  cost: { coins: 240 }, blurb: 'Light for your late-night farming regrets.' },
    stone_path: { name: 'Stone Path', emoji: '⬜', kind: 'ground', w: 1, h: 1, solid: false, zones: ['plot', 'farm'], req: { skills: { building: 12 } }, cost: { coins: 60 }, blurb: 'A path that means business.' },
    // Furniture for your room (purely for looks). solid = you walk round it (rugs you walk on).
    // flat: true = lies on the floor; one other (not flat) thing can stand on it (a table on a rug)
    // act: what happens when you walk up and press the button: say = a narrator line (data/narrator.js), bed = works like your bed
    table:      { name: 'Table',        emoji: '🍽️', kind: 'furniture', w: 2, h: 2, solid: true, zones: ['home'], act: { label: '🍽️ Sit down', say: 'furnTable' }, cost: { coins: 600 }, blurb: 'Eat at it. Or under it. No judgement.' },
    chair:      { name: 'Chair',        emoji: '💺', kind: 'furniture', w: 1, h: 1, solid: true, zones: ['home'], act: { label: '💺 Sit', say: 'furnChair' }, cost: { coins: 240 }, blurb: 'For sitting. Revolutionary.' },
    plant:      { name: 'Potted Plant', emoji: '🪴', kind: 'furniture', w: 1, h: 1, solid: true, zones: ['home'], act: { label: '🪴 Look', say: 'furnPlant' }, cost: { coins: 180 }, blurb: 'The only crop you won\'t eat.' },
    rug:        { name: 'Rug',          emoji: '🟥', kind: 'furniture', w: 2, h: 2, flat: true, zones: ['home'], req: { skills: { building: 4 } },  cost: { coins: 450 }, blurb: 'Ties the room together.' },
    bookshelf:  { name: 'Bookshelf',    emoji: '📚', kind: 'furniture', w: 2, h: 1, solid: true, zones: ['home'], req: { skills: { building: 6 } },  act: { label: '📚 Read', say: 'furnBooks' }, cost: { coins: 900, items: { plank: 4 } }, blurb: 'Books you will absolutely read. Someday.' },
    fireplace:  { name: 'Fireplace',    emoji: '🔥', kind: 'furniture', w: 2, h: 1, solid: true, zones: ['home'], req: { skills: { building: 15 } }, act: { label: '🔥 Warm up', say: 'furnFire' }, cost: { coins: 2700, items: { plank: 10 } }, blurb: 'Cosy. Do not cook in it. You have a stove.' },
    fancy_bed:  { name: 'Four-Poster Bed', emoji: '🛏️', kind: 'furniture', w: 2, h: 2, solid: true, zones: ['home'], req: { skills: { building: 18 } }, act: { label: '🛏️ Bed', bed: true }, cost: { coins: 3600, items: { plank: 12 } }, blurb: 'Sleep like royalty. Wake up like you.' },
    // Boss trophies (G1): only from boss chase drops (data/gear.js bossDrops). noShop = never sold anywhere.
    golden_perch:  { name: 'Golden Perch', emoji: '🏆', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'boss', blurb: 'The Godfather sat here. Now you do. Well, a pigeon does.' },
    // Collection log trophies (E2): a full page of the log (data/log.js rewards.done). PLACEHOLDER looks (emoji).
    golden_basket:    { name: 'Golden Basket', emoji: '🧺', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'log', blurb: 'Every ingredient, gathered. The basket is the only thing you never ate.' },
    golden_ladle:     { name: 'Golden Ladle', emoji: '🥄', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'log', blurb: 'Every dish, cooked. Marrowbone pretends not to be jealous.' },
    mounted_fish:     { name: 'Mounted Fish', emoji: '🐟', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'log', blurb: 'Every fish, caught. This one still looks annoyed about it.' },
    stuffed_squirrel: { name: 'Stuffed Squirrel', emoji: '🐿️', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'log', blurb: 'Every creature, beaten. The squirrels have started a memorial fund.' },
    lucky_case:       { name: 'Lucky Display Case', emoji: '💎', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'log', blurb: 'Every rare drop. Statistically, you should not exist.' },
    explorer_globe:   { name: "Explorer's Globe", emoji: '🌍', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'log', blurb: 'Every area, visited. The globe is mostly Foopville. That is accurate.' },
    framed_warning: { name: 'Framed Last Warning', emoji: '📜', kind: 'building', w: 1, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'boss', blurb: 'You broke the warning. Then you framed it.' },
    // Farm helpers (v0.70): put them near your patches. helper.kind = what they do (src/systems/garden.js), radius in squares.
    //   scarecrow: chance of one extra crop at harvest · barrel: waters thirsty crops by itself, `water` times a day
    scarecrow:   { name: 'Scarecrow', emoji: '🧍', sprite: 'deco_scarecrow', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], req: { skills: { building: 4 } },
                   cost: { items: { plank: 4, nails: 2 } }, helper: { kind: 'scarecrow', radius: 3, chance: 0.35 },
                   blurb: 'Crops within 3 squares: 35% chance of one extra at harvest. The crows were never real. The results are.' },
    rain_barrel: { name: 'Rain Barrel', emoji: '🛢️', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], req: { skills: { building: 8 } },
                   cost: { items: { plank: 6, nails: 3, stone: 1 } }, helper: { kind: 'barrel', radius: 2, water: 6 },
                   blurb: 'Waters thirsty crops within 2 squares by itself, 6 times a day. Lazy farming, built properly.' },
    // Farming 2.0 F-B (v0.87): beehive = chance of one extra crop nearby (like the scarecrow, its own bonus);
    // hedge = crops next to it dry out half as fast. Numbers and costs are PLACEHOLDERS.
    beehive:     { name: 'Beehive', emoji: '🐝', sprite: 'prop_beehive', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], req: { skills: { gardening: 6 } },
                   cost: { coins: 300, items: { plank: 3 } }, helper: { kind: 'hive', radius: 2, chance: 0.5 }, animal: 'hive',   // F-E: honey too
                   blurb: 'Crops within 2 squares: 50% chance of one extra at harvest. 2 honey every 4 hours. The bees are unionised.' },
    // Farm animals (F-E, v0.99.4, data/animals.js). animal = the data/animals.js kinds entry. max = how many you can own.
    chicken_coop: { name: 'Chicken Coop', emoji: '🐔', sprite: 'prop_coop', kind: 'ground', w: 2, h: 2, solid: true, zones: ['plot', 'farm'], req: { skills: { gardening: 8 } }, max: 2,
                    cost: { coins: 600, items: { plank: 6 } }, animal: 'coop',
                    blurb: 'Chickens. Feed them Grumblegrain daily, collect 6 eggs every 2 hours. Forget, and they won\'t forgive you.' },
    cow_barn:     { name: 'Cow Barn', emoji: '🐄', kind: 'ground', w: 3, h: 2, solid: true, zones: ['plot', 'farm'], req: { skills: { gardening: 14 } }, max: 1,
                    cost: { coins: 1500, items: { plank: 10, stone: 4 } }, animal: 'barn',
                    blurb: 'One cow. Feed her Meadow Hay daily, 2 milk every 3 hours. She has opinions about the hay.' },
    hedge:       { name: 'Hedge', emoji: '🌳', sprite: 'bush', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], req: { skills: { gardening: 3 } },
                   cost: { coins: 60 }, helper: { kind: 'hedge', radius: 1 },
                   blurb: 'Crops right next to it dry out half as fast. A wall that grows. Ambitious.' },
    // Farming 2.0 F-C (v0.91, Jesus): the sprinkler waters the 8 squares around it whenever a crop there is
    // thirsty, until its tank is empty. You refill it with your watering can (it starts empty). No XP for
    // its watering. Cost, level and tank size are PLACEHOLDERS.
    sprinkler:   { name: 'Sprinkler', emoji: '⛲', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], req: { skills: { gardening: 10, building: 8 } },
                   cost: { items: { brass: 2, plank: 4, nails: 2 } }, helper: { kind: 'sprinkler', radius: 1, tank: 12 },
                   blurb: 'Waters the 8 squares around it, 12 times per fill. You fill it. With your can. Progress.' },
    // Fruit trees (F-D, v0.92): saplings sold by Pip (sapling: true keeps them off the Carpenter's list),
    // placed in Build mode, 2x2. tree = the data/garden.js trees entry. Taking one back = a fresh sapling again.
    grumbleplum_tree: { name: 'Grumbleplum Tree', emoji: '🌳', sprite: 'tree_grumbleplum_0', kind: 'ground', w: 2, h: 2, solid: true, zones: ['plot', 'farm'], req: { skills: { gardening: 12 } },
                        cost: { coins: 400 }, tree: 'grumbleplum', sapling: true, noShop: true, blurb: 'Two days to grow, then plums every 4 hours. Forever. Patience is a vegetable.' },
    sourapple_tree:   { name: 'Sourapple Tree', emoji: '🌳', sprite: 'tree_sourapple_0', kind: 'ground', w: 2, h: 2, solid: true, zones: ['plot', 'farm'], req: { skills: { gardening: 22 } },
                        cost: { coins: 900 }, tree: 'sourapple', sapling: true, noShop: true, blurb: 'Apples so sour they make lemons look friendly. Two days to grow.' },
    // Quest rewards (v0.79): never sold. source: 'quest'
    crow_scarecrow: { name: 'Crow-proof Scarecrow', emoji: '🧍', sprite: 'deco_scarecrow', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], noShop: true, source: 'quest',
                   helper: { kind: 'scarecrow', radius: 5, chance: 0.35 }, blurb: 'Crops within 5 squares: 35% chance of one extra at harvest. The crows have filed a complaint.' },
    model_bridge: { name: 'Model Bridge', emoji: '🌉', kind: 'building', w: 2, h: 1, solid: true, zones: ['plot'], noShop: true, source: 'quest', blurb: 'Planksworth\'s bridge, small enough to never fall down. He checks on it.' },
    // Only from the repaired Market (source: 'market': hidden from the Carpenter's Build tab)
    gnome:         { name: 'Judgemental Gnome', emoji: '🧙', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], cost: { coins: 400 }, source: 'market', blurb: 'It has seen what you plant.' },
    weathervane:   { name: 'Weathervane', emoji: '🐓', kind: 'ground', w: 1, h: 1, solid: true, zones: ['plot', 'farm'], cost: { coins: 600 }, source: 'market', blurb: 'Points at the wind. The wind ignores it.' },
    fancy_rug:     { name: 'Suspiciously Fine Rug', emoji: '🟪', kind: 'furniture', w: 2, h: 2, flat: true, zones: ['home'], cost: { coins: 500 }, source: 'market', blurb: 'Too nice for you. Nobody asks where it came from.' },
    pigeon_statue: { name: 'Pigeon Statue', emoji: '🐦', kind: 'building', w: 2, h: 1, solid: true, zones: ['plot'], max: 1, cost: { coins: 800 }, source: 'market', blurb: 'A tribute. The pigeons approve. Mostly.' },
  },

  // ---------- Building skill ----------
  xp: { plank: 6, perCoin: 0.1 / 3, firstPlace: 20 },   // v0.78: perCoin 0.1 -> 0.033 so tripled prices don't triple the XP;   // v0.70: perCoin 0.25 -> 0.1 (most Building XP now comes from salvage and commissions)   // XP per plank sawn / per coin of a thing's listed price / first time you place a kind of thing
  stallNoRoom: 'Your backpack can\'t hold the stall\'s dishes. Make room, then take it back.',   // v0.72: nothing goes to storage by itself
  plankBark: 3,       // Bark per plank at the sawhorse (Tidy Saw perk: 2)
  sawSeconds: 1.0,    // seconds of sawing per plank
  plankPrice: 15,     // the Carpenter sells planks too (no Building XP for those)

  walkable: '.=',   // map squares you may build on (grass and path). A zone's own `ground` overrides it (the farm: grass only)
  buyMany: 5,       // the Carpenter's "Buy 5" button for ground things
  buildColors: { slotFree: 'g5', slotBad: 'r3', zoneEdge: 'y2' },   // palette keys (data/look.js)
};
