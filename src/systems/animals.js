// ============================================================
// FARM ANIMALS (Farming 2.0 F-E) — feeding, hunger, produce, the farmhand. No drawing.
// Numbers in data/animals.js. Window: src/animalUi.js.
// Each animal's state lives on its placed thing (like fruit trees), so it moves with it:
//   p.animal = { trough, food (play seconds of food left), hunger (play seconds hungry),
//                made (produce ready), grown (real seconds toward the next batch), at (real ms), dead, warned }
// Hunger runs on PLAY time (FUP.clock.every, src/main.js); produce on REAL time while fed.
// ============================================================
window.FUP = window.FUP || {};

FUP.animals = {
  state: { hiredUntil: 0 },   // the farmhand: hired through this game day (saved part 'animals')
  news: [],                   // lines for the screen (warnings, deaths, the farmhand)
  reset() { this.state = { hiredUntil: 0 }; this.news = []; },

  day() { return FUP.clockData.daySeconds; },
  list() { return FUP.place && FUP.place.state ? FUP.place.state.placed.filter(p => { const it = FUP.place.item(p.item); return it && it.animal; }) : []; },
  kind(p) { return FUP.animalData.kinds[FUP.place.item(p.item).animal]; },
  feeds(p) { return !!this.kind(p).feed; },
  // New animals arrive with one game day of food, so you have time to grow feed (PLACEHOLDER)
  get(p) { if (!p.animal) p.animal = { trough: 0, food: this.day(), hunger: 0, made: 0, grown: 0, at: Date.now(), dead: false, warned: 0 }; return p.animal; },

  // 'dead' | 'hungry' | 'ready' (produce to collect) | 'fed'
  look(p) {
    const a = this.get(p);
    if (a.dead) return 'dead';
    if (a.made > 0) return 'ready';
    if (this.feeds(p) && a.food <= 0) return 'hungry';
    return 'fed';
  },
  // Game days of hunger left before they die (for the window)
  daysLeft(p) { const a = this.get(p); return Math.max(0, (FUP.animalData.dieDays * this.day() - a.hunger) / this.day()); },

  // ---------- Time ----------
  // dtPlay = play seconds since the last call; now = real ms. Returns true if something you'd see changed.
  tick(dtPlay = 0, now = Date.now()) {
    let changed = false;
    for (const p of this.list()) if (this.tickOne(p, dtPlay, now)) changed = true;
    return changed;
  },
  tickOne(p, dtPlay, now) {
    const a = this.get(p), k = this.kind(p), D = FUP.animalData, day = this.day();
    const real = Math.max(0, (now - (a.at || now)) / 1000);
    a.at = now;
    if (a.dead) return false;
    let changed = false;
    // Produce: real time, only while fed, up to `hold`
    const fed = !k.feed || a.food > 0;
    if (fed && a.made < k.hold) {
      a.grown += real;
      while (a.grown >= k.every && a.made < k.hold) { a.grown -= k.every; a.made = Math.min(k.hold, a.made + k.batch); changed = true; }
      if (a.made >= k.hold) a.grown = 0;
    }
    if (!k.feed || dtPlay <= 0) return changed;
    // Hunger: play time
    if (a.food > 0) {
      a.food = Math.max(0, a.food - dtPlay);
      if (a.food > 0) return changed;
      changed = true;
      if (this.hired() && this.feed(p, true) === 'ok') return true;
      this.say('hungry', k);
      return true;
    }
    if (this.hired() && a.trough > 0 && this.feed(p, true) === 'ok') return true;
    a.hunger += dtPlay;
    if (a.warned < 1 && a.hunger > 0) a.warned = 1;
    if (a.warned < 2 && this.daysLeft(p) <= D.warnLeft) { a.warned = 2; this.say('starving', k); changed = true; }
    if (a.hunger >= D.dieDays * day) { a.dead = true; a.made = 0; a.grown = 0; this.say('died', k); changed = true; }
    return changed;
  },
  say(line, k) { this.news.push(FUP.animalData.lines[line].replace('{who}', k.who).replace('{be}', k.be)); },
  takeNews() { const n = this.news; this.news = []; return n; },

  // ---------- Jobs ----------
  // Put feed from your backpack into the trough. Returns how many went in (0 = none / full)
  fill(p) {
    const a = this.get(p), k = this.kind(p);
    if (!k.feed || a.dead) return 0;
    let n = 0;
    while (a.trough < k.trough && FUP.run.bagCount(k.feed) > 0) { FUP.run.takeFromBag([k.feed]); a.trough++; n++; }
    return n;
  },
  // Feed one game day from the trough. 'ok' | 'full' (still fed) | 'empty' (trough) | 'dead'
  feed(p, byFarmhand = false, where = null) {
    const a = this.get(p), k = this.kind(p);
    if (!k.feed) return 'full';
    if (a.dead) return 'dead';
    if (a.food > 0) return 'full';
    if (a.trough <= 0) { if (byFarmhand) this.say('farmhandEmpty', k); return 'empty'; }
    a.trough--; a.food = this.day(); a.hunger = 0; a.warned = 0;
    if (byFarmhand) this.say('farmhandFed', k);
    else if (FUP.garden && FUP.garden.xp) FUP.garden.xp(k.feedXp, where);
    return 'ok';
  },
  // Collect into your backpack (what doesn't fit stays). XP once per batch. { id, got, left } or null
  collect(p, where = null) {
    const a = this.get(p), k = this.kind(p);
    if (a.dead || a.made <= 0) return null;
    let got = 0;
    while (a.made > 0 && FUP.run.addToBag(k.produce)) { a.made--; got++; }
    if (got && !a.paid) { a.paid = true; if (FUP.garden && FUP.garden.xp) FUP.garden.xp(k.collectXp, where); }
    if (a.made <= 0) a.paid = false;
    return { id: k.produce, got, left: a.made };
  },
  // New animals after they died: 'ok' | 'broke' | 'alive'
  restockPrice(p) { return FUP.village.buyPrice(this.kind(p).restock, 'farmhand'); },
  restock(p) {
    const a = this.get(p);
    if (!a.dead) return 'alive';
    const price = this.restockPrice(p);
    if (FUP.run.coins < price) return 'broke';
    FUP.run.coins -= price;
    const trough = a.trough;
    delete p.animal;
    this.get(p).trough = trough;   // the feed you stocked is still there
    return 'ok';
  },

  // ---------- The farmhand (Hollis) ----------
  hired() { return FUP.clock.day() <= (this.state.hiredUntil || 0); },
  daysHired() { return Math.max(0, (this.state.hiredUntil || 0) - FUP.clock.day() + 1); },
  hirePrice(days) { return FUP.village.buyPrice(FUP.animalData.farmhand.perDay * days, 'farmhand'); },
  // 'ok' | 'broke'. Extra days add on to the ones you already paid for.
  hire(days) {
    const price = this.hirePrice(days);
    if (FUP.run.coins < price) return 'broke';
    FUP.run.coins -= price;
    this.state.hiredUntil = Math.max(this.state.hiredUntil || 0, FUP.clock.day() - 1) + days;
    return 'ok';
  },
};
