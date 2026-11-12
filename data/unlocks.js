// ============================================================
// MELEE + RIZZ UNLOCKS (blueprint 18.8 step 1).
// Every number here is a PLACEHOLDER Jesus can tweak.
// Limit Breaks live in data/balance.js (limitBreaks). The goblin toll
// lives in data/forest.js (toll). Villager secrets live in data/village.js
// (each villager's `rizz` list). This file holds the rest.
// ============================================================
window.FUP = window.FUP || {};

FUP.unlockData = {
  // (The Melee level needed to WEAR gear is `req` on each item in data/gear.js.)

  // ---------- Rizz moves in fights ----------
  rizzMoves: {
    // The enemy hands you one of its things. One try per enemy. Fail = it gets Enraged.
    // `ease` = how much easier than Charm (same as Roast). Not on bosses.
    // gifts: ingredient ids or { coins: n }. One is picked at random.
    sweetTalk: {
      level: 10, name: 'Sweet Talk', emoji: '🍬', ease: 0.20,
      gifts: {
        squirrel: ['squirrel_jerky', 'grumpleberry'],
        goblin: [{ coins: 20 }],
        pigeon: ['grumpleberry', 'glowcap_mushroom'],
        godfather: ['heartroot', { coins: 40 }],
        tenantShroom: ['glowcap_mushroom'],
        sporeBouncer: ['spore_b_gone_moss'],
        moldAccountant: [{ coins: 25 }],
        mosquitoIntern: ['croakberry'], leechLawyer: [{ coins: 30 }], filingFrog: ['stamped_form'],
      },
    },
    // Talk yourself up. Your ATK goes up. Fail = the enemy you target gets Enraged.
    hype: { level: 20, name: 'Hype Yourself', emoji: '📣', ease: 0.20, atkMult: 1.20, turns: 3 },
    // Charm now works on mini-bosses (the Pigeon Godfather). Never on real bosses.
    charmMiniBoss: { level: 30 },
  },

  // ---------- Rizz: better deals ----------
  hankSecretItemRizz: 15,     // Hooded Hank shows a secret extra item (waits for side rooms, 18.6 step 5)
  hankBuilt: false,           // set true once Hank exists; until then the Skill Guide doesn't promise him (v0.40)

  // Villagers tell you secrets at these Rizz levels (their lines are in data/village.js)
  secretLevels: [10, 20, 30],
  rizzGreetChance: 0.35,      // after you've heard a secret, how often they greet you with a Rizz line

  // ---------- Passive perks (Refinement Phase 4, approved by Jesus 2026-11-09) ----------
  // One every 3-5 levels so every skill always has something coming. PLACEHOLDER numbers.
  // Each perk sets one or more effect keys (read with FUP.unlocks.perkSum / perkBest):
  //   sum keys add up across perks; "best" keys take the value of the highest perk you have.
  perks: {
    melee: [
      { level: 3,  name: 'Thick Skin',    text: '+5% max HP', hpPct: 0.05 },
      { level: 7,  name: 'Quick Start',   text: 'Start fights with 60% turn bar (was 50%)', startGauge: 10 },
      { level: 12, name: 'Bruiser',       text: '+3% crit chance', critAdd: 0.03 },
      { level: 18, name: 'Iron Guard',    text: 'Defend takes 40% damage (was 50%)', defendMult: 0.4 },
      { level: 20, name: 'Practiced',     text: 'Skills cost 10 less Focus', focusCut: 10 },
      { level: 22, name: 'Heavy Hitter',  text: 'Crits do x2 (was x1.75)', critMult: 2.0 },
      { level: 28, name: 'Battle Hunger', text: 'Start every fight with 10 Limit', startLimit: 10 },
      { level: 33, name: 'Unshaken',      text: 'Perfect Block counter hits x1.5 (was x1)', perfectCounter: 1.5 },
      { level: 36, name: 'Veteran',       text: '+10% max HP', hpPct: 0.10 },
      { level: 43, name: 'Executioner',   text: '+25% damage to enemies under 25% HP', executeBelow: 0.25, executeMult: 1.25 },
      { level: 46, name: 'Unbreakable',   text: 'Once per fight, a killing blow leaves you at 1 HP', unbreakable: 1 },
      { level: 50, name: 'Mastery',       text: 'Limit bar fills 25% faster', limitRate: 1.25 },
    ],
    rizz: [
      { level: 3,  name: 'Smooth Talker',  text: 'Roast lasts 1 turn longer', roastTurns: 1 },
      { level: 6,  name: 'Bargain Hunter', text: 'Shops pay you 5% more when you sell', sellBonus: 0.05 },
      { level: 13, name: 'Silver Tongue',  text: "Failed Rizz: 25% chance it doesn't Enrage", noEnrage: 0.25 },
      { level: 17, name: 'Fan Club',       text: 'Charmed enemies still drop their coins', charmCoins: 1 },
      { level: 24, name: 'Persuasive',     text: 'Sweet Talk: 2 tries per enemy', sweetTries: 2 },
      { level: 27, name: 'Haggler',        text: 'Haggle can be retried once per visit', haggleRetry: 1 },
      { level: 35, name: 'Smooth Exit',    text: 'Flee always works (not from bosses)', fleeAlways: 1 },
      { level: 38, name: 'Magnetic',       text: 'Charm gives +25% Rizz XP', charmXpMult: 1.25 },
      { level: 42, name: 'Hype Man',       text: 'Hype Yourself lasts 5 turns (was 3)', hypeTurns: 5 },
      // Rizz 46 "Living Legend" (free goblin toll) is in data/forest.js toll.payByRizz
      { level: 50, name: 'Mastery',        text: 'A successful Roast also lowers DEF', roastDef: 1 },
    ],
    // Building (design/building.md 7). More unlocks (things to build, repairs) come from data/place.js and later phases.
    building: [
      { level: 3,  name: 'Cart Breaker',   text: 'Pry apart Broken Carts in the Forest (planks + nails)' },
      { level: 4,  name: 'Scarecrow',      text: 'Build a Scarecrow: extra crops near it (Carpenter)' },
      { level: 5,  name: 'Bridge Builder', text: 'Repair the East Bridge (Restoration Board)' },
      { level: 8,  name: 'Beachcomber',    text: 'Salvage Wreckage at the Docks (Brass Fittings) · build a Rain Barrel' },
      { level: 10, name: 'Market Day',     text: 'Repair the Market (Restoration Board)' },
      { level: 12, name: 'Sharp Eye',      text: '15% chance of one more of each material when salvaging', salvageExtra: 0.15 },
      { level: 14, name: 'Miller\'s Friend', text: 'Repair the Windmill (Restoration Board)' },
      { level: 15, name: 'Mudlark',        text: 'Salvage Sunken Crates in the Marsh (Stained Glass)' },
      { level: 18, name: 'Window Dresser', text: 'The Shopkeeper\'s window display job' },
      { level: 20, name: 'Sharp Eye II',   text: '30% chance of one more of each material', salvageExtra: 0.15 },
      { level: 24, name: 'Treasure Hunter', text: 'Rare finds (brass, glass) 1.5x as often', rareMult: 1.5 },
      { level: 27, name: 'Tidy Saw',      text: 'A plank takes 2 Bark (was 3)', plankBark: 2 },
      { level: 28, name: 'Bandleader',     text: 'The Village Bandstand job' },
      { level: 30, name: 'Good Location', text: 'Stalls sell 10% faster', stallSpeedCut: 0.10 },
      { level: 35, name: 'Master Salvager', text: 'Rare finds 2x as often', rareMult: 2 },
      { level: 40, name: 'Regulars',      text: 'Stall customers pay 5% more', stallPremium: 0.05 },
      { level: 45, name: 'Big Till',      text: 'Tills hold twice as much', tillMult: 2 },
      { level: 50, name: 'Mastery',       text: 'Paths, fences and hedges are free', freeGround: 1 },
    ],
    // Fishing (design/fishing.md 9). Bait, traps and treasure arrive in later phases.
    fishing: [
      { level: 4,  name: 'Patient',        text: 'Bites come 15% sooner', biteCut: 0.15 },
      { level: 8,  name: 'Steady Hands',   text: 'Catch zone +8', zoneAdd: 8 },
      { level: 13, name: 'Lucky Line',     text: 'Treasure 1.5x as often', treasureMult: 1.5 },
      { level: 17, name: 'Double Hook',    text: '10% chance of a second fish', doubleFish: 0.10 },
      { level: 21, name: 'Bait Saver',     text: "30% chance bait isn't used up", baitSave: 0.30 },
      { level: 24, name: 'Calm Waters',    text: 'The meter drains 20% slower', drainCut: 0.20 },
      { level: 28, name: 'Firm Grip',      text: 'Catch zone +8', zoneAdd: 8 },
      { level: 33, name: 'Trapper',        text: 'Fish traps hold 2 more', trapCap: 2 },
      { level: 37, name: 'Double Hook II', text: '20% chance of a second fish', doubleFish: 0.20 },
      { level: 41, name: 'Treasure Nose',  text: 'Treasure 2x as often', treasureMult: 2 },
      { level: 45, name: 'Bait Hoarder',   text: "50% chance bait isn't used up", baitSave: 0.50 },
      { level: 50, name: 'Mastery',        text: 'A Perfect catch always lands a second fish', perfectDouble: 1 },
    ],
    gardening: [
      { level: 12, name: 'Green Thumb',    text: '10% chance of +1 on every harvest', bonusYieldChance: 0.10 },
      { level: 17, name: 'Bigger Can',     text: 'Watering can holds 15 (was 10)', canMax: 15 },
      { level: 23, name: 'Seed Saver',     text: 'Seed back 40% of the time (was 30%)', seedBack: 0.40 },
      { level: 26, name: 'Deep Roots',     text: 'Crops wilt after 30 min dry (was 20)', wiltAfter: 30 * 60 },
      { level: 33, name: 'Huge Can',       text: 'Watering can holds 20', canMax: 20 },
      { level: 36, name: 'Seed Hoarder',   text: 'Seed back 50% of the time', seedBack: 0.50 },
      { level: 43, name: 'Golden Harvest', text: '5% chance of a bonus Heartroot from any harvest', goldenChance: 0.05 },
      { level: 46, name: 'Hardy Crops',    text: 'Thirsty crops wilt but never die', noDeath: 1 },
    ],
  },
};
