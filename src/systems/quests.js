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
  // Side stories (errands) and Quests both work in steps
  isSide(id) { const k = this.kind(id); return k === 'side' || k === 'quest'; },
  isQuest(id) { return this.kind(id) === 'quest'; },
  done(id) { return FUP.facts.has('quest:' + id); },
  coins(id) { const r = this.def(id).reward; return typeof r === 'number' ? r : (r && r.coins) || 0; },
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
    for (const kind of Object.keys(D.boardSize)) {   // (Quests aren't random: they're all listed, see available)
      const pool = Object.keys(D.quests).filter(id => this.kind(id) === kind && this.fits(id) && !s.active[id] && !s.board.includes(id) && !s.rest[id]);
      while (s.board.filter(id => this.kind(id) === kind).length < this.boardSize(kind) && pool.length) s.board.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
  },
  // How many of a kind the board shows (His First Quest can add one: data/quests.js boardPerk)
  boardSize(kind) {
    const D = FUP.questData, p = D.boardPerk;
    return D.boardSize[kind] + (p && p.kind === kind && FUP.facts.has(p.fact) ? p.extra : 0);
  },
  // On the board right now (kind = only that kind).
  available(kind = null) {
    // Quests (v0.79): every one you haven't done or taken, Requirements met or not (the board shows what's missing)
    if (kind === 'quest') return Object.keys(FUP.questData.quests).filter(id => this.isQuest(id) && !this.state.active[id] && !this.done(id));
    this.refill(); return this.state.board.filter(id => !kind || this.kind(id) === kind);
  },
  // Quests you could start right now with this villager (the ❗ over their head)
  startsAt(npc) { return this.available('quest').filter(id => this.def(id).from === npc && this.fits(id)); },
  activeIds(kind = null) { return Object.keys(this.state.active).filter(id => this.def(id) && (!kind || this.kind(id) === kind)); },
  // maxActive is per kind: side stories don't crowd out challenges
  canTake(kind = 'challenge') { return kind === 'quest' || this.activeIds(kind).length < FUP.questData.maxActive; },

  take(id) {
    if (!this.canTake(this.kind(id)) || this.state.active[id]) return false;
    if (this.isQuest(id) ? (this.done(id) || !this.fits(id)) : !this.state.board.includes(id)) return false;
    this.state.active[id] = { n: 0, done: false, step: 0, flags: {}, talked: {}, log: [] };
    if (FUP.facts) FUP.facts.add('did:quest');   // first-day goals (data/goals.js)
    this.state.board = this.state.board.filter(b => b !== id);
    this.refill();
    return true;
  },
  // Drop a taken quest: it goes back on the board if there's room.
  drop(id) {
    delete this.state.active[id];
    if (this.isQuest(id)) return;   // quests go back to the list by themselves
    if (this.available(this.kind(id)).length < this.boardSize(this.kind(id))) this.state.board.push(id);
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
    const q = this.def(id), s = this.state.active[id] || {};
    delete this.state.active[id];
    if (this.isQuest(id)) return this.payQuest(id, q, s);
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

  // A Quest is done for good: coins, XP in the skills it used, and a bonus for the choices you made
  payQuest(id, q, s) {
    const r = q.reward || {}, got = [];
    let coins = (r.coins || 0) + (r.cut ? Math.round((s.earned || 0) * r.cut) : 0);   // Clearing Out: her cut of what you got
    for (const b of r.bonus || []) if ((s.flags || {})[b.flag] && b.coins) coins += b.coins;
    FUP.run.coins += coins;
    for (const [sk, x] of Object.entries(r.xp || {})) if (FUP.skills.addXp) { FUP.skills.addXp(sk, x); got.push(`+${x} ${FUP.skillData && FUP.skillData.skills[sk] ? FUP.skillData.skills[sk].name : sk} XP`); }
    const give = b => {
      if (b.gear && FUP.gear) { const it = FUP.gear.fromShop(b.gear); if (FUP.run.addGear(it)) got.push(`${it.emoji} ${it.name} (in your backpack)`); else { FUP.house.state.gear = FUP.house.state.gear || []; FUP.house.state.gear.push(it); got.push(`${it.emoji} ${it.name} (sent home: backpack full)`); } }
      if (b.hat && FUP.cosmetics) { FUP.cosmetics.own(b.hat); const h = FUP.cosmeticData.hats[b.hat]; got.push(`${h.emoji} ${h.name} (a hat: Wardrobe)`); }
      if (b.recipe && FUP.cooking) { FUP.cooking.cookbook.discovered[b.recipe] = true; got.push(`📖 Recipe: ${b.recipe}`); }
      if (b.tool && FUP.tools) { FUP.tools.giveQuestTool(b.tool); got.push(`🎣 ${FUP.toolData.questTools[b.tool].name}`); }
      this.grant(b, got);
      if (b.place && FUP.place) { FUP.place.state.owned[b.place] = (FUP.place.state.owned[b.place] || 0) + 1; const P = FUP.placeData.items[b.place]; got.push(`${P.emoji} ${P.name} (place it with 🔨 Build)`); }
    };
    give(r);
    const lines = [];
    for (const b of r.bonus || []) if ((s.flags || {})[b.flag]) { give(b); if (b.line) lines.push(b.line); }
    FUP.facts.add(`quest:${id}`);
    this.lastReward = { id, coins, got, lines };
    return coins;
  },
  // Rewards that a step can hand over too: seeds for the seed pouch, a fact (perks, titles)
  grant(b, got = []) {
    for (const [k, n] of Object.entries(b.seeds || {})) { FUP.garden.state.seeds[k] = FUP.garden.seedCount(k) + n; got.push(`🌱 ${n} ${FUP.ingredients[k].name} seeds (seed pouch)`); }
    if (b.fact) FUP.facts.add(b.fact);
    if (b.title && FUP.cosmeticData.titles[b.title]) got.push(`🏷️ Title: "${FUP.cosmeticData.titles[b.title].text}" (Wardrobe)`);
    if (b.perk) got.push(b.perk);
    if (b.renameRecipe && FUP.cooking) { const nm = b.renameRecipe.to.replace('{hero}', (FUP.run.hero && FUP.run.hero.name) || 'Your'); FUP.cooking.cookbook.names = FUP.cooking.cookbook.names || {}; FUP.cooking.cookbook.names[b.renameRecipe.from] = nm; got.push(`📖 It's called "${nm}" in your recipe book`); }
    return got;
  },

  // ---------- Side stories: steps ----------
  // step(id) = the step you're on: { talk: npc } | { bring: { item: n }, to: npc } | { event, count, match }
  step(id) { const q = this.def(id), s = this.state.active[id]; return q && s && q.steps ? q.steps[s.step || 0] || null : null; },
  regionName(r) { return r === 'village' ? 'the village' : FUP.world && FUP.world.region(r) ? FUP.world.region(r).name : r; },
  npcName(npc) { const n = FUP.villageData.npcs[npc]; return n ? n.name.replace(/^The /, 'the ') : npc; },
  have(item) { return FUP.run.bagCount(item); },
  // What the tracker and the board say about where you are
  stepText(id) {
    const st = this.step(id), s = this.state.active[id];
    if (!st) return '';
    if (st.taste) return st.goal || `Bring ${this.npcName(st.taste)} a bowl to taste`;
    if (st.guest && st.talk) return `Meet ${this.npcName(st.talk)} (${this.regionName(st.guest.region)})`;
    if (st.search) return `Search ${st.search.name} (${this.regionName(st.search.region)})` + (st.when === 'night' ? ' at night 🌙' : '');
    if (st.fight && !st.goal) return `Find ${st.fight.name} (${this.regionName(st.fight.region)})`;
    if (st.talkAll) { const left = Object.keys(st.talkAll).filter(k => !s.talked[k]).map(k => this.npcName(k)); return `${st.goal}  (left: ${left.join(', ')})`; }
    if (st.goal) return st.goal + (st.bring ? '  (' + Object.entries(st.bring).map(([k, n]) => `${Math.min(this.have(k), n)}/${n}`).join(', ') + ')' : st.count > 1 ? `  (${s.n}/${st.count})` : '');
    if (st.talk) return `Talk to ${this.npcName(st.talk)}`;
    if (st.bring) return `Bring ${Object.entries(st.bring).map(([k, n]) => `${n} ${FUP.ingredients[k].name}`).join(' and ')} to ${this.npcName(st.to)}`;
    return '';
  },
  // Side-story steps waiting at this villager: [{ id, name, label }]
  // region (optional): a step where they meet you somewhere else (step.guest) only counts there
  stepsAt(npc, region = null) {
    return this.activeIds().filter(id => this.isSide(id)).filter(id => {
      const st = this.step(id), s = this.state.active[id];
      if (st && st.guest && region && st.guest.region !== region) return false;
      return st && (st.talk === npc || st.taste === npc || (st.bring && st.to === npc) || (st.talkAll && st.talkAll[npc] && !s.talked[npc]));
    }).map(id => ({ id, name: this.def(id).name }));
  },
  // Villagers out of the village for a quest step (step.guest = { region, tx, ty }): [{ id, npc, tx, ty }]
  guestsIn(region) {
    return this.activeIds().map(id => ({ id, st: this.step(id) })).filter(o => o.st && o.st.guest && o.st.guest.region === region)
      .map(o => ({ id: o.id, npc: o.st.talk || o.st.taste || o.st.guest.npc, tx: o.st.guest.tx, ty: o.st.guest.ty }));
  },
  // Is this villager away from home right now (so the village doesn't draw them)?
  away(npc) { return this.activeIds().some(id => { const st = this.step(id); return st && st.guest && st.guest.region !== 'village' && (st.talk || st.taste || st.guest.npc) === npc; }); },
  // A step waiting at this villager, but they're somewhere else today (a guest step)
  elsewhere(npc, region) { return this.activeIds().some(id => { const st = this.step(id); return st && st.guest && (st.talk || st.guest.npc) === npc && st.guest.region !== region; }); },

  // 🔍 spots on this map for your quests: [{ id, tx, ty, name }]
  searchesIn(region) {
    return this.activeIds().filter(id => { const st = this.step(id); return st && st.search && st.search.region === region; })
      .map(id => ({ id, ...this.step(id).search }));
  },
  // Quest enemies waiting on this map: [{ id, tx, ty, enemy, group, name }]
  foesIn(region) {
    return this.activeIds().filter(id => { const st = this.step(id); return st && st.fight && st.fight.region === region; })
      .map(id => ({ id, ...this.step(id).fight }));
  },
  // Fish a quest wants from this spot right now (step: { event: 'fish', catchAt: spot, match: { id }, when })
  questFish(spot) {
    const out = {};
    for (const id of this.activeIds()) {
      const st = this.step(id);
      if (st && st.event === 'fish' && st.catchAt === spot && (!st.when || !FUP.clock || FUP.clock.phase().id === st.when)) out[st.match.id] = st.weight || 4;
    }
    return out;
  },
  // You beat (or charmed) a quest enemy
  foeBeaten(id) { const st = this.step(id); return st && st.fight ? this.advance(id, '') : null; },
  // Search a 🔍 spot. Returns like doStep (maybe with choices).
  doSearch(id) {
    const st = this.step(id);
    if (!st || !st.search) return { ok: false, line: '' };
    if (st.when && FUP.clock && FUP.clock.phase().id !== st.when) return { ok: false, line: st.notYet || 'Nothing here. Not now, anyway.' };
    if (st.choices) return { ok: true, line: st.say || '', choices: this.choiceList(id) };
    return this.advance(id, st.say || '');
  },
  // The choices on this step, with whether you can pick each (Rizz)
  choiceList(id) {
    const st = this.step(id), s = this.state.active[id];
    if (st.taste && !s.tasted) return this.bowls().map((g, i) => ({ i, label: `${g.dish.emoji} ${g.dish.name} (${(g.dish.ids || []).map(k => FUP.ingredients[k].short || FUP.ingredients[k].name).join(', ')})${g.n > 1 ? ' ×' + g.n : ''}`, ok: true }));
    return (st.choices || []).map((c, i) => ({ i, label: c.label + (c.rizz ? ` (Rizz ${c.rizz})` : ''), ok: !c.rizz || FUP.skills.level('rizz') >= c.rizz }));
  },
  // Pick choice i on the current step
  choose(id, i) {
    const st = this.step(id), s = this.state.active[id];
    if (st && st.taste && !s.tasted) return this.taste(id, i);
    const c = st && st.choices && st.choices[i];
    if (!c || (c.rizz && FUP.skills.level('rizz') < c.rizz)) return { ok: false, line: '' };
    if (c.retry) return { ok: false, line: c.say || '', retry: true };
    if (c.flag) s.flags[c.flag] = true;
    if (c.earn) s.earned = (s.earned || 0) + c.earn;   // Clearing Out: what this buyer paid
    return this.advance(id, c.say || '');
  },
  // Grandmother's Soup: they taste dish stack i from your satchel (it's eaten). The step's `rules`, in order:
  //   { burnt } { notMethod } { has: [ids] } { missing: id } { extra: [allowed ids] } {} = always; first that fits says its line.
  //   pass: true = right: the step goes on (or shows the step's choices, if it has any)
  // Your dishes for tasting, grouped by what's in them (experiments all share one name): [{ dish, idx, n }]
  bowls() {
    const groups = {};
    FUP.run.satchel.forEach((d, k) => { const key = [d.name, d.tier, d.method, (d.ids || []).slice().sort().join('+')].join('|'); (groups[key] = groups[key] || { dish: d, idx: [], n: 0 }).idx.push(k); groups[key].n++; });
    return Object.values(groups).slice(0, 8);   // the card fits 8
  },
  taste(id, i) {
    const st = this.step(id), s = this.state.active[id], g = this.bowls()[i];
    if (!g) return { ok: false, line: '' };
    const d = g.dish, ids = d.ids || [];
    const rule = (st.rules || []).find(r =>
      (r.burnt === undefined || !!d.burnt === r.burnt) &&
      (!r.notMethod || d.method !== r.notMethod) &&
      (!r.has || r.has.some(k => ids.includes(k))) &&
      (!r.missing || !ids.includes(r.missing)) &&
      (!r.extra || ids.some(k => !r.extra.includes(k)))) || { say: '' };
    FUP.run.satchel.splice(g.idx[0], 1);   // a spoonful. Then the whole bowl.
    if (!rule.pass) return { ok: false, line: rule.say, retry: true };
    if (st.choices) { s.tasted = true; return { ok: true, line: st.say || rule.say, choices: this.choiceList(id) }; }
    return this.advance(id, rule.say);
  },
  // The journal: what's happened so far, then where you are now
  journal(id) {
    const s = this.state.active[id], st = this.step(id);
    if (!s) return [];
    return [...(s.log || []), st && st.log ? st.log : null].filter(Boolean);
  },
  // Do the step at a villager. Returns { line, coins (when the story ends), ok }.
  doStep(id, npc = null) {
    const st = this.step(id), s = this.state.active[id];
    if (!st) return { line: '', ok: false };
    if (st.talkAll) {   // talk to each of them, any order
      if (!npc || !st.talkAll[npc] || s.talked[npc]) return { ok: false, line: '' };
      s.talked[npc] = true;
      if (Object.keys(st.talkAll).every(k => s.talked[k])) { const r = this.advance(id, st.talkAll[npc]); return r; }
      return { ok: true, line: st.talkAll[npc] };
    }
    if (st.taste) {
      if (s.tasted) return { ok: true, line: st.say || '', choices: this.choiceList(id) };
      if (!FUP.run.satchel.length) return { ok: false, line: st.empty || 'Bring me a bowl of something. Cook first.' };
      return { ok: true, line: st.ask || 'Which bowl?', choices: this.choiceList(id) };
    }
    if (st.choices) return { ok: true, line: st.say || '', choices: this.choiceList(id) };
    if (st.sayIf) for (const [flag, line] of Object.entries(st.sayIf)) if ((s.flags || {})[flag]) { st._say = line; }
    if (st.bring) {
      const short = Object.entries(st.bring).filter(([k, n]) => this.have(k) < n);
      if (short.length) return { ok: false, line: st.notYet || `Bring me ${short.map(([k, n]) => `${n} ${FUP.ingredients[k].name}`).join(' and ')}. You have ${short.map(([k, n]) => this.have(k)).join(' and ')}.` };
      for (const [k, n] of Object.entries(st.bring)) FUP.run.takeFromBag(Array(n).fill(k));
    }
    const line = st._say || st.say || ''; delete st._say;
    return this.advance(id, line);
  },
  // Next step (or the end of the story: paid by the villager)
  advance(id, line) {
    const q = this.def(id), s = this.state.active[id], st = this.step(id);
    if (st && st.log) (s.log = s.log || []).push(st.log);
    if (st && st.give) this.grant(st.give);   // a step can hand you something (Pip's root seeds)
    s.step = (s.step || 0) + 1; s.n = 0; s.talked = {}; s.tasted = false;
    if (s.step < q.steps.length) return { ok: true, line };
    const coins = this.finish(id);
    return { ok: true, line, coins, done: q.name, reward: this.isQuest(id) ? this.lastReward : null };
  },

  // Something happened. Returns the names of quests it just finished (so the screen can cheer).
  event(type, data = {}) {
    if (FUP.tutorial) FUP.tutorial.note(type);   // Orientation Isle listens too (fish, cook...)
    if (type === 'kill') this.runKills++;
    if (type === 'campfire') data = { ...data, kills: this.runKills };
    if (type === 'boss' || type === 'kill' || type === 'charm') data = { weapon: FUP.run.weapon, ...data };
    const finished = [];
    for (const id of this.activeIds().filter(x => this.isSide(x))) {   // side-story / quest steps like "defeat 5 squirrels"
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
    if (m.id && data.id !== m.id) return false;   // a particular fish (v0.80)
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
