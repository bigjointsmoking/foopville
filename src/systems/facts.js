// ============================================================
// FACTS — one store of counters: things you've done this life.
// 'kill:squirrel': 14, 'boss:landlord': 2, 'quest:pie_day': 1 ...
// Requirements (src/systems/req.js) read them. Names in data/facts.js.
// Normal death keeps them. A new life wipes them.
// ============================================================
window.FUP = window.FUP || {};

FUP.facts = {
  state: {},
  listeners: [],

  reset() { this.state = {}; },
  get(key) { return this.state[key] || 0; },
  has(key) { return this.get(key) > 0; },
  set(key, n) {
    if (n) this.state[key] = n; else delete this.state[key];
    for (const fn of this.listeners) fn(key, this.get(key));
  },
  add(key, n = 1) { this.set(key, this.get(key) + n); return this.get(key); },

  // fn(key, newValue) is called whenever a fact changes
  onFact(fn) { this.listeners.push(fn); },

  // A readable name: 'boss:landlord' -> 'Beat The Mushroom Landlord'
  label(key) {
    const D = FUP.factData || { labels: {}, prefixes: {} };
    if (D.labels[key]) return D.labels[key];
    const cut = key.indexOf(':'), prefix = key.slice(0, cut), id = key.slice(cut + 1);
    const form = D.prefixes[prefix];
    return form ? form.replace('{name}', this.nameOf(prefix, id)) : key;
  },
  // The thing's own name, if the game data knows it
  nameOf(prefix, id) {
    const from = {
      boss: FUP.enemies, kill: FUP.enemies,
      quest: FUP.questData && FUP.questData.quests,
    }[prefix];
    return (from && from[id] && from[id].name) || id;
  },
};
