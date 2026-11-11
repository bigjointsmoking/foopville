// ============================================================
// QUEST RULES — taking quests, counting progress, handing them in.
// No drawing. The rest of the game calls FUP.quests.event('kill', {...})
// when something happens; this works out which quests it counts for.
// Quest list and rewards: data/quests.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.quests = {
  // active: { questId: { n: progress, done: true once finished } }
  // board:  quest ids on offer right now (the board refills, Refinement Phase 5)
  // rest:   { questId: hand-ins left before it can come back }
  state: { active: {}, board: [], rest: {} },
  runKills: 0,  // enemies defeated on this trip to the Forest

  reset() { this.state = { active: {}, board: [], rest: {} }; this.runKills = 0; },

  def(id) { return FUP.questData.quests[id]; },
  // Do you have the skill levels this quest needs?
  fits(id) {
    return FUP.req.met(this.def(id).req);
  },
  // Top the board up to boardSize with quests that fit you (not taken, not resting).
  refill(rng = Math.random) {
    const s = this.state, D = FUP.questData;
    s.board = s.board.filter(id => this.def(id) && !s.active[id]);
    const pool = Object.keys(D.quests).filter(id => this.fits(id) && !s.active[id] && !s.board.includes(id) && !s.rest[id]);
    while (s.board.length < D.boardSize && pool.length) s.board.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  },
  // On the board right now.
  available() { this.refill(); return this.state.board.slice(); },
  activeIds() { return Object.keys(this.state.active).filter(id => this.def(id)); },
  canTake() { return this.activeIds().length < FUP.questData.maxActive; },

  take(id) {
    if (!this.canTake() || this.state.active[id] || !this.state.board.includes(id)) return false;
    this.state.active[id] = { n: 0, done: false };
    this.state.board = this.state.board.filter(b => b !== id);
    this.refill();
    return true;
  },
  // Drop a taken quest: it goes back on the board if there's room.
  drop(id) {
    delete this.state.active[id];
    if (this.state.board.length < FUP.questData.boardSize) this.state.board.push(id);
  },

  // Is it ready to hand in?
  complete(id) {
    const q = this.def(id), s = this.state.active[id];
    if (!q || !s) return false;
    if (q.goal.fetch) return FUP.run.bagCount(q.goal.fetch) >= q.goal.count;
    return s.done;
  },

  // "2/5", "Done!" etc. for the board.
  progressText(id) {
    const q = this.def(id), s = this.state.active[id];
    if (!s) return '';
    if (this.complete(id)) return 'Done! Hand it in.';
    if (q.goal.fetch) return `In your bag: ${Math.min(FUP.run.bagCount(q.goal.fetch), q.goal.count)}/${q.goal.count}`;
    if (q.goal.count > 1) return `${s.n}/${q.goal.count}` + (q.goal.perRun ? ' this trip' : '');
    return 'Not yet';
  },

  // Hand in a finished quest. Returns the coins earned (0 if not ready).
  handIn(id) {
    if (!this.complete(id)) return 0;
    const q = this.def(id);
    if (q.goal.fetch) FUP.run.takeFromBag(Array(q.goal.count).fill(q.goal.fetch));
    delete this.state.active[id];
    // It rests for a while; every other quest's rest gets shorter
    for (const r of Object.keys(this.state.rest)) if (--this.state.rest[r] <= 0) delete this.state.rest[r];
    this.state.rest[id] = FUP.questData.restAfter;
    FUP.run.coins += q.reward;
    FUP.facts.add(`quest:${id}`);
    this.refill();
    return q.reward;
  },

  // A new trip to the Forest: "in one trip" quests start counting again.
  startRun() {
    this.runKills = 0;
    for (const id of this.activeIds()) if (this.def(id).goal.perRun && !this.state.active[id].done) this.state.active[id].n = 0;
  },

  // Something happened. Returns the names of quests it just finished (so the screen can cheer).
  event(type, data = {}) {
    if (type === 'kill') this.runKills++;
    if (type === 'campfire') data = { ...data, kills: this.runKills };
    if (type === 'boss' || type === 'kill' || type === 'charm') data = { weapon: FUP.run.weapon, ...data };
    const finished = [];
    for (const id of this.activeIds()) {
      const q = this.def(id), s = this.state.active[id];
      if (s.done || q.goal.event !== type || !this.matches(q.goal.match, data)) continue;
      s.n++;
      if (s.n >= q.goal.count) { s.done = true; finished.push(q.name); }
    }
    return finished;
  },

  matches(m, data) {
    if (!m) return true;
    const tiers = FUP.cookingData.tiers.map(t => t.id);
    if (m.enemy && data.enemy !== m.enemy) return false;
    if (m.element && data.element !== m.element) return false;
    if (m.weapon && data.weapon !== m.weapon) return false;
    if (m.minTier && tiers.indexOf(data.tier) < tiers.indexOf(m.minTier)) return false;
    if (m.maxTime !== undefined && !(data.time <= m.maxTime)) return false;
    if (m.maxKills !== undefined && !(data.kills <= m.maxKills)) return false;
    if (m.area !== undefined && data.area !== m.area) return false;
    if (m.method && data.method !== m.method) return false;
    return true;
  },
};
