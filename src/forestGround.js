// ============================================================
// GROUND PAINTER — paints a map's floor once, pixel by pixel, straight
// from its map letters (Forest areas and the village use it).
// Only palette colours (data/look.js): shadows step down to a darker
// palette colour instead of being tinted.
// What it draws:
//   grass in soft patches (dithered borders), shaped tufts / flowers /
//   pebbles / leaves, a darker floor under tree walls with a shadow below,
//   building shadows, paths (cobbles or dirt) with a dark lip on the top
//   edge, water with depth, a dark bank, foam and a muddy shore.
// The picture is made once per area and reused.
// ============================================================
window.FUP = window.FUP || {};

FUP.forestGround = {
  KEY: 'forest_ground',

  // Smooth random numbers ("value noise"). Same input = same output, so the map never flickers.
  hash(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); },
  noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf), h = this.hash.bind(this);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  },
  fbm(x, y) { return this.noise(x, y) * 0.55 + this.noise(x * 2.1, y * 2.1) * 0.3 + this.noise(x * 4.3, y * 4.3) * 0.15; },
  bayer: [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],   // 4x4 ordered dither

  rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; },

  // For any colour: the palette colour that reads as "the same, in shadow".
  _dark: null,
  darker(c) {
    if (!this._dark) this._dark = new Map();
    const key = (c[0] << 16) | (c[1] << 8) | c[2];
    if (this._dark.has(key)) return this._dark.get(key);
    const lum = q => q[0] * 0.3 + q[1] * 0.59 + q[2] * 0.11;
    const want = c.map(v => v * 0.68), L0 = lum(c);
    let best = [0, 0, 0], bd = Infinity;
    for (const hex of Object.values(FUP.look.palette)) {
      const q = this.rgb(hex);
      if (lum(q) >= L0 * 0.9) continue;
      const d = (q[0] - want[0]) ** 2 + (q[1] - want[1]) ** 2 + (q[2] - want[2]) ** 2;
      if (d < bd) { bd = d; best = q; }
    }
    this._dark.set(key, best);
    return best;
  },

  // For any colour: the palette colour that reads as "the same, in sunlight" (hill tops, v0.66).
  _light: null,
  lighter(c) {
    if (!this._light) this._light = new Map();
    const key = (c[0] << 16) | (c[1] << 8) | c[2];
    if (this._light.has(key)) return this._light.get(key);
    const lum = q => q[0] * 0.3 + q[1] * 0.59 + q[2] * 0.11;
    const want = c.map(v => Math.min(255, v * 1.22 + 6)), L0 = lum(c);
    let best = c, bd = Infinity;
    for (const hex of Object.values(FUP.look.palette)) {
      const q = this.rgb(hex);
      if (lum(q) <= L0 * 1.05) continue;
      const d = (q[0] - want[0]) ** 2 + (q[1] - want[1]) ** 2 + (q[2] - want[2]) ** 2;
      if (d < bd) { bd = d; best = q; }
    }
    this._light.set(key, best);
    return best;
  },

  // Returns the texture key. Draw it with scene.add.image(0, 0, key).setOrigin(0).setScale(2).
  // The village uses this too: make(scene, FUP.villageMap, FUP.villageData.ground, 'village_ground').
  // The Forest passes each area's own colours and key (see FUP.forest.ground()).
  make(scene, F = FUP.forest, G = FUP.forestData.ground, KEY = this.KEY) {
    if (scene.textures.exists(KEY)) return KEY;
    const S = G.pixelsPerSquare, M = FUP.look.map;
    const TW = F.width(), TH = F.height(), W = TW * S, H = TH * S;

    // One number per square: 1 if it's path / water / tree / building, else 0.
    const layer = test => { const a = new Float32Array(TW * TH); for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) a[y * TW + x] = test(F.tileAt(x, y)) ? 1 : 0; return a; };
    const pathC = G.pathChars || '=', waterC = G.waterChars || '~';
    const pathL = layer(c => pathC.includes(c)), waterL = layer(c => waterC.includes(c));
    const treeL = layer(c => c === '#'), houseL = layer(c => c === 'b');
    // Blend between square centres, so edges come out round.
    const sample = (a, fx, fy) => {
      const gx = fx - 0.5, gy = fy - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), tx = gx - x0, ty = gy - y0;
      const at = (x, y) => a[Math.min(TH - 1, Math.max(0, y)) * TW + Math.min(TW - 1, Math.max(0, x))];
      const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx, bot = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
      return top * (1 - ty) + bot * ty;
    };

    const C = k => (G[k] === undefined ? null : (Array.isArray(G[k]) ? G[k].map(h => this.rgb(h)) : this.rgb(G[k])));
    const grass = C('grass'), dirt = C('dirt'), water = C('water') || C('dirt'), flowers = C('flowers') || [C('grassTuft')];
    const tuft = C('grassTuft'), dirtEdge = C('dirtEdge'), pebble = C('pebble'), shore = C('shore') || dirtEdge;
    const sparkle = C('sparkle') || tuft, foam = C('foam') || sparkle, bank = C('bank') || this.rgb(FUP.look.hex('k0'));
    const floor = C('floor') || grass[0];
    const cliff = C('cliff');   // [dark, mid, light, stone]: the raised plateau's cliff face (v0.65), or none
    const CF = M.cliff, faceH = Math.round(CF.height * S), faceT = CF.height;
    // Hills you climb (src/systems/hills.js): plateau tops, cliff faces, side edges, stairs
    const hillRegion = F.hillRegion && FUP.hills ? F.hillRegion() : null;
    const hillAt = hillRegion && FUP.hills.list(hillRegion).length ? (tx, ty) => FUP.hills.at(hillRegion, tx, ty) : null;
    const rock = cliff || [this.rgb(FUP.look.hex('k1')), this.rgb(FUP.look.hex('s1')), this.rgb(FUP.look.hex('s2')), this.rgb(FUP.look.hex('s3'))];
    const cobble = G.pathStyle === 'cobble', CW = M.cobble.w, CH = M.cobble.h;
    const lip = M.lipPixels / S, bankH = M.bankPixels / S, reach = M.shadowReach, dith = M.ditherStrength;

    const tex = scene.textures.createCanvas(KEY, W, H);
    const ctx = tex.getContext(), img = ctx.createImageData(W, H), out = img.data;
    const kind = new Uint8Array(W * H);   // 0 grass, 1 path, 2 water/shore, 3 tree floor, 4 cliff face
    const put = (x, y, col) => { const i = (y * W + x) * 4; out[i] = col[0]; out[i + 1] = col[1]; out[i + 2] = col[2]; out[i + 3] = 255; };

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const fx = x / S, fy = y / S;
        const wob = (this.noise(x * 0.09, y * 0.09) - 0.5) * G.edgeWobble * 2;
        const p = sample(pathL, fx + wob, fy - wob);
        const w = sample(waterL, fx - wob * 0.7, fy + wob * 0.7);
        const d = (this.bayer[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * dith;   // ordered dither
        const r = this.hash(x, y);
        let col, k = 0;

        if (w > 0.5) {                                        // water: darker in the middle
          k = 2;
          const depth = (w - 0.5) * 2 + d;
          col = water[depth > 0.62 ? 0 : depth > 0.28 ? 1 : 2];
          if (sample(waterL, fx - wob * 0.7, fy - bankH + wob * 0.7) <= 0.5) col = bank;   // land drops into the water here
          else if (w < 0.56 && this.hash(x >> 1, y) > 0.35) col = foam;                     // foam along the edge
          else if (r > 0.994 && depth < 0.8) col = sparkle;
        } else if (w > 0.42) {                                // muddy shore
          k = 2; col = shore;
        } else if (p > 0.5) {                                 // path
          k = 1;
          if (cobble) {
            // Brick-pattern cobblestones: gaps in the edge colour, a light corner, a dark corner
            const row = Math.floor(y / CH), off = (row & 1) ? CW >> 1 : 0, cx = (x + off) % CW, cy = y % CH;
            const stone = this.hash(Math.floor((x + off) / CW) * 7.1, row * 3.3);
            if (cx === 0 || cy === 0) col = dirtEdge;
            else if (cx === 1 && cy === 1) col = dirt[2];
            else if (cx === CW - 1 && cy === CH - 1) col = dirt[0];
            else col = dirt[stone < 0.35 ? 0 : stone < 0.8 ? 1 : 2];
          } else {
            // Packed dirt in patches, with the odd pebble (and its shadow)
            const n = this.fbm(x * 0.05, y * 0.05) + d;
            col = dirt[n < 0.42 ? 0 : n < 0.62 ? 1 : 2];
            if (r > 0.985) col = pebble;
            else if (this.hash(x, y - 1) > 0.985) col = dirt[0];
          }
          if (p < 0.55) col = dirtEdge;                                            // rim
          else if (sample(pathL, fx + wob, fy - lip - wob) <= 0.5) col = this.darker(col);  // grass lip shadow on the top edge
        } else {                                              // grass
          const n = this.fbm(x * 0.03, y * 0.03) + d;
          col = grass[n < 0.38 ? 0 : n < 0.52 ? 1 : n < 0.64 ? 2 : 3];
          const t = sample(treeL, fx - wob * 1.4, fy + wob * 1.4);   // wobbly, not square, tree-wall edges
          if (t > 0.5 + d) {                                                       // forest floor under tree walls
            col = floor; k = 3;
            const tAt = (ox, oy) => sample(treeL, fx - wob * 1.4 + ox, fy + wob * 1.4 + oy);
            if (cliff && tAt(0, faceT) <= 0.5 + d) {
              // Cliff face: how many map pixels above the plateau's south edge is this pixel?
              let dd = faceH;
              for (let s = 1; s <= faceH; s++) if (tAt(0, s / S) <= 0.5 + d) { dd = s; break; }
              k = 4;
              const band = Math.floor((y + this.noise(x * 0.15, y * 0.05) * 3) / CF.band);
              if (dd > faceH - CF.lip) col = (dd === faceH - CF.lip + 1) ? grass[1] : grass[2];        // grass lip hanging over the top
              else if (dd === faceH - CF.lip) col = cliff[0];                                           // dark line under the lip
              else {
                // Rock blocks in layers: each block lit on its left and top, dark crack on its right and bottom
                const off = (band * 7) % CF.block, bx = (x + off) % CF.block, by = (y + Math.floor(this.noise(x * 0.15, y * 0.05) * 3)) % CF.band;
                const blk = this.hash(Math.floor((x + off) / CF.block), band);
                col = blk < 0.3 ? cliff[3] : (band & 1) ? cliff[1] : cliff[2];
                if (bx === CF.block - 1 || by === CF.band - 1) col = cliff[0];                         // cracks between blocks
                else if (bx === 0 || by === 0) col = blk < 0.3 ? cliff[2] : cliff[blk < 0.65 ? 2 : 3];  // lit edges
                if (dd > faceH * 0.55 && bx !== CF.block - 1 && by !== CF.band - 1 && blk > 0.85) col = grass[0];   // moss near the top
                if (dd <= 4) col = this.darker(col);                                                    // darker at the foot
                if (dd <= 2) col = cliff[0];
                if (this.hash(x >> 2, y >> 2) > 0.94 && dd > 3) col = grass[0];                         // a tuft clinging on
              }
            } else if (cliff && (tAt(-0.12, 0) <= 0.5 + d || tAt(0.12, 0) <= 0.5 + d)) {
              col = this.darker(floor);                                                                 // the plateau's side edges
            }
          }
          else if (p > 0.46 && sample(pathL, fx + wob, fy + lip - wob) > 0.5) col = tuft;   // raised lip above a path
          else if (p > 0.44) col = grass[0];                                       // darker rim beside paths
          // Shadows cast downward by trees and buildings
          if (k === 0 && cliff && sample(treeL, fx, fy - CF.shade) > 0.5) col = this.darker(col);   // deep shade at a cliff's foot
          if (k === 0 && (sample(treeL, fx, fy - reach) > 0.5 || sample(houseL, fx - reach * 0.4, fy - reach) > 0.5 && sample(houseL, fx, fy) < 0.5)) col = this.darker(col);
        }
        if (hillAt) {
          const tx = Math.floor(fx), ty = Math.floor(fy), hc = hillAt(tx, ty), lx = x - tx * S, ly = y - ty * S;
          if (hc.top) {
            const stone = (bx, by, band) => {           // one pixel of a rock block wall
              const blk = this.hash(Math.floor(bx / CF.block), band);
              let c = blk < 0.3 ? rock[3] : (band & 1) ? rock[1] : rock[2];
              if (bx % CF.block === CF.block - 1 || by % CF.band === CF.band - 1) c = rock[0];
              else if (bx % CF.block === 0 || by % CF.band === 0) c = blk < 0.65 ? rock[2] : rock[3];
              return c;
            };
            const steps = (along, across, n) => {       // stairs: lit tread, dark riser, darker rails
              if (across < 3 || across > n - 4) return across === 0 || across === n - 1 ? rock[0] : rock[1];
              const st = along % 5;
              return st === 0 ? rock[3] : st === 4 ? rock[0] : rock[2];
            };
            if (hc.edge === 'face') {
              k = 4;
              if (hc.stair) col = steps(ly, lx, S);
              else if (ly < CF.lip) col = this.lighter(grass[2]);                                        // grass lip of the top
              else if (ly === CF.lip) col = rock[0];
              else {
                const band = Math.floor((y + (this.hash(tx, 3) * 4 | 0)) / CF.band), off = (band * 7) % CF.block;
                col = stone(x + off, y, band);
                if (ly < S * 0.45 && this.hash(x >> 1, band * 3) > 0.9) col = grass[1];                  // moss near the top
                if (ly >= S - 4) col = this.darker(col);
                if (ly >= S - 2) col = rock[0];
              }
            } else {
              // Top of the hill (and its side / back edges): sunlit, a step lighter per level
              if (k === 0) col = this.lighter(col);
              if (hc.edge === 'west' || hc.edge === 'east') {
                const out = hc.edge === 'west' ? lx : S - 1 - lx;                                       // pixels from the drop
                if (hc.stair) { col = steps(lx, ly, S); k = 4; }
                else if (out < 5) { k = 4; col = out === 0 ? rock[0] : hc.edge === 'west' ? stone(y, x, Math.floor(x / 3)) : this.darker(stone(y, x, Math.floor(x / 3))); }
                else if (out === 5) col = this.darker(col);
              } else if (hc.edge === 'back') {
                if (hc.stair) { col = steps(ly, lx, S); k = 4; }
                else if (ly < 2) { col = rock[0]; k = 4; }                                               // the drop behind
                else if (ly === 2) col = this.darker(col);
              }
            }
          } else if (k === 0 || k === 1) {
            // Shade on low ground: below a cliff face, and east of a hill's east edge
            const above = hillAt(tx, ty - 1), left = hillAt(tx - 1, ty);
            if (above.edge === 'face' && !above.stair && ly < S * 0.45) col = this.darker(ly < S * 0.2 ? this.darker(col) : col);
            else if (left.edge === 'east' && !left.stair && lx < S * 0.3) col = this.darker(col);
          }
        }
        kind[y * W + x] = k;
        put(x, y, col);
      }
    }

    // ---------- Shaped details on grass: tufts, flower clumps, pebbles, leaves ----------
    const det = G.detail || { tuft: 0.4, flower: 0.08, pebble: 0.04, leaf: 0 };
    const grassAt = (x, y) => x >= 0 && y >= 0 && x < W && y < H && kind[y * W + x] === 0;
    const stamp = (x0, y0, pix) => { for (const [dx, dy, c] of pix) if (grassAt(x0 + dx, y0 + dy)) put(x0 + dx, y0 + dy, c); };
    for (let ty = 0; ty < TH; ty++) {
      for (let tx = 0; tx < TW; tx++) {
        if (F.tileAt(tx, ty) !== '.' && F.tileAt(tx, ty) !== 'P') continue;
        for (let s = 0; s < 3; s++) {
          const h = k => this.hash(tx * 13.7 + s * 3.1 + k, ty * 7.3 + s * 5.9 + k * 2.2);
          const x0 = tx * S + 3 + Math.floor(h(1) * (S - 6)), y0 = ty * S + 3 + Math.floor(h(2) * (S - 6));
          const base = grassAt(x0, y0 + 1) ? this.darker(grass[1]) : grass[0];
          const roll = h(3);
          if (roll < det.tuft / 3) {
            stamp(x0, y0, [[-1, 0, tuft], [1, 0, tuft], [0, -1, tuft], [0, 0, grass[3]], [-1, 1, base], [0, 1, base], [1, 1, base]]);
          } else if (roll < (det.tuft + det.flower) / 3 && s === 0) {
            const fc = flowers[Math.floor(h(4) * flowers.length)];
            const centre = this.rgb(FUP.look.hex('y2'));
            for (const [ox, oy] of [[0, 0], [3, 1], [1, 3]]) stamp(x0 + ox, y0 + oy, [[0, -1, fc], [-1, 0, fc], [1, 0, fc], [0, 1, fc], [0, 0, centre], [0, 2, base]]);
          } else if (roll < (det.tuft + det.flower + det.pebble) / 3 && s === 1) {
            stamp(x0, y0, [[0, 0, pebble], [1, 0, pebble], [0, 1, this.darker(pebble)], [1, 1, this.darker(pebble)], [0, 2, base], [1, 2, base]]);
          } else if (roll < (det.tuft + det.flower + det.pebble + det.leaf) / 3) {
            const lc = flowers[Math.floor(h(5) * flowers.length)];
            stamp(x0, y0, [[0, 0, lc], [1, 0, lc], [1, 1, this.darker(lc)], [3, 2, lc], [4, 2, this.darker(lc)]]);
          }
        }
      }
    }

    ctx.putImageData(img, 0, 0);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return KEY;
  },
};
