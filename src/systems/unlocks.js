// ============================================================
// MELEE + RIZZ UNLOCKS — the rules (blueprint 18.8). No drawing.
// Numbers come from data/unlocks.js, data/balance.js (Limit Breaks),
// data/forest.js (toll) and data/village.js (villager secrets).
// ============================================================
window.FUP = window.FUP || {};

FUP.unlocks = {
  lvl(id) { return FUP.skills.level(id); },

  // ---------- Melee: weapon gates ----------
  // The item's `req` in data/gear.js (you can buy or find gear early; it waits in your stuff).
  wearReq(itemOrKey) {
    const key = typeof itemOrKey === 'string' ? itemOrKey : itemOrKey && itemOrKey.key;
    return (FUP.gearData.items[key] || {}).req || null;
  },
  // Level needed to wear an item (0 = anyone). Takes an item or a gear key.
  wearLevel(itemOrKey) {
    const req = this.wearReq(itemOrKey);
    return req ? ((req.skills && req.skills.melee) || req.combat || 0) : 0;
  },
  canWear(itemOrKey) { return FUP.req.met(this.wearReq(itemOrKey)); },
  // "Melee 20" (weapons) or "Combat 20" (armor); '' = anyone can wear it
  wearText(itemOrKey) {
    const req = this.wearReq(itemOrKey);
    if (!req) return '';
    return req.skills && req.skills.melee ? `Melee ${req.skills.melee}` : req.combat ? `Combat ${req.combat}` : '';
  },

  // ---------- Melee: Limit Breaks you know ----------
  limits() { return FUP.balance.limitBreaks.filter(l => this.lvl('melee') >= l.level); },

  // ---------- Passive perks (data/unlocks.js perks) ----------
  // Perks you have, in level order, across every skill.
  perksOwned() {
    const out = [];
    for (const [skill, list] of Object.entries(FUP.unlockData.perks || {})) for (const p of list) if (this.lvl(skill) >= p.level) out.push(p);
    return out;
  },
  // Effect keys that add up (hpPct, critAdd, startGauge, startLimit, cooldownCut, roastTurns, sellBonus,
  // noEnrage, bonusYieldChance, goldenChance). 0 if you have none.
  // (Tools you own add theirs too: the fishing rod's rodZone / biteCut, data/tools.js)
  perkSum(key) { return this.perksOwned().reduce((t, p) => t + (p[key] || 0), 0) + (FUP.tools && FUP.toolData ? FUP.tools.sum(key) : 0); },
  // Effect keys where the highest-level perk wins (defendMult, critMult, canMax, seedBack...). `dflt` if none.
  perkBest(key, dflt) {
    let v = dflt;
    for (const [skill, list] of Object.entries(FUP.unlockData.perks || {})) {
      let best = null;
      for (const p of list) if (p[key] !== undefined && this.lvl(skill) >= p.level && (!best || p.level > best.level)) best = p;
      if (best) v = best[key];
    }
    return v;
  },
  hasPerk(key) { return !!this.perkBest(key, 0); },

  // ---------- Rizz moves ----------
  has(move) { return this.lvl('rizz') >= FUP.unlockData.rizzMoves[move].level; },
  // Charm works on this enemy? Real bosses never; mini-bosses only at high Rizz.
  canCharm(e) {
    if (!e || e.noCharm || e.boss) return false;
    if (e.miniBoss) return this.has('charmMiniBoss');
    return true;
  },
  // What Sweet Talk can get out of this enemy (empty list = nothing).
  sweetGifts(e) { return (e && !e.boss && FUP.unlockData.rizzMoves.sweetTalk.gifts[e.key]) || []; },

  // ---------- Rizz: the goblin's toll ----------
  tollShare() {
    let pay = 0;
    for (const t of FUP.forestData.toll.payByRizz) if (this.lvl('rizz') >= t.level) pay = t.pay;
    return pay;
  },

  // ---------- Rizz: villager secrets ----------
  // FUP.run.secrets = { 'smith:10': true, ... } once you've heard one. Wiped on death.
  secretsOf(npcId) { return (FUP.villageData.npcs[npcId] || {}).rizz || []; },
  heard(npcId, s) { return !!(FUP.run.secrets || {})[`${npcId}:${s.level}`]; },
  // The next secret this villager will tell you right now (or null).
  nextSecret(npcId) {
    return this.secretsOf(npcId).find(s => this.lvl('rizz') >= s.level && !this.heard(npcId, s)) || null;
  },
  // Hear a secret and get its gift. Returns a short text about the gift ('' = just a tip).
  claim(npcId, s) {
    const run = FUP.run, g = s.gift || {};
    run.secrets = run.secrets || {};
    run.secrets[`${npcId}:${s.level}`] = true;
    if (g.coins) { run.coins += g.coins; return `+${g.coins} 🪙`; }
    if (g.ingredient) {
      let got = 0;
      for (let i = 0; i < (g.count || 1); i++) {
        if (run.addToBag(g.ingredient)) got++;
        else if (!FUP.house.pantryFull()) {
          FUP.house.state.pantry[g.ingredient] = (FUP.house.state.pantry[g.ingredient] || 0) + 1; got++;
        }
      }
      const ing = FUP.ingredients[g.ingredient];
      return got ? `+${got} ${ing.emoji} ${ing.name}` : `(no room for the ${ing.name})`;
    }
    if (g.seed) {
      FUP.garden.state.seeds[g.seed] = FUP.garden.seedCount(g.seed) + (g.count || 1);
      return `+${g.count || 1} ${FUP.ingredients[g.seed].name} seeds`;
    }
    if (g.discount) return `${Math.round(g.discount * 100)}% off here from now on`;
    if (g.fishBonus) return 'Gill pays more for your fish from now on';
    return '';
  },
  // A Rizz line you've already heard, for greetings (or null).
  heardLine(npcId) {
    const lines = this.secretsOf(npcId).filter(s => this.heard(npcId, s));
    return lines.length ? lines[Math.floor(Math.random() * lines.length)].line : null;
  },
  // Add up one kind of lasting gift from the secrets you've heard at a villager (e.g. 'fishBonus').
  giftSum(npcId, key) {
    return this.secretsOf(npcId).filter(s => s.gift && s.gift[key] && this.heard(npcId, s)).reduce((t, s) => t + s.gift[key], 0);
  },
  // Lasting discount at this villager from secrets you've heard (0.05 = 5% off).
  npcCut(npcId) {
    if (!npcId) return 0;
    return this.secretsOf(npcId).filter(s => s.gift && s.gift.discount && this.heard(npcId, s)).reduce((t, s) => t + s.gift.discount, 0);
  },
};
