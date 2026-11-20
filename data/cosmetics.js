// ============================================================
// COSMETICS — hats and titles (phase G2). No stats: they're just for showing off.
//   hats:   drawn on your hero's head on the map and in fights. price = sold by the Shopkeeper (Hats tab);
//           no price = boss drop only (data/gear.js bossDrops `hat` rows).
//   titles: free once their `req` is met (facts: data/facts.js). Shown after your name: "Pib the Gatecrasher".
// Change them in the 🎒 backpack, Wardrobe tab. Rules: src/systems/cosmetics.js.
// Kept on a Normal death; Hardcore wipes them.
// ============================================================
window.FUP = window.FUP || {};

FUP.cosmeticData = {
  hats: {
    straw_hat:    { name: 'Straw Hat', emoji: '👒', price: 500, blurb: 'For farming, or pretending to.' },
    chef_hat:     { name: "Chef's Hat", emoji: '👨‍🍳', price: 1500, blurb: 'Marrowbone would like a word.' },
    tiny_crown:   { name: 'Tiny Crown', emoji: '👑', price: 5000, blurb: 'Rules over a very small kingdom. Your head.' },
    don_fedora:   { name: "The Don's Fedora", emoji: '🎩', blurb: 'Dropped by the Pigeon Godfather. Still smells of breadcrumbs.' },
    golden_toque: { name: 'Golden Toque', emoji: '👨‍🍳', blurb: 'From The Critic. Marrowbone says you didn\'t earn it. He gave it anyway.' },   // quest reward (v0.80): no price = never sold
    guardian_cap: { name: "Guardian's Cap", emoji: '🍄', blurb: 'Dropped by the Mushroom Guardian. Still warm.' },
    // Collection log rewards (E2, data/log.js rewards.all): the whole log at 25 / 50 / 75 / 100%. PLACEHOLDER looks.
    paper_crown:  { name: 'Paper Crown', emoji: '🗞️', blurb: 'A quarter of the log. Folded from your own notes.' },
    explorer_cap: { name: "Explorer's Cap", emoji: '🧢', blurb: 'Half the log. You have been places. Mostly muddy ones.' },
    laurel:       { name: 'Laurel', emoji: '🌿', blurb: 'Three quarters of the log. Smells faintly of victory and salad.' },
    halo:         { name: "Completionist's Halo", emoji: '🌟', blurb: 'The whole log. Go outside. Wait, you did. All of it.' },
  },
  titles: {
    gatecrasher:   { text: 'the Gatecrasher', req: { facts: { 'boss:guardian': 1 } } },
    squirrel_bane: { text: "Squirrel's Bane", req: { facts: { 'kill:squirrel': 100 } } },
    pigeon_friend: { text: 'Friend of Pigeons', req: { facts: { 'boss:godfather': 5 } } },
    restorer:      { text: 'the Restorer', req: { facts: { 'repair:fountain': 1 } } },   // the Fountain (R3)
    witness:       { text: 'the Witness', req: { facts: { 'title:witness': 1 } } },   // His First Quest (v0.81)
    // Collection log: a full page (E2, data/log.js rewards.done)
    log_forager:   { text: 'the Forager', req: { facts: { 'logDone:ingredients': 1 } } },
    log_chef:      { text: 'Head Chef', req: { facts: { 'logDone:dishes': 1 } } },
    log_angler:    { text: 'the Angler', req: { facts: { 'logDone:fish': 1 } } },
    log_pest:      { text: 'Pest Control', req: { facts: { 'logDone:creatures': 1 } } },
    log_lucky:     { text: 'the Unreasonably Lucky', req: { facts: { 'logDone:drops': 1 } } },
    log_explorer:  { text: 'the Explorer', req: { facts: { 'logDone:areas': 1 } } },
  },
  // Where the hat sits: pixels above the hero's middle, and its size (map / fight)
  hatOffset: { map: -20, battle: -44 }, hatSize: { map: 22, battle: 44 },
};
