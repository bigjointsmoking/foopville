// ============================================================
// HOME — the inside of your house (v0.68, Jesus: "an actual real house you can
// decorate and interact with"). A room you walk around in, like the village.
// The room is built from the best house you own (data/house.js houses):
// bigger house = bigger room. Things in it (fixtures) are always there; the
// stove and pantry shelf only work once you've bought them from Planksworth.
// Furniture from the Carpenter goes on any free floor square (🔨 Decorate).
// Positions count from the floor's top-left corner (0, 0). PLACEHOLDER sizes.
// ============================================================
window.FUP = window.FUP || {};

FUP.homeData = {
  // Floor size in squares, per house (index = data/house.js houses). Walls go round it.
  rooms: [
    { w: 14, h: 8 },    // Cottage
    { w: 17, h: 8 },    // Stone House
    { w: 20, h: 9 },    // Manor
  ],
  wallRows: 2,          // squares of wall above the floor (the back wall you look at)

  // Fixtures: built into every room. at: 'left' / 'right' = counted from that side of the floor.
  //   char = its letter on the room map (solid, nothing can be built on it)
  fixtures: [
    { id: 'bed',    char: 'B', tx: 0, ty: 0, w: 2, h: 2, at: 'left',  label: '🛏️ Bed' },
    { id: 'chest',  char: 'C', tx: 2, ty: 0, w: 1, h: 1, at: 'left',  label: '🧰 Storage' },
    { id: 'pantry', char: 'P', tx: 2, ty: 0, w: 1, h: 1, at: 'right', label: '🗄️ Pantry' },
    { id: 'stove',  char: 'S', tx: 0, ty: 0, w: 2, h: 1, at: 'right', label: '🔥 Cook' },
  ],
  // The door: bottom wall, middle. The square inside it is a doormat (walkable, nothing built on it).
  doorChar: 'D', matChar: 'd',
  walk: '.dD',          // squares you can walk on

  playerSpeed: 150,     // pixels a second (the village is a bit faster)
  reach: 52,            // how close you must stand to use a fixture

  // Palette keys (data/look.js)
  colors: {
    floor: 'w3', floorLine: 'w2', floorLight: 'w4',
    wall: 'w2', wallTop: 'w1', trim: 'w4', wainscot: 'w1',
    window: 'b3', windowNight: 'b1', frame: 'w5',
    outside: 'k0', mat: 'r2', matEdge: 'r1',
    bedFrame: 'w2', blanket: 'b2', blanketLight: 'b3', pillow: 'k4',
    chest: 'w4', chestBand: 's2', shelf: 'w4', jar: 'y1',
    brick: 'r1', brickLine: 'k1', stoveIron: 's1', stoveTop: 's2', fire: 'y2', coldNook: 'k1',
  },
};
