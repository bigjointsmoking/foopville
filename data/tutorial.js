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
  steps: [
    { kind: 'talk', tutor: 'greeter', goal: 'Talk to Greta the Greeter',
      pages: [
        'Welcome to Orientation Isle, {name}. Everyone starts here. Most people leave. Eventually.',
        'Over the water is Foopville, your new home. Before the ferry takes you there, the tutors here will teach you everything: fishing, farming, cooking, building, finding your way, quests and fighting.',
        'Your new life, the short version: catch and grow food, cook it, fight your way through the Forest, fix up the run-down village, and push further out into a world full of nastier places and bigger bosses. Nobody expects much. Prove them right, or don\'t.',
        'To walk: {walk}. Walk up to anyone or anything and {talk} to use it. The card in the top left always says what to do next, and the arrow points to it.',
        { normal: 'You picked Normal mode. If you die, you wake up at home and your things wait in a grave where you fell. Fetch them within 15 minutes of play.',
          hardcore: 'You picked Hardcore mode. If you die, that character is gone for good. Levels, coins, house, everything. No pressure.' },
        'Time passes while you play: 20 minutes is one day (the Day label, top right). Crops keep growing, and scrap piles and the Market refill every new day. Your bed at home heals you fully; late in the day it lets you sleep until the next morning.',
        'Your screen: HP at the bottom left (it does NOT refill by itself), 🎒 your backpack, 🗺️ the world map, 📊 your skills. First, open your backpack: {pack}.',
      ],
      again: 'Old Finnick is by the pond. He has been by the pond for years. Go and see him.' },
    { kind: 'do', event: 'pack', at: 'pack', goal: 'Open your 🎒 backpack',
      done: 'Your backpack: ingredients, dishes, gear, your weapon on the left. Tap anything to see what it does. Next: 📊 Skills, top left.' },
    { kind: 'do', event: 'skills', at: 'skills', goal: 'Open 📊 Skills (top left)',
      done: 'Ten skills, all level 1. You level a skill by doing it, and every few levels unlocks something. The guide lists what. Now: Old Finnick, by the pond.' },

    { kind: 'talk', tutor: 'fisher', goal: 'Talk to Old Finnick by the pond',
      pages: [
        'Fishing. You stand by the water, you wait, and you pretend you know what you\'re doing.',
        'Stand next to the rings in the pond and {talk}. When a fish bites, keep it inside the zone until the bar fills up. Let it slip and the fish wins.',
        'Fish are food: cook them or sell them. Higher Fishing levels catch better fish. Foopville has a pond, and the Docks have the sea, once somebody fixes the South Road.',
      ],
      again: 'The rings in the water. That\'s where the fish are. Allegedly.' },
    { kind: 'do', event: 'fish', at: 'pond', goal: 'Catch a fish (stand by the rings)',
      done: 'A fish. Small, angry, and now yours.' },

    { kind: 'talk', tutor: 'farmer', goal: 'Talk to Turnip Tess at the farm patch',
      pages: [
        'Farming! Crops grow while you play, and keep growing while the game is closed.',
        'This patch is yours for today. Hoe it, plant a seed, water it, then pick what grows. Walk onto the patch and {talk} for each job.',
        'Crops want water at every stage, or they wilt. Here they grow in seconds; back home they take real minutes.',
        'Your cottage in Foopville comes with farm patches. Buy seeds from Pip on the farm, south of the village square. Hollis the Farmhand sells more patches. Fill your watering can at water.',
      ],
      again: 'Hoe, plant, water, wait, pick. Farming is mostly the waiting part.' },
    { kind: 'do', event: 'hoe', at: 'patch', goal: 'Hoe the farm patch', done: 'Soil, exposed. It looks surprised.' },
    { kind: 'do', event: 'plant', at: 'patch', goal: 'Plant the seed', done: 'A seed, in the ground. Nature will take it from here. Slowly.' },
    { kind: 'do', event: 'water', at: 'patch', goal: 'Water the seedling', done: 'Watered. Now it grows. Stand there and feel useful.' },
    { kind: 'do', event: 'harvest', at: 'patch', goal: 'Wait for it to grow, then pick it', grow: true,
      done: 'Grumpleberries. They look exactly as happy as their name suggests.' },

    { kind: 'talk', tutor: 'cook', goal: 'Talk to Burnt Bertram by the campfire',
      pages: [
        'Cooking. Put ingredients in the pot, pick a method, and cook. Cooked food heals far more than raw.',
        'Every recipe needs a Cooking level. Start with a Roasted Grumpleberry: one Grumpleberry, Grill. Your fish needs Cooking 2. Ambitious of you.',
        'Dishes go in your satchel. In a fight you eat them to heal, or throw them at things. Never go into the Forest without food.',
        'Where to cook: your cottage has no stove yet (Planksworth the Carpenter sells one). Until then, you cook at campfires.',
        'Out in the Forest, every area has a campfire like this one. There you can cook, Rest once per trip to get some HP back, change your gear, and choose: keep going, or walk home safely.',
        'Walk into the campfire to start cooking. The 📖 Recipes button lists every recipe you know.',
      ],
      again: 'The campfire. Walk into it. Carefully. That\'s how cooking starts.' },
    { kind: 'do', event: 'cook', at: 'campfire', goal: 'Cook a dish at the campfire',
      done: 'Food. Edible, probably. Keep it for the fight.' },

    { kind: 'talk', tutor: 'builder', goal: 'Talk to Nailbiter Nell', give: { bark: 3 },
      pages: [
        'Building. Foopville is falling apart, and fixing it takes materials: planks, nails and stone. They go in your materials pouch, which never fills up.',
        'You get materials by prying apart scrap piles: collapsed sheds, fallen trees, broken carts. There\'s a shed right next to me. Walk up and {talk}. Emptied piles come back the next day.',
        'You can also saw Bark into planks at a sawhorse. Here\'s some Bark. Pry the shed first, then saw yourself a plank.',
        'In Foopville, the Restoration Board by the well lists the repairs. Each one opens something new: the Well first, then the South Road to the Docks, then the East Bridge to the Marsh.',
        'Villagers also put up signs asking you to build them things. Build them and they pay you. Planksworth the Carpenter sells furniture, and a stove for your kitchen.',
      ],
      again: 'Pry the shed, saw the Bark. Materials, then repairs. That\'s building.' },
    { kind: 'do', event: 'salvage', at: 'salvage', goal: 'Pry apart the collapsed shed',
      done: 'Planks and nails, liberated from a shed that had given up anyway.' },
    { kind: 'do', event: 'saw', at: 'saw', goal: 'Saw a plank at the sawhorse',
      done: 'A plank. Splinters included at no extra cost.' },

    { kind: 'talk', tutor: 'scout', goal: 'Talk to Scout Wanda on the path',
      pages: [
        'Lost already? Good, that\'s my job. First, open the 🗺️ world map (the button at the bottom, or M on a keyboard).',
      ],
      again: 'The 🗺️ button at the bottom. Open it. Maps work better when you look at them.' },
    { kind: 'do', event: 'map', at: 'map', goal: 'Open the 🗺️ world map',
      done: 'That\'s the world, or the part of it you know. Close it and talk to Wanda again.' },
    { kind: 'talk', tutor: 'scout', goal: 'Talk to Scout Wanda again',
      pages: [
        'Foopville is home: shops, your cottage, the Quest Board. Nothing there tries to eat you. Everywhere else, something does.',
        'Walk out of the village\'s north gate and you\'re in the Forest Edge (Lv 1-5). Keep going east: the Goblin Toll Road (Lv 5-9), then the Deep Woods (Lv 9-13). Each number is the Melee level you want before going in.',
        'Leaving the village starts a trip. Out there, enemies chase you when they spot you and touching one starts a fight. Fog hides what you haven\'t seen yet. Pick up the ingredients lying around.',
        'To get home, walk back out the way you came, or pick "Walk back" at a campfire. That ends the trip safely and you keep everything you carry.',
        { normal: 'Die on a trip and your things drop in a grave right there. You wake up at home with 15 minutes of play to go and fetch them.',
          hardcore: 'Die on a trip and that\'s the end: new life, new name, back to this island. Know when to walk home.' },
        'The world is bigger than it looks. Areas hide secrets and bosses, and the deeper you go, the better the loot and the worse the company. Explore, get stronger, go further.',
        'The other roads out of Foopville are broken: the South Road (🪨) to the Docks and the East Bridge (🌉) to the Soggy Marsh. Repair them at the Restoration Board and they open up. Locked places show as ??? on the map.',
      ],
      again: 'North gate, Forest, campfires, walk home. And find that hole in the Deep Woods, eventually.' },

    { kind: 'talk', tutor: 'merchant', goal: 'Talk to the Shopkeeper',
      pages: [
        'Oh, a new customer! I came over from Foopville to meet you before anyone else gets your money.',
        'Coins come from fights, quests and selling. Sell me what you don\'t need: ingredients, dishes, gear. Gill at the Docks pays more for raw fish, once the road is fixed.',
        'Haggling: once per visit you can try to charm me. Win and I sell cheaper AND pay you more. Lose and prices go up. Your Rizz level decides the odds. Haggle BEFORE you sell. Ugh. I said it.',
        'Go on, try it: walk up to me again, press 😎 Haggle, then sell me something on the Sell tab.',
      ],
      again: 'Haggle first, then sell. In that order. I can\'t believe I\'m helping you.' },
    { kind: 'do', event: 'haggle', at: 'merchant', goal: 'Open her shop and press 😎 Haggle',
      done: 'Haggled. Win or lose, it counted, and Rizz XP is Rizz XP.' },
    { kind: 'do', event: 'sell', at: 'merchant', goal: 'Sell something on the Sell tab',
      done: 'Coins! Not many. Hold them carefully. They spook easily.' },

    { kind: 'talk', tutor: 'quests', goal: 'Talk to Clipboard Clive',
      pages: [
        'Quests! Someone wants a thing done, you do it, they pay you. Like a job, but you\'re allowed to say no.',
        'In Foopville the Quest Board Keeper has a board full of jobs: beat things, cook things, catch things. Take up to {maxQuests} at a time. When one is done, go back to the board and hand it in for coins.',
        'The 📜 at the bottom of the village screen counts your quests and says when one is ready to hand in. New quests show up as you finish old ones.',
        'Here\'s your first one: finish Sergeant Bruise\'s combat lesson in the ring. Then come back to me and hand it in.',
      ],
      again: 'Your quest: finish Sergeant Bruise\'s combat lesson. Then come back here. The paperwork waits for no one.' },
    { kind: 'talk', tutor: 'combat', goal: 'Talk to Sergeant Bruise by the ring',
      pages: [
        'Fighting! Out there, fights happen in real time and nothing waits for you. In here, I stop time and walk you through every button, one at a time.',
        'Your HP does not refill after a fight. Eat, Rest at a campfire, or sleep in your bed at home. Winning gives Melee XP, coins, ingredients and sometimes gear. The Blacksmith in Foopville sells better gear; wear it from your backpack.',
        { normal: 'Out there, lose all your HP and you drop your things in a grave. In here, the dummy can\'t hurt you much. It has tried.',
          hardcore: 'Out there, lose all your HP and your whole life ends. In here, the dummy can\'t hurt you much. It has tried.' },
        'Walk into the ring and up to the dummy to start the lesson.',
      ],
      again: 'The dummy is in the ring. Walk up to it and we start.' },
    { kind: 'do', event: 'fight', at: 'dummy', goal: 'Do the combat lesson (walk up to the dummy)',
      done: 'Lesson over. You now know every button. Knowing when to press them is the hard part.' },
    { kind: 'talk', tutor: 'quests', goal: 'Hand in your quest to Clipboard Clive', reward: true,
      pages: [
        'Combat lesson: done. Paperwork: complete. Here\'s your reward: Rizz XP. Charm, it turns out, can be earned.',
        'That\'s how quests work. Captain Dreary is at the end of the pier. The ferry is waiting. Shoo.',
      ],
      again: 'The ferry. End of the pier. You can\'t miss it. People have tried.' },

    { kind: 'talk', tutor: 'captain', goal: 'Take the ferry from Captain Dreary on the pier', leave: true,
      pages: [
        'Ferry to Foopville. One way. Nobody comes back. Nobody\'s asked to.',
        'Here\'s {coins} coins for a fresh start. The trip is free, I just feel bad for you. The sea air will patch you up, too.',
        'Everyone asks what to do first, so here: 1) Talk to the Quest Board Keeper in the square and take a couple of quests. 2) Buy seeds from Pip on the farm and plant them in your cottage\'s patches.',
        '3) Walk out the north gate into the Forest Edge. Fight, pick up ingredients, cook at the campfire, and walk home before your HP runs low.',
        '4) Sell what you don\'t need to the Shopkeeper and buy better gear from the Blacksmith. 5) Pry scrap piles around the village and put coins and planks toward the Well at the Restoration Board.',
        'Sleep in your bed at home to heal fully. When your Melee level matches the next area on the 🗺️ map, go deeper. The world is waiting. It is not excited. Off you go.',
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
      { text: 'Right, recruit. I\'ve stopped time. Bottom left: your HP, your TURN bar, your LIMIT bar and FOCUS. Over the dummy: its HP and its own turn bar. In a real fight both turn bars fill on their own, and when yours is full you pick a move.' },
      { press: 'attack', text: 'ATTACK: a plain hit with your weapon. Every hit that lands also builds Focus. Go on, hit it.',
        done: 'Good. Watch the FOCUS bar: it went up. Getting hit builds Focus too.' },
      { press: 'skills', allow: ['skills', 'skill'], text: 'SKILLS: your weapon\'s special moves. They cost Focus. Your {special} costs {cost} Focus, and you have enough. Press Skills, then {special}. More skills unlock at higher Melee levels.',
        done: 'That\'s your Special. Use it whenever your Focus allows.' },
      { press: 'defend', enemyHits: true, text: 'See the icon over the dummy? That\'s what it\'s about to do. A hit is coming. DEFEND makes the next hit hurt less. Press it, then watch.',
        done: 'Much less painful. Pro tip: Defend JUST before a hit lands and it\'s a Perfect Block: no damage, and you hit back for free.' },
      { press: 'rizz', allow: ['rizz', 'roast'], text: 'RIZZ: talking instead of hitting. Charm makes an enemy leave (not bosses), Roast lowers its attack. If it fails, the enemy gets angry. Press Rizz, then Roast.',
        done: 'Your Rizz level decides the odds. Roasting a dummy: a new low, even for you.' },
      { press: 'eat', allow: ['eat', 'practice'], text: 'I\'ve lent you two Practice Biscuits. EAT a dish to heal. Some dishes also boost you for a few turns. Press Eat, then a biscuit.',
        done: 'Healed. Cooked food heals far more than raw. Never go out without food.' },
      { press: 'throw', allow: ['throw', 'practice'], text: 'THROW a dish at an enemy for damage. Some foods hurt some enemies much more; you find out by trying. Press Throw, then the other biscuit.',
        done: 'Splat. Even burnt food can be thrown.' },
      { text: 'The LIMIT bar fills when you get hurt or Defend. When it\'s full, a LIMIT BREAK button appears: one huge move. Save it for a bad moment.' },
      { press: 'flee', text: 'FLEE: run away. It doesn\'t always work, and you get no loot. Today it works. Press Flee to end the lesson.' },
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
