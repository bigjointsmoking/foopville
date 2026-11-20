// ============================================================
// VILLAGE SURPRISE EVENTS (phase V3, design/short-visits.md §6, picked by Jesus 2026-11-20).
// Now and then, walking into the village, something is going on: a ❗ on the map, a small
// thing to do, a small reward. Ignoring it costs nothing. One at a time, village only.
// Rules: src/systems/events.js. On the map: src/scenes/VillageEvents.js.
// Times are seconds of PLAY (FUP.clock.now()). ALL NUMBERS, SPOTS AND LINES ARE PLACEHOLDERS.
//
// Each event: w (weight), name, emoji (sprite = its painted picture, A1), spot { tx, ty } on the village map (moved to the nearest
// open square if it's blocked), needs (a check in src/systems/events.js), req (FUP.req format).
//   needs: growingCrop = a crop growing in one of your patches · threeRecipes = 3+ different
//          dishes cooked · stall = you have a food stall placed
// ============================================================
window.FUP = window.FUP || {};

FUP.eventData = {
  gapSeconds: 900,     // after one ends, at least 15 min of play before the next can start
  chance: 0.6,         // then each time you walk into the village: 60%
  retrySeconds: 300,   // a failed roll tries again after 5 min of play
  lifeSeconds: 600,    // an event lasts 10 min of play, then quietly goes away
  ingredientSources: ['Forest', 'Marsh'],   // where the crate's and the tourist's ingredients come from
  debugForce: null,    // test helper: an event id here starts it on every village visit. Keep null.

  list: {
    peddler: { w: 3, name: 'A Travelling Peddler', emoji: '🧳', sprite: 'event_peddler', spot: { tx: 19, ty: 4 },
      discount: 0.2, seeds: 3, bait: 10,   // 20% off: 3 seeds of one crop · 10 of one bait · 1 ground thing
      ground: ['path', 'fence', 'hedge', 'lantern', 'flower_bed'] },
    pigeon_mail: { w: 3, name: 'Pigeon Mail', emoji: '🕊️', sprite: 'event_letter', spot: 'door', coinsChance: 0.7, coins: [15, 40] },   // else a free riddle
    lost_tourist: { w: 2, name: 'A Lost Tourist', emoji: '🧭', sprite: 'event_tourist', spot: { tx: 26, ty: 19 }, minStars: 2, rizzXp: 40 },
    crop_thieves: { w: 2, name: 'Crop Thieves', emoji: '🐿️', count: 3, seconds: 45, reward: 'grumpleberry', needs: 'growingCrop' },
    rain: { w: 2, name: 'Rain', emoji: '🌧️', biteCut: 0.25 },   // fish bite 25% sooner in the village (Jesus: fish only, crops still need watering)
    chef_challenge: { w: 2, name: "Chef's Challenge", emoji: '🍽️', spot: 'chef', coinMult: 3, xpMult: 1.5, needs: 'threeRecipes' },
    glitter_pond: { w: 2, name: 'The Pond Glitters', emoji: '✨', spot: { tx: 24, ty: 13 }, catches: 5 },   // the next 5 catches at a village pond come in pairs
    mystery_crate: { w: 2, name: 'A Mystery Crate', emoji: '📦', sprite: 'event_crate',
      spots: [{ tx: 8, ty: 7 }, { tx: 33, ty: 18 }, { tx: 27, ty: 28 }, { tx: 50, ty: 34 }],
      table: [{ w: 55, ingredient: 'Common', n: 2 }, { w: 25, coins: [20, 50] }, { w: 15, ingredient: 'Uncommon', n: 1 }, { w: 4, ingredient: 'Rare', n: 1 }, { w: 1, curio: true }],
      curioCoins: 50 },   // a curio you already own all of = 50 coins instead
    market_day: { w: 2, name: 'Market Day', emoji: '🎪', stallSpeed: 0.5, req: { facts: { 'repair:market': 1 } }, needs: 'stall' },   // your stall sells twice as fast
  },

  // Words (PLACEHOLDER lines). eventStart / eventDone are narrator lines; the rest are said in the windows.
  peddlerGreet: ['Deals! Real ones! Mostly real!', 'Everything must go. Including me, in ten minutes.', 'Twenty percent off. Don\'t ask off what.'],
  touristGreet: ['Is this the big city? It\'s not, is it.', 'I\'ve been walking for days. Is there food? Real food?'],
  touristThanks: ['Delicious! Here, take this. I found it on the road. It\'s probably fine.', 'I can feel my legs again! Take this, I insist.'],
  touristNothing: ['He stares at your empty hands. Then at you. Mostly at your hands.'],
};
