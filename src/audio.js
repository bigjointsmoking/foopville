// ============================================================
// AUDIO ENGINE — plays the recorded sound effects (assets/sfx.js) and
// music files (assets/music) listed in data/audio.js. Anything without a
// recording falls back to the little synthesizer at the bottom.
//   FUP.audio.sfx('hit')      play a sound effect
//   FUP.audio.music('village') start a song (keeps playing if it's already on)
//   FUP.audio.songFor(regionId, safe)  the song for a region of the world
//   FUP.audio.stopMusic()
//   FUP.audio.toggleMute()    also the M key
// Browsers only allow sound after the first click or key press, so the
// engine waits for that, then starts whatever song was asked for.
// ============================================================
window.FUP = window.FUP || {};

FUP.audio = {
  ctx: null,
  muted: false,
  song: null,         // name of the song that should be playing
  _timer: null,

  init() {
    try { this.muted = localStorage.getItem('fup_muted') === '1'; } catch (e) { /* private mode: fine */ }
    const unlock = () => this.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', e => {
      unlock();
      if ((e.key === 'm' || e.key === 'M') && !this.typing) this.toggleMute(); // not while typing your name
    });
  },

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const d = FUP.audioData;
      // A gentle compressor on everything: loud hits don't clip, quiet sounds still read
      this.comp = this.ctx.createDynamicsCompressor();
      this.comp.threshold.value = -14; this.comp.knee.value = 12; this.comp.ratio.value = 3; this.comp.attack.value = 0.003; this.comp.release.value = 0.2;
      this.comp.connect(this.ctx.destination);
      this.master = this.ctx.createGain(); this.master.connect(this.comp);
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = d.musicVolume; this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = d.sfxVolume; this.sfxBus.connect(this.master);
      this.applyMute();
      // One second of random hiss, reused for every noisy sound
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, len);
      const ch = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      this._decodeSamples();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.track && this.track.el && this.track.el.paused && !this.muted) this.track.el.play().catch(() => {});
    if (this.song && !this._timer && !this.track) this._startSong(this.song);
  },

  applyMute() {
    if (this.master) this.master.gain.value = this.muted ? 0 : FUP.audioData.masterVolume;
    if (this.track && this.track.el) this.track.el.muted = this.muted;
  },

  // ---------- Recordings ----------
  // assets/sfx.js holds base64 WAVs; turn each into a ready-to-play buffer once
  buffers: {},
  _decodeSamples() {
    const files = FUP.sfxFiles || {};
    for (const [key, b64] of Object.entries(files)) {
      try {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const done = buf => { this.buffers[key] = buf; };
        const p = this.ctx.decodeAudioData(bytes.buffer, done, () => {});
        if (p && p.catch) p.catch(() => {});
      } catch (e) { /* a broken sample: that sound uses the synth */ }
    }
  },
  _play(key, vol, pitch, t) {
    const buf = this.buffers[key];
    if (!buf) return false;
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = 1 + (pitch ? (Math.random() * 2 - 1) * pitch : 0);
    g.gain.value = vol;
    src.connect(g); g.connect(this.sfxBus);
    src.start(t);
    return true;
  },
  _pick(list) { return list[Math.floor(Math.random() * list.length)]; },

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('fup_muted', this.muted ? '1' : '0'); } catch (e) { /* fine */ }
    this.applyMute();
    if (this.onMuteChange) this.onMuteChange(this.muted);
  },

  // ---------- Sound effects ----------
  sfx(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.005;
    const rec = (FUP.audioData.samples || {})[name];
    if (rec && this._play(this._pick(rec.keys), rec.vol, rec.pitch, t)) {
      if (rec.layer) this._play(this._pick(rec.layer), rec.layerVol || 0.3, rec.pitch, t);
      return;
    }
    const d = FUP.audioData.sfx[name];
    if (!d) return;
    if (d.notes) d.notes.forEach((n, i) => this._tone(d, t + i * d.step, d.from * Math.pow(2, n / 12), null, this.sfxBus));
    else this._tone(d, t, d.from, d.to, this.sfxBus);
  },

  // One beep / hiss. `to` = slide to this pitch (null = stay put).
  _tone(d, t, from, to, bus, vol = d.vol, dur = d.dur) {
    const ctx = this.ctx, g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(bus);
    let src;
    if (d.noise) {
      src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
      f.frequency.setValueAtTime(from, t);
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      src.connect(f); f.connect(g);
    } else {
      src = ctx.createOscillator(); src.type = d.wave || 'square';
      src.frequency.setValueAtTime(from, t);
      if (to && to !== from) src.frequency.exponentialRampToValueAtTime(to, t + dur);
      src.connect(g);
    }
    src.start(t); src.stop(t + dur + 0.02);
  },

  // ---------- Music ----------
  music(name) {
    if (this.song === name && (this._timer || this.track)) return;
    this.stopMusic();
    this.song = name;
    if (this.ctx) this._startSong(name);
  },

  stopMusic() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this.song = null;
    if (this.track) this._fadeOut(this.track);
    this.track = null;
  },

  songFor(region, safe) {
    const R = FUP.audioData.regionSongs || {};
    return R[region] || (safe ? 'village' : 'edge');
  },

  // ---------- Music files ----------
  // One <audio> element per song, streamed (low memory on phones). On the play link it is routed
  // through the music volume; on a double-clicked play.html (file://) it uses the element's own volume.
  _startFile(name, i = 0) {
    const D = FUP.audioData, list = D.playlists[name], id = list[i % list.length];
    const el = new Audio();
    el.src = D.musicPath + id + D.musicExt;
    el.preload = 'auto';
    el.loop = list.length === 1;
    el.muted = this.muted;
    const tr = { el, name, i, gain: null };
    const target = D.musicVolume * D.masterVolume;
    if (location.protocol !== 'file:' && this.ctx.createMediaElementSource) {
      try {
        const node = this.ctx.createMediaElementSource(el), g = this.ctx.createGain();
        g.gain.value = 0.0001;
        node.connect(g); g.connect(this.musicBus);
        g.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + D.musicFade);
        tr.gain = g;
      } catch (e) { tr.gain = null; }
    }
    if (!tr.gain) { el.volume = 0; this._rampEl(el, target, D.musicFade); }
    el.addEventListener('ended', () => { if (this.track === tr && this.song === name) { this.track = null; this._startFile(name, i + 1); } });
    el.addEventListener('error', () => {   // file missing: play the old synth tune instead
      if (this.track !== tr) return;
      this.track = null;
      if (FUP.audioData.songs[name]) this._startSynth(name);
    });
    this.track = tr;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});   // not allowed yet: unlock() starts it on the first tap
  },
  _rampEl(el, to, secs) {
    const from = el.volume, steps = 20;
    let k = 0;
    const id = setInterval(() => { k++; try { el.volume = Math.max(0, Math.min(1, from + (to - from) * k / steps)); } catch (e) { /* iOS: volume is fixed */ } if (k >= steps) clearInterval(id); }, secs * 1000 / steps);
  },
  _fadeOut(tr) {
    const secs = FUP.audioData.musicFade;
    if (tr.gain) tr.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, secs / 4);
    else this._rampEl(tr.el, 0, secs);
    setTimeout(() => { tr.el.pause(); tr.el.removeAttribute('src'); tr.el.load(); }, secs * 1000 + 100);
  },

  // 'C4' -> Hz. Returns null for rests.
  freq(note) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(note);
    if (!m) return null;
    const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = (Number(m[3]) + 1) * 12 + semis;
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  // Turn 'E5 - . G5' into [{f, steps}] (null f = rest).
  parse(str) {
    const tokens = str.replace(/\|/g, ' ').trim().split(/\s+/);
    const out = [];
    let last = null;                       // the note a '-' keeps holding
    for (const tk of tokens) {
      if (tk === '-') { if (last) last.hold++; out.push(null); continue; }
      const ev = { note: tk, f: this.freq(tk), hold: 1 };
      out.push(ev);
      last = ev.f ? ev : null;
    }
    return out;
  },

  _startSong(name) {
    const P = FUP.audioData.playlists || {};
    if (P[name]) { this._startFile(name); return; }
    this._startSynth(name);
  },

  _startSynth(name) {
    const song = FUP.audioData.songs[name];
    if (!song) return;
    const tracks = ['lead', 'harmony', 'bass'].filter(k => song[k]).map(k => ({ ...song[k], seq: this.parse(song[k].notes) }));
    const drums = song.drums ? song.drums.notes.replace(/\|/g, ' ').trim().split(/\s+/) : [];
    const stepLen = 60 / song.bpm / 2;        // 8th notes
    const length = Math.max(drums.length, ...tracks.map(t => t.seq.length));
    let step = 0, next = this.ctx.currentTime + 0.1;

    const tick = () => {
      if (this.song !== name) return;
      while (next < this.ctx.currentTime + 0.25) {   // schedule a little ahead so timing stays tight
        const i = step % length;
        for (const tr of tracks) {
          const ev = tr.seq[i % tr.seq.length];
          if (ev && ev.f) this._tone({ wave: tr.wave }, next, ev.f, null, this.musicBus, tr.vol, stepLen * ev.hold * 0.92);
        }
        const dr = drums[i % drums.length];
        if (dr && dr !== '.') this._drum(dr, next, song.drums.vol);
        next += stepLen; step++;
      }
    };
    tick();
    this._timer = setInterval(tick, 50);
  },

  _drum(kind, t, vol) {
    if (kind === 'k') this._tone({ wave: 'sine' }, t, 150, 45, this.musicBus, vol * 1.6, 0.14);
    else if (kind === 's') this._tone({ noise: true }, t, 1800, 900, this.musicBus, vol, 0.12);
    else if (kind === 'h') this._tone({ noise: true }, t, 8000, 7000, this.musicBus, vol * 0.5, 0.04);
  },
};

FUP.audio.init();
