// ============================================================
// REPAIR RULES — fixing up the run-down village. No drawing.
// Numbers in data/repairs.js. A repair is done when fact 'repair:<id>' is 1.
//   can(id) / why(id)     ready to start? / what's still missing (text lines)
//   start(id)             pay (the scene then plays the hammering)
//   finish(id)            mark done, Building XP, quest event, save
//   mapChar(tx, ty, ch)   the village map square after repairs
//   canWish() / wish()    the repaired well, once a day
//   rollMarket() / marketRows() / buyMarket(i)   the repaired Market (3 offers a day)
//   flourPrice() / buyFlour(n)                    the repaired Windmill
// ============================================================
window.FUP = window.FUP || {};

FUP.repairs = {
  // wishDay: the day you last wished · working: a repair paid for but not finished yet (page closed mid-hammer)
  // market: { day, offers: [green, seeds, curio], bought: [n, n, n] } (null = not rolled yet)
  state: { wishDay: 0, working: null, market: null },
  reset() { this.state = { wishDay: 0, working: null, market: null }; },

  list() { return FUP.repairData.list; },
  get(id) { return this.list().find(r => r.id === id) || null; },
  done(id) { return FUP.facts.get('repair:' + id) >= 1; },
  soon(id) { const r = this.get(id); return !r || !!r.soon; },

  // What you actually pay: the coins go down with the buildCut perk, then Rizz / haggling at the Carpenter
  price(id) {
    const r = this.get(id), cut = FUP.unlocks && FUP.unlocks.perkSum ? FUP.unlocks.perkSum('buildCut') : 0;
    return { ...r.cost, coins: Math.round((r.cost.coins || 0) * (1 - cut)) };
  },
  payOpts() { return { npc: 'carpenter' }; },

  can(id) {
    const r = this.get(id);
    return !!r && !this.done(id) && !r.soon && FUP.req.met(r.req) && FUP.req.canPay(this.price(id), this.payOpts());
  },
  // Why you can't start it yet, as text lines (empty = ready)
  why(id) {
    const r = this.get(id);
    if (!r) return ['No such repair.'];
    if (this.done(id)) return ['Already repaired.'];
    if (r.soon) return ['Not yet. One ruin at a time.'];
    const out = FUP.req.missing(r.req), cost = this.price(id);
    if (out.length) return out;
    if (FUP.run.coins < FUP.req.coinPrice(cost, this.payOpts())) out.push('Not enough coins');
    for (const [item, n] of Object.entries(cost.items || {})) {
      if (FUP.req.itemCount(item) < n) out.push(`Not enough ${((FUP.ingredients[item] || {}).name || item).toLowerCase()}s (${FUP.req.itemCount(item)}/${n})`);
    }
    return out;
  },

  // Pay for it. Saved straight away with `working`, so closing the page mid-hammer still finishes it.
  start(id) {
    if (!this.can(id)) return false;
    if (!FUP.req.pay(this.price(id), this.payOpts())) return false;
    this.state.working = id;
    if (FUP.save && FUP.save.write) FUP.save.write();
    return true;
  },

  finish(id, where = null) {
    const r = this.get(id);
    if (!r || this.done(id)) { this.state.working = null; return false; }
    FUP.facts.set('repair:' + id, 1);
    this.state.working = null;
    if (!FUP.skills.built || FUP.skills.built('building')) FUP.skills.addXp('building', this.xpFor(id), where);
    if (FUP.quests && FUP.quests.event) FUP.quests.event('repair', { id });
    if (FUP.save && FUP.save.write) FUP.save.write();
    return true;
  },
  xpFor(id) { return Math.round((this.get(id).cost.coins || 0) * FUP.repairData.xpPerCoin); },

  // A repair paid for when the page closed: finish it now (called after loading)
  resume() { if (this.state.working) this.finish(this.state.working); },

  // ---------- The map ----------
  mapChar(tx, ty, ch) {
    for (const r of this.list()) {
      if (!r.mapWhenDone || !this.done(r.id)) continue;
      for (const m of r.mapWhenDone) if (m.tx === tx && m.ty === ty) return m.ch;
    }
    return ch;
  },
  // The village rows with repairs applied (FUP.villageMap reads these)
  rows(base) {
    if (!this.list().some(r => r.mapWhenDone && this.done(r.id))) return base;
    return base.map((row, ty) => row.split('').map((ch, tx) => this.mapChar(tx, ty, ch)).join(''));
  },
  // A different ground picture once paths change
  groundKey() { return 'village_ground' + this.list().filter(r => r.mapWhenDone && this.done(r.id)).map(r => '_' + r.id).join(''); },
  // Ruined squares you can't walk on (rubble across the South Road)
  blocked(tx, ty) {
    for (const r of this.list()) {
      const s = r.site;
      if (!s || !(r.block || (r.blockWhenRuined && !this.done(r.id)))) continue;
      if (tx >= s.tx && tx < s.tx + s.w && ty >= s.ty && ty < s.ty + s.h) return true;
    }
    return false;
  },

  // ---------- The well ----------
  canWish() { return this.done('well') && this.state.wishDay !== FUP.clock.day() && FUP.run.coins >= FUP.repairData.wish.cost; },
  wishedToday() { return this.state.wishDay === FUP.clock.day(); },

  // Returns { kind, text, gave } or null. kind: nothing / ingredient / coins / seed
  wish(rng = Math.random) {
    if (!this.canWish()) return null;
    const W = FUP.repairData.wish;
    FUP.run.coins -= W.cost;
    this.state.wishDay = FUP.clock.day();
    const total = W.table.reduce((s, e) => s + e.w, 0);
    let roll = rng() * total, pick = W.table[W.table.length - 1];
    for (const e of W.table) { if (roll < e.w) { pick = e; break; } roll -= e.w; }
    const one = list => list[Math.floor(rng() * list.length)];
    if (pick.coins) { FUP.run.coins += pick.coins; return { kind: 'coins', gave: pick.coins, text: `${pick.coins} 🪙` }; }
    if (pick.ingredient) {
      const ids = Object.keys(FUP.ingredients).filter(k => FUP.ingredients[k].rarity === pick.ingredient && FUP.ingredients[k].source === 'Forest');
      const id = one(ids);
      if (id && FUP.run.addToBag(id)) return { kind: 'ingredient', gave: id, text: `1 ${FUP.ingredients[id].name}` };
      return { kind: 'nothing', gave: null, text: '' };   // backpack full: the well keeps it
    }
    if (pick.seed) {
      const G = FUP.gardenData.crops, lv = FUP.skills.level('gardening');
      const id = one(Object.keys(G).filter(k => G[k].level <= lv));
      if (id) { FUP.garden.state.seeds[id] = (FUP.garden.state.seeds[id] || 0) + 1; return { kind: 'seed', gave: id, text: `a ${FUP.ingredients[id].name} seed` }; }
    }
    return { kind: 'nothing', gave: null, text: '' };
  },

  // ---------- The Market (repaired) ----------
  // Rolled once a day (FUP.clock.onDay, and the first time the window opens). Same day = same offers.
  rollMarket(rng = Math.random, force = false) {
    const M = FUP.repairData.market, day = FUP.clock.day(), st = this.state.market;
    if (!force && st && st.day === day) return st;
    const one = list => list[Math.floor(rng() * list.length)];
    // Greengrocer: an Uncommon / Rare ingredient from somewhere you've been
    const where = ['Forest'].concat(FUP.world && FUP.world.state && FUP.world.state.seen && FUP.world.state.seen.marsh ? ['Marsh'] : []);
    const greens = Object.keys(FUP.ingredients).filter(k => { const g = FUP.ingredients[k]; return g.enabled !== false && (g.rarity === 'Uncommon' || g.rarity === 'Rare') && where.includes(g.source) && g.sell; });
    const green = one(greens);
    // Seeds + bait: half the time a crop seed, half a bait you can use
    const baits = FUP.fishData && FUP.fishData.bait ? Object.keys(FUP.fishData.bait).filter(id => FUP.req.met(FUP.fishData.bait[id].req)) : [];
    const second = baits.length && rng() < 0.5 ? { kind: 'bait', id: one(baits) } : { kind: 'seed', id: one(Object.keys(FUP.gardenData.crops)) };
    // Curios: one you don't own yet
    const curio = this.curiosLeft();
    this.state.market = { day, offers: [{ kind: 'green', id: green }, second, { kind: 'curio', id: curio.length ? one(curio) : null }], bought: [0, 0, 0] };
    return this.state.market;
  },
  curiosLeft() {
    return FUP.repairData.market.curios.filter(id => { const it = FUP.placeData.items[id]; return it && FUP.place.total(id) === 0 && (!it.zones.includes('home') || FUP.placeData.zones.home); });
  },
  // The 3 rows for the window: { kind, id, name, emoji, price (after Rizz), stock, left }
  marketRows() {
    const M = FUP.repairData.market, st = this.rollMarket();
    return st.offers.map((o, i) => {
      const row = { kind: o.kind, id: o.id, stock: 0, left: 0, price: 0, name: '', emoji: '' };
      if (!o.id) return row;
      let base = 0;
      if (o.kind === 'green') { const g = FUP.ingredients[o.id]; base = M.greenMult * g.sell; row.stock = M.greenStock; row.name = g.name; row.emoji = g.emoji; }
      if (o.kind === 'seed') { const g = FUP.ingredients[o.id]; base = M.seedMult * FUP.gardenData.crops[o.id].seedPrice; row.stock = M.seedStock; row.name = g.name + ' seed'; row.emoji = '🌱'; }
      if (o.kind === 'bait') { const b = FUP.fishData.bait[o.id]; base = M.baitMult * b.price; row.stock = M.baitStock; row.name = b.name; row.emoji = b.emoji; }
      if (o.kind === 'curio') { const it = FUP.placeData.items[o.id]; base = it.cost.coins; row.stock = 1; row.name = it.name; row.emoji = it.emoji; }
      row.base = Math.max(1, Math.round(base));
      row.price = FUP.req.coinPrice({ coins: row.base }, { npc: 'shop' });
      row.left = Math.max(0, row.stock - (st.bought[i] || 0));
      return row;
    });
  },
  // Buy one of row i: 'ok' · 'soldOut' · 'broke' · 'full' (no room in the backpack)
  buyMarket(i) {
    const row = this.marketRows()[i], st = this.state.market;
    if (!row || !row.id || row.left <= 0) return 'soldOut';
    if (FUP.run.coins < row.price) return 'broke';
    if (row.kind === 'green' && !FUP.run.addToBag(row.id)) return 'full';
    FUP.run.coins -= row.price;
    if (row.kind === 'seed') FUP.garden.state.seeds[row.id] = (FUP.garden.state.seeds[row.id] || 0) + 1;
    if (row.kind === 'bait') FUP.fishing.state.bait[row.id] = FUP.fishing.baitCount(row.id) + 1;
    if (row.kind === 'curio') {
      FUP.place.state.owned[row.id] = FUP.place.ownedCount(row.id) + 1;
      FUP.skills.addXp('building', Math.round(row.base * FUP.placeData.xp.perCoin));
    }
    st.bought[i] = (st.bought[i] || 0) + 1;
    return 'ok';
  },
  // For the "While you were out" card
  marketLine() {
    if (!this.done('market')) return '';
    const st = this.state.market;
    return !st || st.day !== FUP.clock.day() ? 'The Market has new offers today.' : '';
  },

  // ---------- The Windmill (repaired) ----------
  flourPrice() { return FUP.req.coinPrice({ coins: FUP.repairData.miller.flourPrice }, { npc: 'shop' }); },
  // Buy n flour: how many you got (stops when you're out of coins or room)
  buyFlour(n) {
    let got = 0;
    while (got < n && FUP.run.coins >= this.flourPrice() && FUP.run.addToBag('flour')) { FUP.run.coins -= this.flourPrice(); got++; }
    return got;
  },
};

// A new day: the Market re-rolls (only matters once it's repaired)
if (FUP.clock && FUP.clock.onDay) FUP.clock.onDay(() => { if (FUP.repairs.done('market')) FUP.repairs.rollMarket(Math.random, true); });
