// ============================================================
// COLLECTION LOG RULES (E2) — which entries each page has, which you've found, the pop-up queue.
// Numbers and words in data/log.js. The window is src/logUi.js. No saving of its own: it reads
// facts (src/systems/facts.js), so it's per life like they are.
//   FUP.log.entries(pageId)   [{ key, id, name, emoji, sprite, hint, got, count, extra }]
//   FUP.log.counts(pageId)    { got, total }      FUP.log.total()  { got, total }
//   FUP.log.backfill()        fill entries for things a save already had (no pop-ups)
//   FUP.log.prizes()          give any milestone reward you've reached and not had yet (data/log.js rewards)
// ============================================================
window.FUP = window.FUP || {};

FUP.log = {
  news: [],          // entries waiting for their pop-up
  showing: false,
  _byKey: null,      // fact key -> { page, id } (built once)
  _walk: {},         // region id -> walkable squares (for "explored %")

  D() { return FUP.logData; },
  pageInfo(id) { return this.D().pages.find(p => p.id === id); },

  // ---------- The entries on each page (built from the game's own data) ----------
  list(pageId) {
    const D = this.D(), ING = FUP.ingredients;
    if (pageId === 'ingredients') return Object.entries(ING).filter(([, g]) => D.ingredientSources.includes(g.source))
      .map(([id, g]) => ({ id, name: g.name, emoji: g.emoji, sprite: FUP.ui && FUP.ui.ingKey ? FUP.ui.ingKey(id) : null, hint: D.sourceHints[g.source] || '' }));
    if (pageId === 'dishes') return FUP.recipeData.list.map(r => ({ id: FUP.cooking.recipeId(r), name: r.name, secret: !!r.secret, emoji: '🍲',
      hint: r.secret ? 'A secret recipe: experiment at a stove or campfire' : `Cooking ${r.level}` }));
    if (pageId === 'fish') {
      const spots = Object.values(FUP.fishData.spots || {});
      const fish = Object.keys(FUP.fishData.fish).map(id => {
        const where = spots.filter(s => s.fish && s.fish[id]).map(s => s.name);
        return { id, name: ING[id] ? ING[id].name : id, emoji: ING[id] ? ING[id].emoji : '🐟', sprite: FUP.ui && FUP.ui.ingKey ? FUP.ui.ingKey(id) : null,
          hint: `${where.length ? where.join(', ') : 'Special spots'} · Fishing ${FUP.fishData.fish[id].level}` };
      });
      const junk = Object.entries(ING).filter(([, g]) => g.source === 'Junk').map(([id, g]) => ({ id, name: g.name, emoji: g.emoji, hint: D.sourceHints.Junk }));
      return fish.concat(junk);
    }
    if (pageId === 'creatures') {
      const areas = (FUP.forestData.areas || []).concat(Object.values((FUP.worldData && FUP.worldData.areas) || {}));
      return Object.entries(FUP.enemies).filter(([id, e]) => !D.skipCreatures.includes(id) && !e.minion).map(([id, e]) => {
        const where = areas.filter(a => a.enemyTypes && a.enemyTypes[id]).map(a => a.name);
        return { id, name: e.name, emoji: e.emoji || '❓', sprite: e.mapSprite || null,
          hint: D.creatureHints[id] || (where.length ? where.join(', ') : 'Somewhere out there') };
      });
    }
    if (pageId === 'drops') {
      const out = [];
      for (const [boss, rows] of Object.entries(FUP.gearData.bossDrops || {})) for (const row of rows) {
        const id = FUP.gear.rowId(row);
        const emoji = row.key ? FUP.gearData.items[row.key].emoji : row.hat ? FUP.cosmeticData.hats[row.hat].emoji : FUP.placeData.items[row.place].emoji;
        out.push({ id, name: FUP.gear.rowName(row), emoji: emoji || '💎', hint: `Rare drop: ${FUP.enemies[boss] ? FUP.enemies[boss].name : boss}, 1 in ${Math.round(1 / row.rate)}` });
      }
      return out;
    }
    if (pageId === 'areas') return D.areas.map(id => {
      const r = FUP.world && FUP.world.region(id);
      return { id, name: D.areaNames[id] || (r ? r.name : id), emoji: D.areaEmoji[id] || '🗺️', hint: D.areaHints[id] || '' };
    });
    return [];
  },
  entries(pageId) {
    const P = this.pageInfo(pageId), F = FUP.facts;
    return this.list(pageId).map(e => {
      const key = `${P.fact}:${e.id}`, got = F.has(key);
      const out = { ...e, key, got, count: F.get(key) };
      if (pageId === 'areas' && got) { const pc = this.explored(e.id); if (pc !== null) out.extra = `${pc}% explored`; }
      return out;
    });
  },
  counts(pageId) { const es = this.entries(pageId); return { got: es.filter(e => e.got).length, total: es.length }; },
  total() {
    let got = 0, total = 0;
    for (const p of this.D().pages) { const c = this.counts(p.id); got += c.got; total += c.total; }
    return { got, total };
  },

  // Is this fact key a log entry? (built once: the data doesn't change while you play)
  entryFor(key) {
    if (!this._byKey) {
      this._byKey = {};
      for (const p of this.D().pages) for (const e of this.list(p.id)) this._byKey[`${p.fact}:${e.id}`] = { page: p.id, ...e };
    }
    return this._byKey[key] || null;
  },

  // How much of a kept region's map you've seen (E1a fog), as a whole percent. null = not a kept region.
  explored(id) {
    const A = FUP.world && FUP.world.regions[id];
    if (!A || !A.seen) return null;
    const F = FUP.forest, was = F.current;
    F.use(id);
    let open = 0, seen = 0;
    for (let ty = 0; ty < F.height(); ty++) for (let tx = 0; tx < F.width(); tx++) {
      if (F.blockedTile(tx, ty)) continue;
      open++;
      if (A.seen[ty * F.width() + tx]) seen++;
    }
    F.use(was);
    return open ? Math.min(100, Math.round(seen / open * 100)) : null;
  },

  // ---------- Saves from before the log: fill in what you clearly already had ----------
  backfill() {
    const S = FUP.facts.state, mark = k => { if (!S[k]) S[k] = 1; };
    for (const id of Object.keys(FUP.run.bag || {})) if (FUP.run.bag[id] > 0) mark('ing:' + id);
    const pantry = (FUP.house && FUP.house.state && FUP.house.state.pantry) || {};
    for (const id of Object.keys(pantry)) if (pantry[id] > 0) mark('ing:' + id);
    const cooked = (FUP.cooking && FUP.cooking.cookbook && FUP.cooking.cookbook.cooked) || {};
    for (const r of FUP.recipeData.list) if (cooked[r.name]) mark('recipe:' + FUP.cooking.recipeId(r));
    for (const id of Object.keys((FUP.world && FUP.world.state.seen) || {})) if (id !== 'village') mark('region:' + id);
    this.prizes();   // a save already past a milestone gets it now (its pop-up waits for the next play screen)
  },

  // ---------- Milestone rewards (coins, titles + trophies, hats). Each once per life. ----------
  prizes() {
    const R = this.D().rewards, F = FUP.facts, out = [];
    const say = (form, v) => form.replace(/\{(\w+)\}/g, (m, k) => v[k] !== undefined ? v[k] : m);
    for (const p of this.D().pages) {
      const k = this.counts(p.id), pct = k.total ? k.got / k.total * 100 : 0;
      for (const m of R.page) {
        const key = `logPrize:${p.id}:${m.at}`;
        if (pct < m.at || F.has(key)) continue;
        F.set(key, 1);
        FUP.run.coins += m.coins;
        out.push(say(R.text.page, { emoji: p.emoji, page: p.name, at: m.at, coins: m.coins }));
      }
      const done = R.done[p.id];
      if (done && k.total && k.got === k.total && !F.has(`logDone:${p.id}`)) {
        F.set(`logDone:${p.id}`, 1);   // unlocks the title (its req reads this fact)
        const P = FUP.placeData && FUP.placeData.items[done.place];
        if (P && FUP.place) FUP.place.state.owned[done.place] = (FUP.place.state.owned[done.place] || 0) + 1;
        const T = FUP.cosmeticData && FUP.cosmeticData.titles[done.title];
        out.push(say(R.text.done, { emoji: p.emoji, page: p.name, title: T ? T.text : done.title, trophy: P ? `${P.emoji} ${P.name}` : done.place }));
      }
    }
    const T = this.total(), all = T.total ? T.got / T.total * 100 : 0;
    for (const m of R.all) {
      const key = `logPrize:all:${m.at}`;
      if (all < m.at || F.has(key)) continue;
      F.set(key, 1);
      if (FUP.cosmetics) FUP.cosmetics.own(m.hat);
      const H = FUP.cosmeticData && FUP.cosmeticData.hats[m.hat];
      out.push(say(R.text.all, { at: m.at, hat: H ? `${H.emoji} ${H.name}` : m.hat }));
    }
    for (const text of out) this.news.push({ prize: true, text });
    if (out.length) this.showNext();
    return out;
  },
  // What the next reward is, for the window: { page: '25% = 100 🪙' or 'done', all: '25% = 🗞️ Paper Crown' or null }
  nextPrize(pageId) {
    const R = this.D().rewards, k = this.counts(pageId), pct = k.total ? k.got / k.total * 100 : 0;
    const m = R.page.find(x => pct < x.at), done = R.done[pageId], T = FUP.cosmeticData && done && FUP.cosmeticData.titles[done.title];
    const P = done && FUP.placeData && FUP.placeData.items[done.place];
    const page = m ? `${m.at}% (${Math.ceil(k.total * m.at / 100)} found) = ${m.coins} 🪙` : k.got < k.total ? `100% = title "${T ? T.text : ''}" + ${P ? P.emoji + ' ' + P.name : 'a trophy'}` : null;
    const t = this.total(), allPct = t.total ? t.got / t.total * 100 : 0, a = R.all.find(x => allPct < x.at);
    const H = a && FUP.cosmeticData && FUP.cosmeticData.hats[a.hat];
    return { page, all: a ? `${a.at}% = ${H ? H.emoji + ' ' + H.name : a.hat}` : null };
  },

  // ---------- "New in your log" pop-ups ----------
  // Called by FUP.facts whenever a fact changes: a log entry going from 0 to something = new.
  noticed(key, n, old) {
    if (old || !n) return;
    const e = this.entryFor(key);
    if (!e) return;
    this.news.push(e);
    this.showNext();
    this.prizes();
  },
  // The screen to draw on: whichever play screen is running (not the title or loading)
  screen() {
    if (!FUP.game || !FUP.game.scene) return null;
    return FUP.game.scene.getScenes(true).find(s => ['Village', 'World', 'Raid', 'House', 'Cook', 'Battle'].includes(s.scene.key)) || null;
  },
  showNext() {
    if (this.showing || !this.news.length) return;
    const s = this.screen();
    if (!s || !FUP.logUi) return;   // try again with the next one (the queue keeps them)
    const e = this.news.shift(), P = this.D().popup;
    this.showing = true;
    FUP.logUi.popup(s, e);
    if (FUP.audio) FUP.audio.sfx(e.prize ? this.D().rewards.sound : P.sound);
    setTimeout(() => { this.showing = false; this.showNext(); }, (P.seconds + P.gap) * 1000);
  },
};
if (FUP.facts && FUP.facts.onFact) FUP.facts.onFact((key, n, old) => FUP.log.noticed(key, n, old));
// Pop-ups that came while no play screen was up (loading a save, the title screen) show once one is
if (typeof setInterval === 'function') setInterval(() => { if (FUP.log.news.length) FUP.log.showNext(); }, 1000);
