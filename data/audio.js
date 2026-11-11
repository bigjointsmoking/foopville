// ============================================================
// AUDIO — every sound effect and song (src/audio.js plays them).
// v0.58: real recordings. Sound effects come from Kenney + rubberduck (CC0),
// packed into assets/sfx.js by art/fupville_audio.py. Music is Kevin MacLeod
// (incompetech.com, CC BY 4.0) in assets/music/. Credits: CREDITS.md.
//
// SAMPLES (sound effect name → recordings)
//   keys:  recordings in art/sounds (one picked at random each time, so repeats don't sound robotic)
//   vol:   loudness (0-1)    pitch: random pitch wobble (0.05 = ±5%)
//   layer: more recordings played on top (a swish under a punch), layerVol = their loudness
//   A name with no entry here falls back to the synthesizer sounds further down.
//
// PLAYLISTS (song name → music files in assets/music, played in order, then looped)
// regionSongs: which song each region of the world plays (data/world.js ids).
//
// SYNTH (the old sounds, still used for anything without a recording)
// SOUND EFFECTS
//   wave:  'square' (buzzy), 'triangle' (soft), 'sine' (pure), 'sawtooth' (harsh), or noise: true (hiss/crunch)
//   from / to: pitch at the start and end, in Hz (higher = squeakier)
//   dur:   how long, in seconds        vol: how loud (0-1)
//   notes: play a little melody instead: semitones above `from`, one every `step` seconds
//
// SONGS
//   bpm = speed. Each song is 8th notes. Notes look like C4, F#5, Bb3.
//   '.' = silence, '-' = keep holding the note before it.
//   Tracks: lead, harmony (optional), bass, drums.
//   drums: k = kick, s = snare, h = hi-hat, '.' = nothing.
// ============================================================
window.FUP = window.FUP || {};

FUP.audioData = {
  masterVolume: 0.6,
  musicVolume: 0.45,
  sfxVolume: 0.8,
  musicFade: 1.2,          // seconds to fade between songs
  musicPath: 'assets/music/', musicExt: '.mp4',

  samples: {
    click:     { keys: ['ui_click', 'ui_click2'], vol: 0.45, pitch: 0.04 },
    select:    { keys: ['ui_select'], vol: 0.55 },
    error:     { keys: ['ui_error'], vol: 0.5 },
    ready:     { keys: ['ui_ready'], vol: 0.3 },
    chop:      { keys: ['chop', 'chop_2'], vol: 0.7, pitch: 0.08 },
    cast:      { keys: ['swish_1', 'swish_3'], vol: 0.45, pitch: 0.1 },
    bite:      { keys: ['ui_pluck'], vol: 0.8, layer: ['ui_drop2'], layerVol: 0.5 },
    reelTick:  { keys: ['ui_tick'], vol: 0.25, pitch: 0.06 },
    catch:     { keys: ['jingle_catch'], vol: 0.6 },
    step:      { keys: ['step_0', 'step_1', 'step_2', 'step_3', 'step_4'], vol: 0.16, pitch: 0.08 },
    pickup:    { keys: ['bag', 'bag_2'], vol: 0.6, pitch: 0.05, layer: ['gem_1'], layerVol: 0.25 },
    encounter: { keys: ['stinger'], vol: 0.6 },
    campfire:  { keys: ['fire_1'], vol: 0.6 },
    plop:      { keys: ['ui_drop', 'ui_drop2'], vol: 0.6, pitch: 0.06 },
    hoe:       { keys: ['hoe_0', 'hoe_1', 'hoe_2'], vol: 0.45, pitch: 0.06 },
    sizzle:    { keys: ['fire_3'], vol: 0.45 },
    fail:      { keys: ['jingle_fail'], vol: 0.55 },
    levelup:   { keys: ['jingle_up'], vol: 0.7 },
    fanfare:   { keys: ['jingle_fanfare'], vol: 0.65 },
    heal:      { keys: ['magic_1'], vol: 0.5 },
    hit:       { keys: ['hit_0', 'hit_1', 'hit_2', 'hit_3', 'hit_4'], vol: 0.7, pitch: 0.07, layer: ['swish_1', 'swish_2', 'swish_3'], layerVol: 0.3 },
    crit:      { keys: ['crit_0', 'crit_1', 'crit_2'], vol: 0.85, pitch: 0.05, layer: ['swish_2'], layerVol: 0.4 },
    hurt:      { keys: ['hurt_0', 'hurt_1', 'hurt_2'], vol: 0.7, pitch: 0.06 },
    guard:     { keys: ['guard_0', 'guard_1', 'guard_2'], vol: 0.6, pitch: 0.05 },
    throw:     { keys: ['swish_1', 'swish_2', 'swish_3'], vol: 0.5, pitch: 0.1 },
    splat:     { keys: ['slime_1'], vol: 0.6, pitch: 0.08 },
    poison:    { keys: ['slime_3'], vol: 0.55 },
    limit:     { keys: ['fire_5'], vol: 0.7, layer: ['jingle_hit'], layerVol: 0.45 },
    charm:     { keys: ['gem_1', 'gem_2'], vol: 0.6, layer: ['magic_2'], layerVol: 0.3 },
    boo:       { keys: ['ui_boo'], vol: 0.5 },
    flee:      { keys: ['cloth', 'cloth_2'], vol: 0.6 },
    phase:     { keys: ['roar_2'], vol: 0.7 },
    fever:     { keys: ['magic_2'], vol: 0.6, pitch: 0.2 },
    summon:    { keys: ['monster_1'], vol: 0.6, pitch: 0.1 },
    coins:     { keys: ['coins_1', 'coins_2', 'coins_3', 'coins_4'], vol: 0.55, pitch: 0.04 },
    win:       { keys: ['jingle_win'], vol: 0.65 },
    lose:      { keys: ['jingle_down'], vol: 0.65 },
    // No recording (synth below): water, eat
  },

  playlists: {
    title: ['title'], village: ['village', 'village2'], home: ['home'], campfire: ['campfire'], docks: ['docks'],
    edge: ['edge'], tollroad: ['tollroad'], deepwoods: ['deepwoods'], marsh: ['marsh'],
    battle: ['battle', 'battle2'], boss: ['boss'], raid: ['raid'],
  },
  regionSongs: { village: 'village', docks: 'docks', isle: 'docks', edge: 'edge', tollroad: 'tollroad', deepwoods: 'deepwoods', marsh: 'marsh' },

  sfx: {
    // Menus
    click:     { wave: 'square',   from: 660,  to: 520,  dur: 0.05, vol: 0.18 },
    select:    { wave: 'square',   from: 523,  dur: 0.07, vol: 0.25, notes: [0, 4, 7, 12], step: 0.06 },
    error:     { wave: 'square',   from: 180,  to: 140,  dur: 0.16, vol: 0.25 },
    ready:     { wave: 'sine',     from: 1320, to: 1320, dur: 0.12, vol: 0.22 },   // your turn bar is full

    chop:      { noise: true,      from: 900,  to: 200,  dur: 0.09, vol: 0.3 },   // sawing a plank
    // Fishing
    cast:      { wave: 'sine',     from: 700,  to: 300,  dur: 0.18, vol: 0.2 },
    bite:      { wave: 'square',   from: 880,  dur: 0.06, vol: 0.28, notes: [0, 12], step: 0.07 },
    reelTick:  { wave: 'triangle', from: 990,  to: 990,  dur: 0.03, vol: 0.1 },
    catch:     { wave: 'square',   from: 523,  dur: 0.08, vol: 0.25, notes: [0, 4, 7, 12, 16], step: 0.06 },

    // Forest
    step:      { noise: true,      from: 500,  to: 300,  dur: 0.04, vol: 0.06 },
    pickup:    { wave: 'square',   from: 880,  dur: 0.06, vol: 0.22, notes: [0, 7, 12], step: 0.05 },
    encounter: { wave: 'sawtooth', from: 220,  dur: 0.09, vol: 0.25, notes: [0, 6, 0, 6], step: 0.07 },
    campfire:  { wave: 'triangle', from: 392,  dur: 0.18, vol: 0.3,  notes: [0, 4, 7, 11, 12], step: 0.1 },

    // Cooking
    plop:      { wave: 'sine',     from: 300,  to: 620,  dur: 0.09, vol: 0.3 },
    hoe:       { noise: true,      from: 700,  to: 120,  dur: 0.14, vol: 0.35 },   // farm: chop the soil
    water:     { noise: true,      from: 3200, to: 1200, dur: 0.35, vol: 0.14 },   // farm: watering / filling the can
    sizzle:    { noise: true,      from: 6000, to: 2500, dur: 0.45, vol: 0.18 },
    fail:      { wave: 'sawtooth', from: 330,  dur: 0.16, vol: 0.22, notes: [0, -2, -5, -10], step: 0.12 },
    levelup:   { wave: 'square',   from: 523,  dur: 0.12, vol: 0.25, notes: [0, 4, 7, 12, 16, 19, 24], step: 0.07 },
    fanfare:   { wave: 'square',   from: 523,  dur: 0.22, vol: 0.28, notes: [0, 0, 0, 4, 7, 7, 12], step: 0.11 },
    eat:       { noise: true,      from: 900,  to: 400,  dur: 0.07, vol: 0.25, notes: [0, 0, 0], step: 0.11 },
    heal:      { wave: 'triangle', from: 523,  dur: 0.14, vol: 0.3,  notes: [0, 4, 7, 12], step: 0.08 },

    // Fighting
    hit:       { noise: true,      from: 1800, to: 300,  dur: 0.12, vol: 0.4 },
    crit:      { wave: 'square',   from: 1200, to: 200,  dur: 0.22, vol: 0.35 },
    hurt:      { wave: 'sawtooth', from: 300,  to: 90,   dur: 0.2,  vol: 0.35 },
    guard:     { wave: 'triangle', from: 220,  to: 440,  dur: 0.15, vol: 0.3 },
    throw:     { noise: true,      from: 800,  to: 3000, dur: 0.2,  vol: 0.18 },
    splat:     { noise: true,      from: 1200, to: 150,  dur: 0.18, vol: 0.4 },
    poison:    { wave: 'sine',     from: 180,  to: 120,  dur: 0.25, vol: 0.3 },
    limit:     { wave: 'sawtooth', from: 110,  to: 880,  dur: 0.4,  vol: 0.35 },
    charm:     { wave: 'sine',     from: 784,  dur: 0.12, vol: 0.3,  notes: [0, 4, 7, 4, 12], step: 0.08 },
    boo:       { wave: 'sawtooth', from: 200,  to: 120,  dur: 0.35, vol: 0.28 },
    flee:      { noise: true,      from: 400,  to: 2500, dur: 0.3,  vol: 0.2 },
    phase:     { wave: 'sawtooth', from: 110,  dur: 0.25, vol: 0.32, notes: [0, 1, 0, 1, 6], step: 0.12 },
    fever:     { wave: 'sine',     from: 440,  dur: 0.16, vol: 0.3,  notes: [0, 5, 2, 9, -3, 7, 1], step: 0.09 },
    summon:    { wave: 'triangle', from: 196,  dur: 0.12, vol: 0.3,  notes: [0, 12, 7], step: 0.08 },
    coins:     { wave: 'square',   from: 1568, dur: 0.06, vol: 0.2,  notes: [0, 5, 0, 5], step: 0.06 },
    win:       { wave: 'square',   from: 523,  dur: 0.16, vol: 0.28, notes: [0, 4, 7, 12, 7, 12], step: 0.1 },
    lose:      { wave: 'triangle', from: 392,  dur: 0.4,  vol: 0.32, notes: [0, -1, -2, -5], step: 0.35 },
  },

  songs: {

    // Title screen: heroic march. Dm - Bb - F - C - Dm - Bb - C - A, then Gm - Dm - Bb - F - Gm - A - Dm
    title: {
      bpm: 96,
      lead: { wave: 'square', vol: 0.2, notes:
        'D5 - - A4 D5 - F5 - | F5 - E5 D5 C5 - D5 - | A4 - - F4 A4 - C5 - | C5 - D5 E5 G5 - - - | A5 - - G5 F5 - E5 F5 | D5 - - C5 Bb4 - D5 - | E5 - - D5 C5 - E5 G5 | A5 - - - C#5 - E5 - |' +
        'G5 - - F5 D5 - Bb4 - | A4 - D5 - F5 - A5 - | Bb5 - A5 - G5 - F5 - | A5 - G5 F5 C5 - - - | Bb4 - D5 - G5 - Bb5 - | A5 - G5 - E5 - C#5 - | D5 - - - A5 - - - | D6 - - - - . . .' },
      harmony: { wave: 'triangle', vol: 0.32, notes:
        'F4 - - - A4 - - - | F4 - - - D4 - - - | A4 - - - C5 - - - | G4 - - - E4 - - - | F4 - - - A4 - - - | D4 - - - F4 - - - | E4 - - - G4 - - - | E4 - - - C#4 - - - |' +
        'D4 - - - Bb3 - - - | F4 - - - D4 - - - | D4 - - - F4 - - - | C4 - - - A3 - - - | Bb3 - - - D4 - - - | C#4 - - - E4 - - - | F4 - - - A4 - - - | D4 - - - - . . .' },
      bass: { wave: 'triangle', vol: 0.62, notes:
        'D2 . D2 D3 D2 . D3 D2 | Bb1 . Bb1 Bb2 Bb1 . Bb2 Bb1 | F2 . F2 F3 F2 . F3 F2 | C2 . C2 C3 C2 . C3 C2 | D2 . D2 D3 D2 . D3 D2 | Bb1 . Bb1 Bb2 Bb1 . Bb2 Bb1 | C2 . C2 C3 C2 . C3 C2 | A1 . A1 A2 A1 . A2 A1 |' +
        'G1 . G1 G2 G1 . G2 G1 | D2 . D2 D3 D2 . D3 D2 | Bb1 . Bb1 Bb2 Bb1 . Bb2 Bb1 | F2 . F2 F3 F2 . F3 F2 | G1 . G1 G2 G1 . G2 G1 | A1 . A1 A2 A1 . A2 A1 | D2 . D2 D3 D2 . D3 D2 | D2 - - - - . . .' },
      drums: { vol: 0.4, notes: 'k . k s k . k s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k k s s k s s s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k . k s k . k s | k . . . . . . .' },
    },
    // Camp: slow and cosy. C - Am - F - G
    camp: {
      bpm: 84,
      lead: { wave: 'triangle', vol: 0.5, notes:
        'E5 - - . G5 - E5 . | C5 - - . E5 - C5 . | A4 - - . C5 - A4 . | B4 - - . D5 - - . |' +
        'E5 - D5 . C5 - E5 . | A4 - C5 . E5 - D5 . | C5 - A4 . F4 - A4 . | G4 - - - - . . .' },
      bass: { wave: 'triangle', vol: 0.55, notes:
        'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . |' +
        'C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . B2 .' },
      drums: { vol: 0.25, notes: '. . h . . . h . | . . h . . . h . | . . h . . . h . | . . h . . . h .' },
    },

    // Forest: wandering, a bit mysterious. Am - F - C - G
    forest: {
      bpm: 100,
      lead: { wave: 'square', vol: 0.22, notes:
        'A4 . C5 . E5 . D5 C5 | A4 - - . F4 . A4 . | G4 . C5 . E5 . G5 E5 | D5 - - . B4 . G4 . |' +
        'E5 . D5 . C5 . B4 A4 | C5 - - . A4 . F4 . | E4 . G4 . C5 . E5 D5 | B4 - - - - . . .' },
      bass: { wave: 'triangle', vol: 0.6, notes:
        'A2 . A3 . A2 . A3 . | F2 . F3 . F2 . F3 . | C3 . C4 . C3 . C4 . | G2 . G3 . G2 . G3 . |' +
        'A2 . A3 . A2 . A3 . | F2 . F3 . F2 . F3 . | C3 . C4 . C3 . C4 . | G2 . G3 . G2 . B2 .' },
      drums: { vol: 0.35, notes: 'k . h . . . h . | k . h . . . h h | k . h . . . h . | k . h . s . h .' },
    },

    // Regular fights: driving. Em - C - D - B
    battle: {
      bpm: 140,
      lead: { wave: 'square', vol: 0.24, notes:
        'E5 . E5 G5 . E5 B4 . | C5 . C5 E5 . G5 E5 . | D5 . D5 F#5 . A5 F#5 . | D#5 . F#5 . B5 - A5 F#5 |' +
        'G5 . F#5 E5 . B4 . E5 | E5 . D5 C5 . G4 . C5 | D5 . E5 F#5 . A5 . D5 | B4 - - - D#5 - F#5 -' },
      bass: { wave: 'triangle', vol: 0.7, notes:
        'E2 E2 E3 E2 E2 E3 E2 E3 | C2 C2 C3 C2 C2 C3 C2 C3 | D2 D2 D3 D2 D2 D3 D2 D3 | B1 B1 B2 B1 B1 B2 B1 B2 |' +
        'E2 E2 E3 E2 E2 E3 E2 E3 | C2 C2 C3 C2 C2 C3 C2 C3 | D2 D2 D3 D2 D2 D3 D2 D3 | B1 B1 B2 B1 B1 B2 B1 B2' },
      drums: { vol: 0.45, notes: 'k h s h k k s h | k h s h k k s h | k h s h k k s h | k h s h k s s s' },
    },

    // The Mushroom Landlord: ominous and fast. Dm - Bb - Gm - A
    boss: {
      bpm: 150,
      lead: { wave: 'sawtooth', vol: 0.15, notes:
        'D5 . F5 . A5 . G#5 A5 | Bb4 . D5 . F5 . E5 D5 | G4 . Bb4 . D5 . C#5 D5 | A4 . C#5 . E5 . A5 G5 |' +
        'F5 . E5 . D5 . A4 . | F5 . G5 . A5 . Bb5 . | G5 . F5 . E5 . D5 . | C#5 - E5 - A5 - - .' },
      bass: { wave: 'square', vol: 0.35, notes:
        'D2 D3 D2 D3 D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | G1 G2 G1 G2 G1 G2 G1 G2 | A1 A2 A1 A2 A1 A2 A1 A2 |' +
        'D2 D3 D2 D3 D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | G1 G2 G1 G2 G1 G2 G1 G2 | A1 A2 A1 A2 A1 A2 A1 A2' },
      drums: { vol: 0.5, notes: 'k h k s k h k s | k h k s k h k s | k h k s k h k s | k s k s k s s s' },
    },
  },
};
