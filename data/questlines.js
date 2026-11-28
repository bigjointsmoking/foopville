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

// v1.38 (archive/plans-done/OT.md OT-A, Jesus 2026-11-26): quests and things that are gone. An old save loses them on load
// (FUP.quests.retireOld): The Bowl's key + bowl, the Vault's open door, The Right Form and its paper. Coins and XP earned stay.
// The road east stays open for saves that already opened it.
FUP.questData.retired = {
  quests: ['theBowl', 'rightForm'],
  facts: ['key:storehouse', 'clue:bowl', 'vault:open', 'got:rightForm', 'region:vault'],
  items: ['old_bowl', 'old_key', 'right_form'],
};

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
  // v1.38 (archive/plans-done/OT.md OT-A, plans/OT1_keepsakes_draft.md approved): the Old-timer's Q1. Pigeons took the shiny bits
  // out of his keepsake box; find 4 round the village, each goes back with its family story. He keeps them (the key is yours in Q5).
  oldtimer1: { kind: 'story', from: 'oldtimer', difficulty: 'easy', length: 'short', name: "Gran's Keepsake Box",
    text: 'The Old-timer nodded off on his bench with his family keepsake box open. The pigeons did the rest.',
    reward: { coins: 100, xp: { rizz: 60 } },
    afterGreet: ['Four keepsakes, back in the box. The box stays shut now. Pigeons.', 'Gran\'s things. Nobody believes the stories. I tell them anyway.'],
    steps: [
      { talk: 'oldtimer', log: 'Pigeons carried off the shiny things from the Old-timer\'s keepsake box. Four of them, somewhere round the village.',
        say: '"I shut my eyes for one minute. One. The box was open. Gran\'s things. The pigeons took every shiny bit and dropped them all over the village." He points at the sky, accusingly. An old man, a box of junk and a flock of thieves. Adventure.' },
      { search: { region: 'village', tx: 13, ty: 10, name: 'the old well' }, goal: 'Look round the village for the Old-timer\'s keepsakes (start at the old well)',
        log: 'On the rim of the old well: an iron key, worn smooth.', say: 'On the rim of the well, where a pigeon dropped it: an iron key, worn smooth.',
        give: { items: { keepsake_key: 1 } } },
      { bring: { keepsake_key: 1 }, to: 'oldtimer', goal: 'Bring the key back to the Old-timer', log: 'Gran\'s key. It opens nothing.',
        say: '"Gran\'s key. Opens nothing in this house. Nothing in any house. She kept it anyway, and so do I." He tucks it back in the box. "Three more. Try the Shop roof. Pigeons love a roof."' },
      { search: { region: 'village', tx: 26, ty: 4, name: 'the Shop\'s roof' }, goal: 'Search the Shop\'s roof',
        log: 'In the Shop\'s gutter: a bundle of letters tied with faded string.', say: 'Wedged in the Shop\'s gutter: a bundle of old letters, tied with faded string.',
        give: { items: { keepsake_letters: 1 } } },
      { bring: { keepsake_letters: 1 }, to: 'oldtimer', goal: 'Bring the letters back to the Old-timer', log: 'Letters from Gran\'s big brother, who walked east.',
        say: '"From her big brother. He walked east after the fire. Wrote home for years. Then he didn\'t." A passer-by leans in: "Lovely man. Lovely stories. None of them true." "Two more," he says, louder. "Up a lamp post, I\'d bet."' },
      { search: { region: 'village', tx: 10, ty: 12, name: 'the lamp post' }, goal: 'Search the lamp post by the well',
        log: 'On top of a lamp post: a little wooden charm on a cord.', say: 'Hooked on top of the lamp post: a little carved wooden charm on a cord.',
        give: { items: { keepsake_charm: 1 } } },
      { bring: { keepsake_charm: 1 }, to: 'oldtimer', goal: 'Bring the charm back to the Old-timer', log: 'Gran took it from the old shrine in the trees, the day she hid there.',
        say: '"She hid by the old shrine in the trees that day. Took this off it so she\'d have something to hold. Shrine\'s never missed it." He turns it over. "Last one. They like the hay by the seed stall."' },
      { search: { region: 'village', tx: 26, ty: 37, name: 'the hay bale' }, goal: 'Search the hay bale near the seed stall',
        log: 'In the hay: a little rag doll, one arm burned short.', say: 'Pushed into the hay: a little rag doll. One arm is burned short.',
        give: { items: { keepsake_doll: 1 } } },
      { bring: { keepsake_doll: 1 }, to: 'oldtimer', goal: 'Bring the doll back to the Old-timer', log: 'Four keepsakes, four stories, back in the box.',
        say: '"Hers. She said she saw something crawl out of the fire. Alive. Glowing. Nobody believed that one either." A passer-by, not quietly: "He\'s told you the doll one? Nod. It\'s quicker." He shuts the box. Four keepsakes, four stories, zero proof. He looks happier than you\'ve ever looked.' },
    ] },

  // A cooking puzzle: three clues → three ingredients. The twist: the "warm" was never pepper, it was a root from Pip's stall.
  grandmaSoup: { kind: 'story', from: 'oldtimer', difficulty: 'easy', length: 'medium', name: "Grandmother's Soup",
    req: { facts: { 'quest:oldtimer1': 1 } },   // v1.38 (archive/plans-done/OT.md OT-A): the Old-timer's Q2, after his keepsake box; Cooking 10 dropped (Jesus)
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
        say: 'Grandmother\'s Soup. Write it down this time. Somebody should. ...That taste. She used to sit me down with a bowl and tell me about the dragon. "She wasn\'t roaring," she\'d say. "She was sobbing." I\'d forgotten she said it like that. Like she\'d seen it.',
        sayIf: { guessed: 'Your soup. Not hers. She\'d have liked that. Put your name on it. ...That taste, though. She used to sit me down with a bowl and tell me about the dragon. "She wasn\'t roaring," she\'d say. "She was sobbing." Like she\'d seen it.' } },
    ] },

  // v1.40 (archive/plans-done/OT.md OT-C, plans/OT3-5_lines_draft.md approved): the Old-timer's Q3. Night raids on the village stores:
  // three damage spots, then The Bowl's old tracking route (Forest Edge, Toll Road) to the scorched dead tree in the Deep Woods.
  // Old Cinderback fights at its den and dies. Spots PLACEHOLDERS.
  oldtimer3: { kind: 'story', from: 'oldtimer', difficulty: 'medium', length: 'long', name: 'The Thing From the Fire',
    req: { skills: { melee: 12 }, facts: { 'quest:grandmaSoup': 1 } },
    text: 'Something big has been in the village stores at night. Scorched claw marks. The Old-timer has a theory. Nobody else wants it.',
    reward: { coins: 300, xp: { melee: 300 } },
    afterGreet: ['So Gran was right. All those years they laughed.', 'The stores are safe. I keep checking anyway. Habit.'],
    steps: [
      { talk: 'oldtimer', log: 'Something huge raids the stores at night. The Old-timer thinks it\'s Gran\'s "thing from the fire".',
        say: '"Something\'s been in the stores at night. Big. Scorched claw marks. Gran\'s story. The thing that came out of the fire. It\'s still alive." A giant badger. Of course. Why would it be a small one.' },
      { search: { region: 'village', tx: 20, ty: 36, name: 'Pip\'s seed store' }, goal: 'Look at the damage: Pip\'s seed store',
        log: 'Pip\'s seed store: every sack opened, then eaten.', say: 'Every sack opened. Neatly. Then eaten. Not neatly. Pip, from behind his stall: "It ate the sacks too."' },
      { search: { region: 'village', tx: 7, ty: 8, name: 'Marrowbone\'s kitchen door' }, goal: 'Look at the damage: Marrowbone\'s kitchen',
        log: 'Marrowbone\'s kitchen door: black, burned scratches.', say: 'The kitchen door is covered in black, burned scratches. Marrowbone: "It took the stew. And the pot. I liked that pot."' },
      { search: { region: 'village', tx: 10, ty: 40, name: 'the farm fence' }, goal: 'Look at the damage: the farm fence',
        log: 'Under the farm fence: warm earth where something dug through.', say: 'Something dug under the fence here. The ground is still warm. That\'s not a thing ground does.' },
      { search: { region: 'edge', tx: 4, ty: 14, name: 'huge paw prints' }, goal: 'Follow the tracks into the Forest Edge',
        log: 'Huge paw prints in the Forest Edge, the grass singed around them.', say: 'Huge paw prints. The grass around them is singed.' },
      { search: { region: 'tollroad', tx: 6, ty: 19, name: 'the tracks' }, goal: 'Follow the tracks across the Goblin Toll Road',
        log: 'The tracks cross the Toll Road toward the Deep Woods.', say: 'The tracks cross the road. The goblins have stopped charging tolls on this bit. Wise.' },
      { search: { region: 'deepwoods', tx: 33, ty: 14, name: 'the scorched dead tree' }, goal: 'Follow the tracks to the scorched dead tree in the Deep Woods',
        log: 'Under the scorched dead tree, something breathes.', say: 'Under the Big Dead Tree, something breathes. The roots glow orange with it.' },
      { fight: { region: 'deepwoods', tx: 32, ty: 13, enemy: 'cinderback', name: 'Old Cinderback' },
        goal: 'Fight the thing under the tree (when it glows white-hot, Defend)', log: 'Old Cinderback is dead.',
        say: 'It lies still. The glow fades out of its stripes, slowly, like a fire going out. It was there that day. Now nothing is.' },
      { talk: 'oldtimer', log: 'The Old-timer\'s family story was true.',
        say: '"So Gran was right. All those years they laughed." A long pause. "I thought I\'d feel better." You were right to do it. It doesn\'t feel like it.' },
    ] },

  // v1.41 (archive/plans-done/OT.md OT-D, plans/OT3-5_lines_draft.md approved): the Old-timer's Q4. Rowan's letters (read when he hands
  // them over, Jesus) stop mid-sentence at an old stone shelter on the Marsh road east; Old Mossback sits in its doorway.
  // The scratched name, then Rowan's family in Ledgerwick (Foop hint 2; they're the eldest's grandchildren). Spots PLACEHOLDERS.
  oldtimer4: { kind: 'story', from: 'oldtimer', difficulty: 'hard', length: 'long', name: 'Letters From the East',
    req: { skills: { melee: 20 }, facts: { 'quest:oldtimer3': 1 } },
    text: 'People listen to the Old-timer now. He has a bundle of letters from Gran\'s brother, and they stop in the middle of a sentence.',
    reward: { coins: 500, xp: { melee: 500 } },
    afterGreet: ['The eldest\'s. Gran never said. Maybe she didn\'t know how to.', 'Without a mark on him. I keep looking at that statue.'],
    steps: [
      { talk: 'oldtimer', log: 'Rowan\'s letters stop mid-sentence at an old stone shelter on the road east through the Soggy Marsh.',
        say: '"People listen to me now. Strange feeling. Gran\'s brother wrote from the east, years of letters. They stop in the middle of a sentence. I\'d like to know the rest." He hands you the bundle. The first: "Dear Gwendy, the road east is long and wet..." The last: "...a shelter of old stones, half in the water. I will sleep here tonight and write the rest in the..." It stops.',
        give: { items: { keepsake_letters: 1 } } },
      { search: { region: 'marsh', tx: 30, ty: 11, name: 'the old stone shelter' }, goal: 'Find the old stone shelter on the road east through the Soggy Marsh',
        log: 'The shelter: something enormous sits in the doorway.', say: 'Old stones, half sunk. Something enormous is sitting in the doorway. It has moss on it. It IS the doorway.' },
      { fight: { region: 'marsh', tx: 31, ty: 11, enemy: 'mossback', name: 'Old Mossback' },
        goal: 'Get the thing out of the doorway (when it pulls into its shell, wait; Defend the big snap)', log: 'Old Mossback slid off into the deep water.',
        say: 'Old Mossback slides off into the deep water, unhurried, as if this was its idea.' },
      { search: { region: 'marsh', tx: 32, ty: 11, name: 'the shelter door' }, goal: 'Look round the shelter',
        log: 'By the door: ROWAN, scratched in the stone, and an arrow pointing east.', say: 'By the door, scratched deep into the stone: ROWAN. And under it, an arrow pointing east.' },
      { show: { keepsake_letters: 1 }, to: 'rowanfamily', goal: 'Take the letters east to Ledgerwick: find Rowan\'s family',
        log: 'Rowan\'s family kept their half. They\'ve always known they were the eldest\'s grandchildren.',
        say: '"Gwendy? We have her name in our letters too." They bring out a box of their own. "Our side always said we were the eldest\'s grandchildren. The village forgot. We didn\'t." A pause. "And our side always said the hero walked out of the fire without a mark on him."' },
      { bring: { keepsake_letters: 1 }, to: 'oldtimer', goal: 'Bring the letters home to the Old-timer', log: 'He knows now who his family were.',
        say: '"The eldest\'s. Gran never said. Maybe she didn\'t know how to." He looks at the statue for a long time. "Without a mark on him." He\'s sat by that statue every day of his life. He\'s looking at it differently now.' },
    ] },

  // v1.42 (archive/plans-done/OT.md OT-E, plans/OT3-5_lines_draft.md approved): the Old-timer's Q5. Take Gran's key to the shrine where she
  // held it first; the Shrine Keeper rises to test you, then kneels toward the Deep Woods. On the bench: Foop hint 3 and the key,
  // on your key ring. (Main Quest 1 "The Quiet Room" is posted here once it's built.) Spots PLACEHOLDERS.
  oldtimer5: { kind: 'story', from: 'oldtimer', difficulty: 'hard', length: 'long', name: 'Where We Kept Things',
    req: { skills: { melee: 25 }, facts: { 'quest:oldtimer4': 1 } },
    text: 'The letters repeat the eldest\'s words: someone has to know where we kept things. The Old-timer has stopped calling it a house key.',
    reward: { coins: 1000, xp: { melee: 600 }, keyRing: { granKey: 'Gran\'s Old Key' } },
    afterGreet: ['She didn\'t fall. She flew. Gran watched her go.', 'The key\'s yours now. Don\'t ask me what it opens. I still don\'t know.'],
    spare: [{ item: 'keepsake_key', npc: 'oldtimer', fromStep: 1, untilStep: 3, say: 'He holds out the key again. "You dropped it. I picked it up. Don\'t make me walk that far again."' }],
    steps: [
      { talk: 'oldtimer', log: 'Gran\'s key isn\'t a house key. Take it to the shrine in the Forest Edge, where she held it first.',
        say: '"The letters say the eldest told Gran: someone has to know where we kept things. This isn\'t a house key. Take it to Gran\'s shrine. That\'s where she held it first." He puts it in your hand. An old man trusts you with the only thing his family kept. No pressure.',
        give: { items: { keepsake_key: 1 } } },
      { search: { region: 'edge', tx: 3, ty: 14, name: 'Gran\'s shrine' }, need: { keepsake_key: 1 }, notYet: 'You need Gran\'s key.',
        goal: 'Take Gran\'s key to the old shrine in the Forest Edge', log: 'At the shrine, one of the trees stood up.',
        say: 'The key gets heavier the closer you get. Behind the shrine, the trees creak. One of them stands up.' },
      { fight: { region: 'edge', tx: 5, ty: 14, enemy: 'shrineKeeper', name: 'The Shrine Keeper' },
        goal: 'Pass the Shrine Keeper\'s test (when it raises its arm, Defend next turn)', log: 'The Shrine Keeper knelt, facing the Deep Woods.',
        say: 'The Shrine Keeper lowers itself to one knee and goes still. Its head is turned toward the Deep Woods.',
        give: { fact: 'keeper:knelt' } },
      { bring: { keepsake_key: 1 }, to: 'oldtimer', goal: 'Bring the key back to the Old-timer on his bench', log: 'He gave you Gran\'s key. It\'s on your key ring.',
        say: '"Gran always said: she didn\'t fall. She flew. Gran watched her go." He turns the key over once more, then presses it into your hand. "That\'s yours. Don\'t ask me what it opens." He\'s not smiling. He\'s not sad either. He\'s done what Gran asked.' },
    ] },

  // ============================================================
  // THE MAIN QUEST (story/MAIN_QUEST_LINE.md 2c). v1.43 (archive/plans-done/MQ1.md MQ1-A): Quest 1 "The Quiet Room", posted by the Old-timer
  // once all 4 beginner threads are done and Gran's key is on your key ring. His line: Jesus approved the draft (2026-11-27).
  // MQ1-A builds the way in (the iron door) and the store's 3 rooms; MQ1-B adds the boss, the quiet room and the turn-in.
  // ============================================================
  mainQuest1: { kind: 'story', from: 'oldtimer', difficulty: 'hard', length: 'long', name: 'The Quiet Room',
    req: { skills: { melee: 30 }, facts: { 'quest:ash5': 1, 'quest:glass5': 1, 'quest:staff5': 1, 'quest:oldtimer5': 1, 'key:granKey': 1 } },
    text: 'The Old-timer has worked out where Gran\'s key goes. He is too old to take it there himself.',
    reward: { coins: 1500, xp: { melee: 1000 } },
    steps: [
      { talk: 'oldtimer', log: 'The key was the eldest\'s. It opens the iron door under the old storehouse, in the Deep Woods.',
        say: '"That key was in my family five generations. Passed hand to hand, nobody knowing why. Now I know whose hand it started in. The eldest\'s. Mine now, I suppose. That thing at the shrine knelt toward the Deep Woods, and the only locked door down there anyone talks about is the iron one under the old storehouse. I\'m too old for the Deep Woods. Go and open what my family was told to keep safe." An old man, a locked door and you. What could go wrong. Several things.' },
      { event: 'ironDoor', goal: 'Beat the Mushroom Guardian in the Old Storehouse, then open the iron door with Gran\'s key',
        log: 'Gran\'s key opened the iron door. Behind it: the elders\' store, and its guards.' },
      { event: 'quietRoom', goal: 'Get through the elders\' store: past its guardian, to whatever they kept at the end',
        log: 'The quiet room: the elders\' papers, the first page of their lesson, and a sealed page of the spell itself.' },
      { talk: 'oldtimer', goal: 'Ride the chute home and tell the Old-timer what was behind his family\'s door', log: 'You told the Old-timer what his family kept safe.',
        say: 'You tell him all of it: the guards, the papers, the notice nobody ever posted, the sealed page. He listens without a word. "They meant to tell everyone," he says at last. "And then they didn\'t get the chance." He looks over at the statue for a long time.' },
    ] },

  // v1.45 (plans/MQ2.md, story/MAIN_QUEST_LINE.md 2c Quest 2): Main Quest 2 "Never Sell It", posted by the Old-timer.
  // The Sealed Page carries the Iron House's mark; their registry has a second entry for the same blotted-out buyer; their old
  // box was carried off by a rival house's men (left unnamed). Iron-Jaw Brask + 2 House Bruisers in the High Snows. Gran's key
  // opens the box: the elders' note, spell piece 2, primer page 2 (wording approved: plans/MQ2_wording_draft.md).
  // Every other line is a STAND-IN (GAME_DESIGN 21 'v1.45').
  //   spare: lost the box (the grave)? The Old-timer has it back, like the other quests' items
  mainQuest2: { kind: 'story', from: 'oldtimer', difficulty: 'hard', length: 'long', name: 'Never Sell It',
    req: { skills: { melee: 33 }, facts: { 'quest:mainQuest1': 1 } },
    text: 'The elders split their spell up and hid the pieces. The Old-timer wants the rest of what his family was told to keep found.',
    reward: { coins: 1800, xp: { melee: 1200 } },
    spare: { item: 'iron_box', npc: 'oldtimer', fromStep: 8, untilStep: 9, say: '"Some lad from Three Scales left this on my bench. Said a big man with a bad jaw sent it back. Didn\'t want the trouble." He pushes the box at you. "Neither do I. Go on."' },
    steps: [
      { talk: 'oldtimer', log: 'The Old-timer wants the rest of the elders\' pieces found. Start with the Sealed Page: someone might know the mark on it.',
        say: '"One piece down. The list said there\'s more, kept by other folk, all over. My family kept ours without knowing what it was. Somebody else is doing the same, right now, and they don\'t know either." He taps the Sealed Page. "That wax has a mark in it. Show the Blacksmith. He knows marks. He won\'t shut up about marks."' },
      { talk: 'smith', goal: 'Show the Blacksmith the mark on the Sealed Page', log: 'The Blacksmith: the Sealed Page\'s wax carries the Iron House\'s mark, the same as the staff\'s fittings.',
        say: 'He holds the Sealed Page up to the forge light and goes very still. "Little hammer over three lines. Same as the staff." He hands it back like it\'s hot. "The Iron House made this mark. Same people, same buyer. Go and read that registry again."' },
      { search: { region: 'north', tx: 8, ty: 18, name: 'the old registry', label: '📖 Read the registry', icon: '📖' },
        goal: 'In Three Scales: look in the Iron House registry for the same blotted-out buyer', log: 'A second entry for the same blotted-out buyer: something left with the House, to be kept until someone brings the key.',
        say: 'Two lines under the staff order, the same black smear where the name should be. No price this time. Just: "Left with the House, to keep. Not to be opened. Not to be sold. Until one comes with the key." You have a key. You\'re suddenly very popular.' },
      { talk: 'ts_iron', goal: 'Ask the Iron House Steward about the second entry', log: 'The Iron House kept an old iron box for generations. It\'s gone: men from a rival house carried it off, north into the High Snows.',
        say: 'The Steward reads the entry and takes you down to the House vault without a word. An empty shelf, with a clean square in the dust. "Grandfather said never sell it. We never did. We never opened it either." He breathes out. "Men from another house took it, two nights ago. Hired muscle. They went out the north gate. Bring it back and you can watch it opened."' },
      { search: { region: 'highsnows', tx: 20, ty: 33, name: 'the boot prints', label: '🐾 Look at the tracks', icon: '🐾' },
        goal: 'Follow the tracks through the north gate into the High Snows', log: 'Three sets of boot prints and a sled track, heading up into the High Snows.',
        say: 'Boot prints. Two big sets and one bigger. Between them, the long scrape of a sled with something heavy on it. They went up. Of course they went up.' },
      { search: { region: 'highsnows', tx: 28, ty: 26, name: 'the tipped sled marks', label: '🔍 Look at the snow', icon: '🔍' },
        goal: 'Keep following the tracks', log: 'The sled tipped over here. They set it right and went on, east.',
        say: 'The sled tipped here. The snow is flattened where three men argued about whose fault it was. The tracks go on east, a bit more carefully.' },
      { search: { region: 'highsnows', tx: 30, ty: 15, name: 'a cold campfire', label: '🔍 Look at the camp', icon: '🔍' },
        goal: 'Keep following the tracks', log: 'A cold camp. Voices ahead, in the snowfield to the east.',
        say: 'A cold fire and three dents in the snow where they slept. Ahead, voices. One of them is complaining about his jaw. The other two are telling him to stop.' },
      { fight: { region: 'highsnows', tx: 32, ty: 11, enemy: 'brask', group: ['brask', 'houseBruiser', 'houseBruiser'], name: 'Iron-Jaw Brask' },
        goal: 'Take the box back from Iron-Jaw Brask (while his Bruisers stand, he barely feels a hit: beat them first)',
        log: 'Iron-Jaw Brask gave up the Iron House\'s box.',
        say: 'Brask sits down in the snow and works his jaw from side to side. "Paid to carry it. Not paid for this." He shoves the box over with his boot. "Never got it open anyway. Nobody can."',
        give: { items: { iron_box: 1 } } },
      { bring: { iron_box: 1 }, to: 'ts_iron', goal: 'Take the box back to the Iron House: Gran\'s key should open it',
        log: 'Gran\'s key opened the box in front of the family. Inside: the elders\' note, the second piece, the second primer page. The family kept the empty box.',
        paper: 'To the house of iron in the north.\n\nKeep this for us, closed, until someone comes with the key. Do not open it. Do not sell it.\nWe cannot tell you what it is. We can tell you it matters more than anything we have ever asked of you.\nIf no one comes, keep it anyway.\n\n(No signature. The same maker\'s mark as the staff\'s fittings is pressed into the wax.)',
        say: 'The whole family gathers. Gran\'s key turns like the lock was waiting for it. A note on top; under it, a sealed page and a folded one. Generations of a family guarding a box they couldn\'t open, for people they\'d never met. That\'s either loyalty or stubbornness. Probably both.',
        give: { fragment: true, primer: 'primer:2' } },
      { talk: 'oldtimer', goal: 'Go home and tell the Old-timer what was in the Iron House box', log: 'You told the Old-timer about the Iron House and its box.',
        say: 'You tell him about the box, the family, the note. "Keep it anyway," he says. "If no one comes, keep it anyway." He nods for a long time. "That\'s what Gran did. That\'s what all of us did." He looks pleased, and then tired, and then pleased again.' },
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

  // ================= v0.82: THE STORY, Phase C (archive/story-drafts/CLAUDE_CODE_HANDOFF.md) =================
  // kind 'story': posted in a villager's name; since v1.18 listed in the board's Quests tab (same look) and startable from their ❗ too.
  // Gated only by how far you've got (first trip, the East Bridge), never by other quests.
  // Spell pieces (fragment) are kept even if you die (data/spell.js). Clues are facts 'clue:<id>' (villagers react).
  // All lines, numbers and spots are PLACEHOLDERS for Jesus.

  // v1.10: rebuilt from story/MAIN_QUEST_LINE.md (dragon quest line, quest 1; archive/plans-done/QL1.md). Pip posts it himself.
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

  // v1.10: dragon quest line, quest 2 (story/MAIN_QUEST_LINE.md section 7, archive/plans-done/QL2.md). Pip posts it after quest 1.
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

  // v1.12: dragon quest line, quest 3 (story/MAIN_QUEST_LINE.md section 7, archive/plans-done/QL3.md). Pip posts it after Ask Around.
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
        fight: { region: 'deepwoods', tx: 13, ty: 2, surprise: true, enemy: 'ashWolf', name: 'the wolf', ally: 'ts_assayer' },
        goal: 'Walk the Assayer home through the Deep Woods (something is following the jar)', log: 'In the Deep Woods a grey wolf came for the jar. You saw it off.',
        rejoin: '"Back to it, then. Try not to die this time. I\'d have to walk home again."' },
      { escort: { npc: 'ts_assayer', home: 'north' }, guest: { region: 'village', tx: 52, ty: 55, npc: 'seeds' }, talk: 'seeds',
        goal: 'Take the Assayer to Pip\'s old plot (Pip is waiting there)', log: 'At Pip\'s plot the Assayer said it: dragon residue. It won\'t fade.',
        rejoin: '"Back to it, then. Try not to die this time. I\'d have to walk home again."',
        say: 'The Assayer kneels, rubs the black dirt between two fingers. "Dragon residue. It won\'t fade. Not in your lifetime, not in his. Nobody in this village can clear it." Pip sits down on the dirt, then gets up fast. "A dragon. On my plot. ...Here\'s your money. I need to sit down somewhere else."' },
    ] },

  // v1.30: the Ash line, quest 4 (plans/AL4.md, Jesus's picks 2026-11-26). The tool that draws the magic out of her ash is Lord Ormsby's
  // (Road House) "heirloom back scratcher". He'll trade it for Old Whitepaw's pelt: a giant snow cat in the High Snows (data/region_highsnows.js,
  // opens once this quest is taken). Q4 = the trade, then follow its trail to its lair. The fight and the tool at Pip's field are Q5.
  // Lines are PLACEHOLDERS.
  ash4: { kind: 'story', from: 'seeds', difficulty: 'hard', length: 'long', name: 'The Warm Thing',
    req: { facts: { 'quest:inspector': 1 } },
    text: 'The Assayer wrote back to Pip. Not "still dragon" this time. Something about a back scratcher. Pip has read the letter eleven times.',
    reward: { coins: 500, xp: { melee: 400, gardening: 300 } },
    afterGreet: ['A pelt off something nobody\'s ever touched. I\'ve grown worse things. I think.', 'He scratches his back with it. At dinner. In front of people.'],
    steps: [
      { talk: 'seeds', log: 'The Assayer has seen the same orange glow as Pip\'s ash before: on Lord Ormsby\'s back scratcher, at council dinners in Three Scales.',
        say: '"Read this." The Assayer\'s letter: she\'s seen that glow before. Orange, faint, never fading. On a back scratcher. Lord Ormsby\'s. At council dinners. Pip folds it up. "Dead ground isn\'t empty. It\'s full. Full of her. If something can hold that glow, maybe it can pull it out. Go and find out what that thing is."' },
      { talk: 'ts_assayer', log: 'The Assayer pointed you to Lord Ormsby, outside the Road House. She warned you he\'s unbearable.',
        say: '"Ormsby. Road House. He calls it an heirloom. His grandfather bought it off some travelling hero, apparently, which means it was stolen twice. It\'s always warm. He scratches his back with it at dinner." She pauses. "He\'s unbearable. Good luck."' },
      { talk: 'ts_ormsby', log: 'Lord Ormsby won\'t sell. He\'ll trade the back scratcher for Old Whitepaw\'s pelt: a giant snow cat no hunter has ever killed. The north gate is open to you.',
        say: 'Ormsby laughs at your coins. "Sell? It\'s an heirloom. Priceless. Warm." Then he leans in. "But. Up in the High Snows there\'s a cat. Old Whitepaw. The other houses have sent hunters for years. Not one pelt. Bring me Old Whitepaw\'s pelt and the scratcher is yours. Imagine their faces at dinner." He waves at the guards. The north gate opens.' },
      { search: { region: 'highsnows', tx: 18, ty: 31, name: 'the tracks', label: '🐾 Look at the tracks', icon: '🐾' },
        goal: 'Go through the north gate into the High Snows and find Old Whitepaw\'s trail', log: 'In the High Snows: tracks bigger than your head, heading uphill.',
        say: 'Paw prints in the snow, each one wider than a dinner plate. Four toes, no claw marks. It walks soft. Whatever it is, it went uphill.' },
      { search: { region: 'highsnows', tx: 12, ty: 21, name: 'the kill', label: '🔍 Look at the kill', icon: '🔍' },
        goal: 'Follow the tracks up to the basin', log: 'A half-buried kill in the basin. A ridge goat. Something that size eats goats.',
        say: 'A ridge goat, half buried in the snow. Not torn up. Taken down clean, in one go, and dragged. You look around the basin. Nothing. That\'s the worrying part.' },
      { search: { region: 'highsnows', tx: 8, ty: 11, name: 'the fur', label: '🔍 Look at the fur', icon: '🔍' },
        goal: 'Follow the drag marks to the west snowfield', log: 'White fur on a rock in the west snowfield, the same colour as the snow.',
        say: 'Fur, caught on a rock. White. Not snow white. Whiter. You can only see it because the rock is grey. In the snow it would be invisible. So would the cat.' },
      { search: { region: 'highsnows', tx: 30, ty: 12, name: 'the hunters\' camp', label: '📓 Read the journal', icon: '📓' },
        goal: 'Look for the old hunters\' camp in the east snowfield', log: 'A smashed hunters\' camp and a journal: years of following the cat, and never once seeing it.',
        say: 'A flattened camp and a journal. Years of it. "Tracks again." "Tracks again." "It was behind us the whole time." Last page: "Going up to the cave. Back by dark." Nothing after.' },
      { search: { region: 'highsnows', tx: 20, ty: 5, name: 'the cave', label: '👀 Look into the cave', icon: '👀' },
        goal: 'Climb to the cave at the top of the High Snows', log: 'The cave at the top: Old Whitepaw\'s lair. Two gold eyes in the dark. You backed away.',
        say: 'The cave is black. Then two gold eyes open in it, high up. Higher than a person. They don\'t blink. You back away down the slope, slowly, the whole way. Not today.' },
      { talk: 'seeds', log: 'You told Pip about the lair. He\'s growing something for it. Probably.',
        say: 'Pip listens to all of it without interrupting once, which has never happened. Then: "So we need a pelt off something nobody\'s ever touched. Fine. I\'ve grown worse things." He hasn\'t. Here\'s your money.' },
    ] },

  // v1.32: the Ash line, quest 5, the last (plans/AL5.md, Jesus's picks 2026-11-26). Old Whitepaw at its cave (data/enemies.js whitepaw,
  // gone for good). The pelt to Lord Ormsby for the "back scratcher": really a rod of the elders' dark wood with a carved cupped hand.
  // At Pip's plot (Pip there): cutscene `spark`. One spark drawn out of her ash (a keepsake, never lost: fact keepsake:spark, backpack);
  // one patch goes plain brown (data/village.js prop `after`). The field is NOT fixed. Pip keeps the tool (by his stall). Lines PLACEHOLDER
  // except Pip's closing line (approved).
  ash5: { kind: 'story', from: 'seeds', difficulty: 'hard', length: 'long', name: 'Full Ground',
    req: { facts: { 'quest:ash4': 1 } },
    text: 'Pip has run out of ways to put it off. He\'s written "PELT" on a piece of paper and pinned it to his stall, facing you.',
    reward: { coins: 1000, xp: { melee: 600, gardening: 600 }, fact: 'keepsake:spark', perk: '✨ The First Spark (a keepsake: 🎒 backpack, ✨ Spell page)' },
    afterGreet: ['I always said it never happened. I still say it sometimes. Out of habit.', 'One brown patch. I water it. Nothing grows. I water it anyway.'],
    spare: [
      { item: 'whitepaw_pelt', npc: 'seeds', fromStep: 2, untilStep: 3, say: '"Someone dragged this to my stall in the night. Didn\'t leave a name. Left a lot of fur." He hands you the pelt.' },
      { item: 'back_scratcher', npc: 'seeds', fromStep: 3, untilStep: 4, say: '"Ormsby\'s man brought this down. Said his lord didn\'t want it back, he\'s got a pelt now." He hands it over, at arm\'s length.' },
    ],
    steps: [
      { talk: 'seeds', log: 'Pip is ready, or as ready as he gets. Bring back Old Whitepaw\'s pelt.',
        say: '"I\'ve been putting this off. I\'ve been very good at it." He looks at the north road. "The cat. The cave. The pelt. Go on. I\'ll be here, being brave from a distance."' },
      { fight: { region: 'highsnows', tx: 20, ty: 5, enemy: 'whitepaw', name: 'Old Whitepaw' },
        goal: 'Climb the High Snows to Old Whitepaw\'s cave (when it vanishes, Defend)', log: 'Old Whitepaw is dead. You have its pelt.',
        say: 'The great cat lies down in the snow outside its cave, slowly, the way old things do. It doesn\'t get up. The snow starts covering it straight away. You take the pelt. It\'s heavier than it looks.',
        give: { items: { whitepaw_pelt: 1 } } },
      { bring: { whitepaw_pelt: 1 }, to: 'ts_ormsby', log: 'Lord Ormsby took the pelt and handed over the back scratcher: a rod of dark wood with a carved cupped hand, warm.',
        say: 'Ormsby holds the pelt up to the light. "THE Old Whitepaw. They\'ll choke on their soup." He hands over the back scratcher without looking at it. Up close: a long rod of strange dark wood, ending in a small carved cupped hand. Warm. Not for scratching. It never was.',
        give: { items: { back_scratcher: 1 } } },
      { search: { region: 'village', tx: 53, ty: 55, name: 'Pip\'s old plot', label: '🪄 Draw it across the ash', icon: '🪄' }, guest: { region: 'village', tx: 51, ty: 55, npc: 'seeds' },
        need: { back_scratcher: 1 }, take: { back_scratcher: 1 }, notYet: 'You need the back scratcher.', cutscene: 'spark',
        goal: 'Take the back scratcher to Pip\'s old plot (Pip is waiting there)', log: 'At Pip\'s plot the tool drew one spark out of the ash. One patch went plain brown. Pip kept the tool.',
        say: 'The spark sits in your hand, warm, the size of a seed. The patch under the tool is plain brown dirt now. The rest of the plot is as black as ever. Pip takes the tool from you very carefully and doesn\'t say anything for a long time.' },
      { talk: 'seeds', log: 'Pip\'s field isn\'t fixed. But it isn\'t empty either.',
        say: 'Pip turns the tool over in his hands. "I always said it never happened. I was wrong about that. I\'m starting to think everyone\'s wrong about the rest of it too."' },
    ] },

  // v1.13: the Glass line (the Carpenter), quests 1-2 (story/MAIN_QUEST_LINE.md Glass line arc, archive/plans-done/GL1.md).
  // A shard shows its moment only at the Blacksmith's forge: a cutscene (data/cutscenes.js) that plays once. Lines are PLACEHOLDERS.
  glass1: { kind: 'story', from: 'carpenter', difficulty: 'easy', length: 'short', name: 'Melted Stone',
    req: { facts: { 'repair:well': 1 } },   // posted once the Well is repaired
    text: 'When the Well was fixed, Planksworth found a lump of stone in the rubble. Melted. He has questions.',
    reward: { coins: 60, xp: { building: 60 } },
    afterGreet: ['Stone doesn\'t melt. I keep saying it. Nobody listens.', 'The square, before. I\'d give a lot to see more of that.'],
    steps: [
      { talk: 'carpenter', log: 'Planksworth found a lump of melted stone when the Well was fixed. Stone doesn\'t melt.',
        say: '"Found this in the rubble when we fixed the well. Stone. Melted. Stone doesn\'t melt. Not in any fire I\'ve built. Hold it up to a proper fire. The forge. See what it does."',
        give: { items: { melted_lump: 1 } } },
      { search: { region: 'village', tx: 5, ty: 5, name: 'the forge', label: '🔥 Hold it up', icon: '🔥' }, need: { melted_lump: 1 }, take: { melted_lump: 1 },
        notYet: 'You need the lump to hold it up.', cutscene: 'alarm', goal: 'Hold the Melted Lump up to the Blacksmith\'s forge',
        log: 'In the forge light, the lump showed the square on the bad day: the alarm, the sky on fire.',
        say: 'The lump cracks and goes dark. Whatever was in it is gone.' },
      { talk: 'carpenter', log: 'Planksworth wants to see more of the old village.',
        say: '"It showed you what? ...The square. Before. I want to see more of that. For the rebuilding. And because I\'m nosy."' },
    ] },
  glass2: { kind: 'story', from: 'carpenter', difficulty: 'easy', length: 'short', name: 'More Where That Came From',
    req: { facts: { 'quest:glass1': 1 } },
    text: 'Planksworth reckons where it burned hottest, there\'ll be more melted stone.',
    reward: { coins: 120, xp: { building: 120 } },
    afterGreet: ['More than one of them. Why does the story only have one?', 'I\'ve started drawing the old square. Badly. But I\'ve started.'],
    steps: [
      { talk: 'carpenter', log: 'Planksworth thinks the old burn marks will have more melted stone.',
        say: '"Where it burned hottest, there\'ll be more. The black marks by the old market, and up by the windmill. Dig."' },
      { dig: { region: 'village', name: 'the old burn marks', all: true, item: 'glass_shard', work: 0.7, spots: [[39, 27], [47, 29], [47, 4]] },
        goal: 'Dig up 3 Glass Shards by the old burn marks (the Market and the Windmill)', log: 'You dug three Glass Shards out of the burn marks.',
        say: 'A sliver of melted stone, glinting. That\'s three.' },
      { search: { region: 'village', tx: 5, ty: 5, name: 'the forge', label: '🔥 Hold them up', icon: '🔥' }, need: { glass_shard: 3 }, take: { glass_shard: 3 },
        notYet: 'You need all three shards.', cutscene: 'gather', goal: 'Hold the 3 Glass Shards up to the Blacksmith\'s forge',
        log: 'The shards showed robed elders gathering at the well. Not one hero. Many.',
        say: 'The shards go dark one by one.' },
      { talk: 'carpenter', log: 'You told Planksworth about the elders.',
        say: '"There\'s more than one of them. The story says Foop was alone." He stares at his workbench for a long time. "Huh."' },
    ] },

  // v1.14: the staff thread (the Blacksmith), quests 1-2 (plans/ST1.md). He found the elders' broken battle staff in the old ruins.
  // He does NOT learn it's magic, the dragon or the spell. You can't use the staff. Lines are PLACEHOLDERS.
  staff1: { kind: 'story', from: 'smith', difficulty: 'easy', length: 'short', name: 'A Rather Unusual Repair',
    text: 'The Blacksmith found an old battle staff in the ruins. Cracked, warm, and humming. He wants to fix it, and he needs a spare pair of hands.',
    reward: { coins: 60, xp: { melee: 60 } },
    afterGreet: ['I\'m not hitting it again. Not until I know what it is.', 'Wood doesn\'t glow. I keep telling it that.'],
    steps: [
      { talk: 'smith', log: 'The Blacksmith found a broken battle staff in the old ruins. He wants to repair it.',
        say: '"Found this in the old ruins. Battle staff. Wood, but heavy like iron. And warm. WARM. Wood isn\'t warm. Look at the cracks: orange, like there\'s a coal inside. Needs fixing, and I need a spare pair of hands. Yours will do."' },
      { dig: { region: 'village', name: 'the forge', all: true, spots: [
          [2, 3, { label: '🔥 Pump the bellows', icon: '🔥', say: 'You pump the bellows. The forge roars. The Blacksmith nods, which is the most praise you\'ll get.' }],
          [7, 2, { label: '🔨 Fetch the hammer', icon: '🔨', say: 'You hand him the small hammer. He says it\'s the wrong one. It\'s the right one. He keeps it.' }],
          [10, 5, { label: '✋ Hold the staff', icon: '✋', say: 'You hold the staff steady on the bench. It\'s warm. It hums against your palms, like a cat that doesn\'t like you.' }],
        ] }, flare: true,
        goal: 'Help at the forge: the bellows, the hammer, the staff', log: 'He struck the staff once. The cracks blazed orange and the hum got loud. He dropped the hammer.',
        say: 'He taps the staff once, gently. The cracks blaze orange. The hum climbs to a whine. The Blacksmith drops the hammer. The glow settles back down, like nothing happened.' },
      { talk: 'smith', log: 'The repair failed. The Blacksmith wants to know what the staff is made of.',
        say: '"...Wood doesn\'t do that. Iron doesn\'t do that. Nothing I\'ve ever hit does that. I\'m not touching it again until I know what it\'s made of. Here. For the bellows. You were adequate."' },
    ] },
  staff2: { kind: 'story', from: 'smith', difficulty: 'easy', length: 'short', name: 'The Grain of the Wood',
    req: { facts: { 'quest:staff1': 1 } },
    text: 'The Blacksmith wants to put the staff next to some ordinary wood and see what\'s different. Everything, probably.',
    reward: { coins: 120, xp: { melee: 120 } },
    afterGreet: ['Something happened to that staff. I\'d like to know what. I\'d also like to not know. Both.', 'It hums when I walk past it. I\'ve started walking the long way round.'],
    // You carry the staff to the Carpenter. Lost it (the grave)? The Blacksmith has it back, until it's on the bench again.
    spare: { item: 'broken_staff', npc: 'smith', fromStep: 1, untilStep: 4, say: '"Somebody found it by the gate and brought it back. Lucky for you. Unlucky for your face. Don\'t drop it again."' },
    steps: [
      { talk: 'smith', log: 'The Blacksmith wants ordinary wood to compare with the staff, and the Carpenter\'s opinion.',
        say: '"I know wood. I need some I understand, to put next to it. Ordinary stuff. Old, dry, boring. Like you. A splinter off a fence post, a stave off a barrel. And take the staff to Planksworth. He thinks he knows wood better than me. Let him try."',
        give: { items: { broken_staff: 1 } } },
      { dig: { region: 'village', name: 'ordinary wood', all: true, item: 'wood_sample', spots: [
          [38, 4, { label: '🪵 Take a splinter', icon: '🪵', say: 'A splinter off an old fence post. Dry. Grey. Deeply ordinary.' }],
          [26, 6, { label: '🪵 Take a stave', icon: '🪵', say: 'A stave off an old barrel. It smells of turnips. Ordinary turnips.' }],
        ] },
        goal: 'Collect 2 ordinary wood samples (a fence post, an old barrel)', log: 'You collected two pieces of ordinary wood.',
        say: 'Two pieces of ordinary wood. Nobody has ever been this interested in a fence.' },
      { talk: 'carpenter', need: { broken_staff: 1 }, notYet: 'Planksworth wants to see the staff. You don\'t have it.',
        goal: 'Show the staff to the Carpenter', log: 'Planksworth tried his plane on the staff. The blade skated off.',
        say: 'Planksworth runs his plane down the staff. The blade skates off without a single shaving. The hum rises. He tries again, harder. Same. "That\'s not wood. Or it\'s wood that\'s decided not to be. Take it back. I don\'t like how it\'s looking at me."' },
      { search: { region: 'village', tx: 10, ty: 5, name: 'the bench', label: '🔍 Use the lens', icon: '🔍' }, need: { broken_staff: 1, wood_sample: 2 }, take: { broken_staff: 1 },
        notYet: 'You need the staff and both wood samples on the bench.', goal: 'Back at the bench: look at the grain under the Blacksmith\'s lens',
        log: 'Under the lens: the plank\'s grain runs straight. The staff\'s doesn\'t run like wood at all.',
        say: 'You set the staff back on the bench. Under the lens, the fence splinter\'s grain runs straight, like grain does. The staff\'s grain doesn\'t run anywhere. It swirls, then stops, then swirls the other way. "That\'s not how trees work," says the Blacksmith.' },
      { search: { region: 'village', tx: 10, ty: 5, name: 'the bench', label: '🔨 Tap them', icon: '🔨' }, need: { wood_sample: 2 }, take: { wood_sample: 2 },
        notYet: 'You need both wood samples.',
        goal: 'Tap the samples and the staff with the hammer', log: 'The samples thunk. The staff hums back.',
        say: 'Tap the stave: thunk. Tap the splinter: thunk. Tap the staff: it hums back, and keeps humming after the hammer\'s gone. The samples have nothing to add.' },
      { search: { region: 'village', tx: 10, ty: 5, name: 'the bench', label: '👁 Study the cracks', icon: '👁' },
        goal: 'Study the cracks up close', log: 'The glow runs through every crack. The cracks and the glow are part of the same thing.',
        say: 'Up close, the cracks don\'t look like breaks. The orange runs along every one of them, end to end, like it\'s in there on purpose. Wherever the staff is cracked, it glows. Wherever it glows, it\'s cracked.' },
      { talk: 'smith', log: 'The Blacksmith: the staff wasn\'t just broken or burned. Something happened to it.',
        say: '"Not normal wood. Not normal damage. And the two go together. It wasn\'t just broken. Or burned. Something happened to it. Don\'t ask me what. I\'m a blacksmith. I hit things. This is the first thing that\'s ever hit back."' },
    ] },

  // v1.21: the staff thread, quest 3 (plans/ST3.md, BEGINNER_QUEST_THREADS.md section 3). A maker's mark on the staff's bands;
  // the Iron House Steward opens the old registry for the Blacksmith's letter; you pick the matching order from the clues.
  // He learns: an important order, made to survive fire, one piece (the head cap) missing. No magic, no dragon, no names. Lines are PLACEHOLDERS.
  //   spare: lost the letter or the print (the grave)? The Blacksmith makes another, until you've used it
  staff3: { kind: 'story', from: 'smith', difficulty: 'medium', length: 'medium', name: 'The Mark',
    req: { facts: { 'quest:staff2': 1 } },   // can show before you can reach the north (Three Scales opens after the Guardian)
    text: 'There\'s a maker\'s mark under the soot on the staff\'s bands. The Blacksmith wants to know whose. He\'s writing a letter. Several, so far.',
    reward: { coins: 250, xp: { melee: 250 } },
    afterGreet: ['Somebody paid a lot for that staff. Somebody wanted it to last.', 'Two pieces. There should be three. I keep counting.'],
    spare: [
      { item: 'smith_letter', npc: 'smith', fromStep: 2, untilStep: 3, say: '"You lost a LETTER? It\'s paper. It weighs nothing." He writes it again, angrily. Draft four. It\'s the best one yet.' },
      { item: 'clay_print', npc: 'smith', fromStep: 2, untilStep: 6, say: '"Lost the clay too. Of course you did." He presses the mark again and hands it over without looking at you.' },
    ],
    steps: [
      { talk: 'smith', log: 'Under the soot, the staff\'s metal bands carry a maker\'s mark. The Blacksmith wants to know whose.',
        say: '"Scraped the soot off the bands. Look. A mark. Stamped in. Smiths sign their work, and I know every mark from here to the coast. Except this one. Somebody knows whose it is. Help me get it on paper. And on clay. Mostly clay. My handwriting is a known problem."' },
      { dig: { region: 'village', name: 'the forge', all: true, spots: [
          [10, 5, { label: '🧽 Scrub the band', icon: '🧽', say: 'You scrub the band until the mark stands out: a little hammer over three lines. The staff hums the whole time, like it\'s being tickled and doesn\'t approve.' }],
          [7, 2, { label: '🟫 Press the clay', icon: '🟫', say: 'You press a lump of clay over the mark. It comes away clean. So does a thumbprint. Not yours.' }],
          [2, 3, { label: '🗑 Check the bin', icon: '🗑', say: 'Draft one, in the bin: "DEER IRON HOWSE. I am a smith. Wot is this mark." Draft two, under it: "Most esteemed and honourable masters..." He\'s crossed it out and written "NO" next to it.' }],
        ] }, give: { items: { clay_print: 1, smith_letter: 1 } },
        goal: 'At the bench: scrub the band, press the clay, check the bin', log: 'You pressed the mark into clay. The Blacksmith wrote his letter. Three times.',
        say: 'Draft three: "To the Iron House. This is your mark. I want to know who you made it for. Smith to smith. Don\'t make me come up there." He folds it. "That one."' },
      { bring: { smith_letter: 1 }, to: 'ts_iron', need: { clay_print: 1 }, notYet: '"A letter, you say. From a blacksmith. And a clay print of the mark. I see neither."',
        goal: 'Take the letter and the clay print to the Iron House Steward in Three Scales', log: 'The Steward wouldn\'t open the old registry for a stranger. Then he read the letter.',
        say: '"The old registry is for members of the House. You are not a member. You are barely a customer." He reads the letter. He reads it again. "...Smith to smith. Well. That\'s different. Registry\'s by the door. Don\'t lick your fingers."' },
      { search: { region: 'north', tx: 8, ty: 18, name: 'the old registry', label: '📖 Read the registry', icon: '📖' }, need: { clay_print: 1 },
        notYet: 'You need the clay print to match against the entries.',
        goal: 'Find the order that matches the staff. Clues: a staff, not a weapon. Very old. A metal that survives fire.',
        log: 'The clues from the staff: it\'s a staff, not a weapon. It\'s very old. Its metal has been through fire and come out fine.',
        say: 'Hundreds of entries in a hand much better than the Blacksmith\'s. Four have the same little hammer over three lines. Which one is the staff?',
        choices: [
          { label: 'Sword fittings, hard steel, for a captain of the guard', retry: true, say: 'A sword. The staff isn\'t a sword, whatever it hits like. And the ink\'s too fresh. Think again.' },
          { label: 'Staff fittings, fire-proof metal, very old, a name blotted out', say: 'A staff. Very old. A metal made to go through fire. The rest of the line is a black smear of ink.' },
          { label: 'Staff fittings, plain bronze, for a shepherd', retry: true, say: 'Bronze would have melted in whatever this staff went through. The shepherd is fine, presumably. Think again.' },
          { label: 'Oven-door hinges, fire-proof metal, very old', retry: true, say: 'Fire-proof and old, yes. But it\'s a door. You\'re holding a print off a staff. Think again.' },
        ] },
      { talk: 'ts_iron', log: 'The order was for three fittings. The staff only has two. The head cap is missing.',
        goal: 'Ask the Steward to read the entry',
        say: 'The Steward reads it out. "Three fittings. Band, ferrule, head cap. Our fire-proof metal, the expensive one. For a staff, for someone in..." He squints. "The buyer\'s name is blotted out. So is the village. Somebody did that on purpose. Long time ago." He looks at your print, then at you. "Three made. How many has your smith got?"' },
      { search: { region: 'village', tx: 10, ty: 5, name: 'the bench', label: '🟫 Hold up the print', icon: '🟫' }, need: { clay_print: 1 }, take: { clay_print: 1 },
        notYet: 'You need the clay print.', goal: 'Back at the forge: hold the clay print against the staff',
        log: 'The print matches the mark. The band and the ferrule are there. The head cap isn\'t.',
        say: 'The print fits the mark exactly. Band: there. Ferrule, the cap on the bottom end: there. The top of the staff ends in bare, cracked wood. Something used to sit there.' },
      { talk: 'smith', log: 'The Blacksmith: someone important ordered it, to survive fire. One piece is missing.',
        say: '"Fire-proof metal. The expensive one. Nobody pays for that unless they expect a fire." He looks at the bare top of the staff for a long time. "Someone important. Someone who knew. And the top\'s gone." He puts his hammer down. He doesn\'t pick it back up.' },
    ] },

  // v1.23: the staff thread, quest 4 (plans/ST4.md, BEGINNER_QUEST_THREADS.md section 3). The hum leads uphill: the Western Ruins,
  // then the Old Hill Road (data/region_hill.js; its 3 figures are in the way, fights optional) to the high clearing.
  // Examine 3 old trunks (cut with care, the trees left alive), tend 3 failing trees (Gardening 10, checked at the trees:
  // trim the dead wood, then dress the scars), a sliver that matches the staff, and the staff warms facing back down the road.
  // He learns: made with care, from living trees, by people who tended what they took. No dragon, no names, no magic. Lines are PLACEHOLDERS.
  //   spare: lost the staff on the road (the grave)? The Blacksmith has it back, same as Q2
  staff4: { kind: 'story', from: 'smith', difficulty: 'hard', length: 'long', name: 'The Tended Wood',
    req: { facts: { 'quest:staff3': 1, 'repair:west_road': 1 } },   // the road starts at the back of the Western Ruins
    text: 'The staff hums louder on one side of the forge. The Blacksmith has walked it round the room more times than he\'ll admit. The loud side faces the hills.',
    reward: { coins: 500, xp: { melee: 300, gardening: 300 }, seeds: { hillwood: 1 } },
    afterGreet: ['Somebody looked after those trees. Somebody looked after this staff. I\'m starting to feel judged.', 'One limb. Leave the tree. I\'ve been saying it to the coal scuttle. It doesn\'t listen either.'],
    spare: { item: 'broken_staff', npc: 'smith', fromStep: 1, untilStep: 7, say: '"A shepherd found it on the road and walked it all the way down. Said it hummed at his sheep. Don\'t drop it again. The sheep are upset."' },
    steps: [
      { talk: 'smith', log: 'The staff hums loudest facing the hills. The Blacksmith handed it over: take it uphill.',
        say: '"I walked it round the forge. Twice. Fine, nine times. The hum\'s quiet by the door, quiet by the bellows, loud facing the hills. Every time. Past the old ruins there\'s a road going up. Nobody uses it. Take it uphill." He hands you the staff. "Bring it back. Bring yourself back too, if it\'s no trouble."',
        give: { items: { broken_staff: 1 } } },
      { dig: { region: 'hill', name: 'the old trunks', all: true, spots: [
          [8, 3, { label: '🔍 Look at the trunk', icon: '🔍', say: 'An old trunk, wide as a cart. One limb taken off with a clean saw cut, long ago. The cut healed over. The tree went on living. Somebody did that carefully.' }],
          [14, 2, { label: '🔍 Look at the trunk', icon: '🔍', say: 'Another clean cut, healed over, one limb gone. Only one. Whoever took it left the rest. The staff hums against your back like it\'s nodding.' }],
          [21, 4, { label: '🔍 Look at the trunk', icon: '🔍', say: 'One limb, one cut, healed. Round the roots, old scorch marks, layer on layer. Fires lit here again and again, over a long, long time. Not one of them touched the tree.' }],
        ] },
        goal: 'Follow the hum: through the Western Ruins, up the Old Hill Road to the clearing. Look at the 3 old trunks', log: 'Up at the clearing: old trunks, each with one limb cut cleanly and healed. Scorch marks from many fires, none on the trees.',
        say: 'Three trees, three clean cuts, three trees still standing. Somebody came up here a lot, lit a lot of fires, and never once burned what they were cutting. The trees nearby aren\'t so lucky. They\'re dying.' },
      { dig: { region: 'hill', name: 'the failing trees', all: true, pry: 3, spots: [
          [10, 4, { label: '✂️ Trim the dead wood', icon: '✂️', say: 'You trim the dead wood off. It comes away in grey handfuls. The tree looks smaller and somehow pleased about it.' }],
          [17, 3, { label: '✂️ Trim the dead wood', icon: '✂️', say: 'Dead branches off. You are, for once, the right person for the job. Don\'t get used to it.' }],
          [23, 3, { label: '✂️ Trim the dead wood', icon: '✂️', say: 'Snip, snip, snap. The last dead limb falls on your foot. The tree had to get one in.' }],
        ] }, skills: { gardening: 10 }, lowSkill: 'You look at the dying tree. It looks at you. Neither of you is confident. (Tending these needs Gardening 10.)',
        goal: 'Tend the 3 failing trees: trim the dead wood (Gardening 10)', log: 'You trimmed the dead wood off the three failing trees.',
        say: 'The dead wood\'s off all three. What\'s left is raw and cracked. Trimming was the easy part. Now the scars.' },
      { dig: { region: 'hill', name: 'the failing trees', all: true, pry: 3, spots: [
          [10, 4, { label: '🩹 Dress the scars', icon: '🩹', say: 'You pack the cracks with moss and mud and bind them. It looks terrible. Trees don\'t mind looking terrible.' }],
          [17, 3, { label: '🩹 Dress the scars', icon: '🩹', say: 'Moss, mud, a strip of cloth from somewhere you won\'t mention. The tree creaks. You decide that\'s gratitude.' }],
          [23, 3, { label: '🩹 Dress the scars', icon: '🩹', say: 'You dress the last scar and step back. Three ugly bandaged trees. Somebody used to do this every year. You can tell.' }],
        ] }, skills: { gardening: 10 }, lowSkill: 'The scars need someone who knows what they\'re doing. (Gardening 10.)',
        goal: 'Tend the 3 failing trees: dress the scars (Gardening 10)', log: 'You dressed the scars on all three trees.',
        say: 'All three tended. Nothing happens. Trees don\'t say thank you. Then, on the middle one, a sliver of bark lifts away by itself, clean and healthy.' },
      { search: { region: 'hill', tx: 17, ty: 3, name: 'the middle tree', label: '🪵 Take the sliver', icon: '🪵' }, need: { broken_staff: 1 },
        notYet: 'You need the staff with you to check the sliver against it.',
        goal: 'Take the healthy sliver from the middle tree', log: 'The sliver\'s grain matches the staff\'s exactly.', give: { items: { hill_sliver: 1 } },
        say: 'You hold the sliver against the staff. The grain swirls, stops and swirls back, exactly the same. This is where the staff\'s wood came from. Not a fallen branch. A living tree, looked after.' },
      { search: { region: 'hill', tx: 15, ty: 6, name: 'the top of the road', label: '🧭 Turn round', icon: '🧭' }, need: { broken_staff: 1 },
        notYet: 'You need the staff for this.',
        goal: 'Turn round at the top of the road', log: 'Facing back down the road, the staff went warm. It points toward the old village.',
        say: 'You turn to go. The staff goes warm in your hands. Not hot. Warm, like a hand on your shoulder. It\'s facing back down the road, past the ruins, toward where the old village used to be. It stays warm the whole way down.' },
      { bring: { broken_staff: 1, hill_sliver: 1 }, to: 'smith', log: 'The Blacksmith held the sliver to the staff. Made with care, from living trees, by people who tended what they took.',
        say: 'He puts the sliver against the staff. Same grain. He doesn\'t say anything for a while. "Somebody cut this off a living tree. And looked after the tree. Every year, probably. Made with care, this. Not just made." He puts a cutting in your hand. "Hillwood. Plant it. Take one limb. Leave the tree."' },
    ] },

  // v1.24: the staff thread, quest 5 (plans/ST5.md). The staff warms toward the Western Ruins: the elders' stand-site.
  // Dig marks lead to Gravel-Hand Dunn, a digger for a house in Three Scales (a scavenger sold them fire-proof scrap), who has the
  // head cap. The staff hums before his big swing (data/enemies.js dunn). Beaten, he gives it up. Fit it at the stand-site: the last stand.
  // He learns: the elders made their last stand with it. NOT that the spell worked or needed her fire. No names. Lines are PLACEHOLDERS.
  //   spare: lost the staff or the cap (the grave)? The Blacksmith has it back, same as Q2 and Q4
  staff5: { kind: 'story', from: 'smith', difficulty: 'hard', length: 'long', name: 'The Last Stand',
    req: { facts: { 'quest:staff4': 1 } },
    text: 'Since the hills, the staff won\'t settle. It warms toward the old ruins and stays warm. The Blacksmith has stopped pretending he isn\'t worried.',
    reward: { coins: 900, xp: { melee: 500 } },
    afterGreet: ['It\'s whole. It\'s quiet. I keep checking it\'s still there. It always is.', 'They didn\'t make it to win. I can\'t stop thinking about that.'],
    spare: [
      { item: 'broken_staff', npc: 'smith', fromStep: 1, untilStep: 6, say: '"Someone left it on my bench in the night. With a note: SORRY. Spelled right, which rules you out." He hands it back.' },
      { item: 'head_cap', npc: 'smith', fromStep: 4, untilStep: 5, say: '"A big man with a shovel dropped this off. Said he\'d lost it again and didn\'t want it on his conscience." He hands you the cap.' },
    ],
    steps: [
      { talk: 'smith', log: 'Since the hills, the staff warms toward the Western Ruins. The Blacksmith handed it over.',
        say: '"It\'s been like this since you got back. Warm. Warmer on the west side of the bench. It wants to go back to the ruins, and I\'d like it to stop wanting things." He holds it out. "Find out what it wants. Then bring it home."',
        give: { items: { broken_staff: 1 } } },
      { search: { region: 'west', tx: 30, ty: 9, name: 'the melted square', label: '🔍 Follow the warmth', icon: '🔍' }, need: { broken_staff: 1 },
        notYet: 'The staff is how you\'d find it. You don\'t have the staff.',
        goal: 'Follow the staff\'s warmth into the Western Ruins', log: 'The staff led you to a wide square of melted stone. It\'s hottest here. Someone has been digging.',
        say: 'A wide square where the stone ran like wax and set again. The staff is almost hot here. This is where it was meant to be. And someone has been digging. Recently. Badly.' },
      { dig: { region: 'west', name: 'the dig marks', all: true, spots: [
          [38, 13, { label: '🔍 Fresh digging', icon: '🔍', say: 'Fresh holes, dug and filled, dug and filled. Somebody\'s been looking for something small. The holes lead off south-east.' }],
          [42, 19, { label: '🔍 A campsite', icon: '🔍', say: 'A cold campfire, a bedroll, a shovel-shaped dent in the dirt where somebody leans it at night. He\'s been out here a long time.' }],
          [42, 22, { label: '🔍 A half-eaten meal', icon: '🔍', say: 'Half a loaf and a sausage with one bite out of it. He left in a hurry, or he heard you coming. Digging noises, close. South-east.' }],
        ] },
        goal: 'Read the dig marks: fresh digging, a campsite, a half-eaten meal', log: 'Fresh holes, a camp, a meal left half-eaten. The trail ends at a dig in the south-east corner.',
        say: 'The trail ends at a dig in the south-east corner. Somebody is in the hole, and they\'re humming. No. That\'s the staff.' },
      { fight: { region: 'west', tx: 44, ty: 25, enemy: 'dunn', name: 'Gravel-Hand Dunn' },
        goal: 'Face the digger in the south-east corner of the ruins (the staff hums before his big swing: Defend it)',
        log: 'Gravel-Hand Dunn digs for a house in Three Scales. A scavenger sold them fire-proof scrap; they sent him for more. He gave up the head cap.',
        say: 'Dunn sits down in his own hole. "Orders said don\'t hand it over. Didn\'t say don\'t lose." He digs in his coat. "A house up in Three Scales hired me. Scavenger sold them a bit of scrap off these ruins. Metal that won\'t melt. They know what that\'s worth. Sent me for the rest." He drops a fitting in your hand: a cap, the little hammer over three lines. "Found it under the square. Tell them I lost it. I\'m going home."',
        give: { items: { head_cap: 1 } } },
      { search: { region: 'west', tx: 30, ty: 9, name: 'the melted square', label: '🔩 Fit the cap', icon: '🔩' }, need: { broken_staff: 1, head_cap: 1 }, take: { head_cap: 1 },
        notYet: 'You need the staff and the head cap.', cutscene: 'laststand',
        goal: 'Back at the melted square: fit the head cap on the staff', log: 'The cap fit. The staff blazed, and you saw it: the elders, here, on the bad day, and the last thing they tried.',
        say: 'The cap slides onto the bare top of the staff like it never left. The orange in the cracks goes white for a heartbeat, then settles to a steady glow. The hum stops. It\'s the first quiet you\'ve heard from it.' },
      { bring: { broken_staff: 1 }, to: 'smith', log: 'The staff is whole, on the Blacksmith\'s bench. They made their last stand with it.',
        say: 'He turns the staff in his hands, cap and all. Whole. Quiet. "So that\'s what it was for." He sets it on the bench, gently, like it might wake up. "They didn\'t make this to win. They made it hoping they\'d never have to use it." He doesn\'t pick up his hammer for the rest of the day.' },
    ] },

  // v1.19: Glass line quest 3 (plans/GL3.md, Jesus's doc + answers). The Western Ruins open by a repair (the West Road);
  // this posts once that's done and Q2 is done. 4 shards pried out of melted walls; the vision: the repelling spell.
  // The old village's name is never said. Lines are PLACEHOLDERS.
  glass3: { kind: 'story', from: 'carpenter', difficulty: 'medium', length: 'medium', name: 'The Western Ruins',
    req: { facts: { 'quest:glass2': 1, 'repair:west_road': 1 } },
    text: 'Planksworth thinks the glass follows the old edge of the village. West, where nobody has cleared anything.',
    reward: { coins: 250, xp: { building: 250 } },
    afterGreet: ['They were pushing her back. Not hurting her. Pushing.', 'I\'m starting to see where everything stood. Not enough to rebuild. Enough to stop guessing.'],
    // (v1.26) lost the shards (the grave)? Planksworth has all 4 back, until they're used at the forge (the pry spots don't come back)
    spare: { item: 'glass_shard', n: 4, npc: 'carpenter', fromStep: 2, untilStep: 3, say: '"Someone found these by the gate. Glass that warm, everyone knows whose it is." He tips four shards into your hand.' },
    steps: [
      { talk: 'carpenter', log: 'Planksworth thinks the elders stood at the old edge of the village. He wants glass from the Western Ruins.',
        say: '"The glass isn\'t scattered. Where we found it, it follows the old edge of the village. If they tried to keep her out, they\'d have stood there. West. Nobody\'s cleared it. Bring the stones back in one piece, preferably. And you."' },
      { dig: { region: 'west', name: 'the melted walls', all: true, item: 'glass_shard', pry: 1.4, spots: [
          [6, 5, { label: '✨ Pry it out', icon: '✨', say: 'You work a shard out of a wall gone smooth as a window.' }],
          [31, 5, { label: '✨ Pry it out', icon: '✨', say: 'A shard, set in the stone like it grew there. It comes loose with a click.' }],
          [38, 16, { label: '✨ Pry it out', icon: '✨', say: 'Glass in a doorframe. Someone stood here once. You take the glass.' }],
          [7, 22, { label: '✨ Pry it out', icon: '✨', say: 'A shard from a melted wall, still faintly warm. Probably the sun. Probably.' }],
        ] },
        goal: 'Pry 4 Glass Shards out of melted walls in the Western Ruins', log: 'You pried four Glass Shards out of the melted walls in the west.',
        say: 'That\'s four. The ruins seem quieter without them. Or you\'re imagining it.' },
      { search: { region: 'village', tx: 5, ty: 5, name: 'the forge', label: '🔥 Hold them up', icon: '🔥' }, need: { glass_shard: 4 }, take: { glass_shard: 4 },
        notYet: 'You need all four shards.', cutscene: 'repel', goal: 'Hold the 4 Glass Shards up to the Blacksmith\'s forge',
        log: 'The shards showed the elders in a line at the edge of the village, pushing her back with a wall of light. It held. For a breath.',
        say: 'The shards go dark one by one.' },
      { talk: 'carpenter', log: 'You told Planksworth about the wall of light.',
        say: '"They were pushing her back. Not hurting her. Pushing. And it barely worked." He shows you a sketch: the old streets, the edge, a line of little figures. "I\'m starting to see where everything stood. Not enough to rebuild it. Enough to stop guessing."' },
    ] },

  // v1.25: Glass line quest 4 (plans/GL4.md, Jesus's picks 2026-11-26). His Q3 sketches show a road uphill to nowhere: the Old Hill Road.
  // Gurrow won't let you by this time (a quest version; the everyday one steps aside: fight.replaces). Clear the growth off the
  // scorched ring at the clearing (3 shards) → the forge → cutscene `meeting`: an ordinary day, gold set out, the elders sitting
  // with her, the translation spell. They knew her. No Foop, no bad day. Lines are PLACEHOLDERS.
  //   spare: lost the shards (the grave)? Planksworth has them back, all 3, until they're used at the forge
  glass4: { kind: 'story', from: 'carpenter', difficulty: 'hard', length: 'long', name: 'A Meeting',
    req: { facts: { 'quest:glass3': 1 } },
    text: 'Planksworth\'s sketches of the old village have a road running off the top of the page. Uphill. To nothing. He can\'t stop looking at it.',
    reward: { coins: 500, xp: { building: 500 } },
    afterGreet: ['They sat with her. On purpose. More than once.', 'I keep drawing that ring of stones. I don\'t know why. I do know why.'],
    spare: { item: 'glass_shard', n: 3, npc: 'carpenter', fromStep: 3, untilStep: 4, say: '"Someone found these by the gate. Glass that warm, everyone knows whose it is." He tips three shards into your hand.' },
    steps: [
      { talk: 'carpenter', log: 'Planksworth\'s sketches show an old road running uphill from the old village, to nowhere. He wants to know what was up there.',
        say: '"Look." He spreads out the sketches: streets, the edge, the line of little figures. And a road, off the top of the page. "Up the hill behind the ruins. To nothing. Nobody builds a road to nothing. Go up it. Bring back whatever burned up there."' },
      { fight: { region: 'hill', tx: 18, ty: 32, enemy: 'gurrowQuest', name: 'Gurrow, the Gate-Troll', replaces: 'gurrow' },
        goal: 'Get past Gurrow at the bottom of the Old Hill Road (through the Western Ruins)', log: 'Gurrow wouldn\'t let you up the road. Now he will.',
        say: 'Gurrow lowers his gate. "...Password accepted," he mutters, which it wasn\'t. He shuffles aside. The road climbs on into the hills.' },
      { dig: { region: 'hill', name: 'the stone ring', all: true, item: 'glass_shard', pry: 2, spots: [
          [12, 5, { label: '🌿 Clear the growth', icon: '🌿', say: 'You tear back the brambles. Under them, a curved stone, scorched black, and a shard of glass set in it like a window.' }],
          [15, 4, { label: '🌿 Clear the growth', icon: '🌿', say: 'More stones under the weeds, set in a ring. Scorched, all of them, on the side facing in. Another shard.' }],
          [18, 5, { label: '🌿 Clear the growth', icon: '🌿', say: 'The last of the growth comes away. A whole ring of stones, scorched in a ring. Not a fire that burned once. A fire that came back, again and again.' }],
        ] },
        goal: 'Clear the growth off the old stone ring at the clearing (3 shards)', log: 'At the top of the road, under the brambles: a ring of scorched stones, and three Glass Shards set in them.',
        say: 'Three shards, three scorch marks, one ring of stones. Something warm and very large used to sit at the edge of it. Often.' },
      { search: { region: 'village', tx: 5, ty: 5, name: 'the forge', label: '🔥 Hold them up', icon: '🔥' }, need: { glass_shard: 3 }, take: { glass_shard: 3 },
        notYet: 'You need all three shards.', cutscene: 'meeting', goal: 'Hold the 3 Glass Shards up to the Blacksmith\'s forge',
        log: 'The shards showed an ordinary day at the clearing: gold set out, the elders sitting with her, a spell so they could talk.',
        say: 'The shards go dark one by one. No fire in this one. No screaming. Just talking.' },
      { talk: 'carpenter', log: 'You told Planksworth about the meeting.',
        say: 'He listens, and for once doesn\'t interrupt. Then he puts down his pencil. "They weren\'t keeping her out. They were keeping her company."' },
    ] },

  // v1.28: Glass line quest 5, the last (plans/GL5.md, Jesus's picks 2026-11-26). The biggest glass formed where she stood; Foop's statue
  // was built on that scorch. Planksworth offers to "restore" the statue; the village wants it bigger, so he needs a huge block from the
  // Old Quarry (data/region_quarry.js; opens once this quest is taken). Jarvin the Stone Warden guards it (data/enemies.js jarvin, gone for
  // good once beaten). Cut the block; his helpers haul it. He lifts the old base in front of everyone: the Great Glass Shard. At the forge:
  // cutscene `whole`, after the fire, her alone, crying, the charm glowing behind her doing nothing. The statue goes back up, bigger
  // (data/village.js statue `after`). Lines are PLACEHOLDERS.
  //   spare: lost the Great Shard (the grave)? Planksworth has it back until it's used at the forge
  glass5: { kind: 'story', from: 'carpenter', difficulty: 'hard', length: 'long', name: 'Her, Whole',
    req: { facts: { 'quest:glass4': 1 } },
    text: 'Planksworth has a new sketch. It\'s Founder\'s Hill. Specifically, it\'s what\'s under the statue. He won\'t say why he drew it.',
    reward: { coins: 1000, xp: { melee: 600, building: 1000 }, gear: 'stoneplate' },
    afterGreet: ['Bigger statue. Bigger lie. I built it straight, at least.', 'Every time someone admires it, I think about what was under it. I let them admire it.'],
    spare: { item: 'great_shard', npc: 'carpenter', fromStep: 4, untilStep: 5, say: '"Somebody brought this back. Wrapped it in a blanket first. Nobody wants to touch it bare." He hands you the Great Shard.' },
    steps: [
      { talk: 'carpenter', log: 'Planksworth thinks the biggest glass is under Foop\'s statue. To get at it, he\'ll "restore" the statue. The village wants it bigger. He needs a huge block from the Old Quarry.',
        say: '"Every shard so far was where she burned hottest. So where did she stand longest?" He taps the sketch. Founder\'s Hill. "I can\'t just dig up the founder. But I can offer to restore him." He sighs. "I asked around. They want him bigger. Of course they do. For that I need one huge block of stone, and the only stone that big is in the old quarry above the hill road. Nobody\'s been up there in years. There\'s a reason. Nobody remembers it."' },
      { fight: { region: 'quarry', tx: 15, ty: 5, enemy: 'jarvin', name: 'Jarvin the Stone Warden' },
        goal: 'Go up past the Old Hill Road clearing into the Old Quarry. Something guards it', log: 'Jarvin the Stone Warden guarded the Old Quarry long after everyone else left. He doesn\'t now.',
        say: 'Jarvin goes down on one knee, then the other. The plates crack all the way through. "Nobody came," he says. "Nobody ever came to say I could stop." He doesn\'t get up again. The quarry is very quiet.' },
      { dig: { region: 'quarry', name: 'the quarry face', all: true, pry: 4, spots: [
          [15, 2, { label: '⛏️ Cut the block', icon: '⛏️', say: 'You find the old wedge lines and follow them. Hours of it. The block comes free with a sound like a door closing. Much too big to carry. That\'s what helpers are for.' }],
        ] },
        goal: 'Cut a huge block from the quarry face (the back of the pit)', log: 'You cut one huge block out of the quarry face. Planksworth\'s helpers are hauling it down.',
        say: 'Planksworth\'s helpers turn up with ropes, rollers and a lot of complaining. The block starts down the hill road, slowly. Go home. They\'ll get there. Eventually.' },
      { search: { region: 'village', tx: 17, ty: 29, name: 'the statue', label: '🗿 Lift the old base', icon: '🗿' },
        goal: 'Meet Planksworth at the statue on Founder\'s Hill', log: 'In front of half the village, Planksworth lifted the old base. Under it: the biggest shard of all.',
        give: { items: { great_shard: 1 } },
        say: 'Half the village watches Planksworth lever up the old base. Under it: scorched ground, and a sheet of glass as wide as a door. "Old drainage," he says loudly, and slides it to you under a blanket. To find the truth, he had to make the lie bigger.' },
      { search: { region: 'village', tx: 5, ty: 5, name: 'the forge', label: '🔥 Hold it up', icon: '🔥' }, need: { great_shard: 1 }, take: { great_shard: 1 },
        notYet: 'You need the Great Glass Shard.', cutscene: 'whole', goal: 'Hold the Great Glass Shard up to the Blacksmith\'s forge',
        log: 'The great shard showed her after the fire, alone in the ruined square, crying, where the statue stands now. Behind her, the protection charm glowed and did nothing.',
        say: 'The glass goes dark slowly, like it doesn\'t want to.' },
      { talk: 'carpenter', log: 'You told Planksworth what the great shard showed. The new statue went up anyway, bigger.',
        say: 'He listens to all of it. Outside, his helpers are hoisting the new founder into place, twice the size, pointing heroically at nothing. He watches it go up. "That\'s where the statue stands now. No pit. No trap. My family never built anything."' },
    ] },

  tollRecords: { kind: 'story', from: 'banker', difficulty: 'medium', length: 'medium', name: 'Toll Records',
    req: { skills: { melee: 5 } },   // the Toll Road is Lv 5-9
    text: 'The goblins on the Toll Road charge everyone. Mr. Tally has never seen a coin of it come back to the village.',
    reward: { coins: 220, xp: { melee: 200, rizz: 60 }, gearDrop: { tier: 2, rarity: 'Uncommon' }, fact: 'clue:ledgerPage' },
    afterGreet: ['An older name. Under ours. I\'ve stopped counting. ...No I haven\'t. Forty-one.', 'Somebody\'s getting rich. It still isn\'t us.'],
    steps: [
      { talk: 'banker', log: 'Mr. Tally wants the goblins\' old ledger pages. Where does all the toll money go?',
        say: 'Somebody\'s getting rich off that road. It isn\'t us. I\'d know. I count. The goblins write it all down. Bring me their ledgers. Rip them if you have to. Especially if you have to.' },
      { event: 'ledger', count: 3, goal: 'Rip 3 goblin ledgers on the Goblin Toll Road (throw food or use a skill when he raises it)', log: 'Three goblin ledgers, ripped and stuffed in your pocket.' },
      { talk: 'banker', log: 'The oldest page has the village\'s name on it. An older one, scratched out, under "Foopville".',
        say: 'Tolls, tolls, tolls... Wait. This one\'s old. The village is named here. Only it isn\'t "Foopville". Something else, scratched out. "Foopville" is written over it. In newer ink.' },
    ] },

  oldAccounts: { kind: 'story', from: 'shop', difficulty: 'medium', length: 'medium', name: 'The Old Accounts',
    req: { facts: { 'repair:east_bridge': 1 } },   // the Marsh is open
    text: 'The old shopkeepers kept odd books. Payments to somebody, for something. The Bog Notary files a copy of everything.',
    reward: { coins: 260, xp: { rizz: 150 }, fact: 'clue:paymentLedger' },
    afterGreet: ['Gold paid for quiet. Hm. I\'d have charged more.', 'The old books are back under the counter. Where old books belong.'],
    steps: [
      { talk: 'shop', log: 'The old shopkeepers paid someone, every year, for years. The Bog Notary in the Marsh files a copy of everything.',
        say: 'The old books. Payments, every year, to "R". For years. No idea who. The Bog Notary in the Marsh files a copy of everything. He\'ll want forms. Three, stamped. He always wants three.' },
      { bring: { stamped_form: 3 }, to: 'notary', goal: 'Bring 3 Stamped Forms to the Bog Notary (Soggy Marsh, east end)', log: 'The Notary took your three forms and, very slowly, opened his office.',
        say: 'Three forms. Stamped. ...Correctly. Nobody does it correctly. He opens a drawer, sighs, and copies a page out by hand. "Payments. To the Resident. For quiet. No names. Filed." He hands it over like it hurts.' },
      { talk: 'shop', log: 'You brought the copied ledger to the Shopkeeper. Gold, paid to "the Resident", for "quiet".',
        say: 'No names. Just "the Resident". Gold paid for quiet. Every year. ...The old shopkeepers kept odd books. Don\'t let it keep you up. It\'s keeping me up.' },
    ] },
});
