// Dev stats panel (M1). Hidden: ` key, or tap the top-left corner 3 times on a phone.
// Watches the game from outside (wraps a few functions) and writes a timing log that
// Jesus can copy into a chat. Changes nothing about how the game plays.
// Clock = "play time": seconds the tab was open and visible (a hidden tab doesn't count).
// Numbers in data/devstats.js. Local only: browser storage, no network.
FUP.devStats = {
  log: null, open: false, box: null, text: null, loading: false,

  fresh() {
    return { play: 0, life: null, events: [], isle: [], isleStart: null, isleEnd: null,
      firsts: {}, trips: [], trip: null, deaths: {} };
  },
  D() { return FUP.devStatsData; },
  now() { return this.log.play; },
  sinceLife() { return this.log.life ? this.now() - this.log.life.at : this.now(); },

  // ---------- Storage (own browser key, separate from the save) ----------
  read() {
    try { const s = JSON.parse(localStorage.getItem(this.D().storageKey)); if (s && s.events) return { ...this.fresh(), ...s }; } catch (e) {}
    return this.fresh();
  },
  write() { try { localStorage.setItem(this.D().storageKey, JSON.stringify(this.log)); } catch (e) {} },

  // ---------- Recording ----------
  // kind: xp / coin / drop / level / quest = a reward. Anything else is just a mark.
  add(kind, text) {
    if (this.loading) return;
    const L = this.log, t = this.sinceLife();
    L.events.push({ t, kind, text });
    if (L.events.length > this.D().keepEvents) L.events.splice(0, L.events.length - this.D().keepEvents);
    if (this.isReward(kind) && L.firsts[kind] == null) L.firsts[kind] = t;
  },
  isReward(kind) { return ['xp', 'coin', 'drop', 'level', 'quest'].includes(kind); },
  region() {
    const r = FUP.run, b = r.battle;
    if (b && b.raid) return 'raid';
    return (FUP.world.state && FUP.world.state.region) || (r.forest && r.forest.area) || '?';
  },
  regionName(id) {
    try { const a = FUP.forest.area(id); if (a && a.name) return a.name; } catch (e) {}
    const w = FUP.worldData && FUP.worldData.regions && FUP.worldData.regions[id];
    return (w && w.name) || id;
  },
  endTrip(how) {
    const L = this.log, tr = L.trip;
    if (!tr) return;
    L.trips.push({ start: tr.start, len: this.sinceLife() - tr.start, how, areas: tr.areas });
    L.trip = null;
    this.add('mark', `trip ended (${how})`);
  },

  // ---------- Hooks: wrap game functions (they still run exactly as before) ----------
  wrap(obj, name, before, after) {
    const old = obj[name];
    if (typeof old !== 'function') return;
    const self = this;
    obj[name] = function (...args) {
      let pre;
      try { pre = before ? before.apply(this, args) : null; } catch (e) { console.error(e); }
      const res = old.apply(this, args);
      try { if (after) after.call(this, res, args, pre); } catch (e) { console.error(e); }
      return res;
    };
  },
  hook() {
    const S = this, G = FUP;
    // Loading a save calls newLife: that's not a new life, and its coins aren't a reward
    this.wrap(G.save, 'load', () => { S.loading = true; }, () => { S.loading = false; });
    this.wrap(G.run, 'newLife', null, () => {
      if (S.loading) return;
      const L = S.log;
      Object.assign(L, { life: { at: L.play, mode: G.run.hero.mode, date: new Date().toLocaleString() },
        events: [], isle: [], isleStart: null, isleEnd: null, firsts: {}, trips: [], trip: null, deaths: {} });
    });
    // Coins: the game adds to FUP.run.coins in many places, so watch the number itself
    let coins = G.run.coins || 0;
    Object.defineProperty(G.run, 'coins', { enumerable: true, configurable: true,
      get() { return coins; },
      set(v) { const gain = v - coins; coins = v; if (gain > 0) S.add('coin', `+${Math.round(gain)} coins`); } });
    // XP and level-ups (the game's own listener list)
    G.skills.listeners.push(res => {
      if (!res || !res.gained) return;
      const sk = G.skillData.skills[res.id] || {};
      S.add('xp', `${sk.name || res.id} +${res.gained} XP`);
      if (res.to > res.from) {
        S.add('level', `${sk.name || res.id} level ${res.to}`);
        if (S.log.firsts.firstLevel == null) S.log.firsts.firstLevel = { t: S.sinceLife(), what: `${sk.name || res.id} ${res.to}` };
      }
    });
    // Gear drops
    this.wrap(G.gear, 'rollDrop', null, it => { if (it) S.add('drop', `drop: ${it.name || it.key || 'gear'}`); });
    this.wrap(G.gear, 'rollChase', null, out => { for (const o of out || []) S.add('drop', `boss drop: ${o.name}`); });
    // Quest steps and finished quests
    const qName = id => { const q = G.quests.def && G.quests.def(id); return (q && (q.title || q.name)) || id; };
    this.wrap(G.quests, 'advance', id => (G.quests.state.active[id] || {}).step || 0,
      (res, [id], step) => S.add('quest', `quest step ${step + 1} done: ${qName(id)}`));
    this.wrap(G.quests, 'finish', null, (res, [id]) => S.add('quest', `quest done: ${qName(id)}`));
    // Orientation Isle: time to each step (read-only: the island's code isn't touched)
    this.wrap(G.tutorial, 'begin', null, () => { S.log.isleStart = S.sinceLife(); S.log.isle = []; S.add('mark', 'Isle start'); });
    this.wrap(G.tutorial, 'advance', () => G.tutorial.step(), (res, args, st) => {
      if (!res || !st) return;
      // Steps can tick in a chain (inner call logs first), so number them by their place in the list
      const L = S.log, t = S.sinceLife(), n = G.tutorial.steps().indexOf(st) + 1;
      L.isle.push({ n, what: st.goal || st.tutor || st.event || '?', t });
      L.isle.sort((a, b) => a.n - b.n);
      L.isle.forEach((s, i) => { s.took = s.t - (i ? L.isle[i - 1].t : (L.isleStart || 0)); });
    });
    this.wrap(G.tutorial, 'finish', null, (res, [skipped]) => { S.log.isleEnd = { t: S.sinceLife(), skipped: !!skipped }; S.add('mark', skipped ? 'Isle skipped' : 'Isle done (ferry)'); });
    // Trips: start in a danger region, end walking out / campfire home / death / chute / boss
    this.wrap(G.world, 'startTrip', null, () => {
      if (S.log.trip) S.endTrip('?');
      S.log.trip = { start: S.sinceLife(), areas: [] };   // areas fill in as you cross (the region changes after this call)
      S.add('mark', 'trip started');
    });
    this.wrap(G.world, 'cross', null, () => {
      const tr = S.log.trip, id = G.world.state.region;
      if (tr && !G.world.safe(id) && !tr.areas.includes(id)) { tr.areas.push(id); S.add('mark', `entered ${S.regionName(id)}`); }
    });
    this.wrap(G.world, 'endTrip', (how) => S.endTrip(how || 'walk'));
    this.wrap(G.world, 'arriveHome', () => { if (S.log.trip) S.endTrip(S.lastLoss ? 'died' : 'home'); S.lastLoss = false; });
    // Deaths per area (a lost fight)
    if (typeof BattleScene !== 'undefined') this.wrap(BattleScene.prototype, 'endBattle', function (result) {
      if (this.over || result !== 'lose') return;
      const id = S.region(), name = S.regionName(id);
      S.log.deaths[name] = (S.log.deaths[name] || 0) + 1;
      S.lastLoss = true;
      if (S.log.trip && !S.log.trip.areas.includes(id)) S.log.trip.areas.push(id);
      S.add('death', `died in ${name}`);
    });
  },

  // ---------- The report (plain text, pasteable into a chat) ----------
  time(s) {
    if (s == null) return '-';
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  },
  report() {
    const L = this.log, T = t => this.time(t), D = this.D(), out = [];
    const ver = (document.querySelector('.foot') || {}).textContent || '';
    out.push('FOOPVILLE DEV STATS' + (ver.match(/v[\d.]+/) ? ' · ' + ver.match(/v[\d.]+/)[0] : ''));
    out.push('Times = play time since this life started (tab open + visible), m:ss.');
    out.push(L.life ? `Life: ${L.life.mode || '?'} mode, started ${L.life.date}` : 'Life: started before the stats panel existed (times count from page load).');
    out.push(`Now: ${T(this.sinceLife())}`);
    out.push('', '== ORIENTATION ISLE ==');
    if (L.isleStart == null) out.push('Not played this life.');
    else {
      out.push(`Isle start: ${T(L.isleStart)}`);
      for (const s of L.isle) out.push(`${String(s.n).padStart(2)}. ${T(s.t)} (+${T(s.took)})  ${s.what}`);
      out.push(L.isleEnd ? `Isle ${L.isleEnd.skipped ? 'SKIPPED' : 'done'}: ${T(L.isleEnd.t)}  (total ${T(L.isleEnd.t - L.isleStart)})` : 'Isle: still on it.');
    }
    const F = L.firsts;
    out.push('', '== FIRSTS ==');
    out.push(`First XP: ${T(F.xp)} · first level-up: ${F.firstLevel ? T(F.firstLevel.t) + ' (' + F.firstLevel.what + ')' : '-'}`);
    out.push(`First coins: ${T(F.coin)} · first drop: ${T(F.drop)} · first quest step: ${T(F.quest)}`);
    // Waits between rewards
    const rw = L.events.filter(e => this.isReward(e.kind));
    out.push('', '== TIME BETWEEN REWARDS ==');
    if (rw.length < 2) out.push('Not enough rewards yet.');
    else {
      const gaps = [];
      for (let i = 1; i < rw.length; i++) gaps.push({ g: rw[i].t - rw[i - 1].t, from: rw[i - 1], to: rw[i] });
      const avg = gaps.reduce((a, x) => a + x.g, 0) / gaps.length;
      out.push(`${rw.length} rewards · average wait ${T(avg)} · longest ${T(Math.max(...gaps.map(x => x.g)))}`);
      const by = {};
      for (const e of rw) by[e.kind] = (by[e.kind] || 0) + 1;
      out.push('Count: ' + Object.entries(by).map(([k, n]) => `${k} ${n}`).join(', '));
      for (const kind of ['level', 'drop', 'quest']) {
        const ks = rw.filter(e => e.kind === kind);
        if (ks.length > 1) out.push(`Average between ${kind}s: ${T((ks[ks.length - 1].t - ks[0].t) / (ks.length - 1))}`);
      }
      out.push('Longest waits:');
      for (const x of gaps.sort((a, b) => b.g - a.g).slice(0, D.longGapsShown)) out.push(`  ${T(x.g)}  at ${T(x.from.t)}: ${x.from.text} → ${x.to.text}`);
    }
    out.push('', '== TRIPS ==');
    if (!L.trips.length && !L.trip) out.push('None yet.');
    L.trips.forEach((tr, i) => out.push(`${i + 1}. at ${T(tr.start)}, lasted ${T(tr.len)}, ended: ${tr.how} · ${(tr.areas || []).map(a => this.regionName(a)).join(' → ') || '?'}`));
    if (L.trip) out.push(`(on a trip now: ${T(this.sinceLife() - L.trip.start)} so far)`);
    out.push('', '== DEATHS PER AREA ==');
    const ds = Object.entries(L.deaths);
    out.push(ds.length ? ds.map(([k, n]) => `${k}: ${n}`).join(' · ') : 'None.');
    out.push('', `== LAST ${D.recentShown} EVENTS ==`);
    for (const e of L.events.slice(-D.recentShown)) out.push(`${T(e.t)}  ${e.kind.padEnd(5)} ${e.text}`);
    return out.join('\n');
  },

  // ---------- The panel (a plain page overlay, not a Phaser screen) ----------
  build() {
    const c = FUP.look.palette, box = document.createElement('div');
    box.id = 'devStats';
    box.style.cssText = `position:fixed;inset:12px;z-index:9999;display:none;flex-direction:column;gap:8px;padding:12px;
      background:${c.k1};border:2px solid ${c.y1};border-radius:8px;color:${c.k4};font:13px/1.35 monospace;box-sizing:border-box;`;
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;';
    const title = document.createElement('b');
    title.textContent = '📊 Dev stats (only you can see this)';
    title.style.cssText = `flex:1;color:${c.y2};min-width:180px;`;
    bar.appendChild(title);
    const btn = (label, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = `font:13px monospace;padding:8px 12px;min-height:40px;background:${c.w2};color:${c.k4};border:1px solid ${c.w4};border-radius:6px;cursor:pointer;`;
      b.onclick = e => { e.stopPropagation(); fn(b); };
      bar.appendChild(b);
      return b;
    };
    btn('Copy', b => this.copy(b));
    btn('Refresh', () => this.refresh());
    btn('Clear', b => {
      if (b.dataset.sure) { this.log = { ...this.fresh(), play: this.log.play, life: this.log.life }; this.write(); this.refresh(); b.textContent = 'Clear'; delete b.dataset.sure; }
      else { b.textContent = 'Sure? Tap again'; b.dataset.sure = '1'; }
    });
    btn('Close', () => this.toggle(false));
    const text = document.createElement('textarea');
    text.readOnly = true;
    text.style.cssText = `flex:1;width:100%;resize:none;background:${c.k0};color:${c.k4};border:1px solid ${c.k2};border-radius:6px;padding:8px;font:12px/1.4 monospace;box-sizing:border-box;`;
    box.appendChild(bar); box.appendChild(text);
    // Keep taps / keys inside the panel away from the game
    for (const ev of ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'wheel']) box.addEventListener(ev, e => e.stopPropagation());
    document.body.appendChild(box);
    this.box = box; this.text = text;
  },
  refresh() { if (this.text) this.text.value = this.report(); },
  copy(b) {
    const t = this.report();
    this.text.value = t;
    this.text.focus(); this.text.select();
    const done = ok => { b.textContent = ok ? 'Copied ✓' : 'Selected: press Copy on your keyboard / menu'; setTimeout(() => { b.textContent = 'Copy'; }, 2500); };
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    if (ok) return done(true);
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => done(true), () => done(false));
    else done(false);
  },
  toggle(on = !this.open) {
    if (!this.box) this.build();
    this.open = on;
    this.box.style.display = on ? 'flex' : 'none';
    if (on) this.refresh();
  },

  // ---------- Start ----------
  init() {
    const D = this.D();
    if (!D || !D.enabled) return;
    this.log = this.read();
    this.hook();
    // Play-time clock + saving
    let last = Date.now(), sinceSave = 0;
    setInterval(() => {
      const t = Date.now(), dt = Math.min(1, (t - last) / 1000);   // cap: a sleeping laptop doesn't count
      last = t;
      if (document.hidden) return;
      this.log.play += dt;
      sinceSave += dt;
      if (sinceSave >= D.saveEvery) { sinceSave = 0; this.write(); }
    }, 250);
    window.addEventListener('pagehide', () => this.write());
    // Computer: the ` key (not while typing a name)
    window.addEventListener('keydown', e => {
      if (e.code !== D.key) return;
      const tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA/.test(tag) && !(this.box && this.box.contains(e.target))) return;
      e.preventDefault();
      this.toggle();
    }, true);
    // Phone: tap the top-left corner of the game a few times quickly
    let taps = [];
    window.addEventListener('pointerdown', e => {
      const g = document.querySelector('#game canvas') || document.getElementById('game');
      if (!g) return;
      const r = g.getBoundingClientRect();
      if (e.clientX - r.left > D.cornerSize || e.clientY - r.top > D.cornerSize || e.clientX < r.left || e.clientY < r.top) { taps = []; return; }
      const t = Date.now() / 1000;
      taps = taps.filter(x => t - x < D.cornerWindow).concat(t);
      if (taps.length >= D.cornerTaps) { taps = []; this.toggle(); }
    }, true);
  },
};
FUP.devStats.init();
