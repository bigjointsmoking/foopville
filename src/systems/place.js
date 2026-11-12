// ============================================================
// PLACEMENT RULES — buying, putting down, moving and taking back the
// things in data/place.js. No drawing.
// Things are never destroyed: taking one back returns it to `owned`.
// ============================================================
window.FUP = window.FUP || {};

FUP.place = {
  // owned: { itemId: how many you hold, not placed }
  // placed: [{ uid, item, zone, tx, ty }]  (tx, ty inside the zone)
  state: { owned: {}, placed: [], uid: 1 },
  reset() { this.state = { owned: {}, placed: [], uid: 1 }; },

  item(id) { return FUP.placeData.items[id]; },
  zone(id) { return FUP.placeData.zones[id]; },
  ownedCount(id) { return this.state.owned[id] || 0; },
  // How many you have in all: in your pocket + placed
  total(id) { return this.ownedCount(id) + this.state.placed.filter(p => p.item === id).length; },
  // The map that a region's squares live on (more regions arrive with the world map)
  mapOf(region) { return region === 'village' ? FUP.villageMap : region === 'home' ? (FUP.homeMap || null) : null; },
  // Ground things and furniture go on any free square; buildings snap to slots (v0.68: furniture is free-placed in your room)
  freeKind(kind) { return kind === 'ground' || kind === 'furniture'; },

  // ---------- Buying (from the Carpenter) ----------
  // The hammer (data/tools.js buildCut) takes coins off anything you build. Building Mastery makes paths, fences and hedges free.
  buildCut() { return FUP.unlocks.perkSum('buildCut'); },
  isFree(itemId) { return !!this.item(itemId).free && FUP.unlocks.perkBest('freeGround', 0) > 0; },
  // What n of them cost after the hammer (before the Carpenter's Rizz discount): { coins, items }
  cost(itemId, n = 1) {
    const c = this.item(itemId).cost || {}, items = {};
    for (const [id, k] of Object.entries(c.items || {})) items[id] = k * n;
    const coins = this.isFree(itemId) ? 0 : Math.round((c.coins || 0) * (1 - this.buildCut())) * n;
    return { coins, items };
  },
  price(itemId, n = 1) { return FUP.req.coinPrice(this.cost(itemId, n), { npc: 'carpenter' }); },
  // Buy n (ground things come in any number). 'ok' | 'max' | 'locked' (requirement not met) | 'broke'
  buy(itemId, n = 1) {
    const it = this.item(itemId);
    if (!it) return 'locked';
    if (it.max && this.total(itemId) + n > it.max) return 'max';
    if (!FUP.req.met(it.req)) return 'locked';
    if (!FUP.req.pay(this.cost(itemId, n), { npc: 'carpenter' })) return 'broke';
    this.state.owned[itemId] = this.ownedCount(itemId) + n;
    // Building XP from the listed coin price (discounts don't shrink it; free things give none)
    if (!this.isFree(itemId)) FUP.skills.addXp('building', Math.round(((it.cost || {}).coins || 0) * n * FUP.placeData.xp.perCoin));
    return 'ok';
  },

  // ---------- Planks (the sawhorse next to the Carpenter) ----------
  plankBark() { return FUP.unlocks.perkBest('plankBark', FUP.placeData.plankBark); },
  // 'ok' | 'noBark' | 'full'
  canSaw() {
    if (!FUP.req.canPay({ items: { bark: this.plankBark() } })) return 'noBark';
    return FUP.run.canAddIng('plank') ? 'ok' : 'full';
  },
  // Turn Bark (backpack first, then pantry) into 1 plank + Building XP. Returns true if it worked.
  saw(where = null) {
    if (this.canSaw() !== 'ok') return false;
    FUP.req.pay({ items: { bark: this.plankBark() } });
    if (!FUP.run.addToBag('plank')) return false;
    FUP.skills.addXp('building', FUP.placeData.xp.plank, where);
    FUP.facts.add('sawn');
    return true;
  },
  plankPrice() { return FUP.village.buyPrice(FUP.placeData.plankPrice, 'carpenter'); },
  buyPlanks(n = 1) {
    let got = 0;
    while (got < n && FUP.run.coins >= this.plankPrice() && FUP.run.addToBag('plank')) { FUP.run.coins -= this.plankPrice(); got++; }
    return got;
  },

  // ---------- Where things are ----------
  list(zoneId) { return this.state.placed.filter(p => p.zone === zoneId); },
  covers(p, tx, ty) { const it = this.item(p.item); return tx >= p.tx && tx < p.tx + it.w && ty >= p.ty && ty < p.ty + it.h; },
  // The placed thing on this zone square, or null
  at(zoneId, tx, ty) {
    const here = this.list(zoneId).filter(p => this.covers(p, tx, ty));
    return here.find(p => !this.item(p.item).flat) || here[0] || null;   // a table on a rug: the table is what you tap
  },
  // Flat things (rugs) can lie under one other thing that isn't flat (v0.68)
  stacks(a, b) { return !!this.item(a).flat !== !!this.item(b).flat; },
  // The slot that covers this zone square, or null
  slotAt(zoneId, tx, ty) { return this.zone(zoneId).slots.find(s => tx >= s.tx && tx < s.tx + s.w && ty >= s.ty && ty < s.ty + s.h) || null; },
  // Which zone is this map square in? Returns { zone, tx, ty } (tx, ty inside the zone) or null.
  zoneAt(region, mx, my) {
    for (const [id, z] of Object.entries(FUP.placeData.zones)) {
      if (z.where.region !== region) continue;
      const tx = mx - z.where.tx, ty = my - z.where.ty;
      if (tx >= 0 && ty >= 0 && tx < z.w && ty < z.h) return { zone: id, tx, ty };
    }
    return null;
  },
  // Is a solid placed thing on this map square? (walking)
  blocked(region, mx, my) {
    const z = this.zoneAt(region, mx, my);
    if (!z) return false;
    const p = this.at(z.zone, z.tx, z.ty);
    return !!(p && this.item(p.item).solid);
  },
  // Same, for a box in pixels (centre x, y, half-size h, squares of `tile` pixels)
  blockedBox(region, x, y, h, tile) {
    for (let ty = Math.floor((y - h) / tile); ty <= Math.floor((y + h) / tile); ty++)
      for (let tx = Math.floor((x - h) / tile); tx <= Math.floor((x + h) / tile); tx++)
        if (this.blocked(region, tx, ty)) return true;
    return false;
  },

  // ---------- Putting things down ----------
  // Where this item would really go if you tap this square: buildings snap to the slot's top-left corner.
  snap(itemId, zoneId, tx, ty) {
    const it = this.item(itemId);
    if (it && !this.freeKind(it.kind)) { const s = this.slotAt(zoneId, tx, ty); if (s) return { tx: s.tx, ty: s.ty }; }
    return { tx, ty };
  },
  // `ignoreUid`: a placed thing that doesn't count as in the way (the one being moved)
  canPut(itemId, zoneId, tx, ty, ignoreUid = null) {
    const it = this.item(itemId), z = this.zone(zoneId);
    if (!it || !z || !(it.zones || []).includes(zoneId)) return false;
    if (tx < 0 || ty < 0 || tx + it.w > z.w || ty + it.h > z.h) return false;
    if (this.freeKind(it.kind)) {
      for (let y = ty; y < ty + it.h; y++) for (let x = tx; x < tx + it.w; x++) if (this.slotAt(zoneId, x, y)) return false;
    } else {
      // Top-left corner on a slot's corner, the right kind of slot, and no bigger than the slot
      const s = z.slots.find(s => s.tx === tx && s.ty === ty);
      if (!s || !s.fits.includes(it.kind) || it.w > s.w || it.h > s.h) return false;
      // One thing per slot
      if (this.list(zoneId).some(p => p.uid !== ignoreUid && this.slotAt(zoneId, p.tx, p.ty) === s)) return false;
    }
    const map = this.mapOf(z.where.region), ground = z.ground || FUP.placeData.walkable;
    for (let y = ty; y < ty + it.h; y++) for (let x = tx; x < tx + it.w; x++) {
      if (this.list(zoneId).some(o => o.uid !== ignoreUid && this.covers(o, x, y) && !this.stacks(itemId, o.item))) return false;
      if (map && !ground.includes(map.tileAt(z.where.tx + x, z.where.ty + y))) return false;
    }
    return true;
  },

  // Would putting a solid thing here wall the hero in? (hx, hy = the hero's map square)
  // The hero must still be able to walk to the zone's edge.
  wouldTrap(itemId, zoneId, tx, ty, hx, hy) {
    const it = this.item(itemId), z = this.zone(zoneId), map = this.mapOf(z.where.region);
    if (!it.solid || !map) return false;
    const zx = hx - z.where.tx, zy = hy - z.where.ty;
    if (zx < 0 || zy < 0 || zx >= z.w || zy >= z.h) return false;   // you're not inside the zone
    const newOne = (x, y) => x >= tx && x < tx + it.w && y >= ty && y < ty + it.h;
    const open = (x, y) => !newOne(x, y) && !map.blockedTile(z.where.tx + x, z.where.ty + y) && !(this.at(zoneId, x, y) && this.item(this.at(zoneId, x, y).item).solid);
    if (!open(zx, zy)) return true;
    const seen = new Set([zx + ',' + zy]), queue = [[zx, zy]];
    while (queue.length) {
      const [x, y] = queue.shift();
      if (x === 0 || y === 0 || x === z.w - 1 || y === z.h - 1) return false;   // reached the edge: you can get out
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (seen.has(k) || !open(nx, ny)) continue;
        seen.add(k); queue.push([nx, ny]);
      }
    }
    return true;
  },
  // Put one you own down. Returns the placed entry, or null.
  put(itemId, zoneId, tx, ty) {
    if (this.ownedCount(itemId) <= 0 || !this.canPut(itemId, zoneId, tx, ty)) return null;
    this.state.owned[itemId]--;
    if (!this.state.owned[itemId]) delete this.state.owned[itemId];
    const p = { uid: this.state.uid++, item: itemId, zone: zoneId, tx, ty };
    this.state.placed.push(p);
    if (!FUP.facts.has('built:' + itemId)) FUP.skills.addXp('building', FUP.placeData.xp.firstPlace);   // the first of its kind
    FUP.facts.add('built:' + itemId);
    return p;
  },
  byUid(uid) { return this.state.placed.find(p => p.uid === uid) || null; },
  move(uid, tx, ty) {
    const p = this.byUid(uid);
    if (!p || !this.canPut(p.item, p.zone, tx, ty, uid)) return false;
    p.tx = tx; p.ty = ty;
    return true;
  },
  // Back into `owned` (free, never destroyed)
  take(uid) {
    const p = this.byUid(uid);
    if (!p) return false;
    if (this.item(p.item).stall && FUP.stall) FUP.stall.closeDown(uid);   // its dishes and coins come back to you
    this.state.placed = this.state.placed.filter(q => q !== p);
    this.state.owned[p.item] = this.ownedCount(p.item) + 1;
    return true;
  },
};
