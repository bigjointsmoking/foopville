// ============================================================
// FISHING SCREEN — cast, wait, hook the bite, then the Reel mini-game.
// Drawn on top of whatever screen you're on (like the backpack).
//   FUP.fishingUi.open(scene, spotId, { x, y }, onClose)   ->  { destroy() }
// { x, y } = where the bobber lands (a spot in the world).
// Rules in src/systems/fishing.js, numbers in data/fishing.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.fishingUi = {
  open(scene, spotId, at, onClose) {
    const ui = FUP.ui, c = ui.colors, L = FUP.look, F = FUP.fishing, D = FUP.fishData, G = D.game;
    const W = scene.scale.width, H = scene.scale.height, DEPTH = 21000;
    const g = { open: true, state: null };
    let parts = [];          // what the current step drew
    let t = 0;               // seconds in the current step
    let reel = null;         // the mini-game's numbers
    const space = scene.input.keyboard.addKey('SPACE', false);

    const fix = (o, d = 0) => { o.setScrollFactor(0).setDepth(DEPTH + d); parts.push(o); return o; };
    const fixBtn = b => { fix(b.rect, 2); fix(b.txt, 3); return b; };
    const clear = () => { parts.forEach(o => { scene.tweens.killTweensOf(o); o.destroy(); }); parts = []; };
    const fishName = id => FUP.ingredients[id].name, fishEmoji = id => FUP.ingredients[id].emoji;
    // The bait chip: tap to switch bait (none → each bait you own). Shows how many are left.
    const baitText = () => { const id = F.baitData() ? F.state.using : null; return id ? `${D.bait[id].emoji} ${D.bait[id].name} x${F.baitCount(id)}` : '🪝 No bait'; };
    const baitChip = (x, y, w = 170) => {
      const b = fixBtn(ui.button(scene, x, y, w, 32, baitText(), () => { F.cycleBait(); b.txt.setText(baitText()); FUP.audio.sfx('click'); }, { size: 13 }));
      g.chip = b;
      return b;
    };
    const label = (str, y = H - 172) => fix(ui.text(scene, W / 2, y, str, 20, c.ink, { fontStyle: '700', stroke: c.stroke, strokeThickness: 5, align: 'center' }).setOrigin(0.5), 2);

    // ---------- 1. Waiting for a bite ----------
    const cast = () => {
      clear(); g.state = 'wait'; t = 0;
      g.biteAt = F.biteWait();
      FUP.audio.sfx('cast');
      const bob = scene.add.text(at.x, at.y, '🔴', { fontSize: '16px' }).setOrigin(0.5).setDepth(DEPTH - 1);
      parts.push(bob); g.bob = bob;
      scene.tweens.add({ targets: bob, y: at.y - 3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      label('Waiting...');
      fixBtn(ui.button(scene, W / 2 - 150, H - 150, 120, 36, '✖ Stop', () => g.destroy(), { size: 15 }));
      baitChip(W / 2 - 20, H - 148);
    };

    // ---------- 2. It bites: tap in time ----------
    const bite = () => {
      g.state = 'bite'; t = 0;
      FUP.audio.sfx('bite');
      F.useBait();   // one bait per bite
      if (g.chip && g.chip.txt.active) g.chip.txt.setText(baitText());
      scene.tweens.killTweensOf(g.bob);
      g.bob.y = at.y + 4;
      const bang = scene.add.text(at.x, at.y - 22, '❗', { fontSize: '22px' }).setOrigin(0.5).setDepth(DEPTH);
      parts.push(bang);
      scene.tweens.add({ targets: bang, scale: 1.4, duration: 120, yoyo: true, repeat: -1 });
      label('A bite! Tap!').setColor(c.accent);
    };

    // ---------- 3. Reel ----------
    const startReel = () => {
      // Sometimes it's junk: no mini-game, just reel in a boot
      const junk = F.rollJunk();
      if (junk) { result({ junk: F.landJunk(junk, { x: W / 2, y: H / 2 - 150 }) }); return; }
      const fishId = F.rollFish(spotId);
      if (!fishId) { result(null); return; }
      clear(); g.state = 'reel'; t = 0;
      const fd = D.fish[fishId], zone = Math.min(G.barH - 10, F.zoneSize(fishId));
      const PW = 240, PH = G.barH + 110, px = (W - PW) / 2, py = (H - PH) / 2;
      const bx = px + 70, by = py + 62;                      // top-left of the bar
      fix(ui.shade(scene, 0.45));
      fix(ui.panel(scene, px, py, PW, PH, 'panel'), 1);
      fix(ui.text(scene, W / 2, py + 14, 'REEL!', 20, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0), 2);
      fix(ui.text(scene, W / 2, py + 38, ui.isTouch(scene) ? 'Hold to lift · let go to drop' : 'Hold the mouse or SPACE to lift', 12, c.dim).setOrigin(0.5, 0), 2);
      fix(scene.add.rectangle(bx, by, 44, G.barH, L.num(D.colors.bar)).setOrigin(0).setStrokeStyle(2, L.num('k0')), 2);
      const zoneRect = fix(scene.add.rectangle(bx + 3, by, 38, zone, L.num(D.colors.zone), 0.85).setOrigin(0), 3);
      const fish = fix(scene.add.text(bx + 22, by, fishEmoji(fishId), { fontSize: G.fishH + 'px' }).setOrigin(0.5), 4);
      // The catch meter, beside the bar
      const mx = bx + 64;
      fix(scene.add.rectangle(mx, by, 18, G.barH, L.num('k0')).setOrigin(0).setStrokeStyle(2, L.num('k0')), 2);
      const meter = fix(scene.add.rectangle(mx + 2, by + G.barH - 2, 14, 10, L.num(D.colors.meter)).setOrigin(0, 1), 3);
      fix(ui.text(scene, mx + 9, by + G.barH + 8, 'Catch', 11, c.dim).setOrigin(0.5, 0), 2);
      // Positions are measured up from the bottom of the bar
      reel = { fishId, fd, zone, by, zoneRect, fish, meter,
        zonePos: (G.barH - zone) / 2, zoneV: 0,
        fishPos: G.barH / 2, fishTo: G.barH / 2, dartIn: 0,
        meterV: G.start, touched: false, dropped: false, tick: 0 };
    };

    const stepReel = dt => {
      const r = reel, holding = scene.input.activePointer.isDown || space.isDown;
      // Your zone: speeds up while held, falls when you let go, bounces a little off the ends
      r.zoneV += (holding ? G.lift : -G.gravity) * dt;
      r.zonePos += r.zoneV * dt;
      const top = G.barH - r.zone;
      if (r.zonePos < 0) { r.zonePos = 0; r.zoneV *= -G.bounce; }
      if (r.zonePos > top) { r.zonePos = top; r.zoneV *= -G.bounce; }
      // The fish: every `dart` seconds it picks a new place to swim to
      r.dartIn -= dt;
      if (r.dartIn <= 0) {
        r.dartIn = r.fd.dart * (0.7 + Math.random() * 0.6);
        const half = G.fishH / 2;
        r.fishTo = Math.max(half, Math.min(G.barH - half, r.fishPos + (Math.random() * 2 - 1) * r.fd.range * G.barH));
      }
      const gap = r.fishTo - r.fishPos, move = r.fd.speed * dt;
      r.fishPos += Math.abs(gap) <= move ? gap : Math.sign(gap) * move;
      // The meter
      const inside = r.fishPos >= r.zonePos && r.fishPos <= r.zonePos + r.zone;
      if (inside) {
        r.touched = true;
        r.meterV += G.fill * dt;
        r.tick -= dt;
        if (r.tick <= 0) { r.tick = 0.22; FUP.audio.sfx('reelTick'); }
      } else {
        r.meterV -= F.drainRate() * dt;
        if (r.touched) r.dropped = true;   // no longer a Perfect catch
      }
      // Draw
      r.zoneRect.y = r.by + G.barH - r.zonePos - r.zone;
      r.fish.y = r.by + G.barH - r.fishPos;
      const m = Math.max(0, Math.min(1, r.meterV));
      r.meter.height = Math.max(2, (G.barH - 4) * m);
      r.meter.setOrigin(0, 1);
      r.meter.setFillStyle(L.num(m < 0.25 ? D.colors.meterLow : D.colors.meter));
      if (r.meterV >= 1) {
        const perfect = r.touched && !r.dropped, res = F.land(r.fishId, perfect, { x: W / 2, y: H / 2 - 150 });
        res.treasure = F.rollTreasure(perfect);   // something else on the line?
        result(res);
      }
      else if (r.meterV <= 0) result(null);
    };

    // ---------- 4. Result ----------
    const result = (res) => {
      clear(); g.state = 'result'; reel = null;
      const PW = 380, PH = 250, px = (W - PW) / 2, py = (H - PH) / 2;
      fix(ui.shade(scene, 0.45));
      fix(ui.panel(scene, px, py, PW, PH, 'panel'), 1);
      if (res && res.junk) {
        const j = res.junk, ing = FUP.ingredients[j.id];
        FUP.audio.sfx('plop');
        fix(ui.sprite(scene, W / 2, py + 54, ui.ingKey(j.id), ing.emoji, 44, 3), 2);
        fix(ui.text(scene, W / 2, py + 100, ing.name + (j.kept ? '' : ' (no room: you threw it back)'), 18, c.ink, { fontStyle: '700' }).setOrigin(0.5), 2);
        fix(ui.text(scene, W / 2, py + 128, `+${j.xp} 🎣 Fishing XP. It's not a fish.`, 14, c.dim).setOrigin(0.5), 2);
        if (scene.say) scene.say('junkCatch', { item: ing.name });
      } else if (res) {
        FUP.audio.sfx('catch');
        const pic = fix(ui.sprite(scene, W / 2, py + 54, ui.ingKey(res.id), fishEmoji(res.id), 44, 3), 2);
        pic.setScale(pic.scaleX * 0.3);
        scene.tweens.add({ targets: pic, scale: pic.scaleX / 0.3, duration: 260, ease: 'Back.easeOut' });
        fix(ui.text(scene, W / 2, py + 96, fishName(res.id) + (res.extra ? ' x2' : ''), 20, c.accent, { fontStyle: '700' }).setOrigin(0.5), 2);
        fix(ui.text(scene, W / 2, py + 124, `+${res.xp} 🎣 Fishing XP`, 15, c.good).setOrigin(0.5), 2);
        if (res.perfect) fix(ui.text(scene, W / 2, py + 146, '✨ Perfect catch!', 15, c.crit, { fontStyle: '700' }).setOrigin(0.5), 2);
        if (res.treasure) {
          FUP.audio.sfx('coins');
          fix(ui.text(scene, W / 2, py + 170, `Something else was on the line: ${res.treasure.text}`, 13, c.accent, { fontStyle: '700', align: 'center', wordWrap: { width: PW - 30 } }).setOrigin(0.5), 2);
          if (scene.say) scene.say('treasureCatch', { item: res.treasure.text });
        } else if (scene.say) scene.say(res.perfect ? 'fishPerfect' : 'fishCatch', { item: fishName(res.id) });
      } else {
        FUP.audio.sfx('error');
        fix(ui.text(scene, W / 2, py + 54, '💨', 40).setOrigin(0.5), 2);
        fix(ui.text(scene, W / 2, py + 100, 'It got away.', 20, c.bad, { fontStyle: '700' }).setOrigin(0.5), 2);
        if (scene.say) scene.say('fishMiss');
      }
      const again = () => {
        if (!F.canCast(spotId)) { if (scene.say) scene.say('fishFull'); FUP.audio.sfx('error'); g.destroy(); return; }
        cast();
      };
      fixBtn(ui.button(scene, px + 16, py + PH - 56, 130, 40, '🎣 Cast again', again, { hot: true, size: 14 }));
      baitChip(px + 152, py + PH - 52, 130);
      fixBtn(ui.button(scene, px + PW - 86, py + PH - 56, 70, 40, 'Done', () => g.destroy(), { size: 14 }));
    };

    // ---------- Input + the clock ----------
    const tap = () => { if (g.open && g.state === 'bite') startReel(); };
    const onUpdate = (time, delta) => {
      if (!g.open) return;
      const dt = Math.min(delta, 100) / 1000;
      t += dt;
      if (g.state === 'wait' && t >= g.biteAt) bite();
      else if (g.state === 'bite' && t >= G.hookWindow) result(null);
      else if (g.state === 'reel') stepReel(dt);
    };
    scene.input.on('pointerdown', tap);
    scene.input.keyboard.on('keydown-SPACE', tap);
    scene.input.keyboard.on('keydown-E', tap);
    scene.events.on('update', onUpdate);

    const stop = () => {
      scene.input.off('pointerdown', tap);
      scene.input.keyboard.off('keydown-SPACE', tap);
      scene.input.keyboard.off('keydown-E', tap);
      scene.events.off('update', onUpdate);
      scene.input.keyboard.removeKey(space);
    };
    g.destroy = () => {
      if (!g.open) return;
      g.open = false;
      stop(); clear();
      if (onClose) onClose();
    };
    // The screen closed under us (a fight, going home): just let go of everything
    scene.events.once('shutdown', () => { if (g.open) { g.open = false; stop(); } });

    cast();
    return g;
  },
};
