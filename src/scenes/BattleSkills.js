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
    return m;
  },

  // Every bit of damage an enemy takes goes through here (counts toward contesting the Final Notice).
  applyDamage(e, amount) {
    e.hp = Math.max(0, e.hp - amount);
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
      case 'notice': {
        const N = e.bossRules.notice;
        e.noticeUsed[e.phase] = true;
        e.notice = { left: N.countdown, need: Math.round(e.maxHp * N.contestPct), dealt: 0 };
        this.bigMoment('📜 FINAL NOTICE', FUP.look.hex('p2'));
        this.say('noticeServe');
        return true;
      }
    }
    return false;
  },

  // End of the Landlord's turn: Tenants pay rent (heal him), the Final Notice counts down.
  bossTurnEnd(e, m) {
    const tenants = this.liveReal().filter(o => o.signature && o.signature.id === 'rent');
    if (tenants.length && e.hp > 0) {
      const heal = Math.min(e.maxHp - e.hp, Math.round(e.maxHp * tenants[0].signature.healPct * tenants.length));
      if (heal > 0) { e.hp += heal; this.popup(e.view, `+${heal} 💸 rent`, 'good', -60); }
    }
    if (m.eviction) e.notice = null;
    else if (e.notice && m.type !== 'notice') e.notice.left--;
  },

  // An enemy hit on you. Riposte and Perfect Block can turn it around. Returns true if it landed.
  strike(e, power, heavy, eviction = false) {
    const p = this.player, PB = FUP.balance.perfectBlock;
    if (eviction) e.notice = null;   // the notice is used up (a counter-hit now doesn't "contest" it)
    if (p.riposte) {
      const mult = p.riposte;
      p.riposte = 0;
      this.bigMoment('RIPOSTE!');
      this.say('riposte', { enemy: e.name });
      FUP.audio.sfx('guard');
      this.hitEnemy(e, mult, 150, false, { kind: 'counter' });
      return false;
    }
    if (p.defending && (power >= PB.minPower || eviction)) {
      this.bigMoment('PERFECT BLOCK!');
      this.questNews.push(...FUP.quests.event('perfectBlock'));
      this.popup(this.playerSprite, 'BLOCKED', 'good');
      this.say('perfectBlock', { enemy: e.name });
      FUP.audio.sfx('guard');
      this.addLimit(PB.limit);
      this.addFocus(FUP.balance.focus.perBlock);
      this.hitEnemy(e, FUP.unlocks.perkBest('perfectCounter', PB.counterPower), 150, false, { kind: 'counter' });   // Unshaken perk
      return false;
    }
    const dealt = FUP.combat.damage(e, p, power);
    this.hurtPlayer(dealt, heavy || eviction);
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
    if ((heavy || eviction) && !this.over) { this.frozenFor = FUP.look.feel.hitStopMs / 1000; }
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
    if (e.signature && e.signature.id === 'rent' && this.boss()) f.push('💸');
    return f.join(' ');
  },
  noticeText(b) {
    const n = b && b.notice;
    return n ? `📜 FINAL NOTICE: EVICTION in ${n.left} · contest it: ${Math.min(n.dealt, n.need)}/${n.need} damage` : '';
  },
});
