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
// on a first trip: Forest Edge 1-5, Toll Road 5-9, Deep Woods 9-13, raid 13-15, Guardian ~15.
// Pressing only Attack (no food, no blocks) you should lose about: squirrel 15%, pigeon flock 25%,
// goblin 30%, raid enemies 5-40%, the Godfather ~100% and the Guardian ~110% (those two need food and skills).
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

  // Orientation Isle's practice target (v0.62, data/tutorial.js). Hits softly and slowly so you can
  // learn Defend / Perfect Block. In a tutorial fight you can't drop below 1 HP (BattleScene.hurtPlayer).
  trainingDummy: {
    name: 'Training Dummy', emoji: '🎯', size: 96, sprite: 'deco_scarecrow', mapSprite: 'deco_scarecrow', artScale: 3.5,
    maxHp: 22, atk: 3, def: 0, spd: 18, resolve: 0.05,
    xp: 20, coins: 0, boss: false, weak: 'fire', resists: [], noGear: true,
    moves: [
      { name: 'Wobble Slap', type: 'attack', power: 0.8, tell: '⚔️', tellText: 'Attack (try Defend!)', weight: 3 },
      { name: 'Ominous Creak', type: 'attack', power: 1.2, tell: '💥', tellText: 'Heavy hit (Defend!)', weight: 1 },
    ],
  },

  // Summoned by the Guardian in Phase 1. Blueprint 18.2.
  strayShroom: {
    name: 'Stray Shroom', emoji: '🍄', size: 64, sprite: 'stray', mapSprite: 'stray_map',
    maxHp: 18, atk: 6, def: 2, spd: 9, resolve: 0, noCharm: true,
    xp: 0, coins: 0, boss: false, minion: true, weak: 'fire', resists: ['poison'],
    moves: [
      { name: 'Spore Puff', type: 'attack', power: 0.8, poison: 1, tell: '☠️', tellText: 'Spore Puff', weight: 1 },
    ],
    // Sharing Spores: every living Stray Shroom heals the Guardian healPct of its max HP on each of its turns.
    signature: { id: 'share', healPct: 0.03 },
  },

  // THE BOSS. Blueprint section 12 + 18.2.
  // maxHp: the blueprint says 300. PLACEHOLDER 180 until gear exists,
  // because at Melee level 1 with no gear your hits only do ~3-4 damage.
  guardian: {
    name: 'The Mushroom Guardian', emoji: '🍄', hat: '🎩', size: 150, sprite: 'guardian', mapSprite: 'guardian_map',
    maxHp: 180, atk: 11, def: 6, spd: 11, resolve: 0.50, noCharm: true, level: 15,   // level: for enemy scaling (v0.41)   // v0.39: ATK was 12
    xp: 300, coins: 150, boss: true, weak: 'fire', resists: ['poison'],
    // His everyday moves. PLACEHOLDER names and numbers (the blueprint only names his phase moves).
    moves: [
      { name: 'Cap Slam', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Heavy Stomp', type: 'attack', power: 1.7, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Hold the Door', type: 'buff', stat: 'def', mult: 1.3, turns: 2, label: 'Bracing',
        tell: '🛡️', tellText: 'Raising DEF', weight: 1 },
    ],
    bossRules: {
      // He moves to the next phase when his HP drops below `below` (0.66 = 66%).
      phases: [
        { name: 'Call the Strays', below: 1.00 },
        { name: 'Spore Season', below: 0.66 },
        { name: 'Feeding Time', below: 0.33 },
      ],
      // Phase 1: summon a Stray Shroom every 3 of his turns (max 3 on the field).
      summonEvery: 3, maxMinions: 3, minion: 'strayShroom',
      // Phase 2: you gain 1 Poison stack every one of his turns.
      poisonPerTurn: 1,
      // Phase 3: every 3 of its turns it takes 10% of your coins (and hits you).
      feedEvery: 3, feedTake: 0.10,
      // Fever Dream: once per phase, on his 2nd turn in that phase. Lasts 3 of YOUR turns.
      feverOnTurn: 2, feverTurns: 3, fakes: 2,
      // Last Warning (Refinement Phase 3): once per phase, on its `onTurn`-th turn it gives it.
      // After `countdown` of its moves: DOOR SLAM, a x3 hit. Deal `contestPct` of its max HP
      // before then to break it (cancelled, and his turn bar drops to `contestGauge`).
      // Or Defend as it lands (Perfect Block).
      notice: { onTurn: 4, countdown: 3, contestPct: 0.15, contestGauge: -50,
        serve: { name: 'Last Warning', type: 'notice', tell: '📜', tellText: 'Giving a Last Warning' },
        slam: { name: 'DOOR SLAM', type: 'attack', power: 3.0, slam: true, tell: '💥', tellText: 'DOOR SLAM! (Defend!)' } },
      special: {
        summon: { name: 'Call the Strays', type: 'summon', tell: '🍄', tellText: 'Calling strays' },
        feed:   { name: 'Feeding Time', type: 'feed', power: 0.8, tell: '💰', tellText: 'Wants feeding' },
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
  // Quest enemy (v0.79, The Jerky Bandit): a big squirrel full of the Chef's jerky. Placed on the map by the quest only.
  nutsy: {
    name: 'Nutsy, the Jerky Bandit', emoji: '🐿️', size: 130, sprite: 'squirrel', mapSprite: 'squirrel_map',
    maxHp: 40, atk: 6.5, def: 2, spd: 15, resolve: 0.25,
    xp: 70, coins: 15, boss: false, weak: 'fire', resists: [],
    moves: [
      { name: 'Jerky-Fuelled Nibble', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Acorn Barrage', type: 'attack', power: 1.5, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Snack Heist', type: 'steal', power: 0.5, tell: '🎒', tellText: 'Eyeing your snacks', weight: 2 },
    ],
    signature: { id: 'hoarder',
      eatMove: { name: 'Snack Time', type: 'eatStolen', tell: '🍽️', tellText: 'Eating YOUR snack (hit it!)' } },
  },

  pigeon: {
    name: 'Pigeon With a Grudge', emoji: '🐦', size: 72, sprite: 'pigeon', mapSprite: 'pigeon_map',
    maxHp: 15, atk: 2.6, def: 1, spd: 16, resolve: 0.20, pigeon: true,   // v0.78: ATK 3.5 -> 2.6 (Jesus: pigeons hurt, not enough healing)   // v0.41: HP 10 -> 15 (Jesus: too easy)   // v0.39: was 14 HP / 5 ATK
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

  // ---------- Raid enemies: the Old Storehouse (blueprint 18.6) ----------
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
    name: 'Mosquito Intern', emoji: '🦟', size: 70, row: 'front', sprite: 'mosquito', mapSprite: 'mosquito_map',   // art v0.84
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
    name: 'Leech Lawyer', emoji: '🪱', size: 110, row: 'front', sprite: 'leech', mapSprite: 'leech_map',
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
    name: 'Filing Frog', emoji: '🐸', size: 96, row: 'back', sprite: 'frog', mapSprite: 'frog_map',
    maxHp: 50, atk: 9, def: 3, spd: 11, resolve: 0.1,
    xp: 70, coins: 18, boss: false, weak: 'frost', resists: [],
    moves: [
      { name: 'Tongue Lash', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 3 },
      { name: 'Approved', type: 'stamp', tell: '📄', tellText: 'Reaching for a stamp', weight: 3 },
    ],
    // Approved: stamps one ally (its next hit taken is blocked). Guard-break skills tear the stamp off.
    signature: { id: 'approved' },
  },

  // ---------- v0.93 new enemies (Jesus approved the drafts 2026-11-18). Numbers are PLACEHOLDERS. ----------
  // Same number of fights per trip: they take a share of each area's spawns (enemyTypes weights).
  // Forest Edge (Lv 1-5). Spikes: hitting it with an Attack or Skill hurts you `share` of the damage,
  // unless your last action was Defend. Thrown dishes are safe.
  hedgehog: {
    name: 'Grumpy Hedgehog', emoji: '🦔', size: 90, sprite: 'hedgehog', mapSprite: 'hedgehog_map',
    maxHp: 22, atk: 5, def: 2, spd: 12, resolve: 0.15,
    xp: 40, coins: 7, boss: false, weak: 'fire', resists: [],
    moves: [
      { name: 'Prickle Poke', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Rolling Huff', type: 'attack', power: 1.5, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Curl Up', type: 'buff', stat: 'def', mult: 1.4, turns: 2, label: 'Curled up', tell: '🛡️', tellText: 'Raising DEF', weight: 1 },
    ],
    signature: { id: 'spikes', share: 0.3 },
  },
  // Goblin Toll Road (Lv 5-9). Grab and Go: a light hit and he pockets `steal` of your coins. On his next turn
  // he runs off with them, unless you beat him first (then you get them back).
  debtRunner: {
    name: 'Goblin Debt Runner', emoji: '👺', size: 96, sprite: 'debtrunner', mapSprite: 'debtrunner_map',
    maxHp: 34, atk: 6, def: 2, spd: 14, resolve: -0.05,
    xp: 45, coins: 14, boss: false, weak: 'acid', resists: [],
    moves: [
      { name: 'Shoulder Barge', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 4 },
      { name: 'Pocket Check', type: 'attack', power: 1.5, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Grab and Go', type: 'grab', power: 0.5, steal: 0.08, tell: '🪙', tellText: 'Eyeing your coins', weight: 3 },
    ],
    signature: { id: 'runner',
      move: { name: 'Run For It', type: 'runAway', tell: '🏃', tellText: 'Running off with your coins (stop him!)' } },
  },
  // Deep Woods (Lv 9-13). Every 3rd move is a huge swipe; Defend it (Perfect Block) for a counter x counterMult.
  mossBear: {
    name: 'Moss Bear', emoji: '🐻', size: 130, sprite: 'mossbear', mapSprite: 'mossbear_map',
    maxHp: 70, atk: 8, def: 4, spd: 8, resolve: 0.30,
    xp: 80, coins: 18, boss: false, weak: 'fire', resists: ['frost'],
    moves: [
      { name: 'Heavy Paw', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Moss Hug', type: 'attack', power: 1.3, tell: '💥', tellText: 'Heavy hit', weight: 2 },
    ],
    signature: { id: 'windup', every: 3,
      move: { name: 'Mossy Mauling', type: 'attack', power: 2.4, counterMult: 2, tell: '🐾', tellText: 'BIG SWIPE (Defend!)' } },
  },
  // Soggy Marsh (Lv 15-22). Back row. Sustained!: every other enemy gets DEF x mult for `turns`. Take it out first.
  paralegalNewt: {
    name: 'Paralegal Newt', emoji: '🦎', size: 80, row: 'back', sprite: 'newt', mapSprite: 'newt_map',
    maxHp: 40, atk: 7, def: 2, spd: 13, resolve: 0.10,
    xp: 60, coins: 16, boss: false, weak: 'frost', resists: [],
    moves: [
      { name: 'Clipboard Swat', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 3 },
      { name: 'Sustained!', type: 'allyBuff', stat: 'def', mult: 1.4, turns: 2, label: 'Sustained', tell: '🛡️', tellText: 'Raising its allies\' DEF', weight: 3 },
    ],
    signature: { id: 'sustain' },
  },
  // Soggy Marsh. Wrap in Red Tape: your turn bar fills slower (SPD x mult) for `turns` of your turns.
  redTapeEel: {
    name: 'Red Tape Eel', emoji: '🐍', size: 110, row: 'front', sprite: 'eel', mapSprite: 'eel_map',
    maxHp: 65, atk: 9, def: 3, spd: 10, resolve: 0.20,
    xp: 75, coins: 20, boss: false, weak: 'acid', resists: ['poison'],
    moves: [
      { name: 'Slippery Bite', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 4 },
      { name: 'Coil Crush', type: 'attack', power: 1.5, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Wrap in Red Tape', type: 'debuff', stat: 'spd', mult: 0.6, turns: 2, label: 'Tangled', tell: '🎀', tellText: 'About to tie you up', weight: 2 },
    ],
    signature: { id: 'redtape' },
  },

  // ---------- The Senior Partner (v0.93, the Soggy Marsh's boss, Melee ~20) ----------
  // In his office in the Marsh's south-east corner; his receptionist books you in for 3 Stamped Forms a visit.
  // Phase 1 Billable Hours: each of his turns his hits get `perTurn` stronger (up to `max`), and it stays.
  // Phase 2 The Associates: he calls in two Leech Lawyers (no XP, no coins).
  // Phase 3 Settlement Offer: on his `onTurn`-th turn, then every `every` turns, he offers to stop hitting
  // you for `turns` of his turns for `share` of your coins (at least `min`). Take it or refuse.
  seniorPartner: {
    name: 'The Senior Partner', emoji: '🪱', hat: '🎩', size: 150, sprite: 'partner', mapSprite: 'partner_map',
    maxHp: 260, atk: 12, def: 7, spd: 11, resolve: 0.50, noCharm: true, level: 20,
    xp: 450, coins: 220, boss: true, weak: 'acid', resists: ['poison'],
    winTitle: 'PARTNER DEFEATED', say: { start: 'partnerStart', win: 'partnerWin', lose: 'partnerLose', phase: 'partnerPhase', flee: 'partnerFlee' },
    moves: [
      { name: 'Retainer Slam', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Cross-Examination', type: 'attack', power: 1.7, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Fine Print', type: 'debuff', stat: 'atk', mult: 0.85, turns: 3, label: 'Fine print', tell: '📉', tellText: 'Lowering your ATK', weight: 1 },
    ],
    bossRules: {
      phases: [
        { name: 'Billable Hours', below: 1.00 },
        { name: 'The Associates', below: 0.66 },
        { name: 'Settlement Offer', below: 0.33 },
      ],
      billable: { phase: 0, perTurn: 0.06, max: 0.6 },
      associates: { phase: 1, foes: ['leechLawyer', 'leechLawyer'] },
      settlement: { phase: 2, onTurn: 2, every: 6, share: 0.2, min: 10, turns: 3 },
      special: {
        offer:  { name: 'Settlement Offer', type: 'offer', tell: '🤝', tellText: 'Making you an offer' },
        review: { name: 'Reviewing the Settlement', type: 'review', tell: '📑', tellText: 'Busy with paperwork' },
      },
    },
  },
  // ============================================================
  // PHASE D (v1.00, Jesus 2026-11-19): the Vault under the Old Storehouse (behind the iron door the
  // Old Key opens) and the Bog Notary's fight. Melee ~20-22. All names and numbers are PLACEHOLDERS.
  // ============================================================
  // The Vault: paper-eating creatures that moved into the elders' records.
  // Bookworm: Eat Your Focus = a light hit that eats `share` of your Focus (skills cost Focus).
  bookworm: {
    name: 'Bookworm', emoji: '🐛', size: 100, sprite: 'bookworm', mapSprite: 'bookworm_map',
    maxHp: 80, atk: 10, def: 4, spd: 9, resolve: 0.20,
    xp: 90, coins: 22, boss: false, weak: 'fire', resists: [],
    moves: [
      { name: 'Chew', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 4 },
      { name: 'Hardback Slam', type: 'attack', power: 1.6, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Eat Your Focus', type: 'eatFocus', power: 0.6, share: 0.5, tell: '📖', tellText: 'Hungry for your Focus', weight: 2 },
    ],
  },
  // Paper Moth: comes in swarms of 3-4. Weak, but dodges `dodge` of your hits (Attack, skills, throws).
  paperMoth: {
    name: 'Paper Moth', emoji: '🦋', size: 72, row: 'back', sprite: 'papermoth', mapSprite: 'papermoth_map',
    maxHp: 30, atk: 7, def: 1, spd: 14, resolve: 0.05, dodge: 0.35,
    xp: 35, coins: 8, boss: false, weak: 'fire', resists: [],
    moves: [
      { name: 'Paper Cut', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Dust Dive', type: 'attack', power: 1.5, tell: '💥', tellText: 'Heavy hit', weight: 1 },
    ],
  },
  // Ink Slime: Ink Splash = a hit, and for `turns` of your turns each of your hits misses `miss` of the time.
  inkSlime: {
    name: 'Ink Slime', emoji: '🫧', size: 110, row: 'front', sprite: 'inkslime', mapSprite: 'inkslime_map',
    maxHp: 90, atk: 9, def: 5, spd: 8, resolve: 0.30,
    xp: 95, coins: 24, boss: false, weak: 'frost', resists: ['poison'],
    moves: [
      { name: 'Splat', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 4 },
      { name: 'Ink Splash', type: 'ink', power: 0.8, turns: 2, miss: 0.35, tell: '🖋️', tellText: 'About to splash ink', weight: 2 },
    ],
  },
  // The Archivist's filing shelves (phase 1). They don't fight; while one stands, the Archivist takes almost nothing.
  filingShelf: {
    name: 'Filing Shelf', emoji: '🗄️', size: 96, row: 'front', sprite: 'filingshelf', mapSprite: 'filingshelf',
    maxHp: 50, atk: 0, def: 6, spd: 6, resolve: 0.9, noCharm: true, noGear: true,
    xp: 0, coins: 0, boss: false, weak: 'fire', resists: ['poison'],
    moves: [ { name: 'Creak', type: 'creak', tell: '🗄️', tellText: 'Hiding the Archivist', weight: 1 } ],
  },

  // ---------- The Archivist (the Vault's boss, Melee ~20) ----------
  // A huge old silverfish that ate most of the elders' records.
  // Phase 1 Shelved: starts behind 2 Filing Shelves; while any stands it takes x`shelves.takenMult` damage.
  // Phase 2 Redact: every `every` of its turns a hit that blacks out one of your actions for `turns` of your turns.
  // Phase 3 Last Copy: every `every` turns it starts eating pages: heals `healPct` of its max HP on each of its
  //   next `turns` turns. Throw a dish at it to make it spit them out (the heal stops).
  // Drops the Right Form (once per life, data/raid.js vault.form) and spell piece 4 (data/spell.js).
  archivist: {
    name: 'The Archivist', emoji: '🐟', hat: '👓', size: 150, sprite: 'archivist', mapSprite: 'archivist_map',
    maxHp: 300, atk: 13, def: 7, spd: 11, resolve: 0.50, noCharm: true, level: 21,
    xp: 520, coins: 260, boss: true, weak: 'fire', resists: ['poison'],
    winTitle: 'ARCHIVIST DEFEATED', say: { start: 'archivistStart', win: 'archivistWin', lose: 'archivistLose', phase: 'archivistPhase', flee: 'archivistFlee' },
    moves: [
      { name: 'Paper Cut', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Bound Volume', type: 'attack', power: 1.7, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Shush', type: 'debuff', stat: 'spd', mult: 0.8, turns: 2, label: 'Shushed', tell: '🤫', tellText: 'Lowering your SPD', weight: 1 },
    ],
    bossRules: {
      phases: [
        { name: 'Shelved', below: 1.00 },
        { name: 'Redact', below: 0.66 },
        { name: 'Last Copy', below: 0.33 },
      ],
      shelves: { phase: 0, foe: 'filingShelf', takenMult: 0.15 },
      phaseMoves: [
        { phase: 1, every: 2, move: { name: 'Redact', type: 'ban', pick: 'random', power: 0.8, turns: 1, tell: '⬛', tellText: 'Blacking out one of your actions' } },
        { phase: 2, every: 3, move: { name: 'Eat the Pages', type: 'chew', healPct: 0.05, turns: 3, tell: '📄', tellText: 'Eating pages (throw a dish!)' } },
      ],
    },
  },

  // ---------- The Bog Notary (Phase D quest "The Right Form", Melee ~22) ----------
  // A giant toad in his office in the Soggy Marsh's east end (the old W3 plan).
  // Phase 1 Intake: every `every` of his turns STAMP: a hit that stuns you (your turn bar drops to `stunGauge`).
  // Phase 2 Motions: every `every` turns a hit that bans the action you used last, for `turns` of your turns.
  // Phase 3 Final Judgement: every `every` turns a huge croak. Defend it (Perfect Block) to counter x`counterMult`.
  bogNotary: {
    name: 'The Bog Notary', emoji: '🐸', hat: '🎩', size: 160, sprite: 'npc_notary', mapSprite: 'npc_notary_map',
    maxHp: 340, atk: 13, def: 8, spd: 10, resolve: 0.50, noCharm: true, level: 22,
    xp: 600, coins: 300, boss: true, weak: 'frost', resists: ['poison'],
    winTitle: 'NOTARY DEFEATED', say: { start: 'notaryStart', win: 'notaryWin', lose: 'notaryLose', phase: 'notaryPhase', flee: 'notaryFlee' },
    moves: [
      { name: 'Tongue Lash', type: 'attack', power: 1.0, tell: '⚔️', tellText: 'Attack', weight: 5 },
      { name: 'Belly Flop', type: 'attack', power: 1.7, tell: '💥', tellText: 'Heavy hit', weight: 2 },
      { name: 'Puff Up', type: 'buff', stat: 'def', mult: 1.4, turns: 2, label: 'Puffed up', tell: '🛡️', tellText: 'Raising DEF', weight: 1 },
    ],
    bossRules: {
      phases: [
        { name: 'Intake', below: 1.00 },
        { name: 'Motions', below: 0.66 },
        { name: 'Final Judgement', below: 0.33 },
      ],
      phaseMoves: [
        { phase: 0, every: 4, move: { name: 'STAMP', type: 'stampYou', power: 0.9, stunGauge: -100, tell: '🔨', tellText: 'About to STAMP you' } },
        { phase: 1, every: 3, move: { name: 'Motion to Dismiss', type: 'ban', pick: 'last', power: 0.6, turns: 2, tell: '📜', tellText: 'Filing a motion against your last move' } },
        { phase: 2, every: 3, move: { name: 'FINAL JUDGEMENT', type: 'attack', power: 2.6, counterMult: 2, tell: '⚖️', tellText: 'FINAL JUDGEMENT (Defend!)' } },
      ],
    },
  },
};
