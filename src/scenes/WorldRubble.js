// ============================================================
// WORLD RUBBLE (v1.19, plans/GL3.md) — the Western Ruins' crumbling walls (extra functions for WorldScene).
// Map squares 'w' (data/region_west.js) are street under a crumbling wall. Each stretch of `chunk`
// squares in a row is one wall: step in, dust shakes loose (the warning), and `delay` seconds later
// rubble falls on that stretch. Still there? You lose `damage` x max HP (never below 1).
// Same idea as the Vault's tipping shelves (src/scenes/RaidScene.js). Numbers: the area's `rubble`.
// ============================================================
Object.assign(WorldScene.prototype, {

  drawRubble() {
    this.rubble = []; this.rubbleAt = {}; this.rubbleT = 0; this.rubbleSafe = 0;
    const R = this.info.rubble, F = this.tiles;
    if (!R || this.scene.key !== 'World') return;
    for (let ty = 0; ty < F.height(); ty++) {
      let run = [];
      const flush = () => {
        while (run.length) {
          const part = run.splice(0, R.chunk);
          const wall = { squares: part, state: 'idle', t: 0, g: this.add.graphics().setDepth(-2) };
          this.rubble.push(wall);
          for (const q of part) this.rubbleAt[q.tx + ',' + q.ty] = wall;
        }
      };
      for (let tx = 0; tx < F.width(); tx++) { if (F.tileAt(tx, ty) === 'w') run.push({ tx, ty }); else flush(); }
      flush();
    }
    // Columns too: a vertical stretch of 'w' whose squares aren't already in a row stretch
    for (let tx = 0; tx < F.width(); tx++) {
      let run = [];
      const flush = () => {
        if (run.length) {
          for (let k = 0; k < run.length; k += R.chunk) {
            const part = run.slice(k, k + R.chunk);
            const wall = { squares: part, state: 'idle', t: 0, g: this.add.graphics().setDepth(-2) };
            this.rubble.push(wall);
            for (const q of part) this.rubbleAt[q.tx + ',' + q.ty] = wall;
          }
        }
        run = [];
      };
      for (let ty = 0; ty < F.height(); ty++) {
        const lone = F.tileAt(tx, ty) === 'w' && F.tileAt(tx - 1, ty) !== 'w' && F.tileAt(tx + 1, ty) !== 'w';
        if (lone) { const old = this.rubbleAt[tx + ',' + ty]; if (old) { old.g.destroy(); this.rubble.splice(this.rubble.indexOf(old), 1); } run.push({ tx, ty }); } else flush();
      }
      flush();
    }
    this.rubble.forEach(w => this.drawRubbleWall(w));
  },

  // Idle: cracked paving. Shaking: red dust. Down: a heap of rubble.
  drawRubbleWall(w) {
    const T = FUP.forestData.tileSize, g = w.g, N = FUP.look.num;
    g.clear();
    for (const q of w.squares) {
      const x = q.tx * T, y = q.ty * T;
      if (w.state === 'idle') {
        g.lineStyle(2, N('k1'), 0.55);
        g.lineBetween(x + 6, y + 10, x + T / 2, y + T / 2); g.lineBetween(x + T / 2, y + T / 2, x + T - 8, y + 14);
        g.lineBetween(x + T / 2, y + T / 2, x + T / 2 - 5, y + T - 6);
      } else if (w.state === 'shake') {
        g.fillStyle(N('r2'), 0.22 + 0.18 * Math.sin(this.rubbleT * 30)); g.fillRect(x, y, T, T);
        g.fillStyle(N('s3'), 0.7); for (let k = 0; k < 3; k++) g.fillRect(x + 6 + k * 12, y + 4 + ((this.rubbleT * 60 + k * 9) % (T - 8)), 3, 3);   // dust trickling
      } else {
        for (let k = 0; k < 5; k++) { g.fillStyle(N(k % 2 ? 's2' : 's1'), 1); g.fillRect(x + 3 + k * 7, y + 10 + (k % 3) * 8, 10, 9); }
      }
    }
  },

  updateRubble(dt) {
    if (!this.rubble || !this.rubble.length) return;
    const R = this.info.rubble, T = FUP.forestData.tileSize;
    this.rubbleT += dt;
    const here = this.rubbleAt[Math.floor(this.player.x / T) + ',' + Math.floor(this.player.y / T)];
    if (here && here.state === 'idle') { here.state = 'shake'; here.t = R.delay; FUP.audio.sfx('error'); }
    for (const w of this.rubble) {
      if (w.state === 'idle') continue;
      w.t -= dt;
      if (w.state === 'shake' && w.t <= 0) {
        w.state = 'down'; w.t = R.down;
        FUP.audio.sfx('splat'); FUP.fx.shake(this, 'trap');
        if (here === w && this.rubbleT >= this.rubbleSafe) {
          this.rubbleSafe = this.rubbleT + R.safeSeconds;
          const run = FUP.run, max = run.maxHp(), dmg = Math.max(1, Math.round(max * R.damage));
          run.hp = Math.max(1, run.currentHp() - dmg);   // never below 1 HP, like every hazard
          this.floatText(`-${dmg}`, FUP.ui.colors.bad);
          FUP.audio.sfx('hurt');
          this.say('ruinRubble');
        }
      } else if (w.state === 'down' && w.t <= 0) w.state = 'idle';
      this.drawRubbleWall(w);
    }
  },
});
