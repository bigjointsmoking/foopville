// ============================================================
// RUN — what you start a run with and what fights give back.
// Ingredients are picked up off the Forest floor (data/forest.js).
// ============================================================
window.FUP = window.FUP || {};

FUP.runData = {
  // Ingredients in your bag when a new life starts. (Later: bought in the village.)
  startingBag: {
    // Salt + Grumpleberry is a Delicious combo (sweet + salty), so your first dish is a good one.
    rock_salt: 2, grumpleberry: 2, glowcap_mushroom: 1,
  },

  // ---------- Backpack (v0.41, Jesus: a real inventory like RuneScape / Minecraft) ----------
  // Everything you carry shares these slots: ingredients stack up to stack.ingredient per slot,
  // dishes up to stack.dish (same dish + same stars), each piece of gear takes 1 slot.
  packSlots: 16,
  stack: { ingredient: 10, dish: 5 },
  // Satchels: bigger backpacks, bought from the Shopkeeper in order (later also loot). slots = extra slots in total.
  packUpgrades: [
    { name: 'Belt Satchel',        slots: 4, price: 1800,  blurb: '+4 backpack slots. Pockets on a belt. Revolutionary.' },
    { name: "Explorer's Satchel", slots: 8, price: 6000, blurb: '+8 backpack slots in total. Fits a frying pan and your dignity.' },
  ],

  // Game modes (Refinement Phase 1): picked in the character creator, locked for life.
  modes: {
    normal:   { name: 'Normal',   emoji: '🪦', blurb: 'Die and you wake up at home. Everything you carried and wore waits in your grave for 15 minutes.' },
    hardcore: { name: 'Hardcore', emoji: '💀', blurb: 'One life. Die and everything is deleted: levels, coins, gear, house, farm.' },
  },
  defaultMode: 'normal',   // highlighted first in the creator

  // Normal mode's grave: where your stuff waits after you die.
  grave: {
    minutes: 15,           // play time before it crumbles (only ticks while the game is open and showing)
    touch: 26,             // pixels: walk this close to loot it
  },

  // Ingredient rarity odds now live in each Forest area (data/forest.js, blueprint 18.6).

  // Enemy drops: [ingredient id, chance]. Blueprint 18.2.
  drops: {
    squirrel: [['squirrel_jerky', 0.4]],
    // The Soggy Marsh (W2): 3 Stamped Forms open the Bog Notary's office (W3)
    mosquitoIntern: [['stamped_form', 0.25]], leechLawyer: [['stamped_form', 0.25]], filingFrog: [['stamped_form', 0.25]],
  },
};
