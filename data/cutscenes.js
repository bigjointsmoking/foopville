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
//   swap: { id, key, h }                  change its picture (an elder raising a staff); h = new height (optional, v1.24)
//   swing: { id, angle, dur, times }      rock it back and forth (the bell)
//   fade: { id, alpha, dur }
//   sweep: { key, emoji, y, h, dur, from, to, shadow, flip }   a huge shape crosses the whole screen (shadow: drawn dark, the dragon's shadow)
//   ring: { x, y, w, h, color, dur }      a ring of light growing on the ground (stage x)
//   embers: { n, dur }                    sparks drifting up
//   edges: { color, alpha }               fire glow at both sides of the screen
//   grow: { id, h, dur }                  (v1.19) scale a picture up to height h (the dragon coming closer)
//   barrier: { id, x, y, w, h, color, dur }  (v1.19) a shimmering wall of light rising from the ground (stage x; feet at y)
//   shatter: { id }                       (v1.19) the wall flares, cracks into pieces and they fall away
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
    // (v1.25) Glass Q4 "A Meeting": an ordinary day at the high clearing. Gold set out, the elders sitting with her, the translation
    // spell, talking. No fire, no Foop, no bad day. Pictures cs_clearing / cs_dragon_rest / cs_gold / cs_elder_sit. Captions PLACEHOLDER.
    // Stage x: the backdrop's stone ring sits at about 800-1560 (centre ~1180); the camera pans across it.
    meeting: {
      backdrop: { key: 'cs_clearing', height: 430, bottom: 480 },
      sky: 'b2', ground: 'g2', pan: [-560, -960], length: 22, tint: 'w5',
      steps: [
        { t: 0.2, caption: 'The clearing at the top of the road. Long ago.' },
        { t: 0.3, add: { id: 'gold', key: 'cs_gold', emoji: '🪙', x: 1180, y: 478, h: 54 } },
        { t: 0.4, add: { id: 's1', key: 'cs_elder_sit', emoji: '🧙', x: 930, y: 484, h: 84 } },
        { t: 0.4, add: { id: 's2', key: 'cs_elder_sit', emoji: '🧙', x: 1030, y: 494, h: 90 } },
        { t: 0.4, add: { id: 's3', key: 'cs_elder_sit', emoji: '🧙', x: 1290, y: 494, h: 88 } },
        { t: 0.4, add: { id: 's4', key: 'cs_elder_sit', emoji: '🧙', x: 1370, y: 482, h: 82 } },
        { t: 2.4, sky: { color: 'r2', dur: 4 } },
        { t: 2.6, add: { id: 'drg', key: 'cs_dragon_rest', emoji: '🐉', x: 1820, y: 610, h: 440, alpha: 0, flip: true, depth: true } },   // the picture has lots of empty space: drawn big and low so she sits on the grass
        { t: 2.7, fade: { id: 'drg', alpha: 1, dur: 2.6 } },
        { t: 2.8, move: { id: 'drg', x: 1650, y: 610, dur: 3 } },
        { t: 3.4, caption: 'She came and settled at the edge of the ring.' },
        { t: 6.4, caption: 'Gold on the stones. Not payment. Manners.' },
        { t: 8.4, add: { id: 'e1', key: 'cs_elder_cast', emoji: '🧙', x: 1110, y: 500, h: 150 } },
        { t: 8.5, ring: { x: 1180, y: 488, w: 620, h: 80, color: 'b4', dur: 2.6 } },
        { t: 8.6, sfx: 'spell' },
        { t: 9.4, caption: 'A small spell, so words could go both ways.' },
        { t: 11.6, fade: { id: 'e1', alpha: 0, dur: 1.2 } },
        { t: 12.4, embers: { n: 14, dur: 4 } },
        { t: 12.6, caption: 'They talked. She answered. The stones warmed where she breathed.' },
        { t: 15.6, caption: 'They had done this many times.' },
        { t: 19.6, flash: { color: 'k4', ms: 900 } },
      ],
    },
    // (v1.24) Staff Q5 "The Last Stand": fitting the head cap at the melted square. The eldest raises the whole staff;
    // the spell cuts out in a white flash of fire. Does NOT show that it worked or needed her fire. Captions PLACEHOLDER.
    laststand: {
      backdrop: { key: 'cs_edge', height: 430, bottom: 480 },
      sky: 'r3', ground: 'w2', pan: [-60, -300], length: 21, tint: 'w5',
      steps: [
        { t: 0.2, caption: 'The square. The same day. Later.' },
        { t: 0.2, edges: { color: 'r3', alpha: 0.35 } },
        { t: 0.3, embers: { n: 30, dur: 6 } },
        { t: 0.4, add: { id: 'e1', key: 'cs_elder', emoji: '🧙', x: 560, y: 474, h: 120 } },
        { t: 0.4, add: { id: 'e2', key: 'cs_elder', emoji: '🧙', x: 650, y: 486, h: 126 } },
        { t: 0.4, add: { id: 'e3', key: 'cs_elder', emoji: '🧙', x: 830, y: 480, h: 124 } },
        { t: 0.4, add: { id: 'e4', key: 'cs_elder', emoji: '🧙', x: 910, y: 468, h: 118 } },
        { t: 1.6, add: { id: 'eld', key: 'cs_elder', emoji: '🧙', x: 600, y: 500, h: 146 } },
        { t: 1.7, move: { id: 'eld', x: 740, y: 500, dur: 2.4 } },
        { t: 3.0, caption: 'Fewer of them now. The eldest stepped to the front.' },
        { t: 3.2, sweep: { key: 'title_dragon', shadow: true, flip: true, emoji: '🐉', y: 220, h: 300, dur: 2.8, from: 1200, to: -500 } },
        { t: 3.3, sfx: 'phase' },
        { t: 3.5, shake: { ms: 800, power: 0.01 } },
        { t: 6.4, swap: { id: 'eld', key: 'cs_elder_cast', h: 200 } },
        { t: 6.5, sfx: 'staffHum' },
        { t: 6.6, caption: 'The eldest raised the staff. Whole, then. Capped.' },
        { t: 7.6, swap: { id: 'e1', key: 'cs_elder_cast', h: 162 } }, { t: 7.8, swap: { id: 'e2', key: 'cs_elder_cast', h: 170 } },
        { t: 8.0, swap: { id: 'e3', key: 'cs_elder_cast', h: 167 } }, { t: 8.2, swap: { id: 'e4', key: 'cs_elder_cast', h: 159 } },
        { t: 8.6, ring: { x: 740, y: 500, w: 520, h: 90, color: 'k4', dur: 3 } },
        { t: 8.7, sfx: 'spell' },
        { t: 10.0, caption: 'Everything they had, into one last spell.' },
        { t: 12.4, edges: { color: 'r3', alpha: 0.7 } },
        { t: 12.6, embers: { n: 80, dur: 5 } },
        { t: 13.0, flash: { color: 'k4', ms: 1400 } },
        { t: 13.0, shake: { ms: 1300, power: 0.02 } },
        { t: 13.2, fade: { id: 'eld', alpha: 0, dur: 1.2 } },
        { t: 13.2, fade: { id: 'e1', alpha: 0, dur: 1.2 } }, { t: 13.2, fade: { id: 'e2', alpha: 0, dur: 1.2 } },
        { t: 13.2, fade: { id: 'e3', alpha: 0, dur: 1.2 } }, { t: 13.2, fade: { id: 'e4', alpha: 0, dur: 1.2 } },
        { t: 14.6, caption: 'White fire. Then nothing.' },
        { t: 18.6, flash: { color: 'k4', ms: 900 } },
      ],
    },
    // Shard 3 (Glass Q3 "The Western Ruins", v1.19): the repelling spell. The elders' side only; ends before the
    // last stand (no main staff, no last spell). Captions PLACEHOLDER.
    repel: {
      backdrop: { key: 'cs_edge', height: 430, bottom: 480 },
      sky: 'r2', ground: 'w2', pan: [-60, -340], length: 22, tint: 'w5',
      steps: [
        { t: 0.2, caption: 'The edge of the village. Dusk, and something coming.' },
        { t: 0.3, add: { id: 'drg', key: 'cs_dragon_front', emoji: '🐉', x: 1000, y: 470, h: 120, alpha: 0, depth: true } },
        { t: 0.4, fade: { id: 'drg', alpha: 0.9, dur: 3 } },
        { t: 0.5, grow: { id: 'drg', h: 330, dur: 9 } },
        { t: 2.8, add: { id: 'e1', key: 'cs_elder', emoji: '🧙', x: 300, y: 476, h: 128 } },
        { t: 2.9, move: { id: 'e1', x: 560, y: 476, dur: 2.2 } },
        { t: 3.4, add: { id: 'e2', key: 'cs_elder', emoji: '🧙', x: 260, y: 462, h: 120 } },
        { t: 3.5, move: { id: 'e2', x: 640, y: 462, dur: 2.4 } },
        { t: 4.0, add: { id: 'e3', key: 'cs_elder', emoji: '🧙', x: 280, y: 488, h: 134 } },
        { t: 4.1, move: { id: 'e3', x: 720, y: 488, dur: 2.4 } },
        { t: 4.6, add: { id: 'e4', key: 'cs_elder', emoji: '🧙', x: 240, y: 468, h: 122 } },
        { t: 4.7, move: { id: 'e4', x: 800, y: 468, dur: 2.5 } },
        { t: 5.4, caption: 'They made a line.' },
        { t: 7.6, swap: { id: 'e1', key: 'cs_elder_cast' } }, { t: 7.8, swap: { id: 'e2', key: 'cs_elder_cast' } },
        { t: 8.0, swap: { id: 'e3', key: 'cs_elder_cast' } }, { t: 8.2, swap: { id: 'e4', key: 'cs_elder_cast' } },
        { t: 8.3, barrier: { id: 'wall', x: 900, y: 490, w: 70, h: 330, color: 'b4', dur: 1.6 } },
        { t: 8.4, sfx: 'spell' },
        { t: 9.0, caption: 'A wall of light. Not to hurt her. To push her back.' },
        { t: 10.4, move: { id: 'drg', x: 1060, y: 470, dur: 1.4 } },
        { t: 10.4, shake: { ms: 500, power: 0.006 } },
        { t: 11.4, caption: 'She faltered.' },
        { t: 13.2, move: { id: 'drg', x: 930, y: 470, dur: 1.6 } },
        { t: 13.4, edges: { color: 'r3', alpha: 0.55 } },
        { t: 13.6, embers: { n: 60, dur: 5 } },
        { t: 13.8, sfx: 'phase' },
        { t: 14.4, shatter: { id: 'wall' } },
        { t: 14.4, shake: { ms: 1100, power: 0.016 } },
        { t: 15.0, caption: 'It held. For a breath.' },
        { t: 19.6, flash: { color: 'k4', ms: 900 } },
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
