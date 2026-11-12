// ============================================================
// MATERIALS + SALVAGE RULES (v0.70). No drawing.
//   FUP.mats      the materials pouch: count(id) / add(id, n) / take(id, n) / list()
//                 (costs that name a material are paid from here: src/systems/req.js)
//   FUP.salvage   scrap piles: spots(region) / ready(region, i) / why(kind) / pry(region, i, rng)
// Numbers in data/salvage.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.mats = {
  state: {},   // { plank: 12, nails: 3 }
  reset() { this.state = {}; },
  is(id) { return !!FUP.salvageData.materials[id]; },
  info(id) { return FUP.salvageData.materials[id]; },
  count(id) { return this.state[id] || 0; },
  add(id, n = 1) { if (n > 0) this.state[id] = this.count(id) + n; return n; },
  take(id, n = 1) {
    if (this.count(id) < n) return false;
    this.state[id] -= n;
    if (!this.state[id]) delete this.state[id];
    return true;
  },
  // [{ id, n, name, emoji }] in the data's order, only what you have
  list() { return FUP.salvageData.order.filter(id => this.count(id) > 0).map(id => ({ id, n: this.count(id), ...this.info(id) })); },
  // '🪵 12  🔩 3' (or 'none')
  text() { const l = this.list(); return l.length ? l.map(m => `${m.emoji} ${m.n}`).join('  ') : 'none'; },
  // Old saves kept planks in the backpack / pantry: move them into the pouch
  migrate() {
    for (const id of FUP.salvageData.order) {
      const bag = FUP.run.bag[id] || 0, pan = (FUP.house.state.pantry || {})[id] || 0;
      if (bag) { this.add(id, bag); delete FUP.run.bag[id]; }
      if (pan) { this.add(id, pan); delete FUP.house.state.pantry[id]; }
    }
  },
};

FUP.salvage = {
  // done: { 'region:index': the day it was emptied }
  state: { done: {} },
  reset() { this.state = { done: {} }; },

  spots(region) { return FUP.salvageData.spots[region] || []; },
  kind(id) { return FUP.salvageData.kinds[id]; },
  key(region, i) { return region + ':' + i; },
  // Full again? (emptied on an earlier day, or never)
  ready(region, i) { const d = this.state.done[this.key(region, i)]; return !d || d < FUP.clock.day(); },
  // null = you can, otherwise why not ('Building 8')
  why(kindId) {
    const k = this.kind(kindId), have = FUP.skills.level('building');
    return have >= k.need ? null : `Building ${k.need} (you: ${have})`;
  },

  // Pry pile i apart. Returns { got: [{ id, n }], xp } or null (empty / too low).
  pry(region, i, rng = Math.random, where = null) {
    const s = this.spots(region)[i];
    if (!s || !this.ready(region, i) || this.why(s.kind)) return null;
    const k = this.kind(s.kind), extra = FUP.unlocks.perkSum('salvageExtra'), rare = FUP.unlocks.perkBest('rareMult', 1);
    const got = [];
    for (const l of k.loot) {
      const chance = (l.chance || 1) * (l.chance ? rare : 1);
      if (rng() >= chance) continue;
      let n = l.min + Math.floor(rng() * (l.max - l.min + 1));
      if (n > 0 && rng() < extra) n++;   // Sharp Eye perks: one more
      if (n > 0) { FUP.mats.add(l.id, n); got.push({ id: l.id, n }); }
    }
    this.state.done[this.key(region, i)] = FUP.clock.day();
    FUP.skills.addXp('building', k.xp, where);
    FUP.facts.add('salvaged');
    return { got, xp: k.xp };
  },
  // '+3 🪵  +1 🔩'
  gotText(got) { return got.length ? got.map(g => `+${g.n} ${FUP.mats.info(g.id).emoji}`).join('  ') : 'nothing useful'; },
};
