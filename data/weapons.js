// ============================================================
// WEAPONS — each changes your stats and your Special move.
// atkMult / spdMult: 1 = normal, 1.25 = 25% more, 0.8 = 20% less.
// skills: extra moves in the Skills menu, unlocked by Melee level (Refinement Phase 3).
//   Each has a trade-off. focus = Focus it costs (v0.41: skills cost Focus instead of cooldowns, balance.focus;
//   v0.42: Melee 5 = 40, Melee 15 = 50, Melee 30 = 70).
//   power = hit strength (1 = a normal Attack). all = hits every enemy. bounces = random hits.
//   guardBreak = breaks the Bouncer's Arms Crossed (x2 + stun) and the Goblin's ledger, removes enemy buffs.
//   PLACEHOLDER numbers, approved by Jesus 2026-11-09.
// ============================================================
window.FUP = window.FUP || {};

FUP.weapons = {
  sword: {
    name: 'Rusty Sword', emoji: '🗡️', sprite: 'w_sword',
    style: 'Balanced. Normal speed, normal damage. The responsible choice.',
    atkMult: 1.0, spdMult: 1.0, rizzBonus: 0, healMult: 1.0,
    special: { name: 'Double Slash', desc: '2 hits at 90% power', hits: 2, power: 0.9 },
    skills: [
      { id: 'wideSwing',  level: 5,  name: 'Wide Swing',  desc: 'Hits EVERY enemy (x0.6)', power: 0.6, all: true, focus: 40 },
      // v0.41 (Jesus: felt weak): x1.5, breaks guards, strips buffs and stuns. No self-debuff any more.
      { id: 'guardBreak', level: 15, name: 'Guard Break', desc: 'x1.5, breaks guards + buffs, stuns', power: 1.5, guardBreak: true, stun: true, focus: 50 },
      { id: 'riposte',    level: 30, name: 'Riposte',     desc: 'Next hit on you: take 0, counter x2.5', riposte: 2.5, focus: 70 },
    ],
  },
  pan: {
    name: 'Frying Pan', emoji: '🍳', sprite: 'w_pan',
    style: 'Slow (-20% speed), heavy (+25% attack). Food you eat heals 15% more.',
    atkMult: 1.25, spdMult: 0.8, rizzBonus: 0, healMult: 1.15,
    special: { name: 'BONK', desc: '140% hit, 35% chance to stun', hits: 1, power: 1.4, stunChance: 0.35 },
    skills: [
      { id: 'sizzleSlam',    level: 5,  name: 'Sizzle Slam',      desc: 'x1.0 FIRE hit + burn (2 turns). Costs you 5% HP', power: 1.0, element: 'fire',
        burn: { pct: 0.04, turns: 2 }, selfCostPct: 0.05, focus: 40 },
      { id: 'castIron',      level: 15, name: 'Cast-Iron Crunch', desc: 'x2.0, breaks guards. Your next turn comes 50% later', power: 2.0, guardBreak: true,
        slowNext: 50, focus: 50 },
      { id: 'secondHelping', level: 30, name: 'Second Helping',   desc: 'Eat a dish at +50% AND hit x0.8', power: 0.8, eatBoost: 1.5, focus: 70 },
    ],
  },
  chicken: {
    name: 'Rubber Chicken', emoji: '🐔', sprite: 'w_chicken',
    // Buffed in v0.35 (Jesus): was -30% attack, +15% Rizz, SQUEAK 60% hit / -25% ATK for 3 moves.
    style: 'Fast (+20% speed), a bit weak (-15% attack). +35% Rizz success.',
    atkMult: 0.85, spdMult: 1.2, rizzBonus: 0.35, healMult: 1.0,
    special: {
      name: 'SQUEAK', desc: '80% hit, enemy ATK -35% (4 moves), 30% confuse', hits: 1, power: 0.8,
      debuff: { stat: 'atk', mult: 0.65, turns: 4, label: 'Squeaked' },
      confuseChance: 0.3,   // confused: its next move hits itself instead of you
      confusePower: 0.8,    // how hard it hits itself (its own ATK x this)
    },
    skills: [
      { id: 'rubberBand',  level: 5,  name: 'Rubber Band',  desc: '3 bounces at random enemies (x0.5 each)', power: 0.5, bounces: 3, focus: 40 },
      { id: 'distraction', level: 15, name: 'Distraction',  desc: 'No damage. Its next turn comes 50% later, your next Rizz +20%', push: 50, rizzNext: 0.2, focus: 50 },
      { id: 'chaosSquawk', level: 30, name: 'Chaos Squawk', desc: '50% to confuse EVERY enemy. The rest get Enraged', confuseChance: 0.5, focus: 70 },
    ],
  },
};
