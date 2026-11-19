// ============================================================
// COLLECTION LOG (E2, claude/EXPLORATION_LOOP.md decision 3) — a book of everything you've found.
// Rules: src/systems/log.js · Window: src/logUi.js (📖 Log in the backpack).
// Each page lists entries built from the game's own data; an entry fills when its fact is
// first written (src/systems/facts.js). Per life, like facts: Hardcore wipes it, Normal keeps it.
// Milestone rewards: not built yet (options go to Jesus first).
// ============================================================
window.FUP = window.FUP || {};

FUP.logData = {
  // Page order and names. `fact` = the fact prefix that fills an entry ('fish' -> 'fish:mudminnow').
  pages: [
    { id: 'ingredients', name: 'Ingredients', emoji: '🥕', fact: 'ing' },
    { id: 'dishes',      name: 'Dishes',      emoji: '🍲', fact: 'recipe' },
    { id: 'fish',        name: 'Fish',        emoji: '🐟', fact: 'fish' },
    { id: 'creatures',   name: 'Creatures',   emoji: '🐿️', fact: 'kill' },
    { id: 'drops',       name: 'Rare drops',  emoji: '💎', fact: 'drop' },
    { id: 'areas',       name: 'Areas',       emoji: '🗺️', fact: 'region' },
  ],
  // Ingredients page: these sources count (fish and junk go on the Fish page; quest items and planks don't count)
  ingredientSources: ['Forest', 'Farm', 'Marsh', 'Shop', 'Miller', 'Drop'],
  // Hints for empty entries, by ingredient source
  sourceHints: { Forest: 'On the ground in the Forest', Farm: 'Grown on a farm patch (seeds from Pip)', Marsh: 'On the ground in the Soggy Marsh',
    Shop: 'Sold in Foopville', Miller: 'The Miller, once the Windmill is fixed', Drop: 'Dropped by enemies', Junk: 'Fished up by accident', Fishing: 'Caught by fishing' },
  // Creatures the page leaves out (practice and summoned helpers)
  skipCreatures: ['trainingDummy', 'strayShroom'],
  // Where to find creatures that aren't on a region's enemy list
  creatureHints: {
    sporeBouncer: 'The Old Storehouse', moldAccountant: 'The Old Storehouse', guardian: 'The bottom of the Old Storehouse',
    godfather: 'Upset enough pigeons and he finds you', seniorPartner: 'His office in the Soggy Marsh', nutsy: 'A quest',
    goblin: 'The Goblin Toll Road',
  },
  // Areas page: regions in this order (+ the Old Storehouse, fact 'region:raid' written when you climb down)
  areas: ['edge', 'tollroad', 'deepwoods', 'docks', 'marsh', 'raid'],
  areaNames: { raid: 'The Old Storehouse' },
  areaHints: { edge: 'Out the village\'s north gate', tollroad: 'East of the Forest Edge', deepwoods: 'East of the Toll Road',
    docks: 'South of the village, once the South Road is fixed', marsh: 'East of the village, over the East Bridge', raid: 'A hole somewhere in the Deep Woods' },
  areaEmoji: { edge: '🌳', tollroad: '🌉', deepwoods: '🌲', docks: '⚓', marsh: '🐸', raid: '🕳️' },

  // The "New in your log" pop-up
  popup: { text: '📖 New in your log: {emoji} {name}', seconds: 2.4, sound: 'questStep', gap: 0.5 },
  perScreen: 32,   // entries per page of the window (8 x 4)
};
