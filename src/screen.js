// ============================================================
// SCREEN — makes the game fill phones and tablets.
// The page styles (index.html) drop the margins on touch screens; this file adds:
// - a "turn it sideways" card when a phone or tablet is held upright (tap it to play anyway)
// - a full-screen button where the browser allows it (iPad, Android; iPhone Safari doesn't)
// - no pinch / double-tap zoom, and a re-fit after the device turns.
// ============================================================
(function () {
  const doc = document, el = doc.documentElement;
  const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!touch) return;   // computers keep the framed look

  // Pinch-zoom on iOS (gesture events) would zoom the whole page, not the game.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(n => doc.addEventListener(n, e => e.preventDefault(), { passive: false }));
  // (Double-tap zoom is stopped by touch-action in the page styles.)

  function ready(fn) { if (doc.body) fn(); else doc.addEventListener('DOMContentLoaded', fn); }

  ready(() => {
    doc.body.classList.add('touch');

    // Upright warning: shown by CSS in portrait; one tap hides it for this visit.
    const turn = doc.createElement('div');
    turn.id = 'turn';
    turn.innerHTML = '<div class="turn-icon">&#128241;&#8635;</div><div>Turn your screen sideways</div><small>Foopville is built for landscape. Tap to play like this anyway.</small>';
    turn.addEventListener('click', () => doc.body.classList.add('upright-ok'));
    doc.body.appendChild(turn);

    // Full-screen button, only where the browser supports it.
    const canFull = doc.fullscreenEnabled || doc.webkitFullscreenEnabled;
    if (canFull) {
      const btn = doc.createElement('button');
      btn.id = 'fs';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Full screen');
      btn.textContent = '⛶';   // the "full screen" corners symbol
      btn.addEventListener('click', () => {
        const go = el.requestFullscreen || el.webkitRequestFullscreen;
        if (!go) return;
        const p = go.call(el);
        const lock = () => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (err) {} };
        if (p && p.then) p.then(lock, () => {}); else lock();
      });
      doc.body.appendChild(btn);
      const sync = () => doc.body.classList.toggle('is-full', !!(doc.fullscreenElement || doc.webkitFullscreenElement));
      doc.addEventListener('fullscreenchange', sync);
      doc.addEventListener('webkitfullscreenchange', sync);
      // Only on the title screen: in play that corner holds the HP bar.
      setInterval(() => {
        const g = FUP.game, onTitle = !!(g && g.scene && g.scene.isActive('Start'));
        doc.body.classList.toggle('on-title', onTitle);
      }, 400);
    }
  });

  // iOS sometimes reports the old size right after turning: fit the game again a moment later.
  function refit() {
    [50, 300, 700].forEach(ms => setTimeout(() => { if (FUP.game && FUP.game.scale) FUP.game.scale.refresh(); }, ms));
  }
  window.addEventListener('orientationchange', refit);
  window.addEventListener('resize', refit);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', refit);
})();
