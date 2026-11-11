// ============================================================
// CHARACTER CREATOR — name and looks, then pick your weapon.
// The name goes on the save (and later on the Hall of the Dead).
// Choices come from data/looks.js.
// ============================================================
class CreateScene extends Phaser.Scene {
  constructor() { super('Create'); }

  create() {
    const L = FUP.looksData;
    this.look = { ...L.default };
    this.name = '';
    this.step = 'looks';
    this.nameInput = null;
    this.started = false;   // reset: this screen is reused for every new life
    this.mode = FUP.runData.defaultMode;   // Normal or Hardcore (picked on the weapon step, locked for life)
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, FUP.ui.colors.sky).setOrigin(0);
    FUP.ui.muteButton(this, this.scale.width - 30, 30);

    // Typing your name (keyboard). Backspace deletes. Listens to the page directly
    // so fast typing never doubles letters.
    const onKey = e => {
      if (this.step !== 'looks' || this.nameInput) return;
      if (e.key === 'Backspace') { e.preventDefault(); this.name = this.name.slice(0, -1); this.drawName(); return; }
      if (e.key === 'Enter') { this.next(); return; }
      if (e.key.length === 1 && /[A-Za-z0-9 '\-]/.test(e.key) && this.name.length < L.nameMax) {
        if (e.key === ' ' && (!this.name || this.name.endsWith(' '))) return;
        this.name += e.key; this.drawName();
      }
    };
    window.addEventListener('keydown', onKey);
    FUP.audio.typing = true;
    this.events.once('shutdown', () => { FUP.audio.typing = false; window.removeEventListener('keydown', onKey); this.closeNameBox(); });
    this.drawLooks();
  }

  // ---------- Step 1: name + looks ----------
  drawLooks() {
    const ui = FUP.ui, c = ui.colors, L = FUP.looksData, W = this.scale.width;
    if (this.group) this.group.destroy(true);
    const g = this.group = this.add.group();
    const add = o => { g.add(o); return o; };
    const btn = (x, y, w, h, label, fn, opts) => { const b = ui.button(this, x, y, w, h, label, fn, opts); g.addMultiple([b.rect, b.txt]); return b; };

    add(ui.text(this, W / 2, 26, 'WHO ARE YOU?', 30, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0));
    add(ui.text(this, W / 2, 64, 'Nobody will remember. But let\'s pretend.', 15, c.dim, { fontStyle: 'italic' }).setOrigin(0.5, 0));

    // Preview: big hero (fights) and small hero (map)
    FUP.looks.apply(this, this.look);
    add(FUP.ui.panel(this, 40, 100, 280, 380, 'panel'));
    add(ui.sprite(this, 180, 270, 'hero_me', '🧍', 100, 4.5));
    add(ui.sprite(this, 180, 440, 'hero_map_me', '🧍', 30, 2.5));
    add(ui.text(this, 180, 470, 'on the map', 11, c.dim).setOrigin(0.5, 1));

    // Name
    const X = 350;
    add(ui.text(this, X, 104, FUP.ui.isTouch(this) ? 'NAME (tap the box)' : 'NAME (type it or click the box)', 13, c.dim, { fontStyle: '700' }));
    const box = add(FUP.ui.panel(this, X, 124, 330, 40, 'inset'));
    // Tap/click the box to type with a pop-up (phones have no keyboard otherwise)
    box.setInteractive({ useHandCursor: true }).on('pointerup', () => this.askName());
    this.nameText = add(ui.text(this, X + 12, 144, '', 22, c.ink, { fontStyle: '700' }).setOrigin(0, 0.5));
    btn(X + 340, 124, 170, 40, '🎲 Random name', () => { this.name = Phaser.Utils.Array.GetRandom(L.randomNames); this.drawName(); }, { size: 15 });
    this.drawName();

    // Hairstyle: ◀ name ▶
    const styleIdx = L.hairstyles.findIndex(h => h.id === this.look.hairstyle);
    const turn = d => { this.look.hairstyle = L.hairstyles[(styleIdx + d + L.hairstyles.length) % L.hairstyles.length].id; this.drawLooks(); };
    add(ui.text(this, X, 186, 'HAIRSTYLE', 13, c.dim, { fontStyle: '700' }));
    btn(X, 206, 40, 34, '◀', () => turn(-1), { size: 16 });
    add(ui.text(this, X + 145, 223, L.hairstyles[styleIdx].name, 18, c.ink, { fontStyle: '700' }).setOrigin(0.5));
    btn(X + 250, 206, 40, 34, '▶', () => turn(1), { size: 16 });

    // Colour swatches
    const rows = [['SKIN', 'skin'], ['HAIR', 'hair'], ['OUTFIT', 'outfit'], ['SCARF', 'scarf']];
    rows.forEach(([label, key], r) => {
      const y = 258 + r * 58;
      add(ui.text(this, X, y, label, 13, c.dim, { fontStyle: '700' }));
      L[key].forEach((hex, i) => {
        const col = Phaser.Display.Color.HexStringToColor(hex).color, on = this.look[key] === hex;
        const sw = add(this.add.rectangle(X + 18 + i * 44, y + 34, 36, 30, col).setStrokeStyle(on ? 4 : 2, on ? c.select : FUP.look.num('k0')));
        sw.setInteractive({ useHandCursor: true });
        sw.on('pointerdown', () => { FUP.audio.sfx('click'); this.look[key] = hex; this.time.delayedCall(1, () => this.drawLooks()); });
      });
    });

    btn(X + 340, 206, 170, 34, '🎲 Random look', () => {
      const pick = a => Phaser.Utils.Array.GetRandom(a);
      this.look = { hairstyle: pick(L.hairstyles).id, skin: pick(L.skin), hair: pick(L.hair), outfit: pick(L.outfit), scarf: pick(L.scarf) };
      this.drawLooks();
    }, { size: 15 });

    btn(W - 300, 520, 260, 50, 'Next: choose your weapon ▶', () => this.next(), { hot: true, size: 19 });
    btn(40, 520, 140, 50, '◀ Back', () => this.scene.start('Start'), { size: 17 });
  }

  // A real text box laid over the name box (brings up the iPhone keyboard).
  // Keeps only allowed letters. Enter or tapping away finishes.
  askName() {
    if (this.step !== 'looks' || this.nameInput) return;
    const L = FUP.looksData, r = this.game.canvas.getBoundingClientRect(), k = r.width / this.scale.width;
    const inp = this.nameInput = document.createElement('input');
    inp.type = 'text'; inp.id = 'hero-name'; inp.value = this.name; inp.maxLength = L.nameMax;
    inp.autocomplete = 'off'; inp.setAttribute('autocapitalize', 'words'); inp.spellcheck = false;
    Object.assign(inp.style, {
      position: 'fixed', left: (r.left + 350 * k) + 'px', top: (r.top + 124 * k) + 'px',
      width: (330 * k) + 'px', height: (40 * k) + 'px', boxSizing: 'border-box', padding: '0 ' + (10 * k) + 'px',
      font: '700 ' + Math.max(16, 22 * k) + 'px "Pixelify Sans", "Trebuchet MS", sans-serif',   // 16px+ stops iPhone zooming in
      color: FUP.ui.colors.ink, background: FUP.look.hex('k1'), border: '3px solid ' + FUP.look.hex('y1'), borderRadius: '0', outline: 'none', zIndex: 10,
    });
    const clean = v => v.replace(/[^A-Za-z0-9 '\-]/g, '').replace(/\s+/g, ' ').trimStart().slice(0, L.nameMax);
    inp.addEventListener('input', () => { this.name = clean(inp.value); this.drawName(); });
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
    inp.addEventListener('blur', () => this.closeNameBox());
    document.body.appendChild(inp);
    this.nameText.setVisible(false);
    this.closeOnTap = () => this.closeNameBox();   // tapping anywhere on the game also finishes
    this.input.once('pointerdown', this.closeOnTap);
    inp.focus();
  }

  closeNameBox() {
    if (!this.nameInput) return;
    const inp = this.nameInput;
    this.nameInput = null;
    this.input.off('pointerdown', this.closeOnTap);
    inp.remove();
    if (this.nameText && this.nameText.active) { this.nameText.setVisible(true); this.drawName(); }
  }

  drawName() {
    const blink = this.name.length < FUP.looksData.nameMax ? '_' : '';
    this.nameText.setText((this.name || '') + blink);
  }

  next() {
    this.name = this.name.trim();
    if (!this.name) { this.name = Phaser.Utils.Array.GetRandom(FUP.looksData.randomNames); this.drawName(); }
    FUP.audio.sfx('select');
    this.step = 'weapon';
    FUP.audio.typing = false;
    this.drawWeapons();
  }

  // ---------- Step 2: weapon ----------
  drawWeapons() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width;
    if (this.group) this.group.destroy(true);
    const g = this.group = this.add.group();
    const add = o => { g.add(o); return o; };

    add(ui.text(this, W / 2, 40, `${this.name}, CHOOSE YOUR BEGINNER WEAPON`, 28, c.accent, { fontStyle: '700' }).setOrigin(0.5));
    add(ui.text(this, W / 2, 84, Phaser.Utils.Array.GetRandom(FUP.narrator.pickWeapon), 18, c.ink, { fontStyle: 'italic' }).setOrigin(0.5));
    add(ui.text(this, W / 2, 110, 'Pick one of these 3. You keep it for your whole life (the Blacksmith can upgrade it).', 14, c.dim).setOrigin(0.5));

    // Game mode: Normal or Hardcore, locked for life (Refinement Phase 1)
    const modes = Object.keys(FUP.runData.modes);
    modes.forEach((id, i) => {
      const M = FUP.runData.modes[id], on = this.mode === id;
      const b = ui.button(this, W / 2 - 205 + i * 210, 412, 200, 38, `${on ? '✔ ' : ''}${M.emoji} ${M.name}`, () => {
        if (this.mode === id) return;
        this.mode = id;
        this.time.delayedCall(1, () => { this.drawWeapons(); this.modeLine.setText(FUP.narrator[id === 'hardcore' ? 'modePickHardcore' : 'modePickNormal'][0]); });
      }, { hot: on, size: 17 });
      g.addMultiple([b.rect, b.txt]);
    });
    const M = FUP.runData.modes[this.mode];
    add(ui.text(this, W / 2, 458, M.blurb + '\nYou can\'t change this later.', 13, this.mode === 'hardcore' ? c.bad : c.ink, { align: 'center', lineSpacing: 3, wordWrap: { width: 520 } }).setOrigin(0.5, 0));
    this.modeLine = add(ui.text(this, W / 2, 545, '', 14, c.dim, { fontStyle: 'italic' }).setOrigin(0.5));

    const keys = Object.keys(FUP.weapons);
    const cardW = 250, cardH = 260, gap = 24;
    const startX = (W - (keys.length * cardW + (keys.length - 1) * gap)) / 2;
    keys.forEach((key, i) => {
      const wpn = FUP.weapons[key];
      const x = startX + i * (cardW + gap), y = 132;
      const card = add(FUP.ui.panel(this, x, y, cardW, cardH, 'panel'));
      add(ui.sprite(this, x + cardW / 2 - 24, y + 52, 'hero_me', '🧍', 40, 1.4));
      add(ui.sprite(this, x + cardW / 2 + 20, y + 60, wpn.sprite, wpn.emoji, 40, 2.4));
      add(ui.text(this, x + cardW / 2, y + 108, wpn.name, 24, c.accent, { fontStyle: '700' }).setOrigin(0.5));
      add(ui.text(this, x + 16, y + 132, wpn.style, 15, c.ink, { wordWrap: { width: cardW - 32 }, lineSpacing: 3 }));
      add(ui.text(this, x + 16, y + 200, 'Special: ' + wpn.special.name, 15, c.info, { fontStyle: '700' }));
      add(ui.text(this, x + 16, y + 220, wpn.special.desc, 14, c.dim, { wordWrap: { width: cardW - 32 } }));
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.restyle('panel', c.select));
      card.on('pointerout', () => card.restyle('panel'));
      card.on('pointerdown', () => this.begin(key));
    });

    const back = ui.button(this, 40, 520, 140, 50, '◀ Back', () => { this.step = 'looks'; FUP.audio.typing = true; this.drawLooks(); }, { size: 17 });
    g.addMultiple([back.rect, back.txt]);
  }

  begin(weaponKey) {
    if (this.started) return;
    this.started = true;
    FUP.audio.sfx('select');
    FUP.run.newLife(weaponKey, { name: this.name, look: { ...this.look }, mode: this.mode });  // fresh bag, levels wiped
    FUP.save.write();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => this.scene.start('Village', { fresh: true }));
  }
}
