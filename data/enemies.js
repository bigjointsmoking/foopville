// ============================================================
// ENEMIES — stats and move lists.
// weight  = how often a move gets picked (higher = more often).
// tell    = the icon shown above the enemy BEFORE it uses that move.
// resolve = how hard it is to Rizz (0.10 = -10% to your Rizz chance).
// weak / resists = elements: 'fire', 'frost', 'poison', 'acid'.
//   Weak = takes x1.5 from thrown dishes of that element. Resist = x0.5.
// noCharm = Charm doesn't work (Roast still does).
// coins   = coins you get for beating it. size = how big the emoji is drawn.
// sprite / mapSprite = Blender pictures for fights / the Forest (art/fupville_art.py).
// signature = its one special trick (Refinement Phase 3, approved by Jesus 2026-11-09):
//   a tell icon warns you, and there's a way to beat it. Rules: src/scenes/BattleSkills.js.
// spd     = only matters for SPD buffs now. Every fighter gets a turn every
//           balance.turnSeconds, so enemies are never faster than you.
// Balance (v0.39, approved by Jesus 2026-11-10): each area is tuned for the Melee level you'll have there
// on a first trip: Forest Edge 1-5, Toll Road 5-9, Deep Woods 9-13, raid 13-15, Landlord ~15.
// Pressing only Attack (no food, no blocks) you should lose about: squirrel 15%, pigeon flock 25%,
// goblin 30%, raid enemies 5-40%, the Godfather ~100% and the Landlord ~110% (those two need food and skills).
// ============================================================
window.FUP = window.FUP || {};

FUP.enemies = {
  squirrel: {
    name: 'Disgruntled Squirrel', emoji: '🐿️', size: 104, sprite: 'squirrel', mapSprite: 'squirrel_map',
    maxHp: 18, atk: 6, def: 1, spd: 14, resolve: 0.10,   // v0.41: ATK 5 -> 6   // v0.39: was 28 HP / 7 ATK (Jesus: way too strong; easy early enemy)
    xp: 35, coins: 6, boss: false, weak: 'fire', resists: [], // v0.40: coins 10 -> 6, weak to fire (nothing in the game was frost)
    moves: [
      { name: 'Aggressive Nibble', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Acorn Barrage', type: 'attack', power: 1.5, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Snack Heist', type: 'steal', power: 0.5, tell: '🎒', tellText: 'Eyeing your snacks', weight: 2 },
      { name: 'Furious Chittering', type: 'buff', stat: 'atk', mult: 1.25, turns: 2, label: 'Fired up',
        tell: '📈', tellText: 'Powering up', weight: 1 },
    ],
    // Hoarder: after stealing a dish it eats it on its next turn (heals + gets the dish's buffs).
    // Hit it before then and it drops your snack.
    signature: { id: 'hoarder',
      eatMove: { name: 'Snack Time', type: 'eatStolen', tell: '🍽️', tellText: 'Eating YOUR snack (hit it!)' } },
  },

  // Summoned by the Landlord in Phase 1. Blueprint 18.2.
  tenantShroom: {
    name: 'Tenant Shroom', emoji: '🍄', size: 64, sprite: 'tenant', mapSprite: 'tenant_map',
    maxHp: 18, atk: 6, def: 2, spd: 9, resolve: 0, noCharm: true,
    xp: 0, coins: 0, boss: false, minion: true, weak: 'fire', resists: ['poison'],
    moves: [
      { name: 'Spore Puff', type: 'attack', power: 0.8, poison: 1, tell: '☠️', tellText: 'Spore Puff', weight: 1 },
    ],
    // Paying Rent: every living Tenant heals the Landlord healPct of his max HP on each of his turns.
    signature: { id: 'rent', healPct: 0.03 },
  },

  // THE BOSS. Blueprint section 12 + 18.2.
  // maxHp: the blueprint says 300. PLACEHOLDER 180 until gear exists,
  // because at Melee level 1 with no gear your hits only do ~3-4 damage.
  landlord: {
    name: 'The Mushroom Landlord', emoji: '🍄', hat: '🎩', size: 150, sprite: 'landlord', mapSprite: 'landlord_map',
    maxHp: 180, atk: 11, def: 6, spd: 11, resolve: 0.50, noCharm: true, level: 15,   // level: for enemy scaling (v0.41)   // v0.39: ATK was 12
    xp: 300, coins: 150, boss: true, weak: 'fire', resists: ['poison'],
    // His everyday moves. PLACEHOLDER names and numbers (the blueprint only names his phase moves).
    moves: [
      { name: 'Eviction Notice', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Rent Hike', type: 'attack', power: 1.7, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Property Inspection', type: 'buff', stat: 'def', mult: 1.3, turns: 2, label: 'Inspecting',
        tell: '🛡️', tellText: 'Raising DEF', weight: 1 },
    ],
    bossRules: {
      // He moves to the next phase when his HP drops below `below` (0.66 = 66%).
      phases: [
        { name: 'Open House',   below: 1.00 },
        { name: 'Spore Season', below: 0.66 },
        { name: "Rent's Due",   below: 0.33 },
      ],
      // Phase 1: summon a Tenant Shroom every 3 of his turns (max 3 on the field).
      summonEvery: 3, maxMinions: 3, minion: 'tenantShroom',
      // Phase 2: you gain 1 Poison stack every one of his turns.
      poisonPerTurn: 1,
      // Phase 3: every 3 of his turns he takes 10% of your coins (and hits you).
      rentEvery: 3, rentTake: 0.10,
      // Fever Dream: once per phase, on his 2nd turn in that phase. Lasts 3 of YOUR turns.
      feverOnTurn: 2, feverTurns: 3, fakes: 2,
      // Final Notice (Refinement Phase 3): once per phase, on his `onTurn`-th turn he serves it.
      // After `countdown` of his moves: EVICTION, a x3 hit. Deal `contestPct` of his max HP
      // before then to Contest it (cancelled, and his turn bar drops to `contestGauge`).
      // Or Defend as it lands (Perfect Block).
      notice: { onTurn: 4, countdown: 3, contestPct: 0.15, contestGauge: -50,
        serve: { name: 'Final Notice', type: 'notice', tell: '📜', tellText: 'Serving a Final Notice' },
        evict: { name: 'EVICTION', type: 'attack', power: 3.0, eviction: true, tell: '💥', tellText: 'EVICTION! (Defend!)' } },
      special: {
        summon: { name: 'Open House', type: 'summon', tell: '🍄', tellText: 'Calling tenants' },
        rent:   { name: "Rent's Due", type: 'rent', power: 0.8, tell: '💰', tellText: 'Collecting rent' },
        fever:  { name: 'Fever Dream', type: 'fever', tell: '🌀', tellText: 'Something is wrong' },
      },
    },
  },
  // ---------- Moss Goblin Tax Collector (blueprint 18.2) ----------
  // Touch him on the map and he asks for a toll first (data/forest.js `toll`).
  // Pay = no fight. Rizz = haggle it down (fail = fight him Enraged). Refuse = fight him Enraged.
  // lateFee: hits for `power` and takes `steal` of the coins you carry.
  goblin: {
    name: 'Moss Goblin Tax Collector', emoji: '🧌', size: 104, sprite: 'goblin', mapSprite: 'goblin_map',
    maxHp: 40, atk: 6.5, def: 3, spd: 10, resolve: -0.15,   // negative resolve = easy to Rizz. v0.39: was 55 / 8 / 4
    xp: 45, coins: 15, boss: false, weak: 'acid', resists: ['frost'],
    moves: [
      { name: 'Ledger Smack', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Surprise Audit', type: 'attack', power: 1.5, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Late Fee', type: 'lateFee', power: 0.6, steal: 0.05, tell: '🪙', tellText: 'Eyeing your coins', weight: 2 },
      { name: 'Ledger Shield', type: 'ledger', tell: '📒', tellText: 'Raising his ledger', weight: 2 },
    ],
    // Ledger Shield: blocks your next plain Attack (0 damage). A Skill or a Throw rips it and stuns him.
    signature: { id: 'ledger' },
  },

  // ---------- Pigeon With a Grudge (blueprint 18.2) ----------
  // Always in flocks (data/forest.js `flock`). pigeon: true = counts as a pigeon for
  // Coo Menacingly, the revenge rule and Pigeon Diplomacy.
  // rally: every pigeon in the fight gets the buff (Godfather included).
  pigeon: {
    name: 'Pigeon With a Grudge', emoji: '🐦', size: 72, sprite: 'pigeon', mapSprite: 'pigeon_map',
    maxHp: 15, atk: 3.5, def: 1, spd: 16, resolve: 0.20, pigeon: true,   // v0.41: HP 10 -> 15 (Jesus: too easy)   // v0.39: was 14 HP / 5 ATK
    xp: 15, coins: 3, boss: false, weak: 'fire', resists: [],   // v0.40: coins 2 -> 3
    moves: [
      { name: 'Peck', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Dive Bomb', type: 'attack', power: 1.5, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Coo Menacingly', type: 'rally', stat: 'atk', mult: 1.2, turns: 2, label: 'Cooing',
        tell: '📈', tellText: 'Rallying the flock', weight: 1 },
    ],
    // Formation!: with 2+ pigeons, one may signal (chance per move). On its turn every pigeon dives (divePower each).
    // Kill the signaller first: the formation breaks and the rest of the flock loses its turn.
    signature: { id: 'formation', chance: 0.3, divePower: 1.2,
      move: { name: 'Formation!', type: 'formation', tell: '📣', tellText: 'Formation! (take me out)' } },
  },

  // ---------- Raid enemies: the Landlord's Basement (blueprint 18.6) ----------
  // Stats before the raid multiplier (data/raid.js `mult`).
  sporeBouncer: {
    name: 'Spore Bouncer', emoji: '🍄', size: 120, sprite: 'bouncer', mapSprite: 'bouncer_map',
    maxHp: 55, atk: 7.5, def: 5, spd: 8, resolve: 0.30,   // v0.39: was 70 / 10 / 6
    xp: 70, coins: 15, boss: false, weak: 'fire', resists: ['poison'],
    moves: [
      { name: 'Shove', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: "You're Not On The List", type: 'attack', power: 1.7, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Velvet Rope', type: 'buff', stat: 'def', mult: 1.4, turns: 2, label: 'Velvet Rope',
        tell: '🛡️', tellText: 'Raising DEF', weight: 1 },
      { name: 'Arms Crossed', type: 'stance', tell: '🚧', tellText: "Arms crossed next (don't hit!)", weight: 2 },
    ],
    // Arms Crossed: until his next move, your hits bounce back (you take bounceShare of the damage).
    // Wait it out (Defend, eat, throw), or a guardBreak skill does x2 and stuns him.
    signature: { id: 'stance', bounceShare: 0.5, breakMult: 2 },
  },
  // debuff = lowers YOUR stat (mult 0.8 = -20%) for `turns` of your turns
  moldAccountant: {
    name: 'Mold Accountant', emoji: '🧾', size: 96, sprite: 'accountant', mapSprite: 'accountant_map',
    maxHp: 30, atk: 9, def: 2, spd: 13, resolve: 0.20,   // v0.39: was 35 HP
    xp: 50, coins: 20, boss: false, weak: 'fire', resists: ['poison'],
    moves: [
      { name: 'Paper Cut', type: 'attack', power: 0.8, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Itemized Deduction', type: 'debuff', stat: 'atk', mult: 0.8, turns: 3, label: 'Deducted',
        tell: '📉', tellText: 'Lowering your ATK', weight: 2 },
      { name: 'Mold Spores', type: 'attack', power: 0.5, poison: 1, tell: '☠️', tellText: 'Mold Spores', weight: 2 },
      { name: 'Audit Trail', type: 'audit', tell: '📝', tellText: 'About to audit your last move', weight: 2 },
    ],
    // Audit Trail: notes the kind of action you did last (Attack, Skill, Throw, Eat, Rizz, Defend).
    // Until his next move, doing that kind again is DEDUCTED (deductMult effect). Change it up.
    signature: { id: 'audit', deductMult: 0.5 },
  },

  // ---------- Pigeon Godfather (mini-boss, blueprint 18.2) ----------
  // Shows up after you kill `revengeKills` pigeons in one trip (data/forest.js).
  // miniBoss: his family flies off when he goes down. noFlee: you can't run.
  // summon: every `every` of his moves he calls `minion` (at most `max` on the field).
  // gearMin: he always drops gear of this rarity or better.
  // noDiplomacy: Pigeon Diplomacy gear doesn't calm him down (Jesus, 2026-11-09).
  godfather: {
    name: 'Pigeon Godfather', emoji: '🐦‍⬛', size: 130, sprite: 'godfather', mapSprite: 'godfather_map',
    maxHp: 90, atk: 8, def: 3, spd: 12, resolve: 0.40, pigeon: true, noDiplomacy: true,   // v0.39: was 120 / 11 / 4
    xp: 150, coins: 40, boss: false, miniBoss: true, noFlee: true, gearMin: 'Rare',
    weak: 'fire', resists: ['poison'],
    summon: { every: 3, max: 2, minion: 'pigeon',
      move: { name: 'Call the Family', type: 'summon', tell: '🐦', tellText: 'Calling the family' } },
    // Bodyguard: he assigns a family pigeon to guard him. While it lives he takes takenMult damage.
    // Kill it: he's Exposed (exposedMult damage taken) for exposedTurns of his moves.
    signature: { id: 'bodyguard', takenMult: 0.5, exposedMult: 1.5, exposedTurns: 2,
      move: { name: 'Bodyguard', type: 'bodyguard', tell: '🛡️', tellText: 'Assigning a bodyguard' } },
    moves: [
      { name: 'Wing Slap', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'The Statue Treatment', type: 'attack', power: 1.8, tell: '💥', tellText: 'Heavy hit', weight: 2 },
    ],
  },

  // ---------- The Soggy Marsh (W2, Lv 15-22). Emoji pictures for now (Blender art later). ----------
  // Fights: 2-3 interns, or 1 lawyer (+1 intern half the time), or 1 frog + 1 lawyer / 2 interns (src/systems/forest.js marshGroup).
  mosquitoIntern: {
    name: 'Mosquito Intern', emoji: '🦟', size: 70, row: 'front',
    maxHp: 22, atk: 7, def: 1, spd: 14, resolve: 0.0,
    xp: 30, coins: 8, boss: false, weak: 'fire', resists: [],
    moves: [
      { name: 'Paper Cut', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Whine', type: 'debuff', stat: 'atk', mult: 0.9, turns: 2, label: 'Whined at', tell: '📉', tellText: 'About to whine', weight: 1 },
    ],
    // Overtime: the last one standing gets +30% ATK
    signature: { id: 'overtime', atkMult: 1.3 },
  },
  leechLawyer: {
    name: 'Leech Lawyer', emoji: '🪱', size: 110, row: 'front',
    maxHp: 75, atk: 10, def: 4, spd: 9, resolve: 0.25,
    xp: 85, coins: 22, boss: false, weak: 'acid', resists: ['poison'],
    moves: [
      { name: 'Retainer', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 4 },
      { name: 'Objection!', type: 'attack', power: 1.6, tell: '💥', tellText: 'Heavy hit', weight: 2 },
    ],
    // Billable Hours: heals half of the damage it deals. Defend and it can't bill you.
    signature: { id: 'billable', healShare: 0.5 },
  },
  filingFrog: {
    name: 'Filing Frog', emoji: '🐸', size: 96, row: 'back',
    maxHp: 50, atk: 9, def: 3, spd: 11, resolve: 0.1,
    xp: 70, coins: 18, boss: false, weak: 'frost', resists: [],
    moves: [
      { name: 'Tongue Lash', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 3 },
      { name: 'Approved', type: 'stamp', tell: '📄', tellText: 'Reaching for a stamp', weight: 3 },
    ],
    // Approved: stamps one ally (its next hit taken is blocked). Guard-break skills tear the stamp off.
    signature: { id: 'approved' },
  },
};
