// ============================================================
// CAMP — cook what's in your bag. Two versions of this screen:
//   'home'     = your house in the village. Cook and change gear, then
//                head back out to the village. Saves after every change.
//   'campfire' = a campfire in one of the 3 Forest areas. Cook, Rest once
//                per campfire (+30% HP), change gear, go back into the Forest
//                or head home. The Landlord is no longer here: he's at the
//                bottom of a hidden hole in the Deep Woods (WorldScene).
//                The run timer keeps going here.
// Every dish you cook goes into your satchel for the next fight.
// Every ingredient you use is gone. The Forest refills the bag.
//
// The screen is drawn in "groups" (header, pantry, pot, result, book).
// When something changes, we wipe one group and redraw it.
// ============================================================
class CookScene extends Phaser.Scene {
  constructor() { super('Cook'); }

  init(data) { this.mode = data.mode || 'home'; }

  create() {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height;

    this.picked = [];        // ingredient ids currently in the pot
    this.method = 'grill';   // selected cooking method
    this.result = null;      // the last dish you cooked
    this.showBook = false;
    this.bookPage = undefined;  // recipe book page (opens near your level)
    this.leaving = false;    // true once you've clicked the big button
    this.pack = null;        // backpack screen (reset: Phaser reuses this screen)
    this.choice = null;      // the campfire's "where to?" box
    this.card = null; this.closingCard = false; this.tip = null; this.hiddenDish = null; // dish reveal card + hover tip
    const fire = this.mode === 'campfire' || this.mode === 'isle';   // 'isle' = the campfire on Orientation Isle (v0.62): no Rest, no trip

    this.add.rectangle(0, 0, W, H, c.sky).setOrigin(0);
    FUP.ui.sprite(this, W - 60, H - 90, 'campfire', '🔥', 40).setAlpha(0.25);

    // Narrator box (same style as the battle screen)
    FUP.ui.panel(this, 16, 12, W - 32, 52, 'panel');
    this.narratorText = ui.text(this, 34, 38, '', 16, c.ink, { fontStyle: 'italic', wordWrap: { width: W - 350 } }).setOrigin(0, 0.5);

    // Campfire extras: the run timer and the Rest button
    if (this.mode === 'campfire') {
      this.timerText = ui.text(this, W - 222, 38, '', 18, c.accent, { fontStyle: '700' }).setOrigin(1, 0.5);
      this.restBtn = ui.button(this, W - 168, 20, 144, 36, `😴 Rest +${Math.round(FUP.forestData.restHealPercent * 100)}%`, () => this.rest(), { size: 15 });
      this.restBtn.setEnabled(!this.campArea().rested);
    }
    // Your bed (v0.41, every house): Sleep at home = full heal.
    if (!fire && FUP.house.canNap()) {
      // Early in the day it's a nap (full heal). In the second half it's Sleep until morning: full heal + a new day.
      this.napBtn = ui.button(this, W - 208, 20, 184, 36, '', () => this.nap(), { size: 13 });
      this.refreshNap();
      this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshNap() });
    }

    // (The garden menu is gone: farming happens on the village map now, see data/garden.js.)
    ui.muteButton(this, W - 196, 38);
    this.bagTitle = ui.text(this, 20, 75, '', 16, c.accent, { fontStyle: '700' });
    // Pantry (bought from the Carpenter): store ingredients at home
    this.pantryPanel = null;
    if (!fire && FUP.house.pantryMax() > 0) ui.button(this, 200, 66, 112, 30, '🗄️ Pantry', () => this.openPantry(), { size: 14 });
    // Gear: change what you wear. Buying and selling happen in the village.
    // Backpack (v0.41): everything you carry, your gear, and storage at home
    ui.button(this, 318, 66, 84, 30, '🎒 Pack', () => this.openPack(), { size: 14 });
    this.input.keyboard.on('keydown-I', () => this.openPack());
    FUP.progressUi.guideButton(this, 406, 66, 80, 30, { skill: 'cooking', size: 14, canOpen: () => !this.guide, onOpen: g => { this.guide = g; }, onClose: () => { this.guide = null; } });
    this.guide = null;
    // Decorate your room (v0.57, src/roomUi.js): home only, rebuilt every time it opens
    this.decor = null;
    if (!fire) ui.button(this, 490, 66, 116, 30, '🛋️ Decorate', () => { if (!this.decor) this.decor = FUP.roomUi.open(this, () => { this.decor = null; }); }, { size: 14 });
    FUP.progressUi.attach(this);
    this.gearPanel = null; this.gearTab = 'shop';

    this.groups = {};
    for (const name of ['header', 'pantry', 'pot', 'result', 'satchel', 'book']) this.groups[name] = this.add.group();

    this.drawBottomButtons();
    this.refreshAll();
    FUP.audio.music(fire ? 'campfire' : 'home');
    if (fire) this.say('campfireArrive');
    else this.say(FUP.run.runs === 0 ? 'campFirst' : 'campReturn');
    // At home, every change is saved (closing the page keeps your dishes).
    if (this.mode !== 'campfire') this.events.on('postupdate', () => { if (this.dirty) { this.dirty = false; FUP.save.write(); } });
  }

  // The run timer keeps ticking at the campfire (score = fastest run).
  update(time, delta) {
    if (this.mode !== 'campfire' || !FUP.run.forest || this.leaving) return;
    const f = FUP.run.forest;
    f.time += Math.min(delta, 100) / 1000;
    const s = Math.floor(f.time);
    this.timerText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
  }

  // The Forest area this campfire is in (each campfire has its own Rest).
  campArea() { const f = FUP.run.forest; return f.areas[f.area]; }

  // Campfire Rest: heal 30% of max HP, once per campfire per trip.
  rest() {
    const f = FUP.run.forest;
    if (!f || this.campArea().rested) return;
    this.campArea().rested = true;
    const max = FUP.run.maxHp();
    FUP.run.hp = Math.min(max, FUP.run.currentHp() + Math.round(max * FUP.forestData.restHealPercent));
    this.restBtn.setEnabled(false);
    this.renderSatchel();
    this.say('campfireRest');
    FUP.audio.sfx('heal');
  }

  // Sleep in your bed: full HP, as often as you like, but only at home.
  nap() {
    const sleep = FUP.clock.canSleep();
    if (!sleep && FUP.run.currentHp() >= FUP.run.maxHp()) return;
    FUP.run.hp = null;
    this.dirty = true;
    FUP.audio.sfx('heal');
    if (sleep) {
      // Sleep until morning: the screen goes dark, a new day starts (src/systems/clock.js)
      FUP.clock.sleep(); FUP.clock.rolled = 0;
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(450, () => { this.cameras.main.fadeIn(500, 0, 0, 0); this.say('sleepDay'); this.renderSatchel(); this.refreshNap(); });
    } else {
      this.renderSatchel();
      this.say('homeNap');
    }
    this.refreshNap();
  }
  // The bed button's words depend on the time of day
  refreshNap() {
    if (!this.napBtn || !this.napBtn.txt.active) return;
    const sleep = FUP.clock.canSleep();
    this.napBtn.txt.setText(sleep ? `🛏️ Sleep until morning` : '😴 Nap (full heal)');
    this.napBtn.setEnabled(sleep || FUP.run.currentHp() < FUP.run.maxHp());
  }

  // ---------- Redraw everything that depends on your Cooking level or the pot ----------
  refreshAll() {
    this.renderHeader();
    this.renderPantry();
    this.renderPot();
    this.renderResult();
    this.renderSatchel();
    this.renderBook();
  }

  // ---------- Header: Cooking level + XP bar ----------
  renderHeader() {
    const ui = FUP.ui, c = ui.colors, g = this.groups.header;
    g.clear(true, true);
    const p = FUP.skills.progress('cooking');
    g.add(ui.text(this, 490, 74, `🍳 COOKING  Lv ${p.level}`, 18, c.accent, { fontStyle: '700' }));
    const bar = ui.bar(this, 668, 80, 130, 12, c.limit);
    bar.set(p.ratio);
    g.add(bar.bg); g.add(bar.fill);
    g.add(ui.text(this, 806, 78, p.maxed ? 'MAX' : `${p.xp}/${p.need}`, 12, c.dim));
  }

  // ---------- Pantry: one tile per ingredient ----------
  renderPantry() {
    const ui = FUP.ui, c = ui.colors, g = this.groups.pantry;
    g.clear(true, true);
    const level = FUP.skills.level('cooking');
    const tileW = 222, tileH = 52, gap = 4, x0 = 20, x1 = 250, y0 = 102;

    const run = FUP.run;
    this.bagTitle.setText(`🎒 ${run.slotsUsed()}/${run.packMax()}  🪙 ${run.coins}`);
    const ids = Object.keys(FUP.ingredients).filter(id => run.bagCount(id) > 0);
    if (!ids.length) {
      g.add(ui.text(this, x0, y0, 'Your bag is empty.\nWin a fight to forage more.', 15, c.dim, { lineSpacing: 4 }));
    }

    ids.forEach((id, i) => {
      const ing = FUP.ingredients[id];
      const left = run.bagCount(id) - this.picked.filter(p => p === id).length; // not already in the pot
      const x = i % 2 === 0 ? x0 : x1, y = y0 + Math.floor(i / 2) * (tileH + gap);
      const rect = FUP.ui.panel(this, x, y, tileW, tileH, 'btn');
      if (left <= 0) rect.setAlpha(0.4);
      g.add(ui.text(this, x + tileW - 8, y + 5, `x${left}`, 13, left > 0 ? c.accent : c.dim, { fontStyle: '700' }).setOrigin(1, 0));
      const art = this.textures.exists(ui.ingKey(id));
      const title = art ? ing.name : `${ing.emoji} ${ing.name}`;
      const name = ui.text(this, x + (art ? 28 : 8), y + 4, title, title.length > (art ? 18 : 21) ? 11 : 13, c.ink, { fontStyle: '700' });
      if (art) g.add(ui.sprite(this, x + 15, y + 12, ui.ingKey(id), ing.emoji, 14, 1));
      // Line 2: eating it raw. Line 3: how many recipes you can cook use it.
      const trait = ui.text(this, x + 8, y + 21, FUP.cooking.rawText(id), 11, c.info);
      const raw = FUP.cooking.rawDish(id), canEat = raw && raw.heal > 0 && left > 0;
      const n = FUP.cooking.recipesUsing(id, level);
      const hint = ui.text(this, x + 8, y + 35, n ? `In ${n} recipe${n === 1 ? '' : 's'} you can cook` : 'No recipe you can cook uses it yet', 11, n ? c.ink : c.dim,
        { wordWrap: { width: tileW - (canEat ? 62 : 16) }, maxLines: 1 });
      g.add(trait);
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerover', () => rect.restyle('btnHover'));
      rect.on('pointerout', () => rect.restyle('btn'));
      rect.on('pointerdown', () => this.time.delayedCall(1, () => this.addIngredient(id)));
      g.addMultiple([rect, name, hint]);
      // Small "Eat" button: eat one raw right now (only the ones that heal are worth it outside a fight)
      if (canEat) {
        const eat = ui.button(this, x + tileW - 50, y + 28, 44, 20, `Eat`, () => this.eatRaw(id), { size: 11 });
        g.addMultiple([eat.rect, eat.txt]);
      }
    });
  }

  // Eat one ingredient raw from the bag (healing only, outside a fight).
  eatRaw(id) {
    const r = FUP.run.eatRawAtCamp(id);
    if (!r) return;
    this.dirty = true;
    this.renderSatchel();
    this.renderPantry();
    this.say('eatRaw', { item: r.dish.name });
    FUP.audio.sfx(r.change > 0 ? 'heal' : 'eat');
  }

  addIngredient(id) {
    const slots = FUP.cooking.slotsFor(FUP.skills.level('cooking'));
    if (this.picked.length >= slots) { this.say('cookFull'); FUP.audio.sfx('error'); return; }
    if (this.picked.filter(p => p === id).length >= FUP.run.bagCount(id)) { this.say('campOutOf'); FUP.audio.sfx('error'); return; }
    this.picked.push(id);
    FUP.audio.sfx('plop');
    this.renderPot();
    this.renderPantry();
    this.renderResult();
  }

  removeIngredient(index) {
    this.picked.splice(index, 1);
    this.renderPot();
    this.renderPantry();
    this.renderResult();
  }

  // ---------- The pot: slots, method buttons, COOK button ----------
  renderPot() {
    const ui = FUP.ui, c = ui.colors, g = this.groups.pot, d = FUP.cookingData;
    g.clear(true, true);
    const level = FUP.skills.level('cooking');
    const slots = FUP.cooking.slotsFor(level);
    const maxSlots = d.slotsByLevel[d.slotsByLevel.length - 1].slots;
    const X = 490, W = 390;

    // Ingredient slots
    for (let i = 0; i < maxSlots; i++) {
      const x = X + i * (84 + 18), y = 104;
      const open = i < slots;
      const rect = FUP.ui.panel(this, x, y, 84, 84, 'slot', open ? undefined : c.muted);
      g.add(rect);
      if (!open) {
        g.add(ui.text(this, x + 42, y + 32, '🔒', 26, c.dim).setOrigin(0.5));
        g.add(ui.text(this, x + 42, y + 64, `Lv ${FUP.cooking.slotUnlockLevel(i)}`, 12, c.dim).setOrigin(0.5));
      } else if (this.picked[i]) {
        const ing = FUP.ingredients[this.picked[i]];
        g.add(ui.sprite(this, x + 42, y + 34, ui.ingKey(this.picked[i]), ing.emoji, 38));
        g.add(ui.text(this, x + 42, y + 68, ing.short, 11, c.ink).setOrigin(0.5));
        rect.setInteractive({ useHandCursor: true });
        rect.on('pointerover', () => rect.restyle('slot', c.danger)); // red edge = "click to remove"
        rect.on('pointerout', () => rect.restyle('slot'));
        const idx = i;
        rect.on('pointerdown', () => this.time.delayedCall(1, () => this.removeIngredient(idx)));
      } else {
        g.add(ui.text(this, x + 42, y + 42, '+', 30, c.dim).setOrigin(0.5));
      }
    }

    // Method buttons
    const ids = Object.keys(d.methods), gap = 6, bw = (W - gap * (ids.length - 1)) / ids.length;
    ids.forEach((id, i) => {
      const m = d.methods[id], unlocked = FUP.cooking.methodUnlocked(id, level);
      const label = unlocked ? `${m.emoji} ${m.name}` : `🔒 Lv${m.unlock}`;
      const btn = ui.button(this, X + i * (bw + gap), 198, bw, 38, label,
        () => {
          if (!unlocked) { this.say('cookLocked'); FUP.audio.sfx('error'); return; }
          this.method = id; this.renderPot(); this.renderResult();
        },
        { size: 13, hot: unlocked && this.method === id, color: unlocked ? c.ink : c.dim });
      g.add(btn.rect); g.add(btn.txt);
    });

    // What the chosen method is for
    const m = d.methods[this.method];
    g.add(ui.text(this, X, 242, `${m.emoji} ${m.name}: ${m.blurb}`, 12, c.info, { wordWrap: { width: W } }));

    // COOK button: blocked for recipes above your level
    const pv = this.picked.length ? FUP.cooking.preview(this.picked, this.method, level) : null;
    // Room in the backpack for what this makes? (a stack of the same dish with space, or a free slot)
    const full = pv && (pv.kind === 'recipe' ? !FUP.run.canAddDish(pv.recipe.name, pv.tier.name) : !FUP.run.canAddDish(FUP.recipeData.junk.name, FUP.cookingData.tiers[0].name)), locked = pv && pv.kind === 'locked';
    const ready = this.picked.length >= d.minIngredients && !full && !locked;
    const label = full ? 'Backpack full. Eat, store or drop something.'
      : locked ? `Needs Cooking ${pv.need}`
      : !this.picked.length ? 'Pick a recipe (📖) or add ingredients'
      : pv.kind === 'experiment' ? '🧪 EXPERIMENT!' : 'COOK!';
    const cook = ui.button(this, X, 282, W, 46, label,
      () => this.doCook(), { size: ready ? 24 : 15, hot: ready });
    if (!ready) cook.setEnabled(false);
    g.add(cook.rect); g.add(cook.txt);
  }

  // ---------- COOK ----------
  doCook() {
    if (this.picked.length < FUP.cookingData.minIngredients) { this.say('cookEmpty'); return; }
    { // no room in the backpack for what this makes: don't waste the ingredients
      const pv = FUP.cooking.preview(this.picked, this.method, FUP.skills.level('cooking'));
      const room = pv.kind === 'recipe' ? FUP.run.canAddDish(pv.recipe.name, pv.tier.name) : FUP.run.canAddDish(FUP.recipeData.junk.name, FUP.cookingData.tiers[0].name);
      if (!room) { this.say('campSatchelFull'); FUP.audio.sfx('error'); return; }
    }
    const r = FUP.cooking.cook(this.picked, this.method);
    if (!r) { this.say('cookLocked'); FUP.audio.sfx('error'); return; }   // a recipe above your level
    // Ingredients are used up; the dish goes into your satchel for the next fight.
    FUP.run.takeFromBag(this.picked);
    if (!FUP.run.addDish(r)) { this.say('campSatchelFull'); FUP.audio.sfx('error'); }   // no room: it's lost (the COOK button checks first)
    this.picked = [];
    this.result = r;
    this.dirty = true;
    if (!r.burnt && r.recipe) FUP.facts.add(`recipe:${FUP.cooking.recipeId(r.recipe)}`);
    if (r.burnt) FUP.tutorial.note('cook');   // the island counts a burnt dish too
    const questNews = r.burnt ? [] : FUP.quests.event('cook', { tier: r.tier.id, element: r.effects.element, method: r.method });
    if (r.discovered) questNews.push(...FUP.quests.event('secret'));
    if (questNews.length) this.time.delayedCall(2600, () => { if (this.narratorText.active) this.narratorText.setText(`📜 Quest done: ${questNews.join(', ')}. Hand it in at the Quest Board.`); });
    this.refreshAll();

    // The big "here's what you made" card
    this.showDishCard(r, FUP.run.satchel[FUP.run.satchel.length - 1]);
    // Sizzle, then a little sting for how it turned out
    FUP.audio.sfx('sizzle');
    const up = r.levels.to > r.levels.from;
    const sting = r.discovered ? 'fanfare' : r.burnt ? 'fail' : up ? 'levelup' : r.stars === 5 ? 'fanfare' : null;
    if (sting) this.time.delayedCall(350, () => FUP.audio.sfx(sting));
    if (r.burnt) FUP.fx.shake(this, 'burnt');
    if (r.discovered || (!r.burnt && r.stars === 5)) this.cameras.main.flash(300, 255, 220, 120);
    else if (up) this.cameras.main.flash(250, 255, 240, 160);

    // Narrator reacts to what happened
    let cat;
    if (r.discovered) cat = 'cookSecret';
    else if (r.close) cat = 'cookSecretClose';
    else if (!r.recipe) cat = 'cookJunk';
    else if (r.burnt) cat = 'cookBurn';
    else if (up) cat = 'cookLevelUp';
    else if (r.stars === 5) cat = 'cookLegendary';
    else cat = 'cookRecipe';
    this.say(cat, { dish: r.recipe ? r.recipe.name : r.name, level: r.levels.to });
  }

  // ---------- Backpack (v0.41) ----------
  openPack() {
    if (this.pack || this.leaving) return;
    this.hideDishTip();
    this.pack = FUP.backpack.open(this, { home: this.mode === 'home', onChange: () => { this.dirty = true; }, onClose: () => { this.pack = null; this.dirty = true; this.refreshAll(); } });
  }

  // ---------- Gear screen (old, replaced by the backpack in v0.41) ----------
  openGear() {
    this.hideDishTip();
    if (this.gearPanel) this.gearPanel.destroy(true);
    const ui = FUP.ui, c = ui.colors, G = FUP.gearData, run = FUP.run, W = this.scale.width, H = this.scale.height, Z = 400;
    const shopOpen = false;   // shops are in the village now (Blacksmith, Shopkeeper)
    this.gearTab = 'stash';
    this.dirty = true;
    const g = this.gearPanel = this.add.group();
    const add = o => { g.add(o); if (o.setDepth) o.setDepth(Z + 1); return o; };
    const btn = (x, y, w, h, label, fn, opts = {}) => {
      const b = ui.button(this, x, y, w, h, label, () => { fn(); this.openGear(); }, { size: 13, ...opts });
      b.rect.setDepth(Z + 2); b.txt.setDepth(Z + 3); g.addMultiple([b.rect, b.txt]);
      if (opts.disabled) b.setEnabled(false);
      return b;
    };
    const nameOf = it => it.name;
    const pic = (x, y, keyOrItem, emoji) => add(ui.sprite(this, x, y, FUP.gear.spriteKey(keyOrItem), emoji, 18, 1.5));

    add(FUP.ui.shade(this, 0.75)).setDepth(Z);
    add(FUP.ui.panel(this, 20, 20, W - 40, H - 40, 'panel'));
    add(ui.text(this, 40, 34, '🛡️ GEAR', 22, c.accent, { fontStyle: '700' }));
    add(ui.text(this, W - 186, 38, `🪙 ${run.coins} coins`, 18, c.accent, { fontStyle: '700' }).setOrigin(1, 0));
    const close = ui.button(this, W - 172, 30, 90, 32, 'Close', () => { this.gearPanel.destroy(true); this.gearPanel = null; this.refreshAll(); }, { size: 15, hot: true });
    close.rect.setDepth(Z + 2); close.txt.setDepth(Z + 3); g.addMultiple([close.rect, close.txt]);

    // ----- Left: what you're wearing -----
    add(ui.text(this, 40, 74, 'WEARING', 14, c.dim, { fontStyle: '700' }));
    G.slots.forEach((slot, i) => {
      const y = 96 + i * 62, it = run.equipped[slot];
      add(FUP.ui.panel(this, 40, y, 400, 56, 'inset', it ? Phaser.Display.Color.HexStringToColor(it.color).color : c.muted));
      add(ui.text(this, 52, y + 8, `${G.slotEmoji[slot]} ${G.slotNames[slot].toUpperCase()}`, 11, c.dim, { fontStyle: '700' }));
      if (it) {
        pic(68, y + 36, it, it.emoji);
        add(ui.text(this, 90, y + 22, nameOf(it), nameOf(it).length > 30 ? 12 : 14, it.color, { fontStyle: '700', wordWrap: { width: 262 }, maxLines: 1 }));
        add(ui.text(this, 90, y + 39, FUP.gear.statText(it.stats) + (FUP.gear.effectInfo(it) ? ` · ★ ${FUP.gear.effectInfo(it).name}` : ''), 11, c.info, { wordWrap: { width: 262 }, maxLines: 1 }));
        btn(360, y + 14, 70, 28, 'Take off', () => run.unequip(slot));
      } else {
        add(ui.text(this, 52, y + 26, slot === 'weapon' ? `Your ${FUP.weapons[run.weapon].name} (no upgrade)` : 'Nothing', 13, c.dim, { fontStyle: 'italic' }));
      }
    });
    // Your stats with all this on
    const p = FUP.combat.makePlayer(FUP.skills.level('melee'), FUP.weapons[run.weapon]);
    const stats = [`HP ${p.maxHp}`, `ATK ${Math.round(p.atk * 10) / 10}`, `DEF ${p.def}`, `Crit ${Math.round(p.crit * 100)}%`];
    if (p.gearResist.poison) stats.push(`Poison resist ${Math.round(p.gearResist.poison * 100)}%`);
    add(ui.text(this, 40, 410, 'YOUR STATS', 14, c.dim, { fontStyle: '700' }));
    add(ui.text(this, 40, 430, stats.join('   ·   '), 15, c.ink, { fontStyle: '700', wordWrap: { width: 400 } }));
    add(ui.text(this, 40, 470, 'More DEF = enemies hit you for less.\nThe Landlord hits hard: armor helps a lot.', 12, c.dim, { lineSpacing: 3 }));

    // ----- Right: shop or your stuff -----
    const X = 460, RW = W - 40 - X;
    btn(X, 70, 170, 28, `Your stuff (${run.stash.length})`, () => { this.gearTab = 'stash'; }, { hot: true });
    add(ui.text(this, X, 104, this.mode !== 'home' ? 'The shops are back in the village. You can still change what you wear.' : 'Buy and sell at the Blacksmith and the Shopkeeper in the village.', 12, c.dim));

    const rowH = 34, y0 = 122;
    if (this.gearTab === 'shop' && shopOpen) {
      const keys = Object.keys(G.items).filter(k => !G.items[k].starter);
      keys.forEach((k, i) => {
        const d = G.items[k], y = y0 + i * rowH, name = d.names ? d.names[run.weapon] : d.name;
        pic(X + 14, y + 16, k, d.emoji);
        add(ui.text(this, X + 34, y + 2, name, 13, c.ink, { fontStyle: '700' }));
        add(ui.text(this, X + 34, y + 18, FUP.gear.statText(d.stats), 11, c.info));
        btn(X + RW - 84, y + 2, 84, 28, `${d.price} 🪙`, () => { if (run.buy(k)) { FUP.audio.sfx('coins'); this.say('gearBuy'); } }, { disabled: run.coins < d.price });
      });
    } else {
      if (!run.stash.length) add(ui.text(this, X, y0 + 4, 'Nothing spare. Buy something in the village, or beat\nenemies for drops (the Landlord always drops something good).', 13, c.dim, { lineSpacing: 4 }));
      run.stash.forEach((it, i) => {
        if (i > 11) return;
        const y = y0 + i * rowH;
        pic(X + 14, y + 16, it, it.emoji);
        add(ui.text(this, X + 34, y + 2, nameOf(it), nameOf(it).length > 28 ? 11 : 13, it.color, { fontStyle: '700', wordWrap: { width: RW - 194 }, maxLines: 1 }));
        add(ui.text(this, X + 34, y + 18, `${G.slotNames[it.slot]} · ${FUP.gear.statText(it.stats)}${FUP.gear.effectInfo(it) ? ' · ★ ' + FUP.gear.effectInfo(it).text : ''}`, 11, c.info, { wordWrap: { width: RW - 194 }, maxLines: 1 }));
        // Weapon upgrades need a Melee level to wear (data/unlocks.js)
        const need = FUP.unlocks.wearLevel(it), ok = FUP.unlocks.canWear(it);
        btn(X + RW - 84, y + 2, 84, 28, ok ? 'Wear' : FUP.unlocks.wearText(it), () => { if (run.equip(it)) FUP.audio.sfx('guard'); }, { disabled: !ok });
      });
    }
  }

  // ---------- Pantry: move ingredients between your bag and the pantry ----------
  openPantry() {
    this.hideDishTip();
    if (this.pantryPanel) this.pantryPanel.destroy(true);
    const ui = FUP.ui, c = ui.colors, run = FUP.run, H = FUP.house, W = this.scale.width, Hh = this.scale.height, Z = 400;
    const g = this.pantryPanel = this.add.group();
    const add = o => { g.add(o); if (o.setDepth) o.setDepth(Z + 1); return o; };
    const btn = (x, y, w, h, label, fn, opts = {}) => {
      const b = ui.button(this, x, y, w, h, label, () => { fn(); this.dirty = true; if (this.pantryPanel) this.openPantry(); }, { size: 13, ...opts });
      b.rect.setDepth(Z + 2); b.txt.setDepth(Z + 3); g.addMultiple([b.rect, b.txt]);
      if (opts.disabled) b.setEnabled(false);
      return b;
    };
    add(FUP.ui.shade(this, 0.75)).setDepth(Z);
    add(FUP.ui.panel(this, 20, 20, W - 40, Hh - 40, 'panel'));
    add(ui.text(this, 40, 34, `🗄️ ${H.current('pantries').name.toUpperCase()}`, 22, c.accent, { fontStyle: '700' }));
    btn(W - 136, 30, 96, 32, 'Close', () => { this.pantryPanel.destroy(true); this.pantryPanel = null; this.refreshAll(); }, { size: 15, hot: true });
    const bagFull = run.freeSlots() <= 0;
    add(ui.text(this, 40, 70, `Backpack ${run.slotsUsed()}/${run.packMax()} slots     Pantry ${H.pantryTotal()}/${H.pantryMax()}     (the pantry stays at home; take things out to cook or carry them)`, 13, bagFull || H.pantryFull() ? c.bad : c.dim));

    const ids = Object.keys(FUP.ingredients).filter(id => run.bagCount(id) > 0 || H.pantryCount(id) > 0);
    if (!ids.length) add(ui.text(this, 40, 110, 'Nothing in your bag or the pantry. The shelves echo.', 15, c.dim));
    add(ui.text(this, 330, 98, 'BAG', 12, c.dim, { fontStyle: '700' }).setOrigin(0.5, 0));
    add(ui.text(this, 690, 98, 'PANTRY', 12, c.dim, { fontStyle: '700' }).setOrigin(0.5, 0));
    ids.forEach((id, i) => {
      const y = 118 + i * 46, ing = FUP.ingredients[id], inBag = run.bagCount(id), inP = H.pantryCount(id);
      add(FUP.ui.panel(this, 36, y, W - 72, 40, 'inset'));
      add(ui.sprite(this, 58, y + 20, ui.ingKey(id), ing.emoji, 18, 1.4));
      add(ui.text(this, 82, y + 11, ing.name, 14, c.ink, { fontStyle: '700' }));
      add(ui.text(this, 330, y + 20, `x${inBag}`, 15, inBag ? c.accent : c.dim, { fontStyle: '700' }).setOrigin(0.5));
      btn(380, y + 6, 110, 28, 'Store all →', () => H.store(id, 99), { disabled: !inBag || H.pantryFull() });
      btn(496, y + 6, 90, 28, 'Store 1 →', () => H.store(id, 1), { disabled: !inBag || H.pantryFull() });
      add(ui.text(this, 690, y + 20, `x${inP}`, 15, inP ? c.accent : c.dim, { fontStyle: '700' }).setOrigin(0.5));
      btn(724, y + 6, 66, 28, '← 1', () => H.take(id, 1), { disabled: !inP || bagFull });
      btn(796, y + 6, 66, 28, '← all', () => H.take(id, 99), { disabled: !inP || bagFull });
    });
  }

  // ---------- Dish reveal: a big card that says exactly what you made ----------
  showDishCard(r, dish) {
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 300;
    this.hideDishTip();
    if (this.card) this.card.destroy(true);
    this.hiddenDish = dish;     // its satchel slot stays empty until it "lands"
    this.renderSatchel();
    const g = this.card = this.add.group();
    const add = o => { g.add(o); return o.setDepth ? o.setDepth(Z + 1) : o; };

    const shade = add(FUP.ui.shade(this, 0.6)).setDepth(Z);
    const PW = 520, PH = 390, px = (W - PW) / 2, py = 95;
    add(FUP.ui.panel(this, px, py, PW, PH, 'panel', Phaser.Display.Color.HexStringToColor(r.tier.color).color));
    add(ui.text(this, W / 2, py + 18, r.burnt ? (r.recipe ? 'OOPS, YOU BURNED IT' : 'THAT WASN\'T A RECIPE') : 'YOU MADE', 15, r.burnt ? c.bad : c.dim, { fontStyle: '700', letterSpacing: 2 }).setOrigin(0.5, 0));

    // Big picture of the dish, with a bounce
    const pic = add(ui.sprite(this, W / 2, py + 90, FUP.dishArt.key(dish), dish.emoji, 64, 6));
    const full = pic.scale;
    pic.setScale(full * 0.2);
    this.tweens.add({ targets: pic, scale: full, duration: 380, ease: 'Back.easeOut' });

    add(ui.text(this, W / 2, py + 146, r.name, 22, c.ink, { fontStyle: '700', align: 'center', wordWrap: { width: PW - 40 } }).setOrigin(0.5, 0));
    const n = FUP.cooking.stars(r.tier.name);
    add(ui.text(this, W / 2, py + 180, '★'.repeat(n) + '☆'.repeat(5 - n) + `  ${r.tier.name.toUpperCase()}`, 20, r.tier.color, { fontStyle: '700' }).setOrigin(0.5, 0));

    // What it does, in plain words
    const lines = FUP.cooking.dishLines(dish);
    lines.forEach((l, i) => {
      add(ui.text(this, px + 34, py + 216 + i * 24, l.icon, 15));
      add(ui.text(this, px + 60, py + 218 + i * 24, l.text, 15, l.icon === '⚠️' ? c.bad : c.ink, { wordWrap: { width: PW - 80 } }));
    });

    // Where it went + XP (small, at the bottom)
    const yb = py + PH - 86;
    add(ui.text(this, W / 2, yb, `🎒 Added to your backpack (${FUP.run.slotsUsed()}/${FUP.run.packMax()} slots). Eat or throw it in a fight.`, 14, c.good).setOrigin(0.5, 0));
    let xp = r.xp ? `+${r.xp} Cooking XP` : 'No XP (burnt food teaches nothing)';
    if (r.discovered) xp = `🔮 SECRET RECIPE DISCOVERED!  ·  ` + (r.xp ? `+${r.xp} Cooking XP (x${FUP.cookingData.discoveryXpMult} first time)` : 'burnt, but you know it now');
    if (r.levels.to > r.levels.from) xp += `  ·  LEVEL UP! Cooking ${r.levels.to}`;
    add(ui.text(this, W / 2, yb + 20, xp, 13, r.levels.to > r.levels.from ? c.good : c.accent).setOrigin(0.5, 0));

    const close = () => this.closeDishCard(pic, dish);
    const btn = ui.button(this, W / 2 - 80, py + PH - 30, 160, 40, 'Got it!', close, { hot: true, size: 18 });
    btn.rect.setDepth(Z + 2); btn.txt.setDepth(Z + 3);
    g.addMultiple([btn.rect, btn.txt]);
    shade.on('pointerdown', () => this.time.delayedCall(1, close));
  }

  // The dish flies down into its satchel slot, then the card goes away.
  closeDishCard(pic, dish) {
    if (!this.card || this.closingCard) return;
    this.closingCard = true;
    const idx = FUP.run.dishStacks().findIndex(st => st.idx.includes(FUP.run.satchel.indexOf(dish)));
    const tx = this.satchelSlotX(Math.max(0, idx)) + this.satchelStep() / 2 - 2, ty = 557 + 16;
    this.card.getChildren().forEach(o => { if (o !== pic) this.tweens.add({ targets: o, alpha: 0, duration: 200 }); });
    this.tweens.add({ targets: pic, x: tx, y: ty, scale: 1.5, duration: 450, ease: 'Cubic.easeIn', onComplete: () => {
      FUP.audio.sfx('plop');
      this.card.destroy(true); this.card = null; this.closingCard = false;
      this.hiddenDish = null;
      this.renderSatchel();
    } });
  }

  // Hovering a satchel dish shows a small card with the same info
  showDishTip(dish, x) {
    this.hideDishTip();
    const ui = FUP.ui, c = ui.colors, Z = 250;
    const lines = FUP.cooking.dishLines(dish);
    const w = 400, h = 56 + lines.length * 20, left = Math.min(Math.max(16, x - w / 2), this.scale.width - w - 16), top = 548 - h;
    const g = this.tip = this.add.group();
    g.add(FUP.ui.panel(this, left, top, w, h, 'tooltip', Phaser.Display.Color.HexStringToColor(dish.tierColor || '#a3b08f').color).setAlpha(0.96).setDepth(Z));
    g.add(ui.text(this, left + 12, top + 8, dish.name, 15, c.ink, { fontStyle: '700', wordWrap: { width: w - 24 } }).setDepth(Z));
    const n = FUP.cooking.stars(dish.tier);
    g.add(ui.text(this, left + 12, top + 28, '★'.repeat(n) + '☆'.repeat(5 - n) + '  ' + (dish.tier || ''), 13, dish.tierColor || c.dim, { fontStyle: '700' }).setDepth(Z));
    lines.forEach((l, i) => g.add(ui.text(this, left + 12, top + 50 + i * 20, `${l.icon} ${l.text}`, 12, l.icon === '⚠️' ? c.bad : c.ink, { wordWrap: { width: w - 24 } }).setDepth(Z)));
  }

  hideDishTip() { this.tipFor = null; if (this.tip) { this.tip.destroy(true); this.tip = null; } }

  // ---------- Result panel (right): how cooking works, the preview, or what you just made ----------
  renderResult() {
    const ui = FUP.ui, c = ui.colors, g = this.groups.result;
    g.clear(true, true);
    const r = this.result, X = 490, W = 390, d = FUP.cookingData;

    g.add(FUP.ui.panel(this, X, 338, W, 212, 'panel'));
    if (this.picked.length) { this.renderPreview(g, X, W); return; }
    if (!r) {
      g.add(ui.text(this, X + 12, 346, 'HOW COOKING WORKS', 14, c.accent, { fontStyle: '700' }));
      g.add(ui.text(this, X + 12, 366, [
        '📖 Open Recipes, pick one, press COOK. Every recipe says what it does.',
        '⭐ Stars come from the recipe: higher-level recipes are fancier. Your level only lowers burning.',
        `🔥 Burning: ${Math.round(d.burnStart * 100)}% at the recipe's level, gone at its level +${d.stopBurnAfter}. Burnt = no XP, throw only.`,
        '🔒 Recipes above your level are locked.',
        '🧪 Anything else is an experiment: a secret recipe, or burnt junk. Chef Marrowbone sells riddles.',
      ].join('\n'), 12, c.ink, { wordWrap: { width: W - 24 }, lineSpacing: 4 }));
      return;
    }

    // What you just made
    const dishKey = FUP.dishArt.key({ ids: r.ids, method: r.method, burnt: r.burnt, sprite: r.burnt ? 'dish_burnt' : 'dish_' + r.method });
    if (this.textures.exists(dishKey)) {
      g.add(ui.sprite(this, X + 26, 362, dishKey, r.emoji, 18, 1.8));
      g.add(ui.text(this, X + 50, 345, r.name, 17, c.ink, { fontStyle: '700', wordWrap: { width: W - 60 } }));
    } else {
      g.add(ui.text(this, X + 10, 345, `${r.emoji} ${r.name}`, 17, c.ink, { fontStyle: '700', wordWrap: { width: W - 20 } }));
    }
    const n = r.stars || 0;
    g.add(ui.text(this, X + 10, 390, r.burnt ? 'BURNT · throw it or sell it for 1 coin' : `${'★'.repeat(n)}${'☆'.repeat(5 - n)} ${r.tier.name.toUpperCase()}`, 16, r.tier.color, { fontStyle: '700' }));
    g.add(ui.text(this, X + 10, 414, FUP.cooking.fxText(r.effects), 12, c.ink, { wordWrap: { width: W - 20 }, lineSpacing: 2 }));
    g.add(ui.text(this, X + 10, 466, r.xp ? `+${r.xp} Cooking XP` : 'No XP', 15, r.xp ? c.accent : c.dim, { fontStyle: '700' }));
    // Why it came out like this (no luck in quality: only burning is a roll)
    const why = [];
    if (r.recipe) {
      why.push(`Your Cooking ${r.levels.from} vs recipe level ${r.recipe.level}`);
      why.push(r.burnt ? `burnt (${Math.round(r.burnChance * 100)}% chance)` : `${Math.round(r.burnChance * 100)}% burn chance, you didn't`);
    } else if (r.close) why.push('This combo is a secret recipe, but your Cooking level is too low for it');
    else why.push('Not a recipe. Experiments are either a secret recipe or this');
    g.add(ui.text(this, X + 10, 486, why.join(' · '), 12, c.dim, { wordWrap: { width: W - 20 } }));
    if (r.levels.to > r.levels.from) {
      g.add(ui.text(this, X + 10, 506, `LEVEL UP! Cooking ${r.levels.to}`, 16, c.good, { fontStyle: '700' }));
      if (r.unlocks.length) g.add(ui.text(this, X + 10, 526, 'Unlocked: ' + r.unlocks.join(' · '), 11, c.info, { wordWrap: { width: W - 20 } }));
    }
  }

  // ---------- Preview: exactly what the pot will make ----------
  renderPreview(g, X, W) {
    const ui = FUP.ui, c = ui.colors, d = FUP.cookingData;
    const level = FUP.skills.level('cooking');
    const pv = FUP.cooking.preview(this.picked, this.method, level);
    if (pv.kind === 'recipe') {
      const r = pv.recipe, n = pv.stars;
      g.add(ui.text(this, X + 12, 346, `📜 ${r.name.toUpperCase()}`, 15, c.good, { fontStyle: '700' }));
      g.add(ui.text(this, X + 12, 370, `${'★'.repeat(n)}${'☆'.repeat(5 - n)} ${pv.tier.name.toUpperCase()}`, 15, pv.tier.color, { fontStyle: '700' }));
      g.add(ui.text(this, X + 12, 396, FUP.cooking.fxText(pv.fx), 13, c.ink, { wordWrap: { width: W - 24 }, lineSpacing: 2 }));
      g.add(ui.text(this, X + 12, 452, `+${pv.xp} Cooking XP   ·   sells for ${pv.sell} 🪙`, 13, c.accent, { fontStyle: '700' }));
      const burn = Math.round(pv.burn * 100);
      g.add(ui.text(this, X + 12, 478, r.method === 'raw' ? 'Raw: never burns.' : burn ? `Burn chance ${burn}% (0% at Cooking ${FUP.cooking.stopBurnLevel(r)}). Burnt = no XP.` : 'You never burn this any more.', 12, burn ? c.bad : c.good, { wordWrap: { width: W - 24 } }));
    } else if (pv.kind === 'locked') {
      g.add(ui.text(this, X + 12, 346, `🔒 ${pv.recipe.name.toUpperCase()}`, 15, c.dim, { fontStyle: '700' }));
      g.add(ui.text(this, X + 12, 372, `Needs Cooking ${pv.need}. You're level ${level}.`, 15, c.bad, { fontStyle: '700' }));
      g.add(ui.text(this, X + 12, 400, FUP.cooking.fxText(FUP.cooking.effects(pv.recipe, 1)) , 12, c.dim, { wordWrap: { width: W - 24 } }));
    } else {
      g.add(ui.text(this, X + 12, 346, '🧪 EXPERIMENT', 15, c.accent, { fontStyle: '700' }));
      g.add(ui.text(this, X + 12, 372, 'This isn\'t a recipe you know. Cooking it makes either:', 13, c.ink, { wordWrap: { width: W - 24 } }));
      g.add(ui.text(this, X + 12, 396, '🔮 a SECRET recipe (if you have the level): x3 XP the first time\n💨 or burnt junk: no XP, throw it or sell it for 1 coin', 13, c.ink, { wordWrap: { width: W - 24 }, lineSpacing: 4 }));
      g.add(ui.text(this, X + 12, 452, 'The ingredients are used up either way. Chef Marrowbone sells riddles about secret recipes.', 12, c.dim, { wordWrap: { width: W - 24 } }));
    }
  }

  // ---------- Bottom buttons ----------
  drawBottomButtons() {
    const ui = FUP.ui, y = 558, h = 34;
    ui.button(this, 20, y, 130, h, '📖 Recipes', () => { this.showBook = !this.showBook; this.bookPage = 0; this.renderBook(); }, { size: 15 });   // always opens on page 1
    ui.button(this, 160, y, 110, h, 'Clear pot', () => { this.picked = []; this.renderPot(); this.renderPantry(); this.renderResult(); }, { size: 15 });
    const label = this.mode === 'home' ? '🏘️ Out to the village' : '🔥 Leave the campfire';
    ui.button(this, 680, 555, 200, 38, label, () => this.mode === 'campfire' ? this.openLeaveChoice() : this.leave(this.mode === 'isle' ? 'forest' : undefined), { size: 16, hot: true });

    if (FUP.cookingData.devXpButton) {
      const amt = FUP.cookingData.devXpAmount;
      ui.button(this, 20, 478, 120, 30, `TEST +${amt}XP`, () => {   // test helper, above the HP bar
        const res = FUP.skills.addXp('cooking', amt);
        this.refreshAll();
        this.say('cookDev', { level: res.to });
      }, { size: 13 });
    }
  }

  // Campfire: back into the Forest, walk home, or (last campfire only) fight the Landlord.
  openLeaveChoice() {
    if (this.leaving || this.choice) return;
    this.hideDishTip();
    const ui = FUP.ui, c = ui.colors, W = this.scale.width, H = this.scale.height, Z = 450;
    const g = this.choice = this.add.group();
    const add = o => { g.add(o); return o.setDepth(Z + 1); };
    add(FUP.ui.shade(this, 0.7)).setDepth(Z);
    add(FUP.ui.panel(this, W / 2 - 290, 100, 580, 400, 'panel'));
    const f = FUP.run.forest, on = FUP.world.linkAt('E', f.area), hole = FUP.forest.area(f.area).godfather;
    add(ui.text(this, W / 2, 116, `WHERE TO?  ·  ${FUP.forest.area(f.area).name.toUpperCase()}`, 22, c.accent, { fontStyle: '700' }).setOrigin(0.5, 0));
    const option = (y, label, desc, fn, hot) => {
      const b = ui.button(this, W / 2 - 250, y, 500, 52, label, () => { this.closeLeaveChoice(); fn(); }, { size: 20, hot });
      b.rect.setDepth(Z + 2); b.txt.setDepth(Z + 3); g.addMultiple([b.rect, b.txt]);
      add(ui.text(this, W / 2, y + 58, desc, 13, c.dim, { align: 'center', wordWrap: { width: 500 } }).setOrigin(0.5, 0));
    };
    const next = hole ? 'Somewhere in these woods there\'s a hole. The Landlord is at the bottom.\nIt moves every trip.' : on ? `The way on to ${FUP.world.region(on.to).name} is out there somewhere.\nYou start next to the fire.` : 'You start next to the fire.';
    option(170, '🌲 Back into the Forest', next, () => this.leave('forest'), true);
    option(290, '🏘️ Walk back to Foopville', 'The trip ends safely. You keep your bag, satchel, coins and gear,\nso you can hand in quests and shop. Next trip, the Forest starts fresh.', () => this.leave('home'));
    const stay = ui.button(this, W / 2 - 90, 420, 180, 40, 'Stay here', () => this.closeLeaveChoice(), { size: 16 });
    stay.rect.setDepth(Z + 2); stay.txt.setDepth(Z + 3); g.addMultiple([stay.rect, stay.txt]);
  }

  closeLeaveChoice() { if (this.choice) { this.choice.destroy(true); this.choice = null; } }

  leave(where) {
    if (this.leaving) return;
    this.leaving = true;
    if (this.mode === 'campfire' && where === 'home') {
      // Walk home without the boss fight: the trip ends, your stuff comes with you
      FUP.world.endTrip('campfire');   // the trip ends, you're home
      FUP.save.write();
      this.say('campfireRetreat');
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('Village', { from: 'retreat' }));
      return;
    }
    if (this.mode !== 'home' && where === 'forest') {
      // Back out into this area, standing next to the fire
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(370, () => this.scene.start('World', { from: 'campfire' }));
      return;
    }
    if (this.mode === 'campfire') {
      this.say('campfireLeave');
      this.cameras.main.fadeOut(600, 30, 0, 40);
      this.time.delayedCall(650, () => this.scene.start('Battle', { enemies: ['landlord'] }));
      return;
    }
    // Home: back out to the village (the gate to the Forest is there)
    FUP.save.write();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => this.scene.start('Village', { from: 'home' }));
  }

  // ---------- Satchel: the dishes you'll bring into the next fight ----------
  // Also shows your health. Tap a dish to eat it now (healing only).
  renderSatchel() {
    const ui = FUP.ui, c = ui.colors, g = this.groups.satchel;
    g.clear(true, true);
    const run = FUP.run, max = run.satchelMax(), touch = ui.isTouch(this);

    // Health (carries between fights)
    const hp = run.currentHp(), maxHp = run.maxHp(), low = hp < maxHp * 0.3;
    g.add(ui.text(this, 20, 520, 'HP', 13, c.dim, { fontStyle: '700' }));
    const bar = ui.bar(this, 46, 520, 150, 14, low ? c.hpLow : c.hp);
    bar.set(hp / maxHp);
    g.add(bar.bg); g.add(bar.fill);
    g.add(ui.text(this, 204, 519, `${hp}/${maxHp}`, 13, low ? c.bad : c.ink));

    // Food in your backpack, one slot per stack of the same dish (v0.41)
    const stacks = run.dishStacks().filter(st => !(st.n === 1 && st.dish === this.hiddenDish));
    g.add(ui.text(this, 290, 520, `FOOD IN YOUR BACKPACK (${run.satchel.length})` + (run.satchel.length ? (touch ? '  (tap: info, again: eat)' : '  (tap to eat)') : ''), 13, c.accent, { fontStyle: '700' }));
    const step = this.satchelStep(), mid = step / 2 - 2;
    for (let k = 0; k < Math.max(stacks.length, 1); k++) {
      const st = stacks[k], dish = st && st.dish, i = st ? st.idx[0] : -1, x = this.satchelSlotX(k), y = 557;
      if (x + step > 676) break;
      const slot = FUP.ui.panel(this, x, y, step - 4, 32, 'slot', dish ? undefined : c.muted);
      g.add(slot);
      if (!dish) continue;
      g.add(ui.sprite(this, x + mid, y + 16, FUP.dishArt.key(dish), dish.emoji, 18, Math.min(1.5, step / 26)));
      if (st.n > 1) g.add(ui.text(this, x + step - 7, y + 31, String(st.n), 11, c.ink, { fontStyle: '700', stroke: c.stroke, strokeThickness: 3 }).setOrigin(1, 1));
      slot.setInteractive({ useHandCursor: true });
      if (touch) {
        // Phones have no hover: first tap shows the info, second tap eats
        slot.on('pointerdown', () => this.time.delayedCall(1, () => {
          if (this.tipFor === i) { this.eatNow(i); return; }
          this.hideDishTip(); this.showDishTip(dish, x + mid); this.tipFor = i;
        }));
        continue;
      }
      slot.on('pointerover', () => { slot.restyle('slot', c.select); this.showDishTip(dish, x + mid); });
      slot.on('pointerout', () => { slot.restyle('slot'); this.hideDishTip(); });
      slot.on('pointerdown', () => this.time.delayedCall(1, () => this.eatNow(i)));
    }
  }

  // Satchel slots fill the space between the HP bar and the leave button (10-13 of them)
  satchelStep() { return 44; }
  satchelSlotX(i) { return 290 + i * this.satchelStep(); }

  eatNow(index) {
    this.hideDishTip();
    const r = FUP.run.eatAtCamp(index);
    if (!r) return;
    this.dirty = true;
    this.renderSatchel();
    this.renderPot(); // COOK button: satchel may no longer be full
    this.say(r.dish.inedible ? 'ateInedible' : 'campEat', { dish: r.dish.name, item: r.dish.name });
    FUP.audio.sfx(r.change > 0 ? 'heal' : 'eat');
  }

  // ---------- Recipe book: every recipe, known / locked / secret ----------
  renderBook() {
    const ui = FUP.ui, c = ui.colors, g = this.groups.book, W = this.scale.width;
    g.clear(true, true);
    if (!this.showBook) return;
    const btn = (x, y, w, h, label, fn, opts = {}) => {
      const b = ui.button(this, x, y, w, h, label, fn, { size: 14, ...opts });
      g.addMultiple([b.rect, b.txt]);
      if (opts.disabled) b.setEnabled(false);
      return b;
    };
    const shade = FUP.ui.shade(this, 0.78); // blocks clicks underneath
    const panel = FUP.ui.panel(this, 40, 74, 820, 470, 'panel');
    g.addMultiple([shade, panel]);
    g.add(ui.text(this, 60, 88, '📖 RECIPE BOOK', 20, c.accent, { fontStyle: '700' }));
    btn(W - 150, 86, 100, 32, 'Close', () => { this.showBook = false; this.renderBook(); }, { hot: true });
    this.renderRecipes(g, btn);
    g.setDepth(100);
  }

  // One page of recipes. Known: what it does + "Put in pot". Locked: level + ingredients. Secret: ??? (+ riddle if bought).
  renderRecipes(g, btn) {
    const ui = FUP.ui, c = ui.colors, level = FUP.skills.level('cooking'), run = FUP.run, C = FUP.cooking, cb = C.cookbook;
    const list = FUP.recipeData.list.slice().sort((a, b) => a.level - b.level);
    const found = list.filter(r => r.secret && cb.discovered[r.name]).length, secrets = list.filter(r => r.secret).length;
    g.add(ui.text(this, 250, 93, `Cooking ${level}  ·  secret recipes found ${found}/${secrets}`, 13, c.dim));
    const per = 8, pages = Math.ceil(list.length / per);
    const pg = Math.min(Math.max(0, this.bookPage), pages - 1);
    const rowH = 44;
    list.slice(pg * per, pg * per + per).forEach((r, i) => {
      const y = 128 + i * rowH, st = C.status(r, level);
      if (i % 2 === 0) g.add(this.add.rectangle(52, y - 3, 796, rowH - 2, 0xffffff, 0.04).setOrigin(0));
      g.add(ui.text(this, 62, y + 4, `Lv ${r.level}`, 15, st === 'known' ? c.accent : c.dim, { fontStyle: '700' }));
      if (st === 'secret') {
        g.add(ui.text(this, 130, y, '🔮 ??? Secret recipe', 15, c.dim, { fontStyle: '700' }));
        g.add(ui.text(this, 130, y + 19, cb.riddles[r.name] ? `"${r.riddle}"` : 'Find it by experimenting, or buy a riddle from Chef Marrowbone.', 11, cb.riddles[r.name] ? c.info : c.dim, { fontStyle: 'italic', wordWrap: { width: 700 }, maxLines: 1 }));
        return;
      }
      const shownStars = C.recipeStars(r, level);
      const fx = C.effects(r, shownStars), m = FUP.cookingData.methods[r.method];
      g.add(ui.text(this, 130, y, (r.secret ? '🔮 ' : '') + r.name, 15, st === 'known' ? c.ink : c.dim, { fontStyle: '700' }));
      const times = cb.cooked[r.name] ? `  ·  cooked ${cb.cooked[r.name]}x` : '';
      g.add(ui.text(this, 130, y + 19, (st === 'known' ? '★'.repeat(shownStars) + '☆'.repeat(5 - shownStars) + '  ' : '') + C.fxText(fx) + `  ·  ${r.xp} XP` + times, 11, st === 'known' ? c.info : c.dim, { wordWrap: { width: 300 }, maxLines: 1 }));
      // Ingredients and method
      r.ids.forEach((id, k) => g.add(ui.sprite(this, 450 + k * 28, y + 14, ui.ingKey(id), FUP.ingredients[id].emoji, 16, 1).setAlpha(st === 'known' ? 1 : 0.5)));
      g.add(ui.text(this, 450 + r.ids.length * 28, y + 4, `${m.emoji} ${m.name}`, 13, st === 'known' ? c.ink : c.dim));
      // Can you cook it right now?
      let label = 'Put in pot', ok = true;
      const missing = C.missingFor(r, id => run.bagCount(id));
      if (st === 'locked') { label = `Needs Cooking ${r.level}`; ok = false; }
      else if (!C.methodUnlocked(r.method, level)) { label = `${m.name} at Lv ${m.unlock}`; ok = false; }
      else if (r.ids.length > C.slotsFor(level)) { label = `Needs ${r.ids.length} slots`; ok = false; }
      else if (missing.length) { label = 'Need ' + [...new Set(missing)].map(id => FUP.ingredients[id].short).join(', '); ok = false; }
      btn(690, y + 2, 150, rowH - 8, label, () => this.useRecipe(r), { size: ok ? 14 : 11, hot: ok, disabled: !ok });
    });
    // Pages
    btn(60, 502, 90, 30, '◀ Prev', () => { this.bookPage = pg - 1; this.renderBook(); }, { disabled: pg === 0 });
    g.add(ui.text(this, 170, 509, `Page ${pg + 1} / ${pages}`, 13, c.dim));
    btn(270, 502, 90, 30, 'Next ▶', () => { this.bookPage = pg + 1; this.renderBook(); }, { disabled: pg >= pages - 1 });
  }

  // Fill the pot with a recipe's ingredients and pick its method.
  useRecipe(r) {
    this.picked = r.ids.slice();
    this.method = r.method;
    this.showBook = false;
    FUP.audio.sfx('plop');
    this.refreshAll();
  }

  // ---------- Narrator ----------
  say(category, vars = {}) {
    const lines = FUP.narrator[category];
    if (!lines || !lines.length) return;
    const line = Phaser.Utils.Array.GetRandom(lines)
      .replace(/\{dish\}/g, vars.dish || 'dish')
      .replace(/\{item\}/g, vars.item || 'dish')
      .replace(/\{level\}/g, vars.level || FUP.skills.level('cooking'))
      .replace(/\{day\}/g, FUP.clock.day());
    this.narratorText.setText(line);
    this.narratorText.setAlpha(0.2);
    this.tweens.add({ targets: this.narratorText, alpha: 1, duration: 250 });
  }
}
