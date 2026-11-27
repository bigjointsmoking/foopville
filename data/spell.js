// ============================================================
// THE SPELL PAGE (story Phase C, v0.82): pieces of lost magic from the story quests.
// They fill the slots on a page (✨ Spell in the 🎒 backpack). They do nothing until
// the whole spell is done (Jesus, 2026-11-18); the finished spell will help you speak to
// the dragon and protect you in that fight (not built yet).
// Pieces are KEPT EVEN IF YOU DIE, in both modes (handoff Phase C): they live in their own
// browser storage, not in your life's save. Rules: src/systems/spell.js.
// All names and lines are PLACEHOLDERS for Jesus.
// ============================================================
window.FUP = window.FUP || {};

FUP.spellData = {
  // (v1.32) Keepsakes: magic you've found that isn't a piece of the page. Shown under the page while you have the fact.
  // Facts survive a Normal-mode death; Hardcore (a new life) wipes them (Jesus, Ash Q5). PLACEHOLDER text.
  keepsakes: [
    { fact: 'keepsake:spark', emoji: '✨', name: 'The First Spark', text: 'A little of her fire, drawn out of Pip\'s field. Warm. It does nothing yet.' },
  ],
  size: 7,                      // slots on the page (Jesus: 7; Phase C fills 3)
  storageKey: 'fupville_spell', // browser storage (survives death and a new life)
  title: 'An Old Spell',
  blurb: 'A page in a language nobody speaks any more. Some of the words have come back.',
  // Which quest gives which piece (in page order). Unknown ones show as "?".
  pieces: [
    { quest: 'tollRecords', word: 'NAME' },
    { quest: 'theBowl',     word: 'HUNGER' },
    { quest: 'oldAccounts', word: 'QUIET' },
    { quest: 'archivist',   word: 'OWED' },     // Phase D: beat the Archivist in the Vault (src/systems/raid.js vaultReward). Word PLACEHOLDER
    { quest: 'rightForm',   word: 'SIGNED' },   // Phase D: the quest "The Right Form" (the Bog Notary). Word PLACEHOLDER
  ],
  // What the narrator says when a piece lands (by how many you have)
  lines: [
    'A word floats off the page and settles in your head. You don\'t know what it means. It seems to know you.',
    'Another word. The page hums. You put it down. It keeps humming.',
    'Three words. Not a sentence yet. More of a strong opinion.',
    'Four. The page is warm now. Probably fine.',
    'Five. The words have started arguing with each other.',
    'Six. One gap left. The page is holding its breath.',
    'The spell is whole. Whatever it does, it does it to dragons.',
  ],
};
