// ============================================================
// RAID RULES — the Landlord's Basement (data/raid.js). No drawing here.
// Which rooms you get this trip, what's in the room you're in, and
// "can I stand here?". The raid lives inside the Forest trip
// (FUP.run.forest.raid), so the run timer keeps going.
// ============================================================
window.FUP = window.FUP || {};

FUP.raid = Object.assign(FUP.tilemap(() => FUP.raid.room(), '#kd<'), {
  current: 'lobby',
  OPEN: '#kd<', LOCKED: '#kd<>',   // solid letters while the door ahead is open / locked

  // Lock or unlock the ">" door (the screen calls this as enemies go down)
  setLocked(on) { this.BLOCKED = on ? this.LOCKED : this.OPEN; },

  // A room's data by id ('office' = the boss room)
  room(id = this.current) { return id === 'office' ? FUP.raidData.office : FUP.raidData.rooms[id]; },
  use(id) { this.current = id; },
  size() { return FUP.raidData.tileSize; },
  // Every room id of one kind ('fight' or 'hazard')
  ids(kind) { return Object.keys(FUP.raidData.rooms).filter(id => FUP.raidData.rooms[id].kind === kind); },

  // This trip's raid: rooms in the order fight → hazard → fight → hazard, then the Office.
  makeRaid(rng = Math.random) {
    const shuffle = list => { for (let k = list.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [list[k], list[j]] = [list[j], list[k]]; } return list; };
    const pools = { fight: shuffle(this.ids('fight')), hazard: shuffle(this.ids('hazard')) };
    const rooms = FUP.raidData.order.map(kind => pools[kind].shift()).concat('office');
    return { rooms, index: 0, room: null, spored: 0 };
  },

  // Climb down the hole: the raid starts in its first room.
  start(f, rng = Math.random) {
    f.raid = this.makeRaid(rng);
    this.enter(f, 0, rng);
  },

  // Walk into room i of the raid. Rooms are one-way, so each one starts fresh.
  enter(f, i, rng = Math.random) {
    const R = f.raid;
    R.index = i;
    this.use(R.rooms[i]);
    R.room = this.makeRoom(rng);
    f.graceUntil = f.time + FUP.raidData.arriveGraceSeconds;
  },

  // What's in the room you're walking into.
  makeRoom(rng = Math.random) {
    const d = FUP.raidData, a = this.room();
    const enemies = [];
    for (const [ch, type] of Object.entries(d.enemyLetters)) {
      for (const s of this.find(ch)) enemies.push(FUP.forest.makeEnemy(type, s, a, rng));
    }
    // The Landlord at his desk: he waits for you
    for (const s of this.find('L')) enemies.push({ ...FUP.forest.makeEnemy('landlord', s, a, rng), still: true, landlord: true, touch: d.landlordTouch });
    const amb = this.find('A')[0];
    return {
      id: this.current, kind: a.kind,
      enemies, items: [],
      ambush: amb ? { ...amb, done: false } : null,
      cracked: {},          // "tx,ty" → seconds until it breaks (or 'broken')
      sporeResist: 0,       // from a Poison-resist dish eaten in this room
      player: this.besideEntrance(),
      fresh: true,
      seen: new Array(this.width() * this.height()).fill(0),
    };
  },

  // Fight rooms: the door ahead stays locked while anything is still standing,
  // including the hidden ambush (Jesus, 2026-11-09: the door waits for it).
  locked(room) { return room.kind === 'fight' && (room.enemies.some(e => e.alive) || !!(room.ambush && !room.ambush.done)); },

  // The middle of the open square just inside the "<" door.
  besideEntrance() {
    const s = this.find('<')[0];
    return this.center(s.tx, s.ty - 1);
  },

  // Roll the group that jumps you at the ambush spot.
  ambushGroup(rng = Math.random) {
    const A = FUP.raidData.ambush, n = A.min + Math.floor(rng() * (A.max - A.min + 1));
    return Array.from({ length: n }, () => FUP.forest.pickWeighted(A.pool, rng));
  },

  // The swinging end of a pipe at time t (seconds): { x, y } in pixels.
  pipeAt(p, t) {
    const T = this.size(), row = this.rows()[p.row];
    let from = row.indexOf('.'), to = row.lastIndexOf('.');
    const left = from * T + T / 2, right = to * T + T / 2;
    const k = (1 - Math.cos(((t + p.offset) / p.seconds) * Math.PI * 2)) / 2;   // 0 → 1 → 0, smooth
    return { x: left + (right - left) * k, y: p.row * T + T / 2 };
  },

  // Map checker for whoever edits data/raid.js (used by tests/raid_maps.js).
  checkRoom(id) {
    this.use(id);
    this.setLocked(false);
    const a = this.room(), rows = a.map, problems = [];
    if (rows.length !== 14) problems.push(`${a.name}: ${rows.length} rows, should be 14`);
    rows.forEach((r, y) => { if (r.length !== 20) problems.push(`${a.name}: row ${y} is ${r.length} long, should be 20`); });
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
    for (const ch of '>tsmA123xL') for (const s of this.find(ch)) if (!seen.has(s.tx + ',' + s.ty)) problems.push(`${a.name}: "${ch}" at ${s.tx},${s.ty} can't be reached`);
    if (a.kind !== 'office' && this.find('>').length !== 1) problems.push(`${a.name}: needs exactly one ">" exit`);
    if (a.kind === 'office' && this.find('L').length !== 1) problems.push(`${a.name}: needs the Landlord "L"`);
    if (a.kind === 'fight' && !Object.keys(FUP.raidData.enemyLetters).some(ch => this.find(ch).length)) problems.push(`${a.name}: a fight room with no enemies`);
    if (this.blockedTile(start.tx, start.ty - 1)) problems.push(`${a.name}: the square inside the "<" door is blocked`);
    if (a.hazard === 'vents' && !'123'.split('').every(ch => this.find(ch).length)) problems.push(`${a.name}: needs vents in groups 1, 2 and 3`);
    if (a.hazard === 'floor' && !this.find('x').length) problems.push(`${a.name}: no cracked floor`);
    if (a.hazard === 'pipes') for (const p of a.pipes || []) if (!rows[p.row] || rows[p.row].indexOf('.') < 0) problems.push(`${a.name}: pipe on row ${p.row} has no floor to swing over`);
    return problems;
  },
});
