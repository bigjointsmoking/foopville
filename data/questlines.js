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
});
