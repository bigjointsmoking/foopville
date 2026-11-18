// ============================================================
// QUEST RULES — taking quests, counting progress, handing them in.
// No drawing. The rest of the game calls FUP.quests.event('kill', {...})
// when something happens; this works out which quests it counts for.
// Quest list and rewards: data/quests.js.
// Two kinds (v0.78, Jesus): 'challenge' = do something (goal), hand it in at the board;
// 'side' = a little story in steps (talk to someone, bring them things, do something),
// paid by the villager at the last step. 'story' (the dragon thread) comes later.
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
  kind(id) { const q = this.def(id); return (q && q.kind) || 'challenge'; },
  isSide(id) { return this.kind(id) === 'side'; },
  // 'Easy' / 'Medium' / 'Hard' for the board
  label(id) { const q = this.def(id); return (q && FUP.questData.difficulties[q.difficulty]) || ''; },
  // Do you have the skill levels this quest needs?
  fits(id) {
    return FUP.req.met(this.def(id).req);
  },
  // Top the board up to boardSize with quests that fit you (not taken, not resting).
  // Each kind keeps its own board (boardSize per kind in data/quests.js).
  refill(rng = Math.random) {
    const s = this.state, D = FUP.questData;
    s.board = s.board.filter(id => this.def(id) && !s.active[id]);
    for (const kind of Object.keys(D.boardSize)) {
      const pool = Object.keys(D.quests).filter(id => this.kind(id) === kind && this.fits(id) && !s.active[id] && !s.board.includes(id) && !s.rest[id]);
      while (s.board.filter(id => this.kind(id) === kind).length < D.boardSize[kind] && pool.length) s.board.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
  },
  // On the board right now (kind = only that kind).
  available(kind = null) { this.refill(); return this.state.board.filter(id => !kind || this.kind(id) === kind); },
  activeIds(kind = null) { return Object.keys(this.state.active).filter(id => this.def(id) && (!kind || this.kind(id) === kind)); },
  // maxActive is per kind: side stories don't crowd out challenges
  canTake(kind = 'challenge') { return this.activeIds(kind).length < FUP.questData.maxActive; },

  take(id) {
    if (!this.canTake(this.kind(id)) || this.state.active[id] || !this.state.board.includes(id)) return false;
    this.state.active[id] = { n: 0, done: false, step: 0 };
    if (FUP.facts) FUP.facts.add('did:quest');   // first-day goals (data/goals.js)
    this.state.board = this.state.board.filter(b => b !== id);
    this.refill();
    return true;
  },
  // Drop a taken quest: it goes back on the board if there's room.
  drop(id) {
    delete this.state.active[id];
    if (this.available(this.kind(id)).length < FUP.questData.boardSize[this.kind(id)]) this.state.board.push(id);
  },

  // Is it ready to hand in?
  complete(id) {
    const q = this.def(id), s = this.state.active[id];
    if (!q || !s || this.isSide(id)) return false;   // side stories finish at their last step, not at the board
    if (q.goal.fetch) return FUP.run.bagCount(q.goal.fetch) >= q.goal.count;
    return s.done;
  },

  // "2/5", "Done!" etc. for the board.
  progressText(id) {
    const q = this.def(id), s = this.state.active[id];
    if (!s) return '';
    if (this.isSide(id)) return this.stepText(id);
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
    return this.finish(id);
  },
  // Done: pay, count it, let it rest. Returns the coins.
  finish(id) {
    const q = this.def(id);
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
    for (const id of this.activeIds('challenge')) if (this.def(id).goal.perRun && !this.state.active[id].done) this.state.active[id].n = 0;
  },

  // ---------- Side stories: steps ----------
  // step(id) = the step you're on: { talk: npc } | { bring: { item: n }, to: npc } | { event, count, match }
  step(id) { const q = this.def(id), s = this.state.active[id]; return q && s && q.steps ? q.steps[s.step || 0] || null : null; },
  npcName(npc) { const n = FUP.villageData.npcs[npc]; return n ? n.name.replace(/^The /, 'the ') : npc; },
  have(item) { return FUP.run.bagCount(item); },
  // What the tracker and the board say about where you are
  stepText(id) {
    const st = this.step(id), s = this.state.active[id];
    if (!st) return '';
    if (st.goal) return st.goal + (st.bring ? '  (' + Object.entries(st.bring).map(([k, n]) => `${Math.min(this.have(k), n)}/${n}`).join(', ') + ')' : st.count > 1 ? `  (${s.n}/${st.count})` : '');
    if (st.talk) return `Talk to ${this.npcName(st.talk)}`;
    if (st.bring) return `Bring ${Object.entries(st.bring).map(([k, n]) => `${n} ${FUP.ingredients[k].name}`).join(' and ')} to ${this.npcName(st.to)}`;
    return '';
  },
  // Side-story steps waiting at this villager: [{ id, name, label }]
  stepsAt(npc) {
    return this.activeIds('side').filter(id => { const st = this.step(id); return st && (st.talk === npc || (st.bring && st.to === npc)); })
      .map(id => ({ id, name: this.def(id).name }));
  },
  // Do the step at a villager. Returns { line, coins (when the story ends), ok }.
  doStep(id) {
    const st = this.step(id), s = this.state.active[id];
    if (!st) return { line: '', ok: false };
    if (st.bring) {
      const short = Object.entries(st.bring).filter(([k, n]) => this.have(k) < n);
      if (short.length) return { ok: false, line: st.notYet || `Bring me ${short.map(([k, n]) => `${n} ${FUP.ingredients[k].name}`).join(' and ')}. You have ${short.map(([k, n]) => this.have(k)).join(' and ')}.` };
      for (const [k, n] of Object.entries(st.bring)) FUP.run.takeFromBag(Array(n).fill(k));
    }
    return this.advance(id, st.say || '');
  },
  // Next step (or the end of the story: paid by the villager)
  advance(id, line) {
    const q = this.def(id), s = this.state.active[id];
    s.step = (s.step || 0) + 1; s.n = 0;
    if (s.step < q.steps.length) return { ok: true, line };
    const coins = this.finish(id);
    return { ok: true, line, coins, done: q.name };
  },

  // Something happened. Returns the names of quests it just finished (so the screen can cheer).
  event(type, data = {}) {
    if (FUP.tutorial) FUP.tutorial.note(type);   // Orientation Isle listens too (fish, cook...)
    if (type === 'kill') this.runKills++;
    if (type === 'campfire') data = { ...data, kills: this.runKills };
    if (type === 'boss' || type === 'kill' || type === 'charm') data = { weapon: FUP.run.weapon, ...data };
    const finished = [];
    for (const id of this.activeIds('side')) {   // side-story steps like "defeat 5 squirrels"
      const st = this.step(id), s = this.state.active[id];
      if (!st || st.event !== type || !this.matches(st.match, data)) continue;
      if (++s.n >= (st.count || 1)) { const r = this.advance(id, ''); if (r.done) finished.push(r.done); }
    }
    for (const id of this.activeIds('challenge')) {
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
