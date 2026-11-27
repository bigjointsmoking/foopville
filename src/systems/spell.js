// ============================================================
// SPELL PIECES (v0.82): which pieces of the old spell you've found. Kept across deaths and
// new lives, in both modes (their own browser storage). Data: data/spell.js.
//   FUP.spell.has(id) · add(id) → { count, line } · count() · size() · slots() → [{ word, found }]
// ============================================================
window.FUP = window.FUP || {};

FUP.spell = {
  state: null,   // { questId: true }
  load() {
    if (this.state) return this.state;
    try { this.state = JSON.parse(localStorage.getItem(FUP.save.playerKey(FUP.spellData.storageKey)) || '{}') || {}; } catch (e) { this.state = {}; }
    // v1.38: pieces from the old story quests are gone (the main quest gives all 7 now)
    const old = (FUP.spellData.retired || []).filter(id => this.state[id]);
    if (old.length) { for (const id of old) delete this.state[id]; this.write(); }
    return this.state;
  },
  write() { try { localStorage.setItem(FUP.save.playerKey(FUP.spellData.storageKey), JSON.stringify(this.state)); } catch (e) { /* private window: kept for this visit only */ } },
  has(id) { return !!this.load()[id]; },
  count() { return Object.keys(this.load()).length; },
  size() { return FUP.spellData.size; },
  // Found a piece (a story quest finished). Already had it (a new life): nothing new.
  add(id) {
    const fresh = !this.has(id);
    if (fresh) { this.state[id] = true; this.write(); }
    const n = this.count();
    return { count: n, fresh, line: FUP.spellData.lines[Math.min(n, FUP.spellData.lines.length) - 1] };
  },
  // The page: one entry per slot
  slots() {
    const D = FUP.spellData, out = [];
    for (let i = 0; i < D.size; i++) { const p = D.pieces[i]; out.push({ word: p ? p.word : null, found: !!(p && this.has(p.quest)) }); }
    return out;
  },
};
