// ============================================================
// TOOLS — skilling tools you buy in tiers (phase P3: the fishing rod).
// Each line: who sells it, which skill it's for, and its tiers (tier 0 = what you start with).
// Tier values are totals: only the tier you own counts. They add to the skill perks
// (FUP.unlocks.perkSum), e.g. rodZone = a bigger catch zone, biteCut = bites come sooner.
// Later phases add more lines here (G2: gardening, B2: building).
// Rules in src/systems/tools.js. Kept on a Normal death; Hardcore wipes them.
// ============================================================
window.FUP = window.FUP || {};

FUP.toolData = {
  lines: {
    rod: { name: 'Fishing Rod', npc: 'fishmonger', skill: 'fishing', tiers: [
      { name: 'Twig Rod',       price: 0,    blurb: 'A stick with a string. It works, technically.' },
      { name: 'Decent Rod',     price: 300,  req: { skills: { fishing: 5 } },  rodZone: 10, biteCut: 0.05, blurb: 'Bigger catch zone. Bites a little sooner.' },
      { name: 'Sea Rod',        price: 1200, req: { skills: { fishing: 15 } }, rodZone: 20, biteCut: 0.10, blurb: 'Made for salt water. Even bigger zone, quicker bites.' },
      { name: 'Rod of Renown',  price: 3600, req: { skills: { fishing: 25 } }, rodZone: 30, biteCut: 0.15, blurb: 'Fish have heard of it. They are nervous.' },
      { name: 'The Negotiator', price: 9000, req: { skills: { fishing: 35 } }, rodZone: 40, biteCut: 0.20, blurb: 'The best rod money can buy. Gill wept when he sold it.' },
    ] },
    // The hammer (v0.57): placeables, stall upgrades and repairs cost fewer coins (Building XP still counts the full price)
    hammer: { name: 'Hammer', npc: 'carpenter', skill: 'building', tiers: [
      { name: 'Borrowed Hammer',  price: 0,    blurb: 'Planksworth wants it back. He will not get it back.' },
      { name: 'Decent Hammer',    price: 300,  req: { skills: { building: 5 } },  buildCut: 0.05, blurb: 'Placeables and repairs cost 5% fewer coins.' },
      { name: 'Good Hammer',      price: 1200, req: { skills: { building: 15 } }, buildCut: 0.10, blurb: 'Placeables and repairs cost 10% fewer coins.' },
      { name: 'Hammer of Renown', price: 3600, req: { skills: { building: 25 } }, buildCut: 0.15, blurb: 'Placeables and repairs cost 15% fewer coins.' },
      { name: 'The Persuader',    price: 9000, req: { skills: { building: 35 } }, buildCut: 0.20, blurb: 'Placeables and repairs cost 20% fewer coins. Nails just give up.' },
    ] },
    // The hoe (G2): a chance of +1 on every harvest (adds to the Green Thumb perk)
    hoe: { name: 'Hoe', npc: 'farmhand', skill: 'gardening', emoji: '⛏️', tiers: [
      { name: 'Rusty Hoe',                 price: 0,    blurb: 'More rust than hoe.' },
      { name: 'Decent Hoe',                price: 300,  req: { skills: { gardening: 5 } },  bonusYieldChance: 0.05, blurb: '+5% chance of +1 on every harvest.' },
      { name: 'Good Hoe',                  price: 1200, req: { skills: { gardening: 15 } }, bonusYieldChance: 0.10, blurb: '+10% chance of +1 on every harvest.' },
      { name: 'Hoe of Renown',             price: 3600, req: { skills: { gardening: 25 } }, bonusYieldChance: 0.15, blurb: '+15% chance of +1 on every harvest.' },
      { name: 'Hoe You Tell People About', price: 9000, req: { skills: { gardening: 35 } }, bonusYieldChance: 0.20, blurb: '+20% chance of +1 on every harvest. People will not ask.' },
    ] },
    // The watering can (G2): holds more waterings
    can: { name: 'Watering Can', npc: 'seeds', skill: 'gardening', emoji: '🪣', tiers: [
      { name: 'Dented Can',    price: 0,    blurb: 'It leaks. Mostly on you.' },
      { name: 'Tin Can',       price: 250,  canBonus: 5,  blurb: 'Holds 5 more waterings.' },
      { name: 'Copper Can',    price: 1000, req: { skills: { gardening: 10 } }, canBonus: 10, blurb: 'Holds 10 more waterings.' },
      { name: 'Brass Can',     price: 3000, req: { skills: { gardening: 20 } }, canBonus: 15, blurb: 'Holds 15 more waterings.' },
      { name: 'The Reservoir', price: 7500, req: { skills: { gardening: 30 } }, canBonus: 20, blurb: 'Holds 20 more waterings. Your arms disagree.' },
    ] },
  },
};
