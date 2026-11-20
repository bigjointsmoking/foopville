// ============================================================
// RANGED — the slingshot skill (phase C1, design/combat.md §2, approved 2026-11-10; built v1.01).
// Wear a slingshot (gear slot 'ranged', data/gear.js sling_1..4) and carry ammo to get 🎯 Shoot in fights.
// Shots use Ranged ATK, ignore the back-row penalty, and give Ranged XP (each enemy's XP is split by who
// hurt it: shots + ranged skills = Ranged, everything else = Melee). Rules: src/systems/run.js (ammo),
// src/systems/combat.js (Ranged ATK), src/scenes/BattleScene.js + BattleSkills.js (Shoot, skills).
// Perks: data/unlocks.js perks.ranged.
// ============================================================
window.FUP = window.FUP || {};

FUP.rangedData = {
  atkBase: 4,          // Ranged ATK = atkBase + atkPerLvl x Ranged level + the slingshot's ATK (your melee weapon doesn't count)
  atkPerLvl: 0.6,
  shotCritAdd: 0.05,   // shots: +5% crit on top of your normal crit chance
  shotFocus: 15,       // Focus per shot that lands (an Attack gives 30)
  ammoMax: 99,         // carried, per kind (the Deep Pockets perk raises it)
  weakMult: 1.5,       // element ammo on a weakness (like a thrown dish); resist = x0.5
  dodgeMult: 0.5,      // Jesus 2026-11-20: Paper Moths dodge shots half as often as melee hits
  // Ammo kinds. power = how hard it hits (x Ranged ATK). element = like thrown dishes.
  ammo: {
    pebble:     { name: 'Pebble',     emoji: '🪨', power: 0.9, buy: { count: 20, coins: 20 } },   // the Blacksmith sells them
    acorn:      { name: 'Acorn',      emoji: '🌰', power: 1.0 },                                  // squirrels drop them
    ember_seed: { name: 'Ember Seed', emoji: '🔥', power: 1.0, element: 'fire' },                 // from Ember Pepper harvests
    lemon_pip:  { name: 'Lemon Pip',  emoji: '🍋', power: 1.0, element: 'acid' },                 // from Grumpy Lemon harvests
  },
  drops: { squirrel: { ammo: 'acorn', count: 2, chance: 0.4 } },                        // beat one: sometimes ammo
  harvest: { ember_pepper: { ammo: 'ember_seed', count: 2 }, grumpy_lemon: { ammo: 'lemon_pip', count: 2 } },   // with each harvest
  // Ranged skills (Skills menu, need a slingshot and ammo; unlocked by Ranged level). ranged: true = Ranged ATK + ammo, no row penalty.
  skills: [
    { id: 'trickShot', level: 5,  name: 'Trick Shot', desc: '2 shots at one target (x0.7 each, 2 ammo)', power: 0.7, hits: 2, ammoCost: 2, focus: 40, ranged: true },
    { id: 'pinDown',   level: 15, name: 'Pin Down',   desc: 'x0.8, its next turn comes 50% later',      power: 0.8, push: 50, focus: 50, ranged: true },
    { id: 'bullseye',  level: 30, name: 'Bullseye',   desc: 'x2.2, ignores DEF',                        power: 2.2, ignoreDef: true, focus: 70, ranged: true },
  ],
};
