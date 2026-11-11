// ============================================================
// COSMETICS RULES — owning and wearing hats, using titles (phase G2).
// Numbers and names in data/cosmetics.js.
//   own(id) / has(id)         get a hat / do you have it
//   buy(id)                   'ok' | 'owned' | 'broke' (the Shopkeeper, Rizz discount applies)
//   wear('hat' | 'title', id) id = null takes it off
//   titles()                  ids of titles you've unlocked
//   nameLine()                "Pib the Evicted"
//   attachHat(scene, sprite, mode)  draws the worn hat on a hero sprite ('map' or 'battle')
// ============================================================
window.FUP = window.FUP || {};

FUP.cosmetics = {
  state: { owned: [], hat: null, title: null },
  reset() { this.state = { owned: [], hat: null, title: null }; },

  has(id) { return this.state.owned.includes(id); },
  own(id) { if (FUP.cosmeticData.hats[id] && !this.has(id)) this.state.owned.push(id); },
  price(id) { const h = FUP.cosmeticData.hats[id]; return h && h.price ? FUP.req.coinPrice({ coins: h.price }, { npc: 'shop' }) : 0; },
  buy(id) {
    const h = FUP.cosmeticData.hats[id];
    if (!h || !h.price) return 'owned';
    if (this.has(id)) return 'owned';
    if (!FUP.req.pay({ coins: h.price }, { npc: 'shop' })) return 'broke';
    this.own(id);
    return 'ok';
  },
  wear(slot, id) {
    if (slot === 'hat') this.state.hat = id && this.has(id) ? id : null;
    if (slot === 'title') this.state.title = id && this.titles().includes(id) ? id : null;
  },
  titles() { return Object.keys(FUP.cosmeticData.titles).filter(id => FUP.req.met(FUP.cosmeticData.titles[id].req)); },
  titleText() { const t = this.state.title && FUP.cosmeticData.titles[this.state.title]; return t ? t.text : ''; },
  nameLine(name) {
    const n = name || ((FUP.run.hero || {}).name) || 'Nameless', t = this.titleText();
    return t ? `${n} ${t}` : n;
  },

  // The worn hat follows the hero sprite every frame. Call from create() (screens are reused).
  attachHat(scene, sprite, mode = 'map') {
    const id = this.state.hat, h = id && FUP.cosmeticData.hats[id];
    if (!h || !sprite) return null;
    const D = FUP.cosmeticData, off = D.hatOffset[mode], size = D.hatSize[mode];
    const hat = scene.add.text(sprite.x, sprite.y + off, h.emoji, { fontSize: size + 'px' }).setOrigin(0.5, 0.8);
    const follow = () => {
      if (!hat.active || !sprite.active) return;
      hat.setPosition(sprite.x, sprite.y + off).setDepth((sprite.depth || 0) + 1).setVisible(sprite.visible).setAlpha(sprite.alpha);
      hat.setScale(sprite.flipX ? -1 : 1, 1);
    };
    follow();
    scene.events.on('postupdate', follow);
    scene.events.once('shutdown', () => { scene.events.off('postupdate', follow); if (hat.active) hat.destroy(); });
    return hat;
  },
};
