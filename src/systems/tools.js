// ============================================================
// TOOL RULES — which tier of each tool you own, and buying the next one. No drawing.
// Numbers in data/tools.js. Owned tiers feed FUP.unlocks.perkSum (src/systems/unlocks.js).
// ============================================================
window.FUP = window.FUP || {};

FUP.tools = {
  state: { rod: 0, hammer: 0, hoe: 0, can: 0 },   // tier owned per line
  reset() { this.state = { rod: 0, hammer: 0, hoe: 0, can: 0 }; },

  line(id) { return FUP.toolData.lines[id]; },
  tier(id) { return this.state[id] || 0; },
  current(id) { return this.line(id).tiers[this.tier(id)]; },
  next(id) { return this.line(id).tiers[this.tier(id) + 1] || null; },
  // What the next tier costs (the seller's Rizz discount and haggling apply)
  price(id) { const n = this.next(id); return n ? FUP.req.coinPrice({ coins: n.price }, { npc: this.line(id).npc }) : 0; },
  // 'ok' · 'max' · 'locked' (level too low) · 'broke'
  canBuy(id) {
    const n = this.next(id);
    if (!n) return 'max';
    if (!FUP.req.met(n.req)) return 'locked';
    if (FUP.run.coins < this.price(id)) return 'broke';
    return 'ok';
  },
  buy(id) {
    const r = this.canBuy(id);
    if (r !== 'ok') return r;
    FUP.req.pay({ coins: this.next(id).price }, { npc: this.line(id).npc });
    this.state[id] = this.tier(id) + 1;
    return 'ok';
  },

  // The owned tiers' values of one key, added up over every line (rodZone, biteCut...)
  sum(key) {
    let t = 0;
    for (const id of Object.keys(FUP.toolData.lines)) t += this.current(id)[key] || 0;
    return t;
  },
};
