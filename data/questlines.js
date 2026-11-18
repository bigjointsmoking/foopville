// ============================================================
// QUESTS (RuneScape-style, v0.79): villagers' own stories, in steps, with choices.
// Design: design/side-quests.md. Rules: src/systems/quests.js. Loaded after data/quests.js.
// They sit on the Quest Board's "Quests" tab with their Requirements, and you can also start one
// by talking to the villager (a ❗ over their head). Each can be done once per life.
// All names, lines and numbers are PLACEHOLDERS for Jesus to rewrite.
//
// A quest:
//   from        the villager who gives it        length   short / medium / long (shown on the board)
//   req         Requirements (src/systems/req.js): skills, finished quests as facts 'quest:<id>'
//   reward      coins · xp: { skill: XP } · bonus: [{ flag, gear | place, line }] (a choice you made adds it)
//   afterGreet  the villager's new greetings once it's done (the world remembers)
//   steps, in order. Every step has `log` (one line for the journal: the story so far) and one of:
//     { talk: npc, say }                         talk to them (📜 button in their window)
//     { talkAll: { npc: 'line', ... }, goal }    talk to each of them, any order
//     { bring: { item: n }, to: npc, say }       give them things from your bag
//     { search: { region, tx, ty, name }, say, when?: 'night', notYet? }   a 🔍 spot on a map
//     { fight: { region, tx, ty, enemy | group, name }, goal }   a quest enemy on the map: win (or charm) to go on
//     { event, count, match, goal }              something out in the world (like the challenges)
//   choices on talk / search steps: [{ label, say, flag?, rizz?: level, retry?: true }]
//     retry = a wrong answer: you hear `say` and stay on the step. flag = remembered for rewards and lines.
//   sayIf on a talk step: { flag: 'line' } = a different line if you made that choice earlier.
// ============================================================
window.FUP = window.FUP || {};

FUP.questData.lengths = { short: '⏱ Short', medium: '⏱ Medium', long: '⏱ Long' };

Object.assign(FUP.questData.quests, {

  // ---------------- Chef Marrowbone ----------------
  jerkyBandit: { kind: 'quest', from: 'chef', difficulty: 'easy', length: 'short', name: 'The Jerky Bandit',
    text: 'Someone is stealing Marrowbone\'s jerky. He suspects everyone. Mostly you.',
    reward: { coins: 120, xp: { cooking: 90, melee: 60 },
      bonus: [{ flag: 'sharedJerky', gear: 'acorn_charm', line: 'Nutsy left something on your doorstep. An acorn. On a string. You think it\'s a thank-you.' }] },
    afterGreet: ['The bandit is caught. My jerky is safe. My trust in squirrels is not.', 'Back for jerky? There is none. I ate it. Out of spite.'],
    steps: [
      { talk: 'chef', log: 'Marrowbone\'s jerky keeps disappearing. He wants the thief found.',
        say: 'Three strips gone. Every night. Check the bins behind my kitchen. Touch nothing. Especially not my bins.' },
      { search: { region: 'village', tx: 7, ty: 9, name: 'the kitchen bins' }, log: 'Behind the bins: tiny tracks, and a jerky crumb, heading out the north gate.',
        say: 'Tiny paw prints. A crumb of jerky. The tracks head out the north gate, into the Forest Edge.' },
      { fight: { region: 'edge', tx: 43, ty: 17, enemy: 'nutsy', name: 'Nutsy' }, log: 'At the east end of the Forest Edge: a very large squirrel with a very guilty face.',
        goal: 'Deal with the thief in the Forest Edge (east side)' },
      { search: { region: 'edge', tx: 44, ty: 16, name: 'the hollow log' }, log: 'Nutsy\'s stash: a hollow log full of the Chef\'s jerky.',
        say: 'A hollow log stuffed with jerky. Nutsy watches you from a branch. He looks hungry. And sorry. Mostly hungry.',
        choices: [
          { label: 'Take all the jerky back', say: 'You take every strip. Nutsy sighs like a tiny old man.' },
          { label: '😎 Leave Nutsy a piece', rizz: 5, flag: 'sharedJerky', say: 'You leave one strip. Nutsy takes it, nods once, and vanishes. Respect.' },
        ] },
      { talk: 'chef', log: 'Back to Marrowbone with the jerky.',
        say: 'My jerky! Slightly chewed. A squirrel? Of course. Here. Don\'t tell anyone a squirrel beat me.',
        sayIf: { sharedJerky: 'It\'s... short one strip. You let it keep one? Hm. Fine. Kindness is a terrible seasoning, but it works.' } },
    ] },

  // ---------------- Hollis the Farmhand ----------------
  whoTookTheHat: { kind: 'quest', from: 'farmhand', difficulty: 'medium', length: 'medium', name: 'Who Took the Hat?',
    text: 'Hollis\'s hat keeps vanishing. He has suspects. He has theories. He has a sunburn.',
    reward: { coins: 220, xp: { gardening: 140, rizz: 60 }, place: 'crow_scarecrow' },
    afterGreet: ['Hat\'s back. Crows are furious. Best week of my life.', 'You solved it. I\'ve told everyone. Twice. They didn\'t ask.'],
    steps: [
      { talk: 'farmhand', log: 'Hollis\'s hat has gone missing again. He suspects the Shopkeeper, Pip and Planksworth.',
        say: 'Gone again. Third time. Ask around. The Shopkeeper sells everything. Pip hates hats. Planksworth measured my head once. Suspicious.' },
      { talkAll: {
          shop: 'Hollis\'s hat? I wouldn\'t sell that. I couldn\'t. It smells like a haystack had a bad day. Ask the birds.',
          seeds: 'I don\'t hate hats. I hate optimism. Every morning a crow sits on my stall wearing something. Not my business.',
          carpenter: 'I measured his head for a shelf. Don\'t ask. I saw crows by the barn at dusk. Carrying... fabric.',
        }, goal: 'Ask the Shopkeeper, Pip and Planksworth about the hat', log: 'Everyone has an alibi. Everyone mentions birds.' },
      { talk: 'farmhand', log: 'Time to name the thief.',
        say: 'Well? Who did it? Point at them. Dramatically.',
        choices: [
          { label: 'The Shopkeeper', retry: true, say: 'Her? She\'d have sold it back to me by now. Think again.' },
          { label: 'Pip', retry: true, say: 'Pip? He can\'t reach the hook. He\'s tried. Think again.' },
          { label: 'Planksworth', retry: true, say: 'Planksworth only steals measurements. Think again.' },
          { label: 'The crows', say: 'Crows. Of course. They only come back at night. Check the dead tree behind the barn. Bring a lantern. Or courage.' },
        ] },
      { search: { region: 'village', tx: 21, ty: 37, name: 'the dead tree behind the barn' }, when: 'night',
        notYet: 'Just a dead tree. Empty. The crows come back at night (🌙 on the clock).',
        log: 'At night, in the dead tree: a crow\'s nest built out of Hollis\'s hat. And a spoon. And someone\'s sock.',
        say: 'A nest. Woven around a straw hat. Three crows glare at you. You take the hat. They take note.' },
      { talk: 'farmhand', log: 'Back to Hollis with the hat.',
        say: 'My HAT. Crows! I knew it. I said Planksworth, but I knew it. Here, I made this. They hate it.' },
    ] },

  // ---------------- The Blacksmith ----------------
  sparkyDayOut: { kind: 'quest', from: 'smith', difficulty: 'easy', length: 'short', name: 'Sparky\'s Big Day Out',
    text: 'Sparky, the Blacksmith\'s dog, ran into the Forest Edge. The Blacksmith is fine. Totally fine. Go.',
    reward: { coins: 120, xp: { melee: 120 } },
    afterGreet: ['Sparky\'s asleep by the forge. Don\'t wake him. Don\'t tell him I worried.', 'You found my dog. I still won\'t hug you. But I thought about it.'],
    steps: [
      { talk: 'smith', log: 'Sparky ran off into the Forest Edge. The Blacksmith is pretending not to panic.',
        say: 'Sparky chased a squirrel out the gate. Hours ago. He\'s not good at the forest. He\'s not good at anything. Find him.' },
      { search: { region: 'edge', tx: 10, ty: 10, name: 'paw prints' }, log: 'Paw prints in the mud, heading east.', say: 'Big paw prints, small squirrel prints. A chase. Heading east.' },
      { search: { region: 'edge', tx: 25, ty: 13, name: 'a chewed stick' }, log: 'A chewed stick. Sparky stopped to chew. Of course he did.', say: 'A stick, chewed to splinters. Sparky stopped for a snack. Priorities.' },
      { search: { region: 'edge', tx: 31, ty: 17, name: 'a muddy collar' }, log: 'His collar, stuck on a root. Barking from the south.', say: 'Sparky\'s collar, caught on a root. Somewhere south, frantic barking.' },
      { fight: { region: 'edge', tx: 30, ty: 22, group: ['squirrel', 'squirrel', 'squirrel'], enemy: 'squirrel', name: 'a squirrel gang' }, log: 'Sparky, cornered by three squirrels. They want his treats.',
        goal: 'Save Sparky from the squirrel gang (Forest Edge, south)' },
      { talk: 'smith', log: 'Sparky trots home beside you.',
        say: 'SPARKY. You idiot. You beautiful idiot. ...You. Thanks. Here. Don\'t make it a thing.' },
    ] },
});
