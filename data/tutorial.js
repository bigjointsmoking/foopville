// ============================================================
// TUTORIAL — Orientation Isle (v0.62; v0.71 explains much more). A new life starts on a little island
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
  patch: { tx: 16, ty: 10, crop: 'grumpleberry', growSeconds: 5, harvest: 2 },   // v0.97 (M2): 15 → 5 s
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
    merchant: { name: 'The Shopkeeper', sprite: 'npc_shop_map', emoji: '🪙', tx: 25, ty: 11, shop: 'shop' },   // visiting from Foopville; after her talk she opens her real shop (shop = villager id)
    scout:   { name: 'Scout Wanda',       sprite: 'npc_farmhand_map', emoji: '🧭', tint: 0xa8d8b8, tx: 22, ty: 13 },
    quests:  { name: 'Clipboard Clive',   sprite: 'npc_quest_map', emoji: '📋', tint: 0xb8b8e8, tx: 18, ty: 15 },
    combat:  { name: 'Sergeant Bruise',   sprite: 'npc_smith_map', emoji: '🥊', tint: 0xe8a0a0, tx: 29, ty: 14 },
    captain: { name: 'Captain Dreary',    sprite: 'npc_shop_map', emoji: '⚓', tint: 0xa0c0d8, tx: 22, ty: 24 },
  },

  // ---------- The steps, in order ----------
  //   talk: talk to that tutor (their `pages`). give: what they hand you. at: where the arrow points.
  //   do:   do the thing (event). Events: pack, skills, map, fish, hoe, plant, water, harvest, cook, salvage, saw, haggle, sell, fight.
  //   A tutor with `shop: '<villager id>'` opens that villager's real window once you've had their talk.
  //   done: the narrator's line when the step is finished.
  // v0.71 (Jesus: friends were lost after the island): every system gets explained, and the
  // captain ends with a numbered first-day plan.
  // v0.97 (M2 speed pass, claude/FIRST_30_MINUTES.md): same lessons, about half the words and
  // fewer pages; Wanda's two talks are one. Time it with: jsc tests/isle_time.js
  steps: [
    { kind: 'talk', tutor: 'greeter', goal: 'Talk to Greta the Greeter',
      pages: [
        'Welcome to Orientation Isle, {name}. Most people leave. Eventually. Over the water is Foopville, your new home. Your life there: grow and catch food, cook it, fight through the Forest, fix up the run-down village, then push out to nastier places and bigger bosses. The tutors here teach you each part first.',
        'To walk: {walk}. To use anything, walk up and {talk}. The card top left says what to do next; the arrow points to it.',
        { normal: 'Normal mode: if you die, you wake up at home and your things wait in a grave where you fell. Fetch them within 15 minutes of play.',
          hardcore: 'Hardcore mode: if you die, that character is gone for good. Levels, coins, house, everything. No pressure.' },
        '20 minutes of play is a day (top right): crops grow, scrap piles and the Market refill. Your bed heals you fully; late in the day it sleeps you to morning. HP is bottom left, and it does NOT refill by itself. Now open your 🎒 backpack: {pack}.',
      ],
      again: 'Old Finnick is by the pond. He has been by the pond for years. Go and see him.' },
    { kind: 'do', event: 'pack', at: 'pack', goal: 'Open your 🎒 backpack',
      done: 'Your backpack: ingredients, dishes, gear, your weapon on the left. Tap anything to see what it does. Next: 📊 Skills, top left.' },
    { kind: 'do', event: 'skills', at: 'skills', goal: 'Open 📊 Skills (top left)',
      done: 'Ten skills, all level 1. You level a skill by doing it, and every few levels unlocks something. The guide lists what. Now: Old Finnick, by the pond.' },

    { kind: 'talk', tutor: 'fisher', goal: 'Talk to Old Finnick by the pond',
      pages: [
        'Fishing: mostly waiting. Stand by the rings and {talk}. When a fish bites, keep it inside the zone until the bar fills. Let it slip and the fish wins.',
        'Cook fish or sell them. Higher Fishing levels catch better fish. Foopville has a pond; the sea is at the Docks, once somebody fixes the South Road.',
      ],
      again: 'The rings in the water. That\'s where the fish are. Allegedly.' },
    { kind: 'do', event: 'fish', at: 'pond', goal: 'Catch a fish (stand by the rings)',
      done: 'A fish. Small, angry, and now yours.' },

    { kind: 'talk', tutor: 'farmer', goal: 'Talk to Turnip Tess at the farm patch',
      pages: [
        'Farming! Crops grow even while the game is closed. This patch is yours today: hoe, plant, water, pick. Walk onto it and {talk} for each job.',
        'Water at every stage or crops wilt. Here they take seconds; at home, real minutes. Your cottage has patches. Seeds: Pip, on the farm south of the square. More patches: Hollis the Farmhand. Fill your can at any water.',
      ],
      again: 'Hoe, plant, water, wait, pick. Farming is mostly the waiting part.' },
    { kind: 'do', event: 'hoe', at: 'patch', goal: 'Hoe the farm patch', done: 'Soil, exposed. It looks surprised.' },
    { kind: 'do', event: 'plant', at: 'patch', goal: 'Plant the seed', done: 'A seed, in the ground. Nature will take it from here. Slowly.' },
    { kind: 'do', event: 'water', at: 'patch', goal: 'Water the seedling', done: 'Watered. Now it grows. Stand there and feel useful.' },
    { kind: 'do', event: 'harvest', at: 'patch', goal: 'Wait for it to grow, then pick it', grow: true,
      done: 'Grumpleberries. They look exactly as happy as their name suggests.' },

    { kind: 'talk', tutor: 'cook', goal: 'Talk to Burnt Bertram by the campfire',
      pages: [
        'Cooking: ingredients in the pot, pick a method, cook. Cooked food heals far more than raw. Recipes need Cooking levels: try a Roasted Grumpleberry (Grumpleberry, Grill). Your fish needs Cooking 2. Ambitious.',
        'Dishes go in your satchel: eat them in fights to heal, or throw them. Never enter the Forest without food.',
        'No stove at home yet (Planksworth the Carpenter sells one), so use campfires. Each Forest area has one: cook, Rest for HP (every 10 minutes), change gear, or walk home safely. Walk into this one to cook. 📖 Recipes lists what you know.',
      ],
      again: 'The campfire. Walk into it. Carefully. That\'s how cooking starts.' },
    { kind: 'do', event: 'cook', at: 'campfire', goal: 'Cook a dish at the campfire',
      done: 'Food. Edible, probably. Keep it for the fight.' },

    { kind: 'talk', tutor: 'builder', goal: 'Talk to Nailbiter Nell', give: { bark: 3 },
      pages: [
        'Building. Fixing Foopville takes planks, nails and stone, kept in a materials pouch that never fills. Pry them out of scrap piles (sheds, fallen trees, carts); emptied piles refill next day. Or saw Bark into planks. Here\'s Bark: pry my shed ({talk}), then saw a plank.',
        'The Restoration Board by Foopville\'s well lists repairs, each opening something new: the Well, the South Road to the Docks, the East Bridge to the Marsh. Villagers post signs for things to build, and pay. Planksworth sells furniture and a stove.',
      ],
      again: 'Pry the shed, saw the Bark. Materials, then repairs. That\'s building.' },
    { kind: 'do', event: 'salvage', at: 'salvage', goal: 'Pry apart the collapsed shed',
      done: 'Planks and nails, liberated from a shed that had given up anyway.' },
    { kind: 'do', event: 'saw', at: 'saw', goal: 'Saw a plank at the sawhorse',
      done: 'A plank. Splinters included at no extra cost.' },

    { kind: 'talk', tutor: 'scout', goal: 'Talk to Scout Wanda on the path',
      pages: [
        'Lost already? Good, that\'s my job. Foopville is safe. Everywhere else, something wants to eat you. North gate: the Forest Edge (Lv 1-5), then east to the Goblin Toll Road (5-9) and the Deep Woods (9-13). That\'s the Melee level you want first.',
        'Outside the village, enemies chase you if they spot you; touch one and you fight. Fog hides what you haven\'t seen. Grab ingredients; beaten enemies and picked ingredients come back after a while. Walk out the way you came, or "Walk back" at a campfire, and you keep everything.',
        { normal: 'Die out there and your things drop in a grave right there. You wake up at home with 15 minutes of play to go and fetch them.',
          hardcore: 'Die out there and that\'s the end: new life, new name, back to this island. Know when to walk home.' },
        'Deeper means better loot, worse company, secrets and bosses. The South Road (🪨) to the Docks and the East Bridge (🌉) to the Soggy Marsh need repairs; locked places show as ??? on the map. Open the 🗺️ world map now: bottom button, or M.',
      ],
      again: 'The 🗺️ button at the bottom. Open it. Maps work better when you look at them. Then: north gate, Forest, campfires, walk home.' },
    { kind: 'do', event: 'map', at: 'map', goal: 'Open the 🗺️ world map',
      done: 'That\'s the world, or the part of it you know. Close it when you\'re done staring.' },

    { kind: 'talk', tutor: 'merchant', goal: 'Talk to the Shopkeeper',
      pages: [
        'A new customer! I came to get your money first. Coins come from fights, quests and selling me ingredients, dishes and gear. Gill at the Docks pays more for raw fish, once the road is fixed.',
        'Once per visit you can haggle: win and I sell cheaper AND pay more; lose and prices go up. Rizz decides the odds. Haggle BEFORE you sell. Ugh. Try it: walk up again, press 😎 Haggle, then sell something.',
      ],
      again: 'Haggle first, then sell. In that order. I can\'t believe I\'m helping you.' },
    { kind: 'do', event: 'haggle', at: 'merchant', goal: 'Open her shop and press 😎 Haggle',
      done: 'Haggled. Win or lose, it counted, and Rizz XP is Rizz XP.' },
    { kind: 'do', event: 'sell', at: 'merchant', goal: 'Sell something on the Sell tab',
      done: 'Coins! Not many. Hold them carefully. They spook easily.' },

    { kind: 'talk', tutor: 'quests', goal: 'Talk to Clipboard Clive',
      pages: [
        'Quests: a job you\'re allowed to refuse. The Quest Board in Foopville has jobs (beat, cook, catch things). Hold up to {maxQuests}; hand them in at the board for coins, and new ones appear. The 📜 at the bottom of the village screen says when one is ready.',
        'Your first: finish Sergeant Bruise\'s combat lesson in the ring, then come back to me.',
      ],
      again: 'Your quest: finish Sergeant Bruise\'s combat lesson. Then come back here. The paperwork waits for no one.' },
    { kind: 'talk', tutor: 'combat', goal: 'Talk to Sergeant Bruise by the ring',
      pages: [
        'Out there, fights run in real time. In here, I stop time and teach every button. HP doesn\'t refill after fights: eat, Rest at a campfire, or sleep. Wins give Melee XP, coins, ingredients, sometimes gear. The Blacksmith sells better gear; wear it from your backpack.',
        { normal: 'Out there, lose all your HP and you drop your things in a grave. In here, the dummy can\'t hurt you much. It has tried. Walk up to it to start.',
          hardcore: 'Out there, lose all your HP and your whole life ends. In here, the dummy can\'t hurt you much. It has tried. Walk up to it to start.' },
      ],
      again: 'The dummy is in the ring. Walk up to it and we start.' },
    { kind: 'do', event: 'fight', at: 'dummy', goal: 'Do the combat lesson (walk up to the dummy)',
      done: 'Lesson over. You now know every button. Knowing when to press them is the hard part.' },
    { kind: 'talk', tutor: 'quests', goal: 'Hand in your quest to Clipboard Clive', reward: true,
      pages: [
        'Lesson done. Paperwork complete. Your reward: Rizz XP. That\'s how quests work. Captain Dreary is at the end of the pier. Shoo.',
      ],
      again: 'The ferry. End of the pier. You can\'t miss it. People have tried.' },

    { kind: 'talk', tutor: 'captain', goal: 'Take the ferry from Captain Dreary on the pier', leave: true,
      pages: [
        'Ferry to Foopville. One way. Nobody\'s asked to come back. Here\'s {coins} coins, and the sea air will patch you up.',
        'Your first day: 1) Take quests at the Quest Board in the square. 2) Buy seeds from Pip; plant them at your cottage. 3) North gate to the Forest Edge: fight, gather, cook at the campfire, walk home before HP runs low.',
        '4) Sell spares to the Shopkeeper, buy gear at the Blacksmith. 5) Pry scrap piles; put coins and planks toward the Well on the Restoration Board. Sleep to heal. When your Melee matches the next area on the 🗺️ map, go deeper. The world isn\'t excited. Off you go.',
      ] },
  ],

  // ---------- Sergeant Bruise's combat lesson (src/scenes/BattleLesson.js, v0.73) ----------
  // Time stops; each step explains one button, only that button works, you press it.
  //   press = the button taught (allow = every button that may be pressed on the way, e.g. a menu then its choice)
  //   text = before you press it · done = after it worked · enemyHits = the dummy swings right after (Defend)
  //   A step with no press is just a card with Next. {special} / {cost} = your weapon's Special and its Focus cost.
  lesson: {
    biscuits: 2,   // lent for Eat + Throw; leftovers are taken back when the fight ends
    resultLine: 'Every button pressed at least once.\nSergeant Bruise is satisfied. Mostly.',   // the results screen after the lesson
    biscuit: { name: 'Practice Biscuit', emoji: '🍪', tier: 'Edible', heal: 6, throwDamage: 4, element: 'blunt', practice: true },
    pressLabel: { attack: 'Press ATTACK', skills: 'Press SKILLS, then your Special', defend: 'Press DEFEND', rizz: 'Press RIZZ, then ROAST', eat: 'Press EAT, then a biscuit', throw: 'Press THROW, then a biscuit', flee: 'Press FLEE' },
    steps: [
      { text: 'Time\'s stopped, recruit. Bottom left: your HP, TURN, LIMIT and FOCUS bars. Over the dummy: its HP and turn bar. Turn bars fill on their own; when yours is full, pick a move.' },
      { press: 'attack', text: 'ATTACK: a plain hit. Every hit that lands builds Focus. Hit it.',
        done: 'FOCUS went up. Getting hit builds it too.' },
      { press: 'skills', allow: ['skills', 'skill'], text: 'SKILLS: weapon moves paid with Focus. Your {special} costs {cost}. Press Skills, then {special}. More unlock with Melee levels.',
        done: 'Use your Special whenever Focus allows.' },
      { press: 'defend', enemyHits: true, text: 'The icon over the dummy shows its next move: a hit. DEFEND softens it. Press it and watch.',
        done: 'Defend JUST before a hit lands for a Perfect Block: no damage, and a free hit back.' },
      { press: 'rizz', allow: ['rizz', 'roast'], text: 'RIZZ: talk, don\'t hit. Charm makes an enemy leave (not bosses); Roast lowers its attack. Fail and it gets angry. Press Rizz, then Roast.',
        done: 'Your Rizz level decides the odds. Roasting a dummy: a new low.' },
      { press: 'eat', allow: ['eat', 'practice'], text: 'Two Practice Biscuits, on loan. EAT heals; some dishes also boost you for a few turns. Press Eat, then a biscuit.',
        done: 'Cooked food heals far more than raw.' },
      { press: 'throw', allow: ['throw', 'practice'], text: 'THROW a dish for damage. Some foods hurt some enemies much more. Press Throw, then the other biscuit.',
        done: 'Splat. Even burnt food can be thrown.' },
      { text: 'LIMIT fills when you get hurt or Defend. When full, a LIMIT BREAK button appears: one huge move. Save it for a bad moment.' },
      { press: 'flee', text: 'FLEE: run away. It can fail, and you get no loot. Today it works. Press Flee to end the lesson.' },
    ],
  },

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
  dummyDone: 'The dummy has had enough lessons for one day. So has Sergeant Bruise.',
  dummyFled: 'The lesson didn\'t finish. Walk up to the dummy to start it again.',
  // The card in the top left, and the skip question
  cardTitle: '🏝️ ORIENTATION',
  skipAsk: 'Skip the tutorial?',
  skipText: 'You sail straight to Foopville with {coins} coins.\nYou keep whatever you made here.',
};
