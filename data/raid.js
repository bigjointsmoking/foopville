// ============================================================
// THE OLD STOREHOUSE — the raid under the Deep Woods (blueprint 18.6).
// You climb down the hidden hole and walk 4 rooms, always in this order:
// fight → hazard → fight → hazard, picked each trip from the 6 below.
// Then the Guardian's Hall (the boss), then the Exit Chute home.
// One-way: no campfire, no heading home, no going back up.
//
// MAP KEY (each room is 20 squares wide and 14 rows tall):
//   #  wall (can't walk through)       .  floor
//   <  the door you came in (it slams shut behind you)
//   >  the door to the next room (fight rooms: locked until every enemy is beaten or charmed)
//   k  clutter: crates, boxes, washing machines (can't walk through)
//   t  a Stray Shroom    s  a Spore Bouncer    m  a Mold Accountant
//   A  a hidden ambush: step on it and a group jumps you (see `ambush`). The door waits for it.
//   1 2 3  spore vents. Each number is a group; the groups puff one after another.
//   x  cracked floor: breaks a moment after you step on it
//   d  the Guardian's desk (can't walk through)    L  the Guardian himself
// Steam pipes (the Steam Hall) are listed under `pipes`: which row they swing across.
// Keep every letter reachable from "<". Check with: tests/raid_maps.js
// DRAFT rooms (blueprint 18.6 step 6): Jesus walks them, then sketches revisions.
// ============================================================
window.FUP = window.FUP || {};

FUP.raidData = {
  tileSize: 40,
  dropTier: 3,             // random gear drops use shop items up to tier 3 (G1)

  // ---------- The shrine (story Phase C, v0.82; Jesus 2026-11-18) ----------
  // After you've beaten the Guardian once (v1.38: was after The Bowl, cut), leave a cooked dish at the old shrine in the Forest Edge and the Guardian comes up
  // to fight you there: the full boss, no raid. Once per day. More stars on the dish = better extra loot.
  // Rules: src/systems/shrine.js. All numbers PLACEHOLDERS.
  shrine: {
    region: 'edge', tx: 4, ty: 13,
    needFact: 'boss:guardian',               // v1.38 (Jesus): unlocks after your first Guardian win
    cooldownSeconds: 1200,                  // once every 20 minutes of PLAY (v0.86: was once per in-game day, and Sleep skipped days)
    coinsPerStar: 30,                       // extra coins: 30 per star
    matsPerStar: 1, mats: ['plank', 'nails', 'stone'],   // building materials: 1 per star, random
    gearAtStars: 4,                         // 4-5 stars: one extra gear roll (Rare or better)
    lines: {   // v1.38: no bowl, no "Quiet One" (cut). PLACEHOLDER wording
      locked: 'A mossy little shrine in the trees. Something big lives under these woods. You haven\'t met it yet.',
      fed: 'Your last dish is gone. Something down there is still chewing. Come back in {min} min.',
      noFood: 'The shrine wants a cooked dish. Your pockets disagree. Cook something first.',
      ask: 'You kneel at the shrine. Something far below goes very quiet. Which dish?',
      summon: 'The ground shudders. The dish is snatched down a crack. Then the crack gets bigger.',
    },
  },
  mult: 1.4,               // raid enemies: HP / ATK / DEF and their XP + coins x1.4 (not the Guardian)
  level: 14,               // Melee level the raid is meant for (enemy scaling, v0.41); the Guardian uses his own (15)
  order: ['fight', 'hazard', 'fight', 'hazard'],
  // Rule (Jesus, 2026-11-09): vents, falls and pipes never take you below 1 HP. Only fights can kill you.
  fog: { sight: 4.5, memory: 0.5 },   // hazard rooms only (fight rooms and the Office are lit)
  arriveGraceSeconds: 1.5, // enemies leave you alone this long after you walk in

  // Which letter is which enemy
  enemyLetters: { t: 'strayShroom', s: 'sporeBouncer', m: 'moldAccountant', q: 'storeSentry', j: 'storeSpear' },   // q j: the elders' store (v1.43)
  // Stray Shroom you meet in the raid are worth something (the Guardian's summoned ones aren't)
  raidEnemy: { strayShroom: { xp: 10, coins: 2 } },

  // Hidden ambush (the Laundry Room): like a Forest ambush side room
  ambush: {
    min: 2, max: 3,
    pool: { strayShroom: 2, moldAccountant: 2, sporeBouncer: 1 },  // weights
    gearChanceMult: 2,     // gear drop chance x2 for that fight
    noFleeTurns: 1,        // can't run on your first turn
    touch: 24,             // pixels from the spot
  },

  // Spore vents (the Boiler Room)
  vents: {
    every: 3,          // each group puffs every 3 seconds...
    groups: 3,         // ...one group after another (group 1, then 2, then 3, 1 second apart)
    hiss: 0.6,         // seconds of warning hiss before a puff
    puff: 0.5,         // seconds a puff hangs in the air
    reach: 1,          // squares around the vent the puff covers (1 = the vent + the 8 around it)
    damage: 0.05,      // -5% max HP (Poison resist from gear or a dish eaten in this room cuts it)
    sporedMax: 3,      // each puff = +1 Spored; you start the next fight with that many Poison stacks
  },

  // Crumbling floor (the Rotten Stairwell)
  floor: {
    delay: 0.6,        // seconds after you step on a cracked tile before it breaks
    damage: 0.10,      // fall = -10% max HP, back to the entrance, the floor fixes itself
  },

  // Swinging steam pipes (the Steam Hall). Jesus, 2026-11-09: coin boxes are out, pipes are in.
  pipes: {
    damage: 0.08,      // PLACEHOLDER: -8% max HP per hit
    knockback: 1,      // squares back toward the door you came in (1 = onto the safe row between pipes)
    safeSeconds: 1,    // after a hit, pipes can't hit you again for this long
    hit: 26,           // pixels: this close to the swinging end = hit
  },

  guardianTouch: 44,   // pixels: this close to the Guardian = the boss fight

  // Colours for the basement (drawn in code). They come from the raid mood in data/look.js.
  colors: Object.fromEntries(Object.entries(FUP.look.moods.raid).map(([k, v]) => [k, FUP.look.num(v)])),
  get baseColors() { return Object.fromEntries(Object.entries(FUP.look.moods.raid).map(([k, v]) => [k, FUP.look.num(v)])); },   // (v1.43) the raid's own, when you leave the store

  // ---------- The 6 rooms (3 fight, 3 hazard) ----------
  rooms: {
    entry: {
      name: 'The Entry Hall', kind: 'fight',
      map: [
        '#########>##########',
        '#..................#',
        '#..k...........k...#',
        '#........s.........#',
        '#..................#',
        '#...t.........t....#',
        '#......kk..........#',
        '#......kk.....t....#',
        '#..................#',
        '#..k...........k...#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#########<##########',
      ],
    },
    storeroom: {
      name: 'The Store Room', kind: 'fight',
      map: [
        '##########>#########',
        '#........#.........#',
        '#.m......#......m..#',
        '#........#.........#',
        '####.#########.#####',
        '#..................#',
        '#...m..............#',
        '#####.######.#######',
        '#..................#',
        '#.........m........#',
        '#.......####.......#',
        '#..................#',
        '#..................#',
        '#########<##########',
      ],
    },
    laundry: {
      name: 'The Laundry Room', kind: 'fight',
      map: [
        '#########>##########',
        '#..................#',
        '#.kk..t....s...kk..#',
        '#..................#',
        '#..................#',
        '#.kk.....A.....kk..#',
        '#..................#',
        '#..m...........t...#',
        '#.kk...........kk..#',
        '#..................#',
        '#.kk...........kk..#',
        '#..................#',
        '#..................#',
        '#########<##########',
      ],
    },
    boiler: {
      name: 'The Boiler Room', kind: 'hazard', hazard: 'vents',
      map: [
        '#########>##########',
        '#.......#..#.......#',
        '#..3....#..#....3..#',
        '#.......#..#.......#',
        '#..................#',
        '#.2....2....2....2.#',
        '#..................#',
        '##.###########.#####',
        '#..................#',
        '#..1....1....1...1.#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#########<##########',
      ],
    },
    stairwell: {
      name: 'The Rotten Stairwell', kind: 'hazard', hazard: 'floor',
      map: [
        '##########>#########',
        '#....xxxxx.xxxxx...#',
        '#....xxxxxxxxxxx...#',
        '#xxxxxxx....xxxxxxx#',
        '#xxxxxxx....xxxxxxx#',
        '#...xxxxxxxxxxxx...#',
        '#...xxxxxxxxxxxx...#',
        '#xxxxxx..xxxx..xxxx#',
        '#xxxxxx..xxxx..xxxx#',
        '#..xxxxxxxxxxxxxx..#',
        '#..xxxxxxxxxxxxxx..#',
        '#xxxxxxxx...xxxxxxx#',
        '#..................#',
        '#########<##########',
      ],
    },
    steamhall: {
      name: 'The Steam Hall', kind: 'hazard', hazard: 'pipes',
      // Each pipe swings across one row. seconds = one full swing there and back; offset = head start.
      pipes: [
        { row: 2, seconds: 2.4, offset: 0.0 },
        { row: 4, seconds: 2.0, offset: 0.9 },
        { row: 6, seconds: 2.8, offset: 0.4 },
        { row: 8, seconds: 2.2, offset: 1.5 },
        { row: 10, seconds: 2.6, offset: 0.7 },
      ],
      map: [
        '#########>##########',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#####..........#####',
        '#########<##########',
      ],
    },
  },

  // ============================================================
  // THE ELDERS' STORE (v1.43, archive/plans-done/MQ1.md MQ1-A; story/MAIN_QUEST_LINE.md 2c): behind the iron door in the Guardian's Hall.
  // Main Quest 1 "The Quiet Room": beat the Guardian while the quest is on (or after it's done: the door stays open for that life)
  // and the results screen offers the iron door beside the Exit Chute. Three rooms in this order (fight, hazard, fight),
  // one-way, tuned for Melee ~30, own colours (data/look.js store). MQ1-B adds the boss and the quiet room after them;
  // until then the far door is shut and a chute takes you home. Maps, numbers and lines PLACEHOLDERS.
  // Map letters as in the raid; q = Store Sentry group, j = Store Spearguard group.
  // ============================================================
  store: {
    mult: 1.0, level: 30, dropTier: 4,      // the guards are built for Melee ~30 already (data/enemies.js)
    doorButton: '🗝️ The iron door',
    order: ['storeGuards', 'storeBeams', 'storeLine', 'storeHall', 'storeQuiet'],   // v1.44 (MQ1-B): + the guardian's hall and the quiet room
    rooms: {
      storeGuards: {
        name: 'The Guard Room', kind: 'fight', enterLine: 'storeEnter',
        groups: {
          storeSentry: [{ w: 1, foes: ['storeSentry', 'storeSentry'] }, { w: 1, foes: ['storeSentry', 'storeSentry', 'storeSentry'] }],
        },
        map: [
          '#########>##########',
          '#..................#',
          '#..k...........k...#',
          '#........q.........#',
          '#..................#',
          '#..................#',
          '#....kk......kk....#',
          '#....kk......kk....#',
          '#..................#',
          '#...q..........q...#',
          '#..................#',
          '#..k...........k...#',
          '#..................#',
          '#########<##########',
        ],
      },
      storeBeams: {
        name: 'The Beam Corridor', kind: 'hazard', hazard: 'pipes', beams: true, hit: 34, hazardLine: 'raidHazard_beams', hitLine: 'raidBeam',
        // Each beam swings across one row: slower and wider than the Steam Hall's pipes.
        pipes: [
          { row: 2, seconds: 3.4, offset: 0.0 },
          { row: 5, seconds: 3.8, offset: 1.3 },
          { row: 8, seconds: 3.2, offset: 0.6 },
          { row: 11, seconds: 4.0, offset: 2.0 },
        ],
        map: [
          '#########>##########',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '####............####',
          '#########<##########',
        ],
      },
      storeLine: {
        name: 'The Spear Room', kind: 'fight',
        groups: {
          storeSentry: [{ w: 1, foes: ['storeSpear', 'storeSentry', 'storeSentry'] }],
          storeSpear: [{ w: 1, foes: ['storeSpear', 'storeSentry'] }],
        },
        map: [
          '#########>##########',
          '#..................#',
          '#..kk..........kk..#',
          '#..kk....j.....kk..#',
          '#..................#',
          '#..................#',
          '#..................#',
          '#.....q......q.....#',
          '#..................#',
          '#..................#',
          '#..k............k..#',
          '#..................#',
          '#..................#',
          '#########<##########',
        ],
      },
      // v1.44 (MQ1-B): the boss hall. The store's guardian ("L") stays beaten for that life once you've won (bossOnce).
      storeHall: {
        name: 'The Guardian\'s Gallery', kind: 'office', boss: 'storeWarden', bossOnce: true, enterLine: 'wardenStart',
        map: [
          '#########>##########',
          '#..................#',
          '#.kk............kk.#',
          '#..................#',
          '#........L.........#',
          '#..................#',
          '#.kk............kk.#',
          '#..................#',
          '#..................#',
          '#.kk............kk.#',
          '#..................#',
          '#..................#',
          '#..................#',
          '#########<##########',
        ],
      },
      // v1.44 (MQ1-B): the quiet room. No fights. Walk up to each paper and the narrator reads it (wording approved:
      // plans/MQ1_documents_draft.md). The box under the reading stand holds the Sealed Page (spell piece 1) and the
      // first primer page (both kept like spell pieces). Its far side: a chute home. Spots PLACEHOLDERS.
      storeQuiet: {
        name: 'The Quiet Room', kind: 'quiet', enterLine: 'quietEnter',
        lore: [
          { tx: 3, ty: 2, text: 'To the people of the village. For a long time now you have slept safe, and you have not known why. We have spoken with her. She is not what you fear. There is an agreement, and it has held. We will tell you everything when the work is done. Not before. Forgive us the wait. (Unsigned. The bottom corner has been folded and unfolded until it tore.)', after: 'quietNotice' },
          { tx: 9, ty: 5, text: 'Again we agree to wait. Again I say they should hear it from us, and not guess it. If they learn of her by fire, they will never learn anything else. Nobody listens.' },
          { tx: 15, ty: 5, text: 'It is not finished, and it is not safe while it is unfinished. Kept together, one mistake undoes all of it. Kept apart, a mistake costs only a piece. We part it, then. Each piece to its own keeping. Some to people we trust, some behind things we build. The first stays here, with these papers, where the door can be locked.' },
          { tx: 16, ty: 10, text: 'The second piece: with the iron-workers in the north. (Then the page is torn. Something chewed it, a long time ago.)' },
          { tx: 9, ty: 9, text: 'The first lesson. Before anything is made, it must be felt. Put your hand near something warm with it and wait. Do not reach for it. Let it come to you. (The rest of the lesson is on pages you don\'t have.)' },
          { tx: 10, ty: 10, box: true, text: 'A small box under the reading stand. Inside: a page of tight, careful writing under a wax seal that will not lift. It hums, very faintly, like the staff.', emptyText: 'The box under the reading stand. Empty: the Sealed Page is with you.' },
        ],
        props: [{ tx: 3, ty: 1, sprite: 'prop_notice' }, { tx: 8, ty: 4, sprite: 'prop_desk' }, { tx: 15, ty: 4, sprite: 'prop_desk_small' }, { tx: 16, ty: 11, sprite: 'prop_torn_list' }, { tx: 9, ty: 8, sprite: 'prop_reading_stand' }],
        map: [
          '#########>##########',
          '#..................#',
          '#..................#',
          '#..................#',
          '#.......kk.....k...#',
          '#..................#',
          '#..................#',
          '#..................#',
          '#........k.........#',
          '#..................#',
          '#..................#',
          '#..................#',
          '#..................#',
          '#########<##########',
        ],
      },
    },
    endLine: 'storeEnd',
    piece: 'mainQuest1', primer: 'primer:1',   // (v1.44) what the quiet room's box gives (data/spell.js)
    colors: Object.fromEntries(Object.entries(FUP.look.moods.store).map(([k, v]) => [k, FUP.look.num(v)])),
  },

  // ---------- The boss room ----------
  office: {
    name: "The Guardian's Hall", kind: 'office',
    // v1.38 (Jesus 2026-11-26): the Vault is gone; the iron door stays shut until Main Quest 1 ("The Quiet Room"). Line PLACEHOLDER.
    lore: [{ tx: 3, ty: 4, text: 'An iron door behind the Guardian\'s desk. It doesn\'t open. Not yet.', openText: 'The iron door behind the Guardian\'s desk. Gran\'s key fits it. Beat the Guardian and it\'s yours.' }],   // (v1.44) openText while Main Quest 1 is on / done. PLACEHOLDER
    map: [
      '####################',
      '#..................#',
      '#.kk...ddddd....kk.#',
      '#..................#',
      '#........L.........#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#..................#',
      '#########<##########',
    ],
  },
};
