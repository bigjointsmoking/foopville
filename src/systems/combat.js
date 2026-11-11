// ============================================================
// COMBAT RULES — pure math. No drawing happens here.
// The battle screen asks these functions "how much damage?",
// "what does the enemy do next?", etc.
// ============================================================
window.FUP = window.FUP || {};

FUP.combat = {
  // Build the player's fight stats from Melee level + weapon + the gear you wear.
  // Blueprint 18.3: ATK = (base from Melee level + gear ATK) x weapon multiplier. DEF/HP/SPD add on top.
  makePlayer(level, weapon, g = FUP.gear.totals()) {
    const s = FUP.balance.playerStats, U = FUP.unlocks;
    const perk = (k, d) => U ? U.perkBest(k, d) : d, sum = k => U ? U.perkSum(k) : 0;   // Melee perks (data/unlocks.js)
    const maxHp = Math.round((s.hpBase + s.hpPerLvl * level + g.hp) * (1 + sum('hpPct')));
    return {
      name: 'You', isPlayer: true,
      maxHp, hp: maxHp,
      atk: (s.atkBase + s.atkPerLvl * level + g.atk) * weapon.atkMult,
      def: s.defBase + s.defPerLvl * level + g.def,
      spd: (s.spdBase + s.spdPerLvl * level) * weapon.spdMult * (1 + g.spd),
      crit: FUP.balance.critChance + g.crit + sum('critAdd'),
      critMult: perk('critMult', 0), guardMult: perk('defendMult', 0),
      rizzBonus: g.rizz, healBonus: g.heal,
      gearResist: { poison: g.resistPoison, fire: g.resistFire },
      rentLess: g.rentLess, effects: g.effects,   // effects: chase items' special powers (data/gear.js)
      gauge: FUP.balance.playerStartGauge + sum('startGauge'), limit: sum('startLimit'), buffs: [], defending: false,
    };
  },

  // Copy an enemy out of the data file so the fight can change its HP without touching the original.
  makeEnemy(data) {
    return {
      ...data, hp: data.maxHp, buffs: [], nextMove: null,
      gauge: 0, // enemies start from empty; you start half-way (balance.playerStartGauge)
    };
  },

  // How many gauge points per second this fighter's turn bar fills (100 = their turn).
  // Same base for everyone; only your weapon and SPD buffs change it.
  turnFill(fighter) {
    const b = FUP.balance, base = 100 / b.turnSeconds;
    if (fighter.isPlayer) return base * this.stat(fighter, 'spd') / b.playerStats.spdBase;
    return base * this.stat(fighter, 'spd') / fighter.spd; // 1x unless buffed
  },

  // A stat after buffs and debuffs are applied. e.g. ATK 10 with "ATK up x1.3" = 13.
  stat(fighter, name) {
    let value = fighter[name];
    for (const b of fighter.buffs) if (b.stat === name) value *= b.mult;
    return value;
  },

  // The damage formula from the design doc.
  // ignoreDef = the defender's DEF blocks nothing (Main Character Moment).
  damage(attacker, defender, power, ignoreDef = false) {
    const b = FUP.balance;
    let dmg = this.stat(attacker, 'atk') * power - (ignoreDef ? 0 : this.stat(defender, 'def') * b.defenseWeight);
    dmg = Math.max(1, dmg);
    const crit = Math.random() < (attacker.crit !== undefined ? attacker.crit : b.critChance);
    if (crit) dmg *= attacker.critMult || b.critMultiplier;
    dmg *= b.damageRandomMin + Math.random() * (b.damageRandomMax - b.damageRandomMin);
    if (defender.defending) dmg *= defender.defendMult || defender.guardMult || b.defendDamageMultiplier;   // defendMult: audited (weak) guard; guardMult: Iron Guard perk   // defendMult: an audited (weak) guard
    return { amount: Math.max(1, Math.round(dmg)), crit };
  },

  // Add a temporary buff/debuff. Same label replaces the old one instead of stacking.
  // ownTurn = true when the fighter gave it to themselves, so the turn it was used doesn't count.
  addBuff(fighter, stat, mult, turns, label, ownTurn = false) {
    fighter.buffs = fighter.buffs.filter(b => b.label !== label);
    fighter.buffs.push({ stat, mult, turns, label, skipNextTick: ownTurn });
  },

  // Called after a fighter acts: every buff loses one turn, expired ones disappear.
  tickBuffs(fighter) {
    for (const b of fighter.buffs) {
      if (b.skipNextTick) b.skipNextTick = false;
      else b.turns--;
    }
    fighter.buffs = fighter.buffs.filter(b => b.turns > 0);
  },

  // The enemy picks its next move NOW, so its tell can show above its head.
  planEnemyMove(enemy) {
    const total = enemy.moves.reduce((sum, m) => sum + m.weight, 0);
    let roll = Math.random() * total;
    for (const m of enemy.moves) {
      roll -= m.weight;
      if (roll <= 0) { enemy.nextMove = m; return m; }
    }
    enemy.nextMove = enemy.moves[0];
    return enemy.nextMove;
  },

  // Chance (0 to 1) that a Rizz attempt works.
  rizzChance(kind, rizzLevel, weapon, enemy, extra = 0) {
    const b = FUP.balance;
    let chance = b.rizzBaseChance + b.rizzPerLevel * rizzLevel + (weapon.rizzBonus || 0) + extra - (enemy.resolve || 0);
    if (kind === 'roast') chance += b.roastEaseBonus;
    return Math.max(0.05, Math.min(0.95, chance));
  },
};
