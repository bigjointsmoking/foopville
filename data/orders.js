// ============================================================
// FARM ORDERS (Farming 2.0 F-F, planned with Jesus 2026-11-19: design/farming.md).
// Hollis's order board, by the fields. 3 orders a game day from villagers; the board
// refreshes every new day and unfinished orders just go away (no penalty).
// Orders only ask for things you can make right now (never shop-bought answers).
// Pay: coins ~2x what the goods sell for, Gardening XP (Cooking for dishes), building
// materials, and now and then an extra. Rules: src/systems/orders.js. ALL NUMBERS ARE PLACEHOLDERS.
//
// Each ask: { type, id, n: [min, max], w (weight) }
//   type 'crop'    a crop you can plant now (Pip sells it, or you've had it before)
//   type 'produce' eggs / milk / honey, once you own a living animal that makes it
//   type 'fruit'   once you have a grown tree of that fruit
//   type 'dish'    a recipe you can cook now (n = how many, any stars)
//   type 'giant'   harvest any giant crop after the order appears (you keep the crops)
// ============================================================
window.FUP = window.FUP || {};

FUP.orderData = {
  perDay: 3,
  board: { tx: 28, ty: 37 },   // next to Hollis (spot is a PLACEHOLDER)
  payMult: 2,                  // coins = what the goods sell for x this
  giantPay: 150,               // coins for a giant crop order
  xpShare: 0.5,                // XP = coins x this (Gardening; dishes give it as Cooking XP)
  mats: { min: 1, max: 3, pick: { plank: 5, nails: 3, stone: 2 } },   // building materials on every order
  extraChance: 0.2,            // about 1 order in 5 also gives an extra
  extras: [
    { w: 35, seeds: { heartroot: 2 } }, { w: 25, seeds: { sea_kale: 3 } }, { w: 25, seeds: { bitterroot: 3 } },
    { w: 8, place: 'grumbleplum_tree' }, { w: 4, place: 'sourapple_tree' },
    { w: 15, place: 'scarecrow' }, { w: 15, place: 'hedge' },
    { w: 20, items: { grumblegrain: 5 } }, { w: 15, items: { meadow_hay: 5 } },
  ],

  // Who orders what (lines approved by Jesus 2026-11-19). A line on an ask = said only with that order
  // (it names that thing); a giver's own `line` = said with any of their orders. Asks with neither show no quote.
  givers: {
    chef: {
            asks: [{ type: 'crop', id: 'tear_jerk_onion', n: [20, 20], w: 3, line: 'Onions. Twenty. Real ones. Not whatever you call cooking.' }, { type: 'crop', id: 'dragons_sneeze_chili', n: [4, 8], w: 2 },
                   { type: 'crop', id: 'ember_pepper', n: [3, 6], w: 2 }, { type: 'dish', id: 'Honey Cake', n: [1, 2], w: 2 }] },
    fishmonger: {
            asks: [{ type: 'crop', id: 'grumpy_lemon', n: [4, 8], w: 3, line: 'Lemons. For the fish. The fish don\'t care. I do. Slightly.' }, { type: 'dish', id: 'Honey-Glazed Carp', n: [1, 2], w: 2 }] },
    oldtimer: {
            asks: [{ type: 'crop', id: 'bitterroot', n: [3, 6], w: 3, line: 'Bitterroot, for the soup. Everything costs. You\'ll get paid.' }, { type: 'produce', id: 'milk', n: [2, 3], w: 2 }] },
    shop: {
            asks: [{ type: 'produce', id: 'egg', n: [3, 6], w: 3, line: 'Eggs! I\'ll sell them for twice what I pay you. Kidding. Mostly.' }, { type: 'crop', id: 'grumpleberry', n: [8, 16], w: 3 }, { type: 'fruit', id: 'grumbleplum', n: [2, 5], w: 2 }] },
    banker: {
            asks: [{ type: 'produce', id: 'honey', n: [3, 3], w: 3, line: 'Honey. Three jars. I\'ll count them. Twice. Out loud.' }] },
    carpenter: { line: 'Lunch for the crew. Measure twice, pay once. Unlike me.',
            asks: [{ type: 'produce', id: 'milk', n: [2, 3], w: 2 }, { type: 'fruit', id: 'sourapple', n: [2, 5], w: 2 }] },
    quest: { line: 'URGENT! The village needs eggs! Well. I need eggs. For breakfast.',
            asks: [{ type: 'produce', id: 'egg', n: [3, 6], w: 3 }, { type: 'dish', id: 'Boiled Eggs', n: [1, 2], w: 2 }] },
    seeds: { line: 'A GIANT one. For science. And bragging.',
            asks: [{ type: 'giant', n: [1, 1], w: 0.5 }] },   // rare big order
  },

  board_name: 'Farm Orders',
  empty: 'No orders you can fill today. Grow more kinds of things and the village will notice.',
};
