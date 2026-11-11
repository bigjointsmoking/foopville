// ============================================================
// THE LANDLORD'S BASEMENT — the raid under the Deep Woods (blueprint 18.6).
// You climb down the hidden hole and walk 4 rooms, always in this order:
// fight → hazard → fight → hazard, picked each trip from the 6 below.
// Then the Landlord's Office (the boss), then the Eviction Chute home.
// One-way: no campfire, no heading home, no going back up.
//
// MAP KEY (each room is 20 squares wide and 14 rows tall):
//   #  wall (can't walk through)       .  floor
//   <  the door you came in (it slams shut behind you)
//   >  the door to the next room (fight rooms: locked until every enemy is beaten or charmed)
//   k  clutter: crates, boxes, washing machines (can't walk through)
//   t  a Tenant Shroom    s  a Spore Bouncer    m  a Mold Accountant
//   A  a hidden ambush: step on it and a group jumps you (see `ambush`). The door waits for it.
//   1 2 3  spore vents. Each number is a group; the groups puff one after another.
//   x  cracked floor: breaks a moment after you step on it
//   d  the Landlord's desk (can't walk through)    L  the Landlord himself
// Steam pipes (the Steam Hall) are listed under `pipes`: which row they swing across.
// Keep every letter reachable from "<". Check with: tests/raid_maps.js
// DRAFT rooms (blueprint 18.6 step 6): Jesus walks them, then sketches revisions.
// ============================================================
window.FUP = window.FUP || {};

FUP.raidData = {
  tileSize: 40,
  dropTier: 3,             // random gear drops use shop items up to tier 3 (G1)
  mult: 1.4,               // raid enemies: HP / ATK / DEF and their XP + coins x1.4 (not the Landlord)
  level: 14,               // Melee level the raid is meant for (enemy scaling, v0.41); the Landlord uses his own (15)
  order: ['fight', 'hazard', 'fight', 'hazard'],
  // Rule (Jesus, 2026-11-09): vents, falls and pipes never take you below 1 HP. Only fights can kill you.
  fog: { sight: 4.5, memory: 0.5 },   // hazard rooms only (fight rooms and the Office are lit)
  arriveGraceSeconds: 1.5, // enemies leave you alone this long after you walk in

  // Which letter is which enemy
  enemyLetters: { t: 'tenantShroom', s: 'sporeBouncer', m: 'moldAccountant' },
  // Tenant Shrooms you meet in the raid are worth something (the Landlord's summoned ones aren't)
  raidEnemy: { tenantShroom: { xp: 10, coins: 2 } },

  // Hidden ambush (the Laundry Room): like a Forest ambush side room
  ambush: {
    min: 2, max: 3,
    pool: { tenantShroom: 2, moldAccountant: 2, sporeBouncer: 1 },  // weights
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

  // Swinging steam pipes (the Steam Hall). Jesus, 2026-11-09: rent boxes are out, pipes are in.
  pipes: {
    damage: 0.08,      // PLACEHOLDER: -8% max HP per hit
    knockback: 1,      // squares back toward the door you came in (1 = onto the safe row between pipes)
    safeSeconds: 1,    // after a hit, pipes can't hit you again for this long
    hit: 26,           // pixels: this close to the swinging end = hit
  },

  landlordTouch: 44,   // pixels: this close to the Landlord = the boss fight

  // Colours for the basement (drawn in code). They come from the raid mood in data/look.js.
  colors: Object.fromEntries(Object.entries(FUP.look.moods.raid).map(([k, v]) => [k, FUP.look.num(v)])),

  // ---------- The 6 rooms (3 fight, 3 hazard) ----------
  rooms: {
    lobby: {
      name: 'The Lobby', kind: 'fight',
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
    unit2b: {
      name: 'Unit 2B', kind: 'fight',
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

  // ---------- The boss room ----------
  office: {
    name: "The Landlord's Office", kind: 'office',
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
