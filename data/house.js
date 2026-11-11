// ============================================================
// HOUSE — your home and what the Carpenter sells (GAME_DESIGN.md sections 18.5 and 18.7).
// You start in a small cottage with an old stove and 4 farm patches.
// Each upgrade line is a list of tiers, bought in order with coins.
// Tier 0 is what you start with (price 0). Rizz discounts and haggling apply.
// Dying wipes the house like everything else.
// ALL PRICES ARE PLACEHOLDERS for Jesus to tweak. (v0.41: all doubled. v0.43, Jesus "way more expensive": houses x10, stoves and pantries x4.)
// ============================================================
window.FUP = window.FUP || {};

FUP.houseData = {
  // Houses: real buildings on the village map, bought in order. Each has its own farm plot
  // (map squares '1', '2', '3' in data/village.js). You keep every house you buy,
  // and any of them leads to your kitchen. The stove and pantry go wherever you live.
  houses: [
    // v0.40 (Jesus): bigger houses do more. You keep every house you buy, so their perks add up.
    //   nap: a Sleep button at home heals you fully (every house has a bed since v0.41) · pantryBonus: extra storage · satchelBonus: extra backpack slots
    { name: 'Cottage',     price: 0,    plotChar: '1', nap: true, blurb: 'Four walls, a roof, one suspicious draft, a bed (Sleep = full heal). 4 farm patches.' },
    { name: 'Stone House', price: 8000,  plotChar: '2', pantryBonus: 20, blurb: 'East of the village. 6 farm patches and +20 storage space.' },
    { name: 'Manor',       price: 24000, plotChar: '3', satchelBonus: 4, pantryBonus: 40, blurb: 'South-east. 9 farm patches, a tower you don\'t need, +4 backpack slots and +40 storage space.' },
  ],

  // Stove: less chance to burn food (taken off the burn chance in data/cooking.js).
  stoves: [
    { name: 'Old Stove',     price: 0,   burnCut: 0,    blurb: 'It works. Mostly. It has opinions.' },
    { name: 'Iron Stove',    price: 960, burnCut: 0.05, blurb: '5% less chance to burn food.' },
    { name: 'Chef\'s Range', price: 3200, burnCut: 0.10, blurb: '10% less chance to burn food.' },
  ],

  // Pantry: keeps ingredients at home, on top of the 20 your bag holds.
  // Move things in and out at home (🗄️ Pantry). Garden harvests that don't fit in your bag go here.
  pantries: [
    { name: 'No pantry',     price: 0,   slots: 0,  blurb: 'Your bag is all you have.' },
    { name: 'Pantry Shelf',  price: 800, slots: 40, blurb: 'Stores 40 ingredients at home.' },
    { name: 'Big Pantry',    price: 2400, slots: 100, blurb: 'Stores 100 ingredients at home.' },
  ],
};
