// ============================================================
// SAVING — keeps your life in this browser (localStorage). Version 2.
// Saved whenever you're in the village or at home. Dying in Hardcore
// deletes it (full wipe); dying in Normal saves your grave. On a trip
// (the Forest, the Marsh, the basement) the game saves where you stand
// every few seconds and right before each fight: closing the page and
// coming back puts you exactly there, mid-trip (v0.73, Jesus). Closed
// during a fight = back on the map just before it, the enemy still there.
//
// Each system owns its slice of the save: a "part" with
//   get()      -> the data to save
//   set(data)  -> put saved data back
//   reset()    -> fresh state for a new life
// A new system adds one FUP.save.register(...) line and it is saved.
// ============================================================
window.FUP = window.FUP || {};

FUP.save = {
  // (v1.20, Jesus) Player slots: separate characters on one device (3 slots, picked on the title screen, no lock).
  // Slot 0 keeps the old save's name, so the save from before slots is slot 1. Each slot also has its own
  // tutorial-seen flag, one-time hints and spell pieces (playerKey).
  SLOTS: 3,
  SLOT_KEY: 'foopville_slot',   // which slot played last (browser storage)
  slot: 0,
  keyFor(n) { return n === 0 ? 'foopville_save_v2' : 'foopville_save_v2_p' + (n + 1); },
  get KEY() { return this.keyFor(this.slot); },
  // A browser-storage name that belongs to the player in this slot (slot 0 keeps the plain name)
  playerKey(base) { return this.slot === 0 ? base : base + '_p' + (this.slot + 1); },
  // Switch to slot n (the title screen does this before Play / New character)
  use(n) {
    this.slot = n;
    try { localStorage.setItem(this.SLOT_KEY, String(n)); } catch (e) { /* private window: this visit only */ }
    if (FUP.spell) FUP.spell.state = null;   // the next player's spell pieces load fresh
  },
  lastSlot() { try { const n = +localStorage.getItem(this.SLOT_KEY); return n >= 0 && n < this.SLOTS ? n : 0; } catch (e) { return 0; } },
  VERSION: 2,
  OLD_KEYS: ['fupville_save_v1'],   // saves from before version 2: deleted, not converted
  // v0.75 (Jesus, 2026-11-17): the boss and its things got new code names. Saves from before
  // are converted when read, so nobody loses a boss kill, hat, title, trophy or raid spot.
  RENAMES: [['Landlord-Proof Helm', 'Spore-Proof Helm'], ["Landlord's Bane", "Guardian's Bane"], ['Eviction Notice', 'Door Slammer'],
    ['landlord_s_bane', 'guardian_s_bane'], ['eviction_notice', 'door_slammer'], ['landlord_cap', 'guardian_cap'], ['framed_notice', 'framed_warning'], ['tenantShroom', 'strayShroom'],
    ['landlord', 'guardian'], ['evicted', 'gatecrasher'], ['rentImmune', 'coinGuard'], ['rentLess', 'stealLess'],
    ['lobby', 'entry'], ['unit2b', 'storeroom'], ['speedrun', 'noRest']],   // speedrun: Rush Job became No Naps (E1b)
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

  // Old code names -> new ones, only as whole names in the save text ("landlord", "boss:landlord")
  convert(raw) {
    for (const [from, to] of this.RENAMES) raw = raw.replace(new RegExp(`(["':])${from}(?=")`, 'g'), `$1${to}`);
    return raw;
  },

  read(n = this.slot) {
    try {
      const raw = localStorage.getItem(this.keyFor(n));
      const data = raw && JSON.parse(this.convert(raw));
      return data && data.v === this.VERSION && data.parts && data.parts.run ? data : null;
    } catch (e) { return null; }
  },

  // Short info for the Start screen ("Continue as Pib, 3 runs, 120 coins"), or null.
  summary(n = this.slot) {
    const d = this.read(n);
    if (!d) return null;
    const run = d.parts.run, hero = run.hero || {}, skills = d.parts.skills || {};
    const lv = id => (skills[id] || { level: 1 }).level;
    // The 4 highest built skills (ties: list order)
    const levels = FUP.skills.list().filter(id => FUP.skills.built(id)).map(id => ({ id, level: lv(id) })).sort((a, b) => b.level - a.level).slice(0, 4);
    return { name: hero.name || 'You', runs: run.runs || 0, melee: lv('melee'), day: (d.parts.clock && d.parts.clock.day) || 1, coins: run.coins || 0,
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
    if (FUP.mats) FUP.mats.migrate();
    FUP.quests.retireOld();   // v1.38: The Bowl, the Vault and The Right Form are gone from old saves
    if (FUP.log) FUP.log.backfill();   // E2: the collection log fills in what this save already had (no pop-ups)   // v0.70: planks left in the backpack / pantry move into the materials pouch
    // A trip saved mid-way (part 'trip', v0.73): pick it back up where you stood
    const trip = !!(d.onRun && d.parts.trip);
    r.forest = trip ? r.forest : null; r.battle = null;
    if (FUP.repairs) FUP.repairs.resume();   // a repair paid for when the page closed
    const lostRun = !!d.onRun && !trip;   // only saves from before v0.73 (no trip saved): home, with your things
    if (lostRun) this.write(false);
    return { lostRun, trip };
  },

  wipe() { try { localStorage.removeItem(this.KEY); } catch (e) { /* nothing to delete */ } },
};
FUP.save.slot = FUP.save.lastSlot();   // (v1.20) start on whoever played last

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
    set(d) { FUP.cooking.cookbook = { discovered: { ...(d.discovered || {}) }, riddles: { ...(d.riddles || {}) }, cooked: { ...(d.cooked || {}) }, names: { ...(d.names || {}) } }; },
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
        tilled: { ...(d.tilled || {}) }, flat: { ...(d.flat || {}) },   // your own layout (v0.87)
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
      for (const [id, s] of Object.entries(d.active || {})) if (known(id)) active[id] = FUP.quests.upgrade(id, s);   // v1.10: old step numbers moved
      for (const [id, n] of Object.entries(d.rest || {})) if (known(id)) rest[id] = n;
      FUP.quests.state = { active, board: (d.board || []).filter(known), rest, day: d.day || 0, fresh: !!d.fresh };
    },
    reset: () => FUP.quests.reset(),
  });

  // Village surprise events (V3): what's going on, when the last one ended
  S.register('events', {
    get: () => FUP.events.state,
    set(d) { FUP.events.state = { active: d.active && FUP.eventData.list[d.active.id] ? d.active : null, lastEnd: d.lastEnd ?? -FUP.eventData.gapSeconds, seen: { ...(d.seen || {}) } }; },
    reset: () => FUP.events.reset(),
  });

  // Marrowbone's Special (V2): today's dish and how many are left
  S.register('special', {
    get: () => FUP.village.special,
    set(d) { FUP.village.special = { day: d.day || 0, recipe: d.recipe || null, left: d.left || 0 }; },
    reset() { FUP.village.special = { day: 0, recipe: null, left: 0 }; },
  });

  // The counter that gives each piece of gear its own id: never goes backwards
  S.register('gearUid', {
    get: () => FUP.gear._uid,
    set(d) { FUP.gear._uid = Math.max(FUP.gear._uid, d || 1); },
  });

  // Slingshot ammo (v1.01): { pebble: 20, acorn: 4 }
  S.register('ammo', {
    get: () => FUP.run.ammo,
    set(d) { FUP.run.ammo = {}; for (const [id, n] of Object.entries(d || {})) if (FUP.rangedData.ammo[id] && n > 0) FUP.run.ammo[id] = n; },
    reset() { FUP.run.ammo = {}; },
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

  // Farm orders (F-F): today's 3 orders on Hollis's board
  S.register('orders', {
    get: () => FUP.orders.state,
    set(d) { FUP.orders.state = { day: d.day || 0, list: copy(d.list || []) }; },
    reset: () => FUP.orders.reset(),
  });

  // Farm animals (F-E): the farmhand's paid days. Each animal's own state is saved on its placed thing.
  S.register('animals', {
    get: () => FUP.animals.state,
    set(d) { FUP.animals.state = { hiredUntil: d.hiredUntil || 0 }; FUP.animals.news = []; },
    reset: () => FUP.animals.reset(),
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
    set(d, all) {
      const W = FUP.world;
      W.state = { region: 'village', x: d.x ?? null, y: d.y ?? null, seen: { village: true, ...(d.seen || {}) }, pigeonKills: (d.pigeonKills || []).slice(), hank: d.hank || null };   // hank: { day, count } (E3: Hooded Hank once a day)   // (old saves' `respawn` is dropped: E1a)
      if (W.region(d.region) && (W.safe(d.region) || (all && all.onRun && all.parts.trip))) W.state.region = d.region;   // mid-trip with the trip saved: still out there (v0.73)
    },
    reset: () => FUP.world.reset(),
  });

  // The danger regions as you left them (E1a): enemies, ingredients, the hole, the explored map (fog
  // packed 6 squares per letter), campfire Rest time. Kept for the whole life. Must load before 'trip'.
  S.register('regions', {
    get() {
      const out = {};
      for (const [id, A] of Object.entries(FUP.world.regions)) {
        FUP.forest.stamp(A);
        out[id] = { ...A, seen: FUP.world.packFog(A.seen), cells: A.seen.length };
      }
      return out;
    },
    set(d) {
      const W = FUP.world;
      W.regions = {};
      for (const [id, A] of Object.entries(d || {})) {
        if (!W.region(id)) continue;
        const r = copy(A);
        r.seen = W.unpackFog(A.seen || '', A.cells || 0);
        delete r.cells;
        W.regions[id] = r;
      }
    },
  });

  S.register('cosmetics', {
    get: () => FUP.cosmetics.state,
    set(d) { FUP.cosmetics.state = { owned: (d.owned || []).filter(id => FUP.cosmeticData.hats[id]), hat: d.hat || null, title: d.title || null }; },
    reset: () => FUP.cosmetics.reset(),
  });

  S.register('tools', {
    get: () => FUP.tools.state,
    set(d) { FUP.tools.state = { rod: d.rod || 0, hammer: d.hammer || 0, hoe: d.hoe || 0, can: d.can || 0, quest: { ...(d.quest || {}) } }; },
    reset: () => FUP.tools.reset(),
  });

  // Your trip (v0.73): the trip clock, counters, the basement rooms, and which regions you've walked
  // through (their ids: the regions themselves are saved in 'regions' since E1a). Only used when
  // the save was made on a trip (onRun); otherwise ignored.
  S.register('trip', {
    get: () => { const f = FUP.run.forest; return f ? { ...f, areas: Object.keys(f.areas || {}) } : null; },
    set(d) {
      if (!d) { FUP.run.forest = null; return; }
      const f = copy(d), W = FUP.world, now = FUP.clock.now();
      if (Array.isArray(f.areas)) f.areas = Object.fromEntries(f.areas.filter(id => W.regions[id]).map(id => [id, W.regions[id]]));
      else {
        // A save from before E1a: the trip carried whole regions. They become the kept regions.
        for (const [id, A] of Object.entries(f.areas || {})) {
          if (!W.region(id)) continue;
          if (A.rested) A.restedAt = now;   // rested this trip = the cooldown starts now
          delete A.rested;
          W.regions[id] = A;
        }
        f.areas = Object.fromEntries(Object.keys(f.areas || {}).filter(id => W.regions[id]).map(id => [id, W.regions[id]]));
      }
      FUP.run.forest = f;
    },
  });

  // Orientation Isle (v0.62): which step you're on, what you've done, the practice patch
  S.register('goals', {
    get: () => FUP.goals.state,
    set(d) { FUP.goals.state = { closed: !!d.closed }; },
    reset: () => FUP.goals.reset(),
  });
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
  // Building materials + scrap piles (v0.70). Old saves' planks move from the backpack / pantry into the pouch after loading.
  S.register('mats', {
    get: () => FUP.mats.state,
    set(d) { FUP.mats.state = { ...d }; },
    reset: () => FUP.mats.reset(),
  });
  S.register('commissions', {
    get: () => FUP.commissions.state,
    set(d) { FUP.commissions.state = { jobs: JSON.parse(JSON.stringify(d.jobs || {})), done: { ...(d.done || {}) } }; },
    reset: () => FUP.commissions.reset(),
  });
  S.register('salvage', {
    get: () => FUP.salvage.state,
    set(d) { FUP.salvage.state = { done: { ...(d.done || {}) } }; },
    reset: () => FUP.salvage.reset(),
  });
})();
