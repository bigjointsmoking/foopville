// ============================================================
// MAIN — starts the game. Lists every screen (scene) the game has.
// ============================================================
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 900,
  height: 600,
  backgroundColor: FUP.look.hex(FUP.look.screen.sky),
  input: { activePointers: 3 },   // joystick + action button at the same time on phones
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, StartScene, CreateScene, VillageScene, HouseScene, BattleScene, CookScene, WorldScene, RaidScene],
};

// Wait for the pixel font to load so text doesn't flash in the wrong font.
// (FUP.game lets tests and the browser console reach the running game.)
// Fish traps fill up on play time, like the food stall (src/systems/fishing.js tickTraps)
FUP.clock.every(1, 'traps', () => FUP.fishing.tickTraps(1));

function boot() {
  FUP.game = new Phaser.Game(config);
  FUP.fx.installTransitions(FUP.game);   // fades between screens (src/fx.js)
  // The farm runs on the real clock (data/garden.js), so it grows on every screen
  // and while the game is closed. Checked 4 times a second.
  setInterval(() => FUP.garden.tick(), 250);
  // Normal mode's grave timer: play time only, so it skips while the page is hidden or closed.
  let last = Date.now();
  setInterval(() => {
    const now = Date.now(), dt = Math.min(1, (now - last) / 1000);
    last = now;
    if (!document.hidden && FUP.grave.tick(dt)) FUP.grave.crumbled = true;   // the screen you're on tells you
    // The day clock (data/clock.js): play time only, and not on the title or the character creator
    const still = FUP.clockData.noClockScenes, on = FUP.game.scene.getScenes(true).map(s => s.scene.key);
    if (!document.hidden && on.length && !on.some(k => still.includes(k))) FUP.clock.tick(dt);
  }, 250);
}
try {
  document.fonts.load('20px "Pixelify Sans"').then(boot, boot);
} catch (err) {
  boot();
}
