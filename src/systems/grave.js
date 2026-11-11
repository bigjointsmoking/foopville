// ============================================================
// GRAVE (Normal mode, Refinement Phase 1) — no drawing here.
// When you die in Normal mode, everything you carried and wore goes
// into a grave where you fell. You wake up at home with full HP and
// have to walk back for it before the timer runs out.
// One grave at a time: dying again deletes the old one.
// Numbers live in data/run.js (FUP.runData.grave).
// ============================================================
window.FUP = window.FUP || {};

FUP.grave = {
  // null, or { area, x, y, left (seconds), bag, satchel, coins, gear: [items] }
  state: null,

  reset() { this.state = null; },
  active() { return !!this.state; },

  // You just died. Pack up everything you had into a grave, send you home.
  // Returns { replaced } (true = an older grave was deleted).
  dig() {
    const run = FUP.run, f = run.forest, F = FUP.forest;
    const replaced = !!this.state;
    // Where: on the spot you fell in the Forest. Died in the raid: next to the hole in the Deep Woods.
    let region = f && f.area ? f.area : 'edge', spot = null;
    const A = f && f.areas[region];
    if (f && f.raid) {
      if (A && A.hole) { F.use(region); spot = F.besideExit(A.hole); }
    } else if (A && A.player) {
      spot = { x: A.player.x, y: A.player.y };
    }
    if (!spot) { region = 'edge'; spot = FUP.world.gapMiddle('edge', 'W'); }   // fallback: just inside the Forest Edge

    // Worn gear and gear in your backpack (v0.41) all go in
    const gear = run.stash.splice(0);
    for (const slot of FUP.gearData.slots) if (run.equipped[slot]) { gear.push(run.equipped[slot]); run.equipped[slot] = null; }
    this.state = {
      region, x: spot.x, y: spot.y,   // region id (data/world.js); before v0.52 this was an area number
      left: FUP.runData.grave.minutes * 60,
      bag: { ...run.bag }, satchel: run.satchel.slice(), coins: run.coins, gear,
    };
    // You wake up at home with nothing on you but your base weapon
    run.bag = {}; run.satchel = []; run.coins = 0;
    run.hp = null;
    run.limit = 0;   // a fresh start: empty Limit bar
    run.forest = null; run.battle = null;
    return { replaced };
  },

  // Called a few times a second (src/main.js) while the game is open and showing.
  // Returns true the moment the grave crumbles.
  tick(dt) {
    if (!this.state) return false;
    this.state.left -= dt;
    if (this.state.left > 0) return false;
    this.state = null;
    return true;
  },

  // Walk onto it: take back everything that fits in your backpack. Nothing equips itself (v0.41, Jesus):
  // gear goes in the backpack too. Whatever doesn't fit stays in the grave.
  // Returns { coins, gear, ings, dishes, left } (left = things still in the grave).
  loot() {
    const g = this.state, run = FUP.run;
    if (!g) return null;
    const got = { coins: g.coins, gear: 0, ings: 0, dishes: 0, left: 0 };
    run.coins += g.coins; g.coins = 0;
    g.gear = g.gear.filter(it => { if (run.addGear(it)) { got.gear++; return false; } return true; });
    for (const [id, n] of Object.entries(g.bag)) {
      let k = n;
      while (k > 0 && run.addToBag(id)) { k--; got.ings++; }
      if (k > 0) g.bag[id] = k; else delete g.bag[id];
    }
    g.satchel = g.satchel.filter(d => { if (run.canAddDish(d.name, d.tier)) { run.satchel.push(d); got.dishes++; return false; } return true; });
    got.left = Object.values(g.bag).reduce((a, b) => a + b, 0) + g.satchel.length + g.gear.length;
    if (!got.left) this.state = null;
    return got;
  },

  // "12:34" left on the timer
  timeText() {
    if (!this.state) return '';
    const s = Math.max(0, Math.ceil(this.state.left));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  },
  // "Grave (Deep Woods) 12:34"
  hudText() {
    if (!this.state) return '';
    return `🪦 Grave in ${FUP.forest.area(this.state.region).name}: ${this.timeText()}`;
  },
};
