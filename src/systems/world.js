// ============================================================
// WORLD RULES — which region you're in, and walking from one to the next. No drawing.
// Numbers and links in data/world.js.
//   gap(id, edge)        the open squares on that border of a region's map
//   gapMiddle(id, edge)  where you arrive: the middle of the gap, one square inside
//   cross(edge)          walk off the current region's edge. Returns
//                          null (no link) · { locked: [lines] } · { scene, to, arrive }
//   Trips: entering a danger region from a safe one starts a trip (FUP.run.forest);
//          walking back to a safe one ends it.
//   boxes()              the world map panel (built in F4)
// ============================================================
window.FUP = window.FUP || {};

FUP.world = {
  // region: where you are · seen: regions you've been to · respawn: { id: play second it was last shuffled }
  state: { region: 'village', x: null, y: null, seen: { village: true }, respawn: {} },
  lastState: {},   // each danger region as you left it last trip (memory only: reused if it hasn't respawned yet)
  visit: null,     // a safe World region you're in (the Docks): same shape as a trip, but no trip (FUP.run.forest stays null)
  EDGES: ['N', 'S', 'E', 'W'],

  reset() { this.state = { region: 'village', x: null, y: null, seen: { village: true }, respawn: {} }; this.lastState = {}; this.visit = null; },

  ids() { return Object.keys(FUP.worldData.regions); },
  region(id = this.state.region) { return FUP.worldData.regions[id] || null; },
  kind(id = this.state.region) { const r = this.region(id); return r ? r.kind : null; },
  safe(id) { return this.kind(id) !== 'danger'; },
  built(id) { const r = this.region(id); return !!r && r.built !== false; },   // false = on the map, can't go there yet
  has(id, feature) { const r = this.region(id); return !r || !r.features || r.features.includes(feature); },

  // A region's map data ({ map, tileSize, ... })
  area(id = this.state.region) {
    if (FUP.worldData.areas[id]) return FUP.worldData.areas[id];
    const f = FUP.forestData && FUP.forestData.areas.find(a => a.id === id);
    if (f) return f;
    if (id === 'village') return FUP.villageData;
    return null;
  },
  // What you can't walk through on that region's map
  blockedChars(id) { return this.region(id) && this.region(id).scene === 'Village' ? FUP.villageMap.BLOCKED : FUP.forest.BLOCKED; },
  tile(id, tx, ty) { const rows = this.area(id).map, row = rows[ty]; return row && tx >= 0 && tx < row.length ? row[tx] : '#'; },
  tileSize(id) { return this.area(id).tileSize || FUP.forestData.tileSize; },   // Forest maps share one size
  size(id) { const m = this.area(id).map; return { w: m[0].length, h: m.length }; },

  // ---------- Edges and gaps ----------
  // Which edge a border square belongs to (corners count as W / E)
  edgeAt(id, tx, ty) {
    const { w, h } = this.size(id);
    if (tx === 0) return 'W';
    if (tx === w - 1) return 'E';
    if (ty === 0) return 'N';
    if (ty === h - 1) return 'S';
    return null;
  },
  // The open squares along one edge, in order
  gap(id, edge) {
    const { w, h } = this.size(id), out = [], blocked = this.blockedChars(id);
    const along = edge === 'N' || edge === 'S' ? w : h;
    for (let k = 0; k < along; k++) {
      const tx = edge === 'W' ? 0 : edge === 'E' ? w - 1 : k, ty = edge === 'N' ? 0 : edge === 'S' ? h - 1 : k;
      if (this.edgeAt(id, tx, ty) !== edge) continue;   // corners belong to W / E
      if (!blocked.includes(this.tile(id, tx, ty))) out.push({ tx, ty });
    }
    return out;
  },
  // How many separate openings an edge has (a link should have exactly one)
  gapCount(id, edge) {
    let n = 0, prev = null;
    for (const s of this.gap(id, edge)) { if (!prev || Math.abs(s.tx - prev.tx) + Math.abs(s.ty - prev.ty) > 1) n++; prev = s; }
    return n;
  },
  // Where you arrive: the middle gap square, moved one square inward. Also in pixels (x, y).
  gapMiddle(id, edge) {
    const g = this.gap(id, edge);
    if (!g.length) return null;
    const m = g[Math.floor((g.length - 1) / 2)], step = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[edge];
    const tx = m.tx + step[0], ty = m.ty + step[1], T = this.tileSize(id);
    return { tx, ty, x: tx * T + T / 2, y: ty * T + T / 2 };
  },

  linkAt(edge, id = this.state.region) { const r = this.region(id); return (r && r.links && r.links[edge]) || null; },

  // ---------- Crossing ----------
  cross(edge) {
    const from = this.state.region, link = this.linkAt(edge, from);
    if (!link) return null;
    const lock = this.lockLines(link);
    if (lock) return { locked: lock };
    const to = link.to;
    if (this.safe(from) && !this.safe(to)) this.startTrip();
    if (!this.safe(from) && this.safe(to)) this.endTrip('walk');
    this.state.region = to;
    this.state.seen[to] = true;
    FUP.facts.set('region:' + to, 1);
    this.visit = null;
    if (!this.safe(to) && FUP.run.forest) FUP.forest.enter(FUP.run.forest, to, link.edge);
    const arrive = this.gapMiddle(to, link.edge);
    if (this.safe(to) && this.region(to).scene === 'World') this.startVisit(to, arrive);
    return { scene: this.region(to).scene, to, arrive };
  },

  // ---------- Safe World regions (the Docks) ----------
  // Walking around somewhere safe: the World screen needs a "trip-like" state, but nothing is lost on a reload.
  startVisit(id, at) {
    const v = { area: null, areas: {}, time: 0, fights: 0, pigeonKills: 0, found: [], graceUntil: 0, safe: true };
    v.area = id;
    v.areas[id] = FUP.forest.makeArea(id);
    v.areas[id].player = { x: at.x, y: at.y };
    v.areas[id].visited = true;
    FUP.forest.use(id);
    this.visit = v;
    return v;
  },
  // The state the World screen draws: your trip, or your safe visit
  here() { return FUP.run.forest || this.visit; },
  // Where you stand in a safe region, so a reload wakes you there (saved with the world part)
  remember(x, y) { this.state.x = Math.round(x); this.state.y = Math.round(y); },
  // After loading a save made in a safe World region: rebuild the visit at the saved spot
  resumeVisit() {
    const id = this.state.region, r = this.region(id);
    if (!r || !this.safe(id) || r.scene !== 'World' || !this.built(id) || !this.area(id)) return null;
    const T = this.tileSize(id), at = this.state.x !== null ? { x: this.state.x, y: this.state.y } : this.gapMiddle(id, 'N');
    const tx = Math.floor(at.x / T), ty = Math.floor(at.y / T);
    const ok = !this.blockedChars(id).includes(this.tile(id, tx, ty));
    return this.startVisit(id, ok ? at : this.gapMiddle(id, Object.keys(r.links)[0]));
  },

  // Why you can't use a link (text lines), or null if you can.
  // Not repaired yet: its lockText + what's missing. Repaired but the region isn't built: its soonText.
  lockLines(link) {
    if (link.req && !FUP.req.met(link.req)) return [link.lockText, ...FUP.req.missing(link.req)].filter(Boolean);
    if (!this.built(link.to)) return [link.soonText || `${this.region(link.to).name}: not built yet.`];
    return null;
  },
  // Is the gap on this edge blocked by something you have to fix first? (the village draws lockEmoji there)
  blockedBy(edge, id = this.state.region) {
    const link = this.linkAt(edge, id);
    return link && link.req && !FUP.req.met(link.req) ? link : null;
  },

  // A trip into danger: fresh run state (regions are filled in as you walk into them)
  startTrip() { FUP.run.startForest(); },
  // The trip ends safely (walked out, or "Head home" at a campfire). You keep what you carry.
  endTrip(how = 'walk') {
    FUP.run.runs = (FUP.run.runs || 0) + 1;
    FUP.run.retreat();
    if (how !== 'walk') this.state.region = 'village';
  },
  // You're home, however you got there (death, the chute, the boss, a campfire)
  arriveHome() { this.state.region = 'village'; this.visit = null; this.state.x = this.state.y = null; },

  // ---------- Respawn ----------
  // A danger region's state for this trip: the one you left last time if it hasn't
  // respawned yet, else freshly shuffled (made by `make`).
  regionState(id, make) {
    const C = FUP.clock, now = C && C.now ? C.now() : null, last = this.lastState[id];
    const since = now === null ? Infinity : now - (this.state.respawn[id] ?? -Infinity);
    if (last && since < FUP.worldData.respawnSeconds) {
      last.visited = false; last.player = null;
      return last;
    }
    const s = make();
    if (now !== null) this.state.respawn[id] = now;
    this.lastState[id] = s;
    return s;
  },

  // Pairs of shown boxes that are linked (the map draws a line between them)
  lines(boxes = this.boxes()) {
    const shown = new Set(boxes.map(b => b.id)), out = [];
    for (const id of shown) for (const l of Object.values(this.region(id).links || {})) if (shown.has(l.to) && id < l.to) out.push([id, l.to]);
    for (const id of shown) for (const l of Object.values(this.region(id).links || {})) if (shown.has(l.to) && id > l.to && !out.some(([a, b]) => a === l.to && b === id)) out.push([l.to, id]);
    return out;
  },

  // ---------- The world map panel (src/worldMapUi.js draws it) ----------
  // Visited: name + level band. An unvisited neighbour of a visited region: '???' + what locks it. Others: hidden.
  boxes() {
    const seen = this.state.seen, out = [];
    for (const id of this.ids()) {
      const r = this.region(id), here = id === this.state.region;
      if (seen[id] || here) { out.push({ id, col: r.box.col, row: r.box.row, name: r.name, band: r.band || null, here, known: true, lock: [] }); continue; }
      const via = this.ids().filter(v => seen[v]).map(v => Object.values(this.region(v).links || {}).find(l => l.to === id)).find(Boolean);
      if (via) out.push({ id, col: r.box.col, row: r.box.row, name: '???', band: null, here: false, known: false, lock: this.lockLines(via) || [] });
    }
    return out;
  },
};
