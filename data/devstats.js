// Dev stats panel (M1, claude/FIRST_30_MINUTES.md). Hidden: only Jesus knows how to open it.
// Local only: everything stays in this browser (no network). Read by src/devStats.js.
FUP.devStatsData = {
  enabled: true,          // false = the panel and the logging are off
  key: 'Backquote',       // the ` key (left of 1) opens / closes it on a computer
  cornerTaps: 3,          // phones: tap the top-left corner of the game this many times...
  cornerSize: 48,         // ...inside this many pixels of the corner...
  cornerWindow: 1.2,      // ...within this many seconds
  storageKey: 'fupville_devstats',
  keepEvents: 400,        // oldest events are dropped after this many
  recentShown: 40,        // events listed at the bottom of the report
  longGapsShown: 5,       // longest waits between rewards listed
  saveEvery: 2,           // seconds between writes to browser storage
};
