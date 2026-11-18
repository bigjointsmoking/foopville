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

  // ================= v0.80: the next four =================

  // ---------------- Chef Marrowbone, part 2 ----------------
  theCritic: { kind: 'quest', from: 'chef', difficulty: 'medium', length: 'medium', name: 'The Critic',
    req: { skills: { cooking: 10 }, facts: { 'quest:jerkyBandit': 1 } },
    text: 'A famous food critic is coming to Foopville. Marrowbone is calm. Marrowbone has not slept.',
    reward: { coins: 260, xp: { cooking: 220 }, hat: 'golden_toque', recipe: 'Squirrel Surprise' },
    afterGreet: ['The review is framed. In the kitchen. Facing the stove, so I see it while I work.', 'Four words. "Surprisingly, not terrible." I\'ve never been happier.'],
    steps: [
      { talk: 'chef', log: 'A food critic is coming. Marrowbone wants the best dish in Foopville on the table.',
        say: 'A critic. Tomorrow. He ruined three chefs with one adjective. Cook something good. Two stars at least. Bring me the news.' },
      { event: 'cook', count: 1, match: { minTier: 'tasty' }, goal: 'Cook a dish with 2 stars or more', log: 'You cooked something worth serving.' },
      { talk: 'chef', log: 'The critic has eaten. He wants to know who cooked it.',
        say: 'He ate it. All of it. He licked the plate, then pretended he didn\'t. Now he wants to know who cooked it. Well?',
        choices: [
          { label: 'Tell him you cooked it', flag: 'honest', say: 'You tell the truth. The critic writes "a newcomer". Marrowbone twitches. Then nods.' },
          { label: 'Let Marrowbone take the credit', flag: 'humble', say: 'You point at Marrowbone. He goes very red. He doesn\'t correct you.' },
          { label: '😎 "We cooked it together"', rizz: 12, flag: 'together', say: 'The critic writes "a kitchen that works as one". Marrowbone looks at you like you\'re a stranger he likes.' },
        ] },
      { talk: 'chef', log: 'The review is out.',
        say: 'The review. "Surprisingly, not terrible." It\'s the nicest thing anyone has ever written about this kitchen. Take these. Both. Before I cry.',
        sayIf: { humble: 'You gave me the credit. Nobody gives me anything. Here. A recipe I never share, and a hat I never wear. Go.',
                 together: '"Together." I\'ve never cooked together. It was awful. Let\'s never do it again. Take these.' } },
    ] },

  // ---------------- The Blacksmith, part 2 ----------------
  spoons: { kind: 'quest', from: 'smith', difficulty: 'medium', length: 'short', name: 'Spoons',
    req: { skills: { melee: 10 }, facts: { 'quest:sparkyDayOut': 1 } },
    text: 'The forge is busy at night. The Blacksmith says it\'s swords. Sparky says it isn\'t.',
    reward: { coins: 240, xp: { melee: 160, cooking: 80 }, gear: 'spoon_charm' },
    afterGreet: ['Swords. I make swords. ...And the occasional spoon. Shut up.', 'Sparky\'s got a spoon now. Don\'t look at me like that.'],
    steps: [
      { talk: 'smith', log: 'The Blacksmith is working late. He\'s very keen that you don\'t ask what on.',
        say: 'Late nights? Swords. Big ones. Very manly. Go away. Don\'t come back after dark.' },
      { search: { region: 'village', tx: 6, ty: 6, name: 'the forge window' }, when: 'night',
        notYet: 'Just the forge, ticking as it cools. Whatever he hides, he does it at night (🌙 on the clock).',
        log: 'Through the forge window at night: the Blacksmith, forging a tiny, perfect spoon.',
        say: 'Through the window: the Blacksmith, tongue out, hammering a tiny spoon. He polishes it. He kisses it. You saw that.' },
      { talk: 'smith', log: 'He knows you saw.',
        say: '...You saw. Fine. I like spoons. Swords are for stabbing. Spoons are for soup. Soup never hurt anyone. What are you going to do about it?',
        choices: [
          { label: 'Keep his secret', flag: 'kept', say: 'You promise. He looks at you a long time. Then hands you a spoon to test.' },
          { label: 'Tease him about it', flag: 'teased', say: '"Spoony." He goes purple. Then laughs. Then threatens you. Then hands you a spoon to test.' },
        ] },
      { event: 'cook', count: 1, goal: 'Cook a dish to test his spoon', log: 'You cooked with the Blacksmith\'s spoon. It stirs like a dream.' },
      { talk: 'smith', log: 'Back at the forge to report on the spoon.',
        say: 'Good? GOOD? Of course it\'s good. Keep it. It makes food better. Don\'t ask how. I don\'t know how.',
        sayIf: { teased: 'Still smirking? Keep the spoon anyway. And tell anyone, and I make YOU into a spoon.' } },
    ] },

  // ---------------- Planksworth ----------------
  theBridge: { kind: 'quest', from: 'carpenter', difficulty: 'hard', length: 'long', name: 'The Bridge',
    req: { skills: { building: 10 } },
    text: 'Planksworth built the old East Bridge. It fell down. He has measured everything since. Twice.',
    reward: { coins: 450, xp: { building: 800 }, place: 'model_bridge' },
    afterGreet: ['The bridge on your plot. Perfectly level. I check it with a tiny spirit level. It\'s fine. I\'m fine.', 'I sleep now. Not well. But I sleep.'],
    steps: [
      { talk: 'carpenter', log: 'Planksworth wants to know why his old East Bridge fell. He kept the plans. Somewhere.',
        say: 'My bridge. The East Bridge. It fell. Everyone says it was the river. I need to know. My old plans are under the rubble. Find them.' },
      { search: { region: 'village', tx: 58, ty: 40, name: 'the old bridge rubble' }, log: 'Under the rubble: Planksworth\'s plans, soggy but readable.',
        say: 'Under a broken beam: a roll of plans in a tin. Soggy. Readable. Every measurement circled three times.' },
      { talk: 'carpenter', log: 'The plans are perfect. Planksworth says it must have been the wood.',
        say: 'Perfect. Every number. So it was the wood. There\'s an old oak in the Deep Woods with the straightest grain alive. Bring me its bark. I\'ll test it.' },
      { search: { region: 'deepwoods', tx: 40, ty: 23, name: 'the old oak' }, log: 'The old oak in the Deep Woods: bark as straight as a ruler.',
        say: 'A huge old oak, grain straight as a ruler. You peel a strip of bark. It feels like it\'s judging you.' },
      { talk: 'carpenter', log: 'Planksworth tested the oak. Then looked at the plans again. Something is wrong.',
        say: 'The bark is perfect. The plans are perfect. So why did it fall? ...Look at this beam. It\'s drawn upside down. Is that... was that me?',
        choices: [
          { label: 'Tell him the truth: the plans were wrong', flag: 'truth', say: 'You nod. He sits down. For a long time. Then he laughs. "Upside down. Thirty years."' },
          { label: 'Blame the river', flag: 'river', say: '"The river," you say. He looks at the beam. Then at you. "...Yes. The river." He rolls up the plans, very carefully.' },
        ] },
      { talk: 'carpenter', log: 'Planksworth has something for you.',
        say: 'I built you something. A bridge. Small. Level. It will not fall down. I checked. Eleven times.',
        sayIf: { truth: 'Thirty years I blamed the river. You fixed that. Here. A bridge that won\'t fall, because I drew it the right way up.' } },
    ] },

  // ---------------- Gill the Fishmonger ----------------
  gotAway: { kind: 'quest', from: 'fishmonger', difficulty: 'hard', length: 'long', name: 'The One That Got Away',
    req: { skills: { fishing: 20 }, facts: { 'repair:south_road': 1 } },
    text: 'Gill has never told anyone about the fish that got away. It has a name. He says it like a curse.',
    reward: { coins: 500, xp: { fishing: 700 }, tool: 'gills_rod' },
    afterGreet: ['You caught Old Gnarl. I\'ve told no one. I\'ve told everyone.', 'My old rod suits you. Don\'t snap it. I will know.'],
    steps: [
      { talk: 'fishmonger', log: 'Gill once hooked a fish so big it pulled him off the pier. He calls it Old Gnarl.',
        say: 'Old Gnarl. Thirty years ago it took my line, my hat and my dignity. It\'s still out there. I\'ve seen signs. Go look. I\'m too old to be humiliated twice.' },
      { search: { region: 'docks', tx: 25, ty: 11, name: 'a giant scale on the shore' }, log: 'On the Docks shore: a scale the size of a plate.',
        say: 'A scale, wide as a dinner plate, washed up on the shore. Gill would recognise it. You can tell by the tooth marks on the pier.' },
      { search: { region: 'marsh', tx: 42, ty: 8, name: 'a snapped fishing line' }, log: 'In the Marsh: a snapped line with a 30-year-old hook. Gill\'s.',
        say: 'A snapped line, tied to a reed, an old hook still on it. Engraved: "GILL". It got out of the sea somehow.' },
      { search: { region: 'tollroad', tx: 33, ty: 11, name: 'ripples by the Old Weir' }, log: 'At the Old Weir on the Toll Road, something huge turns in the water. Only at night.',
        say: 'The river goes still. Something under the weir turns over, big as a rowing boat. It only comes up at night, you\'d bet.' },
      { event: 'fish', count: 1, catchAt: 'oldWeir', when: 'night', weight: 6, match: { id: 'old_gnarl' }, goal: 'Catch Old Gnarl at the Old Weir (Toll Road), at night 🌙',
        log: 'You caught Old Gnarl.' },
      { bring: { old_gnarl: 1 }, to: 'fishmonger', log: 'Back to Gill with Old Gnarl.',
        say: 'Old Gnarl. You... caught him. Look at him. He\'s smaller than I remember. So am I. Here. My old rod. It finally caught something worth it.' },
    ] },
});
