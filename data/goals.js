// ============================================================
// FIRST-DAY GOALS — the checklist card in the village (Jesus, 2026-11-18).
// Every new life sees it (tutorial done or skipped). Each goal ticks itself off when its
// fact is set (src/systems/facts.js), in any order. The card goes away after the last goal,
// or for good when you press ✕. Goals follow Captain Dreary's first-day plan (data/tutorial.js).
//   fact  the fact that means "done": did:* are set by quests.take / garden.plant / village.sold,
//         region:* by walking into a region, repair:* by finishing a repair.
// Wording is a PLACEHOLDER.
// ============================================================
window.FUP = window.FUP || {};

FUP.goalData = {
  title: 'FIRST DAY',
  list: [
    { fact: 'did:quest',   text: 'Take a quest from the Quest Board' },
    { fact: 'did:plant',   text: 'Buy seeds from Pip, plant them in your patch' },
    { fact: 'region:edge', text: 'Go out the north gate into the Forest Edge' },
    { fact: 'did:sell',    text: 'Sell something to the Shopkeeper' },
    { fact: 'repair:well', text: 'Repair the Well (Restoration Board)' },
  ],
  doneLine: 'First day done. You\'re on your own now. You always were.',
};
