// ============================================================
// TUTORIAL RULES — Orientation Isle (v0.62). No drawing here
// (the island screen is WorldScene + src/scenes/WorldTutorial.js).
// Content and numbers: data/tutorial.js. Saved as the 'tutorial' part.
//   FUP.tutorial.begin()          right after a new life: wake up on the island
//   FUP.tutorial.active()         on the island right now?
//   FUP.tutorial.step()           the step you're on (data/tutorial.js steps)
//   FUP.tutorial.note(event)      something happened (pack, fish, cook, saw, fight, hoe...)
//   FUP.tutorial.talkFor(id)      what a tutor says: { pages } (your step) or { line }
//   FUP.tutorial.finishTalk(id)   you read their pages: hand out items, next step
//   FUP.tutorial.patchJob() / patchUse() / tick(dt)   the practice farm patch
//   FUP.tutorial.finish(skipped)  the ferry: +coins, off to Foopville
//   FUP.tutorial.wanted()         the creator's default: on, unless you finished it before in this browser
// ============================================================
window.FUP = window.FUP || {};

FUP.tutorial = {
  state: null,
  news: null,       // a "step done" line waiting to be said on the island (not saved)
  touch: false,     // phone/tablet: the text says "tap" instead of keys (set by the island screen)

  fresh() { return { active: false, step: 0, did: {}, patch: null, done: false, skipped: false }; },
  reset() { this.state = this.fresh(); this.news = null; },
  data() { return FUP.tutorialData; },
  region() { return 'isle'; },

  active() { return !!(this.state && this.state.active); },
  steps() { return this.data().steps; },
  step() { return this.active() ? this.steps()[this.state.step] || null : null; },
  number() { return this.state.step + 1; },
  total() { return this.steps().length; },
  // Index of the first step that matches (e.g. the first 'hoe' step), or -1
  indexOf(test) { return this.steps().findIndex(test); },
  // Have you reached (or passed) the step where you talk to this tutor? -1 = never
  reached(test) { const i = this.indexOf(test); return i >= 0 && this.state.step >= i; },

  // ---------- Browser memory: "finished it once" (survives a Hardcore wipe; not in the save) ----------
  seenBefore() { try { return localStorage.getItem(this.data().seenKey) === '1'; } catch (e) { return false; } },
  markSeen() { try { localStorage.setItem(this.data().seenKey, '1'); } catch (e) { /* private window: fine */ } },
  wanted() { return !this.seenBefore(); },

  // ---------- Start: right after FUP.run.newLife ----------
  begin() {
    const D = this.data(), W = FUP.world, T = W.tileSize(this.region());
    this.state = { ...this.fresh(), active: true, patch: { s: 'weeds', grown: 0 } };
    const at = { x: D.start.tx * T + T / 2, y: D.start.ty * T + T / 2 };
    W.state.region = this.region();
    W.state.seen[this.region()] = true;
    W.remember(at.x, at.y);
    W.startVisit(this.region(), at);
  },

  // ---------- Text: fill in {name}, the controls, numbers ----------
  fill(text) {
    if (text && typeof text === 'object') text = text[FUP.run.isHardcore() ? 'hardcore' : 'normal'];
    const D = this.data(), C = D.controls[this.touch ? 'touch' : 'keys'], st = this.step();
    return String(text || '')
      .replace(/\{name\}/g, (FUP.run.hero && FUP.run.hero.name) || 'You')
      .replace(/\{walk\}/g, C.walk).replace(/\{talk\}/g, C.talk).replace(/\{pack\}/g, C.pack)
      .replace(/\{coins\}/g, D.coins)
      .replace(/\{maxQuests\}/g, FUP.questData ? FUP.questData.maxActive : 3)
      .replace(/\{goal\}/g, st ? st.goal : '');
  },

  // ---------- Steps ----------
  // Something happened. If it's what the current step wants, move on. Returns the finished step or null.
  note(event) {
    if (!this.active()) return null;
    this.state.did[event] = true;
    const st = this.step();
    return st && st.kind === 'do' && st.event === event ? this.advance() : null;
  },
  advance() {
    const st = this.step();
    if (!st) return null;
    this.state.step++;
    if (st.done) this.news = st.done;
    // Already did the next thing earlier (opened the backpack before Greta asked)? Tick it too.
    const nx = this.step();
    if (nx && nx.kind === 'do' && this.state.did[nx.event]) this.advance();
    return st;
  },

  // What a tutor says when you talk to them
  talkFor(id) {
    const st = this.step();
    if (st && st.kind === 'talk' && st.tutor === id) return { pages: st.pages.map(p => this.fill(p)), step: st };
    const past = this.steps().slice(0, this.state.step).filter(s => s.kind === 'talk' && s.tutor === id && s.again).pop();
    return { line: this.fill(past ? past.again : this.data().notYet) };
  },
  // You read the last page: items, rewards, next step. Returns the step (its `leave` = time for the ferry).
  finishTalk(id, where = null) {
    const st = this.step();
    if (!st || st.kind !== 'talk' || st.tutor !== id) return null;
    for (const [item, n] of Object.entries(st.give || {})) for (let k = 0; k < n; k++) FUP.run.addToBag(item);
    if (st.reward) { const R = this.data().questReward; FUP.skills.addXp(R.skill, R.xp, where); }
    if (st.leave) return st;   // the captain: finish() happens when the ferry leaves
    this.advance();
    return st;
  },

  // ---------- The practice farm patch ----------
  // What the patch would do if you used it now:
  //   early (Tess hasn't talked to you) / hoe / plant / water / growing / harvest / nothing
  patchJob() {
    const p = this.state.patch;
    if (!p || !this.reached(s => s.event === 'hoe')) return 'early';
    return { weeds: 'hoe', soil: 'plant', seed: 'water', growing: 'growing', ready: 'harvest' }[p.s] || 'nothing';
  },
  patchUse(where = null) {
    const job = this.patchJob(), p = this.state.patch, D = this.data(), G = FUP.gardenData, crop = G.crops[D.patch.crop];
    const xp = n => FUP.skills.addXp('gardening', n, where);
    if (job === 'hoe') { p.s = 'soil'; xp(G.jobs.hoe.xp); }
    else if (job === 'plant') { p.s = 'seed'; xp(crop.plantXp); }
    else if (job === 'water') { p.s = 'growing'; p.grown = 0; xp(G.jobs.water.xp); }
    else if (job === 'harvest') {
      let got = 0;
      for (let k = 0; k < D.patch.harvest; k++) if (FUP.run.addToBag(D.patch.crop)) got++;
      if (!got) return { job, full: true };
      p.s = 'done'; xp(crop.harvestXp);
      return { job, got, note: this.note('harvest') };
    } else return { job };
    return { job, note: this.note(job) };
  },
  // Growing happens in play time on the island
  tick(dt) {
    const p = this.active() && this.state.patch;
    if (!p || p.s !== 'growing') return false;
    p.grown += dt;
    if (p.grown < this.data().patch.growSeconds) return false;
    p.s = 'ready';
    return true;
  },
  growLeft() { const p = this.state.patch; return p && p.s === 'growing' ? Math.max(0, Math.ceil(this.data().patch.growSeconds - p.grown)) : 0; },

  // ---------- The sawhorse and the dummy ----------
  // 'early' (Nell hasn't talked to you) / 'ok' / 'noBark' / 'full'
  sawUse(where = null) {
    if (!this.reached(s => s.event === 'saw')) return 'early';
    const can = FUP.place.canSaw();
    if (can !== 'ok') return can;
    FUP.place.saw(where);
    this.note('saw');
    return 'ok';
  },
  // The dummy only fights once Sergeant Bruise has talked to you, and only once
  canFight() { const st = this.step(); return !!st && st.event === 'fight'; },
  foughtAlready() { return this.reached(s => s.event === 'fight') && !this.canFight(); },
  fightOver(result) { return result === 'win' || result === 'charmed' ? this.note('fight') : null; },

  // ---------- The ferry (or Skip): off to Foopville ----------
  finish(skipped = false) {
    FUP.run.coins += this.data().coins;
    FUP.run.hp = null;   // full HP for the new life (the dummy may have left a mark)
    this.state = { ...this.fresh(), done: true, skipped };
    this.news = null;
    this.markSeen();
    delete FUP.world.state.seen[this.region()];   // the island leaves the world map: no going back
    FUP.world.arriveHome();
  },
};
FUP.tutorial.reset();
