// ============================================================
// COMMISSION RULES (v0.70). No drawing.
//   status(id)   'hidden' | 'locked' | 'open' | 'building' | 'ready' | 'done'
//   start(id)    pay the materials, scaffolding goes up ('ok' | 'locked' | 'broke' | 'busy')
//   finish(id)   collect: coins + Building XP, the build stays ('ok' or null)
//   secondsLeft(id) · blocked(tx, ty) (finished and building sites are solid)
// Build time runs on the real clock (Date.now), like crops. Numbers in data/commissions.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.commissions = {
  // jobs: { id: { started: ms, need: seconds } } while building · done: fact 'built:<id>'... kept here as done: { id: true }
  state: { jobs: {}, done: {} },
  reset() { this.state = { jobs: {}, done: {} }; },

  list() { return FUP.commissionData.list; },
  get(id) { return this.list().find(c => c.id === id) || null; },
  need(c) { return (c.req && c.req.skills && c.req.skills.building) || 1; },

  status(id, now = Date.now()) {
    const c = this.get(id);
    if (!c) return 'hidden';
    if (this.state.done[id]) return 'done';
    const j = this.state.jobs[id];
    if (j) return now - j.started >= j.need * 1000 ? 'ready' : 'building';
    if (FUP.req.met(c.req)) return 'open';
    return FUP.skills.level('building') + FUP.commissionData.peek >= this.need(c) ? 'locked' : 'hidden';
  },
  secondsLeft(id, now = Date.now()) {
    const j = this.state.jobs[id];
    return j ? Math.max(0, Math.ceil(j.need - (now - j.started) / 1000)) : 0;
  },
  canPay(id) { return FUP.req.canPay(this.get(id).cost); },

  start(id, now = Date.now()) {
    const st = this.status(id, now);
    if (st === 'building' || st === 'ready' || st === 'done') return 'busy';
    if (st !== 'open') return 'locked';
    const c = this.get(id);
    if (!FUP.req.pay(c.cost)) return 'broke';
    this.state.jobs[id] = { started: now, need: c.minutes * 60 };
    return 'ok';
  },

  finish(id, where = null, now = Date.now()) {
    if (this.status(id, now) !== 'ready') return null;
    const c = this.get(id);
    delete this.state.jobs[id];
    this.state.done[id] = true;
    FUP.run.coins += c.pay;
    FUP.skills.addXp('building', c.xp, where);
    FUP.facts.add('commission:' + id);
    FUP.facts.add('commissions');
    return { pay: c.pay, xp: c.xp };
  },

  // A site's squares are solid once the scaffolding is up (and after)
  blocked(tx, ty) {
    for (const c of this.list()) {
      if (!this.state.done[c.id] && !this.state.jobs[c.id]) continue;
      const s = c.site;
      if (tx >= s.tx && tx < s.tx + s.w && ty >= s.ty && ty < s.ty + s.h) return true;
    }
    return false;
  },
  doneCount() { return Object.keys(this.state.done).length; },
};
