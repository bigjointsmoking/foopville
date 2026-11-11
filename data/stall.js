// ============================================================
// FOOD STALL — your own shop on your plot (design/building.md 3).
// Put dishes in it; it sells one every so often WHILE YOU PLAY and
// keeps the coins in its till until you collect them.
// ============================================================
window.FUP = window.FUP || {};

FUP.stallData = {
  sellSeconds: 120,          // one dish sells every 2 minutes of play
  premium: 1.15,             // customers pay this much more than the Shopkeeper's plain price
  refuse: ['Burnt Mess'],    // dishes nobody buys (burnt "Charred ..." dishes are refused too)
  // Upgrades, bought at the stall in order. stock = dishes it holds, till = coins it holds.
  // PLACEHOLDER prices.
  tiers: [
    { name: 'Food Stall', stock: 8, till: 300 },
    { name: 'Awning', stock: 12, till: 600, req: { skills: { building: 12 } }, cost: { coins: 1500, items: { plank: 10 } }, blurb: 'Holds 12 dishes. Till holds 600.' },
    { name: 'Proper Counter', stock: 16, till: 1200, sellSeconds: 100, req: { skills: { building: 22 } }, cost: { coins: 4000, items: { plank: 20 } }, blurb: 'Holds 16. Sells a little faster.' },
  ],
};
