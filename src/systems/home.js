// ============================================================
// HOME RULES — builds the room map for the house you own. No drawing.
//   FUP.home.build()     makes FUP.homeMap for your best house and sizes
//                        placement zone 'home' to its floor
//   FUP.home.tidy()      furniture that no longer fits (old saves) goes back to you
//   FUP.home.fixture(id) where a fixture sits on the room map: { tx, ty, w, h }
// Numbers in data/home.js. Drawing in src/scenes/HouseScene.js.
// ============================================================
window.FUP = window.FUP || {};

FUP.home = {
  room() { return FUP.homeData.rooms[Math.min(FUP.house.state.houses, FUP.homeData.rooms.length - 1)]; },

  // Room map: walls round the floor, fixtures stamped in, a door in the bottom wall
  build() {
    const D = FUP.homeData, r = this.room(), top = D.wallRows;
    const w = r.w + 2, h = r.h + top + 1;
    const rows = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) row.push(x === 0 || x === w - 1 || y < top || y === h - 1 ? '#' : '.');
      rows.push(row);
    }
    this.spots = {};
    for (const f of D.fixtures) {
      const fx = f.at === 'right' ? r.w - f.tx - f.w : f.tx;
      const at = { tx: 1 + fx, ty: top + f.ty, w: f.w, h: f.h };
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) rows[at.ty + y][at.tx + x] = f.char;
      this.spots[f.id] = at;
    }
    const doorX = Math.floor(w / 2);
    rows[h - 1][doorX] = D.doorChar;
    rows[h - 2][doorX] = D.matChar;
    this.door = { tx: doorX, ty: h - 1 };

    const T = FUP.villageData.tileSize, grid = rows.map(r => r.join(''));
    FUP.homeMap = {
      rows: grid,
      width: () => w, height: () => h,
      tileAt: (x, y) => (y >= 0 && y < h && x >= 0 && x < w) ? grid[y][x] : '#',
      blockedTile(x, y) { return !D.walk.includes(this.tileAt(x, y)); },
      blockedBox(x, y, half) {
        for (let ty = Math.floor((y - half) / T); ty <= Math.floor((y + half) / T); ty++)
          for (let tx = Math.floor((x - half) / T); tx <= Math.floor((x + half) / T); tx++)
            if (this.blockedTile(tx, ty)) return true;
        return false;
      },
      center: (x, y) => ({ x: x * T + T / 2, y: y * T + T / 2 }),
    };
    // Placement zone 'home' = the floor of this room (data/place.js)
    const z = FUP.placeData.zones.home;
    z.where = { region: 'home', tx: 1, ty: top };
    z.w = r.w; z.h = r.h;
    return FUP.homeMap;
  },

  fixture(id) { return this.spots && this.spots[id]; },

  // Anything placed that doesn't fit the room any more goes back into your pocket (never lost)
  tidy() {
    const P = FUP.place;
    for (const p of P.list('home').slice()) if (!P.canPut(p.item, 'home', p.tx, p.ty, p.uid)) P.take(p.uid);
  },
};
