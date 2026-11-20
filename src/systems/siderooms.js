// ============================================================
// SIDE ROOMS (E3) — what's in each Forest "S" clearing today. No drawing.
// Numbers in data/siderooms.js. Drawn by src/scenes/WorldSideRooms.js.
// A region's rooms live in its kept state (A.side, saved with the regions):
//   { day, rooms: [{ kind, tx, ty, done, foes?, loot?, stock? }] }
// Patch ingredients and the guard go into A.items / A.enemies marked `side`
// (so the normal respawn leaves them alone).
// ============================================================
window.FUP = window.FUP || {};

FUP.sideRooms = {
  has(id) { return FUP.sideRoomData.regions.includes(id); },

  // New day? Roll every room in this region. Call before the map is drawn. True = it rolled.
  refresh(id, A, day = FUP.clock.day(), rng = Math.random) {
    if (!A || !this.has(id) || (A.side && A.side.day === day)) return false;
    const F = FUP.forest, D = FUP.sideRoomData, was = F.current;
    F.use(id);
    const a = F.area(id), W = FUP.world.state;
    A.items = A.items.filter(it => !it.side);       // yesterday's leftovers go
    A.enemies = A.enemies.filter(e => !e.side);
    const rooms = F.find('S').map(s => {
      const kinds = { ...D.kinds };
      if (W.hank && W.hank.day === day && W.hank.count >= D.hank.maxPerDay) delete kinds.hank;   // once a day in the whole Forest
      const r = { kind: F.pickWeighted(kinds, rng), tx: s.tx, ty: s.ty, done: false };
      if (r.kind === 'hank') { W.hank = { day, count: (W.hank && W.hank.day === day ? W.hank.count : 0) + 1 }; r.stock = this.rollStock(id, rng); }
      if (r.kind === 'patch') this.rollPatch(id, A, r, rng);
      if (r.kind === 'ambush') r.foes = this.ambushGroup(a, rng);
      if (r.kind === 'stash') r.loot = this.rollStash(id, rng);
      return r;
    });
    A.side = { day, rooms };
    F.use(was);
    return true;
  },

  rooms(A) { return (A && A.side && A.side.rooms) || []; },
  dropTier(id) { const r = FUP.world.region(id); return (r && r.dropTier) || 1; },

  // ---------- Rare ingredient patch ----------
  // The clearing's square and the open squares around it get one ingredient each
  rollPatch(id, A, r, rng) {
    const F = FUP.forest, P = FUP.sideRoomData.patch, a = F.area(id);
    const n = P.min + Math.floor(rng() * (P.max - P.min + 1)), spots = [];
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const tx = r.tx + dx, ty = r.ty + dy;
      if (spots.length < n && '.=S'.includes(F.tileAt(tx, ty)) && !F.blockedTile(tx, ty)) spots.push({ tx, ty });
    }
    for (const s of spots) A.items.push({ ...s, id: FUP.run.rollIngredient(rng, P.odds, a.forage || null), taken: false, side: true });
    if (rng() < P.guardChance) {
      const e = F.makeEnemy(F.pickWeighted(a.enemyTypes, rng), { tx: r.tx, ty: r.ty }, a, rng);
      e.side = true;
      A.enemies.push(e);
    }
  },

  // ---------- Ambush ----------
  // Who jumps you: 2-3 of the area's enemies (a list of enemy types)
  ambushGroup(a, rng = Math.random) {
    const D = FUP.sideRoomData.ambush, n = D.min + Math.floor(rng() * (D.max - D.min + 1)), out = [];
    for (let k = 0; k < n; k++) out.push(FUP.forest.pickWeighted(a.enemyTypes, rng));
    return out;
  },
  // Standing close enough to spring it?
  ambushAt(A, x, y) {
    const T = FUP.forest.size(), touch = FUP.sideRoomData.ambush.touch;
    return this.rooms(A).find(r => r.kind === 'ambush' && !r.done && Math.hypot(x - (r.tx * T + T / 2), y - (r.ty * T + T / 2)) < touch) || null;
  },

  // ---------- Treasure stash ----------
  rollStash(id, rng) {
    const S = FUP.sideRoomData.stash, a = FUP.forest.area(id);
    if (rng() < S.coinChance) return { coins: Math.round((S.coins[0] + rng() * (S.coins[1] - S.coins[0])) * (a.coinMult || 1)) };
    return { gear: FUP.gear.rollDrop(false, rng, null, 1e9, this.dropTier(id)) };   // always drops: normal rarity roll
  },
  // Dig it up. Returns { coins } | { gear } | { full: item } (the gear waits in the chest) | null
  dig(r) {
    if (!r || r.kind !== 'stash' || r.done) return null;
    const L = r.loot || {};
    if (L.gear) {
      if (!FUP.run.addGear(L.gear)) return { full: L.gear };
      r.done = true;
      return { gear: L.gear };
    }
    FUP.run.coins += L.coins || 0;
    r.done = true;
    return { coins: L.coins || 0 };
  },

  // ---------- Hooded Hank ----------
  rollStock(id, rng = Math.random) {
    const H = FUP.sideRoomData.hank, G = FUP.gearData.items, tier = this.dropTier(id), out = [];
    const gearKeys = Object.keys(G).filter(k => { const d = G[k]; return !d.starter && !d.chase && !d.quest && !d.hank && (d.tier || 1) <= tier; });
    for (let k = 0; k < H.items + 1; k++) {
      const weights = { ...H.stock };
      if (out.some(o => o.type === 'lantern')) delete weights.lantern;   // one Lantern at most
      const type = FUP.forest.pickWeighted(weights, rng), o = { type, sold: false, secret: k === H.items };
      if (type === 'ingredient') o.id = FUP.run.rollIngredient(rng, H.ingredientOdds, FUP.forest.area(id).forage || null);
      if (type === 'gear') o.key = gearKeys[Math.floor(rng() * gearKeys.length)];
      if (type === 'lantern') o.key = 'lantern';
      out.push(o);
    }
    return out;
  },
  // What he shows you: the secret item only at Rizz 15
  shown(r) { return (r.stock || []).filter(o => !o.secret || FUP.skills.level('rizz') >= FUP.sideRoomData.hank.secretRizz); },
  name(o) { return o.type === 'ingredient' ? FUP.ingredients[o.id].name : FUP.gearData.items[o.key].name; },
  emoji(o) { return o.type === 'ingredient' ? FUP.ingredients[o.id].emoji : FUP.gearData.items[o.key].emoji; },
  // Village price x1.5 (the Lantern has its own price), then the usual Rizz discount and haggle
  basePrice(o) {
    const H = FUP.sideRoomData.hank, V = FUP.villageData;
    if (o.type === 'lantern') return FUP.gearData.items.lantern.price;
    if (o.type === 'gear') return Math.round(FUP.gearData.items[o.key].price * H.priceMult);
    const ing = FUP.ingredients[o.id];
    return Math.round((V.shopIngredients[o.id] || (ing.sell || 1) * H.ingredientFromSell) * H.priceMult);
  },
  price(o) { return FUP.village.buyPrice(this.basePrice(o)); },
  // 'ok' | 'broke' | 'full' | 'sold'
  buy(o) {
    if (o.sold) return 'sold';
    const run = FUP.run, p = this.price(o);
    if (run.coins < p) return 'broke';
    if (o.type === 'ingredient' ? !run.addToBag(o.id) : !run.addGear(FUP.gear.fromShop(o.key))) return 'full';
    run.coins -= p;
    o.sold = true;
    return 'ok';
  },
};
