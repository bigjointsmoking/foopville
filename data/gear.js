// ============================================================
// GEAR — armor, weapon upgrades and trinkets (blueprint 18.3).
// 5 slots: weapon, head, body, legs, trinket.
//
// stats you can put on an item:
//   atk, def, hp       flat bonus
//   spd                % faster turns (0.10 = +10%)
//   crit               extra crit chance (0.03 = +3%)
//   rizz               extra Rizz success (0.10 = +10%)
//   heal               extra healing from food (0.10 = +10%)
//   resistPoison / resistFire   less damage of that kind (0.15 = -15%)
//   rentLess           less coin lost to rent/theft (0.10 = -10%)
//   satchel            extra satchel slots
// price = coins in the shop (v0.41: every price doubled; v0.43: x3 again, Jesus). starter = you begin each life wearing it.
// v0.58 (G1): tiers, wear levels, 3 armor cuts, boss chase drops. Random drops only use items up to the region's dropTier.
// ============================================================
window.FUP = window.FUP || {};

FUP.gearData = {
  slots: ['weapon', 'head', 'body', 'legs', 'trinket'],
  slotNames: { weapon: 'Weapon', head: 'Head', body: 'Body', legs: 'Legs', trinket: 'Trinket' },
  slotEmoji: { weapon: '⚔️', head: '🪖', body: '👕', legs: '👖', trinket: '💍' },
  cutNames: { sturdy: 'Sturdy', light: 'Light', dapper: 'Dapper' },

  // ---------- The shop's fixed items ----------
  // tier: 1-5 (design/gear.md 1). req: what you need to WEAR it (you can still buy it early: it waits in your stuff).
  //   Armor: Combat level 10 / 20 / 30 for tiers 2 / 3 / 4. Weapon upgrades: Melee 10 / 20 / 30. Trinkets: none.
  // cut: the armor's style (the builds): sturdy = tank, light = glass cannon, dapper = charm.
  // chase: a boss-only drop (bossDrops below): never sold, never a random drop, sells for 250. effect: its special power (effects below).
  items: {
    // Weapon upgrades: they upgrade whichever weapon you picked (name changes with it).
    weapon_2: { slot: 'weapon', tier: 2, names: { sword: 'Decent Sword', pan: 'Cast-Iron Pan', chicken: 'Squeakier Chicken' }, emoji: '🗡️', stats: { atk: 3 }, price: 480, req: { skills: { melee: 10 } } },
    weapon_3: { slot: 'weapon', tier: 3, names: { sword: 'Suspiciously Shiny Sword', pan: "Grandma's Pan", chicken: 'Golden Rubber Chicken' }, emoji: '🗡️', stats: { atk: 6 }, price: 1320, req: { skills: { melee: 20 } } },
    weapon_4: { slot: 'weapon', tier: 4, names: { sword: 'Sword of Mild Renown', pan: 'The Dutch Oven of Doom', chicken: 'Rubber Chicken, Platinum Edition' }, emoji: '⚔️', stats: { atk: 10 }, price: 4200, req: { skills: { melee: 30 } } },
    // Tier 5: not in the shop any more (G1). The Leftover King will drop it.
    weapon_5: { slot: 'weapon', tier: 5, chase: true, names: { sword: 'Blade That Has Read Your Reviews', pan: 'Pan of the Five Kitchens', chicken: 'The Squeak Heard Round the World' }, emoji: '⚔️', stats: { atk: 15 }, price: 10800, req: { skills: { melee: 40 } } },

    // ----- Head -----
    bucket:      { slot: 'head', tier: 1, cut: 'sturdy', name: 'Bucket', emoji: '🪣', stats: { def: 2 }, price: 180 },
    leather_cap: { slot: 'head', tier: 2, cut: 'sturdy', name: 'Leather Cap', emoji: '🧢', stats: { def: 3, hp: 5 }, price: 420, req: { combat: 10 } },
    headband:    { slot: 'head', tier: 2, cut: 'light',  name: 'Headband of Trying', emoji: '🎽', stats: { def: 1, crit: 0.03 }, price: 420, req: { combat: 10 } },
    flat_cap:    { slot: 'head', tier: 2, cut: 'dapper', name: 'Flat Cap', emoji: '🧢', stats: { def: 1, rizz: 0.06 }, price: 420, req: { combat: 10 } },
    shroom_helm: { slot: 'head', tier: 3, cut: 'sturdy', name: 'Mushroom Cap Helmet', emoji: '🍄', stats: { def: 4, resistPoison: 0.15 }, price: 900, req: { combat: 20 } },
    goggles:     { slot: 'head', tier: 3, cut: 'light',  name: 'Squint Goggles', emoji: '🥽', stats: { def: 2, crit: 0.05 }, price: 900, req: { combat: 20 } },
    top_hat:     { slot: 'head', tier: 3, cut: 'dapper', name: 'Top Hat (Slightly Sat On)', emoji: '🎩', stats: { def: 2, rizz: 0.10 }, price: 900, req: { combat: 20 } },
    lord_helm:   { slot: 'head', tier: 4, cut: 'sturdy', name: 'Landlord-Proof Helm', emoji: '⛑️', stats: { def: 7, hp: 15, resistPoison: 0.15 }, price: 3300, req: { combat: 30 } },
    hood:        { slot: 'head', tier: 4, cut: 'light',  name: 'Hood of Bad Intentions', emoji: '🥷', stats: { def: 4, crit: 0.08, spd: 0.04 }, price: 3300, req: { combat: 30 } },
    monocle:     { slot: 'head', tier: 4, cut: 'dapper', name: 'Monocle of Judgement', emoji: '🧐', stats: { def: 3, rizz: 0.15 }, price: 3300, req: { combat: 30 } },

    // ----- Body -----
    burlap_sack:   { slot: 'body', tier: 1, cut: 'sturdy', name: 'Burlap Sack', emoji: '🛍️', stats: { def: 3 }, price: 240 },
    padded_vest:   { slot: 'body', tier: 2, cut: 'sturdy', name: 'Padded Vest', emoji: '🦺', stats: { def: 5 }, price: 540, req: { combat: 10 } },
    tunic:         { slot: 'body', tier: 2, cut: 'light',  name: 'Sleeveless Tunic', emoji: '🎽', stats: { def: 2, atk: 2 }, price: 540, req: { combat: 10 } },
    waistcoat:     { slot: 'body', tier: 2, cut: 'dapper', name: 'Waistcoat', emoji: '🦺', stats: { def: 2, rizz: 0.06 }, price: 540, req: { combat: 10 } },
    bark_armor:    { slot: 'body', tier: 3, cut: 'sturdy', name: 'Bark Armor', emoji: '🪵', stats: { def: 8, spd: -0.05 }, price: 1200, req: { combat: 20 } },
    duelist_coat:  { slot: 'body', tier: 3, cut: 'light',  name: "Duelist's Coat", emoji: '🧥', stats: { def: 4, atk: 4 }, price: 1200, req: { combat: 20 } },
    velvet_jacket: { slot: 'body', tier: 3, cut: 'dapper', name: 'Velvet Jacket', emoji: '🧥', stats: { def: 4, rizz: 0.10 }, price: 1200, req: { combat: 20 } },
    plate_armor:   { slot: 'body', tier: 4, cut: 'sturdy', name: 'Questionably Legal Plate', emoji: '🛡️', stats: { def: 13, hp: 20, spd: -0.05 }, price: 5400, req: { combat: 30 } },
    harness:       { slot: 'body', tier: 4, cut: 'light',  name: 'Harness of Recklessness', emoji: '🦺', stats: { def: 6, atk: 7, crit: 0.04 }, price: 5400, req: { combat: 30 } },
    suit:          { slot: 'body', tier: 4, cut: 'dapper', name: 'Suit of Unearned Confidence', emoji: '👔', stats: { def: 6, rizz: 0.15, rentLess: 0.10 }, price: 5400, req: { combat: 30 } },

    // ----- Legs -----
    pants:       { slot: 'legs', tier: 1, cut: 'sturdy', name: 'Pants', emoji: '👖', stats: { def: 1 }, price: 0, starter: true, note: 'At least you have pants.' },
    trousers:    { slot: 'legs', tier: 1, cut: 'sturdy', name: 'Sturdy Trousers', emoji: '👖', stats: { def: 3 }, price: 360 },
    kneepads:    { slot: 'legs', tier: 2, cut: 'sturdy', name: 'Knee Pads of Caution', emoji: '🦵', stats: { def: 4, hp: 5 }, price: 720, req: { combat: 10 } },
    shorts:      { slot: 'legs', tier: 2, cut: 'light',  name: 'Running Shorts', emoji: '🩳', stats: { def: 1, spd: 0.10 }, price: 720, req: { combat: 10 } },
    slacks:      { slot: 'legs', tier: 2, cut: 'dapper', name: 'Pressed Slacks', emoji: '👖', stats: { def: 2, rizz: 0.05 }, price: 720, req: { combat: 10 } },
    shin_guards: { slot: 'legs', tier: 3, cut: 'sturdy', name: 'Shin Guards', emoji: '🦿', stats: { def: 5, hp: 8 }, price: 1100, req: { combat: 20 } },
    tights:      { slot: 'legs', tier: 3, cut: 'light',  name: 'Sprinting Tights', emoji: '🩲', stats: { def: 2, spd: 0.14 }, price: 1100, req: { combat: 20 } },
    dance_shoes: { slot: 'legs', tier: 3, cut: 'dapper', name: 'Dancing Shoes', emoji: '👞', stats: { def: 2, rizz: 0.08, spd: 0.05 }, price: 1100, req: { combat: 20 } },
    greaves:     { slot: 'legs', tier: 4, cut: 'sturdy', name: 'Greaves of Strategic Retreat', emoji: '🦿', stats: { def: 6, spd: 0.08 }, price: 3600, req: { combat: 30 } },
    leggings:    { slot: 'legs', tier: 4, cut: 'light',  name: 'Leggings of Leaving Early', emoji: '🩳', stats: { def: 3, spd: 0.18, crit: 0.03 }, price: 3600, req: { combat: 30 } },
    breeches:    { slot: 'legs', tier: 4, cut: 'dapper', name: 'Silk Breeches', emoji: '👖', stats: { def: 3, rizz: 0.12, spd: 0.05 }, price: 3600, req: { combat: 30 } },

    // ----- Trinkets (no tier rules) -----
    lucky_acorn: { slot: 'trinket', tier: 1, name: 'Lucky Acorn', emoji: '🌰', stats: { crit: 0.03 }, price: 360 },
    mood_ring:   { slot: 'trinket', tier: 1, name: 'Mood Ring', emoji: '💍', stats: { rizz: 0.10 }, price: 540 },
    lunchbox:    { slot: 'trinket', tier: 1, name: 'Lunchbox', emoji: '🍱', stats: { satchel: 3 }, price: 900 },

    // ----- Boss chase drops (bossDrops below). sell 250 each. -----
    pigeon_pin:      { slot: 'trinket', tier: 3, chase: true, name: 'Pigeon Diplomacy Pin', emoji: '🐦', stats: { rizz: 0.05 }, effect: 'pigeonDiplomacy', price: 0 },
    master_key:      { slot: 'trinket', tier: 3, chase: true, name: 'Master Key', emoji: '🗝️', stats: { crit: 0.05 }, effect: 'rentImmune', price: 0 },
    mycelium_mantle: { slot: 'body', tier: 3, chase: true, name: 'Mycelium Mantle', emoji: '🍄', stats: { def: 9, hp: 15, resistPoison: 0.30 }, effect: 'thorns', price: 0, req: { combat: 15 } },
  },

  // ---------- Boss chase tables (design/gear.md 4) ----------
  // Every kill rolls each row on its own: rate = chance, pity = guaranteed after this many kills without it.
  // key = a gear item above; hat = a cosmetic hat (data/cosmetics.js); place = a trophy for your plot (data/place.js). Dry counts are facts 'dry:<boss>:<id>'.
  bossDrops: {
    godfather: [{ key: 'pigeon_pin', rate: 1 / 8, pity: 16 }, { hat: 'don_fedora', rate: 1 / 20, pity: 40 }, { place: 'golden_perch', rate: 1 / 30, pity: 60 }],
    landlord:  [{ key: 'master_key', rate: 1 / 8, pity: 16 }, { key: 'mycelium_mantle', rate: 1 / 12, pity: 24 }, { hat: 'landlord_cap', rate: 1 / 20, pity: 40 }, { place: 'framed_notice', rate: 1 / 30, pity: 60 }],
  },
  chaseSell: 250,

  // ---------- Special powers on chase items (design/gear.md 5) ----------
  effects: {
    pigeonDiplomacy: { name: 'Pigeon Diplomacy', text: 'Pigeons start every fight with -50% ATK.', atk: 0.5 },
    rentImmune:      { name: "Landlord's Spare Key", text: 'Immune to rent theft.' },
    thorns:          { name: 'Spore Cloak', text: 'Whoever hits you takes 20% of that damage.', share: 0.2 },   // never finishes off a boss
  },

  // ---------- Random drops ----------
  dropChance: { normal: 0.10, boss: 1.0 },          // normal enemies 10%, the Landlord always
  rarities: [                                        // rolled in order; bosses skip below `bossMin`
    { name: 'Common',    chance: 0.60, bonuses: 0, color: '#a3a3a3', sell: 10 },
    { name: 'Uncommon',  chance: 0.28, bonuses: 1, color: '#8be06a', sell: 30 },
    { name: 'Rare',      chance: 0.10, bonuses: 2, color: '#6ab4ff', sell: 80 },
    { name: 'Epic',      chance: 0.02, bonuses: 3, color: '#f2b84b', sell: 250 },   // was 'Legendary' (now = boss chase items)
  ],
  bossMin: 'Rare',
  sellShare: 0.5,                                    // shop items sell back for half price

  // Bonus words. A drop gets a prefix and/or suffix for each bonus it has.
  prefixes: [
    { word: 'Stabby',        stat: 'atk',          min: 2,    max: 4 },
    { word: 'Sturdy',        stat: 'def',          min: 2,    max: 4 },
    { word: 'Hasty',         stat: 'spd',          min: 0.05, max: 0.08 },
    { word: 'Chonky',        stat: 'hp',           min: 8,    max: 15 },
    { word: 'Slightly Damp', stat: 'resistFire',   min: 0.15, max: 0.15 },
  ],
  suffixes: [
    { word: 'of Mild Confidence',      stat: 'rizz',         min: 0.05, max: 0.08 },
    { word: 'of Questionable Hygiene', stat: 'crit',         min: 0.02, max: 0.04 },
    { word: 'of Second Helpings',      stat: 'heal',         min: 0.10, max: 0.10 },
    { word: 'of Not Today',            stat: 'resistPoison', min: 0.15, max: 0.15 },
    { word: 'of the Tax-Exempt',       stat: 'rentLess',     min: 0.10, max: 0.10 },
  ],
};
