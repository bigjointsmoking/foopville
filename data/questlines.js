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

  // ================= v0.81: the last four (pitched one at a time with Jesus, 2026-11-18) =================

  // ---------------- The Old-timer ----------------
  // A cooking puzzle: three clues → three ingredients. The twist: the "warm" was never pepper, it was a root from Pip's stall.
  grandmaSoup: { kind: 'quest', from: 'oldtimer', difficulty: 'medium', length: 'medium', name: "Grandmother's Soup",
    req: { skills: { cooking: 10 } },
    text: 'The Old-timer misses his grandmother\'s soup. Nobody wrote it down. He only remembers how it tasted.',
    reward: { coins: 220, xp: { cooking: 180, gardening: 80 }, recipe: "Grandmother's Soup",
      bonus: [{ flag: 'guessed', renameRecipe: { from: "Grandmother's Soup", to: "{hero}'s Soup" }, line: 'He wrote your name on the recipe. Then crossed it out. Then wrote it again, bigger.' }] },
    afterGreet: ['Sit. I had soup for breakfast. And lunch. I\'m thinking about dinner.', 'Sweet, then warm, then you cry. Like most good days.'],
    steps: [
      { talk: 'oldtimer', log: 'The Old-timer misses his grandmother\'s soup. All he has is how it tasted.',
        say: 'Grandmother\'s soup. Sweet first. Then it warmed your ears. And it made you cry a bit, in a good way. Make it. Bring me a bowl.' },
      { taste: 'oldtimer', goal: 'Cook a soup that\'s sweet, warms your ears and makes you cry. Bring the Old-timer a bowl',
        ask: 'Bring me a bowl. Burnt is fine. Hers usually was.', empty: 'Nothing to taste. Cook something, bring it here. Sweet, warm, tears.',
        log: 'You worked it out: sweet, tears, warm. Almost. Grandmother never used peppers.',
        rules: [
          { notMethod: 'boil', say: 'That\'s not soup. That\'s soup\'s cousin. She boiled everything. Even tea.' },
          { has: ['rock_salt'], say: 'Too salty. She never used salt. Couldn\'t afford it.' },
          { extra: ['grumpleberry', 'tear_jerk_onion', 'dragons_sneeze_chili', 'ember_pepper', 'bitterroot'], say: 'There\'s something in here she\'d never have used. I can taste it judging me.' },
          { missing: 'grumpleberry', say: 'Not sweet. Hers was sweet first. Always first.' },
          { missing: 'tear_jerk_onion', say: 'It doesn\'t make me cry. Hers did. In a good way. This is the bad way.' },
          { has: ['dragons_sneeze_chili', 'ember_pepper'], pass: true, say: 'Sweet. Tears. Warm... but the wrong warm. She couldn\'t afford peppers. She bought one thing at the seed stall nobody else ever bought. Ask Pip.' },
          { say: 'Sweet, then sad. Close. But hers warmed your ears.' },
        ] },
      { talk: 'seeds', log: 'Pip\'s family has run the seed stall forever. He remembers what she bought.',
        say: 'His grandmother? Bitterroot. Ugly, bitter, warms you right up. Nobody bought it but her. I kept a few seeds. Don\'t know why. Pessimism, probably.',
        give: { seeds: { bitterroot: 3 } } },
      { taste: 'oldtimer', goal: 'Grow Bitterroot and boil it with Grumpleberry and Tear-Jerk Onion. Bring the Old-timer a bowl',
        ask: 'Bitterroot. Of course. Bring me a bowl.', empty: 'Nothing to taste. Bitterroot, berries, onion. Boiled.',
        log: 'He tasted it. He went very quiet.',
        rules: [
          { notMethod: 'boil', say: 'Boiled. She boiled it. Everything, always.' },
          { has: ['rock_salt'], say: 'Salt again. She\'d have thrown the pot at you.' },
          { has: ['dragons_sneeze_chili', 'ember_pepper'], say: 'Peppers again. She couldn\'t afford them. The root, from Pip\'s.' },
          { extra: ['grumpleberry', 'tear_jerk_onion', 'bitterroot'], say: 'Just the three. Berries, onion, root. She was poor, not fancy.' },
          { missing: 'bitterroot', say: 'Close. Still missing that root.' },
          { missing: 'grumpleberry', say: 'Not sweet. Sweet first.' },
          { missing: 'tear_jerk_onion', say: 'No tears. Where are the tears?' },
          { burnt: true, say: 'Burnt. Hers was burnt sometimes too. Not this burnt. Again.' },
          { pass: true, say: '...' },
        ],
        say: 'He holds the bowl a long time. "Is this how she made it?"',
        choices: [
          { label: '"Exactly how she made it."', flag: 'exact', say: 'He nods. He believes you. Or he decides to. Same thing, at his age.' },
          { label: '"No. I guessed."', flag: 'guessed', say: 'He laughs, properly, for the first time. "She guessed too. Every time."' },
        ] },
      { talk: 'oldtimer', log: 'He has something to say about the soup.',
        say: 'Grandmother\'s Soup. Write it down this time. Somebody should.',
        sayIf: { guessed: 'Your soup. Not hers. She\'d have liked that. Put your name on it. She never wrote anything down either.' } },
    ] },

  // ---------------- Pip the Seed Seller ----------------
  // Pip believes nothing he hasn't seen. Not dragons, not the sea.
  neverSeenSea: { kind: 'quest', from: 'seeds', difficulty: 'easy', length: 'medium', name: 'Never Seen the Sea',
    req: { facts: { 'repair:south_road': 1 } },
    text: 'The Docks are just south of the village. Pip has never been. Pip says the sea is made up.',
    reward: { coins: 150, xp: { gardening: 120, rizz: 40 }, perk: '🥬 Pip sells Sea Kale seeds now',
      bonus: [{ flag: 'quiet', seeds: { sea_kale: 5 }, line: 'He pressed a handful of seeds into your hand. "Grandad\'s. Grows where it smells of salt."' }] },
    afterGreet: ['I\'ve been wrong once. Once. Seeds?', 'Sea Kale. Grows where it smells of salt. So: near you, after a fishing trip.'],
    steps: [
      { talk: 'seeds', log: 'Pip says the sea is made up. Big water to the edge? Sounds made up.',
        say: 'The sea. Big water, all the way to the edge. Sounds made up. Like dragons. Prove it, if you like. I\'ll be here. I\'m always here.' },
      { bring: { salty_sardine: 1 }, to: 'seeds', goal: 'Bring Pip a Salty Sardine from the Docks', log: 'You brought Pip a sea fish. He called it a big pond fish.',
        say: 'A fish. Salty. Could be a pond fish that\'s had a hard life. Not convinced.' },
      { search: { region: 'docks', tx: 17, ty: 20, name: 'the end of the pier' }, log: 'You filled a jar with sea water at the end of the pier.',
        say: 'You fill a jar with sea water. It\'s cold, green, and very sure of itself.' },
      { talk: 'seeds', log: 'Pip tasted the sea water. "Salty pond." He won\'t believe it unless he sees it.',
        say: 'He sips it. Pulls a face. "Salty pond." He looks south. "I can\'t leave the stall. The seedlings. Nobody waters them but me."' },
      { search: { region: 'village', tx: 15, ty: 40, name: 'Pip\'s first seed tray' }, log: 'You watered Pip\'s first seed tray.', say: 'You water the tray. The seedlings perk up. They look as suspicious as Pip.' },
      { search: { region: 'village', tx: 18, ty: 40, name: 'Pip\'s second seed tray' }, log: 'You watered the second tray.', say: 'Second tray. One seedling leans away from you. Fair.' },
      { search: { region: 'village', tx: 21, ty: 40, name: 'Pip\'s third seed tray' }, log: 'You watered the last tray. Pip has gone. A note: "Pier. Don\'t be late. Or do."',
        say: 'Last tray. When you look up, Pip\'s gone. A note on the stall: "Pier. Don\'t be late. Or do."' },
      { talk: 'seeds', guest: { region: 'docks', tx: 21, ty: 20 }, log: 'Pip is at the end of the pier, looking at the sea.',
        say: 'He looks at it for a long time. "Fine. It\'s real. Doesn\'t mean the dragon is."',
        choices: [
          { label: '"Told you."', flag: 'told', say: '"Yes. Well." He turns round and stomps home. Halfway up the pier he looks back. Once.' },
          { label: 'Say nothing. Let him look.', flag: 'quiet', say: 'You stand there together. After a while he says his grandad kept a seed that only grows where it smells of salt.' },
        ] },
    ] },

  // ---------------- The Shopkeeper ----------------
  // She's never thrown anything away. Now the floor will give way. You find each old thing a buyer; your haggling is your pay.
  clearingOut: { kind: 'quest', from: 'shop', difficulty: 'medium', length: 'medium', name: 'Clearing Out',
    text: 'Planksworth says the Shopkeeper\'s back-room floor will give way. She has to sell some things. She would rather die.',
    reward: { coins: 0, cut: 0.6, xp: { rizz: 150 },
      bonus: [
        { flag: 'soldSign', coins: 120, line: 'The Old-timer bought the sign. He hung it on his bench. Nothing on the bench is for sale.' },
        { flag: 'keptSign', fact: 'perk:keptSign', perk: '🪧 A second haggle try when the first one fails', line: 'The sign hangs over her counter now. EVERYTHING FOR SALE. She dusts it every morning.' },
      ] },
    afterGreet: ['Look how much floor I have. I hate it. Buy something so I can fill it.', 'Everything is for sale. Nearly. Mostly. Don\'t look up.'],
    steps: [
      { talk: 'shop', log: 'The back-room floor is sagging. The Shopkeeper has to sell four old things. She\'ll pay you a cut.',
        say: 'Planksworth says one more thing back there and we all fall into the cellar. Fine. Sell these. It\'s not junk. It\'s stock that hasn\'t met its customer. You get a cut.' },
      { talk: 'chef', goal: 'Sell the cracked frying pan to Chef Marrowbone', log: 'Sold the cracked frying pan to Marrowbone.',
        say: 'A cracked pan. It pours to the left. ...I could use a pan that pours to the left. What do you want for it?',
        choices: [
          { label: 'Take his offer (40)', earn: 40, say: 'Forty. He nods like you\'ve made a mistake. You have.' },
          { label: 'Push for 70', rizz: 6, earn: 70, say: 'He grumbles about thieves. Then pays.' },
          { label: '😎 "It\'s a left-handed pan. Very rare." (100)', rizz: 15, earn: 100, say: '"Left-handed." He turns it over, impressed with himself for wanting it. A hundred.' },
          { label: 'Ask for 300', retry: true, say: '"Three hundred? For a crack with a handle? Get out. Come back with a real number."' },
        ] },
      { talk: 'smith', goal: 'Sell the bent horseshoe to the Blacksmith', log: 'Sold the bent horseshoe to the Blacksmith.',
        say: 'A bent horseshoe. I could straighten it. Or melt it. Or throw it at you. Price?',
        choices: [
          { label: 'Take his offer (40)', earn: 40, say: 'Forty. He drops the coins one at a time, to make a point.' },
          { label: 'Push for 70', rizz: 6, earn: 70, say: '"Seventy. Robbery. Fine."' },
          { label: '😎 "Sparky would love it." (100)', rizz: 15, earn: 100, say: 'He looks at Sparky. Sparky looks at the horseshoe. A hundred, and a growl.' },
          { label: 'Ask for 300', retry: true, say: '"For three hundred I\'d want the horse." No.' },
        ] },
      { talk: 'farmhand', goal: 'Sell the broken rake to Hollis', log: 'Sold the broken rake to Hollis.',
        say: 'A rake with two teeth! That\'s two more than my old one. How much?',
        choices: [
          { label: 'Take his offer (40)', earn: 40, say: 'Forty, in very small coins. Some of them are buttons. Mostly coins.' },
          { label: 'Push for 70', rizz: 6, earn: 70, say: '"Seventy! For a rake! ...Okay, but it IS a rake."' },
          { label: '😎 "The crows are scared of it." (100)', rizz: 15, earn: 100, say: 'His eyes go wide. "Scared of it?" A hundred, and he hugs the rake.' },
          { label: 'Ask for 300', retry: true, say: '"Three hundred? I\'d have to sell the farm. I don\'t own the farm." No.' },
        ] },
      { talk: 'seeds', goal: 'Sell the tangled old net to Pip', log: 'Sold the tangled net to Pip, to keep birds off his seedlings.',
        say: 'A net. Full of holes. Birds will get through it. Everything gets through everything. What\'s the damage?',
        choices: [
          { label: 'Take his offer (40)', earn: 40, say: 'Forty. "It won\'t work," he says, paying.' },
          { label: 'Push for 70', rizz: 6, earn: 70, say: '"Seventy. I\'ll regret it. I regret most things."' },
          { label: '😎 "The holes are on purpose. Bird-sized traps." (100)', rizz: 15, earn: 100, say: 'He squints at the holes. "...Clever." A hundred. He almost smiles.' },
          { label: 'Ask for 300', retry: true, say: '"Three hundred. For holes with string round them." No.' },
        ] },
      { search: { region: 'village', tx: 23, ty: 2, name: 'the back room' }, log: 'At the very back: a small, worn, hand-painted sign. EVERYTHING FOR SALE.',
        say: 'Behind the last crate: a small hand-painted sign, worn soft. EVERYTHING FOR SALE. From her very first stall.' },
      { talk: 'shop', log: 'She looked at the sign for a long time. "Price it. Go on. I dare you."',
        say: 'My first sign. It\'s the one thing I never sold. ...Price it. Go on. I dare you.',
        sayIf: {},
        choices: [
          { label: '"Sell it."', flag: 'soldSign', say: 'She laughs. "See? Everything." The Old-timer buys it for a silly price. She pays you a fat bonus.' },
          { label: '"Keep it."', flag: 'keptSign', say: 'She doesn\'t say anything. She hangs it over the counter, straightens it twice, and counts out your cut.' },
        ] },
    ] },

  // ---------------- The Quest Board Keeper ----------------
  // He has never done a quest. Somebody should. Not him. ...Fine. Him.
  firstQuest: { kind: 'quest', from: 'quest', difficulty: 'easy', length: 'short', name: 'His First Quest',
    text: 'A new note on the board, in shaky handwriting. Posted by: the Keeper. Taken by: also the Keeper.',
    reward: { coins: 120, xp: { melee: 100 },
      bonus: [
        { flag: 'assisted', fact: 'title:witness', title: 'witness', line: '"COMPLETE (assisted)." He framed it. The frame is bigger than the note.' },
        { flag: 'self', fact: 'perk:boardPlus', perk: '📜 The board shows 1 more errand', line: 'He keeps finding jobs for you now. He posts them himself. He\'s very proud of the handwriting.' },
        { flag: 'pep', fact: 'perk:boardPlus', coins: 60, perk: '📜 The board shows 1 more errand', line: 'He pressed some coins on you, very embarrassed. "For the speech. Don\'t mention it. Ever."' },
      ] },
    afterGreet: ['I did a quest. Me. It\'s on the board. Under "done". I check it hourly.', 'Berries. Forest. Squirrel. Survived. I\'m writing a memoir. Three pages.'],
    steps: [
      { talk: 'quest', log: 'The Keeper posted a quest for himself: pick 3 Grumpleberries in the Forest Edge. You\'re his official witness.',
        say: 'WANTED: pick three Grumpleberries at the Forest Edge. Taken by: me. It has to be witnessed. Officially. You. Meet me just inside the forest. Bring... courage. Mine\'s in the wash.' },
      { talk: 'quest', guest: { region: 'edge', tx: 4, ty: 22 }, log: 'The Keeper is just inside the Forest Edge with a clipboard, a stamp and no weapon.',
        say: '"Entering the forest. Noted." He stamps the clipboard. "The berry bush is just there. Witness me."' },
      { fight: { region: 'edge', tx: 7, ty: 22, enemy: 'squirrel', name: 'the squirrel on the berry bush' }, guest: { region: 'edge', tx: 4, ty: 22, npc: 'quest' },
        log: 'A squirrel was sitting on the berry bush. The Keeper narrated the fight from behind a tree.',
        goal: 'Deal with the squirrel on the berry bush (Forest Edge, by the way in)' },
      { talk: 'quest', guest: { region: 'edge', tx: 4, ty: 22 }, log: 'The squirrel is gone. The Keeper is staring at the bush. He hasn\'t picked anything.',
        say: '"The squirrel has been... removed. Noted." He stares at the bush. He doesn\'t move.',
        choices: [
          { label: 'Pick the berries and hand them over', flag: 'assisted', say: 'You pick three. He takes them very carefully and stamps the clipboard: COMPLETE (assisted).' },
          { label: '"Pick them yourself. I\'ll keep watch."', flag: 'self', say: 'It takes him ages. One berry. Two. Three. He turns round holding them like eggs.' },
          { label: '😎 Give him a pep talk first', rizz: 10, flag: 'pep', say: 'You tell him nobody\'s brave until they do the thing. He picks all three in one go. Then sits down.' },
        ] },
      { talk: 'quest', log: 'Back at the board to file it.',
        say: 'Filed. Under "done". My first one. Thank you, witness.',
        sayIf: { self: 'I picked them. ME. I\'m posting more. For you, obviously. I\'m retired now.', pep: 'I picked them. ME. Here. For the speech. Don\'t tell anyone I needed one.' } },
    ] },

  // ================= v0.82: THE STORY, Phase C (claude/CLAUDE_CODE_HANDOFF.md) =================
  // kind 'story': posted on the board's Story tab in a villager's name; take it there, then go and see them.
  // Gated only by how far you've got (first trip, the East Bridge), never by other quests.
  // Spell pieces (fragment) are kept even if you die (data/spell.js). Clues are facts 'clue:<id>' (villagers react).
  // All lines, numbers and spots are PLACEHOLDERS for Jesus.

  // v1.10: rebuilt from claude/MAIN_QUEST_LINE.md (dragon quest line, quest 1; plans/QL1.md). Pip posts it himself.
  // Clear the plot (one long Hoe job), dig until you hit the ash (right square picked at random), jar it, back to Pip.
  // Lines, seconds and spots are PLACEHOLDERS for Jesus. ver 2: old saves holding the jar (old step 3) move to the new step 4.
  deadPlot: { kind: 'story', from: 'seeds', difficulty: 'easy', length: 'short', name: 'Pip\'s Dead Plot', ver: 2, oldSteps: { 2: 3 },
    req: { facts: { 'region:edge': 1 } },   // posted after your first trip out of the village
    text: 'Pip had a plot at the east end of the farm once. Nothing grows there now. Not even weeds. Well, dead weeds.',
    reward: { coins: 80, xp: { gardening: 80 }, seeds: { heartroot: 3 }, fact: 'clue:ash' },
    afterGreet: ['That plot\'s still dead. I checked. From a distance.', 'Plants don\'t grow there. Plants grow here. Buy some.'],
    steps: [
      { talk: 'seeds', log: 'Pip\'s old plot, at the east end of the farm, is dead. He wants a sample. In a jar. With a lid.',
        say: 'My old plot. East end of the farm, past the last field. Nothing\'s grown there for a long time. Clear the junk off it and dig me up a sample. In a jar. With a lid. I\'m not touching it.' },
      { search: { region: 'village', tx: 53, ty: 55, name: 'Pip\'s old plot', work: 4 }, goal: 'Clear Pip\'s old plot with your Hoe (east end of the farm)',
        log: 'You hoed the weeds and rubble off Pip\'s old plot. Under it the ground is black.',
        say: 'Dead weeds out. Rubble out. Under it all, the ground is black. Somewhere in there is whatever did this.' },
      { dig: { region: 'village', name: 'Pip\'s old plot', work: 0.7, spots: [[51, 54], [54, 54], [56, 55], [51, 56], [54, 56]],
          wrong: ['Dirt. Impressive dirt, but dirt.', 'Just dirt. You dig with real conviction anyway.', 'More dirt. Pip will be thrilled.'] },
        goal: 'Dig around Pip\'s old plot until you find what killed it',
        log: 'Under one patch: ash that glows. You sealed some in a jar.',
        say: 'Your hoe hits something soft. Black ash, fine as flour, and it glows faintly. Ash shouldn\'t glow. You scoop some into a jar and screw the lid on tight.',
        give: { items: { ash_jar: 1 } } },
      { bring: { ash_jar: 1 }, to: 'seeds', log: 'Pip held the jar up to the light and went pale.',
        say: 'He holds it up to the light. Goes pale. "That\'s no house fire. Why is it glowing? Why is it still glowing?" He puts it under the stall. "Here. Seeds. Good ones. Go away."' },
    ] },

  // v1.10: dragon quest line, quest 2 (claude/MAIN_QUEST_LINE.md section 7, plans/QL2.md). Pip posts it after quest 1.
  // Show the jar around: 3 villagers test it in their trade, 3 guess, the Shopkeeper has a lead up north. You keep the jar.
  // Lines are PLACEHOLDERS for Jesus.
  askAround: { kind: 'story', from: 'seeds', difficulty: 'easy', length: 'short', name: 'Ask Around',
    req: { facts: { 'quest:deadPlot': 1 } },   // posted once Pip's Dead Plot is done
    text: 'Pip wants to know what\'s in that jar. He\'d ask around himself, but that would mean touching it.',
    reward: { coins: 100, xp: { rizz: 60 } },
    afterGreet: ['Up north. Past the Deep Woods. Of course it\'s past the Deep Woods.', 'You still have the jar? Good. Keep it. Far from me.'],
    steps: [
      { talk: 'seeds', log: 'Pip gave you the jar back. Show it around the village: somebody must know what it is.',
        say: 'Here. Take the jar. Show it around. Somebody in this village must know what it is. Not me. I sell seeds.',
        give: { items: { ash_jar: 1 } } },
      { talkAll: {
          smith: 'He heats a pinch in the forge. It doesn\'t burn. It doesn\'t melt. It glows brighter, then settles down like nothing happened. "Fire doesn\'t touch it. Never seen that."',
          chef: 'He drops a pinch on a hot pan. No smell. No smoke. It won\'t cook off. "Not seasoning. Get it out of my kitchen."',
          carpenter: 'He rubs a little on a plank. No scorch, but it leaves a mark that won\'t sand off. "That\'s not coming out. That plank\'s ruined. Thanks."',
          oldtimer: '"Fire did that. Old fire. Don\'t ask me whose. I wasn\'t there. Nobody who was there is talking."',
          banker: 'He weighs it twice. "Can\'t price it. Can\'t price it means worthless, or priceless. Either way, not my problem."',
          quest: '"Volcano." There is no volcano. "Small one. Underground. Very rare. I\'d post a notice about it."',
          shop: '"No idea. But my supplier up north deals in odd things. Past the Deep Woods, in Three Scales. If anyone knows, they will."',
        }, need: { ash_jar: 1 }, notYet: 'Show them what? Bring the jar.',
        goal: 'Show the jar around the village',
        log: 'Nobody in the village knows. The Shopkeeper\'s supplier, up north in Three Scales, deals in odd things.' },
      { talk: 'seeds', log: 'You told Pip about the supplier in Three Scales.',
        say: '"Up north? Past the Deep Woods? ...Right." He counts out coins without looking at the jar. "Keep it. I don\'t want it under my stall anymore."' },
    ] },

  // v1.12: dragon quest line, quest 3 (claude/MAIN_QUEST_LINE.md section 7, plans/QL3.md). Pip posts it after Ask Around.
  // Carry the Shopkeeper's crate north, the Iron House Assayer tests the ash with Frostroot, walk them home
  // (the Ash-Grey Wolf ambushes you in the Deep Woods), and at Pip's old plot they say what it is. Lines are PLACEHOLDERS.
  //   spare: Pip hands you another jar if yours is gone, before the walk home (step index < untilStep)
  //   escort: someone follows you from `home`; if you die they go back there and you fetch them again (talk to them)
  inspector: { kind: 'story', from: 'seeds', difficulty: 'medium', length: 'long', name: 'The Inspector',
    req: { facts: { 'quest:askAround': 1 } },   // can show before you can reach the north (Three Scales opens after the Guardian)
    text: 'Pip wants someone who knows what they\'re talking about to look at his plot. The Shopkeeper\'s supplier is up north. So is everyone else, apparently.',
    reward: { coins: 300, xp: { melee: 200, rizz: 100 } },
    spare: { item: 'ash_jar', npc: 'seeds', untilStep: 4, say: '"I kept a second jar. Don\'t tell anyone. Especially me." He hands it over at arm\'s length.' },
    afterGreet: ['A dragon. On my plot. I\'m still sitting down about it.', 'The Assayer sent a letter. It just says "Still dragon." Thanks, Assayer.'],
    steps: [
      { talk: 'shop', log: 'The Shopkeeper gave you a sealed crate for the Iron House in Three Scales. Take the jar too.',
        say: '"Going north? Take this to the Iron House. Don\'t open it. Don\'t shake it. Don\'t ask."',
        give: { items: { sealed_crate: 1 } } },
      { bring: { sealed_crate: 1 }, to: 'ts_assayer', need: { ash_jar: 1 }, notYet: '"The crate, and that jar you\'re waving about. Both, please."',
        log: 'The Iron House Assayer took the crate and looked at the jar. They need Frostroot to test it.',
        say: '"The crate, finally. And what\'s this? ...That\'s not ash. Not ordinary ash. I need Frostroot to test it. It grows under the snow here. Three roots."' },
      { dig: { region: 'north', name: 'the snow', all: true, item: 'frostroot', work: 0.7, spots: [[5, 25], [40, 18], [13, 7]] },
        goal: 'Dig up 3 Frostroot in the snow around Three Scales', log: 'You dug up three Frostroot.',
        say: 'Under the snow: a pale root, cold enough to sting. That\'s the last of them.' },
      { bring: { frostroot: 3 }, to: 'ts_assayer', need: { ash_jar: 1 }, notYet: '"Three Frostroot. And the jar. I can\'t test thin air."',
        log: 'Frostroot says it\'s dragon-made. The Assayer wants to see Pip\'s plot.',
        say: 'They grind the Frostroot, add a pinch of ash. It hisses and glows white. "Frostroot doesn\'t lie. This is dragon-made. Fire with magic in it. I need to see the ground it came from. Lead the way."' },
      { escort: { npc: 'ts_assayer', home: 'north' },
        fight: { region: 'deepwoods', tx: 13, ty: 2, enemy: 'ashWolf', name: 'the wolf', ally: 'ts_assayer' },
        goal: 'Walk the Assayer home through the Deep Woods (something is following the jar)', log: 'In the Deep Woods a grey wolf came for the jar. You saw it off.',
        rejoin: '"Back to it, then. Try not to die this time. I\'d have to walk home again."' },
      { escort: { npc: 'ts_assayer', home: 'north' }, guest: { region: 'village', tx: 52, ty: 55, npc: 'seeds' }, talk: 'seeds',
        goal: 'Take the Assayer to Pip\'s old plot (Pip is waiting there)', log: 'At Pip\'s plot the Assayer said it: dragon residue. It won\'t fade.',
        rejoin: '"Back to it, then. Try not to die this time. I\'d have to walk home again."',
        say: 'The Assayer kneels, rubs the black dirt between two fingers. "Dragon residue. It won\'t fade. Not in your lifetime, not in his. Nobody in this village can clear it." Pip sits down on the dirt, then gets up fast. "A dragon. On my plot. ...Here\'s your money. I need to sit down somewhere else."' },
    ] },

  tollRecords: { kind: 'story', from: 'banker', difficulty: 'medium', length: 'medium', name: 'Toll Records',
    req: { skills: { melee: 5 } },   // the Toll Road is Lv 5-9
    text: 'The goblins on the Toll Road charge everyone. Mr. Tally has never seen a coin of it come back to the village.',
    reward: { coins: 220, xp: { melee: 200, rizz: 60 }, gearDrop: { tier: 2, rarity: 'Uncommon' }, fragment: true, fact: 'clue:ledgerPage' },
    afterGreet: ['An older name. Under ours. I\'ve stopped counting. ...No I haven\'t. Forty-one.', 'Somebody\'s getting rich. It still isn\'t us.'],
    steps: [
      { talk: 'banker', log: 'Mr. Tally wants the goblins\' old ledger pages. Where does all the toll money go?',
        say: 'Somebody\'s getting rich off that road. It isn\'t us. I\'d know. I count. The goblins write it all down. Bring me their ledgers. Rip them if you have to. Especially if you have to.' },
      { event: 'ledger', count: 3, goal: 'Rip 3 goblin ledgers on the Goblin Toll Road (throw food or use a skill when he raises it)', log: 'Three goblin ledgers, ripped and stuffed in your pocket.' },
      { talk: 'banker', log: 'The oldest page has the village\'s name on it. An older one, scratched out, under "Foopville".',
        say: 'Tolls, tolls, tolls... Wait. This one\'s old. The village is named here. Only it isn\'t "Foopville". Something else, scratched out. "Foopville" is written over it. In newer ink.' },
    ] },

  theBowl: { kind: 'story', from: 'oldtimer', difficulty: 'medium', length: 'long', name: 'The Bowl',
    req: { skills: { melee: 9 } },   // the Deep Woods is Lv 9-13
    text: 'Every evening someone leaves a bowl at the old shrine in the Forest Edge, "for the Quiet One". Lately it comes back empty.',
    reward: { coins: 300, xp: { melee: 300 }, gearDrop: { tier: 1, rarity: 'Rare' }, fragment: true, fact: 'clue:bowl', keyRing: { storehouse: 'The Old Key' } },
    afterGreet: ['I put the bowl out again last night. Empty by morning. Good.', 'The Quiet One. Grandmother would be pleased. Or frightened. Hard to tell with her.'],
    steps: [
      { talk: 'oldtimer', log: 'The bowl left at the Forest Edge shrine for "the Quiet One" comes back licked clean. The Old-timer wants to know who\'s eating.',
        say: 'Every evening somebody leaves a bowl at the old shrine in the Forest Edge. For the Quiet One, Grandmother said. Lately it comes back empty. Licked clean. Go and look.' },
      { search: { region: 'edge', tx: 4, ty: 14, name: 'the old shrine' }, log: 'At the shrine: an empty bowl and big, careful tracks heading east.',
        say: 'A mossy little shrine. The bowl is gone. Big tracks lead east, toward the Toll Road. Careful tracks. Polite, almost.' },
      { search: { region: 'tollroad', tx: 6, ty: 19, name: 'the tracks' }, log: 'The tracks cross the Toll Road and head for the Deep Woods.',
        say: 'The same tracks, crossing the road. The goblins have drawn a little fence around them. Nobody pays a toll on these.' },
      { event: 'holeDown', goal: 'Follow the tracks (🐾) to the hole in the Deep Woods and climb down', log: 'The tracks ended at a hole. You climbed down.' },
      { event: 'boss', goal: 'Beat the Guardian at the bottom of the Old Storehouse',
        say: 'By its feeding spot, a worn sign: KEEP FED. Its last words: "Visitor logged. Please close the door." In the crumbs: a bowl, and an old key.',
        log: 'You beat the Guardian. By its feeding spot: a KEEP FED sign, the bowl, and an old key.',
        give: { items: { old_bowl: 1, old_key: 1 } } },
      { bring: { old_bowl: 1, old_key: 1 }, to: 'oldtimer', log: 'Back to the Old-timer with the bowl.',
        again: { event: 'boss', items: { old_bowl: 1, old_key: 1 }, say: 'The bowl and the key are back by the feeding spot. Of course they are.' },
        say: 'He turns the bowl over. "Grandmother\'s mark. So something down there was eating it. All these years." He keeps the bowl. "I\'ll put it back out. Somebody should." The key he gives back. "That\'s yours. Don\'t ask me what it opens."' },
    ] },

  oldAccounts: { kind: 'story', from: 'shop', difficulty: 'medium', length: 'medium', name: 'The Old Accounts',
    req: { facts: { 'repair:east_bridge': 1 } },   // the Marsh is open
    text: 'The old shopkeepers kept odd books. Payments to somebody, for something. The Bog Notary files a copy of everything.',
    reward: { coins: 260, xp: { rizz: 150 }, fragment: true, fact: 'clue:paymentLedger' },
    afterGreet: ['Gold paid for quiet. Hm. I\'d have charged more.', 'The old books are back under the counter. Where old books belong.'],
    steps: [
      { talk: 'shop', log: 'The old shopkeepers paid someone, every year, for years. The Bog Notary in the Marsh files a copy of everything.',
        say: 'The old books. Payments, every year, to "R". For years. No idea who. The Bog Notary in the Marsh files a copy of everything. He\'ll want forms. Three, stamped. He always wants three.' },
      { bring: { stamped_form: 3 }, to: 'notary', goal: 'Bring 3 Stamped Forms to the Bog Notary (Soggy Marsh, east end)', log: 'The Notary took your three forms and, very slowly, opened his office.',
        say: 'Three forms. Stamped. ...Correctly. Nobody does it correctly. He opens a drawer, sighs, and copies a page out by hand. "Payments. To the Resident. For quiet. No names. Filed." He hands it over like it hurts.' },
      { talk: 'shop', log: 'You brought the copied ledger to the Shopkeeper. Gold, paid to "the Resident", for "quiet".',
        say: 'No names. Just "the Resident". Gold paid for quiet. Every year. ...The old shopkeepers kept odd books. Don\'t let it keep you up. It\'s keeping me up.' },
    ] },
  // ---------- Phase D (v1.00, Jesus 2026-11-19, design/phase-d.md): the Right Form ----------
  // The Archivist in the Vault drops the Right Form. The Notary reads it, finds it correct, refuses to stamp it,
  // and fights you in his office. Beat him and he stamps it: the road east opens (fact 'road:east').
  // After the quest his office takes 3 Stamped Forms a fight (data/region_marsh.js office). Lines PLACEHOLDERS.
  rightForm: { kind: 'story', from: 'notary', difficulty: 'hard', length: 'medium', name: 'The Right Form',
    req: { facts: { 'got:rightForm': 1 } },
    text: 'Nobody gets past the Bog Notary without the right form. You have the right form. That might be the problem.',
    reward: { coins: 500, xp: { melee: 400 }, fragment: true, fact: 'road:east' },
    afterGreet: ['Form? ...Oh. You. The road is open. Use it. Quietly.', 'Approved. Don\'t make me say it twice. I\'m not allowed to say it twice.'],
    steps: [
      { show: { right_form: 1 }, to: 'notary', goal: 'Show the Right Form to the Bog Notary (Soggy Marsh, east end)',
        log: 'The Notary read the Right Form. It is correct. That is why he won\'t stamp it.',
        say: '"Form R-1. Passage East. Filled in. Signed. Dated." He reads it again. "Correct. Completely correct. Nobody has ever had the right form. There is no procedure for the right form." He goes into his office. From inside: "Come in. We\'ll settle this the old way."' },
      { event: 'bossDown', match: { enemy: 'bogNotary' }, goal: 'Beat the Bog Notary in his office (Soggy Marsh, east end)',
        log: 'You beat the Bog Notary in his own office.',
        say: 'The Notary, flat on his desk, holds out a webbed hand. "Form. Give me the form."' },
      { show: { right_form: 1 }, to: 'notary', goal: 'Give the Right Form back to the Bog Notary to stamp',
        log: 'He stamped it. The road east is open. Someone called the Receiver will want to meet you.',
        say: '"Fine. FINE." STAMP. "Passage East: approved. The road past my office is open." He blots the ink. "The Resident Receiver will want to meet you. He meets everybody. Eventually. Usually about money."' },
    ] },
});
