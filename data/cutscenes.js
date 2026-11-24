// ============================================================
// CUTSCENES (v1.13): short cinematic scenes, played by src/cutscene.js (FUP.cutscene.play(scene, id, onDone)).
// First use: the Glass line. Each shard, held up at the forge, shows a moment of the bad day (elders' side).
// All timings, positions and captions are PLACEHOLDERS for Jesus.
//
// The screen is 900 x 600. Black bars cover the top and bottom (`bars` px each).
// The "stage" is the painted backdrop plus everyone on it; it pans left and right. Stage x runs along the
// backdrop (0 = its left edge); y is screen y. Things added with `screen: true` stay put while the stage pans.
//
// A scene: { backdrop: { key, height, bottom }, sky, ground, pan: [fromX, toX], length (seconds), tint (warms the backdrop + people: evening light), steps }
// Each step happens at time t (seconds):
//   caption: 'text'                       the line along the bottom bar ('' clears it)
//   sky: { color, dur }                   the sky behind the backdrop fades to a palette colour
//   add: { id, key, emoji, x, y, h, flip, alpha, screen, depth, top }   a picture (h = height on screen, feet at y; top = hangs from y)
//   move: { id, x, y, dur }               slide it there
//   swap: { id, key }                     change its picture (an elder raising a staff)
//   swing: { id, angle, dur, times }      rock it back and forth (the bell)
//   fade: { id, alpha, dur }
//   sweep: { key, emoji, y, h, dur, from, to, shadow, flip }   a huge shape crosses the whole screen (shadow: drawn dark, the dragon's shadow)
//   ring: { x, y, w, h, color, dur }      a ring of light growing on the ground (stage x)
//   embers: { n, dur }                    sparks drifting up
//   edges: { color, alpha }               fire glow at both sides of the screen
//   shake: { ms, power }  flash: { color, ms }  sfx: 'name'
// ============================================================
window.FUP = window.FUP || {};

FUP.cutsceneData = {
  bars: 70,            // letterbox bars (px)
  fadeInMs: 700,
  endFadeMs: 900,      // the white fade at the end
  skipText: 'Tap to skip',
  captionSize: 18,

  scenes: {
    // Shard 1 (Glass Q1 "Melted Stone"): the alarm
    alarm: {
      backdrop: { key: 'cs_square', height: 430, bottom: 480 },
      sky: 'b2', ground: 'w2', pan: [0, -380], length: 20, tint: 'w5',
      steps: [
        { t: 0.2, caption: 'The square. An evening like any other.' },
        { t: 0.3, add: { id: 'post', key: 'cs_bellpost', emoji: '', x: 820, y: 470, h: 230 } },
        { t: 0.3, add: { id: 'bell', key: 'cs_bell', emoji: '🔔', x: 820, y: 280, h: 66, top: true } },   // top: hangs (and swings) from its top
        { t: 2.6, sky: { color: 'r3', dur: 3 } },
        { t: 2.8, caption: 'Then the sky changed colour.' },
        { t: 3.4, add: { id: 'elder', key: 'cs_elder', emoji: '🧙', x: 560, y: 470, h: 130 } },
        { t: 3.5, move: { id: 'elder', x: 770, y: 470, dur: 2.2 } },
        { t: 5.2, caption: 'An elder ran for the alarm.' },
        { t: 5.8, swing: { id: 'bell', angle: 22, dur: 0.35, times: 10 } },
        { t: 5.8, sfx: 'shrine' },
        { t: 6.0, shake: { ms: 400, power: 0.004 } },
        { t: 6.6, add: { id: 'v1', key: 'cs_villager', emoji: '🏃', x: 1300, y: 480, h: 100, flip: true } },
        { t: 6.7, move: { id: 'v1', x: -100, y: 480, dur: 4.4 } },
        { t: 7.4, add: { id: 'v2', key: 'cs_villager', emoji: '🏃', x: 1380, y: 490, h: 92, flip: true } },
        { t: 7.5, move: { id: 'v2', x: -60, y: 490, dur: 4.2 } },
        { t: 8.3, add: { id: 'v3', key: 'cs_villager', emoji: '🏃', x: 1340, y: 474, h: 86, flip: true } },
        { t: 8.4, move: { id: 'v3', x: -20, y: 474, dur: 4.6 } },
        { t: 10.6, sweep: { key: 'title_dragon', shadow: true, flip: true, emoji: '🐉', y: 230, h: 300, dur: 2.6, from: 1200, to: -500 } },
        { t: 10.7, sfx: 'phase' },
        { t: 11.0, shake: { ms: 900, power: 0.012 } },
        { t: 12.4, edges: { color: 'r3', alpha: 0.35 } },
        { t: 12.6, embers: { n: 40, dur: 6 } },
        { t: 13.4, caption: 'Somewhere in the glass, a bell is still ringing.' },
        { t: 18.4, flash: { color: 'k4', ms: 900 } },
      ],
    },
    // Shard 2 (Glass Q2 "More Where That Came From"): the elders gather
    gather: {
      backdrop: { key: 'cs_square', height: 430, bottom: 480 },
      sky: 'r2', ground: 'w2', pan: [-60, -220], length: 20, tint: 'w5',
      steps: [
        { t: 0.2, caption: 'The well. The fire was close now.' },
        { t: 0.3, edges: { color: 'r3', alpha: 0.25 } },
        { t: 1.0, add: { id: 'e1', key: 'cs_elder', emoji: '🧙', x: 160, y: 470, h: 130 } },
        { t: 1.1, move: { id: 'e1', x: 380, y: 472, dur: 2.4 } },
        { t: 2.2, add: { id: 'e2', key: 'cs_elder', emoji: '🧙', x: 1200, y: 480, h: 134, flip: true } },
        { t: 2.3, move: { id: 'e2', x: 680, y: 478, dur: 2.6 } },
        { t: 3.2, caption: 'They came one by one.' },
        { t: 3.6, add: { id: 'e3', key: 'cs_elder', emoji: '🧙', x: 200, y: 456, h: 120 } },
        { t: 3.7, move: { id: 'e3', x: 445, y: 462, dur: 2.4 } },
        { t: 4.8, add: { id: 'e4', key: 'cs_elder', emoji: '🧙', x: 1240, y: 460, h: 122, flip: true } },
        { t: 4.9, move: { id: 'e4', x: 615, y: 464, dur: 2.6 } },
        { t: 6.0, add: { id: 'e5', key: 'cs_elder', emoji: '🧙', x: 527, y: 418, h: 112, alpha: 0, depth: -1 } },
        { t: 6.1, fade: { id: 'e5', alpha: 1, dur: 1.2 } },
        { t: 8.4, swap: { id: 'e1', key: 'cs_elder_cast' } },
        { t: 8.8, swap: { id: 'e2', key: 'cs_elder_cast' } },
        { t: 9.2, swap: { id: 'e3', key: 'cs_elder_cast' } },
        { t: 9.6, swap: { id: 'e4', key: 'cs_elder_cast' } },
        { t: 10.0, swap: { id: 'e5', key: 'cs_elder_cast' } },
        { t: 10.0, ring: { x: 527, y: 462, w: 400, h: 80, color: 'y2', dur: 2.5 } },
        { t: 10.1, sfx: 'spell' },
        { t: 10.6, caption: 'Not one. Many.' },
        { t: 13.0, embers: { n: 50, dur: 6 } },
        { t: 13.6, sweep: { key: 'title_dragon', shadow: true, flip: true, emoji: '🐉', y: 210, h: 320, dur: 2.4, from: 1250, to: -550 } },
        { t: 13.7, sfx: 'phase' },
        { t: 14.0, shake: { ms: 1000, power: 0.014 } },
        { t: 14.5, edges: { color: 'r3', alpha: 0.5 } },
        { t: 18.4, flash: { color: 'k4', ms: 900 } },
      ],
    },
  },
};
