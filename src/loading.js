// ============================================================
// LOADING — the bar you see while the game downloads (~4.5 MB of pictures
// and sounds) before the title screen. Loaded first, before the engine.
// The big files load one after another, so this watches for each one to
// arrive and moves the bar; between steps it creeps so it never looks frozen.
// BootScene then reports the pictures being unpacked (80% -> 100%) and hides it.
// (Colours come from the page styles: data/look.js isn't loaded yet.)
// ============================================================
(function () {
  // Each step: what has arrived, where the bar jumps to, what it says next.
  const steps = [
    { ready: () => window.Phaser, at: 12, text: 'Painting the pictures\u2026' },
    { ready: () => window.FUP && FUP.sprites, at: 55, text: 'Tuning the sounds\u2026' },
    { ready: () => window.FUP && FUP.sfxFiles, at: 70, text: 'Building the village\u2026' },
    { ready: () => window.FUP && FUP.game, at: 80, text: 'Unpacking the pictures\u2026' },
  ];
  let shown = 3, target = 12, step = 0, box, bar, label, timer;

  function make() {
    box = document.createElement('div');
    box.id = 'loading';
    box.innerHTML = '<div class="ld-title">FOOPVILLE</div>' +
      '<div class="ld-track"><div class="ld-fill"></div></div>' +
      '<div class="ld-text">Waking up the engine\u2026</div>';
    document.body.appendChild(box);
    bar = box.querySelector('.ld-fill');
    label = box.querySelector('.ld-text');
  }

  function draw() { if (bar) bar.style.width = shown.toFixed(1) + '%'; }

  function tick() {
    while (step < steps.length && steps[step].ready()) {
      shown = Math.max(shown, steps[step].at);
      label.textContent = steps[step].text;
      step++;
      target = step < steps.length ? steps[step].at : 99;
    }
    // Creep toward the next step, slowing down as it gets close (never reaches it).
    if (step < steps.length) shown += (target - 1 - shown) * 0.008;
    draw();
  }

  window.FUP = window.FUP || {};
  FUP.loading = {
    // BootScene: done of total pictures unpacked.
    pictures(done, total) {
      if (!box || !total) return;
      shown = Math.max(shown, 80 + 20 * done / total);
      draw();
    },
    // BootScene, once the title screen is about to open.
    done() {
      clearInterval(timer);
      if (!box) return;
      shown = 100; draw();
      const b = box; box = null;
      b.classList.add('ld-gone');
      setTimeout(() => b.remove(), 400);
    },
  };

  // The page body exists already: this file is loaded right after <div id="game">.
  make();
  draw();
  timer = setInterval(tick, 100);
})();
