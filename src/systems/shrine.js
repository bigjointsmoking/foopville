// ============================================================
// THE SHRINE (v0.82): feed the Guardian a cooked dish at the Forest Edge shrine and it comes up to fight.
// Only after The Bowl, once every 20 minutes of play (v0.86; was once per in-game day), the full boss. More stars = better extra loot.
// Data: FUP.raidData.shrine. The fight is the normal Battle with run.battle.shrine = true.
//   FUP.shrine.open() → { ok, why }   dishes() → [{ dish, idx, stars }]   feed(i) → stars   reward(stars) → [lines]
// ============================================================
window.FUP = window.FUP || {};

FUP.shrine = {
  data() { return FUP.raidData.shrine; },
  unlocked() { return FUP.quests.done(this.data().needQuest); },
  // Seconds of play until it's hungry again (0 = ready). Fact 'shrine:fedAt' = play second it was last fed (+1, so 0 means never)
  waitLeft() { const at = FUP.facts.get('shrine:fedAt'); return at ? Math.max(0, this.data().cooldownSeconds - (FUP.clock.now() - (at - 1))) : 0; },
  fedToday() { return this.waitLeft() > 0; },   // (old name: 'today' is now the last 20 minutes of play)
  // Can you feed it right now? why = the line to show if not
  open() {
    const L = this.data().lines;
    if (!this.unlocked()) return { ok: false, why: L.locked };
    if (this.fedToday()) return { ok: false, why: L.fed.replace('{min}', Math.max(1, Math.ceil(this.waitLeft() / 60))) };
    if (!this.dishes().length) return { ok: false, why: L.noFood };
    return { ok: true };
  },
  // Dishes it will take: anything cooked that isn't burnt, best first
  dishes() {
    const seen = {}, out = [];
    FUP.run.satchel.forEach((d, i) => {
      if (d.burnt) return;
      const k = d.name + '|' + d.tier;
      if (seen[k]) { seen[k].n++; return; }
      seen[k] = { dish: d, idx: i, n: 1, stars: FUP.cooking.stars(d.tier) };
      out.push(seen[k]);
    });
    return out.sort((a, b) => b.stars - a.stars).slice(0, 8);
  },
  // Leave dish i: it's gone, today is used up. Returns the stars it had.
  feed(i) {
    const e = this.dishes()[i];
    if (!e) return 0;
    FUP.run.satchel.splice(e.idx, 1);
    FUP.facts.set('shrine:fedAt', Math.floor(FUP.clock.now()) + 1);
    return e.stars;
  },
  // The extra loot after you beat it at the shrine (on top of its normal drops)
  reward(stars, rng = Math.random) {
    const D = this.data(), out = [];
    const coins = D.coinsPerStar * stars;
    FUP.run.coins += coins;
    out.push(`🥣 The shrine pays out (${'★'.repeat(stars)}): +${coins} 🪙`);
    const got = {};
    for (let k = 0; k < D.matsPerStar * stars; k++) { const m = D.mats[Math.floor(rng() * D.mats.length)]; FUP.mats.add(m, 1); got[m] = (got[m] || 0) + 1; }
    if (Object.keys(got).length) out.push('Materials: ' + Object.entries(got).map(([m, n]) => `${FUP.salvageData.materials[m].emoji} ${n}`).join('  '));
    if (stars >= D.gearAtStars) {
      const it = FUP.gear.rollDrop(true, rng, null, 1 / FUP.gearData.dropChance.boss, FUP.raidData.dropTier);
      if (it) out.push(FUP.run.addGear(it) ? `🎁 Bonus ${it.rarity} gear: ${it.name} (in your backpack)` : `🎁 Bonus ${it.rarity} ${it.name}, but your backpack is full. Left behind.`);
    }
    return out;
  },
};
