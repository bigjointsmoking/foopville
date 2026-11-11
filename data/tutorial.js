// ============================================================
// TUTORIAL — Orientation Isle (v0.62). A new life starts on a little island
// (like a "tutorial island"): a tutor at each station teaches one thing by
// making you do it. Then the ferry takes you to Foopville. No going back.
//   Rules: src/systems/tutorial.js   Drawing: src/scenes/WorldTutorial.js
//   The island map: data/region_isle.js   Region: data/world.js `isle`
// Shown on the first life in a browser; the creator has a Tutorial ON/OFF
// switch (it remembers you finished it once). Skip any time from the card.
//
// In tutor text: {name} = your name, {walk} {talk} {pack} = the controls
// (keys on a computer, touch on a phone), {coins} = the ferry money,
// {maxQuests} = quests you can hold. A page can be { normal: '...', hardcore: '...' }.
// ============================================================
window.FUP = window.FUP || {};

FUP.tutorialData = {
  coins: 50,                 // the ferry captain's purse for the trip (Jesus: items + 50 coins)
  questReward: { skill: 'rizz', xp: 30 },   // the practice quest's reward (placeholder)
  seenKey: 'fupville_tutorial_seen',          // browser memory: "you've finished it once" (not part of the save)

  // Controls, filled into the text
  controls: {
    keys:  { walk: 'WASD or the arrow keys (or hold the mouse)', talk: 'press E or Space', pack: 'press I or click 🎒' },
    touch: { walk: 'drag anywhere on the screen', talk: 'tap the round button', pack: 'tap the 🎒 button' },
  },

  // The practice farm patch: grows fast here (in Foopville a Grumpleberry takes 6 minutes)
  patch: { tx: 16, ty: 10, crop: 'grumpleberry', growSeconds: 15, harvest: 2 },
  // The sawhorse: the builder gives you exactly enough Bark for one plank
  sawhorse: { tx: 33, ty: 13 },
  // The training dummy in the ring (an enemy in data/enemies.js that can't kill you)
  dummy: { tx: 28, ty: 17, enemy: 'trainingDummy' },
  // The ferry at the end of the pier (just a picture)
  ferry: { tx: 20, ty: 25 },
  // Where you wake up
  start: { tx: 19, ty: 7 },

  // ---------- The tutors (placeholder looks: villager pictures, tinted) ----------
  tutors: {
    greeter: { name: 'Greta the Greeter', sprite: 'npc_quest_map', emoji: '👋', tint: 0xf2c8a0, tx: 22, ty: 7 },
    fisher:  { name: 'Old Finnick',       sprite: 'npc_seeds_map', emoji: '🎣', tint: 0x9cc8e8, tx: 10, ty: 4 },
    farmer:  { name: 'Turnip Tess',       sprite: 'npc_farmhand_map', emoji: '🧑‍🌾', tint: 0xd8e8a0, tx: 14, ty: 10 },
    cook:    { name: 'Burnt Bertram',     sprite: 'npc_chef_map', emoji: '👨‍🍳', tint: 0xc8a088, tx: 25, ty: 6 },
    builder: { name: 'Nailbiter Nell',    sprite: 'npc_carpenter_map', emoji: '🪚', tint: 0xe8d098, tx: 33, ty: 11 },
    quests:  { name: 'Clipboard Clive',   sprite: 'npc_quest_map', emoji: '📋', tint: 0xb8b8e8, tx: 18, ty: 15 },
    combat:  { name: 'Sergeant Bruise',   sprite: 'npc_smith_map', emoji: '🥊', tint: 0xe8a0a0, tx: 29, ty: 14 },
    captain: { name: 'Captain Dreary',    sprite: 'npc_shop_map', emoji: '⚓', tint: 0xa0c0d8, tx: 22, ty: 24 },
  },

  // ---------- The steps, in order ----------
  //   talk: talk to that tutor (their `pages`). give: what they hand you. at: where the arrow points.
  //   do:   do the thing (event). Events: pack, fish, hoe, plant, water, harvest, cook, saw, fight.
  //   done: the narrator's line when the step is finished.
  steps: [
    { kind: 'talk', tutor: 'greeter', goal: 'Talk to Greta the Greeter',
      pages: [
        'Welcome to Orientation Isle, {name}. Everyone starts here. Most people leave. Eventually.',
        'Over the water is Foopville, your new home. Before the ferry takes you there, the tutors here will teach you the basics: fishing, farming, cooking, building, quests and fighting.',
        'To walk: {walk}. Walk up to anyone and {talk} to talk. The arrow and the card in the top left show where to go next.',
        { normal: 'You picked Normal mode. If you die, you wake up at home and your things wait in a grave. Fetch them within 15 minutes of play.',
          hardcore: 'You picked Hardcore mode. If you die, that character is gone for good. Levels, coins, house, everything. No pressure.' },
        'First things first: your backpack. To open it, {pack}. It holds everything you carry.',
      ],
      again: 'Old Finnick is by the pond. He has been by the pond for years. Go and see him.' },
    { kind: 'do', event: 'pack', at: 'pack', goal: 'Open your 🎒 backpack',
      done: 'Your backpack. Ingredients, dishes, gear, and a worrying amount of lint.' },

    { kind: 'talk', tutor: 'fisher', goal: 'Talk to Old Finnick by the pond',
      pages: [
        'Fishing. You stand by the water, you wait, and you pretend you know what you\'re doing.',
        'Stand next to the rings in the pond and {talk}. When a fish bites, keep it inside the zone until the bar fills up. Let it slip and the fish wins.',
        'Higher Fishing levels catch better fish. Foopville has a pond, and the Docks have the sea, once somebody fixes the road.',
      ],
      again: 'The rings in the water. That\'s where the fish are. Allegedly.' },
    { kind: 'do', event: 'fish', at: 'pond', goal: 'Catch a fish (stand by the rings)',
      done: 'A fish. Small, angry, and now yours.' },

    { kind: 'talk', tutor: 'farmer', goal: 'Talk to Turnip Tess at the farm patch',
      pages: [
        'Farming! Crops grow while you play. Close the game and they wait for you, which is more than most people do.',
        'This patch is yours for today. Hoe it, plant a seed, water it, then pick what grows. Walk onto the patch and {talk} for each job.',
        'Crops want water at every stage, or they wilt. In Foopville, Hollis sells farm patches and Pip sells seeds. Here, it grows fast. Back home it takes real minutes.',
      ],
      again: 'Hoe, plant, water, wait, pick. Farming is mostly the waiting part.' },
    { kind: 'do', event: 'hoe', at: 'patch', goal: 'Hoe the farm patch', done: 'Soil, exposed. It looks surprised.' },
    { kind: 'do', event: 'plant', at: 'patch', goal: 'Plant the seed', done: 'A seed, in the ground. Nature will take it from here. Slowly.' },
    { kind: 'do', event: 'water', at: 'patch', goal: 'Water the seedling', done: 'Watered. Now it grows. Stand there and feel useful.' },
    { kind: 'do', event: 'harvest', at: 'patch', goal: 'Wait for it to grow, then pick it', grow: true,
      done: 'Grumpleberries. They look exactly as happy as their name suggests.' },

    { kind: 'talk', tutor: 'cook', goal: 'Talk to Burnt Bertram by the campfire',
      pages: [
        'Cooking. At a campfire or at home, put ingredients in the pot, pick a method, and cook.',
        'Every recipe needs a Cooking level. Start with a Roasted Grumpleberry: one Grumpleberry, Grill. Your fish needs Cooking 2. Ambitious of you.',
        'Dishes go in your satchel. In a fight you eat them to heal, or throw them at things. Even burnt food can be thrown.',
        'Walk into the campfire to start. The 📖 Recipes button lists everything you know.',
      ],
      again: 'The campfire. Walk into it. Carefully. That\'s how cooking starts.' },
    { kind: 'do', event: 'cook', at: 'campfire', goal: 'Cook a dish at the campfire',
      done: 'Food. Edible, probably. Keep it for the fight.' },

    { kind: 'talk', tutor: 'builder', goal: 'Talk to Nailbiter Nell by the sawhorse', give: { bark: 3 },
      pages: [
        'Building. You saw Bark into planks at a sawhorse. Planks and coins turn into furniture, a food stall, and repairs for the village.',
        'Here\'s some Bark. Walk up to the sawhorse and {talk} to saw a plank.',
        'In Foopville, the Carpenter sells things to build, and a 🔨 Build button shows up when you stand on land you own. The village needs a lot of fixing. A lot.',
      ],
      again: 'Sawhorse. Bark. Saw. Plank. It\'s not complicated, it just feels it.' },
    { kind: 'do', event: 'saw', at: 'saw', goal: 'Saw a plank at the sawhorse',
      done: 'A plank. Splinters included at no extra cost.' },

    { kind: 'talk', tutor: 'quests', goal: 'Talk to Clipboard Clive',
      pages: [
        'Quests! Someone wants a thing done, you do it, they pay you. Like a job, but you\'re allowed to say no.',
        'In Foopville the Quest Board Keeper has a board full of jobs. You can take {maxQuests} at a time. When one is done, go back and hand it in for the reward.',
        'Here\'s your first one: beat the training dummy in the ring. Then come back to me and hand it in. Sergeant Bruise will explain the hitting part.',
      ],
      again: 'Your quest: beat the training dummy. Then come back here. The paperwork waits for no one.' },
    { kind: 'talk', tutor: 'combat', goal: 'Talk to Sergeant Bruise by the ring',
      pages: [
        'Fighting! It happens in real time. Your bar fills up, and when it\'s full you choose what to do. The enemy\'s bar fills too. It does not wait for you.',
        'Attack hits. Skills are your weapon\'s special moves: they cost Focus, which you build by hitting and getting hit. Defend softens the next hit.',
        'The icon over an enemy shows what it\'s about to do. Defend just before a hit lands for a Perfect Block, and you hit back for free.',
        'Eat a dish from your satchel to heal, or Throw it for damage. Rizz talks your way out of a fight. Flee runs away, at the cost of your dignity.',
        { normal: 'Out there, lose all your HP and you drop your things in a grave. In here the dummy can\'t kill you. It has tried.',
          hardcore: 'Out there, lose all your HP and your whole life ends. In here the dummy can\'t kill you. It has tried.' },
        'Walk into the ring and up to the dummy to start the fight.',
      ],
      again: 'The dummy is in the ring. Hit it until it stops being a dummy. Well. More of a dummy.' },
    { kind: 'do', event: 'fight', at: 'dummy', goal: 'Beat the training dummy',
      done: 'You beat a dummy. It never stood a chance. It never stood at all, really. It\'s on a pole.' },
    { kind: 'talk', tutor: 'quests', goal: 'Hand in your quest to Clipboard Clive', reward: true,
      pages: [
        'The dummy has been defeated. Paperwork: complete. Here\'s your reward: Rizz XP. Charm, it turns out, can be earned.',
        'That\'s how quests work. Captain Dreary is at the end of the pier. The ferry is waiting. Shoo.',
      ],
      again: 'The ferry. End of the pier. You can\'t miss it. People have tried.' },

    { kind: 'talk', tutor: 'captain', goal: 'Take the ferry from Captain Dreary on the pier', leave: true,
      pages: [
        'Ferry to Foopville. One way. Nobody comes back. Nobody\'s asked to.',
        'Here\'s {coins} coins for a fresh start. The trip is free, I just feel bad for you. The sea air will patch you up, too.',
        'In Foopville: shops, your cottage, the Quest Board, and the Forest through the north gate. The 🗺️ button shows the world map. Off you go.',
      ] },
  ],

  // Talking to a tutor who isn't next
  notYet: 'Not yet, {name}. First: {goal}.',
  // The patch, when you use it at the wrong moment
  patchLines: {
    early: 'Turnip Tess wants a word before you dig up her patch.',
    growing: 'Still growing. Staring at it does not help. It does not hurt either.',
    nothing: 'The patch has nothing to do right now. Neither, it seems, do you.',
    ready: 'The Grumpleberries are ready. Go and pick them before they get ideas.',
  },
  sawNotYet: 'Nailbiter Nell wants a word before you use her sawhorse.',
  dummyNotYet: 'Sergeant Bruise wants a word before you start punching the furniture.',
  dummyDone: 'The dummy has had enough. It\'s a dummy, not a fool.',
  dummyFled: 'You ran away from a dummy. It isn\'t angry. Just disappointed. Try again.',
  // The card in the top left, and the skip question
  cardTitle: '🏝️ ORIENTATION',
  skipAsk: 'Skip the tutorial?',
  skipText: 'You sail straight to Foopville with {coins} coins.\nYou keep whatever you made here.',
};
