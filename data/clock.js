// ============================================================
// CLOCK — days that only pass while you play (design/foundation.md 6).
// Nothing reads the day yet except the label: quests, shop stock and
// village events hook into it in later phases.
// ============================================================
window.FUP = window.FUP || {};

FUP.clockData = {
  daySeconds: 1200,            // 20 minutes of play = 1 day
  sleepFrom: 0.5,              // "Sleep until morning" only after this share of the day
  // Parts of the day: `until` = share of the day when it ends
  phases: [
    { id: 'morning', name: 'Morning', emoji: '🌅', until: 0.25 },
    { id: 'day',     name: 'Day',     emoji: '☀️', until: 0.65 },
    { id: 'evening', name: 'Evening', emoji: '🌇', until: 0.85 },
    { id: 'night',   name: 'Night',   emoji: '🌙', until: 1 },
  ],
  maxStep: 1,                  // seconds: one tick never adds more than this (the tab was asleep)
  maxCatchUp: 20,              // a timer never fires more than this many times in one tick
  noClockScenes: ['Boot', 'Start', 'Create'],   // screens where time stands still
};
