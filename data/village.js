// ============================================================
// VILLAGE — Foopville: the map, the four villagers, and their shops.
//
// MAP KEY (each character is one square):
//   #  tree (can't walk through)     .  grass       =  path
//   ~  pond (can't walk through)     b  inside a building (can't walk through)
//   w  the well (can't walk)         l  lamp post (can't walk)
//   k  barrel or crate (can't walk)  f  fence (can't walk)
//   G  the gate: walk through it into the Forest Edge (data/world.js)
//   Gaps in the border (G at the top, = at the bottom and right edge) lead to other regions;
//   the south and east ones are locked until repaired (data/world.js links).
//   P  where you appear (in front of your house)
//   p  a public farm patch (anyone can farm it)
//   1 2 3  farm patches that belong to house 1 (Cottage), 2 (Stone House), 3 (Manor)
//          (data/house.js). Patches are walkable soil: see data/garden.js.
//   A B C D E F H J  the 8 plots in the big farm (south), bought from the Farmhand
//          (data/garden.js farmPlots). G and P are taken, so no G or I plot.
//   h  hay bale (can't walk)         y  scarecrow (can't walk)
// Buildings and villagers are placed by square below (tx = column, ty = row,
// counting from 0 at the top-left). If you move a building on the map,
// move its entry too. PLACEHOLDER layout: Jesus can redraw it.
// ============================================================
window.FUP = window.FUP || {};

FUP.villageData = {
  tileSize: 40,

  map: [
    '##############GG##############################################',
    '###.........#.==.#.........###################################',
    '#...........#.==.#..ppp......#.........fffff.................#',
    '#..bbbb.....l.==.l....bbbb......bbbb...f222f.................#',
    '#..bbbb.......==......bbbb......bbbb...f222f.................#',
    '#....=........==........=.kk......=....f...f.................#',
    '#....=================================......==============...#',
    '#.............==..........pp.........=...................=...#',
    '#..bbbb.......==.....bb............k.=.....k.............=...#',
    '#k.bbbb....========..=...............=...................=...#',
    '#....=.....===ww===..=...............=...~...............=...#',
    '#....=================...............=..~~~..............=...#',
    '#..........l..==..l....~~............=..~~~..............=...#',
    '#.k...........==......~~~~~..........=...~...............=...#',
    '#..bbbb.fff...==.......~~............=...................=...#',
    '#..bbbb.11f...==.......pp............=...................=...#',
    '#....=P.11f...==..fff..pp............=...................=...#',
    '#....=================================...................=...#',
    '#.............=......................=...................=...#',
    '#.............=......................=...................=...#',
    '#.......~~~~..=...k..................=...................=...#',
    '#.....##~~~~..=......................=...................=...#',
    '#....###.~~...=...............l......=.fffff.............=...#',
    '#.............========...............=.f333f.............=...#',
    '#...................##.........bbbbbb=.f333f....~~~......=...#',
    '#....................##........bbbbbb=.f333f...~~~~~.....=...#',
    '#.....................=.......========.f...f....~~~......=...#',
    '#.....................=.....k............................=...#',
    '#...........#.........=..................................=...#',
    '#.....................=...##......................k......=...#',
    '#.....................=..............................k...=...#',
    '#....#....#....#....#.=..#...............................=...#',
    '#......#......#......#=.....#......#......#..............=...#',
    '######################=######################................#',
    '#.....................=..................................=...#',
    '#####################.=.#################################=####',
    '#................bbb..=..................................=...#',
    '#.......bbbbbb...bbb..=....h.............................=...#',
    '#.......bbbbbb..hh....=.h................................=...#',
    '#...==========================================================',
    '#............................................................=',
    '#...fffffffffffffffff.=.ffffffffffffffffffffffffffffffffff...#',
    '#...f.................=..................................f...#',
    '#...f.................=..................................f...#',
    '#...f..AAAA...BBBB....=....CCCC.........DDDD.............f...#',
    '#...f..AAAA...BBBB....=....CCCC.........DDDD.............f...#',
    '#...f..AAAA...BBBB....=....CCCC.........DDDD.............f...#',
    '#...f.......y.........=............y.....................f...#',
    '#...f====================================================f...#',
    '#...f.................=..................................f...#',
    '#...f.................=..................................f...#',
    '#...f..EEEE...FFFF....=....HHHH.........JJJJ.............f...#',
    '#...f..EEEE...FFFF....=....HHHH.........JJJJ.............f...#',
    '#...f..EEEE...FFFF....=....HHHH.........JJJJ.............f...#',
    '#...f.................=.y.......................y........f...#',
    '#...f.................=..................................f...#',
    '#...f.................=..................................f...#',
    '#...ffffffffffffffffffffffffffffffffffffffffffffffffffffff...#',
    '#......#......#......#......#......#......#......#......#....#',
    '######################=#######################################',
  ],

  // Pictures for buildings. tx = the column whose LEFT edge is the building's middle,
  // ty = the building's front row (its bottom row of 'b'). dx/dy nudge the picture in pixels.
  buildings: [
    { sprite: 'vil_forge',   tx: 5,  ty: 4, dx: 0,   dy: 6,  label: 'FORGE' },
    { sprite: 'vil_shop',    tx: 24, ty: 4, dx: 0,   dy: 6,  label: 'SHOP' },
    { sprite: 'vil_kitchen', tx: 5,  ty: 9, dx: 0,   dy: 6,  label: "MARROWBONE'S" },
    { sprite: 'vil_house',   tx: 5,  ty: 15, dx: 0,  dy: 6,  label: 'COTTAGE', house: 0 },   // house: which house in data/house.js
    { sprite: 'vil_house_2', tx: 34, ty: 4,  dx: 0,  dy: 6,  label: 'STONE HOUSE', house: 1 },
    { sprite: 'vil_house_3', tx: 34, ty: 25, dx: 0,  dy: 6,  label: 'MANOR', house: 2 },
    { sprite: 'vil_board',   tx: 22, ty: 8, dx: 0, dy: 4,  label: 'QUESTS' },
    { sprite: 'vil_well',    tx: 15, ty: 10, dx: 0, dy: 6, repair: 'well' },   // ruined until repaired (data/repairs.js)
    { sprite: 'vil_gate',    tx: 15, ty: 1, dx: 0, dy: 18, label: 'TO THE FOREST' },
    // The farm district (south of the village)
    { sprite: 'vil_barn',      tx: 11, ty: 38, dx: 0,  dy: 6, label: 'BARN' },
    { sprite: 'vil_seedstall', tx: 18, ty: 37, dx: 20, dy: 6, label: 'SEEDS' },
  ],

  // The villagers. `spot` = where they stand. `sprite` = map picture, `portrait` = big picture.
  npcs: {
    smith: {
      name: 'The Blacksmith', spot: { tx: 3, ty: 5 }, sprite: 'npc_smith_map', portrait: 'npc_smith', emoji: '🔨',
      greet: [
        'You again. Still alive? Huh. Must be the armor.',
        'Weapons and armor. No refunds. No hugs.',
        'That weapon looks like it lost a fight with a squirrel. Because it did.',
      ],
      bought: ['Wear it in good health. Or at least in health.', 'Fine choice. For someone with your budget.'],
      broke: ['Come back with coins. Or a time machine.'],
      tooWeak: ['You can\'t even lift that. I watched you try. Come back at {item}.', 'That needs {item}. You need a nap. I\'ll keep it in your stuff.'],
      rizz: [
        { level: 10, line: 'Between us: armor wins fights, not swords. Don\'t tell the swords.' },
        { level: 20, line: 'You\'re tolerable. Five percent off, forever. Tell nobody. Especially you.', gift: { discount: 0.05 } },
        { level: 30, line: 'Found these in a squirrel. Don\'t ask which end. Take them.', gift: { coins: 50 } },
      ],
    },
    fishmonger: {
      name: 'Gill the Fishmonger', emoji: '🐟',   // stands on the Docks since v0.54 (data/region_docks.js npcs), not in the village sprite: 'npc_fishmonger_map', portrait: 'npc_fishmonger',   // emoji until the art exists
      greet: [
        'Fish. I buy them. I sell things that catch them. It is a simple life and I resent it.',
        'Salt air, wet planks, no pond. I have moved up in the world. Down, technically. South.',
        'You found the Docks. Someone fixed the road. I assume it was not you. It was? Huh.',
      ],
      sold: ['Fresh enough.', 'It\'s looking at me. I\'ll take it.'],
      nothing: ['No fish? Then we are just two people standing near the sea.'],
      rizz: [
        { level: 10, line: 'The carp sulk because they know things. Fish at the deep end.' },
        { level: 20, line: 'For you, an extra coin a fish. Tell the fish nothing.', gift: { fishBonus: 0.1 } },
        { level: 30, line: 'Found this in a catfish. The catfish found it in a boot.', gift: { coins: 60 } },
      ],
    },
    shop: {
      name: 'The Shopkeeper', spot: { tx: 24, ty: 5 }, sprite: 'npc_shop_map', portrait: 'npc_shop', emoji: '🪙',
      greet: [
        'Welcome, welcome! Everything is for sale. Including me, at the right price. Kidding. Mostly.',
        'Ah, my favorite customer! Don\'t tell the others. There are no others.',
        'Buying? Selling? Crying? All three are welcome here.',
      ],
      bought: ['Pleasure doing business! Mostly mine.', 'Sold! No take-backs, that\'s the law. I made the law.'],
      sold: ['I\'ll give you a fair price. Fair for me.', 'Ooh, still warm. Or is that sweat?'],
      broke: ['Your coin purse is making a sad little noise.'],
      haggleWin: ['Ugh. Fine. You\'re charming. I hate it. Cheaper prices today.'],
      haggleFail: ['Was that haggling? I\'m raising prices out of pure confusion.'],
      rizz: [
        { level: 10, line: 'Free salt! It\'s expired. Salt doesn\'t expire. Stop thinking about it.', gift: { ingredient: 'rock_salt', count: 2 } },
        { level: 20, line: 'Secret: haggle BEFORE you sell. Charmed me pays more. Ugh. I said it.' },
        { level: 30, line: 'Five percent off, always. You\'re bad for business. I like it.', gift: { discount: 0.05 } },
      ],
    },
    chef: {
      name: 'Chef Marrowbone', spot: { tx: 4, ty: 10 }, sprite: 'npc_chef_map', portrait: 'npc_chef', emoji: '👨‍🍳',
      greet: [
        'You call that cooking? I call it a cry for help.',
        'I have tasted your food. I have not recovered.',
        'There are recipes nobody writes down. I know them. I sell riddles about them. Pay up.',
      ],
      hint: [
        'Fine. Here is the riddle. Try not to ruin it.',
        'Write it down. You won\'t, but you should.',
        'There. Solve it in the kitchen, not in my doorway.',
      ],
      allKnown: ['You\'ve heard every riddle I have. Now go cook them. Badly, I assume.'],
      broke: ['Knowledge costs money. Ignorance is free, as you\'ve proven.'],
      rizz: [
        { level: 10, line: 'Fire hurts mushrooms. The Landlord is a mushroom. Do the maths. I\'ll wait.' },
        { level: 20, line: 'Half price lessons. Watching you cook is payment enough. Painful payment.' },
        { level: 30, line: 'Take this Heartroot. Cook something worthy of it. You won\'t. Try anyway.', gift: { ingredient: 'heartroot', count: 1 } },
      ],
    },
    carpenter: {
      name: 'Planksworth the Carpenter', spot: { tx: 12, ty: 15 }, sprite: 'npc_carpenter_map', portrait: 'npc_carpenter', emoji: '🪚',
      greet: [
        'Your house? I\'ve seen sheds with more ambition.',
        'I build houses. Land, stoves, shelves. Not friendships. Those cost extra.',
        'Measure twice, cut once, charge three times. Family motto.',
      ],
      bought: ['Done. Don\'t lean on it for a day. Or ever.', 'Built to last. Longer than you, statistically.'],
      broke: ['That\'s not enough coins. That\'s barely enough splinters.'],
      maxed: ['That\'s everything I build. Go away and enjoy it.'],
      rizz: [
        { level: 10, line: 'Found coins in your walls. Your walls, my coins? Fine. Yours.', gift: { coins: 25 } },
        { level: 20, line: 'Tip: a pantry before a mansion. Big houses don\'t feed anybody.' },
        { level: 30, line: 'Ten percent off everything I build. Don\'t make it weird.', gift: { discount: 0.10 } },
      ],
    },
    farmhand: {
      name: 'Hollis the Farmhand', spot: { tx: 25, ty: 38 }, sprite: 'npc_farmhand_map', portrait: 'npc_farmhand', emoji: '🧑‍🌾',
      greet: [
        'Land for sale. Good dirt. Mostly dirt. Some of it is rocks pretending.',
        'You want a plot? Everybody wants a plot. Nobody wants to weed it.',
        'I sit here so the scarecrows have someone to talk to.',
      ],
      bought: ['It\'s yours. Weeds included, free of charge.', 'Sold. That dirt has been waiting for someone just like you. Desperate.'],
      broke: ['Dirt costs money. That\'s just economics.'],
      maxed: ['You own the whole farm. I work for you now, apparently. I\'m still sitting.'],
      rizz: [
        { level: 10, line: 'Water first, worry later. Thirsty crops sulk. Like you.' },
        { level: 20, line: 'Here, Moss seeds. Fell off a cart. A cart I was pushing. Into you.', gift: { seed: 'spore_b_gone_moss', count: 2 } },
        { level: 30, line: 'Ten percent off land. You talk nicer than the scarecrows.', gift: { discount: 0.10 } },
      ],
    },
    seeds: {
      name: 'Pip the Seed Seller', spot: { tx: 18, ty: 38 }, sprite: 'npc_seeds_map', portrait: 'npc_seeds', emoji: '🌰',
      greet: [
        'Seeds! Tiny, cheap, full of potential. Like you, minus the potential.',
        'Every great farm starts with one seed. And then about four hundred more.',
        'Plant them pointy end down. Or up. Honestly, they figure it out.',
      ],
      bought: ['Good choice. Water it. Talk to it. Lie to it about how big it\'s getting.', 'Seeds sold! No refunds once they sprout.'],
      broke: ['Even seeds cost something. Not much. More than you have.'],
      rizz: [
        { level: 10, line: 'Free seeds! They fell out of my pocket. Into your hand. Destiny!', gift: { seed: 'grumpleberry', count: 3 } },
        { level: 20, line: 'Chili seeds, on the house. Plant them far from your face.', gift: { seed: 'dragons_sneeze_chili', count: 2 } },
        { level: 30, line: 'Ten percent off seeds. For my favorite customer. You\'re my only customer.', gift: { discount: 0.10 } },
      ],
    },
    quest: {
      name: 'The Quest Board Keeper', spot: { tx: 20, ty: 9 }, sprite: 'npc_quest_map', portrait: 'npc_quest', emoji: '📜',
      greet: [
        'A HERO! At LAST! The village is in GRAVE danger! Well. Mild inconvenience.',
        'Destiny calls! It wants some mushrooms picked up.',
        'Every job on this board is a matter of LIFE and DEATH. Mostly paperwork.',
      ],
      taken: ['The fate of Foopville rests on you! Again! Somehow!', 'Go, brave soul! Try not to die! It\'s bad for paperwork!'],
      done: ['You DID it! I shall write a SONG! It will be short.', 'Legendary! Here\'s your reward. Don\'t spend it all on bad food.'],
      tooMany: ['Three quests at once is the LIMIT! I\'m worried about you! A normal amount!'],
      empty: ['Nothing on the board right now. Go level something and come back.'],
      rizz: [
        { level: 10, line: 'A hero with CHARM! Here, a TIP! A coin tip! Fifteen of them!', gift: { coins: 15 } },
        { level: 20, line: 'SECRET! The Pigeon Godfather comes after FIVE dead pigeons! COUNT your CRIMES!' },
        { level: 30, line: 'The village FUND! For YOU! It\'s mostly buttons. Some coins.', gift: { coins: 60 } },
      ],
    },
  },

  // Things you can use that aren't people (opened like a villager's panel). v0.41
  objects: {
    // The sawhorse beside the Carpenter: saw Bark into planks (data/place.js)
    sawhorse: { name: 'Sawhorse', emoji: '🪚', label: '🪚 Saw', spot: { tx: 13, ty: 16 },
      greet: ['A sawhorse. It has never once been ridden.', 'Bark goes in. Planks come out. Fingers stay on, ideally.', 'The Carpenter watches you saw. He is not impressed.'] },
    compost: { name: 'Compost Bin', portrait: 'vil_barrel', emoji: '🪣', label: 'Compost',
      greet: ['It smells like ambition. And rot. Mostly rot.', 'A bin of regret. Feed it your failures.', 'Your burnt food finally has a purpose.'] },
  },

  // Front doors (walk up to one you own to go inside and cook). Same order as data/house.js.
  doors: [{ tx: 5, ty: 16 }, { tx: 34, ty: 5 }, { tx: 34, ty: 26 }],

  interactDistance: 52,   // pixels: this close to a villager or door = you can talk / go in
  playerSpeed: 190,

  // ---------- Who sells what ----------
  // Blacksmith: weapon upgrades and armor. Shopkeeper: trinkets and ingredients,
  // and buys anything you own. Keys are ids from data/gear.js and data/ingredients.js.
  // Grouped by slot, then tier (G1). Each tier has a Sturdy / Light / Dapper piece. weapon_5 left the shop (boss drop later).
  smithStock: ['weapon_2', 'weapon_3', 'weapon_4',
    'bucket', 'leather_cap', 'headband', 'flat_cap', 'shroom_helm', 'goggles', 'top_hat', 'lord_helm', 'hood', 'monocle',
    'burlap_sack', 'padded_vest', 'tunic', 'waistcoat', 'bark_armor', 'duelist_coat', 'velvet_jacket', 'plate_armor', 'harness', 'suit',
    'trousers', 'kneepads', 'shorts', 'slacks', 'shin_guards', 'tights', 'dance_shoes', 'greaves', 'leggings', 'breeches'],
  shopTrinkets: ['lucky_acorn', 'mood_ring', 'lunchbox'],
  // Ingredients for sale: id -> price in coins (PLACEHOLDER prices; doubled in v0.43).
  shopIngredients: { rock_salt: 8, grumpleberry: 10, glowcap_mushroom: 12, bark: 8, dragons_sneeze_chili: 20, spore_b_gone_moss: 24 },
  ingredientSellPrice: { Common: 2, Uncommon: 5, Rare: 12 },  // fallback only: each ingredient has its own `sell` price in data/ingredients.js (v0.40)

  // ---------- Haggling (blueprint 10) ----------
  // Always on: every Rizz level = 1% off what you buy and 1% more for what you sell, up to 30%.
  fishBonus: 1.2,   // Gill pays this much more for raw fish than the Shopkeeper (+0.1 from his Rizz 20 secret)
  rizzDiscountPerLevel: 0.01,
  rizzDiscountMax: 0.30,
  // PLACEHOLDER: the Haggle button at the Shopkeeper. One try per visit to the village.
  haggle: {
    baseChance: 0.35,         // + Rizz chance from gear and level (same as in fights)
    perLevel: 0.03,
    winDiscount: 0.15,        // extra 15% off (and 15% more when selling) for this visit
    failMarkup: 0.10,         // prices 10% higher for this visit
    xp: 45,                   // Rizz XP for trying (win or lose). Was 15; tripled in v0.38.
  },

  // ---------- Chef Marrowbone's secret-recipe riddles (Refinement Phase 2) ----------
  // Pay for a riddle that hints at one secret recipe (data/recipes.js). Price = base + perLevel x the recipe's level.
  riddlePrice: { base: 20, perLevel: 4 },   // doubled in v0.43
  riddleHalfPriceRizz: 20,  // at this Rizz level Marrowbone charges half (blueprint 18.8)
  riddleRizzMult: 0.5,

  // ---------- Map look ----------
  ground: {
    pixelsPerSquare: 20,
    ...FUP.look.mood('village'),   // colours: data/look.js (dirt = cobbles)
    treeShade: 0.75,
    edgeWobble: 0.08,   // low = straight village streets
  },
  decorations: { deco_flowers: 0.10, deco_tuft: 0.06, bush: 0.01 },
  lilyPadChance: 0.3,
};
