// ============================================================
// FARM ANIMALS (Farming 2.0 F-E, decided with Jesus 2026-11-19).
// Chicken coops (eggs) and the cow barn (milk) are bought from Planksworth and
// placed on your farm land in Build mode (data/place.js chicken_coop / cow_barn).
// Beehives (already there) also make honey; bees need no feeding.
//
// How it works:
//   - Each coop / barn has a TROUGH. Put feed in it from your backpack (holds `trough`).
//   - Press FEED once a game day: 1 feed from the trough = one game day of food (Gardening XP).
//   - Fed animals make produce on REAL time (like fruit trees), up to `hold`; collect it by hand.
//   - Hunger counts PLAY time only. Out of food = hungry: no produce, a 😟 over it and a warning.
//     After `dieDays` more game days unfed, the animals die. The building stays, empty:
//     `restock` coins at the building buys new ones.
//   - Hollis the Farmhand can be hired by the game day: he presses Feed for you, using the
//     feed in the trough (empty trough = they go hungry anyway). He never collects for you.
// Rules: src/systems/animals.js. Window: src/animalUi.js. ALL NUMBERS ARE PLACEHOLDERS.
// ============================================================
window.FUP = window.FUP || {};

FUP.animalData = {
  dieDays: 2,          // game days hungry before they die
  warnLeft: 0.5,       // game days of hunger left when the second warning comes

  kinds: {
    coop: { name: 'Chickens', who: 'chickens', be: 'are', emoji: '🐔', produce: 'egg', units: 'eggs', every: 2 * 3600, batch: 3, hold: 6,
            feed: 'grumblegrain', trough: 10, restock: 150, feedXp: 6, collectXp: 10 },
    barn: { name: 'Cow', who: 'cow', be: 'is', emoji: '🐄', produce: 'milk', units: 'bottles of milk', every: 3 * 3600, batch: 1, hold: 3,
            feed: 'meadow_hay', trough: 10, restock: 400, feedXp: 10, collectXp: 18 },
    hive: { name: 'Bees', who: 'bees', be: 'are', emoji: '🐝', produce: 'honey', units: 'jars of honey', every: 4 * 3600, batch: 1, hold: 3,
            feed: null, collectXp: 12 },   // no feeding, no trough, never die
  },

  // Hollis, hired by the game day (paid up front)
  farmhand: { perDay: 40, offers: [1, 7] },   // Hire buttons: 1 day / 7 days

  // Lines (PLACEHOLDERS)
  lines: {
    hungry: 'Your {who} {be} hungry. Looking at you like you\'re the feed.',
    starving: 'Your {who} {be} starving. Feed them soon, or they\'ll stop being your problem. Permanently.',
    died: 'Your {who} died. Nobody fed them. It\'s very quiet out there now.',
    farmhandFed: 'Hollis fed your {who}. He wants it noted that he did it sitting down.',
    farmhandEmpty: 'Hollis tried to feed your {who}, but the trough is empty. He shrugged. Professionally.',
  },
};
