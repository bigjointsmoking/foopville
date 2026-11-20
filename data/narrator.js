// ============================================================
// NARRATOR — dry, sarcastic one-liners.
// {enemy} and {item} get swapped for real names during the fight.
// Add lines to any list; one is picked at random each time.
// ============================================================
window.FUP = window.FUP || {};

FUP.narrator = {
  // Title screen: one of these fades in under the logo, then swaps every few seconds
  titleQuips: [
    'A legend in the making. Allegedly.',
    'Yes, that is a dragon. No, you may not fight it. You can barely fight squirrels.',
    'The Mushroom Guardian is waiting. It has been for a long time.',
    'Heroes are born. You were more sort of assembled.',
    'One life in Hardcore. No refunds. No pressure.',
    'Fortune favours the bold. It has never heard of you.',
    'Destiny calls. It sounds disappointed.',
    'Grab a frying pan. The prophecy was vague.',
  ],
  start: [
    'A {enemy} blocks your path. It looks like it has nothing to lose.',
    'A {enemy} appears. It has heard about you. None of it was good.',
    'Combat begins. The {enemy} won\'t wait for you, and neither will time.',
  ],
  hesitate: [
    'The {enemy} isn\'t waiting for you to make up your mind.',
    'Time is passing. That\'s how time works.',
    'Any day now.',
  ],
  playerCrit: ['A critical hit. Even you\'re surprised.', 'That one landed. Write it down.'],
  enemyCrit: ['A critical hit. On you. By a {enemy}.', 'A {enemy} did that to you. Let that sit.'],
  defend: ['You hide behind your weapon. Brave.', 'Defensive stance. Very "I meant to do that."'],
  eat: ['You eat the {item} mid-fight. Manners are for the living.', '{item}: consumed. Dignity: also consumed.'],
  charmWin: ['The {enemy} blushes and leaves. You did not earn that.', 'Somehow, that worked. The {enemy} walks away flattered.'],
  roastWin: ['The {enemy} is emotionally damaged. Its attack drops.', 'Brutal. The {enemy} needs a minute.'],
  rizzFail: [
    'Your rizz attempt has been noted. By everyone. Forever. The {enemy} is enraged.',
    'That was so bad the {enemy} got angrier.',
    'Zero rizz detected. The {enemy} is furious now.',
  ],
  stolen: ['The {enemy} stole your {item}. Finders keepers is legally binding here.'],
  stolenNothing: ['The {enemy} rummages through your empty satchel. It pities you.'],
  enemyBuff: ['The {enemy} is working itself up. That can\'t be good.'],
  stun: ['BONK. The {enemy} forgot what year it is.'],
  squeak: ['You squeaked a rubber chicken at it. The {enemy} is rattled. So am I.'],
  squeakConfused: ['The {enemy} is so confused by the squeak it forgets which side it\'s on.'],
  confusedHit: ['The {enemy} punches itself. The chicken takes full credit.', 'Confused, the {enemy} attacks the nearest idiot. Itself.'],
  limitReady: ['Your Limit Break is ready. Pain has its perks.'],
  limit: ['Everything you have, in one swing.', 'So that\'s what all the suffering was for.'],
  // Melee Limit Breaks (blueprint 18.8)
  limitFlurry: ['Five swings. Zero plan. Somehow it works.', 'You flail with total confidence. The {enemy} has no idea what to block.'],
  limitSecondWind: ['You refuse to die. Out of spite, mostly.', 'A second wind. Your first wind was embarrassing.'],
  limitMainChar: ['For one moment, the story is about you. Don\'t get used to it.', 'Main character energy. It won\'t last. Enjoy it.'],
  // Rizz moves (blueprint 18.8)
  sweetWin: ['The {enemy} hands you {item}. It doesn\'t know why either.', 'You compliment the {enemy}. It gives you {item}. Flattery: cheaper than fighting.'],
  sweetFull: ['The {enemy} offers you {item}. Your bag is full. You drop it. Smooth.'],
  hypeWin: ['You tell yourself you\'re amazing. Against all evidence, you believe it.', 'You hype yourself up. Loudly. The {enemy} is embarrassed for you.'],
  charmMiniBossNo: ['The {enemy} isn\'t falling for that. Get more Rizz. A lot more.'],
  lowHp: ['You\'re nearly dead. Consider eating something. Or don\'t. I\'m a narrator, not a doctor.'],
  fleeFail: ['You tried to run. Your legs disagreed.'],
  fleeWin: ['You ran away. The {enemy} will tell everyone.'],
  win: ['The {enemy} is defeated. Tell people it was a dragon.', 'Victory. Against a {enemy}. Frame it.'],
  lose: ['Killed by a {enemy}. Let that sit.', 'Here lies you. Last opponent: a {enemy}. Nobody is surprised.'],
  throwHit: ['You threw the {item}. Food is a weapon if you believe hard enough.', 'The {item} has left your hand at speed.'],
  throwWeak: ['That seemed to sting. Remember that.', 'Oh, it REALLY did not like that one. Interesting.', 'That looked extra painful. Cooking: finally useful.'],
  throwResist: ['It barely noticed. Wrong flavor, apparently.', 'It shrugged that off. Try something else next time.'],
  poisonFirst: ['You\'re poisoned. Each stack nibbles your HP every turn. Poison-resist food would help.'],
  allFlee: ['With the Guardian down, the Stray Shrooms scatter. Nobody stays to tidy up.'],

  // ---------- The Mushroom Guardian ----------
  bossStart: [
    'The Mushroom Guardian. Someone told it to keep this place shut. It took that seriously.',
    'The Guardian has been expecting someone. You\'ll have to do.',
  ],
  bossPhase1: ['Phase 2: Spore Season. The air is now legally poisonous.'],
  bossPhase2: ['Phase 3: Feeding Time. Hide your wallet. Too late.'],
  bossSummon: ['The Guardian calls the strays. A Stray Shroom wanders in, uninvited.'],
  bossFeed: ['Feeding time. It took {item} coins. It didn\'t say thank you.'],
  bossFeedBroke: ['It wanted feeding. You\'re broke. It hit you instead.'],
  feverStart: ['FEVER DREAM. Nothing is real. Your buttons are lying to you. One of them is the real Guardian.'],
  feverFake: ['That one wasn\'t real. Your turn was, though. Was.'],
  feverEnd: ['The fever breaks. You feel slightly more normal. Slightly.'],
  bossWin: ['The Guardian is down. Its door stays open. For now.', 'You beat the Guardian. Somewhere, a Stray Shroom cheers quietly.'],
  bossLose: ['Shown the door. Permanently.', 'Beaten by a mushroom on guard duty. Nobody is surprised.'],
  // Silly button names during Fever Dream (the buttons still do their real thing, shuffled).
  feverLabels: ['Panic', 'Vibe', 'Lick Air', 'Scream', 'Hmm?', 'Clap', 'Yes', 'Mushroom?', 'Wobble', 'Feed It', 'Nap', 'Spin'],

  pickWeapon: ['Pick something to hit things with. Choose poorly; everyone else does.'],

  // ---------- Cooking ({dish} = the recipe's name, {level} = your Cooking level) ----------
  cookEmpty: [
    'That\'s not a dish. That\'s a pot.',
    'Put something in the pot first. Even you can manage that.',
  ],
  cookFull: [
    'The pot is full. Click something in it to take it back out.',
    'No room. The pot has boundaries, unlike you.',
  ],
  cookLocked: [
    'You haven\'t earned that yet. Cook more things.',
    'Locked. Come back when you\'re less embarrassing.',
  ],
  cookBurn: [
    'You burned the {dish}. Smoke is not a seasoning.',
    'Charcoal achieved. Nobody asked for charcoal.',
    'That\'s not food anymore. That\'s evidence.',
  ],
  cookJunk: [
    'That wasn\'t a recipe. It\'s a lump now. A warm, sad lump.',
    'You threw things in a pot and hoped. The pot did not.',
    'Bold experiment. Burnt result. Science marches on without you.',
  ],
  cookSecret: [
    'A secret recipe: {dish}. You found it by accident. That still counts.',
    '{dish}! A recipe nobody writes down, and you just stumbled into it.',
  ],
  cookSecretClose: [
    'That felt close to something. Something your skills aren\'t ready for.',
    'The pot almost made something great. You didn\'t.',
  ],
  cookLegendary: [
    'Five stars. Frame it. Eat it. Frame what\'s left.',
    'A masterpiece. The pot is crying.',
  ],
  cookLevelUp: [
    'Cooking level {level}. You\'re still not a chef.',
    'Level {level}. The pot is cautiously impressed.',
  ],
  // ---------- Camp ----------
  campFirst: [
    'Home sweet home. Cook something before the squirrels find you. They will find you.',
    'Your kitchen. Open the recipe book, pick something you can cook, press COOK. Even you can follow a recipe.',
  ],
  campReturn: [
    'Home. Still alive. Statistically, that won\'t last.',
    'You survived. Celebrate by cooking whatever you just picked off the ground.',
  ],
  campEat: ['You eat the {dish}. The squirrel would have taken it anyway.'],
  // ---------- Village ----------
  // Orientation Isle, the tutorial (v0.62, data/tutorial.js)
  isleArrive: ['You wake up on an island. You don\'t remember the boat. It remembers you.', 'Orientation Isle. Where new arrivals learn things. Some of them, anyway.'],
  isleBack: ['Orientation Isle. Still here. So are you.', 'Back on the island. The tutors pretend they missed you.'],
  dummyStart: ['A Training Dummy. It has no feelings, no plans, and better posture than you.', 'The Training Dummy faces you. Wait for your bar, then Attack. When it winds up, Defend.'],
  islandLeave: ['The ferry pulls away. The island waves. Or it\'s the wind.'],
  villageFirst: [
    'Welcome to Foopville, {name}. Population: small. Expectations: smaller.',
    'This is Foopville. {name} lives here now. The village has been informed. It sighed.',
  ],
  villageBack: ['Foopville. Exactly as you left it. Nobody noticed you were gone.', 'Welcome back, {name}. The village tolerates you.'],
  villageFromHome: ['You step outside. The village squints at you.', 'Out you go. Try to look like a hero. Closer. No.'],
  villageRetreat: ['Home already? The Guardian will still be there. It doesn\'t take breaks.', 'Back in Foopville, boss unbeaten. Nobody here will mention it. To your face.'],
  villageReturn: [
    'You\'re back. The Guardian isn\'t. The village is cautiously optimistic about you. Cautiously.',
    'Home from the Forest. You smell like mushrooms and victory. Mostly mushrooms.',
  ],
  // ---------- Normal mode: dying, the grave (Refinement Phase 1) ----------
  graveDeath: ['You died. Luckily, you are too stubborn to stay that way.', 'Dead. Briefly. Your stuff is still out there, unlike your dignity.', 'The Forest wins this round. It also keeps your pants.'],
  graveReplaced: ['Your old grave crumbles. Two graves would have been greedy.', 'You died on the way to your own grave. The old one is gone. Inspiring.'],
  villageRespawn: ['You wake up at home in your underwear. Your grave has a timer. Go.', 'Home, alive, empty-handed. Your belongings are lying in a hole in the Forest. Normal Tuesday.'],
  graveFound: ['You dig through your own grave. Most people never get to say that.', 'Your stuff, slightly dirtier. Welcome back.'],
  graveFoundPartly: ['Your bag is full. The rest stays in the grave. It can wait. Not long.'],
  graveCrumbled: ['Somewhere in the Forest, your grave crumbles. Your stuff belongs to the squirrels now.', 'Your grave has expired. So has everything in it.'],
  // Fishing
  rodFound: ["Someone left a rod by the pond. It's yours now. That's how property works."],
  fishCatch: ['A {item}. It looks as surprised as you are.', 'You caught a {item}. It did most of the work.', 'One {item}. The pond will recover. Eventually.', 'A {item}. Dinner, or a very quiet pet.'],
  fishMiss: ['It got away. It had places to be.', 'Outsmarted by a fish. Write that down.', 'The fish wins this round. And most rounds.', 'Gone. It will tell its friends about you.'],
  fishFull: ["Your bag is full of things that aren't fish.", 'No room. The fish are relieved.'],
  // Decorating (v0.57)
  placeTrapped: ['You were about to fence yourself in. Bold. Stupid, but bold.', 'That would wall you in. The narrator refuses to narrate your slow starvation.'],
  // ---------- Salvage + commissions (v0.70) ----------
  salvage: ['You pry it apart. Some of it was load-bearing. Was.', 'Scavenging. Your ancestors would be proud. They were also scavengers.'],
  salvage_shed: ['The shed gives up its planks without a fight. It had nothing left to give. Relatable.', 'You take apart a shed someone else gave up on.'],
  salvage_tree: ['The storm did the hard part. You take the credit.', 'A fallen tree, now several planks. Nature is recycling. Through you.'],
  salvage_cart: ['A broken cart. One wheel, zero dignity. Now it\'s yours.', 'You salvage a cart. Somewhere, a horse is relieved.'],
  salvage_wreck: ['Washed-up wreckage. The sea didn\'t want it either.', 'A shipwreck, in pieces, for your pieces.'],
  salvage_crate: ['You drag a crate out of the mud. The mud wants it back.', 'A sunken crate. Smells like the Marsh. Everything does.'],
  commissionStart: ['Scaffolding up. Now it builds itself while you pretend to supervise.', 'Construction begins. Mostly of your reputation.'],

  // ---------- Your house (v0.68, HouseScene) ----------
  houseArrive: ['Home. Four walls and a roof. Two more things than the Forest has.', 'You wipe your feet. Out of habit, not manners.', 'Home sweet home. The draft says hello.'],
  houseFromStove: ['You step away from the stove. It keeps judging you.', 'Back in the room, smelling faintly of whatever that was.'],
  houseNoStove: ['An empty corner where a stove should go. Planksworth the Carpenter sells stoves. You can still cook at a campfire, like a caveman.', 'No stove. You stare at the corner. The corner does not cook.'],
  houseNoPantry: ['A bare shelf. Planksworth sells pantry shelves to put your ingredients on.', 'An empty shelf, ready for groceries you don\'t have.'],
  houseChest: ['You open the chest. Everything you own that isn\'t on you.', 'The storage chest. Organised chaos.'],
  houseFull: ['Already fully rested. Lying down now would just be lying.'],
  furnChair: ['You sit. You stand. Riveting.', 'A good sit. Your knees thank you.'],
  furnTable: ['You sit at the table, alone, like a person with plans.', 'A table. You put your elbows on it. Nobody stops you.'],
  furnPlant: ['The plant is doing better than you.', 'You tell the plant about your day. It leans away.'],
  furnBooks: ['You open a book. The pictures are nice.', 'Chapter one: "So You Live In A Village With A Mushroom Problem."', 'You read a page. You understand most of the words.'],
  furnFire: ['You warm your hands. Cosy. Do not put fish in it.', 'The fire crackles. You feel almost competent.'],
  decorateOpen: ['Interior design time. Try to make it look like someone with taste lives here.', 'Your room. A blank canvas. Mostly blank. Mostly canvas.'],
  hammerBought: ['A better hammer. Nails everywhere tremble.', 'New hammer. Planksworth pretends he is not jealous.'],
  // Fish traps + the away card (v0.56)
  trapSet: ['Trap set. Somewhere, a fish makes a poor decision.', 'You hide a trap in the water. Very sneaky. The fish are not fooled. Yet.', 'Trap down. Now walk away and pretend you forgot.'],
  trapEmpty: ['{item} fish out of the trap. Hands-free fishing: the dream.', 'The trap delivers. {item} fish, zero effort.', 'You empty the trap. {item} fish look betrayed.'],
  trapFull: ['Your bag is full. The rest of the fish wait in the trap, sulking.', 'No room for the rest. They stay in the trap. They have nowhere to be.'],
  trapNone: ['You have no free traps. Gill sells them. Gill sells everything.', 'No trap to set. Buy one from Gill, or pick one up.'],
  awayCard: [
    'Things happened while you were gone. Shocking.',
    'The village kept going without you. Try not to take it personally.',
    'News! Mostly about vegetables and fish.',
    'Your empire of crops and traps awaits its tiny emperor.',
    'Welcome back. Your chores missed you.',
    'You were out. The world was not on pause. Rude of it.',
  ],
  // Fishing extras (v0.55)
  junkCatch: [
    '{item}. The sea is returning your things.',
    '{item}: not a fish. Technically a catch.',
    'Something heavy! Oh. {item}. Hold your applause.',
    'The fish sent this instead: {item}. Rude.',
  ],
  treasureCatch: [
    'Something else was on the line: {item}. The sea likes you today.',
    'Treasure! Well, {item}. Close enough.',
    'Your line came up with {item}. Gill pretends not to be jealous.',
  ],
  compostWorms: [
    'The Compost Bin made {item} worms. Free bait, mildly disgusting.',
    'Your rot has produced {item} worms. Gill would be proud.',
  ],
  specialLocked: ['Something big glints under the water. It ignores you. Come back with more Fishing.', 'The fish here have standards. You do not meet them yet.'],
  deepLocked: [
    'The deep water laughs at your little rod.',
    'Out here the fish are big and you are not. Not yet.',
  ],
  fishTooLow: ['Nothing out here bites for anyone under Fishing {item}. The sea has standards.', 'The sea fish ignore you. Come back at Fishing {item}. Bring dignity.'],
  // The Foopville Docks (data/region_docks.js): said once, the first time you walk down
  docksArrive: [
    'The Docks. Salt, planks, gulls with opinions. You fixed a road for this.',
    'Sea air. It smells like adventure, and also like Gill.',
    'The Foopville Docks: where the land gives up and the fish take over.',
  ],
  fishPerfect: ['A perfect catch. Suspicious, but well done.', 'Flawless. The {item} never stood a chance, for once.', "Perfect. Don't expect that to happen again."],
  // Planks + the food stall
  sawPlank: ['A plank. Straight-ish.', 'One plank. The tree would be so proud.', 'Sawdust everywhere. Progress.'],
  sawNoBark: ['No Bark, no planks. The Forest has plenty. So do its squirrels.', 'You saw the air. The air is unimpressed. Bring Bark.'],
  sawFull: ['Your backpack is full. The plank stays theoretical.'],
  stallBuilt: ['A food stall. You are now, legally, a business.', 'Your stall is open. The village pretends not to be curious.'],
  stallEmpty: ['Your stall is selling the idea of food.', 'An empty stall. Very exclusive.'],
  stallCollect: ['Coins. Earned while you were busy bleeding.', 'The till coughs up its takings.', 'Money for nothing. Well. For soup.'],
  stallFull: ['The stall is full. It is a stall, not a warehouse.', 'No more room on the counter.'],
  // Days (data/clock.js)
  sleepDay: ['Day {day}. The village is exactly as broken as you left it.', 'You slept. The squirrels did not.'],
  newDay: ['Day {day}. Somewhere, a rooster files a complaint.'],
  // Building on your plot
  placeFirst: ['A bench. On a field. Property values soar.'],
  placeTake: ['Back in your pocket. Somehow.'],
  oldSaveRetired: ['Old save retired. The village needed the space.'],
  graveHint: ['Your grave is in {item}. The timer is not a suggestion.'],
  modePickNormal: ['Normal. Dying is just an expensive nap.'],
  modePickHardcore: ['Hardcore. One life. Bold, for someone who trips over roots.'],

  villageLostRun: ['You wake up at home with no memory of how you got here. Your bag came back. Your dignity is still out there.'],
  startWounded: ['You walked into this fight half dead. Bold plan. Eat something.'],
  // ---------- Forest ({item} = an ingredient's name) ----------
  forestStart: [
    'The Forest. Everything here wants to eat you, or be eaten by you. Find the campfire.',
    'Walk. Pick things up. Avoid the squirrels, or don\'t. The campfire is somewhere northeast.',
  ],
  forestBack: ['Back in the Forest. It missed you. It\'s the only one.', 'Back here again. The trees pretend not to recognise you.'],
  // First time in each area on a trip (forestEnter_ + the area's id in data/forest.js)
  forestEnter_edge: [
    'The Forest Edge. Sunny, pleasant, mostly squirrels. Enjoy it. It gets worse.',
    'The gentle part of the Forest. Every campfire is a way home. Every exit is a worse idea.',
  ],
  forestEnter_tollroad: [
    'The Goblin Toll Road. A river, one bridge, and a lot of mud. Bring exact change.',
    'Mud up to the ankles. The squirrels here are bigger. So are your problems.',
  ],
  forestEnter_deepwoods: [
    'The Deep Woods. Dark, twisty, and full of things that hit harder. You\'re lost already.',
    'The Deep Woods. Somewhere down here, something is guarding a door. Find the campfire first.',
  ],
  forestFromCampfire: ['You leave the fire. The Forest was waiting. Patiently. Hungrily.'],
  // ---------- The Old Storehouse (the raid, blueprint 18.6) ----------
  raidEnter: ['A storehouse. Damp, dark, and somehow still guarded.', 'You land in the Old Storehouse. The door behind you locks. Of course it does.'],
  raidFightRoom: ['The door slams behind you. The shrooms look up. They don\'t look friendly.', 'Door shut. Locked. The only way out is through everyone in here.'],
  raidHazard_vents: ['The Boiler Room. The vents breathe out spores on a schedule. Learn it, or cough.', 'Spore vents. They puff in turn. You could time it. You won\'t, but you could.'],
  raidHazard_floor: ['The Rotten Stairwell. The cracked tiles won\'t hold you long. Neither would anyone.', 'Cracked floor. Keep moving. Standing still is how you meet the floor below.'],
  raidHazard_pipes: ['The Steam Hall. Pipes swing across it. Nobody knows why. Nobody fixed them either.', 'Swinging steam pipes. Time your steps. Or don\'t, and time your bruises.'],
  raidBack: ['Back in the basement. It missed you. It didn\'t.', 'The basement. Still damp. Still yours, apparently.'],
  raidLocked: ['Locked. Someone in this room still has an opinion about you.', 'The door won\'t budge. Clear the room first.'],
  raidLockedAmbush: ['Still locked. The room looks empty. Rooms that look empty usually aren\'t. Check the laundry.', 'Locked. Something in here hasn\'t introduced itself yet. Probably the laundry pile.'],
  raidDoorOpens: ['Click. The door ahead unlocks. The basement accepts your victory grudgingly.', 'The door unlocks. Onward, deeper, damper.'],
  raidAmbush: ['Fresh laundry. And under it, Stray Shrooms. Lots of them.', 'The laundry pile moves. Laundry shouldn\'t move.'],
  raidAmbushStart: ['Ambush! You can\'t run yet. You\'re too busy being surprised.'],
  ambushNoFlee: ['You\'re surrounded. Running comes later. Panicking is available now.'],
  raidAfterAmbush: ['Ambush survived. You smell faintly of fabric softener and violence.'],
  bouncerSeen: ['The Bouncer checks his list. You\'re not on it. You\'re never on it.'],
  bouncerStart: ['The Bouncer checks his list. You\'re not on it. You\'re never on it.'],
  enemyDebuff: ['The {enemy} files a deduction. Against you. Your ATK drops.', 'The {enemy} itemizes your weaknesses. It\'s a long list.'],
  raidSpore: ['A spore puff. Cough. You\'re Spored x{item}.', 'You walked into a vent\'s breath. Spored x{item}. Lovely.'],
  raidSporeResist: ['A spore puff, but your stomach shrugs most of it off. Spored x{item}.'],
  sporedStart: ['Those spores you breathed in earlier? They\'re here. Poison x{item}.'],
  raidFall: ['The floor gave up. So did your dignity. Back to the start.', 'You fell through the floor. The floor below was not softer.'],
  raidPipe: ['A pipe swings into you. It was there first.', 'Clang. That was a pipe. And your face.'],
  raidEatPick: ['{item}. Tap it again to eat it.'],
  walkEat: ['You eat {item} on the move. Very busy. Very important.', '{item}, eaten standing up. Fine dining.'],
  raidEat: ['You eat {item} on the move. Very busy. Very important.', '{item}, eaten standing in a basement. Fine dining.'],
  raidEatResist: ['{item}. Your insides feel spore-proof for this room.'],
  officeEnter: ['The Guardian\'s Hall. It looks up from its desk. "No visitors. That includes you."', 'Its hall. Carpet, a desk, a portrait of itself. It\'s waiting for you.'],
  officeFight: ['"Let\'s discuss your tenancy." He cracks his knuckles. Mushrooms have knuckles now.'],
  chuteSlide: ['A chute opens. You slide all the way home. It\'s the most fun anyone\'s ever had in this storehouse.', 'Out, finally. And you get the slide.'],
  villageChute: ['The chute spits you out at the gate. The village heard you coming. Everyone heard you coming.', 'Out of a chute and onto the road. Home, sweet, mushroom-free home.'],

  // The hidden hole in the Deep Woods (blueprint 18.6)
  holeFound: ['A hole in the ground. You\'ve made worse decisions. Not many.'],
  holeClimb: ['Down you go. The hole is darker than your future, which is saying something.'],
  holeNotYet: ['Sensible. The hole will wait. Holes are patient like that.'],
  forestWalkHome: ['You walk back to Foopville. Nobody asks how it went. Nobody has to.'],
  forestPickup: ['You found {item}. You will now put it in your mouth, eventually.', 'Picked up {item}. The ground was using it.', '{item}. Free food. Don\'t ask why it was on the floor.'],
  // Side rooms (E3). sideAmbush is from the 18.6 design; the rest are PLACEHOLDERS
  sideAmbush: ['Empty clearing. Totally safe. You believed that.'],
  stashCoins: ['A buried chest. {item} coins inside. Finders keepers is a real law. Probably.', 'You dig up {item} coins. Somebody buried them for a rainy day. It\'s raining on them now.'],
  stashGear: ['A buried chest with {item} in it. Somebody\'s loss. Mostly theirs.'],
  stashFull: ['There\'s gear in this chest and no room in your backpack. The chest will wait. Chests are patient.'],
  sideAfterAmbush: ['You survived the clearing. The clearing is unimpressed.'],
  forestBagFull: ['Your bag is full. Cook something or leave it on the floor like an animal.'],
  forestAfterWin: ['The squirrel won\'t be bothering anyone. Keep walking.', 'One less squirrel. The Forest barely noticed.'],
  // After a win, per enemy (forestAfterWin_ + the enemy id). Falls back to forestAfterWin.
  forestAfterWin_goblin: ['The tax collector has been audited. By your fists.', 'One less goblin in the tax office. Nobody will miss the paperwork.'],
  forestAfterWin_pigeon: ['The pigeons are down. Somewhere, a bird with a hat takes notes.', 'Feathers everywhere. This will not go unnoticed.'],
  forestAfterWin_godfather: ['The Godfather is down. The family will send a strongly worded coo.', 'You beat the Godfather. The pigeons will remember this. Pigeons never forget. They also never think.'],

  // ---------- Moss Goblin Tax Collector's toll ({item} = coins) ----------
  tollAsk: ['"Toll. It\'s the law." He wrote the law.', '"Coins, please. This road doesn\'t maintain itself." It visibly doesn\'t.'],
  tollPay: ['You pay {item} coins. He stamps your hand and walks off. Civilisation.', 'Paid. {item} coins lighter. The goblin hums happily.'],
  tollHaggle: ['You talked him down. He takes {item} coins and calls you a "valued customer".', 'Haggled to {item} coins. He looks impressed. And a bit hurt.'],
  tollHaggleFail: ['Your haggling offended him. Professionally. He\'s furious.', 'He\'s heard better pitches from squirrels. He\'s enraged.'],
  tollRefuse: ['You refuse to pay. He takes it personally. And with interest.', 'No toll? He rolls up his sleeves. Taxes are coming.'],
  tollBroke: ['You have no coins. He looks at you like a spreadsheet that doesn\'t balance.'],
  tollAfterPay: ['He\'s not evil. He\'s just doing his job. His job is evil.'],
  lateFee: ['Late fee. {item} coins gone. You weren\'t late. That\'s not the point.'],
  lateFeeBroke: ['He tried to charge a late fee. You\'re broke. He charged it to your face instead.'],

  // ---------- Pigeons and the Godfather ----------
  pigeonStart: ['A flock of pigeons. Each one alone is nothing. They are never alone.', 'Pigeons. They\'ve been waiting for someone like you.'],
  pigeonRally: ['The pigeons coo menacingly. It works. You\'re menaced.'],
  godfatherArrives: ['You\'ve made enemies. Specifically, birds.'],
  godfatherSeen: ['A big pigeon in a tiny hat blocks the trail. He\'s been expecting you.'],
  godfatherStart: ['The Pigeon Godfather. You killed his family. Several of them. He counted.'],
  godfatherSummon: ['The Godfather calls the family. Another pigeon arrives, already angry.'],
  godfatherNoFlee: ['You can\'t run from the family.'],
  familyFlee: ['With the Godfather down, the family scatters. Nobody says anything.'],

  forestAfterCharm: ['Your admirer scampers off. Keep walking, heartbreaker.'],
  forestAfterFlee: ['You escaped. It\'s sulking. You have a few seconds before it remembers.'],
  campfireArrive: ['The campfire welcomes you. It\'s the only thing that does.'],
  campfireLeave: ['You walk toward the big mushroom. It has a top hat. That\'s never good.'],
  campfireRetreat: ['You tiptoe away from the Guardian\'s door. It saw. It\'s writing it down.'],
  gardenCompost: ['You plant the {item} in fresh compost. It smells awful. It will grow beautifully.'],
  homeNap: ['You sleep in your own bed. Fully healed. The squirrels outside are furious.', 'A proper sleep. You wake up whole and slightly smug.'],
  campfireRest: ['You nap by the fire. Something watched you the whole time. Healed anyway.'],
  campOutOf: ['You don\'t have any more of that. Wishing won\'t help.'],
  campSatchelFull: ['Your backpack is full. Eat something, store it, or throw it at a squirrel.'],
  campNoFood: ['Going into a fight with no food. Bold. Wrong, but bold.'],
  gearBuy: ['Bought. It fits badly. That means it\'s working.', 'New gear. The squirrels will be mildly inconvenienced.'],
  ateInedible: ['You ate the {item}. Your body rejected it, loudly. It was Inedible. It said so.', 'Inedible means inedible. You gag. Throw the next one.'],
  eatRaw: [
    'You eat the {item} raw, like a raccoon with a mortgage.',
    '{item}, uncooked. Your chef career pauses briefly.',
  ],
  gardenPlant: ['You bury a {item} and hope. Farming, basically.', 'One {item}, planted. It is now the soil\'s problem.'],
  gardenHarvest: ['You harvest {item}. The dirt did all the work. You take all the credit.', '{item}, freshly picked. Nature: still weirdly generous.'],
  gardenBagFull: ['Your bag is full. The rest stays in the ground, judging you.'],
  // Farming on the village map (data/garden.js)
  gardenCompanion: ['You plant the {item} next to a friend. They\'ll both do better. Unlike you, socially.'],
  farmTill: ['You dig a fresh patch. The grass had plans. Not any more.', 'New soil. Your farm, your rules. The worms were not consulted.'],
  farmFlatten: ['You pat the soil flat. Grass will move back in. It always does.'],
  farmHoe: ['You hoe the weeds. The weeds will be back. They always come back.', 'Soil: loosened. Back: ruined.', 'You hit the ground repeatedly. Farmers call this progress.'],
  farmWater: ['Splash. The plant looks less disappointed in you.', 'You water it. It drinks without saying thanks. Rude.'],
  farmSaved: ['You water the wilting {item} just in time. It will remember this. Barely.', 'The {item} perks up. It\'s smaller now, but alive. Like your ambitions.'],
  farmDead: ['Your {item} died of thirst. You had one job. Well, three waterings.', 'That {item} is very, very dead. Hoe it away and pretend it never happened.'],
  farmClear: ['You bury the evidence. The soil keeps your secret.'],
  // v0.94 how fights start
  // v0.95: one-time hints, the first time you see each kind of enemy behaviour (once per browser)
  hintSleep: ['💤 That one is napping. Nappers don\'t chase: tiptoe up and touch it for a free first hit. Dawdle nearby and it may wake up.'],
  hintAmbush: ['That ripple isn\'t the wind. Something is hiding there and jumps whoever walks into it. You could walk around it. You won\'t.'],
  hintRunner: ['💰 A goblin with a coin sack. He runs once he sees you, but he\'s slower than you. Catch him quickly for double coins.'],
  hintTalk: ['A newt with a clipboard. He doesn\'t chase to fight, he chases to make you sign things. Somehow worse.'],
  hintChase: ['❗ means it has seen you and is coming. Run, or stand there looking brave. Both are valid.'],
  enemyWakes: ['The {enemy} wakes up. It is not a morning person.', '{enemy}: awake, annoyed, coming.'],
  runnerSpotted: ['A goblin with a sack of coins spots you and RUNS. Catch him!'],
  runnerEscaped: ['He got away. The coins are his now. Your legs need work.'],
  waiverAsk: ['"Before we proceed, please sign this waiver. It says I\'m not liable for anything. Ever."', '"Halt. Liability waiver. Sign here, here, and in blood here. Kidding. Ink is fine."'],
  waiverSigned: ['You sign. He stamps it, files it, and wanders off. That was {item} coins of pure paperwork.'],
  waiverRizz: ['You talk him into a "verbal agreement". He leaves happy. It isn\'t binding.'],
  waiverRizzFail: ['"That is not how contracts work." Objection noted. Fight on.'],
  waiverRefuse: ['You refuse to sign. He shouts "Objection!" and everyone gets defensive.'],
  // v0.93 new enemies + the Senior Partner
  spikes: ['Ow. {enemy} is mostly spikes. Defend first, then hit it.', 'You punched a hedgehog. Your knuckles have notes.'],
  runnerGrab: ['{enemy} pockets {item} of your coins. Stop him before he runs!'],
  runnerGone: ['{enemy} legs it with {item} of your coins. Somewhere, a goblin buys a hat.'],
  runnerCaught: ['You get your {item} coins back. He had them in his sock.'],
  bearCounter: ['You blocked a bear. Then you hit it back. Hard. Write home.'],
  newtSustain: ['"Sustained!" {enemy} rules in its friends\' favour. Take out the newt.'],
  newtAlone: ['{enemy} shouts "Sustained!" at nobody. Overruled.'],
  partnerStart: ['The Senior Partner adjusts his tie. The clock starts. You\'re paying for it.', 'Leech & Leech will see you now. Everything you say will be billed.'],
  partnerPhase1: ['Phase 2: The Associates. He calls in two juniors to do the actual work.'],
  partnerPhase2: ['Phase 3: Settlement Offer. Suddenly he wants to talk. Keep your coins close.'],
  partnerWin: ['The Senior Partner is down. The meter finally stops running.', 'Case closed. Nobody bills you for the victory. Yet.'],
  partnerLose: ['Billed into the ground. The invoice will follow you.', 'You lost to a leech in a tie. Expensively.'],
  partnerFlee: ['The associates grab their briefcases and slither off.'],
  partnerReview: ['{enemy} is reading the settlement. Very slowly. Hit him while he reads.'],
  partnerSettled: ['You pay {item}. He signs. He\'ll be busy for a while. Use it.'],
  partnerRefused: ['You refuse. He sighs like you\'ve wasted his billable time.'],
  officeBooked: ['Three forms, stamped and filed. The door opens. It smells of money and swamp.'],
  saplingBought: ['A sapling. Plant it with 🔨 Build on your land. Then wait two days. Then wait more.'],
  treeWatered: ['You water the tree. It will remember this. Trees are slow but they hold grudges.', 'Watered. Somewhere inside, a plum is thinking about existing.'],
  treeGrowing: ['Still growing: {item} to go, if it stays watered. Trees don\'t rush. You shouldn\'t either.'],
  treeFruiting: ['Fruit on the way: {item}. You can\'t make it faster by staring. You have tried.'],
  treePicked: ['You pick {item}. The tree does not say thank you. It\'s a tree.', '{item} picked. Fresh, free, and slightly judgemental.'],
  giantCrop: ['A GIANT {item}! Nine plants gave up being separate. Your neighbours will talk.', 'Something enormous has happened on your farm: a giant {item}. Nobody is ready.'],
  sprinklerFull: ['The sprinkler is full. It doesn\'t need you right now. Nobody does.'],
  sprinklerCanEmpty: ['Your watering can is empty. Fill it at the well or a pond first.'],
  sprinklerFilled: ['Sprinkler topped up ({item}). It will do your job. Badly paid, never complains.', 'You pour the can in ({item}). Automation: carrying water to the thing that carries water.'],
  farmFill: ['Watering can: full. Arms: already tired.', 'You fill the can. Somewhere a frog loses its home.'],
  farmCanEmpty: ['Your watering can is empty. Fill it at the well or a pond.'],
  farmNoSeeds: ['Your seed pouch is empty. Pip sells seeds at the stall by the farm, south of the village.'],
  farmForSale: ['Not your patch. Planksworth the Carpenter will sell you the house it belongs to.'],
  farmPlotForSale: ['Not your plot. Hollis the Farmhand will sell it to you. He\'s sitting right there. He\'s always sitting.'],
  farmTooLow: ['You don\'t know how to grow that yet. Gardening Lv {item}.'],
  cookRecipe: [
    'You followed a recipe. Exactly. Like an adult.',
    'Recipe cooked as written. Creativity remains optional.',
  ],
  // Shown on the LEVEL UP banner. {skill} = Cooking/Melee/Rizz, {level} = the new level.
  levelUp: [
    '{skill} level {level}. Your parents would be cautiously aware.',
    'Level {level} {skill}. Somewhere, a squirrel felt a chill. Probably the weather.',
    '{skill} {level}. You are now slightly less bad at this.',
    'Level {level}. The bar was low. You cleared it.',
    '{skill} {level}. Nobody asked, but here we are.',
  ],
  // Fight lines that DON'T pop up the narrator bar (routine chatter). Everything else does. (v0.41)
  quietInFights: ['playerCrit', 'enemyCrit', 'eat', 'defend', 'enemyBuff', 'enemyDebuff', 'stun', 'squeak', 'throwHit', 'hesitate',
    'pigeonRally', 'confusedHit', 'lateFeeBroke', 'stolenNothing', 'roastWin', 'hypeWin', 'fleeFail', 'ateInedible'],

  // ---------- Fight tricks (Refinement Phase 3) ----------
  perfectBlock: ['Perfect block. The {enemy} hit a wall, and the wall hit back.', 'You read that like a book. A short book. With pictures.'],
  riposte: ['Riposte! The {enemy} walked right into it. As planned. Allegedly.'],
  shrineWin: ['The Guardian sinks back into the ground, full. You get the feeling it\'ll be hungry again soon. Twenty minutes, roughly.'],
  ledgerUp: ['The {enemy} raises his ledger. Hitting paperwork is futile.'],
  chaseDrop: ['It dropped. Act casual.', 'The rare one. Nobody will believe you.', 'A boss drop. Try not to sell it for soup money.'],
  // The Soggy Marsh (W2)
  overtime: ['The last {enemy} is on overtime now. It is not being paid for this. It is angry about that.', 'Alone at last, the {enemy} works harder. Unpaid interns are terrifying.'],
  billable: ['The {enemy} bills you for that hit. In blood. Defend next time: no hit, no invoice.', 'The {enemy} heals on your dime. Defend and it can\'t charge you.'],
  approved: ['The {enemy} has been APPROVED. Its next hit taken bounces off the paperwork.', 'Stamp! The {enemy} is now officially protected. A guard-breaking skill tears that up.'],
  approvedBlock: ['Your hit lands on a stamped form. The {enemy} is legally unharmed.', 'Blocked by bureaucracy. The {enemy} smirks.'],
  stampTorn: ['You tear the {enemy}\'s stamp clean off. Paperwork has never felt so good.', 'Stamp torn. The {enemy} is just a {enemy} again.'],
  ledgerBlock: ['Your Attack bounces off a very thick ledger. Try something fancier.'],
  ledgerRip: ['You rip the ledger in half. The {enemy} looks like he just lost a decade.'],
  bouncerStance: ['The {enemy} crosses his arms. Hitting him now would be a mistake. You love mistakes.'],
  stanceBounce: ['You hit the {enemy}. The {enemy} did not notice. Your wrist did.'],
  guardBroken: ['GUARD BROKEN. The {enemy} uncrosses his arms in shock.'],
  squirrelEats: ['The {enemy} eats your {item} in front of you. Maintaining eye contact.'],
  snackSaved: ['The {enemy} drops your snack. Five-second rule applies.'],
  auditStart: ['The {enemy} writes "{item}" in his little book. Do that again and it gets deducted.'],
  deducted: ['{item} again? Deducted. The paperwork was very clear.'],
  formationDive: ['FORMATION! The whole flock dives at once. Somewhere, a statue feels avenged.'],
  formationBroken: ['You took out the one with the plan. The rest of the flock forgets what a formation is.'],
  bodyguardAssign: ['The Godfather assigns a bodyguard. It has a tiny earpiece.'],
  bodyguardDown: ['The bodyguard is down. The Godfather is suddenly very exposed.'],
  noticeServe: ['The Guardian gives you a Last Warning. Hit it hard enough to break it, or brace.'],
  noticeContested: ['Warning broken! The Guardian drops its paperwork and loses its place.'],
  skill_wideSwing: ['You swing wide. Everyone gets some. Sharing is caring.'],
  skill_guardBreak: ['Guard Break! Subtle as a falling barn.'],
  skill_riposte: ['You settle into a stance. Go on. Hit me. Please.'],
  skill_sizzleSlam: ['Sizzle Slam! Your hand is also cooked. Worth it.'],
  skill_castIron: ['Cast-Iron Crunch. You will need a moment. So will they.'],
  skill_secondHelping: ['Second helping, mid-fight, with a frying pan. Multitasking.'],
  skill_rubberBand: ['The chicken bounces off three faces. Physics is confused too.'],
  skill_distraction: ['You wave the chicken around. The {enemy} cannot look away.'],
  skill_chaosSquawk: ['CHAOS SQUAWK. Half of them are confused. The other half are furious. Classic.'],

  cookDev: [
    'Cheating. Noted. For testing purposes only, obviously. Cooking is now level {level}.',
  ],

  // ---------- Repairs: the run-down village (data/repairs.js) ----------
  forestEnter_marsh: [   // arriving in the Soggy Marsh (W2)
    'The Soggy Marsh. Every step goes squelch. Every squelch has opinions.',
    'Mud, fog, and the distant sound of paperwork. Welcome to the Marsh.',
    'You enter the Marsh. Your boots will never be dry again.',
  ],
  notaryClosed: [
    'The Notary\'s office is closed. A sign says to take a number. There are no numbers.',
    'Locked. Somewhere inside, a toad is stamping things on purpose.',
  ],
  rundown: [
    'Welcome to Foopville. The well is broken, the road is rubble, and the bunting gave up years ago.',
    'Foopville has seen better days. It has not seen them recently.',
    'A charming village, if you squint. Squint harder. There. Almost.',
    'The Restoration Board by the well has a list. The list has opinions about you.',
  ],
  repairBoard: [
    'The Restoration Board. A to-do list the whole village wrote for you.',
    'Every ruin, priced and judged. Mostly judged.',
    'Things to fix, coins to spend. Your hammer trembles.',
  ],
  repairLocked: [
    'Not yet. One ruin at a time.',
    'You can\'t fix that yet. Fix the other thing first. Then come back and be disappointed again.',
    'The village appreciates your enthusiasm. It does not accept it as payment.',
  ],
  repairBroke: [
    'You are short. Of coins, of planks, of everything really.',
    'Repairs cost money. Money you have spent on soup.',
    'The ruin stays a ruin. It seems relieved.',
  ],
  repairDone: {
    well: [
      'The well works again. Water, finally, for everyone. You are a hero to buckets.',
      'Fixed. The well gurgles. It might be gratitude. It might be a frog.',
      'The Well is back. Toss a coin in. It can\'t hurt. Probably.',
    ],
    south_road: [
      'The South Road is clear. It leads somewhere. Eventually.',
      'Rubble gone. The road south is open, and slightly less embarrassing.',
      'You fixed a road. Historians will barely mention it.',
    ],
    east_bridge: [
      'The East Bridge holds. You jump on it twice to be sure. It sighs.',
      'A bridge! To a swamp! Progress has never smelled worse.',
      'Fixed. The way east is open. The way east is also damp.',
    ],
    market: [
      'The Market is open. Strangers sell strange things. You fit right in.',
      'Stalls, awnings, shouting. Foopville has an economy again. Lucky economy.',
      'You rebuilt the Market. Your stall already feels faster. And smug.',
    ],
    windmill: [
      'The Windmill turns. Flour, at last. Bread is within your reach. Barely.',
      'Creak, creak, creak. The sails work. So does the Miller, reluctantly.',
      'The Windmill is fixed. Now you can bake things and burn them.',
    ],
  },
  marketGreet: [
    'The Market. Three things today. Choose like it matters. It might.',
    'A trader waves. You wave back. Haggling has begun, apparently.',
    'Fresh stock! Some of it fresh. Some of it stock.',
  ],
  marketBought: [
    'Bought. The trader looks pleased. That is never a good sign.',
    'A fine purchase. Fine for the trader, mostly.',
  ],
  marketSoldOut: [
    'Sold out. Come back tomorrow, when it will be sold out of something else.',
    'Nothing left of that. You blinked.',
  ],
  millerGreet: [
    'The Miller grinds flour and grinds his teeth. Both at a fair price.',
    'Flour, three coins. The Miller does not haggle with his face.',
    'The sails creak overhead. "Flour?" says the Miller. It is all he says.',
  ],
  millerBought: [
    'You buy flour. You are now dusty. Forever, probably.',
    'Flour in the bag. Something to bake. Something to burn.',
  ],
  wellBroken: [
    'The well is broken. You get a bucket of cobwebs. Try the pond.',
    'Nothing comes up but spiders. Fix the well first. The pond still works.',
  ],
  wishNothing: [
    'You wish. The well keeps the coin. The well always keeps the coin.',
    'Plop. Nothing. Wishes are a business, and business is good.',
    'The well thanks you for your donation.',
    'You wished for something. The universe left you on read.',
    'Ten coins, gone. You feel lighter. Mostly in the purse.',
    'A small splash. A big nothing.',
  ],
  wishWin: [
    'The well coughs something up: {item}. Lucky you.',
    'A wish came true! It was a small wish. You got {item}.',
    'The water bubbles. {item}. The well is feeling generous today.',
  ],
  wishDone: ['You already wished today. The well needs time to ignore you properly.'],
  // ---------- Phase D (v1.00): the Vault, the Archivist, the Bog Notary, the eastern town. PLACEHOLDER lines ----------
  vaultEnter: ['The iron door groans open. Behind it: the elders\' records. And something that has been eating them.', 'The Old Key fits. Of course it does. Nobody ever changes the locks.'],
  raidHazard_shelves: ['The Stacks. Old shelves, leaning in. Keep moving down the aisles. Stopping is how you get filed.', 'Shelves tip when you linger. Walk like you have somewhere to be.'],
  vaultShelf: ['A shelf of ledgers lands on you. Heavy reading.', 'Filed. Under "ouch".', 'The shelf tips. You were in the way. Noted.'],
  vaultLore: ['{item}'],
  archiveEnter: ['The Archive. Something huge and silver is curled around the last of the records. It wears reading glasses.'],
  archiveFight: ['"Shh." The Archivist slides behind its filing shelves. It will be with you shortly. It will not.'],
  archivistStart: ['The Archivist peers at you over its glasses. You are overdue.', 'A giant silverfish with a filing system. You picked a fight with the library.'],
  archivistPhase1: ['Phase 2: Redact. It starts blacking out your options. Rude, but very tidy.'],
  archivistPhase2: ['Phase 3: Last Copy. It\'s eating the last pages. Throw something at it before it digests the evidence.'],
  archivistWin: ['The Archivist is down. The records are mostly crumbs. Mostly.', 'Case closed. Shelf cleared. Fine waived.'],
  archivistLose: ['Shelved. Permanently.', 'You were catalogued, cross-referenced and eaten.'],
  archivistFlee: ['The filing shelves sigh and fall over. Nobody is filing anything now.'],
  archivistRedact: ['{enemy} blacks out your {item}. It never happened. Officially.', 'Redacted: your {item}. For your own protection, apparently.'],
  archivistChew: ['{enemy} starts eating pages. It looks healthier with every one. Throw a dish!', 'It\'s snacking on the records. Interrupt lunch.'],
  archivistSpit: ['A dish to the face. {enemy} spits the pages out. Lunch is cancelled.'],
  bookwormFocus: ['{enemy} nibbles your concentration. {item} Focus gone.', 'Chomp. There goes {item} Focus. You were using that.'],
  inkSplash: ['Ink in your eyes. Your aim will be... creative for a bit.', '{enemy} splashes you. Everything looks like a smudge. Including your future.'],
  inkMiss: ['Ink in your eyes. You hit the air very confidently.', 'Missed. The ink did that. Probably.'],
  mothDodge: ['{enemy} flutters out of the way. Paper is light. You are not.', 'Missed. It\'s a moth. It doesn\'t even try.'],
  approvalBlock: ['Stamp of Approval: that hit was pre-rejected.', 'Denied. The Stamp of Approval does not approve of being hit.'],
  notaryStart: ['The Bog Notary closes the office door. "This meeting is now in session. You are not."', 'A toad the size of a cart, in a waistcoat. He has filed a complaint about you already.'],
  notaryPhase1: ['Phase 2: Motions. He starts objecting to whatever you just did.'],
  notaryPhase2: ['Phase 3: Final Judgement. He takes a very deep breath. Defend when he croaks.'],
  notaryWin: ['The Notary is down. He stamps one last form on the way: your victory. In triplicate.', 'Objection overruled. By you. With your fists.'],
  notaryLose: ['Rejected. You were rejected.', 'He stamps you DENIED and goes back to his lunch.'],
  notaryFlee: ['The Filing Frogs hop away with the paperwork.'],
  notaryStamp: ['STAMP. You\'ve been processed. Hold still. You have no choice.', 'He stamps you flat. Received, with thanks.'],
  notaryMotion: ['Motion to dismiss your {item}. Granted, by him, for him.', 'He files a motion against your {item}. It\'s binding. He says so.'],
  // ---------- Ranged (v1.01) ----------
  shootFirst: ['You threw a rock, but with equipment.', 'Slingshot out. Somewhere, a window flinches.'],
  outOfAmmo: ['Click. That was the sound of poor planning.', 'Out of ammo. You could throw harsh words. You will not.'],
  backRow: ['It is hiding at the back. Sensible. Unlike you.'],
  bossConfused: ['{enemy} is confused and forgets what it was doing. Bosses don\'t hit themselves. They\'re professionals.'],
  ammoHarvest: ['{item}'],
  officeClosed: ['{item}'],
  officeWon: ['You walk out of the office. Nobody stops you. Nobody makes eye contact either.', 'Meeting adjourned. By force.'],
  eastLocked: ['The road east goes past the Notary\'s office. Nobody gets past the Notary. Not without the right form.'],
};

// ---------- Village surprise events (V3, data/events.js). PLACEHOLDER lines. ----------
// eventStart.<id>: said when one starts (names where to look). eventDone.<id>: when you finish it.
FUP.narrator.eventStart = {
  peddler: ['A travelling peddler has set up by the north gate. He looks honest. That\'s the worrying part.', 'Someone\'s selling things by the north gate. From a suitcase. Very official.'],
  pigeon_mail: ['A pigeon left something on your doorstep. For once, it\'s a letter.', 'There\'s mail at your door. Delivered by pigeon. Judged by pigeon.'],
  lost_tourist: ['A lost tourist is wandering the middle of the village, looking hungry and confused. Relatable.', 'There\'s a stranger in the village square. He looks lost. And hungry. Mostly hungry.'],
  crop_thieves: ['Squirrels are eyeing your crops. Go shoo them before they get ideas.', 'Your farm has visitors. Small, furry, guilty-looking visitors. Shoo them, quickly.'],
  rain: ['It\'s raining. The fish love it. Your crops don\'t care. Water them anyway.', 'Rain. Everything smells like wet dog, including you. The fish are biting, though.'],
  chef_challenge: ['Marrowbone wants to see if you can cook one specific thing. He\'s already disappointed.', 'Chef Marrowbone has a challenge for you. He says it\'s easy. He also says that about insults.'],
  glitter_pond: ['The village pond is glittering. Fish come out two at a time for a while. Don\'t ask why.', 'Something shiny is in the pond. The fish are excited. Go and take advantage.'],
  mystery_crate: ['A crate has turned up somewhere in the village. Nobody knows whose it is. Finders keepers.', 'There\'s a mystery crate lying around the village. It\'s yours now. Legally questionable.'],
  market_day: ['It\'s Market Day! Your food stall is selling twice as fast. Try to keep up.', 'Market Day. The whole village is shopping. Even your stall is doing well. Shocking.'],
};
FUP.narrator.eventDone = {
  peddler: ['The peddler packs his suitcase and leaves. He was whistling. That\'s never good.', 'Sold out. He waves goodbye with your money.'],
  pigeon_mail: ['Mail read. The pigeon has already left something else. Don\'t look.', 'Letter opened. Nobody writes to you. Somebody just did.'],
  lost_tourist: ['The tourist wanders off, well fed and still lost.', 'He thanks you and walks straight into a fence. Happy, though.'],
  crop_thieves: ['Every squirrel shooed. Your crops are safe. For now.', 'The squirrels have fled. They\'ll talk about you.'],
  rain: ['The rain stops.', 'The sun comes back. Nobody asked it to.'],
  chef_challenge: ['"Acceptable. Barely. Take your money and go."', '"I\'ve had worse. Not recently, but I have."'],
  glitter_pond: ['The pond stops glittering. Back to normal, boring fish.', 'The sparkle\'s gone. The fish look disappointed.'],
  mystery_crate: ['Free stuff. The best kind.', 'Nobody saw you take it. Probably.'],
  market_day: ['Market Day is over.', 'The market quiets down.'],
};
FUP.narrator.thievesGone = ['The squirrels got bored and wandered off. Nothing taken. They were just looking. Judging, really.'];

// ---------- Plot buildings (B3). PLACEHOLDER lines. ----------
FUP.narrator.shedBuilt = ['A shed. Somewhere to keep things you will never use. A milestone.', 'Your shed is up. It already smells like a shed.'];
FUP.narrator.shedFull = ['Empty the shed first. It\'s not a magic trick.', 'Your pantry is using the shed\'s space. Clear 20 things out first.'];
FUP.narrator.rackBuilt = ['A trap rack. More traps, more fish, more smell.', 'The trap rack is up. Gill will be thrilled. Or jealous.'];
FUP.narrator.rackBusy = ['Pick up some traps first. The rack is holding them up.', 'Too many traps out to take the rack down. Bring a couple in.'];
FUP.narrator.stall2Built = ['A second stall. Now you can disappoint two queues at once.', 'Two stalls. An empire, by village standards.'];


// ---------- The Cart Stop and the Fountain (R3). PLACEHOLDER lines. ----------
FUP.narrator.repairDone.cart_stop = [
  'The Cart Stop is back. The horse looks at you like you owe it money. You will.',
  'Fixed. A cart, a horse, and a driver who has seen things. Mostly roads.',
  'You can ride places now. Walking was getting embarrassing anyway.',
];
FUP.narrator.repairDone.fountain = [
  'The Fountain runs again. It does nothing useful. It\'s beautiful. Like you, minus the beautiful.',
  'Every repair done. The village looks almost respectable. People are suspicious of you.',
  'The Fountain sparkles. Foopville is restored. Your back will never be the same.',
];
FUP.narrator.cartGreet = ['"Where to? Somewhere you\'ve been, mind. I don\'t do adventures."', '"Fare up front. The horse has standards."', '"One way. I don\'t wait. Nobody waits for you."'];
FUP.narrator.cartArrive = ['The cart drops you off and leaves at once. Rude, but efficient.', 'You arrive with a sore back and a lighter purse. Classic travel.', 'The driver says "good luck" in a tone that means "goodbye forever".'];
FUP.narrator.cartBroke = ['"No coins, no cart." The horse agrees.', 'You can\'t afford the fare. The horse snorts. Loudly.'];
FUP.narrator.boardAllDone = ['Nothing left to fix. Suspicious.'];
// v1.08 one head item at a time: a Wardrobe hat can't go on while head armour has nowhere to go
FUP.narrator.hatNoRoom = ['Your helmet needs somewhere to go before the hat goes on. Your backpack is full.', 'One head, one thing on it. Make room in your backpack for the helmet first.'];
