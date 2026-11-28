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
    const ranged = FUP.run.hasSling() ? FUP.rangedData.skills : [];   // v1.01: ranged skills with a slingshot on (data/ranged.js)
    return [{ id: 'special', level: 1, name: sp.name, desc: sp.desc, special: true, focus: FUP.balance.focus.special }, ...(w.skills || []), ...ranged];
  },
  skillKnown(s) { return FUP.skills.level(s.ranged ? 'ranged' : 'melee') >= s.level; },
  // Focus cost (v0.41): Practiced perk takes some off
  skillCost(s) { return Math.max(0, (s.focus || 0) - FUP.unlocks.perkSum('focusCut')); },
  skillReady(s) { return this.skillKnown(s) && this.player.focus >= this.skillCost(s) && (!s.eatBoost || this.satchel.length > 0) && (!s.ranged || !!this.skillAmmo(s)); },
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

  // A ranged skill (v1.01): Ranged ATK + ammo, no row penalty, no Focus from its shots
  runRangedSkill(s) {
    const t = this.target(), id = this.skillAmmo(s);
    if (!t || !id || !FUP.run.useAmmo(id, s.ammoCost || 1)) return;
    this.moveCallout({ view: this.playerSprite }, s.name);
    for (let i = 0; i < (s.hits || 1); i++) this.time.delayedCall(i * 200, () => { if (!t.gone && !this.over) this.shootAt(t, id, s.power, { skill: true, ignoreDef: s.ignoreDef }); });
    if (s.push && !t.fake) { t.gauge -= s.push; this.popup(t.view, 'PINNED', 'info', -40); }   // Pin Down: its next turn comes later
  },

  runSkill(s, dish) {
    if (s.ranged) { this.runRangedSkill(s); return; }
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
        if (Math.random() < s.confuseChance * (e.boss ? FUP.balance.bossConfuse.chanceMult : 1)) { e.confused = true; this.popup(e.view, 'CONFUSED', 'info', -40); }
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
    // (v1.31) Old Whitepaw in the snow / (v1.39) the Causeway Serpent under the water: nothing to hit
    if (e.hidden) {
      const VL = (e.signature && e.signature.lines) || {};
      this.popup(e.view, `${(e.signature && e.signature.icon) || '❄️'} NOT THERE`, 'info');
      if (!this.saidHidden) { this.saidHidden = true; this.say(VL.gone || 'whitepawGone', { enemy: e.name }); }
      return { blocked: true };
    }
    // (v1.22) Gurrow's gate, shut: nothing gets through until his next move
    if (e.gateShut) {
      this.popup(e.view, '🚪 BLOCKED', 'info');
      if (!this.saidGate) { this.saidGate = true; this.say('gateBlocked', { enemy: e.name }); }
      FUP.audio.sfx('guard');
      return { blocked: true };
    }
    if (e.fake || o.kind === 'counter' || o.kind === 'limit') return { mult: 1 };
    // (v1.22) Brannock's stone: plain Attacks bounce off it (not while he's lifting it, or chasing it)
    const BS = e.signature && e.signature.id === 'boulder' ? e.signature : null;
    if (BS && o.kind === 'attack' && !e.lifted && !(e.rolling > 0)) {
      this.popup(e.view, '🪨 BOUNCES', 'info');
      if (!this.saidStone) { this.saidStone = true; this.say('stoneBounce', { enemy: e.name }); }
      return { mult: BS.attackMult };
    }
    // Phase D: Paper Moths dodge; after an Ink Splash your hits can miss
    const miss = (e.dodge || 0) * (o.ranged ? FUP.rangedData.dodgeMult : 1) + (this.inked > 0 ? this.inkMiss : 0);   // shots: moths dodge half as often (Jesus, v1.01)
    if (miss > 0 && Math.random() < miss) {
      this.popup(e.view, 'MISS', 'info');
      this.say(this.inked > 0 ? 'inkMiss' : 'mothDodge', { enemy: e.name });
      FUP.audio.sfx('error');
      return { blocked: true };
    }
    if (e.ledger) {
      e.ledger = false;
      if (o.kind === 'attack' || o.kind === 'shot') {   // a plain shot bounces off the ledger like a plain Attack (v1.01)
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
    if (sig && sig.id === 'escorted' && this.liveReal().some(o => o.key === sig.guards)) m *= sig.takenMult;   // (v1.45) Brask, while a House Bruiser stands
    if (sig && sig.id === 'scrapShield' && e.shieldUp) m *= sig.takenMult;   // (v1.19) the Scrap Goblin hides behind scrap
    if (sig && sig.id === 'shell' && !e.cracked) m *= sig.takenMult;         // (v1.19) the Rubble Crab's shell, until it cracks
    if (sig && sig.id === 'tuck' && e.tucked) m *= sig.takenMult;            // (v1.41) Old Mossback, pulled into its shell
    if (sig && sig.id === 'test' && e.passed) m *= 1 + sig.weakTaken * e.passed;   // (v1.42) the Shrine Keeper
    if (sig && sig.id === 'shieldwall' && !e.shielding && this.liveReal().some(o => o !== e && o.shielding)) m *= sig.takenMult;   // (v1.43) a Store Sentry behind another's shield   // (v1.42) the Shrine Keeper, weaker for every blow you guarded
    if (sig && sig.id === 'boulder' && e.lifted) m *= sig.liftedMult;        // (v1.22) Brannock with his stone overhead
    if (sig && sig.id === 'hum' && e.staggered) m *= sig.staggerMult;        // (v1.24) Dunn off balance after you Defended his swing
    if (sig && sig.id === 'plates' && !this.platesOpen(e)) m *= sig.takenMult; // (v1.27) Jarvin behind his stone plates
    if (sig && sig.id === 'swoop' && e.landed) m *= sig.landedMult;
    if (sig && sig.id === 'vanish' && e.stunnedOpen) m *= sig.openMult;      // (v1.31) Old Whitepaw, stunned after you Defended its pounce           // (v1.29) the Highland Eagle on the ground after its dive
    for (const b of e.buffs) if (b.stat === 'taken') m *= b.mult;
    const SH = e.bossRules && e.bossRules.shelves;   // the Archivist hides behind his Filing Shelves (Phase D)
    if (SH && this.liveReal().some(o => o.key === SH.foe)) m *= SH.takenMult;
    return m;
  },

  // Every bit of damage an enemy takes goes through here (counts toward contesting the Last Warning).
  applyDamage(e, amount, kind = 'melee') {
    const before = e.hp;
    e.hp = Math.max(this.lesson ? 1 : 0, e.hp - amount);   // the lesson's dummy never falls over
    e.dmgBy = e.dmgBy || { melee: 0, ranged: 0 };            // v1.01: who hurt it (its XP is split by this)
    e.dmgBy[kind] += before - e.hp;
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
    // (v1.45) the last House Bruiser is down: Brask is open
    const boss = this.liveReal().find(o => o.signature && o.signature.id === 'escorted' && o.signature.guards === e.key);
    if (boss && !this.liveReal().some(o => o !== e && o.key === e.key)) { this.bigMoment('BRASK IS OPEN!', FUP.ui.colors.good); this.say('braskOpen'); }
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

  // (v1.19) Ruin Rats' Pack Bite: each other rat still standing makes this one's hits `per` harder
  packMult(e) {
    const sig = e.signature;
    if (!sig || sig.id !== 'pack') return 1;
    return 1 + sig.per * this.liveReal().filter(o => o !== e && o.key === e.key).length;
  },
  // (v1.22) Old Carrow's mark: each of his hits while you're marked is perStep harder than the last
  markMult(e) {
    const sig = e.signature;
    if (!sig || sig.id !== 'mark' || !this.marked) return 1;
    return 1 + sig.perStep * (this.marked - 1);
  },
  // (v1.27) Jarvin's plates are open from the crack until he has packed them back on
  platesOpen(e) { return e.platesUntil != null && (e.movesDone < e.platesUntil || !!e.resetNext); },
  // (v1.19) The Rubble Crab's shell cracks on a Skill or a critical hit (then it takes normal damage)
  // (v1.27) Jarvin's plates the same way, but they only stay open for `openMoves` of his moves
  crackShell(e, kind, crit) {
    const sig = e.signature;
    if (this.latched && this.latched.by === e) { this.latched = null; this.popup(this.playerSprite, '🦡 SHAKEN OFF', 'good', -60); this.say('latchFree', { enemy: e.name }); }   // (v1.29) any hit on the Frost Wolverine
    if (sig && sig.id === 'plates') {
      if (this.platesOpen(e)) return;
      if (kind === 'skill' || crit) {
        e.platesUntil = e.movesDone + sig.openMoves; e.resetNext = false;
        this.bigMoment('PLATES CRACKED!', FUP.ui.colors.good);
        this.say('platesCracked', { enemy: e.name });
      } else if (!this.saidShell) { this.saidShell = true; this.time.delayedCall(450, () => { if (!this.over) this.say('platesTough', { enemy: e.name }); }); }
      return;
    }
    if (!sig || sig.id !== 'shell' || e.cracked) return;
    if (kind === 'skill' || crit) {
      e.cracked = true;
      this.bigMoment('SHELL CRACKED!', FUP.ui.colors.good);
      this.say('shellCracked', { enemy: e.name });
    } else if (!this.saidShell) { this.saidShell = true; this.time.delayedCall(450, () => { if (!this.over) this.say('shellTough', { enemy: e.name }); }); }
  },

  // ---------- Enemy plans ----------
  // A signature move this enemy wants to use next, or null (then it picks a normal move).
  planSignature(e) {
    const sig = e.signature;
    if (!sig) return null;
    if (sig.id === 'hoarder' && e.stolen) return sig.eatMove;
    if (sig.id === 'scrapShield') {   // (v1.19) shield up every `every` moves, then throw it the move after
      if (e.throwNext) { e.throwNext = false; return sig.throwMove; }
      if ((e.movesDone + 1) % sig.every === 0) return sig.shieldMove;
    }
    if (sig.id === 'gate' && e.movesDone % 2 === 0) return sig.shutMove;    // (v1.22) Gurrow: shut, open, shut...
    if (sig.id === 'boulder') {   // (v1.22) Brannock: chasing his stone / throwing it / lifting it every `every` moves
      if (e.rolling > 0) return sig.chaseMove;
      if (e.throwNext) { e.throwNext = false; return sig.throwMove; }
      if ((e.movesDone + 1) % sig.every === 0) return sig.liftMove;
    }
    if (sig.id === 'hum') {   // (v1.24) Dunn: the staff hums every `every` moves, then he swings
      if (e.swingNext) { e.swingNext = false; return sig.swingMove; }
      if ((e.movesDone + 1) % sig.every === 0) return sig.humMove;
    }
    if (sig.id === 'buildup') {   // (v1.44) the store's guardian: each stage below `stages` adds a trick, used every `every` moves
      const stage = sig.stages.filter(t => e.hp / e.maxHp < t).length;
      if (stage > (e.buildStage || 0)) { e.buildStage = stage; this.bigMoment(stage === 1 ? 'IT PUSHES BACK' : 'THE SPELL STIRS', FUP.ui.colors.bad); this.say('wardenStage' + stage, { enemy: e.name }); }
      if ((e.movesDone + 1) % sig.every === 0 && stage >= 1) return stage >= 2 && (e.tricksDone || 0) % 2 === 1 ? sig.scareMove : sig.pushMove;   // last stage: push, scare, push, scare...
    }
    if (sig.id === 'shieldwall' && !e.shielding && !this.liveReal().some(o => o.shielding)) return sig.move;   // (v1.43) nobody's shielding: this one raises its shield
    if (sig.id === 'test') {   // (v1.42) the Shrine Keeper: it announces a big blow a turn ahead, then lands it
      if (e.blowNext) return sig.blowMove;
      if ((e.movesDone + 1) % sig.every === 0) return sig.warnMove;
    }
    if (sig.id === 'tuck') {   // (v1.41) Old Mossback: into its shell every `every` moves, then out with the big snap
      if (e.tucked) return sig.snapMove;
      if ((e.movesDone + 1) % sig.every === 0) return sig.tuckMove;
    }
    if (sig.id === 'glow') {   // (v1.40) Old Cinderback: glows up as it's hurt (its next move is the white-hot swipe); at its brightest, every `hotEvery`
      const stage = sig.stages.filter(t => e.hp / e.maxHp < t).length;
      if (e.glowStage && e.pic && e.pic.setTint) e.pic.setTint(Phaser.Display.Color.HexStringToColor(sig.tints[e.glowStage - 1]).color);   // a hit flash may have cleared it
      if (stage > (e.glowStage || 0)) {
        e.glowStage = stage;
        if (e.pic && e.pic.setTint) e.pic.setTint(Phaser.Display.Color.HexStringToColor(sig.tints[stage - 1]).color);
        this.bigMoment(stage === sig.stages.length ? 'WHITE-HOT!' : 'GLOWING!', FUP.ui.colors.bad);
        this.say(stage === sig.stages.length ? 'cinderHot' : 'cinderGlow', { enemy: e.name });
        return sig.move;
      }
      if (stage === sig.stages.length && (e.movesDone + 1) % sig.hotEvery === 0) return sig.move;
    }
    if (sig.id === 'vanish') {   // (v1.31) Old Whitepaw: vanish every `every` moves (more often when hurt), then pounce
      if (e.pounceNext) return sig.pounceMove;
      if (e.noSinkNext) { e.noSinkNext = false; return null; }   // (v1.39) forced up by a dish: one normal move first
      const every = sig.everyByPhase ? sig.everyByPhase[Math.min(e.phase || 0, sig.everyByPhase.length - 1)]   // (v1.39) the Serpent: sinks more often each phase
        : e.hp / e.maxHp < sig.lowBelow ? sig.everyLow : sig.every;
      if ((e.movesDone + 1) % every === 0) return sig.vanishMove;
    }
    if (['headbutt', 'latch', 'swoop'].includes(sig.id) && (e.movesDone + 1) % sig.every === 0 && !(sig.id === 'latch' && this.latched)) return sig.move;   // (v1.29) the High Snows' animals
    if (sig.id === 'plates') {   // (v1.27) Jarvin: plates back on once his open moves are used up; the Quarry Slam every `slamEvery`
      if (e.platesUntil != null && !e.resetNext && e.movesDone >= e.platesUntil) { e.resetNext = true; return sig.resetMove; }
      if ((e.movesDone + 1) % sig.slamEvery === 0) return sig.slamMove;
    }
    if (sig.id === 'mark' && !this.marked && e.movesDone % sig.every === 0) return sig.markMove;   // (v1.22) Old Carrow
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
    e.stance = false; e.ledger = false; e.audit = null; e.shieldUp = false; e.gateShut = false; e.staggered = false; e.landed = false; e.stunnedOpen = false;   // (v1.24) Dunn finds his feet   // (v1.22) Gurrow's gate swings open   // (v1.19) the Scrap Goblin's shield lasts until its next move
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
      case 'scrapShield':   // (v1.19) the Scrap Goblin: hits do half until its next move, which throws the scrap
        e.shieldUp = true; e.throwNext = true;
        this.popup(e.view, '🛡️ SCRAP SHIELD', 'info');
        this.say('scrapShieldUp', { enemy: e.name });
        FUP.audio.sfx('guard');
        return true;
      case 'gateShut':   // (v1.22) Gurrow: blocks every hit until his next move
        e.gateShut = true;
        this.popup(e.view, '🚪 GATE SHUT', 'info');
        this.say('gateShut', { enemy: e.name });
        FUP.audio.sfx('guard');
        return true;
      case 'liftStone':   // (v1.22) Brannock: wide open until the throw
        e.lifted = true; e.throwNext = true;
        this.popup(e.view, '🪨 STONE UP', 'info');
        this.say('stoneLifted', { enemy: e.name });
        return true;
      case 'stoneThrow': {   // Defend it and the stone rolls away downhill; he follows it
        const guarded = p.defending;
        e.lifted = false;
        this.strike(e, m.power, true);
        if (guarded && !this.over && !e.gone) {
          e.rolling = e.signature.rollMoves;
          this.bigMoment('IT ROLLS AWAY!', FUP.ui.colors.good);
          this.say('stoneRolls', { enemy: e.name });
        }
        return true;
      }
      case 'chaseStone':
        e.rolling = Math.max(0, (e.rolling || 0) - 1);
        this.popup(e.view, e.rolling ? '🏃 STILL CHASING' : '🪨 GOT IT BACK', 'info');
        if (e.rolling) this.say('stoneChase', { enemy: e.name });
        return true;
      case 'staffHum':   // (v1.24) the staff you carry warns you: his next move is the big swing
        e.swingNext = true;
        this.popup(this.playerSprite, '🎶 THE STAFF HUMS', 'info', -40);
        this.say('staffHumWarn', { enemy: e.name });
        FUP.audio.sfx('staffHum');
        return true;
      case 'shovelSwing': {   // Defend it and he's off balance until his next move
        const guarded = this.player.defending;
        this.strike(e, m.power, true);
        if (guarded && !this.over && !e.gone) {
          e.staggered = true;
          this.bigMoment('OFF BALANCE!', FUP.ui.colors.good);
          this.say('dunnStagger', { enemy: e.name });
        }
        return true;
      }
      case 'pushBack': {   // (v1.44) the store's guardian pushes you back: your next hit does half
        e.tricksDone = (e.tricksDone || 0) + 1;
        const landed = this.strike(e, m.power, false);
        if (landed !== false && !this.over) { p.pushedBack = true; this.popup(this.playerSprite, '🌀 PUSHED BACK', 'bad', -70); this.say('wardenPush', { enemy: e.name }); }
        return true;
      }
      case 'scare': {   // (v1.44) ...and in its last stage, the repelling spell: you lose a turn unless you Defend
        e.tricksDone = (e.tricksDone || 0) + 1;
        if (p.defending) { this.popup(this.playerSprite, 'HELD FIRM', 'good', -70); this.say('wardenScareHeld', { enemy: e.name }); return true; }
        this.strike(e, m.power, false);
        if (!this.over) { p.gauge = Math.min(p.gauge, m.stunGauge); this.popup(this.playerSprite, '😨 SCARED', 'bad', -70); this.say('wardenScare', { enemy: e.name }); }
        return true;
      }
      case 'raiseShield':   // (v1.43) a Store Sentry raises its iron shield: the other sentries take less until it's beaten
        e.shielding = true;
        for (const o of this.liveReal()) if (o !== e && o.nextMove && o.nextMove.type === 'raiseShield') this.planMove(o);   // only one shield at a time: the others think again
        this.popup(e.view, '🛡️ SHIELD UP', 'info');
        this.say('sentryShield', { enemy: e.name });
        return true;
      case 'warn':   // (v1.42) the Shrine Keeper raises its arm: the blow comes next turn
        e.blowNext = true;
        this.popup(e.view, '✋ WARNING', 'info');
        this.say('keeperWarn', { enemy: e.name });
        return true;
      case 'testBlow': {   // ...and lands it. Guarded: it nods and gets weaker. Not guarded: a very hard hit
        const guarded = p.defending, S = e.signature;
        e.blowNext = false;
        this.strike(e, m.power, true);
        if (this.over || e.gone) return true;
        if (guarded) {
          e.passed = (e.passed || 0) + 1;   // (not e.weak: that's its element weakness)
          e.atk = Math.max(1, Math.round(e.atk * S.weakAtk));
          this.bigMoment('IT NODS', FUP.ui.colors.good);
          this.say('keeperNod', { enemy: e.name });
        } else this.say('keeperNoNod', { enemy: e.name });
        return true;
      }
      case 'tuck':   // (v1.41) Old Mossback pulls into its shell: you hit a rock until it snaps
        e.tucked = true;
        this.popup(e.view, e.signature.popup || '🐢 SHELL', 'info');
        this.say((e.signature.lines || {}).tuck || 'mossbackTuck', { enemy: e.name });   // (v1.46) the Crag Lizard has its own
        return true;
      case 'snap': {   // ...and comes out with the big bite. Defend it: Perfect Block + counter
        e.tucked = false;
        this.say((e.signature.lines || {}).snap || 'mossbackSnap', { enemy: e.name });
        this.strike(e, m.power, true, false, m.counterMult || 1);
        return true;
      }
      case 'vanish': {   // (v1.31) Old Whitepaw melts into the snow / (v1.39) the Serpent sinks: can't be hit until it pounces
        const VL = (e.signature && e.signature.lines) || {};
        e.hidden = true; e.pounceNext = true;
        if (e.view) this.tweens.add({ targets: e.view, alpha: 0.15, duration: 400 });
        this.popup(e.view, `${(e.signature && e.signature.icon) || '❄️'} GONE`, 'info');
        this.say(VL.vanish || 'whitepawVanish', { enemy: e.name });
        return true;
      }
      case 'pounce': {   // (v1.31) the huge hit out of the snow. Defend it: stunned and wide open until its next move
        const guarded = p.defending;
        e.hidden = false; e.pounceNext = false;
        if (e.view) { this.tweens.killTweensOf(e.view); this.tweens.add({ targets: e.view, alpha: 1, duration: 150 }); }
        this.strike(e, m.power, true);
        if (guarded && !this.over && !e.gone) {
          e.stunnedOpen = true; e.gauge = 0;
          this.bigMoment('STUNNED!', FUP.ui.colors.good);
          this.say(((e.signature && e.signature.lines) || {}).stunned || 'whitepawStunned', { enemy: e.name });
        }
        return true;
      }
      case 'headbutt': {   // (v1.29) the Ridge Goat: not Defended, you're dazed (your turn bar drops back)
        const landed = this.strike(e, m.power, true);
        if (landed && !this.over) { p.gauge = Math.min(p.gauge, m.stunGauge); this.popup(this.playerSprite, '💫 DAZED', 'bad', -70); this.say('goatDaze', { enemy: e.name }); }
        return true;
      }
      case 'latch': {   // (v1.29) the Frost Wolverine hangs on: you lose HP each turn until you hit it
        const landed = this.strike(e, m.power, false);
        if (landed && !this.over && !e.gone) { this.latched = { by: e, pct: e.signature.perTurn }; this.popup(this.playerSprite, '🦡 LATCHED ON', 'bad', -70); this.say('latchOn', { enemy: e.name }); }
        return true;
      }
      case 'swoop':   // (v1.29) the Highland Eagle dives, then sits on the ground until its next move
        this.strike(e, m.power, true);
        if (!this.over && !e.gone) { e.landed = true; this.popup(e.view, '🪶 ON THE GROUND', 'info'); this.say('eagleLanded', { enemy: e.name }); }
        return true;
      case 'platesReset':   // (v1.27) Jarvin packs his stone plates back on: hits barely scratch him again
        e.platesUntil = null; e.resetNext = false;
        this.popup(e.view, '🪨 PLATES BACK ON', 'info');
        this.say('platesReset', { enemy: e.name });
        FUP.audio.sfx('guard');
        return true;
      case 'mark':   // (v1.22) Old Carrow: his hits climb while you're marked; Defend clears it
        this.marked = 1;
        this.popup(this.playerSprite, '🎯 MARKED', 'bad', -40);
        this.say('markSet', { enemy: e.name });
        return true;
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
        const all = ['attack', 'skill', 'defend', 'rizz', 'eat', 'throw'].concat(FUP.run.hasSling() ? ['shoot'] : []);
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
      if (counterMult > 1) this.say((e.say && e.say.counter) || 'bearCounter', { enemy: e.name });   // the Moss Bear's big swipe, turned around (v0.93); (v1.41) others have their own line
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
  catName(cat) { return { shoot: 'Shoot', attack: 'Attack', skill: 'Skill', throw: 'Throw', eat: 'Eat', rizz: 'Rizz', defend: 'Defend', flee: 'Flee', limit: 'Limit Break' }[cat] || cat; },
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
    if (e.landed) f.push('🪶 on the ground');
    if (e.hidden) f.push('❄️ hidden'); if (e.tucked) f.push((e.signature && e.signature.flag) || '🐢 in its shell'); if (e.passed) f.push(`🙇 weakened ×${e.passed}`); if (e.shielding) f.push('🛡️ shielding the others'); if (e.stunnedOpen) f.push('💫 stunned');   // (v1.31) Old Whitepaw   // (v1.29) the Highland Eagle
    if (this.latched && this.latched.by === e) f.push('🦡 latched on');
    if (e.signature && e.signature.id === 'plates') f.push(this.platesOpen(e) ? '💔 plates cracked' : '🪨 stone plates');   // (v1.27) Jarvin
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
