// ============================================================
// COMMISSIONS — villagers ask you to build them something (v0.70).
// Each one has a build site on the village map: a stake with a sign. Walk up,
// read what they want, pay the materials, and scaffolding goes up. It builds
// itself over real minutes (like crops, even while the game is closed). Come
// back, finish it: the villager pays you, you get Building XP, and the thing
// stays in the village for good.
//   npc     who asks (data/village.js npcs) · site = map squares (solid once built)
//   req     when the site shows up as available (shown locked up to `peek` levels early)
//   cost    materials (data/salvage.js) and sometimes coins · pay = coins you get
//   xp      Building XP when you finish · minutes = build time
//   ask     what they say on the sign · thanks = what they say when it's done
// Rules in src/systems/commissions.js, drawing in src/commissionUi.js. PLACEHOLDER numbers.
// ============================================================
window.FUP = window.FUP || {};

FUP.commissionData = {
  peek: 4,   // a site shows (locked) this many Building levels before you can take it
  list: [
    { id: 'doghouse', npc: 'smith', name: 'A Kennel for Sparky', emoji: '🐕', sprite: 'build_doghouse', site: { tx: 8, ty: 4, w: 1, h: 1 },
      req: { skills: { building: 1 } }, cost: { items: { plank: 5, nails: 3 } }, pay: 120, xp: 120, minutes: 2,
      ask: 'My dog sleeps in the forge. He\'s fireproof now, but grumpy. Build him a kennel.',
      thanks: 'Sparky loves it. He bit me less today. That\'s love.' },
    { id: 'chef_sign', npc: 'chef', name: 'A Sign That Spells MARROWBONE', emoji: '🪧', sprite: 'build_chef_sign', site: { tx: 8, ty: 10, w: 1, h: 1 },
      req: { skills: { building: 3 } }, cost: { items: { plank: 4, nails: 2 } }, pay: 150, xp: 200, minutes: 3,
      ask: 'My sign says MARROWB. The rest fell off. People think I sell bones. I do, but in soup.',
      thanks: 'All the letters. In order. You have restored my dignity, and my bone soup sales.' },
    { id: 'board_awning', npc: 'quest', name: 'A Roof for the Quest Board', emoji: '⛱️', sprite: 'build_board_awning', site: { tx: 23, ty: 9, w: 2, h: 1 },
      req: { skills: { building: 6 } }, cost: { items: { plank: 8, nails: 5 } }, pay: 250, xp: 350, minutes: 4,
      ask: 'Every time it rains the quests run. Literally. The ink. Build me a little roof.',
      thanks: 'Dry quests! The heroes of this village will be slightly less confused.' },
    { id: 'hollis_shed', npc: 'farmhand', name: 'A Tool Shed for Hollis', emoji: '🛖', sprite: 'build_hollis_shed', site: { tx: 28, ty: 36, w: 2, h: 1 },
      req: { skills: { building: 10 } }, cost: { items: { plank: 12, nails: 6, stone: 4 } }, pay: 400, xp: 600, minutes: 6,
      ask: 'My tools live in a pile. The pile has a goose in it now. I need a shed.',
      thanks: 'A shed! The goose has moved in, but at least the tools have a roof too.' },
    { id: 'pip_trellis', npc: 'seeds', name: 'A Flower Trellis for Pip', emoji: '🌸', sprite: 'build_pip_trellis', site: { tx: 20, ty: 37, w: 1, h: 1 },
      req: { skills: { building: 14 } }, cost: { items: { plank: 10, nails: 8 } }, pay: 450, xp: 900, minutes: 6,
      ask: 'My climbing beans climb ME. Please build them something else to climb.',
      thanks: 'The beans have left me alone for an hour. A new record.' },
    { id: 'shop_window', npc: 'shop', name: 'A Shop Window Display', emoji: '🪟', sprite: 'build_shop_window', site: { tx: 26, ty: 4, w: 2, h: 1 },
      req: { skills: { building: 18 } }, cost: { items: { plank: 10, nails: 6, glass: 2, brass: 1 } }, pay: 700, xp: 1300, minutes: 8,
      ask: 'Customers walk past. A shiny window display would make them walk in. Then out. But in first.',
      thanks: 'People stop and stare now. Mostly at their reflection, but I\'ll take it.' },
    { id: 'carpenter_porch', npc: 'carpenter', name: 'A Porch for Planksworth', emoji: '🪑', sprite: 'build_carpenter_porch', site: { tx: 10, ty: 13, w: 2, h: 1 },
      req: { skills: { building: 22 } }, cost: { items: { plank: 20, nails: 12, stone: 8 } }, pay: 900, xp: 1800, minutes: 10,
      ask: 'I build for everyone. Nobody builds for me. Build me a porch. I\'ll judge it, but fairly.',
      thanks: 'Hm. Level. Sturdy. Nails flush. ...Fine. It\'s good. Don\'t let it go to your head.' },
    { id: 'bandstand', npc: 'quest', name: 'The Village Bandstand', emoji: '🎺', sprite: 'build_bandstand', site: { tx: 26, ty: 19, w: 3, h: 2 },
      req: { skills: { building: 28 } }, cost: { items: { plank: 30, nails: 20, stone: 10, glass: 3, brass: 3 } }, pay: 1500, xp: 3000, minutes: 15,
      ask: 'The village wants a bandstand. We have no band. Build it and one might show up. That\'s how bands work, I think.',
      thanks: 'A bandstand! Still no band. But the pigeons have started a choir. It\'s awful. We love it.' },
  ],
};
