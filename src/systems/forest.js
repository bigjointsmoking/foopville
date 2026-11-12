// ============================================================
// FOREST RULES — the map, what's on it, and what you can walk on.
// No drawing here. The Forest screen asks these functions things like
// "can I stand here?" and "where do the enemies go this run?".
// ============================================================
window.FUP = window.FUP || {};

// A text map (rows of characters) you can ask "can I stand here?".
// Used by the Forest and the village. `blocked` = characters you can't walk through.
FUP.tilemap = (getData, blocked) => ({
  BLOCKED: blocked,

  rows() { return getData().map; },
  size() { return getData().tileSize; },
  width() { return this.rows()[0].length; },
  height() { return this.rows().length; },

  // The map character at a square. Off the map counts as a tree.
  tileAt(tx, ty) {
    const row = this.rows()[ty];
    return row && tx >= 0 && tx < row.length ? row[tx] : '#';
  },

  blockedTile(tx, ty) { return this.BLOCKED.includes(this.tileAt(tx, ty)); },

  // Is a square box (centre x,y, half-size h, in pixels) touching anything solid?
  blockedBox(x, y, h) {
    const T = this.size();
    const x0 = Math.floor((x - h) / T), x1 = Math.floor((x + h) / T);
    const y0 = Math.floor((y - h) / T), y1 = Math.floor((y + h) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.blockedTile(tx, ty)) return true;
    return false;
  },

  // Every square with this character, as [{tx, ty}].
  find(ch) {
    const out = [];
    this.rows().forEach((row, ty) => { for (let tx = 0; tx < row.length; tx++) if (row[tx] === ch) out.push({ tx, ty }); });
    return out;
  },

  // Centre of a square, in pixels.
  center(tx, ty) {
    const T = this.size();
    return { x: tx * T + T / 2, y: ty * T + T / 2 };
  },
});

// The Forest: three regions of the world (maps in data/forest.js, links in data/world.js).
// The map functions above look at one region at a time: FUP.forest.use(id) points them at it.
// Ids: 'edge', 'tollroad', 'deepwoods'.
// F and D = fishing water on the Docks (data/region_docks.js): not walkable either.
FUP.forest = Object.assign(FUP.tilemap(() => FUP.forest.area(), '#~rFD'), {
  current: 'edge',

  // A region's map data: a Forest area, or another region's (data/region_<id>.js, e.g. the Docks)
  area(id = this.current) { return FUP.forestData.areas.find(a => a.id === id) || (FUP.worldData && FUP.worldData.areas[id]); },
  ids() { return FUP.forestData.areas.map(a => a.id); },
  use(id) { this.current = id; },
  // Quests count campfires by number: Forest Edge = 1, Toll Road = 2, Deep Woods = 3
  number(id = this.current) { return this.ids().indexOf(id) + 1; },
  size() { return FUP.forestData.tileSize; },

  // Area i's ground colours (shared ones + its own) and the name of its painted picture.
  ground(id = this.current) {
    const d = FUP.forestData, a = this.area(id);
    return { colors: { ...d.ground, ...(a.ground || {}) }, key: 'forest_ground_' + (a.id || id) };
  },
  decorations(id = this.current) { return this.area(id).decorations || {}; },

  pickWeighted(weights, rng) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = rng() * total;
    for (const [key, w] of Object.entries(weights)) { roll -= w; if (roll <= 0) return key; }
    return Object.keys(weights)[0];
  },

  // One region for a trip: shuffle which spots get ingredients and enemies.
  // Its `features` (data/world.js) decide whether it has enemies and things to forage.
  makeArea(id, rng = Math.random) {
    this.use(id);
    const a = this.area(id), W = FUP.world;
    const on = k => !W || W.has(id, k);
    const shuffle = list => { for (let k = list.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [list[k], list[j]] = [list[j], list[k]]; } return list; };
    const items = !on('forage') ? [] : shuffle(this.find('i')).slice(0, a.ingredientsPerRun)
      .map(s => ({ ...s, id: FUP.run.rollIngredient(rng, a.forageOdds, a.forage || null), taken: false }));
    const enemies = !on('enemies') ? [] : shuffle(this.find('e')).slice(0, a.enemiesPerRun).map(s => this.makeEnemy(this.pickWeighted(a.enemyTypes, rng), s, a, rng));
    // The Toll Bridge: a Moss Goblin always stands on "B" and never wanders off it
    if (on('enemies')) for (const s of this.find('B')) enemies.push({ ...this.makeEnemy('goblin', s, a, rng), still: true, bridge: true });
    // The hidden hole: one of the "H" spots, picked fresh every trip (null if the area has none)
    const holes = this.find('H');
    const hole = holes.length ? holes[Math.floor(rng() * holes.length)] : null;
    return {
      items, enemies, hole,
      player: null,     // where you stand in this area (set when you walk in)
      rested: false,    // used this area's campfire Rest yet?
      visited: false,
      seen: new Array(this.width() * this.height()).fill(0), // fog of war: squares you've seen this trip
    };
  },

  // One enemy on the map. Pigeons are a flock: `count` = how many you fight at once.
  makeEnemy(type, s, a, rng = Math.random) {
    const c = this.center(s.tx, s.ty);
    const e = { type, x: c.x, y: c.y, homeX: c.x, homeY: c.y, alive: true };
    if (type === 'pigeon') { const fl = a.flock || { min: 2, max: 3 }; e.count = fl.min + Math.floor(rng() * (fl.max - fl.min + 1)); }
    if (a.groups && a.groups[type]) e.group = this.marshGroup(a.groups[type], rng);
    return e;
  },
  // Who you fight when you touch this enemy: one of the region's `groups` lists, picked by weight (the Marsh)
  marshGroup(options, rng = Math.random) {
    const total = options.reduce((s, o) => s + o.w, 0);
    let roll = rng() * total;
    for (const o of options) { if (roll < o.w) return o.foes.slice(); roll -= o.w; }
    return options[options.length - 1].foes.slice();
  },

  // Shortest walk between two squares (list of {tx, ty}, both ends included), or null.
  // Uses whatever area is in use (FUP.forest.use).
  path(from, to) {
    const key = p => p.tx + ',' + p.ty, prev = new Map([[key(from), null]]), queue = [from];
    while (queue.length) {
      const cur = queue.shift();
      if (cur.tx === to.tx && cur.ty === to.ty) {
        const out = []; let k = key(cur), p = cur;
        while (p) { out.unshift(p); p = prev.get(k); k = p && key(p); }
        return out;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { tx: cur.tx + dx, ty: cur.ty + dy };
        if (prev.has(key(n)) || this.blockedTile(n.tx, n.ty)) continue;
        prev.set(key(n), cur); queue.push(n);
      }
    }
    return null;
  },

  // Revenge rule (blueprint 18.2 + 18.6): the Pigeon Godfather appears in the Godfather area
  // (the Deep Woods), on the trail between you and its campfire. If you've already reached that
  // campfire, on the trail from the campfire to the nearest possible hole spot.
  // Returns the region id he went to (or null if there's no Godfather region).
  spawnGodfather(f) {
    const g = FUP.forestData.areas.find(a => a.godfather);
    if (!g) return null;
    const i = g.id, was = this.current;
    const A = this.state(f, i);
    this.use(i);
    const T = this.size(), sq = p => ({ tx: Math.floor(p.x / T), ty: Math.floor(p.y / T) });
    const camp = this.find('C')[0];
    let from, to;
    if (A.campfireVisited) {
      from = camp;
      const paths = this.find('H').map(h => this.path(camp, h)).filter(Boolean).sort((p, q) => p.length - q.length);
      to = paths.length ? paths[0][paths[0].length - 1] : camp;
    } else {
      from = f.area === i && A.player ? sq(A.player) : this.find('<')[0];
      to = camp;
    }
    const route = this.path(from, to) || [from];
    // A good way along: out of your sight if possible, but never on top of the campfire
    const sight = Math.ceil(this.area(i).fog.sight) + 2;
    const at = route[Math.max(0, Math.min(route.length - 2, Math.max(sight, Math.floor(route.length / 2))))];
    const c = this.center(at.tx, at.ty);
    A.enemies.push({ type: 'godfather', x: c.x, y: c.y, homeX: c.x, homeY: c.y, alive: true, still: true, godfather: true });
    f.godfatherSpawned = true;
    this.use(was);
    return i;
  },

  // This trip's state for a region: made the first time you walk in (or kept from last trip if it hasn't respawned)
  // (Leaves the map you're looking at as it was.)
  state(f, id, rng = Math.random) {
    if (!f.areas[id]) {
      const was = this.current, make = () => this.makeArea(id, rng);
      f.areas[id] = FUP.world ? FUP.world.regionState(id, make) : make();
      this.use(was);
    }
    return f.areas[id];
  },

  // A fresh trip. Each region is filled in when you first walk into it (FUP.forest.state),
  // and remembers its state until you go home.
  makeRun(rng = Math.random) {
    const f = {
      area: null, areas: {},   // area = the region id you're in
      time: 0,          // run timer, in seconds
      fights: 0,
      pigeonKills: 0,   // revenge rule: pigeons killed this trip (charmed / fled ones don't count)
      godfatherSpawned: false,
      found: [],        // ingredient ids picked up this trip
      graceUntil: 0,    // run time before which enemies can't start a fight
    };
    f.rng = rng;
    return f;
  },

  // Walk into region `id` through the gap on its `edge` (N S E W): you stand one square inside.
  enter(f, id, edge) {
    f.area = id;
    const A = this.state(f, id, f.rng || Math.random);
    this.use(id);
    const at = FUP.world.gapMiddle(id, edge);
    A.player = { x: at.x, y: at.y };
    A.fresh = !A.visited;   // first time in this area this trip (the narrator says hello)
    A.visited = true;
    f.graceUntil = f.time + FUP.worldData.arriveGraceSeconds;
  },

  // The middle of the first open square next to an exit (so you don't walk straight back out).
  besideExit(s) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ch = this.tileAt(s.tx + dx, s.ty + dy);
      if (!this.blockedTile(s.tx + dx, s.ty + dy) && ch !== '<' && ch !== '>') return this.center(s.tx + dx, s.ty + dy);
    }
    return this.center(s.tx, s.ty);
  },

  // The middle of the first open square next to the campfire (where you stand after camping).
  besideCampfire() {
    const C = this.find('C')[0];
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (!this.blockedTile(C.tx + dx, C.ty + dy)) return this.center(C.tx + dx, C.ty + dy);
    return this.center(C.tx, C.ty);
  },

  // Map checker for whoever edits data/forest.js (used by tests/forest_maps.js, not by the game).
  // Returns a list of problems (empty = fine).
  checkMap(id) {
    this.use(id);
    const a = this.area(id), links = (FUP.worldData && FUP.worldData.regions[id] || {}).links || {}, rows = a.map, problems = [];
    if (rows.length !== 26) problems.push(`${a.name}: ${rows.length} rows, should be 26`);
    rows.forEach((r, y) => { if (r.length !== 48) problems.push(`${a.name}: row ${y} is ${r.length} long, should be 48`); });
    const start = this.find('<')[0];
    if (!start) return problems.concat(`${a.name}: no "<" entrance`);
    const seen = new Set([start.tx + ',' + start.ty]), queue = [start];
    while (queue.length) {
      const { tx, ty } = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = tx + dx, ny = ty + dy, k = nx + ',' + ny;
        if (seen.has(k) || this.blockedTile(nx, ny)) continue;
        seen.add(k); queue.push({ tx: nx, ty: ny });
      }
    }
    for (const ch of 'C>ieHSB,') for (const s of this.find(ch)) if (!seen.has(s.tx + ',' + s.ty)) problems.push(`${a.name}: "${ch}" at ${s.tx},${s.ty} can't be reached`);
    if (this.find('C').length !== 1) problems.push(`${a.name}: needs exactly one campfire`);
    if (this.find('e').length < a.enemiesPerRun) problems.push(`${a.name}: fewer "e" spots than enemiesPerRun`);
    if (this.find('i').length < a.ingredientsPerRun) problems.push(`${a.name}: fewer "i" spots than ingredientsPerRun`);
    if (links.E && !this.find('>').length) problems.push(`${a.name}: no ">" exit`);
    for (const [pic, tx, ty] of a.landmarks || []) if (this.blockedTile(tx, ty) || !'.='.includes(this.tileAt(tx, ty))) problems.push(`${a.name}: landmark ${pic} at ${tx},${ty} isn't on open grass`);
    if (a.godfather && this.find('H').length < 2) problems.push(`${a.name}: needs several "H" hole spots`);
    return problems;
  },
});

// The village map (data/village.js). Buildings, the well, lamps, barrels, fences, hay bales and scarecrows are solid.
FUP.villageMap = FUP.tilemap(() => FUP.villageData, '#~bwlkfhy');
// Repairs change the map (the South Road becomes a path) and ruins block squares (src/systems/repairs.js)
FUP.villageMap.rows = () => FUP.repairs ? FUP.repairs.rows(FUP.villageData.map) : FUP.villageData.map;
FUP.villageMap.blockedTile = function (tx, ty) { return this.BLOCKED.includes(this.tileAt(tx, ty)) || !!(FUP.repairs && FUP.repairs.blocked(tx, ty)) || !!(FUP.hills && FUP.hills.blocked('village', tx, ty)); };
FUP.villageMap.hillRegion = () => 'village';

// Hills (src/systems/hills.js, v0.66): a hill's border is solid except its stairs
FUP.forest.blockedTile = function (tx, ty) { return this.BLOCKED.includes(this.tileAt(tx, ty)) || !!(FUP.hills && FUP.hills.blocked(this.current, tx, ty)); };
FUP.forest.hillRegion = function () { return this.current; };
