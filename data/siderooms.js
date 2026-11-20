// ============================================================
// SIDE ROOMS (E3, GAME_DESIGN 18.6 step 5) — the little hidden clearings at
// Forest dead ends (the "S" squares in data/forest.js maps).
// Every new game day (Jesus, 2026-11-19) each one rolls what's in it:
//   patch   rare ingredients, sometimes with a guard
//   ambush  looks empty; step in and a group jumps you
//   stash   a buried chest: coins or a gear piece
//   hank    Hooded Hank, a shady seller (at most once a day in the whole Forest)
// Looted rooms stay empty until the next day. Rules: src/systems/siderooms.js,
// drawing: src/scenes/WorldSideRooms.js. Numbers are from the 18.6 design (PLACEHOLDERS).
// ============================================================
window.FUP = window.FUP || {};

FUP.sideRoomData = {
  regions: ['edge', 'tollroad', 'deepwoods'],   // which regions use their "S" squares

  // How often each kind turns up (weights)
  kinds: { patch: 30, ambush: 25, stash: 25, hank: 20 },

  // Rare ingredient patch: 3-4 ingredients around the clearing
  patch: { min: 3, max: 4, odds: { Common: 0, Uncommon: 0.6, Rare: 0.4 }, guardChance: 0.5 },

  // Ambush: 2-3 of that area's enemies (pigeons count one each), they go first,
  // no running on your first turn, gear drops twice as likely.
  // Fled = they hide again and jump you next time you step in (PLACEHOLDER, like a map enemy you ran from).
  ambush: { min: 2, max: 3, touch: 30, gearChanceMult: 2 },

  // Treasure stash: 70% coins (25-60 x the area's coin multiplier), else a random gear drop.
  // Backpack full = the gear stays in the chest until you have room (PLACEHOLDER).
  stash: { coinChance: 0.7, coins: [25, 60] },

  // Hooded Hank: 3 things at x1.5 village prices (Rizz discount and haggling work). Buys nothing.
  // One extra secret item at Rizz 15. Each thing is sold once.
  hank: {
    maxPerDay: 1,
    items: 3,
    secretRizz: 15,
    priceMult: 1.5,
    // What each of his slots can be (weights, PLACEHOLDERS): a rare-ish ingredient, a plain gear piece, the Lantern
    stock: { ingredient: 60, gear: 25, lantern: 15 },
    ingredientOdds: { Common: 0, Uncommon: 0.6, Rare: 0.4 },
    // Most forest ingredients aren't sold in the village: their "village price" = sell price x this (PLACEHOLDER)
    ingredientFromSell: 2,
    name: 'Hooded Hank',
    emoji: '🥷',   // PLACEHOLDER picture until he gets Blender art
    hello: [   // claude/CAST_LINES.md
      'Nothing suspicious here. Just a man in a hood, in a bush, selling things.',
      'Lanterns. Very legal. I made sure by not asking.',
    ],
    secretLine: 'Hank leans in. "For a friend: one more thing. Don\'t tell the hood."',
    soldOut: 'Hank has nothing left. He stays anyway. Bushes are free.',
  },
};
