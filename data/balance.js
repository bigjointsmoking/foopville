// ============================================================
// BALANCE — the knobs. Change a number here and the fight changes.
// Nothing in this file is logic; it's all numbers you can tweak.
// ============================================================
window.FUP = window.FUP || {};

FUP.balance = {
  // --- Turn timing ---
  // Everyone (you and every enemy) gets a turn every `turnSeconds`.
  // Your weapon changes yours: Pan x0.8 speed (slower), Chicken x1.2 (faster).
  // SPD buffs from food (and enemy buffs) speed a fighter up from there.
  turnSeconds: 5,            // was 8 (Jesus: a bit slow)
  playerStartGauge: 50,      // you start half-way to your first turn, so you always move first


  // --- Damage ---
  defenseWeight: 0.35,       // each point of the target's DEF blocks this much damage (was 0.5; v0.41: armor blocked too much)
  critChance: 0.08,          // 8% of hits are critical hits
  critMultiplier: 1.75,      // a crit does 175% damage
  damageRandomMin: 0.9,      // damage wobbles between 90%...
  damageRandomMax: 1.1,      // ...and 110%
  defendDamageMultiplier: 0.5, // Defend = take half damage until your next turn
  weaknessMultiplier: 1.5,   // thrown dish of the element an enemy is weak to
  resistMultiplier: 0.5,     // ...or one it resists

  // --- Poison (the Landlord's Spore Season, Tenant Shrooms) ---
  poisonPerStack: 0.02,      // each stack hurts 2% of your max HP at the start of each of your turns
  poisonMaxStacks: 5,        // PLACEHOLDER cap so Phase 2 isn't a guaranteed death sentence

  // --- Limit Break gauge ---
  limitPerPercentHpLost: 1,  // lose 10% of your max HP = +10 Limit
  limitPerDefend: 5,
  limitMax: 100,

  // --- Actions ---
  specialCooldownTurns: 2,   // after a Special, you wait this many turns to use it again

  // --- Focus (v0.41, Jesus): skills cost Focus instead of having cooldowns ---
  // Starts every fight at 0. Your Special costs `special`; weapon skills say their cost in data/weapons.js.
  // v0.42 (Jesus: too slow to fill): gains up, costs down. Special after 1 hit, Melee 5 skills after 2, 15 after 2, 30 after 3.
  focus: { max: 100, perAttack: 30, perHit: 15, perBlock: 25, special: 30 },

  // --- Enemies scale with you (v0.41, Jesus: "make them a bit harder / scale slightly") ---
  // For every Melee level you are above the area's level (data/forest.js `level`, raid 14, Landlord 15),
  // enemies get +perLevel HP and ATK, up to +max.
  enemyScale: { perLevel: 0.05, max: 1.0 },
  // --- Money (v0.41, Jesus: coins were too easy) ---
  coinRate: 0.6,             // every enemy's coins x this

  // --- Enemies take turns (v0.41, Jesus) ---
  enemyTurnGap: 1.0,         // seconds: two enemies never act closer together than this
  enemyStartSpread: 15,      // each extra enemy starts with its turn bar this much further back

  // --- Reading tells (Refinement Phase 3, Jesus 2026-11-09) ---
  // Defend, then get hit by a heavy move (power >= minPower, or EVICTION): take 0 damage,
  // counter-attack (x counterPower) and gain `limit` Limit.
  perfectBlock: { minPower: 1.5, counterPower: 1.0, limit: 15 },
  fleeChance: 0.5,

  // --- Rizz ---
  rizzBaseChance: 0.30,
  rizzPerLevel: 0.02,        // +2% success per Rizz level
  roastEaseBonus: 0.20,      // Roasting is 20% easier than Charming
  roastAtkDrop: 0.25,        // a successful Roast lowers enemy ATK by 25%...
  roastTurns: 3,             // ...for its next 3 moves
  enrageAtkBonus: 0.30,      // a FAILED Rizz gives the enemy +30% ATK...
  enrageTurns: 3,            // ...for its next 3 moves

  // If your turn has been ready this many seconds and you haven't acted, the narrator notices.
  hesitateSeconds: 7,

  // Your stats come from your Melee level.
  // v0.38: per-level gains cut to ~40% (were 8 / 1.5 / 1 / 0.3) because levels come ~2.5x faster
  // on the new XP curve. Melee 50 now is about as strong as Melee 19 was. Kept by Jesus (2026-11-09).
  playerStats: {
    hpBase: 50, hpPerLvl: 3,
    atkBase: 5, atkPerLvl: 0.6,
    defBase: 3, defPerLvl: 0.4,
    spdBase: 10, spdPerLvl: 0.12,
  },

  // Charming gives this share of the enemy's XP as Rizz XP.
  charmXpShare: 1.8,   // was 0.6; tripled in v0.38 so Rizz levels as fast as the other skills

  // Limit Breaks, unlocked by Melee level (blueprint 18.8). PLACEHOLDER numbers.
  // hits = how many hits, power = each hit's strength, healPct = heal this share of max HP first,
  // ignoreDef = the enemy's DEF doesn't block any of it. say = narrator line (data/narrator.js).
  limitBreaks: [
    { level: 1,  name: 'Haymaker', desc: 'One huge hit (x3)', power: 3.0 },
    { level: 10, name: 'Flurry of Poor Decisions', desc: '5 hits (x0.8 each)', hits: 5, power: 0.8, say: 'limitFlurry' },
    { level: 25, name: 'Second Wind', desc: 'Heal 40% HP + a x2 hit', healPct: 0.40, power: 2.0, say: 'limitSecondWind' },
    { level: 40, name: 'Main Character Moment', desc: 'x6 hit, ignores DEF', power: 6.0, ignoreDef: true, say: 'limitMainChar' },
  ],
};
