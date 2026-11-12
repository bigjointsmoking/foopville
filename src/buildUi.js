// ============================================================
// BUILD MODE — drawing the things you've placed, and the screen for
// putting them down, moving them and taking them back.
//   FUP.buildUi.drawPlaced(scene, region)        (re)draws every placed thing on this map
//   FUP.buildUi.open(scene, zoneId, onClose)     build mode  ->  { destroy() }
// One thumb: tap a thing you own, then tap a slot or square. Tap a placed thing to move or take it back.
// Rules in src/systems/place.js, numbers in data/place.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.buildUi = {
  // Map pixels of a placed thing: { x, y, w, h } (top-left + size)
  box(p, tile) {
    const z = FUP.place.zone(p.zone), it = FUP.place.item(p.item);
    return { x: (z.where.tx + p.tx) * tile, y: (z.where.ty + p.ty) * tile, w: it.w * tile, h: it.h * tile };
  },

  // Draw every placed thing in this region. Safe to call again: it clears what it drew before.
  drawPlaced(scene, region, tile = FUP.villageData.tileSize) {
    (scene._placeViews || []).forEach(o => o.destroy());
    scene._placeViews = [];
    for (const p of FUP.place.state.placed) {
      const z = FUP.place.zone(p.zone), it = FUP.place.item(p.item);
      if (!z || !it || z.where.region !== region) continue;
      const b = this.box(p, tile);
      // Solid things get a soft shadow so they sit on the ground instead of floating
      if (it.solid) scene._placeViews.push(scene.add.ellipse(b.x + b.w / 2, b.y + b.h - 6, b.w * 0.8, tile * 0.35, 0x000000, 0.28).setDepth(-3));
      const key = it.sprite || 'place_' + p.item;
      let s;
      if (scene.textures.exists(key)) {
        // A painted picture (v0.68 furniture): as wide as its squares; standing things stand on the bottom of them
        // (tall ones like the bookshelf rise above), flat ones (rugs) lie in the middle
        s = scene.add.image(b.x + b.w / 2, it.solid ? b.y + b.h + 2 : b.y + b.h / 2, key).setOrigin(0.5, it.solid ? 1 : 0.5);
        s.setScale(b.w * (it.w === 1 ? 0.92 : 0.98) / s.width);
      } else s = FUP.ui.sprite(scene, b.x + b.w / 2, b.y + b.h / 2, key, it.emoji, Math.round(tile * (it.solid ? 0.95 : 0.8)));
      s.setDepth(it.solid ? b.y + b.h : -2);
      scene._placeViews.push(s);
    }
  },

  open(scene, zoneId, onClose) {
    const ui = FUP.ui, c = ui.colors, L = FUP.look, P = FUP.place, D = FUP.placeData;
    const W = scene.scale.width, H = scene.scale.height, T = FUP.villageData.tileSize, DEPTH = 20000;
    const z = P.zone(zoneId), region = z.where.region, cam = scene.cameras.main;
    const zx = z.where.tx * T, zy = z.where.ty * T, STRIP = 96, stripY = H - 62 - STRIP;
    const g = { open: true };
    let sel = null;      // an item id you own, about to be put down
    let picked = null;   // uid of a placed thing you tapped
    let note = '';
    let removing = false;   // Remove mode: tapping a placed thing takes it back
    let page = 0;           // which 4 of your things the strip shows
    let parts = [];
    const gfx = scene.add.graphics().setDepth(-4);   // on the grass, under everything placed

    // The camera stops following you: it looks at the plot instead (▲ ▼ scroll it)
    // A zone smaller than the screen (your room) sits in the middle of the space above the strip
    const minY = Math.min(zy - 70, Math.round(zy + z.h * T / 2 - (62 + stripY) / 2)), maxY = Math.max(minY, zy + z.h * T - stripY + 10);
    const minX = Math.min(zx - 40, Math.round(zx + z.w * T / 2 - W / 2)), maxX = Math.max(minX, zx + z.w * T - W + 40);   // the farm is wider than the screen: ◀ ▶ scroll it
    const startX = z.w * T + 80 > W ? scene.player.x - W / 2 : zx + z.w * T / 2 - W / 2;
    cam.stopFollow();
    cam.setScroll(Math.max(minX, Math.min(maxX, startX)), Math.max(minY, Math.min(maxY, scene.player.y - 220)));
    const heroSq = () => ({ x: Math.floor(scene.player.x / T), y: Math.floor(scene.player.y / T) });
    const traps = (itemId, tx, ty) => { const h = heroSq(); return P.wouldTrap(itemId, zoneId, tx, ty, h.x, h.y); };

    const fix = (o, d = 1) => { o.setScrollFactor(0).setDepth(DEPTH + d); parts.push(o); return o; };
    const btn = (x, y, w, h, label, fn, opts) => { const b = ui.button(scene, x, y, w, h, label, () => { fn(); if (g.open) draw(); }, { size: 13, ...opts }); fix(b.rect, 2); fix(b.txt, 3); return b; };
    const heroOn = (itemId, tx, ty) => {   // would a solid thing land on the hero?
      const it = P.item(itemId);
      if (!it.solid) return false;
      const hx = Math.floor(scene.player.x / T) - z.where.tx, hy = Math.floor(scene.player.y / T) - z.where.ty;
      return hx >= tx - 1 && hx <= tx + it.w && hy >= ty - 1 && hy <= ty + it.h;
    };

    const draw = () => {
      parts.forEach(o => o.destroy()); parts = [];
      // ----- On the map: the zone's edge and its slots -----
      gfx.clear();
      gfx.lineStyle(3, L.num(D.buildColors.zoneEdge), 0.9).strokeRect(zx, zy, z.w * T, z.h * T);
      const moving = picked !== null ? P.byUid(picked) : null, itemId = sel || (moving && moving.item);
      for (const s of z.slots) {
        const ok = itemId ? P.canPut(itemId, zoneId, s.tx, s.ty, picked) : !P.at(zoneId, s.tx, s.ty);
        const col = L.num(ok ? D.buildColors.slotFree : D.buildColors.slotBad);
        if (!P.at(zoneId, s.tx, s.ty)) gfx.fillStyle(col, 0.14).fillRect(zx + s.tx * T, zy + s.ty * T, s.w * T, s.h * T);
        gfx.lineStyle(2, col, 0.9).strokeRect(zx + s.tx * T + 1, zy + s.ty * T + 1, s.w * T - 2, s.h * T - 2);
      }
      if (moving) { const b = FUP.buildUi.box(moving, T); gfx.lineStyle(3, L.num('y2'), 1).strokeRect(b.x, b.y, b.w, b.h); }
      FUP.buildUi.drawPlaced(scene, region, T);

      // ----- The strip at the bottom -----
      fix(ui.panel(scene, 16, stripY, W - 32, STRIP, 'panel'));
      const help = removing ? 'Remove: tap placed things to take them back. Tap Remove again to stop.'
        : moving ? `${P.item(moving.item).name}: tap a new spot to move it, or take it back.`
        : sel ? `${P.item(sel).name}: tap ${P.freeKind(P.item(sel).kind) ? 'a free square' + (z.slots.length ? ' (not a slot)' : '') : 'a green slot'} to put it down.`
        : `Tap something you own, then tap ${zoneId === 'home' ? 'the floor' : 'the plot'}. Tap a placed thing to move it or take it back.`;
      fix(ui.text(scene, 30, stripY + 10, `🔨 ${z.name.toUpperCase()}`, 14, c.accent, { fontStyle: '700' }), 2);
      fix(ui.text(scene, 30, stripY + 30, note || help, 12, note ? c.bad : c.dim, { wordWrap: { width: W - 330 } }), 2);
      if (moving) {
        btn(30, stripY + 54, 130, 32, '↩ Take back', () => { P.take(picked); picked = null; note = ''; FUP.audio.sfx('pickup'); if (scene.say) scene.say('placeTake'); });
        btn(170, stripY + 54, 100, 32, 'Cancel', () => { picked = null; note = ''; });
      } else {
        // Only what fits this zone (no furniture on the farm), 4 at a time
        const owned = Object.keys(P.state.owned).filter(id => (P.item(id).zones || []).includes(zoneId));
        const pages = Math.max(1, Math.ceil(owned.length / 4)); page = Math.min(page, pages - 1);
        owned.slice(page * 4, page * 4 + 4).forEach((id, i) => {
          const it = P.item(id);
          btn(30 + i * 136, stripY + 54, 130, 32, `${it.emoji} ${it.name} x${P.ownedCount(id)}`, () => { sel = sel === id ? null : id; removing = false; note = ''; }, { hot: sel === id, size: 12 });
        });
        if (pages > 1) btn(30 + 4 * 136, stripY + 54, 40, 32, '▶', () => { page = (page + 1) % pages; });
        if (!owned.length) fix(ui.text(scene, 30, stripY + 62, 'Nothing to place here. Planksworth the Carpenter sells things to build.', 13, c.ink), 2);
      }
      btn(W - 150, stripY + 54, 120, 32, removing ? '🗑️ Removing' : '🗑️ Remove', () => { removing = !removing; sel = null; picked = null; note = ''; }, { hot: removing });
      btn(W - 390, stripY + 12, 44, 32, '◀', () => cam.setScroll(Math.max(minX, cam.scrollX - 6 * T), cam.scrollY));
      btn(W - 340, stripY + 12, 44, 32, '▶', () => cam.setScroll(Math.min(maxX, cam.scrollX + 6 * T), cam.scrollY));
      btn(W - 290, stripY + 12, 44, 32, '▲', () => cam.setScroll(cam.scrollX, Math.max(minY, cam.scrollY - 3 * T)));
      btn(W - 240, stripY + 12, 44, 32, '▼', () => cam.setScroll(cam.scrollX, Math.min(maxY, cam.scrollY + 3 * T)));
      btn(W - 150, stripY + 12, 120, 32, '✖ Done', () => g.destroy(), { hot: true });
    };

    // ----- Taps on the map -----
    const tap = (pointer) => {
      if (!g.open || pointer.y >= stripY - 4 || pointer.y < 62) return;   // the strip and the top bar aren't the map
      const at = P.zoneAt(region, Math.floor(pointer.worldX / T), Math.floor(pointer.worldY / T));
      if (!at || at.zone !== zoneId) return;
      note = '';
      if (removing) {
        const p = P.at(zoneId, at.tx, at.ty);
        if (p) { P.take(p.uid); FUP.audio.sfx('pickup'); }
        draw();
        return;
      }
      if (sel || picked !== null) {
        const itemId = sel || P.byUid(picked).item, spot = P.snap(itemId, zoneId, at.tx, at.ty);
        if (heroOn(itemId, spot.tx, spot.ty)) note = "You're standing there. Step away first.";
        else if (traps(itemId, spot.tx, spot.ty)) { note = "That would wall you in."; if (scene.say) scene.say('placeTrapped'); }
        else if (sel) {
          const first = !Object.keys(FUP.facts.state).some(k => k.startsWith('built:'));
          if (P.put(sel, zoneId, spot.tx, spot.ty)) {
            FUP.audio.sfx('guard');
            if (P.item(sel).stall && scene.say) scene.say('stallBuilt');
            else if (first && scene.say) scene.say('placeFirst');
            if (!P.ownedCount(sel)) sel = null;
          } else note = "It doesn't fit there.";
        } else if (P.move(picked, spot.tx, spot.ty)) { FUP.audio.sfx('guard'); picked = null; }
        else {
          const other = P.at(zoneId, at.tx, at.ty);
          if (other && other.uid !== picked) picked = other.uid;   // tapped another thing: pick that one instead
          else note = "It doesn't fit there.";
        }
        if (note) FUP.audio.sfx('error');
      } else {
        const p = P.at(zoneId, at.tx, at.ty);
        if (p) { picked = p.uid; FUP.audio.sfx('click'); }
      }
      draw();
    };
    scene.input.on('pointerdown', tap);

    const stop = () => { scene.input.off('pointerdown', tap); };
    g.destroy = () => {
      if (!g.open) return;
      g.open = false;
      stop();
      parts.forEach(o => o.destroy()); gfx.destroy();
      FUP.buildUi.drawPlaced(scene, region, T);
      cam.startFollow(scene.player, true, 0.15, 0.15);
      if (onClose) onClose();
    };
    scene.events.once('shutdown', () => { if (g.open) { g.open = false; stop(); } });

    draw();
    FUP.audio.sfx('select');
    return g;
  },
};
