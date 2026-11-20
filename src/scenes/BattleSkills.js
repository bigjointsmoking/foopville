// ============================================================
// BATTLE SKILLS + ENEMY TRICKS (Refinement Phase 3, approved by Jesus 2026-11-09).
// Extra functions for BattleScene (same screen, split into its own file):
//   - weapon skills (data/weapons.js `skills`), unlocked by Melee level
//   - each enemy's signature trick (data/enemies.js `signature`): a tell, and a way to beat it
//   - Perfect Block and Riposte (data/balance.js `perfectBlock`)
//   - "big moments": a freeze, a camera punch and a banner when something great happens
// ============================================================
Object.assign(BattleScene.prototype, {

  // ---------- Big moments ----------
  // A short freeze, a camera punch-in, a shake and a banner across the fight.
  bigMoment(text, color) {
    const F = FUP.look.feel, cam = this.cameras.main;
    this.frozenFor = F.hitStopMs / 1000;
    FUP.fx.shake(this, 'big');
    cam.zoomTo(F.punchZoom, F.punchMs / 2, 'Quad.easeOut', true, (c, p) => { if (p === 1) cam.zoomTo(1, F.punchMs, 'Quad.easeIn', true); });
    if (!text) return;
    // Two big moments at once stack instead of overlapping
    const B = F.banner, y = 200 + 52 * (this.bannersUp || 0);
    this.bannersUp = (this.bannersUp || 0) + 1;
    this.time.delayedCall(B.holdMs + B.fadeMs, () => { this.bannersUp = Math.max(0, this.bannersUp - 1); });
    const t = FUP.ui.text(this, 450, y, text, B.size, color || FUP.ui.colors.crit, {
      fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 8, align: 'center',
    }).setOrigin(0.5).setDepth(480).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 30, delay: B.holdMs, duration: B.fadeMs, onComplete: () => t.destroy() });
  },

  // ---------- Weapon skills ----------
  // Your Special plus the weapon's extra skills, in unlock order.
  allSkills() {
    const w = this.weapon, sp = w.special;
    return [{ id: 'special', level: 1, name: sp.name, desc: sp.desc, special: true, focus: FUP.balance.focus.special }, ...(w.skills || [])];
  },
  skillKnown(s) { return FUP.skills.level('melee') >= s.level; },
  // Focus cost (v0.41): Practiced perk takes some off
  skillCost(s) { return Math.max(0, (s.focus || 0) - FUP.unlocks.perkSum('focusCut')); },
  skillReady(s) { return this.skillKnown(s) && this.player.focus >= this.skillCost(s) && (!s.eatBoost || this.satchel.length > 0); },
  addFocus(n) {
    const p = this.player, F = FUP.balance.focus;
    p.focus = Math.min(F.max, (p.focus || 0) + n);
  },

  useSkill(s) {
    if (!this.skillReady(s)) return;
    if (s.special) { this.withTarget(() => this.doSpecial()); return; }
    if (s.eatBoost) { this.setMenu('helping'); return; }   // Second Helping: pick the dish first
    const run = () => this.act(() => this.runSkill(s), { cat: 'skill', skillId: s.id });
    if (s.all || s.bounces || s.riposte || s.confuseChance) run(); else this.withTarget(run);   // single-target skills ask who
  },

  runSkill(s, dish) {
    const p = this.player, t = this.target(), C = FUP.combat;
    this.lunge(this.playerSprite, 1.4);
    this.moveCallout({ view: this.playerSprite }, s.name);
    FUP.audio.sfx('crit');
    const hit = (e, delay = 0, o = {}) => this.hitEnemy(e, s.power, delay, false, { kind: 'skill', ...o });
    if (s.all) this.live().forEach((e, i) => hit(e, i * 90));
    else if (s.bounces) {
      for (let i = 0; i < s.bounces; i++) {
        const pool = this.live();
        if (!pool.length) break;
        hit(pool[Math.floor(Math.random() * pool.length)], i * 170);
      }
    } else if (s.guardBreak) {
      const landed = hit(t, 0, { guardBreak: true });
      if (t && !t.gone && !t.fake) t.buffs = t.buffs.filter(b => b.label === 'Calm' || b.stat === 'taken');   // strips Velvet Rope, Fired up...
      if (s.stun && landed && t && !t.gone && !t.fake) { t.gauge = 0; this.popup(t.view, 'STUNNED', 'info', -40); }   // Guard Break: it loses its turn
      if (s.selfDebuff) { const d = s.selfDebuff; C.addBuff(p, d.stat, d.mult, d.turns, d.label, true); this.popup(this.playerSprite, d.label.toUpperCase(), 'bad', -40); }
      if (s.slowNext) { p.gauge = -s.slowNext; this.popup(this.playerSprite, 'SLOW RECOVERY', 'bad', -70); }
    } else if (s.riposte) {
      p.riposte = s.riposte;
      this.popup(this.playerSprite, 'RIPOSTE STANCE', 'info', -40);
    } else if (s.element) {
      // Sizzle Slam: a fire hit that burns, and the hot pan hurts you too (never below 1 HP)
      const cost = Math.max(1, Math.round(p.maxHp * s.selfCostPct));
      p.hp = Math.max(1, p.hp - cost);
      this.popup(this.playerSprite, '🔥 -' + cost, 'bad', -40);
      hit(t, 0, { element: s.element, burn: s.burn });
    } else if (s.push) {
      // Distraction: no damage. Its turn comes later, and your next Rizz is easier.
      if (t && !t.fake) { t.gauge -= s.push; this.popup(t.view, 'DISTRACTED', 'info'); }
      p.rizzNext = s.rizzNext;
    } else if (s.confuseChance) {
      // Chaos Squawk: some get confused, the rest get angry
      for (const e of this.liveReal()) {
        if (Math.random() < s.confuseChance) { e.confused = true; this.popup(e.view, 'CONFUSED', 'info', -40); }
        else { C.addBuff(e, 'atk', 1 + FUP.balance.enrageAtkBonus, FUP.balance.enrageTurns, 'Enraged'); this.popup(e.view, 'ENRAGED', 'bad', -40); }
      }
    } else if (s.eatBoost && dish) {
      this.eatDish(dish, s.eatBoost);
      hit(t, 300);
    } else hit(t);
    this.say('skill_' + s.id, { enemy: t ? t.name : 'enemy' });
  },

  // ---------- Guards: the Goblin's ledger and the Bouncer's Arms Crossed ----------
  // o.kind: 'attack' (plain Attack) | 'skill' | 'counter' | 'limit'. Returns { blocked, bounce, mult }.
  checkGuards(e, o) {
    // The Filing Frog's stamp: the next hit is blocked; a guard-break skill tears it off instead (Marsh, W2)
    if (e.stamped) {
      e.stamped = false;
      if (o.guardBreak) { this.bigMoment('STAMP TORN!'); this.say('stampTorn', { enemy: e.name }); }
      else {
        this.popup(e.view, '📄 APPROVED: BLOCKED', 'info');
        this.say('approvedBlock', { enemy: e.name });
        FUP.audio.sfx('guard');
        return { blocked: true };
      }
    }
    if (e.fake || o.kind === 'counter' || o.kind === 'limit') return { mult: 1 };
    // Phase D: Paper Moths dodge; after an Ink Splash your hits can miss
    const miss = (e.dodge || 0) + (this.inked > 0 ? this.inkMiss : 0);
    if (miss > 0 && Math.random() < miss) {
      this.popup(e.view, 'MISS', 'info');
      this.say(this.inked > 0 ? 'inkMiss' : 'mothDodge', { enemy: e.name });
      FUP.audio.sfx('error');
      return { blocked: true };
    }
    if (e.ledger) {
      e.ledger = false;
      if (o.kind === 'attack') {
        this.popup(e.view, '📒 BLOCKED', 'info');
        this.say('ledgerBlock', { enemy: e.name });
        FUP.audio.sfx('guard');
        return { blocked: true };
      }
      e.gauge = 0;   // a Skill rips it and stuns him
      this.questNews.push(...FUP.quests.event('ledger'));
      this.bigMoment('LEDGER RIPPED!');
      this.say('ledgerRip', { enemy: e.name });
    }
    if (e.stance) {
      if (o.guardBreak) {
        e.stance = false; e.gauge = 0;
        this.bigMoment('GUARD BROKEN!');
        this.say('guardBroken', { enemy: e.name });
        return { mult: e.signature.breakMult };
      }
      return { bounce: e.signature.bounceShare };
    }
    return { mult: 1 };
  },

  // How much damage this enemy really takes (the Godfather's bodyguard, Exposed).
  takenMult(e) {
    let m = 1;
    const sig = e.signature;
    if (sig && sig.id === 'bodyguard' && this.liveReal().some(o => o.bodyguard)) m *= sig.takenMult;
    for (const b of e.buffs) if (b.stat === 'taken') m *= b.mult;
    const SH = e.bossRules && e.bossRules.shelves;   // the Archivist hides behind his Filing Shelves (Phase D)
    if (SH && this.liveReal().some(o => o.key === SH.foe)) m *= SH.takenMult;
    return m;
  },

  // Every bit of damage an enemy takes goes through here (counts toward contesting the Last Warning).
  applyDamage(e, amount) {
    e.hp = Math.max(this.lesson ? 1 : 0, e.hp - amount);   // the lesson's dummy never falls over
    const n = e.notice;
    if (n && !e.fake) {
      n.dealt += amount;
      if (n.dealt >= n.need && e.hp > 0) {
        e.notice = null;
        e.gauge = e.bossRules.notice.contestGauge;
        this.bigMoment('NOTICE CONTESTED!', FUP.ui.colors.good);
        this.questNews.push(...FUP.quests.event('notice'));
        this.say('noticeContested');
        this.planMove(e);
      }
    }
  },

  // After an enemy loses HP: a squirrel drops the snack it stole.
  onEnemyHurt(e) {
    if (!e.stolen) return;
    this.satchel.push(e.stolen);
    this.popup(e.view, 'dropped ' + e.stolen.emoji, 'good', -40);
    e.stolen = null;
    this.bigMoment('SNACK SAVED!', FUP.ui.colors.good);
    this.say('snackSaved', { enemy: e.name });
    if (e.hp > 0) this.planMove(e);
    if (this.menuMode === 'main') this.setMenu('main');
  },

  // An enemy left the fight: break a formation, expose the Godfather, give back stolen food.
  onEnemyGone(e, how) {
    if (e.stolen) { this.satchel.push(e.stolen); e.stolen = null; }
    if (e.grabbed && how !== 'flee') {   // beat the Debt Runner before he ran: your coins come back (v0.93)
      FUP.run.coins += e.grabbed;
      this.popup(this.playerSprite, `+${e.grabbed} 🪙 back`, 'good', -40);
      this.say('runnerCaught', { item: e.grabbed });
      e.grabbed = 0;
    }
    if (how === 'flee' || this.over) return;
    if (e.formation && this.flock().length) {
      for (const o of this.flock()) o.gauge = 0;
      this.bigMoment('FORMATION BROKEN!', FUP.ui.colors.good);
      this.questNews.push(...FUP.quests.event('formation'));
      this.say('formationBroken');
    }
    if (e.bodyguard) {
      const g = this.liveReal().find(o => o.signature && o.signature.id === 'bodyguard');
      if (g) {
        FUP.combat.addBuff(g, 'taken', g.signature.exposedMult, g.signature.exposedTurns, 'Exposed');
        this.bigMoment('GODFATHER EXPOSED!', FUP.ui.colors.good);
        this.say('bodyguardDown');
      }
    }
  },

  flock() { return this.liveReal().filter(o => o.key === 'pigeon'); },

  // ---------- Enemy plans ----------
  // A signature move this enemy wants to use next, or null (then it picks a normal move).
  planSignature(e) {
    const sig = e.signature;
    if (!sig) return null;
    if (sig.id === 'hoarder' && e.stolen) return sig.eatMove;
    if (sig.id === 'runner' && e.grabbed) return sig.move;                          // the Debt Runner legs it (v0.93)
    if (sig.id === 'windup' && (e.movesDone + 1) % sig.every === 0) return sig.move;   // the Moss Bear's big swipe (v0.93)
    if (sig.id === 'bodyguard') {
      const family = this.liveReal().filter(o => o.key === e.summon.minion);
      if (family.length && !family.some(o => o.bodyguard)) return sig.move;
    }
    if (sig.id === 'formation' && e.key === 'pigeon') {
      const flock = this.flock();
      if (flock.length >= 2 && !flock.some(o => o.formation) && Math.random() < sig.chance) { e.formation = true; return sig.move; }
    }
    return null;
  },

  // Start of an enemy's turn: burning hurts, and last move's guard / audit ends. Returns false if it died.
  enemyTurnStart(e) {
    e.stance = false; e.ledger = false; e.audit = null;
    // The Mosquito Intern's Overtime: the last one standing hits harder (Marsh, W2)
    const sig = e.signature;
    if (sig && sig.id === 'overtime' && !e.overtime && this.startCount > 1 && this.liveReal().length === 1) {
      e.overtime = true;
      FUP.combat.addBuff(e, 'atk', sig.atkMult, 99, 'Overtime', true);
      this.bigMoment('OVERTIME!', FUP.ui.colors.bad);
      this.say('overtime', { enemy: e.name });
    }
    if (e.chewing && e.hp > 0) {   // the Archivist eating pages (Phase D)
      const heal = Math.min(e.maxHp - e.hp, Math.round(e.maxHp * e.chewing.pct));
      if (heal > 0) { e.hp += heal; this.popup(e.view, `+${heal} 📄`, 'good', -60); }
      if (--e.chewing.left <= 0) e.chewing = null;
    }
    if (e.burn) {
      const dmg = Math.max(1, Math.round(e.burn.dmg * this.takenMult(e)));
      this.applyDamage(e, dmg);
      this.popup(e.view, '🔥 ' + dmg, 'crit', -30);
      if (--e.burn.turns <= 0) e.burn = null;
      this.afterDamage(e);
      if (e.gone || this.over) return false;
    }
    return true;
  },

  // The signature move types. Returns true if it handled the move.
  actSignature(e, m) {
    const p = this.player;
    switch (m.type) {
      case 'stamp': {   // the Filing Frog stamps an ally (itself if it's alone): its next hit taken is blocked
        const pool = this.liveReal().filter(o => o !== e && !o.stamped);
        const t = pool.length ? pool[Math.floor(Math.random() * pool.length)] : e;
        t.stamped = true;
        this.popup(t.view, '📄 APPROVED', 'info', -40);
        this.say('approved', { enemy: t.name });
        FUP.audio.sfx('guard');
        return true;
      }
      case 'eatStolen': {
        const d = e.stolen;
        e.stolen = null;
        if (!d) return true;
        const heal = Math.min(e.maxHp - e.hp, d.heal || 0);
        e.hp += heal;
        if (heal) this.popup(e.view, '+' + heal, 'good');
        for (const b of d.buffs || []) FUP.combat.addBuff(e, b.stat, b.mult, b.turns, b.label, true);
        this.say('squirrelEats', { enemy: e.name, item: d.name });
        FUP.audio.sfx('eat');
        return true;
      }
      case 'ledger':
        e.ledger = true;
        this.popup(e.view, '📒 LEDGER UP', 'info');
        this.say('ledgerUp', { enemy: e.name });
        return true;
      case 'stance':
        e.stance = true;
        this.popup(e.view, '🚧 ARMS CROSSED', 'info');
        this.say('bouncerStance', { enemy: e.name });
        FUP.audio.sfx('guard');
        return true;
      case 'audit': {
        e.audit = this.lastAction || 'attack';
        this.popup(e.view, `📝 AUDITING: ${this.catName(e.audit).toUpperCase()}`, 'info');
        this.say('auditStart', { enemy: e.name, item: this.catName(e.audit) });
        return true;
      }
      case 'formation': {
        e.formation = false;
        const flock = this.flock();
        this.say('formationDive');
        flock.forEach((o, i) => this.time.delayedCall(i * 180, () => {
          if (this.over || o.gone) return;
          this.lunge(o.view, -1);
          this.strike(o, e.signature.divePower, false);
        }));
        return true;
      }
      case 'bodyguard': {
        const fam = this.liveReal().filter(o => o.key === e.summon.minion && !o.bodyguard);
        if (!fam.length) return true;
        const g = fam[Math.floor(Math.random() * fam.length)];
        g.bodyguard = true;
        this.popup(g.view, '🛡️ BODYGUARD', 'info');
        this.say('bodyguardAssign');
        return true;
      }
      case 'grab': {   // the Debt Runner: a light hit, and he pockets some of your coins (v0.93)
        const landed = this.strike(e, m.power, false);
        const take = landed && FUP.run.coins > 0 ? Math.max(1, Math.floor(FUP.run.coins * m.steal * (1 - (p.stealLess || 0)))) : 0;
        if (!this.over && take > 0) {
          FUP.run.coins -= take; e.grabbed = (e.grabbed || 0) + take;
          this.popup(this.playerSprite, `-${take} 🪙`, 'bad', -40);
          this.say('runnerGrab', { enemy: e.name, item: take });
          FUP.audio.sfx('coins');
        }
        return true;
      }
      case 'runAway': {   // he made it: gone, with your coins
        const lost = e.grabbed || 0;
        e.grabbed = 0;
        this.say('runnerGone', { enemy: e.name, item: lost });
        this.time.delayedCall(10, () => { if (!this.over && !e.gone) this.removeEnemy(e, 'flee'); });
        return true;
      }
      case 'allyBuff': {   // the Paralegal Newt: everyone else's DEF goes up (v0.93)
        const allies = this.liveReal().filter(o => o !== e);
        for (const o of allies) { FUP.combat.addBuff(o, m.stat, m.mult, m.turns, m.label, true); this.popup(o.view, m.label.toUpperCase(), 'info'); }
        this.say(allies.length ? 'newtSustain' : 'newtAlone', { enemy: e.name });
        FUP.audio.sfx('guard');
        return true;
      }
      // ---------- Phase D (v1.00) ----------
      case 'eatFocus': {   // the Bookworm: a light hit, and it eats some of your Focus
        const landed = this.strike(e, m.power, false);
        const take = landed ? Math.floor(p.focus * m.share) : 0;
        if (!this.over && take > 0) { p.focus -= take; this.popup(this.playerSprite, `-${take} Focus`, 'bad', -40); this.say('bookwormFocus', { enemy: e.name, item: take }); }
        return true;
      }
      case 'ink': {   // the Ink Slime: a hit, then your hits can miss for a few of your turns
        const landed = this.strike(e, m.power, false);
        if (landed && !this.over) { this.inked = m.turns; this.inkMiss = m.miss; this.popup(this.playerSprite, '🖋️ INKED', 'bad', -40); this.say('inkSplash', { enemy: e.name }); }
        return true;
      }
      case 'creak':   // a Filing Shelf just stands there, in the way
        this.popup(e.view, '🗄️ IN THE WAY', 'info');
        return true;
      case 'ban': {   // Redact (a random action) / Motion to Dismiss (the action you used last): blacked out for a few of your turns
        if (m.power) this.strike(e, m.power, false);
        if (this.over) return true;
        const all = ['attack', 'skill', 'defend', 'rizz', 'eat', 'throw'];
        let cat = m.pick === 'last' ? this.lastAction : all[Math.floor(Math.random() * all.length)];
        if (!all.includes(cat)) cat = 'attack';
        this.banned[cat] = Math.max(this.banned[cat] || 0, m.turns);
        this.popup(this.playerSprite, `⬛ ${this.catName(cat).toUpperCase()} BANNED`, 'bad', -70);
        this.say(m.pick === 'last' ? 'notaryMotion' : 'archivistRedact', { enemy: e.name, item: this.catName(cat) });
        if (this.menuMode === 'main') this.setMenu('main');
        return true;
      }
      case 'chew':   // the Archivist starts eating pages: it heals on its next few turns, unless you throw a dish at it
        e.chewing = { left: m.turns, pct: m.healPct };
        this.popup(e.view, '📄 EATING PAGES', 'info');
        this.say('archivistChew', { enemy: e.name });
        FUP.audio.sfx('eat');
        return true;
      case 'stampYou': {   // the Notary's STAMP: a hit that stuns you (your turn bar drops back)
        const landed = this.strike(e, m.power, false);
        if (landed && !this.over) { p.gauge = Math.min(p.gauge, m.stunGauge); this.popup(this.playerSprite, '🔨 STAMPED', 'bad', -70); this.bigMoment('STAMPED!', FUP.ui.colors.bad); this.say('notaryStamp', { enemy: e.name }); }
        return true;
      }
      case 'offer': this.openSettlement(e); return true;   // the Senior Partner (v0.93)
      case 'review':
        e.settled = Math.max(0, e.settled - 1);
        this.popup(e.view, '📑 PAPERWORK', 'info');
        this.say('partnerReview', { enemy: e.name });
        return true;
      case 'notice': {
        const N = e.bossRules.notice;
        e.noticeUsed[e.phase] = true;
        e.notice = { left: N.countdown, need: Math.round(e.maxHp * N.contestPct), dealt: 0 };
        this.bigMoment('📜 LAST WARNING', FUP.look.hex('p2'));
        this.say('noticeServe');
        return true;
      }
    }
    return false;
  },

  // End of the Guardian's turn: Strays share spores (heal it), the Last Warning counts down.
  bossTurnEnd(e, m) {
    const strays = this.liveReal().filter(o => o.signature && o.signature.id === 'share');
    if (strays.length && e.hp > 0) {
      const heal = Math.min(e.maxHp - e.hp, Math.round(e.maxHp * strays[0].signature.healPct * strays.length));
      if (heal > 0) { e.hp += heal; this.popup(e.view, `+${heal} 🍄 shared`, 'good', -60); }
    }
    if (m.slam) e.notice = null;
    else if (e.notice && m.type !== 'notice') e.notice.left--;
    // The Senior Partner's Billable Hours: every turn in phase 1, his hits grow (and stay grown)
    const BH = e.bossRules.billable;
    if (BH && e.phase === BH.phase && m.type !== 'review') e.billable = Math.min(BH.max, (e.billable || 0) + BH.perTurn);
  },

  // ---------- v0.93: after one of your hits lands ----------
  // The Grumpy Hedgehog's spikes (unless you Defended last), and The Retainer (heal a share of what you dealt).
  afterHitLanded(e, amount, kind) {
    const p = this.player;
    if (e.signature && e.signature.id === 'spikes' && (kind === 'attack' || kind === 'skill') && this.lastAction !== 'defend' && !this.over) {
      const back = Math.max(1, Math.round(amount * e.signature.share));
      this.time.delayedCall(150, () => { if (!this.over) { this.hurtPlayer({ amount: back, crit: false }, false, '🦔 '); this.say('spikes', { enemy: e.name }); } });
    }
    const rt = (p.effects || []).includes('retainer') && FUP.gearData.effects.retainer;
    if (rt && kind !== 'counter' && p.hp < p.maxHp) {
      const heal = Math.min(p.maxHp - p.hp, Math.max(1, Math.round(amount * rt.share)));
      p.hp += heal;
      this.popup(this.playerSprite, '+' + heal, 'good', -60);
    }
  },

  // ---------- The Senior Partner's Settlement Offer (v0.93): time stops while you decide ----------
  openSettlement(e) {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 480, ST = e.bossRules.settlement;
    const price = Math.min(FUP.run.coins, Math.max(ST.min, Math.ceil(FUP.run.coins * ST.share)));
    if (price <= 0) return;
    const g = [];
    const close = () => { g.forEach(o => o.destroy()); this.offerCard = null; };
    this.offerCard = { close };
    g.push(ui.shade(this, 0.55).setDepth(Z));
    g.push(ui.panel(this, W / 2 - 240, H / 2 - 110, 480, 220, 'panel').setDepth(Z + 1));
    g.push(ui.text(this, W / 2, H / 2 - 92, '🤝 SETTLEMENT OFFER', 22, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0).setDepth(Z + 2));
    g.push(ui.text(this, W / 2, H / 2 - 54, `"Pay ${price} 🪙 and I stop hitting you for ${ST.turns} of my turns. Nobody has to know."`, 15, c.ink, { fontStyle: 'italic', align: 'center', wordWrap: { width: 430 } }).setOrigin(0.5, 0).setDepth(Z + 2));
    const btn = (x, label, fn, hot) => { const b = ui.button(this, x, H / 2 + 40, 200, 44, label, fn, { size: 15, hot }); b.rect.setDepth(Z + 2); b.txt.setDepth(Z + 3); g.push(b.rect, b.txt); };
    btn(W / 2 - 215, `Pay ${price} 🪙`, () => {
      close();
      FUP.run.coins -= price; e.settled = ST.turns;
      this.popup(this.playerSprite, `-${price} 🪙`, 'bad', -40);
      FUP.audio.sfx('coins');
      this.say('partnerSettled', { item: price });
      this.planMove(e);
    }, false);
    btn(W / 2 + 15, 'Refuse', () => { close(); this.say('partnerRefused'); FUP.audio.sfx('click'); }, true);
  },

  // An enemy hit on you. Riposte and Perfect Block can turn it around. Returns true if it landed.
  strike(e, power, heavy, slam = false, counterMult = 1) {
    const p = this.player, PB = FUP.balance.perfectBlock;
    if (slam) e.notice = null;   // the notice is used up (a counter-hit now doesn't "contest" it)
    if (p.riposte) {
      const mult = p.riposte;
      p.riposte = 0;
      this.bigMoment('RIPOSTE!');
      this.say('riposte', { enemy: e.name });
      FUP.audio.sfx('guard');
      this.hitEnemy(e, mult, 150, false, { kind: 'counter' });
      return false;
    }
    if (p.defending && (power >= PB.minPower || slam)) {
      this.bigMoment('PERFECT BLOCK!');
      this.questNews.push(...FUP.quests.event('perfectBlock'));
      this.popup(this.playerSprite, 'BLOCKED', 'good');
      this.say('perfectBlock', { enemy: e.name });
      FUP.audio.sfx('guard');
      this.addLimit(PB.limit);
      this.addFocus(FUP.balance.focus.perBlock);
      if (counterMult > 1) this.say('bearCounter', { enemy: e.name });   // the Moss Bear's big swipe, turned around (v0.93)
      this.hitEnemy(e, FUP.unlocks.perkBest('perfectCounter', PB.counterPower) * counterMult, 150, false, { kind: 'counter' });   // Unshaken perk
      return false;
    }
    if ((p.effects || []).includes('approval') && !this.approvalUsed) {   // Stamp of Approval (Phase D): the first hit each fight
      this.approvalUsed = true;
      this.popup(this.playerSprite, '✅ APPROVED: BLOCKED', 'good');
      this.say('approvalBlock', { enemy: e.name });
      FUP.audio.sfx('guard');
      return false;
    }
    const dealt = FUP.combat.damage(e, p, power);
    this.hurtPlayer(dealt, heavy || slam);
    // Spore Cloak (the Mycelium Mantle, G2): whoever hits you takes a share back. Never kills a boss.
    const th = (p.effects || []).includes('thorns') && FUP.gearData.effects.thorns;
    if (th && !this.over && e.hp > 0 && !e.gone) {
      let back = Math.max(1, Math.round(dealt.amount * th.share));
      if (e.boss) back = Math.min(back, e.hp - 1);
      if (back > 0) {
        this.applyDamage(e, back);
        this.popup(e.view, '🍄 ' + back, 'info', -20);
        this.afterDamage(e);
      }
    }
    // The Leech Lawyer's Billable Hours: heals part of what it dealt, unless you Defended (Marsh, W2)
    if (e.signature && e.signature.id === 'billable' && !p.defending && e.hp > 0) {
      const heal = Math.min(e.maxHp - e.hp, Math.round(dealt.amount * e.signature.healShare));
      if (heal > 0) { e.hp += heal; this.popup(e.view, '+' + heal + ' BILLED', 'good', -40); this.say('billable', { enemy: e.name }); }
    }
    if ((heavy || slam) && !this.over) { this.frozenFor = FUP.look.feel.hitStopMs / 1000; }
    return true;
  },

  // ---------- The Mold Accountant's audit ----------
  catName(cat) { return { attack: 'Attack', skill: 'Skill', throw: 'Throw', eat: 'Eat', rizz: 'Rizz', defend: 'Defend', flee: 'Flee', limit: 'Limit Break' }[cat] || cat; },
  // Is any living enemy auditing this kind of action?
  deductFor(cat) {
    const a = this.liveReal().find(o => o.audit && o.audit === cat);
    return a ? a.signature.deductMult : 1;
  },

  // ---------- Labels ----------
  // Little status words after an enemy's name.
  enemyFlags(e) {
    const f = [];
    if (e.stance) f.push('🚧 ARMS CROSSED');
    if (e.stamped) f.push('📄 STAMPED');
    if (e.overtime) f.push('⏰ OVERTIME');
    if (e.ledger) f.push('📒 ledger up');
    if (e.audit) f.push(`📝 auditing ${this.catName(e.audit)}`);
    if (e.bodyguard) f.push('🛡️ bodyguard');
    if (e.stolen) f.push(`🎒 has your ${e.stolen.name}`);
    if (e.burn) f.push('🔥');
    if (e.formation) f.push('📣');
    if (e.grabbed) f.push(`🪙 has ${e.grabbed} of yours`);
    if (e.billable) f.push(`💼 +${Math.round(e.billable * 100)}%`);
    if (e.settled) f.push('📑 settled');
    if (e.chewing) f.push('📄 eating pages');
    if (e.dodge) f.push('🦋 dodgy');
    const SH = e.bossRules && e.bossRules.shelves;
    if (SH && this.liveReal().some(o => o.key === SH.foe)) f.push('🗄️ behind shelves');
    if (e.signature && e.signature.id === 'share' && this.boss()) f.push('💸');
    return f.join(' ');
  },
  noticeText(b) {
    const n = b && b.notice;
    return n ? `📜 LAST WARNING: DOOR SLAM in ${n.left} · break it: ${Math.min(n.dealt, n.need)}/${n.need} damage` : '';
  },
});
