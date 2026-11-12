// ============================================================
// SAVING — keeps your life in this browser (localStorage). Version 2.
// Saved whenever you're in the village or at home. Dying in Hardcore
// deletes it (full wipe); dying in Normal saves your grave. Closing the
// page in the middle of a run: next time you wake up at home, but the
// bag and satchel you took with you are gone (otherwise closing the
// page would dodge a bad fight).
//
// Each system owns its slice of the save: a "part" with
//   get()      -> the data to save
//   set(data)  -> put saved data back
//   reset()    -> fresh state for a new life
// A new system adds one FUP.save.register(...) line and it is saved.
// ============================================================
window.FUP = window.FUP || {};

FUP.save = {
  KEY: 'foopville_save_v2',
  VERSION: 2,
  OLD_KEYS: ['fupville_save_v1'],   // saves from before version 2: deleted, not converted
  parts: {},

  register(name, part) { this.parts[name] = part; },
  // Called by FUP.run.newLife: every system starts fresh
  resetParts() { for (const p of Object.values(this.parts)) if (p.reset) p.reset(); },

  // Deletes any old-version save. Returns true if there was one (the title screen says so once).
  retireOld() {
    let found = false;
    try {
      for (const k of this.OLD_KEYS) if (localStorage.getItem(k) != null) { localStorage.removeItem(k); found = true; }
    } catch (e) { /* no storage: nothing to retire */ }
    return found;
  },

  // Save everything about this life. onRun = true when you're heading into the Forest.
  write(onRun = false) {
    const data = { v: this.VERSION, savedAt: Date.now(), onRun, parts: {} };
    for (const [name, p] of Object.entries(this.parts)) data.parts[name] = p.get();
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
  },

  read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const data = raw && JSON.parse(raw);
      return data && data.v === this.VERSION && data.parts && data.parts.run ? data : null;
    } catch (e) { return null; }
  },

  // Short info for the Start screen ("Continue as Pib, 3 runs, 120 coins"), or null.
  summary() {
    const d = this.read();
    if (!d) return null;
    const run = d.parts.run, hero = run.hero || {}, skills = d.parts.skills || {};
    const lv = id => (skills[id] || { level: 1 }).level;
    // The 4 highest built skills (ties: list order)
    const levels = FUP.skills.list().filter(id => FUP.skills.built(id)).map(id => ({ id, level: lv(id) })).sort((a, b) => b.level - a.level).slice(0, 4);
    return { name: hero.name || 'You', runs: run.runs || 0, coins: run.coins || 0,
      weapon: run.weapon, mode: hero.mode, look: hero.look, levels,
      title: (() => { const t = (d.parts.cosmetics || {}).title, T = FUP.cosmeticData && FUP.cosmeticData.titles[t]; return T ? T.text : ''; })() };
  },

  // Put a saved life back. Returns { lostRun } (true = the page was closed mid-run).
  load() {
    const d = this.read();
    if (!d) return null;
    const r = FUP.run;
    r.newLife(d.parts.run.weapon, d.parts.run.hero);   // clean slate, then fill it in
    for (const [name, p] of Object.entries(this.parts)) if (d.parts[name] !== undefined && d.parts[name] !== null) p.set(d.parts[name], d);
    r.forest = null; r.battle = null;
    if (FUP.repairs) FUP.repairs.resume();   // a repair paid for when the page closed
    const lostRun = !!d.onRun;
    if (lostRun) { r.bag = {}; r.satchel = []; this.write(false); }
    return { lostRun };
  },

  wipe() { try { localStorage.removeItem(this.KEY); } catch (e) { /* nothing to delete */ } },
};

// ---------- The parts (this file loads after every system) ----------
(() => {
  const S = FUP.save, copy = x => JSON.parse(JSON.stringify(x));

  // Hero, weapon, bag, satchel, coins, gear. Its reset is FUP.run.newLife itself.
  S.register('run', {
    get() {
      const r = FUP.run;
      return { hero: r.hero, weapon: r.weapon, bag: r.bag, satchel: r.satchel, fights: r.fights, hp: r.hp, limit: r.limit, runs: r.runs,
        coins: r.coins, equipped: r.equipped, stash: r.stash, packTier: r.packTier, haggle: r.haggle, secrets: r.secrets };
    },
    set(d) {
      const r = FUP.run;
      Object.assign(r, {
        bag: d.bag || {}, satchel: d.satchel || [], fights: d.fights || 0, hp: d.hp, limit: d.limit || 0, runs: d.runs || 0,
        coins: d.coins || 0, stash: d.stash || [], packTier: d.packTier || 0, haggle: d.haggle || null, secrets: { ...(d.secrets || {}) },
      });
      for (const slot of FUP.gearData.slots) r.equipped[slot] = (d.equipped || {})[slot] || null;
    },
  });

  S.register('skills', {
    get: () => FUP.skills.state,
    set(d) { for (const id of Object.keys(FUP.skills.state)) if (d[id]) FUP.skills.state[id] = { ...d[id] }; },
    reset: () => FUP.skills.init(),
  });

  S.register('cookbook', {
    get: () => FUP.cooking.cookbook,
    set(d) { FUP.cooking.cookbook = { discovered: { ...(d.discovered || {}) }, riddles: { ...(d.riddles || {}) }, cooked: { ...(d.cooked || {}) } }; },
    reset: () => FUP.cooking.resetCookbook(),
  });

  S.register('garden', {
    get: () => FUP.garden.state,
    set(d, all) {
      const patches = {};
      for (const [k, p] of Object.entries(d.patches || {})) patches[k] = { ...FUP.garden.fresh(), ...p };
      FUP.garden.state = {
        patches, can: d.can ?? FUP.gardenData.canMax, lastTick: d.lastTick || all.savedAt || Date.now(),
        seeds: { ...(d.seeds || FUP.gardenData.startSeeds) }, plots: { ...(d.plots || {}) },
        compost: d.compost ? { ...d.compost, batches: (d.compost.batches || []).slice() } : FUP.garden.freshCompost(),
      };
      FUP.garden.tick();   // catch up on the time the game was closed
    },
    reset: () => FUP.garden.reset(),
  });

  S.register('house', {
    get: () => FUP.house.state,
    set(d) {
      FUP.house.state = { ...FUP.house.state, ...d, pantry: { ...(d.pantry || {}) }, gear: (d.gear || []).slice(), dishes: (d.dishes || []).slice() };
      if (!d.stoveLine) { FUP.house.state.stoves = (d.stoves || 0) + 1; FUP.house.state.stoveLine = 2; }   // v0.68: older saves keep the stove they had
    },
    reset: () => FUP.house.reset(),
  });

  S.register('quests', {
    get: () => FUP.quests.state,
    set(d) {
      const known = id => !!FUP.questData.quests[id], active = {}, rest = {};   // quests that no longer exist are dropped
      for (const [id, s] of Object.entries(d.active || {})) if (known(id)) active[id] = s;
      for (const [id, n] of Object.entries(d.rest || {})) if (known(id)) rest[id] = n;
      FUP.quests.state = { active, board: (d.board || []).filter(known), rest };
    },
    reset: () => FUP.quests.reset(),
  });

  // The counter that gives each piece of gear its own id: never goes backwards
  S.register('gearUid', {
    get: () => FUP.gear._uid,
    set(d) { FUP.gear._uid = Math.max(FUP.gear._uid, d || 1); },
  });

  S.register('grave', {
    get: () => FUP.grave.state,
    set(d) {
      const g = copy(d);
      if (g && g.region === undefined && typeof g.area === 'number') { g.region = (FUP.forestData.areas[g.area] || FUP.forestData.areas[0]).id; delete g.area; }   // saves from before v0.52
      FUP.grave.state = g;
    },
    reset: () => FUP.grave.reset(),
  });

  S.register('fishing', {
    get: () => FUP.fishing.state,
    set(d) { FUP.fishing.state = { bait: { ...(d.bait || {}) }, using: d.using || null, traps: copy(d.traps || []), trapsOwned: d.trapsOwned || 0, perfects: d.perfects || 0 }; },
    reset: () => FUP.fishing.reset(),
  });

  S.register('place', {
    get: () => FUP.place.state,
    set(d) {
      // Things that no longer exist in data/place.js are dropped
      const owned = {};
      for (const [id, n] of Object.entries(d.owned || {})) if (FUP.placeData.items[id]) owned[id] = n;
      FUP.place.state = { owned, placed: copy(d.placed || []).filter(p => FUP.placeData.items[p.item] && FUP.placeData.zones[p.zone]), uid: d.uid || 1 };
    },
    reset: () => FUP.place.reset(),
  });

  S.register('clock', {
    get: () => FUP.clock.state,
    set(d) { FUP.clock.state = { play: d.play || 0, day: d.day || 1, t: d.t || 0, timers: { ...(d.timers || {}) } }; },
    reset: () => FUP.clock.reset(),
  });

  S.register('stall', {
    get: () => FUP.stall.state,
    set(d) { FUP.stall.state = { byUid: copy(d.byUid || {}) }; },
    reset: () => FUP.stall.reset(),
  });

  S.register('repairs', {
    get: () => FUP.repairs.state,
    set(d) { FUP.repairs.state = { wishDay: d.wishDay || 0, working: d.working || null, market: d.market ? JSON.parse(JSON.stringify(d.market)) : null }; },
    reset: () => FUP.repairs.reset(),
  });

  S.register('world', {
    get: () => FUP.world.state,
    set(d) {
      const W = FUP.world;
      W.state = { region: 'village', x: d.x ?? null, y: d.y ?? null, seen: { village: true, ...(d.seen || {}) }, respawn: { ...(d.respawn || {}) } };
      if (W.region(d.region) && W.safe(d.region)) W.state.region = d.region;   // saved mid-trip = you wake up at home
    },
    reset: () => FUP.world.reset(),
  });

  S.register('cosmetics', {
    get: () => FUP.cosmetics.state,
    set(d) { FUP.cosmetics.state = { owned: (d.owned || []).filter(id => FUP.cosmeticData.hats[id]), hat: d.hat || null, title: d.title || null }; },
    reset: () => FUP.cosmetics.reset(),
  });

  S.register('tools', {
    get: () => FUP.tools.state,
    set(d) { FUP.tools.state = { rod: d.rod || 0, hammer: d.hammer || 0, hoe: d.hoe || 0, can: d.can || 0 }; },
    reset: () => FUP.tools.reset(),
  });

  // Orientation Isle (v0.62): which step you're on, what you've done, the practice patch
  S.register('tutorial', {
    get: () => FUP.tutorial.state,
    set(d) { FUP.tutorial.state = { ...FUP.tutorial.fresh(), ...d, did: { ...(d.did || {}) }, patch: d.patch ? { ...d.patch } : null }; },
    reset: () => FUP.tutorial.reset(),
  });

  S.register('facts', {
    get: () => FUP.facts.state,
    set(d) { FUP.facts.state = { ...d }; },
    reset: () => FUP.facts.reset(),
  });
})();
