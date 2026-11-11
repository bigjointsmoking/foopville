// ============================================================
// COSMETICS — hats and titles (phase G2). No stats: they're just for showing off.
//   hats:   drawn on your hero's head on the map and in fights. price = sold by the Shopkeeper (Hats tab);
//           no price = boss drop only (data/gear.js bossDrops `hat` rows).
//   titles: free once their `req` is met (facts: data/facts.js). Shown after your name: "Pib the Evicted".
// Change them in the 🎒 backpack, Wardrobe tab. Rules: src/systems/cosmetics.js.
// Kept on a Normal death; Hardcore wipes them.
// ============================================================
window.FUP = window.FUP || {};

FUP.cosmeticData = {
  hats: {
    straw_hat:    { name: 'Straw Hat', emoji: '👒', price: 500, blurb: 'For farming, or pretending to.' },
    chef_hat:     { name: "Chef's Hat", emoji: '👨‍🍳', price: 1500, blurb: 'Marrowbone would like a word.' },
    tiny_crown:   { name: 'Tiny Crown', emoji: '👑', price: 5000, blurb: 'Rules over a very small kingdom. Your head.' },
    don_fedora:   { name: "The Don's Fedora", emoji: '🎩', blurb: 'Dropped by the Pigeon Godfather. Still smells of breadcrumbs.' },
    landlord_cap: { name: "Landlord's Cap", emoji: '🍄', blurb: 'Dropped by the Mushroom Landlord. Rent not included.' },
  },
  titles: {
    evicted:       { text: 'the Evicted', req: { facts: { 'boss:landlord': 1 } } },
    squirrel_bane: { text: "Squirrel's Bane", req: { facts: { 'kill:squirrel': 100 } } },
    pigeon_friend: { text: 'Friend of Pigeons', req: { facts: { 'boss:godfather': 5 } } },
  },
  // Where the hat sits: pixels above the hero's middle, and its size (map / fight)
  hatOffset: { map: -20, battle: -44 }, hatSize: { map: 22, battle: 44 },
};
