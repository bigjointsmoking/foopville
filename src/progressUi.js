// ============================================================
// PROGRESS UI — the "leveling feel" for every skill:
//   - a "+12 Cooking XP" pop-up every time you earn XP
//   - a big LEVEL UP banner with a fanfare (and what you unlocked)
//   - the Skill Guide: each skill's levels and what they unlock
// Works for any skill in data/skills.js, so new skills get all of this for free.
//
// A screen turns it on with FUP.progressUi.attach(this) in create().
// ============================================================
window.FUP = window.FUP || {};

FUP.progressUi = {
  // Start showing pop-ups and banners on this screen. Stops when the screen closes.
  attach(scene) {
    scene._xpPops = [];
    scene._banners = [];
    scene._bannerOn = null;
    const stop = FUP.skills.onXp(res => {
      if (!scene.sys.isActive()) return;
      this.pop(scene, res);
      if (res.to > res.from) this.queueBanner(scene, res);
    });
    scene.events.once('shutdown', stop);
  },

  // ---------- "+12 XP" pop-up ----------
  pop(scene, res) {
    const ui = FUP.ui, sk = FUP.skillData.skills[res.id], W = scene.scale.width;
    const p = FUP.skills.progress(res.id);
    const where = res.where || { x: W / 2, y: 92 };
    // Several pop-ups at once stack instead of overlapping
    const now = scene.time.now;
    scene._xpPops = scene._xpPops.filter(t => now - t < 700);
    const y = where.y - scene._xpPops.length * 34;
    scene._xpPops.push(now);

    const hex = '#' + sk.color.toString(16).padStart(6, '0');
    const fix = o => o.setScrollFactor(0).setDepth(24000);
    const txt = fix(ui.text(scene, where.x, y, `+${res.gained} ${sk.emoji} ${sk.name} XP`, 20, hex, {
      fontStyle: '700', stroke: FUP.ui.colors.stroke, strokeThickness: 5,
    }).setOrigin(0.5));
    const bar = ui.bar(scene, where.x - 50, y + 14, 100, 8, sk.color);
    fix(bar.bg); fix(bar.fill);
    bar.set(p.ratio);
    const parts = [txt, bar.bg, bar.fill];
    scene.tweens.add({
      targets: parts, y: '-=36', alpha: 0, delay: 350,
      duration: FUP.skillData.display.popSeconds * 1000, ease: 'Cubic.easeIn',
      onComplete: () => parts.forEach(o => o.destroy()),
    });
  },

  // ---------- LEVEL UP banner ----------
  queueBanner(scene, res) {
    scene._banners.push(res);
    if (!scene._bannerOn) this.nextBanner(scene);
  },

  nextBanner(scene) {
    const res = scene._banners.shift();
    if (!res) { scene._bannerOn = null; return; }
    const ui = FUP.ui, c = ui.colors, sk = FUP.skillData.skills[res.id];
    const W = scene.scale.width, H = scene.scale.height, cy = H * 0.42;
    const unlocks = FUP.skills.unlocksBetween(res.id, res.from, res.to);
    const hex = '#' + sk.color.toString(16).padStart(6, '0');
    const parts = [];
    const fix = (o, d = 0) => { o.setScrollFactor(0).setDepth(25000 + d); parts.push(o); return o; };

    // Band across the screen (tap it to close)
    const lines = unlocks.length ? unlocks.map(u => '🔓 ' + u) : [sk.everyLevel ? sk.everyLevel() : ''];
    const bandH = 118 + lines.length * 22;
    const band = fix(ui.panel(scene, 0, 0, W, bandH, 'panel', sk.color).setOrigin(0.5).setPosition(W / 2, cy).setAlpha(0.95));
    band.setInteractive({ useHandCursor: true });
    fix(ui.text(scene, W / 2, cy - bandH / 2 + 34, `${sk.emoji} ${sk.name.toUpperCase()} LEVEL ${res.to}!`, 40, hex, {
      fontStyle: '700', stroke: c.stroke, strokeThickness: 7,
    }).setOrigin(0.5), 1);
    fix(ui.text(scene, W / 2, cy - bandH / 2 + 70, lines.join('\n'), 16, unlocks.length ? c.good : c.ink, {
      align: 'center', lineSpacing: 6, wordWrap: { width: W - 80 },
    }).setOrigin(0.5, 0), 1);
    const quips = FUP.narrator.levelUp || [];
    if (quips.length) {
      const q = Phaser.Utils.Array.GetRandom(quips).replace(/\{skill\}/g, sk.name).replace(/\{level\}/g, res.to);
      fix(ui.text(scene, W / 2, cy + bandH / 2 - 22, q, 14, c.dim, { fontStyle: 'italic', align: 'center', wordWrap: { width: W - 80 } }).setOrigin(0.5), 1);
    }
    // Sparkles bursting out
    for (let i = 0; i < 14; i++) {
      const s = fix(ui.text(scene, W / 2, cy, '✦', Phaser.Math.Between(14, 26), i % 2 ? hex : c.crit).setOrigin(0.5), 2);
      const a = (i / 14) * Math.PI * 2, r = Phaser.Math.Between(180, 380);
      scene.tweens.add({ targets: s, x: W / 2 + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.45, alpha: 0, duration: 900, ease: 'Cubic.easeOut' });
    }

    FUP.audio.sfx('fanfare');
    parts.forEach(o => { if (o.scaleY !== undefined) o.scaleY = 0.1; });
    scene.tweens.add({ targets: parts, scaleY: 1, duration: 220, ease: 'Back.easeOut' });

    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      scene.tweens.add({ targets: parts, alpha: 0, duration: 250, onComplete: () => { parts.forEach(o => o.destroy()); this.nextBanner(scene); } });
    };
    band.on('pointerdown', close);
    scene._bannerOn = res;
    scene.time.delayedCall(FUP.skillData.display.bannerSeconds * 1000, close);
  },

  // ---------- Skill Guide ----------
  // A small button that opens the guide. canOpen() = false blocks it (another window is open).
  // onOpen / onClose let the screen pause walking while it's open.
  guideButton(scene, x, y, w, h, opts = {}) {
    const b = FUP.ui.button(scene, x, y, w, h, '📊 Skills', () => {
      if (opts.canOpen && !opts.canOpen()) return;
      const g = this.openGuide(scene, opts.skill || 'cooking', opts.onClose);
      if (opts.onOpen) opts.onOpen(g);
    }, { size: opts.size || 15 });
    if (opts.fixed) { b.rect.setScrollFactor(0).setDepth(10001); b.txt.setScrollFactor(0).setDepth(10002); }
    return b;
  },

  // Opens the guide window. Returns { destroy() }.
  openGuide(scene, skillId, onClose) {
    const ui = FUP.ui, c = ui.colors, W = scene.scale.width, H = scene.scale.height;
    const D = 22000, all = [];
    let page = [];
    const fix = (o, d = 0, list = page) => { o.setScrollFactor(0).setDepth(D + d); list.push(o); return o; };
    const fixBtn = (b, list = page) => { fix(b.rect, 2, list); fix(b.txt, 3, list); if (b.icon) fix(b.icon, 3, list); return b; };

    // Dark backdrop (blocks clicks on the game behind it) and the window
    fix(FUP.ui.shade(scene, 0.7), 0, all);
    const PW = 680, PH = 500, px = (W - PW) / 2, py = (H - PH) / 2;
    fix(FUP.ui.panel(scene, px, py, PW, PH, 'panel'), 1, all);
    fix(ui.text(scene, px + 20, py + 16, 'SKILL GUIDE', 22, c.accent, { fontStyle: '700' }), 2, all);
    // Character card: your name and game mode (locked for life)
    const M = FUP.run.modeInfo();
    fix(ui.text(scene, px + 190, py + 22, `${FUP.run.hero.name} · ${M.emoji} ${M.name} mode`, 15, FUP.run.isHardcore() ? c.bad : c.ink, { fontStyle: '700' }), 2, all);

    const g = { open: true };
    const esc = () => g.destroy();
    g.destroy = () => {
      if (!g.open) return;
      g.open = false;
      scene.input.keyboard.off('keydown-ESC', esc);
      [...page, ...all].forEach(o => o.destroy());
      if (onClose) onClose();
    };
    scene.input.keyboard.on('keydown-ESC', esc);
    scene.events.once('shutdown', () => { g.open = false; scene.input.keyboard.off('keydown-ESC', esc); });
    fixBtn(ui.button(scene, px + PW - 110, py + 12, 94, 32, 'Close', () => g.destroy(), { hot: true, size: 15 }), all);

    const ids = FUP.skills.list();   // all 10, in order (data/skills.js)
    const pageOf = {};   // which page of each skill's list you're looking at
    const draw = (id) => {
      page.forEach(o => o.destroy());
      page = [];
      const sk = FUP.skillData.skills[id], p = FUP.skills.progress(id);
      const hex = '#' + sk.color.toString(16).padStart(6, '0');

      // One tab per skill, in rows of 5. Skills that aren't in the game yet are dim with no level.
      const perRow = 5, tabW = (PW - 40 - (perRow - 1) * 4) / perRow, built = FUP.skills.built(id);
      for (let r = 0; r * perRow < ids.length; r++) {
        const row = ids.slice(r * perRow, (r + 1) * perRow);
        const labels = row.map(sid => { const s = FUP.skillData.skills[sid]; return `${s.emoji} ${s.name} ${FUP.skills.built(sid) ? FUP.skills.level(sid) : '—'}`; });
        const parts = ui.tabs(scene, px + 20, py + 54 + r * 36, labels, row.indexOf(id), i => draw(row[i]), { w: tabW, h: 32, size: 13 });
        parts.forEach((o, i) => { fix(o, 2); if (!FUP.skills.built(row[Math.floor(i / 2)])) o.setAlpha(0.55); });
      }

      // Level + XP bar
      const y0 = py + 54 + Math.ceil(ids.length / perRow) * 36 + 14;
      if (!built) {
        fix(ui.text(scene, px + 24, y0, `${sk.emoji} ${sk.name}`, 24, c.dim, { fontStyle: '700' }), 2);
        fix(ui.text(scene, px + 24, y0 + 40, FUP.skillData.notBuiltText, 16, c.ink), 2);
        return;
      }
      fix(ui.text(scene, px + 24, y0, `${sk.emoji} ${sk.name}  Level ${p.level}`, 24, hex, { fontStyle: '700' }), 2);
      const bar = ui.bar(scene, px + 24, y0 + 36, PW - 48, 16, sk.color);
      fix(bar.bg, 2); fix(bar.fill, 3);
      bar.set(p.ratio);
      fix(ui.text(scene, px + 24, y0 + 58, p.maxed ? 'Max level. There is nothing left to prove. Mostly.' : `${p.xp} / ${p.need} XP  ·  ${p.need - p.xp} more to level ${p.level + 1}`, 14, c.dim), 2);
      if (sk.everyLevel) fix(ui.text(scene, px + 24, y0 + 80, sk.everyLevel(), 14, c.ink, { wordWrap: { width: PW - 48 } }), 2);

      // Every unlock, greyed out until you reach it
      const all = FUP.skills.guide(id);
      const ry = y0 + 126, rowH = 27, perPage = Math.floor((py + PH - 50 - ry) / rowH);
      const pages = Math.max(1, Math.ceil(all.length / perPage));
      // Open on the page with your next unlock
      if (pageOf[id] === undefined) { const next = all.findIndex(u => u.level > p.level); pageOf[id] = next < 0 ? pages - 1 : Math.floor(next / perPage); }
      const pg = Math.min(pageOf[id], pages - 1);
      const rows = all.slice(pg * perPage, (pg + 1) * perPage);
      if (!all.length) fix(ui.text(scene, px + 24, ry, 'Nothing special to unlock yet. More is coming.', 15, c.dim), 2);
      if (pages > 1) {
        const by = py + PH - 44;
        fixBtn(ui.button(scene, px + PW - 250, by, 70, 30, '◀', () => { pageOf[id] = Math.max(0, pg - 1); draw(id); }, { size: 15 })).setEnabled(pg > 0);
        fix(ui.text(scene, px + PW - 135, by + 15, `${pg + 1} / ${pages}`, 14, c.dim).setOrigin(0.5), 2);
        fixBtn(ui.button(scene, px + PW - 90, by, 70, 30, '▶', () => { pageOf[id] = Math.min(pages - 1, pg + 1); draw(id); }, { size: 15 })).setEnabled(pg < pages - 1);
      }
      rows.forEach((u, i) => {
        const got = p.level >= u.level, y = ry + i * rowH;
        if (i % 2 === 0) fix(scene.add.rectangle(px + 16, y - 4, PW - 32, rowH, 0xffffff, 0.04).setOrigin(0), 1);
        fix(ui.text(scene, px + 28, y, got ? '✅' : '🔒', 15).setAlpha(got ? 1 : 0.5), 2);
        fix(ui.text(scene, px + 60, y, `Lv ${u.level}`, 16, got ? hex : c.dim, { fontStyle: '700' }).setAlpha(got ? 1 : 0.6), 2);
        fix(ui.text(scene, px + 130, y, u.text, 16, got ? c.ink : c.dim, { wordWrap: { width: PW - 160 } }).setAlpha(got ? 1 : 0.6), 2);
      });
    };
    draw(ids.includes(skillId) ? skillId : ids[0]);
    FUP.audio.sfx('select');
    return g;
  },
};
