// ============================================================
// REPAIRS — the run-down village and the Restoration Board (phase R1).
// Each repair: what it costs, what it needs first, what it unlocks,
// and where it sits on the village map (tx = column, ty = row).
//   site:        the squares of the ruin; talk = the square you stand on to repair it
//   ruinTint:    palette colour the building picture is tinted while ruined
//   ruinEmoji:   drawn on each site square while ruined
//   clutter:     weeds and rocks around the ruin (gone once repaired)
//   blockWhenRuined: the site squares can't be walked on until repaired
//   mapWhenDone: map squares that change once repaired ('=' = path)
//   block:       the site squares can't be walked on, ruined or repaired (a building)
//   doneEmoji:   the picture drawn on the site once repaired
//   soon:        shown on the board, can't be started yet (later phases)
// Rules in src/systems/repairs.js. Done = fact 'repair:<id>'.
// ============================================================
window.FUP = window.FUP || {};

FUP.repairData = {
  workSeconds: 2.5,   // hammering time once you've paid
  xpPerCoin: 0.25,    // Building XP = the base coin cost x this
  boardSpot: { tx: 19, ty: 12 },
  list: [
    { id: 'well', name: 'The Well', emoji: '⛲', cost: { coins: 400, items: { plank: 4 } },
      unlocks: 'Fill your watering can here again. And make a wish.', site: { tx: 14, ty: 10, w: 2, h: 1, talk: { tx: 14, ty: 11 } },
      ruinTint: 'k2', ruinEmoji: '🕸️', clutter: [{ tx: 13, ty: 10, emoji: '🌿' }, { tx: 16, ty: 10, emoji: '🪨' }, { tx: 15, ty: 9, emoji: '🌿' }] },
    { id: 'south_road', name: 'The South Road', emoji: '🛤️', req: { facts: { 'repair:well': 1 } }, cost: { coins: 1500, items: { plank: 12 } },
      unlocks: 'The road to the Docks: sea fishing, the Fishmonger\'s shop, fish traps.', site: { tx: 22, ty: 57, w: 1, h: 2, talk: { tx: 22, ty: 56 } },
      ruinEmoji: '🪨', blockWhenRuined: true, mapWhenDone: [{ tx: 22, ty: 57, ch: '=' }, { tx: 22, ty: 58, ch: '=' }, { tx: 22, ty: 59, ch: '=' }],
      clutter: [{ tx: 21, ty: 56, emoji: '🌿' }, { tx: 23, ty: 56, emoji: '🪨' }, { tx: 23, ty: 55, emoji: '🌿' }] },
    // R2 / R3 remove `soon` and add a `site`
    { id: 'east_bridge', name: 'The East Bridge', emoji: '🌉', req: { facts: { 'repair:south_road': 1 }, skills: { building: 5 } }, cost: { coins: 3500, items: { plank: 24 } }, unlocks: 'The Soggy Marsh.',
      site: { tx: 60, ty: 39, w: 1, h: 2, talk: { tx: 59, ty: 39 } }, ruinEmoji: '🚧', blockWhenRuined: true, mapWhenDone: [{ tx: 61, ty: 39, ch: '=' }, { tx: 61, ty: 40, ch: '=' }],
      clutter: [{ tx: 58, ty: 38, emoji: '🪨' }, { tx: 59, ty: 41, emoji: '🌿' }, { tx: 60, ty: 41, emoji: '🪵' }] },
    { id: 'cart_stop', name: 'The Cart Stop', emoji: '🛒', req: { facts: { 'repair:south_road': 1 }, skills: { building: 8 } }, cost: { coins: 2000, items: { plank: 10 } }, unlocks: 'Paid rides to places you\'ve been.', soon: true },
    { id: 'market', name: 'The Market', emoji: '🏬', req: { facts: { 'repair:east_bridge': 1 }, skills: { building: 10 } }, cost: { coins: 6000, items: { plank: 30 } }, unlocks: 'New offers every day. Your stall sells faster.',
      site: { tx: 40, ty: 28, w: 6, h: 2, talk: { tx: 42, ty: 30 } }, ruinEmoji: '🏚️', doneEmoji: '🏬', block: true,
      clutter: [{ tx: 39, ty: 29, emoji: '🪨' }, { tx: 46, ty: 28, emoji: '🌿' }, { tx: 44, ty: 30, emoji: '🪵' }] },
    { id: 'windmill', name: 'The Windmill', emoji: '🌬️', req: { facts: { 'repair:market': 1 }, skills: { building: 14 } }, cost: { coins: 9000, items: { plank: 40 } }, unlocks: 'Flour, and what you can bake with it.',
      site: { tx: 48, ty: 2, w: 3, h: 2, talk: { tx: 49, ty: 4 } }, ruinEmoji: '🏚️', doneEmoji: '🌬️', block: true,
      clutter: [{ tx: 47, ty: 3, emoji: '🌿' }, { tx: 51, ty: 3, emoji: '🪨' }, { tx: 50, ty: 4, emoji: '🌿' }] },
    { id: 'fountain', name: 'The Fountain', emoji: '⛲', req: { facts: { 'repair:well': 1, 'repair:south_road': 1, 'repair:east_bridge': 1, 'repair:cart_stop': 1, 'repair:market': 1, 'repair:windmill': 1 }, skills: { building: 20 } },
      cost: { coins: 9000, items: { plank: 30 } }, unlocks: 'A title, a bigger quest board, and respect. Possibly.', soon: true },
  ],
  // The repaired Market: 3 offers a day (src/systems/repairs.js rollMarket). Mult = x the item's price; stock = per day.
  market: { stallSpeed: 0.8, greenMult: 3, greenStock: 3, seedMult: 1.5, seedStock: 5, baitMult: 0.8, baitStock: 10,
            curios: ['gnome', 'weathervane', 'fancy_rug', 'pigeon_statue'] },
  // The repaired Windmill sells flour
  miller: { flourPrice: 3 },
  // Wishing at the repaired well: once a day. w = weight (out of 100).
  wish: { cost: 10, table: [{ w: 50, nothing: true }, { w: 25, ingredient: 'Common' }, { w: 12, coins: 30 }, { w: 8, seed: true }, { w: 4, ingredient: 'Uncommon' }, { w: 1, coins: 150 }] },
};
