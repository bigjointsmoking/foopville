// ============================================================
// CLOCK RULES — play time, days and timers. No drawing.
// Time only moves while the game is open, showing, and you're past the title.
//   FUP.clock.onDay(fn)              fn(newDay) every time a day starts
//   FUP.clock.every(seconds, id, fn) fn() every `seconds` of play time (its place is saved under `id`)
// ============================================================
window.FUP = window.FUP || {};

FUP.clock = {
  // play: seconds played this life · day: 1, 2, 3... · t: seconds into today · timers: { id: play second it last fired }
  state: { play: 0, day: 1, t: 0, timers: {} },
  dayHooks: [],
  jobs: {},        // { id: { seconds, fn } } (registered by code each time the game loads; only `timers` is saved)
  rolled: 0,       // set to the new day number when a day starts by itself (the map screen says so once)

  reset() { this.state = { play: 0, day: 1, t: 0, timers: {} }; this.rolled = 0; },

  now() { return this.state.play; },
  day() { return this.state.day; },
  share() { return this.state.t / FUP.clockData.daySeconds; },   // 0 to 1 through today
  phase() { const P = FUP.clockData.phases; return P.find(p => this.share() < p.until) || P[P.length - 1]; },
  label() { return `Day ${this.state.day} ${this.phase().emoji}`; },
  canSleep() { return this.share() >= FUP.clockData.sleepFrom; },

  onDay(fn) { this.dayHooks.push(fn); return () => { this.dayHooks = this.dayHooks.filter(f => f !== fn); }; },
  newDay() {
    this.state.day++;
    for (const fn of this.dayHooks.slice()) { try { fn(this.state.day); } catch (err) { console.error(err); } }
  },

  // Move time on by dt seconds (never more than maxStep at once)
  tick(dt) {
    const D = FUP.clockData, s = this.state;
    dt = Math.max(0, Math.min(dt, D.maxStep));
    for (const id of Object.keys(this.jobs)) if (s.timers[id] === undefined) s.timers[id] = s.play;   // a new life: timers count from now
    s.play += dt; s.t += dt;
    while (s.t >= D.daySeconds) { s.t -= D.daySeconds; this.newDay(); this.rolled = s.day; }
    this.runTimers();
  },

  // Bed: skip to tomorrow morning. Play time (and its timers) does not jump. Returns false if it's too early.
  sleep() {
    if (!this.canSleep()) return false;
    this.state.t = 0;
    this.newDay();
    return true;
  },

  every(seconds, id, fn) {
    this.jobs[id] = { seconds, fn };
    if (this.state.timers[id] === undefined) this.state.timers[id] = this.state.play;
  },
  runTimers() {
    const s = this.state, cap = FUP.clockData.maxCatchUp;
    for (const [id, job] of Object.entries(this.jobs)) {
      if (s.timers[id] === undefined) s.timers[id] = s.play;   // a new life: start counting from now
      let fired = 0;
      while (s.play - s.timers[id] >= job.seconds && fired < cap) {
        s.timers[id] += job.seconds; fired++;
        try { job.fn(); } catch (err) { console.error(err); }
      }
      if (fired >= cap && s.play - s.timers[id] >= job.seconds) s.timers[id] = s.play;   // too far behind: drop the rest
    }
  },
};
