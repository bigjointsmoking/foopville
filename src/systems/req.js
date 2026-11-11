// ============================================================
// REQUIREMENTS + COSTS — one format for "what you need" and "what it costs".
//   req:  { skills: { melee: 10 }, combat: 20, facts: { 'repair:well': 1 }, not: ['flag:x'] }
//   cost: { coins: 500, items: { bark: 4 }, gear: ['weapon_2'] }
// Any data entry can carry them. No drawing here.
// ============================================================
window.FUP = window.FUP || {};

FUP.req = {
  combatLevel() { return FUP.skills.combatLevel ? FUP.skills.combatLevel() : FUP.skills.level('melee'); },   // (the fallback is for tests with a stub skills object)
  skillName(id) { const s = FUP.skillData && FUP.skillData.skills[id]; return (s && s.name) || id; },

  // Every failed part of a requirement, as text lines. Empty = you meet it.
  missing(req) {
    const out = [];
    if (!req) return out;
    for (const [id, n] of Object.entries(req.skills || {})) {
      const have = FUP.skills.level(id);
      if (have < n) out.push(`${this.skillName(id)} ${n} (you: ${have})`);
    }
    if (req.combat && this.combatLevel() < req.combat) out.push(`Combat level ${req.combat} (you: ${this.combatLevel()})`);
    for (const [key, n] of Object.entries(req.facts || {})) {
      if (FUP.facts.get(key) < n) out.push(FUP.facts.label(key) + (n > 1 ? ` x${n}` : ''));
    }
    for (const key of req.not || []) if (FUP.facts.get(key) !== 0) out.push(`Not after: ${FUP.facts.label(key)}`);
    return out;
  },
  met(req) { return this.missing(req).length === 0; },

  // ---------- Costs ----------
  // Where each kind of thing is taken from, in order
  itemCount(id) { return (FUP.run.bag[id] || 0) + ((FUP.house.state.pantry || {})[id] || 0); },
  gearSpots() { return [FUP.run.stash, FUP.house.state.gear || []]; },

  // Coins to pay. Pass { npc: 'shop' } and the Rizz discount + haggling apply (village.js buyPrice).
  coinPrice(cost, opts) {
    const coins = cost.coins || 0;
    return coins && opts && opts.npc ? FUP.village.buyPrice(coins, opts.npc) : coins;
  },

  canPay(cost, opts) {
    if (!cost) return true;
    if (FUP.run.coins < this.coinPrice(cost, opts)) return false;
    for (const [id, n] of Object.entries(cost.items || {})) if (this.itemCount(id) < n) return false;
    // Each gear key needs its own piece (two of the same key = two pieces)
    const spare = this.gearSpots().flat().map(g => g.key);
    for (const key of cost.gear || []) {
      const i = spare.indexOf(key);
      if (i < 0) return false;
      spare.splice(i, 1);
    }
    return true;
  },

  // Takes everything, or nothing if you can't afford it all. Returns true if paid.
  pay(cost, opts) {
    if (!cost) return true;
    if (!this.canPay(cost, opts)) return false;
    const run = FUP.run, pantry = FUP.house.state.pantry;
    run.coins -= this.coinPrice(cost, opts);
    for (const [id, n] of Object.entries(cost.items || {})) {
      const fromBag = Math.min(n, run.bag[id] || 0);
      if (fromBag) { run.bag[id] -= fromBag; if (!run.bag[id]) delete run.bag[id]; }
      const rest = n - fromBag;
      if (rest) { pantry[id] -= rest; if (!pantry[id]) delete pantry[id]; }
    }
    for (const key of cost.gear || []) {
      for (const list of this.gearSpots()) {
        const i = list.findIndex(g => g.key === key);
        if (i >= 0) { list.splice(i, 1); break; }
      }
    }
    return true;
  },

  // '500 🪙 + 4 Bark'
  costText(cost) {
    if (!cost) return 'Free';
    const parts = [];
    if (cost.coins) parts.push(`${cost.coins} 🪙`);
    for (const [id, n] of Object.entries(cost.items || {})) parts.push(`${n} ${(FUP.ingredients[id] || {}).name || id}`);
    for (const key of cost.gear || []) {
      const it = FUP.gearData.items[key] || {};
      parts.push(it.names ? it.names[FUP.run.weapon] : it.name || key);
    }
    return parts.join(' + ') || 'Free';
  },
};
