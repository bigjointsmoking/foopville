// ============================================================
// UI KIT — shared framed panels, buttons, tabs, slots, tooltips and bars,
// so every screen looks the same. Every colour and size comes from
// data/look.js (palette "Old Kingdom").
// Frames are drawn by code to any size and cached, so they work on
// every phone (no WebGL-only features).
// ============================================================
window.FUP = window.FUP || {};

(function () {
  const L = FUP.look, P = L.palette;
  const num = L.num, hex = L.hex;
  const T = L.text, S = L.screen, F = L.frames, B = L.bars;

  FUP.ui = {
  // A bar that hides itself: show() fades the objects in, and they fade out `ms` after the last show().
  // Used for the narrator bar in fights and the Forest (v0.41: only there when there's something to read).
  autoHide(scene, objs, ms = 4500) {
    objs.forEach(o => o.setAlpha(0));
    let timer = null;
    return () => {
      scene.tweens.killTweensOf(objs);
      objs.forEach(o => o.setAlpha(1));
      if (timer) timer.remove();
      timer = scene.time.delayedCall(ms, () => scene.tweens.add({ targets: objs, alpha: 0, duration: 400 }));
    };
  },

    font: L.font,
    hex, num,

    // Old names kept so every screen keeps working; all point at the palette now.
    colors: {
      sky: num(S.sky), canopy: num(S.canopy), ground: num(S.ground), groundDark: num(S.groundDark),
      shade: num(S.shade),
      panel: num(F.panel.fill), panelEdge: num(F.panel.hi), inset: num(F.inset.fill),
      btn: num(F.btn.fill), btnHover: num(F.btnHover.fill), btnEdge: num(F.btn.hi),
      btnHot: num(F.hot.fill), btnHotEdge: num(F.hot.hi),
      hp: num(B.hp), hpLow: num(B.hpLow), atb: num(B.atb), atbFull: num(B.atbFull), limit: num(B.limit),
      enemyHp: num(B.enemyHp), xp: num(B.xp),
      select: num(L.edges.select), hover: num(L.edges.hover), danger: num(L.edges.danger), muted: num(L.edges.muted),
      ink: hex(T.ink), dim: hex(T.dim), accent: hex(T.accent), dark: hex(T.dark),
      good: hex(T.good), bad: hex(T.bad), crit: hex(T.crit), info: hex(T.info),
      stroke: hex(L.textStroke),
    },

    pixelScale: 2, // Blender sprites are drawn at 2x for chunky pixels. Painted sprites (v0.64) have
                   // FUP.spriteRes = 2 times the pixels, so every scale is divided by it (artScale) and they show the same size.

    // ---------- Frames (the 9-slice look, drawn to any size) ----------
    // Returns a texture key for a framed box of this style and size.
    // edge = optional colour (number or '#hex') that replaces the outline.
    frameKey(scene, style, w, h, edge) {
      w = Math.max(4, Math.round(w)); h = Math.max(4, Math.round(h));
      const e = edge === undefined || edge === null ? '' : (typeof edge === 'number' ? '#' + edge.toString(16).padStart(6, '0') : edge);
      const key = `frame_${style}_${e}_${w}x${h}`;
      const tm = scene.textures;
      if (tm.exists(key)) return key;
      const st = F[style] || F.panel;
      const tex = tm.createCanvas(key, w, h), ctx = tex.getContext();
      const o = Math.min(L.frame.outline, Math.floor(w / 4), Math.floor(h / 4));
      const b = Math.min(L.frame.bevel, Math.floor((w - 2 * o) / 3), Math.floor((h - 2 * o) / 3));
      ctx.fillStyle = e || hex(st.out);
      if (L.frame.notch) { ctx.fillRect(o, 0, w - 2 * o, h); ctx.fillRect(0, o, w, h - 2 * o); }
      else ctx.fillRect(0, 0, w, h);
      const iw = w - 2 * o, ih = h - 2 * o;
      ctx.fillStyle = hex(st.lo); ctx.fillRect(o, o, iw, ih);
      ctx.fillStyle = hex(st.hi); ctx.fillRect(o, o, iw - b, ih - b);
      ctx.fillStyle = hex(st.fill); ctx.fillRect(o + b, o + b, iw - 2 * b, ih - 2 * b);
      tex.refresh();
      tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      return key;
    },

    // A framed box. Top-left at (x, y) like the old rectangles with setOrigin(0).
    // Styles: panel, hud, inset, slot, tooltip, paper, btn, hot, tab, tabOn (data/look.js).
    // box.restyle(style, edge) swaps its look (for hover / selected).
    panel(scene, x, y, w, h, style = 'panel', edge) {
      const img = scene.add.image(x, y, FUP.ui.frameKey(scene, style, w, h, edge)).setOrigin(0);
      img.restyle = (s = style, e) => { if (img.active) img.setTexture(FUP.ui.frameKey(scene, s, w, h, e)); return img; };
      return img;
    },

    // A dark see-through layer over the whole screen that blocks clicks underneath.
    // The window opened right after it rises and fades in (FUP.fx.popOpen).
    shade(scene, alpha = S.shadeAlpha) {
      const r = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, num(S.shade), alpha).setOrigin(0).setInteractive();
      if (FUP.fx) FUP.fx.popOpen(scene, r);
      return r;
    },

    // A Blender sprite if it exists, otherwise the emoji (so nothing breaks
    // before its art is made). Both are centred on (x, y).
    // A scale for a Blender sprite, in old-art units (2 = the usual size), whatever resolution the art is
    artScale(s) { return s / (FUP.spriteRes || 1); },

    sprite(scene, x, y, key, emoji = '❓', emojiSize = 32, scale = FUP.ui.pixelScale) {
      if (key && scene.textures.exists(key)) return scene.add.image(x, y, key).setScale(FUP.ui.artScale(scale));
      return scene.add.text(x, y, emoji, { fontSize: emojiSize + 'px' }).setOrigin(0.5);
    },

    // Plain text in the game font.
    text(scene, x, y, str, size = 18, color = FUP.ui.colors.ink, extra = {}) {
      return scene.add.text(x, y, str, {
        fontFamily: FUP.ui.font, fontSize: size + 'px', color, resolution: 2, ...extra,
      });
    },

    // A small speaker button that turns all sound on/off (same as the M key).
    muteButton(scene, x, y, fixed = false) {
      const icon = () => FUP.audio.muted ? '🔇' : '🔊';
      const t = scene.add.text(x, y, icon(), { fontSize: '20px' }).setOrigin(0.5).setDepth(20000)
        .setInteractive({ useHandCursor: true });
      if (fixed) t.setScrollFactor(0);
      t.on('pointerdown', () => FUP.audio.toggleMute());
      const update = () => { if (t.active) t.setText(icon()); };
      FUP.audio.onMuteChange = update;
      scene.events.once('shutdown', () => { if (FUP.audio.onMuteChange === update) FUP.audio.onMuteChange = null; });
      return t;
    },

    // The picture key for an ingredient id, or for a cooked dish.
    ingKey(id) { return 'ing_' + id; },

    // A clickable button. Returns an object with setEnabled() and destroy().
    // opts.icon = a sprite key drawn on the left. opts.hot = the main choice (gold).
    button(scene, x, y, w, h, label, onClick, opts = {}) {
      const c = FUP.ui.colors;
      const up = opts.hot ? 'hot' : 'btn', over = opts.hot ? 'hotHover' : 'btnHover';
      const rect = FUP.ui.panel(scene, x, y, w, h, up);
      const hasIcon = opts.icon && scene.textures.exists(opts.icon);
      const pad = hasIcon ? 30 : 0;
      const ink = opts.color || hex(opts.hot ? L.buttonText.hot : L.buttonText.normal);
      const ty = y + h / 2 - 1;
      const txt = FUP.ui.text(scene, x + (w + pad) / 2, ty, label, opts.size || 18, ink, {
        align: 'center', wordWrap: { width: w - 14 - pad }, lineSpacing: 2,
      }).setOrigin(0.5);
      const icon = hasIcon ? scene.add.image(x + 20, y + h / 2, opts.icon).setScale(FUP.ui.artScale(opts.iconScale || 1.5)) : null;

      const b = { rect, txt, icon, enabled: true };
      const press = (down) => { txt.y = ty + (down ? L.pressDepth : 0); if (icon) icon.y = y + h / 2 + (down ? L.pressDepth : 0); };
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerover', () => { if (b.enabled) rect.restyle(over); });
      rect.on('pointerout', () => { rect.restyle(up); press(false); });
      rect.on('pointerup', () => { if (b.enabled) rect.restyle(over); press(false); });
      // Small delay so a button can safely rebuild the menu it lives in.
      rect.on('pointerdown', () => {
        if (!b.enabled) return;
        rect.restyle('btnDown'); press(true);
        FUP.audio.sfx('click'); scene.time.delayedCall(1, onClick);
      });

      b.setEnabled = (on) => {
        if (b.enabled === on) return;
        b.enabled = on;
        const a = on ? 1 : L.disabledAlpha;
        rect.setAlpha(a); txt.setAlpha(a); if (icon) icon.setAlpha(a);
        if (!on) { rect.restyle(up); press(false); }
      };
      b.destroy = () => { rect.destroy(); txt.destroy(); if (icon) icon.destroy(); };
      return b;
    },

    // A row of tabs. labels = ['Buy', 'Sell']; active = index; onPick(i).
    // Returns the list of game objects (to add to a group / destroy).
    tabs(scene, x, y, labels, active, onPick, opts = {}) {
      const h = opts.h || 30, gap = 4, size = opts.size || 15, out = [];
      let cx = x;
      labels.forEach((label, i) => {
        const w = opts.w || Math.max(70, label.length * size * 0.62 + 28), on = i === active;
        const r = FUP.ui.panel(scene, cx, y + (on ? 0 : 3), w, h - (on ? 0 : 3), on ? 'tabOn' : 'tab');
        const t = FUP.ui.text(scene, cx + w / 2, y + h / 2 + (on ? 0 : 2), label, size, on ? FUP.ui.colors.accent : FUP.ui.colors.dim).setOrigin(0.5);
        if (!on) { r.setInteractive({ useHandCursor: true }); r.on('pointerdown', () => { FUP.audio.sfx('click'); scene.time.delayedCall(1, () => onPick(i)); }); }
        out.push(r, t); cx += w + gap;
      });
      return out;
    },

    // A square item slot (sunken box). selected = gold edge.
    slot(scene, x, y, size, selected = false) {
      return FUP.ui.panel(scene, x, y, size, size, 'slot', selected ? FUP.ui.colors.select : undefined);
    },

    // A tooltip: a dark framed box sized to its text. Returns a container at (x, y) top-left.
    tooltip(scene, x, y, str, opts = {}) {
      const pad = 8;
      const t = FUP.ui.text(scene, pad, pad - 1, str, opts.size || 14, opts.color || FUP.ui.colors.ink, { wordWrap: { width: opts.width || 260 }, lineSpacing: 3 });
      const bg = FUP.ui.panel(scene, 0, 0, t.width + pad * 2, t.height + pad * 2, 'tooltip', opts.edge);
      return scene.add.container(x, y, [bg, t]);
    },

    // On-screen joystick: press anywhere on empty ground and drag (finger or mouse).
    // Read stick.dx / stick.dy (-1..1). allow() = false blocks it (e.g. a shop is open).
    joystick(scene, allow = () => true) {
      const R = 50, ink = num(T.ink);
      const base = scene.add.circle(0, 0, R, num(S.shade), 0.3).setStrokeStyle(3, ink, 0.5).setScrollFactor(0).setDepth(15000).setVisible(false);
      const knob = scene.add.circle(0, 0, 22, ink, 0.6).setScrollFactor(0).setDepth(15001).setVisible(false);
      const j = { dx: 0, dy: 0, id: null };
      const down = (p, over) => {
        if (j.id !== null || (over && over.length) || !allow()) return;
        j.id = p.id; j.ox = p.x; j.oy = p.y;
        base.setPosition(p.x, p.y).setVisible(true); knob.setPosition(p.x, p.y).setVisible(true);
      };
      const move = p => {
        if (p.id !== j.id) return;
        let vx = p.x - j.ox, vy = p.y - j.oy;
        const len = Math.hypot(vx, vy);
        if (len > R) { vx *= R / len; vy *= R / len; }
        knob.setPosition(j.ox + vx, j.oy + vy);
        j.dx = len > 8 ? vx / R : 0; j.dy = len > 8 ? vy / R : 0;
      };
      const up = p => { if (p.id !== j.id) return; j.id = null; j.dx = j.dy = 0; base.setVisible(false); knob.setVisible(false); };
      scene.input.on('pointerdown', down); scene.input.on('pointermove', move);
      scene.input.on('pointerup', up); scene.input.on('pointerupoutside', up);
      scene.events.once('shutdown', () => {
        scene.input.off('pointerdown', down); scene.input.off('pointermove', move);
        scene.input.off('pointerup', up); scene.input.off('pointerupoutside', up);
      });
      return j;
    },

    // True on phones/tablets (touch screen).
    isTouch(scene) { return !!scene.sys.game.device.input.touch; },

    // The fill picture for a bar: the colour with a lighter strip on top.
    barKey(scene, color, w, h) {
      const col = typeof color === 'number' ? color : num(color);
      const key = `barfill_${col.toString(16)}_${w}x${h}`;
      if (scene.textures.exists(key)) return key;
      const tex = scene.textures.createCanvas(key, w, h), ctx = tex.getContext();
      ctx.fillStyle = '#' + col.toString(16).padStart(6, '0'); ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `rgba(255,255,255,${B.shine})`; ctx.fillRect(0, 0, w, Math.max(1, Math.floor(h / 3)));
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, h - Math.max(1, Math.floor(h / 5)), w, Math.max(1, Math.floor(h / 5)));
      tex.refresh(); tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      return key;
    },

    // A horizontal bar (HP, XP, turn gauge, Limit). Call .set(0 to 1) and .color(c).
    bar(scene, x, y, w, h, color) {
      w = Math.round(w); h = Math.round(h);
      const key = 'barbg_' + w + 'x' + h;
      if (!scene.textures.exists(key)) {
        const tex = scene.textures.createCanvas(key, w, h), ctx = tex.getContext();
        ctx.fillStyle = hex(B.frame); ctx.fillRect(1, 0, w - 2, h); ctx.fillRect(0, 1, w, h - 2);
        ctx.fillStyle = hex(B.empty); ctx.fillRect(2, 2, w - 4, h - 4);
        tex.refresh(); tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      const bg = scene.add.image(x, y, key).setOrigin(0);
      const fw = Math.max(1, w - 4), fh = Math.max(1, h - 4);
      const fill = scene.add.image(x + 2, y + 2, FUP.ui.barKey(scene, color, fw, fh)).setOrigin(0);
      return {
        bg, fill,
        set(ratio) { fill.scaleX = Math.max(0, Math.min(1, ratio)); },
        color(col) { if (fill.active) fill.setTexture(FUP.ui.barKey(scene, col, fw, fh)); },
      };
    },

    // ---------- Snap a sprite to the palette (data/look.js snapSprites) ----------
    _palRgb: null,
    snapTexture(scene, key) {
      const tm = scene.textures, src = tm.get(key).getSourceImage();
      const w = src.width, h = src.height;
      if (!w || !h) return;
      if (!this._palRgb) this._palRgb = Object.values(P).map(h2 => [parseInt(h2.slice(1, 3), 16), parseInt(h2.slice(3, 5), 16), parseInt(h2.slice(5, 7), 16)]);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(src, 0, 0);
      const img = ctx.getImageData(0, 0, w, h), d = img.data, cache = this._snapCache || (this._snapCache = new Map());
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
        let best = cache.get(k);
        if (!best) {
          let bd = Infinity;
          for (const c of this._palRgb) {   // "redmean" distance: close to how eyes compare colours
            const rm = (d[i] + c[0]) / 2, dr = d[i] - c[0], dg = d[i + 1] - c[1], db = d[i + 2] - c[2];
            const dist = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
            if (dist < bd) { bd = dist; best = c; }
          }
          cache.set(k, best);
        }
        d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2];
      }
      ctx.putImageData(img, 0, 0);
      tm.remove(key);
      tm.addCanvas(key, cv).setFilter(Phaser.Textures.FilterMode.NEAREST);
    },
  };
})();
