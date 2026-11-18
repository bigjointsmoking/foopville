// ============================================================
// QUESTS — the jobs on the Quest Board (Refinement Phase 5, approved by Jesus 2026-11-10).
// The board refills: it always shows `boardSize` quests that fit your levels. You can have
// `maxActive` taken at once. A finished quest rests until you've handed in `restAfter` others,
// then it can come back. Rewards are PLACEHOLDERS (doubled in v0.78, Jesus: quests should pay more).
//
// Each quest (challenge: the default kind):
//   difficulty      'easy' | 'medium' | 'hard', shown on the board (Jesus 2026-11-17; which quest gets which is a PLACEHOLDER)
//   name, text      what the board says
//   reward          coins when you hand it in at the board
//   need            (optional) skill levels before it can show up: { gardening: 8 }
//   goal            what counts:
//     { fetch: 'glowcap_mushroom', count: 3 }   have these in your bag when you hand in (they're taken)
//     { event: 'kill', count: 5, match: {...} } happen this many times after you take the quest
//     perRun: true                               ...all within ONE trip to the Forest
//   match (optional) only events like this count:
//     enemy: 'squirrel'     which enemy
//     minTier: 'delicious'  a cooked dish at least this good (delicious = 3 stars)
//     element: 'Fire'       a cooked dish of this element
//     method: 'bake'        a dish cooked this way
//     maxTime: 1080         seconds (a run finished in this time or less)
//     maxKills: 0           kills this run, or fewer
//     area: 3               which Forest area (3 = Deep Woods)
// SIDE STORIES (kind: 'side', v0.78): from = the villager who posts it, steps = what you do, in order:
//     { talk: 'seeds', say: '...' }                         go talk to them (the 📜 button in their window)
//     { bring: { squirrel_jerky: 5 }, to: 'smith', say }    give them things from your bag
//     { event: 'kill', count: 5, match: {...}, goal: '...' } do something out in the world
//   The villager at the last step pays `reward`. All side-story text is a PLACEHOLDER for Jesus to rewrite.
// Events the game sends: kill, charm, throw, cook, secret (found a secret recipe), campfire,
//   boss (beat the Guardian), perfectBlock, formation (broke a pigeon formation),
//   ledger (ripped the goblin's ledger), notice (broke the Guardian's Last Warning).
// ============================================================
window.FUP = window.FUP || {};

FUP.questData = {
  maxActive: 3,   // quests you can have taken at once, PER KIND (3 side stories + 3 challenges)
  boardSize: { side: 4, challenge: 4 },   // quests offered on each tab of the board
  // Board tabs (v0.78, Jesus: keep the old quests, add story-like side quests, keep it organized)
  kinds: {
    quest:     { name: 'Quests',       tag: 'QUEST',     blurb: 'Villagers\' own stories. Check the Requirements. Or talk to anyone with a ❗.' },
    side:      { name: 'Errands',      tag: 'ERRAND',    blurb: 'Quick odd jobs for coins. Take one, then go see who asked.' },
    challenge: { name: 'Challenges',   tag: 'CHALLENGE', blurb: 'Prove yourself. Do it, then hand it in here.' },
    story:     { name: 'Story',        tag: 'STORY',     blurb: 'The main story starts here soon.' },
  },
  restAfter: 3,   // a finished quest comes back after you hand in this many others
  // Difficulty labels on the board
  difficulties: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },

  quests: {
    // ---------- Any level ----------
    glowcaps: {
      difficulty: 'easy', name: 'The Glowcap Situation', reward: 60,
      text: 'Bring 5 Glowcap Mushrooms. The lamp oil supplier has "retired". Into a mushroom.',
      goal: { fetch: 'glowcap_mushroom', count: 5 },
    },
    fixAnything: {
      difficulty: 'medium', name: 'Fix Something', reward: 240, req: { facts: { 'repair:well': 1 } },
      text: 'Repair anything on the Restoration Board. Anything. Please.',
      goal: { event: 'repair', count: 1 },
    },
    census: {
      difficulty: 'easy', name: 'Squirrel Census', reward: 70,
      text: 'Defeat 6 Disgruntled Squirrels. We are counting them. Fewer is easier to count.',
      goal: { event: 'kill', count: 6, match: { enemy: 'squirrel' } },
    },
    hotPotato: {
      difficulty: 'easy', name: 'Food Fight', reward: 70,
      text: 'Throw 3 dishes at enemies. Wasting food is a sin. Unless it hits.',
      goal: { event: 'throw', count: 3 },
    },
    spicy: {
      difficulty: 'hard', name: 'Spice Emergency', reward: 100,
      text: 'Cook a Fire dish with 3 stars or more (a level 20+ recipe, like Dragon Fritters). The Mayor wants to feel something.',
      goal: { event: 'cook', count: 1, match: { minTier: 'delicious', element: 'Fire' } },
    },
    charmer: {
      difficulty: 'medium', name: 'Smooth Operator', reward: 120,
      text: 'Charm 3 enemies in a single trip to the Forest. Love is a battlefield. Literally.',
      goal: { event: 'charm', count: 3, perRun: true },
    },
    blocks: {
      difficulty: 'medium', name: 'Read the Room', reward: 120,
      text: 'Pull off 3 Perfect Blocks (Defend right before a 💥 heavy hit). Flinching is not a technique.',
      goal: { event: 'perfectBlock', count: 3 },
    },
    birds: {
      difficulty: 'medium', name: 'Bird Strike', reward: 100,
      text: 'Break a pigeon Formation: take out the 📣 one before the flock dives. Ruin their choreography.',
      goal: { event: 'formation', count: 1 },
    },
    ledger: {
      difficulty: 'medium', name: 'Paperwork', reward: 90,
      text: "Rip the Moss Goblin's ledger twice (a Skill or a thrown dish while it's up). Tax evasion, but heroic.",
      goal: { event: 'ledger', count: 2 },
    },
    pacifist: {
      difficulty: 'hard', name: 'Conflict Avoidance', reward: 140,
      text: 'Reach the Deep Woods campfire (the third one) without defeating a single enemy. Charming and running away are fine.',
      goal: { event: 'campfire', count: 1, match: { maxKills: 0, area: 3 } },
    },

    // ---------- Farming ----------
    onions: {
      difficulty: 'easy', name: "Farmers' Market", reward: 100, req: { skills: { gardening: 3 } },
      text: 'Bring 6 Tear-Jerk Onions. The market is crying out for them. Literally, they make everyone cry.',
      goal: { fetch: 'tear_jerk_onion', count: 6 },
    },
    lemons: {
      difficulty: 'medium', name: 'Lemon Shortage', reward: 140, req: { skills: { gardening: 8 } },
      text: 'Bring 5 Grumpy Lemons. The village lemonade stand has run out of disappointment.',
      goal: { fetch: 'grumpy_lemon', count: 5 },
    },
    embers: {
      difficulty: 'medium', name: 'Hot Stuff', reward: 220, req: { skills: { gardening: 15 } },
      text: 'Bring 4 Ember Peppers. The Blacksmith says his forge "lacks enthusiasm".',
      goal: { fetch: 'ember_pepper', count: 4 },
    },
    heartroots: {
      difficulty: 'hard', name: 'Heartroot Delivery', reward: 300, req: { skills: { gardening: 20 } },
      text: 'Bring 3 Heartroots. Nobody will say what for. Nobody makes eye contact.',
      goal: { fetch: 'heartroot', count: 3 },
    },

    // ---------- Cooking ----------
    pies: {
      difficulty: 'medium', name: 'Pie Day', reward: 140, req: { skills: { cooking: 13 } },
      text: 'Bake 3 pies or tarts (any recipe cooked with Bake). It is Pie Day. It was always Pie Day.',
      goal: { event: 'cook', count: 3, match: { method: 'bake' } },
    },
    secret: {
      difficulty: 'medium', name: 'The Secret Ingredient', reward: 200, req: { skills: { cooking: 6 } },
      text: 'Discover a secret recipe. Chef Marrowbone sells riddles, if you can stand him.',
      goal: { event: 'secret', count: 1 },
    },

    // ---------- The Mushroom Guardian ----------
    contest: {
      difficulty: 'hard', name: 'Contest It', reward: 240,
      text: "Break the Mushroom Guardian's 📜 Last Warning: hit it hard enough before the DOOR SLAM lands. Paperwork fights back.",
      goal: { event: 'notice', count: 1 },
    },
    speedrun: {
      difficulty: 'hard', name: 'Rush Job', reward: 300,
      text: 'Beat the Mushroom Guardian in under 18 minutes (run timer). The door won\'t wait.',
      goal: { event: 'boss', count: 1, match: { maxTime: 1080 } },
    },
    // ================= ERRANDS (kind 'side': v0.78 side stories, renamed in v0.79; givers fixed so the ask fits who they are) =================
    forgeFuel: { kind: 'side', from: 'smith', difficulty: 'easy', name: 'Forge Fuel', reward: 70,
      text: 'The Blacksmith burns Bark to keep the forge hot. He\'s out. He\'s cold. He\'s cranky. Bring 6.',
      steps: [
        { bring: { bark: 6 }, to: 'smith', say: 'Good. Dry. Burns hot. Like my temper. Here.' },
      ] },
    pipLetter: { kind: 'side', from: 'seeds', difficulty: 'easy', name: 'A Letter for Hollis', reward: 60,
      text: 'Pip needs a letter carried to Hollis on the farm. It\'s about turnips. It\'s always about turnips.',
      steps: [
        { talk: 'seeds', say: 'Take this to Hollis. Don\'t read it. You\'ll only get upset about turnips.' },
        { talk: 'farmhand', say: 'From Pip? ...He\'s still on about the turnips. Here, for your trouble. Tell him nothing.' },
      ] },
    barkShortage: { kind: 'side', from: 'carpenter', difficulty: 'easy', name: 'Bark Shortage', reward: 70,
      text: 'Planksworth is out of Bark. Bring him 6 pieces. He\'ll pretend he had some all along.',
      steps: [
        { bring: { bark: 6 }, to: 'carpenter', say: 'Six pieces. Perfectly level. Well. Bark-shaped. Thank you.' },
      ] },
    guppyOrder: { kind: 'side', from: 'shop', difficulty: 'easy', name: 'Fresh Fish Wanted', reward: 70,
      text: 'The Shopkeeper has a customer who wants 3 Grumpy Guppies. The village pond has plenty. Attitude included.',
      steps: [
        { bring: { grumpy_guppy: 3 }, to: 'shop', say: 'Still flapping. Perfect. My customer likes them judgmental.' },
      ] },
    berryTasting: { kind: 'side', from: 'chef', difficulty: 'easy', name: 'A Matter of Taste', reward: 70,
      text: 'Chef Marrowbone needs 6 Grumpleberries for "research". The research is eating them.',
      steps: [
        { bring: { grumpleberry: 6 }, to: 'chef', say: 'Ripe. Sour. Spiteful. Exactly like me. Research complete.' },
      ] },
    missingPins: { kind: 'side', from: 'quest', difficulty: 'medium', name: 'The Missing Pins', reward: 140,
      text: 'The Quest Board Keeper is out of pins. Without pins, there is no board. Without a board, there is NOTHING.',
      steps: [
        { talk: 'quest', say: 'PINS! Gone! Ask the Blacksmith! He makes POINTY things!' },
        { talk: 'smith', say: 'Pins? I make swords. Ask Planksworth. He makes small pointy wood.' },
        { talk: 'carpenter', say: 'Wooden pins. A whole jar. He asks every month. Here.' },
        { talk: 'quest', say: 'PINS! The board LIVES! You are a HERO! A small one!' },
      ] },
    pestControl: { kind: 'side', from: 'farmhand', difficulty: 'medium', name: 'Pest Control', reward: 150,
      text: 'Squirrels keep digging up Hollis\'s onions. Thin them out in the Forest Edge. Politely.',
      steps: [
        { event: 'kill', count: 6, match: { enemy: 'squirrel' }, goal: 'Defeat 6 Disgruntled Squirrels' },
        { talk: 'farmhand', say: 'Six fewer diggers. The onions are grateful. They can\'t say it. Onions.' },
      ] },
    cookOff: { kind: 'side', from: 'chef', difficulty: 'medium', name: 'Kitchen Trial', reward: 150,
      text: 'Marrowbone wants proof you can cook. Cook 3 dishes, then report back. He will not taste them.',
      steps: [
        { event: 'cook', count: 3, goal: 'Cook 3 dishes' },
        { talk: 'chef', say: 'Three dishes and nobody died? Acceptable. Barely. Take this before I change my mind.' },
      ] },
    chiliHeat: { kind: 'side', from: 'chef', difficulty: 'medium', name: 'Hot Enough', reward: 160,
      text: 'Marrowbone wants 4 Dragon\'s Sneeze Chilies for a dish he refuses to name. It will hurt someone.',
      steps: [
        { bring: { dragons_sneeze_chili: 4 }, to: 'chef', say: 'Four. Glorious. Someone at the next banquet is going to cry. Probably me.' },
      ] },
    roofPigeons: { kind: 'side', from: 'carpenter', difficulty: 'medium', name: 'Pigeons on the Roof', reward: 170,
      text: 'Pigeons keep landing on Planksworth\'s roof and judging his joinery. Drive off 6 of them.',
      steps: [
        { event: 'kill', count: 6, match: { enemy: 'pigeon' }, goal: 'Defeat 6 Pigeons With a Grudge' },
        { talk: 'carpenter', say: 'The roof is quiet. My joinery is unjudged. Finally.' },
      ] },
    oldSoup: { kind: 'side', from: 'oldtimer', difficulty: 'medium', name: "Grandmother's Soup", reward: 150,
      text: 'The Old-timer misses a soup his grandmother made. He thinks Marrowbone might know it.',
      steps: [
        { talk: 'oldtimer', say: 'Glowcaps, she used. Lots of them. Ask the chef. He pretends to know everything.' },
        { bring: { glowcap_mushroom: 4 }, to: 'chef', say: 'Glowcap soup. It\'s just glowcaps. Don\'t tell him that. Here, take him this bowl.' },
        { talk: 'oldtimer', say: 'Hm. Not quite hers. Close, though. Thank you. Really.' },
      ] },
    herringRun: { kind: 'side', from: 'fishmonger', difficulty: 'medium', name: 'Catch of the Day', reward: 170, req: { facts: { 'repair:south_road': 1 } },
      text: 'Gill on the Docks is short on Dock Herring. Catch 4. Gill will act like it\'s nothing.',
      steps: [
        { bring: { dock_herring: 4 }, to: 'fishmonger', say: 'Four herring. Fine. Good, even. Don\'t let it go to your head.' },
      ] },
    swampGoods: { kind: 'side', from: 'shop', difficulty: 'hard', name: 'Swamp Goods', reward: 320, req: { facts: { 'repair:east_bridge': 1 } },
      text: 'The Shopkeeper wants Marsh goods to sell at a "reasonable" markup. 4 Croakberries and 2 Marsh Mint.',
      steps: [
        { bring: { croakberry: 4, marsh_mint: 2 }, to: 'shop', say: 'Swamp-fresh! I\'ll triple the price and call it artisan.' },
      ] },
    heartrootGift: { kind: 'side', from: 'seeds', difficulty: 'hard', name: 'Something That Grows', reward: 340,
      text: 'Pip wants 3 Heartroots from the Deep Woods. He says he just wants to see something grow for once.',
      steps: [
        { bring: { heartroot: 3 }, to: 'seeds', say: 'Look at them. Grown. Somewhere, at least. Thank you. Don\'t tell anyone I smiled.' },
      ] },
    deepPatrol: { kind: 'side', from: 'quest', difficulty: 'hard', name: 'Deep Woods Patrol', reward: 360,
      text: 'The Quest Board Keeper wants someone to walk the Deep Woods and reach its campfire. Then report back. LOUDLY.',
      steps: [
        { event: 'campfire', count: 1, match: { area: 3 }, goal: 'Reach the Deep Woods campfire' },
        { talk: 'quest', say: 'You came BACK! From the DEEP WOODS! I\'ll put it on the board! In BIG letters!' },
      ] },
  },
};
