// ============================================================
// FARM ORDERS (F-F) — Hollis's board: 3 orders, new ones every few game days. No drawing.
// Numbers in data/orders.js. Window: VillagePanels.renderOrders.
//   state = { day, list: [{ giver, type, id, n, coins, xp, mats, extra, done, since }] }
// ============================================================
window.FUP = window.FUP || {};

FUP.orders = {
  state: { day: 0, list: [] },
  reset() { this.state = { day: 0, list: [] }; },

  // ---------- What can you make right now? ----------
  canMake(ask) {
    const id = ask.id;
    if (ask.type === 'crop') {
      const c = FUP.gardenData.crops[id];
      if (!c || !FUP.garden.canGrow(id)) return false;
      return c.shop !== false && FUP.req.met(c.req) ? true : FUP.facts.has('ing:' + id) || FUP.garden.seedCount(id) > 0;   // quest crops: once you've had them
    }
    if (ask.type === 'produce') return FUP.animals.list().some(p => !FUP.animals.get(p).dead && FUP.animals.kind(p).produce === id);
    if (ask.type === 'fruit') return FUP.garden.trees().some(p => FUP.garden.treeDef(p).fruit === id && FUP.garden.treeState(p).stage >= FUP.gardenData.treeStages);
    if (ask.type === 'giant') return FUP.gardenData.giant.crops.some(c => FUP.garden.canGrow(c));
    if (ask.type === 'dish') {
      const r = FUP.recipeData.list.find(x => x.name === id);
      if (!r || !FUP.cooking.canCook(r, FUP.skills.level('cooking'))) return false;
      // Its farm ingredients must be things you can make too
      return r.ids.every(i => (FUP.ingredients[i] || {}).source !== 'Farm' || this.canMake(this.askFor(i)));
    }
    return false;
  },
  // The ask that would make a farm ingredient (crop, produce or fruit)
  askFor(id) {
    if (FUP.gardenData.crops[id]) return { type: 'crop', id };
    if (Object.values(FUP.animalData.kinds).some(k => k.produce === id)) return { type: 'produce', id };
    return { type: 'fruit', id };
  },

  // ---------- The daily roll ----------
  // Every refreshDays game days: 3 new orders (each from a different villager). Returns true if it rolled.
  nextDay() { return (this.state.day || 0) + (FUP.orderData.refreshDays || 1); },
  refresh(day = FUP.clock.day(), rng = Math.random) {
    const D = FUP.orderData, last = this.state.day || 0;
    if (last && day >= last && day - last < (D.refreshDays || 1)) return false;   // every refreshDays game days (v0.99.6)
    const pool = [];
    for (const [giver, g] of Object.entries(D.givers)) for (const a of g.asks) if (this.canMake(a)) pool.push({ giver, a });
    const list = [];
    while (list.length < D.perDay && pool.length) {
      const total = pool.reduce((s, o) => s + o.a.w, 0);
      let roll = rng() * total, k = 0;
      for (; k < pool.length - 1; k++) { roll -= pool[k].a.w; if (roll <= 0) break; }
      const { giver, a } = pool[k];
      list.push(this.make(giver, a, rng));
      for (let j = pool.length - 1; j >= 0; j--) if (pool[j].giver === giver) pool.splice(j, 1);   // one order per villager a day
    }
    this.state = { day, list };
    return true;
  },
  // One order with its pay rolled
  make(giver, a, rng = Math.random) {
    const D = FUP.orderData, n = a.n[0] + Math.floor(rng() * (a.n[1] - a.n[0] + 1));
    const coins = a.type === 'giant' ? D.giantPay : Math.round(this.unitValue(a) * n * D.payMult);
    const mats = {}, m = D.mats.min + Math.floor(rng() * (D.mats.max - D.mats.min + 1));
    for (let k = 0; k < m; k++) { const id = FUP.forest.pickWeighted(D.mats.pick, rng); mats[id] = (mats[id] || 0) + 1; }
    let extra = null;
    if (rng() < D.extraChance) {
      const total = D.extras.reduce((s, e) => s + e.w, 0);
      let roll = rng() * total;
      for (const e of D.extras) { roll -= e.w; if (roll <= 0) { extra = e; break; } }
      extra = extra || D.extras[D.extras.length - 1];
    }
    return { giver, type: a.type, id: a.id || null, n, line: a.line || FUP.orderData.givers[giver].line || null, coins, xp: Math.round(coins * D.xpShare), mats, extra, done: false,
      since: a.type === 'giant' ? FUP.facts.get('did:giant') : 0 };
  },
  // What one of the goods sells for (raw at the Shopkeeper's base price, or the dish's)
  unitValue(a) {
    if (a.type === 'dish') { const r = FUP.recipeData.list.find(x => x.name === a.id); return (r && r.sell) || 1; }
    return (FUP.ingredients[a.id] && FUP.ingredients[a.id].sell) || 1;
  },

  // ---------- Handing in ----------
  have(o) {
    if (o.type === 'giant') return FUP.facts.get('did:giant') > o.since ? 1 : 0;
    if (o.type === 'dish') return FUP.run.satchel.filter(d => d.name === o.id).length;
    return FUP.run.bagCount(o.id);
  },
  ready(o) { return !o.done && this.have(o) >= o.n; },
  readyCount() { return this.state.list.filter(o => this.ready(o)).length; },
  // Hand it in. 'ok' | 'short' (not enough) | 'done' | 'room' (no room for a feed bundle)
  handIn(o, where = null) {
    if (o.done) return 'done';
    if (!this.ready(o)) return 'short';
    const run = FUP.run;
    // Feed bundles go in your backpack: no room = hand in later (nothing goes to storage by itself)
    if (o.extra && o.extra.items && !this.roomFor(o.extra.items, o)) return 'room';
    if (o.type === 'dish') for (let k = 0; k < o.n; k++) run.satchel.splice(run.satchel.findIndex(d => d.name === o.id), 1);
    else if (o.type !== 'giant') run.takeFromBag(new Array(o.n).fill(o.id));
    run.coins += o.coins;
    FUP.skills.addXp(o.type === 'dish' ? 'cooking' : 'gardening', o.xp, where);
    for (const [id, k] of Object.entries(o.mats)) FUP.mats.add(id, k);
    const e = o.extra;
    if (e && e.seeds) for (const [id, k] of Object.entries(e.seeds)) FUP.garden.state.seeds[id] = FUP.garden.seedCount(id) + k;
    if (e && e.place) FUP.place.state.owned[e.place] = FUP.place.ownedCount(e.place) + 1;
    if (e && e.items) for (const [id, k] of Object.entries(e.items)) for (let j = 0; j < k; j++) run.addToBag(id);
    o.done = true;
    if (FUP.facts) FUP.facts.add('did:order');
    return 'ok';
  },
  // Would these items fit in the backpack once the order's own goods have left it?
  roomFor(items, o) {
    const run = FUP.run, S = FUP.runData.stack.ingredient, slots = id => Math.ceil(run.bagCount(id) / S);
    let free = run.freeSlots();
    if (o.type !== 'dish' && o.type !== 'giant') free += slots(o.id) - Math.ceil((run.bagCount(o.id) - o.n) / S);   // stacks the goods free up
    for (const [id, k] of Object.entries(items)) {
      const n = run.bagCount(id) - (id === o.id ? o.n : 0), space = n > 0 && n % S ? S - (n % S) : 0;
      if (k > space) { free -= Math.ceil((k - space) / S); if (free < 0) return false; }
    }
    return true;
  },

  // ---------- Words ----------
  what(o) {
    if (o.type === 'giant') return 'Harvest a giant crop';
    if (o.type === 'dish') return `${o.n} × ${o.id}`;
    const ing = FUP.ingredients[o.id];
    return `${o.n} × ${ing.emoji} ${ing.name}`;
  },
  payText(o) {
    const bits = [`${o.coins} 🪙`, `${o.xp} ${o.type === 'dish' ? 'Cooking' : 'Gardening'} XP`];
    bits.push(Object.entries(o.mats).map(([id, k]) => `${FUP.salvageData.materials[id].emoji} ${k} ${FUP.salvageData.materials[id].name}`).join(', '));
    const e = o.extra;
    if (e && e.seeds) bits.push('🎁 ' + Object.entries(e.seeds).map(([id, k]) => `${k} ${FUP.ingredients[id].name} seeds`).join(', '));
    if (e && e.place) bits.push(`🎁 ${FUP.placeData.items[e.place].emoji} ${FUP.placeData.items[e.place].name}`);
    if (e && e.items) bits.push('🎁 ' + Object.entries(e.items).map(([id, k]) => `${k} ${FUP.ingredients[id].name}`).join(', '));
    return bits.filter(Boolean).join(' · ');
  },
};
