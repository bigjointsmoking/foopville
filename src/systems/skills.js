// ============================================================
// SKILLS — keeps track of every skill's level and XP.
// Works for any skill listed in data/skills.js, so adding a new
// skill later means adding one data line, not new code.
// ============================================================
window.FUP = window.FUP || {};

FUP.skills = {
  // { cooking: { level: 1, xp: 0 }, melee: {...}, ... }
  // `xp` is the XP you've earned toward the NEXT level (it resets to 0 each level).
  state: {},

  // Start every skill at level 1 with 0 XP. (Later: a new life starts here.)
  init() {
    this.state = {};
    for (const id of Object.keys(FUP.skillData.skills)) this.state[id] = { level: 1, xp: 0 };
  },

  level(id) { return this.state[id].level; },

  // Every skill id, in the order lists show them (data/skills.js `order`)
  list() { const S = FUP.skillData.skills; return Object.keys(S).sort((a, b) => (S[a].order || 99) - (S[b].order || 99)); },
  // Is this skill playable yet? (false = listed as "Not in the game yet")
  built(id) { return !!FUP.skillData.skills[id].built; },
  // Your combat level: the highest of your combat skills (Melee, later Ranged and Magic)
  combatLevel() {
    const S = FUP.skillData.skills;
    return Math.max(1, ...this.list().filter(id => S[id].combat && S[id].built).map(id => this.level(id)));
  },

  // XP needed to go from `level` to `level + 1`.
  xpForNext(level) {
    const d = FUP.skillData;
    return Math.max(1, Math.round(d.xpBase * Math.pow(2, level / d.xpDoubleEvery) - d.xpBase * d.xpOffset));
  },

  // Screens that want to show XP pop-ups / level-up banners listen here.
  // onXp(fn) returns a function that stops listening.
  listeners: [],
  onXp(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(f => f !== fn); };
  },

  // Give XP. Handles leveling up (even several levels at once).
  // `where` (optional) = { x, y } on screen, so the pop-up appears where it happened.
  // Returns { from, to, gained } so the screen can say "LEVEL UP!"
  addXp(id, amount, where = null) {
    const s = this.state[id], max = FUP.skillData.maxLevel;
    const from = s.level;
    amount = Math.round(amount);
    if (!this.built(id) || s.level >= max || amount <= 0) return { from, to: from, gained: 0 };
    s.xp += amount;
    while (s.level < max && s.xp >= this.xpForNext(s.level)) {
      s.xp -= this.xpForNext(s.level);
      s.level++;
    }
    if (s.level >= max) s.xp = 0;
    const res = { id, from, to: s.level, gained: amount, where };
    for (const fn of this.listeners.slice()) { try { fn(res); } catch (err) { console.error(err); } }
    return res;
  },

  // The skill guide: every special unlock, sorted by level.
  guide(id) {
    const g = FUP.skillData.skills[id].guide;
    // Tools for this skill (data/tools.js): every tier you can buy, at the level it needs (G2)
    const tools = !FUP.toolData ? [] : Object.values(FUP.toolData.lines).filter(l => l.skill === id)
      .flatMap(l => l.tiers.slice(1).map(t => ({ level: (t.req && t.req.skills && t.req.skills[id]) || 1, text: `🛠️ ${l.name}: ${t.name} (${t.blurb})` })));
    return (g ? g() : []).concat(tools).sort((a, b) => a.level - b.level);
  },

  // What you unlock by going from level `from` to level `to` (a list of text lines).
  unlocksBetween(id, from, to) {
    return this.guide(id).filter(u => u.level > from && u.level <= to).map(u => u.text);
  },

  // Everything a progress bar needs.
  progress(id) {
    const s = this.state[id], max = FUP.skillData.maxLevel;
    const need = s.level >= max ? 0 : this.xpForNext(s.level);
    return { level: s.level, xp: s.xp, need, ratio: need ? s.xp / need : 1, maxed: s.level >= max };
  },
};

FUP.skills.init();
