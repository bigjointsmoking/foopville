// ============================================================
// HILLS — raised ground you can climb (v0.66). No drawing here.
// A region's data may list hills: { tx, ty, w, h, stairs: [[tx, ty], ...] }
// (in data/forest.js areas, data/region_*.js, data/village.js). Squares are map squares.
//   The hill's border squares are cliffs: you can't stand on them. Its front (bottom) row
//   is the cliff face you see, the sides and back are its edges. The inside is the top.
//   Stairs are border squares you CAN walk on: the only way up or down.
//   A hill inside another hill's top is one level higher.
// Because the border is solid, every "can I stand here?" check (you, enemies, critters,
// click-to-walk, the map tests) respects hills without knowing about heights.
//   FUP.hills.at(region, tx, ty) -> { level, edge, stair } for one square
//     edge: '' (not a border), 'face' (front row), 'west', 'east', 'back'
//   FUP.hills.blocked(region, tx, ty) -> true on a border square that isn't stairs
//   FUP.hills.list(region) -> the region's hills (or [])
// ============================================================
window.FUP = window.FUP || {};

FUP.hills = {
  _cache: {},

  list(region) {
    if (region === 'village') return (FUP.villageData && FUP.villageData.hills) || [];
    const a = FUP.forest && FUP.forest.area(region);
    return (a && a.hills) || [];
  },

  // One grid per region, worked out the first time it's asked for
  grid(region) {
    const list = this.list(region);
    const c = this._cache[region];
    if (c && c.list === list) return c;
    const g = { list, cells: new Map() };
    const key = (x, y) => x + ',' + y;
    // Outer hills first, so a hill on top of another overwrites its squares with a higher level
    const sorted = list.slice().sort((a, b) => b.w * b.h - a.w * a.h);
    for (const hl of sorted) {
      const stairs = new Set((hl.stairs || []).map(([x, y]) => key(x, y)));
      for (let y = hl.ty; y < hl.ty + hl.h; y++) for (let x = hl.tx; x < hl.tx + hl.w; x++) {
        const under = g.cells.get(key(x, y)), base = under ? under.level : 0;
        const bottom = y === hl.ty + hl.h - 1, top = y === hl.ty, left = x === hl.tx, right = x === hl.tx + hl.w - 1;
        const edge = bottom ? 'face' : left ? 'west' : right ? 'east' : top ? 'back' : '';
        // A border square keeps the level of the ground it rises from; the top is one higher
        g.cells.set(key(x, y), { level: edge ? base : base + 1, top: base + 1, edge, stair: stairs.has(key(x, y)) });
      }
    }
    this._cache[region] = g;
    return g;
  },

  at(region, tx, ty) { return this.grid(region).cells.get(tx + ',' + ty) || { level: 0, top: 0, edge: '', stair: false }; },
  blocked(region, tx, ty) {
    const c = this.grid(region).cells.get(tx + ',' + ty);
    return !!(c && c.edge && !c.stair);
  },
  // Map checker (tests/hills.js): each stair on its hill's border (not a corner), at least one per hill
  check(region) {
    const out = [];
    for (const hl of this.list(region)) {
      if (hl.w < 3 || hl.h < 3) out.push(`${region}: hill at ${hl.tx},${hl.ty} is smaller than 3x3`);
      if (!(hl.stairs || []).length) out.push(`${region}: hill at ${hl.tx},${hl.ty} has no stairs`);
      for (const [x, y] of hl.stairs || []) {
        const onX = x === hl.tx || x === hl.tx + hl.w - 1, onY = y === hl.ty || y === hl.ty + hl.h - 1;
        const inside = x >= hl.tx && x < hl.tx + hl.w && y >= hl.ty && y < hl.ty + hl.h;
        if (!inside || !(onX || onY) || (onX && onY)) out.push(`${region}: stairs at ${x},${y} aren't on the hill's side (corners don't count)`);
      }
    }
    return out;
  },
};
