// ============================================================
// QUESTS — the jobs on the Quest Board (Refinement Phase 5, approved by Jesus 2026-11-10).
// The board refills: it always shows `boardSize` quests that fit your levels. You can have
// `maxActive` taken at once. A finished quest rests until you've handed in `restAfter` others,
// then it can come back. Rewards are PLACEHOLDERS.
//
// Each quest:
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
// Events the game sends: kill, charm, throw, cook, secret (found a secret recipe), campfire,
//   boss (beat the Landlord), perfectBlock, formation (broke a pigeon formation),
//   ledger (ripped the goblin's ledger), notice (contested the Final Notice).
// ============================================================
window.FUP = window.FUP || {};

FUP.questData = {
  maxActive: 3,   // quests you can have taken at once
  boardSize: 4,   // quests offered on the board
  restAfter: 3,   // a finished quest comes back after you hand in this many others

  quests: {
    // ---------- Any level ----------
    glowcaps: {
      name: 'The Glowcap Situation', reward: 30,
      text: 'Bring 5 Glowcap Mushrooms. The lamp oil supplier has "retired". Into a mushroom.',
      goal: { fetch: 'glowcap_mushroom', count: 5 },
    },
    fixAnything: {
      name: 'Fix Something', reward: 120, req: { facts: { 'repair:well': 1 } },
      text: 'Repair anything on the Restoration Board. Anything. Please.',
      goal: { event: 'repair', count: 1 },
    },
    census: {
      name: 'Squirrel Census', reward: 35,
      text: 'Defeat 6 Disgruntled Squirrels. We are counting them. Fewer is easier to count.',
      goal: { event: 'kill', count: 6, match: { enemy: 'squirrel' } },
    },
    hotPotato: {
      name: 'Food Fight', reward: 35,
      text: 'Throw 3 dishes at enemies. Wasting food is a sin. Unless it hits.',
      goal: { event: 'throw', count: 3 },
    },
    spicy: {
      name: 'Spice Emergency', reward: 50,
      text: 'Cook a Fire dish with 3 stars or more (a level 20+ recipe, like Dragon Fritters). The Mayor wants to feel something.',
      goal: { event: 'cook', count: 1, match: { minTier: 'delicious', element: 'Fire' } },
    },
    charmer: {
      name: 'Smooth Operator', reward: 60,
      text: 'Charm 3 enemies in a single trip to the Forest. Love is a battlefield. Literally.',
      goal: { event: 'charm', count: 3, perRun: true },
    },
    blocks: {
      name: 'Read the Room', reward: 60,
      text: 'Pull off 3 Perfect Blocks (Defend right before a 💥 heavy hit). Flinching is not a technique.',
      goal: { event: 'perfectBlock', count: 3 },
    },
    birds: {
      name: 'Bird Strike', reward: 50,
      text: 'Break a pigeon Formation: take out the 📣 one before the flock dives. Ruin their choreography.',
      goal: { event: 'formation', count: 1 },
    },
    ledger: {
      name: 'Paperwork', reward: 45,
      text: "Rip the Moss Goblin's ledger twice (a Skill or a thrown dish while it's up). Tax evasion, but heroic.",
      goal: { event: 'ledger', count: 2 },
    },
    pacifist: {
      name: 'Conflict Avoidance', reward: 70,
      text: 'Reach the Deep Woods campfire (the third one) without defeating a single enemy. Charming and running away are fine.',
      goal: { event: 'campfire', count: 1, match: { maxKills: 0, area: 3 } },
    },

    // ---------- Farming ----------
    onions: {
      name: "Farmers' Market", reward: 50, req: { skills: { gardening: 3 } },
      text: 'Bring 6 Tear-Jerk Onions. The market is crying out for them. Literally, they make everyone cry.',
      goal: { fetch: 'tear_jerk_onion', count: 6 },
    },
    lemons: {
      name: 'Lemon Shortage', reward: 70, req: { skills: { gardening: 8 } },
      text: 'Bring 5 Grumpy Lemons. The village lemonade stand has run out of disappointment.',
      goal: { fetch: 'grumpy_lemon', count: 5 },
    },
    embers: {
      name: 'Hot Stuff', reward: 110, req: { skills: { gardening: 15 } },
      text: 'Bring 4 Ember Peppers. The Blacksmith says his forge "lacks enthusiasm".',
      goal: { fetch: 'ember_pepper', count: 4 },
    },
    heartroots: {
      name: 'Heartroot Delivery', reward: 150, req: { skills: { gardening: 20 } },
      text: 'Bring 3 Heartroots. Nobody will say what for. Nobody makes eye contact.',
      goal: { fetch: 'heartroot', count: 3 },
    },

    // ---------- Cooking ----------
    pies: {
      name: 'Pie Day', reward: 70, req: { skills: { cooking: 13 } },
      text: 'Bake 3 pies or tarts (any recipe cooked with Bake). It is Pie Day. It was always Pie Day.',
      goal: { event: 'cook', count: 3, match: { method: 'bake' } },
    },
    secret: {
      name: 'The Secret Ingredient', reward: 100, req: { skills: { cooking: 6 } },
      text: 'Discover a secret recipe. Chef Marrowbone sells riddles, if you can stand him.',
      goal: { event: 'secret', count: 1 },
    },

    // ---------- The Landlord ----------
    contest: {
      name: 'Contest It', reward: 120,
      text: "Contest the Landlord's 📜 Final Notice: hit him hard enough before EVICTION lands. Paperwork fights back.",
      goal: { event: 'notice', count: 1 },
    },
    speedrun: {
      name: 'Eviction Express', reward: 150,
      text: 'Evict the Mushroom Landlord in under 18 minutes (run timer). The paperwork expires.',
      goal: { event: 'boss', count: 1, match: { maxTime: 1080 } },
    },
  },
};
