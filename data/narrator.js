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
    'The Landlord is waiting. So is your rent.',
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
  allFlee: ['With the landlord gone, the tenants scatter. Nobody pays rent today.'],

  // ---------- The Mushroom Landlord ----------
  bossStart: [
    'The Mushroom Landlord. He owns this forest, and as of now, he owns you.',
    'The Landlord has been expecting you. You\'re three months behind.',
  ],
  bossPhase1: ['Phase 2: Spore Season. The air is now legally poisonous.'],
  bossPhase2: ['Phase 3: Rent\'s Due. Hide your wallet. Too late.'],
  bossSummon: ['Open house! A Tenant Shroom moves in. It doesn\'t pay rent either.'],
  bossRent: ['Rent\'s due. He took {item} coins. Late fees apply forever.'],
  bossRentBroke: ['He tried to collect rent. You\'re broke. He hit you out of spite.'],
  feverStart: ['FEVER DREAM. Nothing is real. Your buttons are lying to you. One of them is the real Landlord.'],
  feverFake: ['That one wasn\'t real. Your turn was, though. Was.'],
  feverEnd: ['The fever breaks. You feel slightly more normal. Slightly.'],
  bossWin: ['The Landlord is evicted. The forest is rent-free. For now.', 'You beat the Landlord. Somewhere, a tenant cheers quietly.'],
  bossLose: ['Evicted. Permanently.', 'Killed by rent. Nobody is surprised.'],
  // Silly button names during Fever Dream (the buttons still do their real thing, shuffled).
  feverLabels: ['Panic', 'Vibe', 'Lick Air', 'Scream', 'Hmm?', 'Clap', 'Yes', 'Mushroom?', 'Wobble', 'Pay Rent', 'Nap', 'Spin'],

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
  villageRetreat: ['Home already? The Landlord will still be there. Rent accrues.', 'Back in Foopville, boss unbeaten. Nobody here will mention it. To your face.'],
  villageReturn: [
    'You\'re back. The Landlord isn\'t. The village is cautiously optimistic about you. Cautiously.',
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

  villageLostRun: ['You wake up at home with no memory of your last trip. Your bag and satchel didn\'t make it back.'],
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
    'The Deep Woods. Somewhere down here, a Landlord is collecting rent. Find the campfire first.',
  ],
  forestFromCampfire: ['You leave the fire. The Forest was waiting. Patiently. Hungrily.'],
  // ---------- The Landlord's Basement (the raid, blueprint 18.6) ----------
  raidEnter: ['A basement. Damp, dark, and somehow it still charges rent.', 'You land in the Landlord\'s Basement. The door behind you locks. Of course it does.'],
  raidFightRoom: ['The door slams behind you. The tenants look up. They don\'t look friendly.', 'Door shut. Locked. The only way out is through everyone in here.'],
  raidHazard_vents: ['The Boiler Room. The vents breathe out spores on a schedule. Learn it, or cough.', 'Spore vents. They puff in turn. You could time it. You won\'t, but you could.'],
  raidHazard_floor: ['The Rotten Stairwell. The cracked tiles won\'t hold you long. Neither would anyone.', 'Cracked floor. Keep moving. Standing still is how you meet the floor below.'],
  raidHazard_pipes: ['The Steam Hall. Pipes swing across it. Nobody knows why. The Landlord calls it "character".', 'Swinging steam pipes. Time your steps. Or don\'t, and time your bruises.'],
  raidBack: ['Back in the basement. It missed you. It didn\'t.', 'The basement. Still damp. Still yours, apparently.'],
  raidLocked: ['Locked. Someone in this room still has an opinion about you.', 'The door won\'t budge. Clear the room first.'],
  raidLockedAmbush: ['Still locked. The room looks empty. Rooms that look empty usually aren\'t. Check the laundry.', 'Locked. Something in here hasn\'t introduced itself yet. Probably the laundry pile.'],
  raidDoorOpens: ['Click. The door ahead unlocks. The basement accepts your victory grudgingly.', 'The door unlocks. Onward, deeper, damper.'],
  raidAmbush: ['Fresh laundry. And under it, tenants. Lots of them.', 'The laundry pile moves. Laundry shouldn\'t move.'],
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
  raidEat: ['You eat {item} on the move. Very busy. Very important.', '{item}, eaten standing in a basement. Fine dining.'],
  raidEatResist: ['{item}. Your insides feel spore-proof for this room.'],
  officeEnter: ['The Landlord\'s Office. He looks up from his desk. "You\'re late. Rent was due yesterday."', 'His office. Carpet, a desk, a portrait of himself. He\'s waiting for you.'],
  officeFight: ['"Let\'s discuss your tenancy." He cracks his knuckles. Mushrooms have knuckles now.'],
  chuteSlide: ['A chute opens. You slide all the way home. It\'s the most fun anyone\'s ever had in his building.', 'Evicted, finally. Not you. Him. You get the slide.'],
  villageChute: ['The chute spits you out at the gate. The village heard you coming. Everyone heard you coming.', 'Out of a chute and onto the road. Home, sweet, mushroom-free home.'],

  // The hidden hole in the Deep Woods (blueprint 18.6)
  holeFound: ['A hole in the ground. You\'ve made worse decisions. Not many.'],
  holeClimb: ['Down you go. The hole is darker than your future, which is saying something.'],
  holeNotYet: ['Sensible. The hole will wait. Holes are patient like that.'],
  forestWalkHome: ['You walk back to Foopville. Nobody asks how it went. Nobody has to.'],
  forestPickup: ['You found {item}. You will now put it in your mouth, eventually.', 'Picked up {item}. The ground was using it.', '{item}. Free food. Don\'t ask why it was on the floor.'],
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
  campfireRetreat: ['You tiptoe away from the Landlord\'s house. He saw. He\'s writing it down.'],
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
  farmHoe: ['You hoe the weeds. The weeds will be back. They always come back.', 'Soil: loosened. Back: ruined.', 'You hit the ground repeatedly. Farmers call this progress.'],
  farmWater: ['Splash. The plant looks less disappointed in you.', 'You water it. It drinks without saying thanks. Rude.'],
  farmSaved: ['You water the wilting {item} just in time. It will remember this. Barely.', 'The {item} perks up. It\'s smaller now, but alive. Like your ambitions.'],
  farmDead: ['Your {item} died of thirst. You had one job. Well, three waterings.', 'That {item} is very, very dead. Hoe it away and pretend it never happened.'],
  farmClear: ['You bury the evidence. The soil keeps your secret.'],
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
  noticeServe: ['The Landlord serves you a Final Notice. Hit him hard enough to contest it, or brace.'],
  noticeContested: ['Notice contested! The Landlord drops his paperwork and loses his place.'],
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
    'The Market. Three things today. Choose like your rent depends on it.',
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
};
