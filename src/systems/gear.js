// ============================================================
// GEAR RULES — making items, random drops, and adding up what you wear.
// No drawing here. Numbers and names come from data/gear.js.
// An item looks like:
//   { uid, key, slot, name, emoji, stats: { def: 2, ... }, rarity, color, sell, tier, effect }
//   effect = a chase item's special power id (data/gear.js effects), or null
// ============================================================
window.FUP = window.FUP || {};

FUP.gear = {
  _uid: 1,

  // A copy of a shop item. Weapon upgrades take their name from your weapon.
  fromShop(key) {
    const d = FUP.gearData.items[key];
    return {
      uid: this._uid++, key, slot: d.slot,
      name: d.names ? d.names[FUP.run.weapon] : d.name,
      emoji: d.emoji, stats: { ...d.stats },
      rarity: d.chase ? 'Legendary' : d.starter ? 'Starter' : 'Shop', color: d.chase ? '#f0d06a' : '#f1ead2',
      sell: d.chase ? FUP.gearData.chaseSell : Math.floor((d.price || 0) * FUP.gearData.sellShare),
      tier: d.tier || 1, effect: d.effect || null,
    };
  },

  // Roll a random drop from an enemy. Returns an item or null.
  // minRarity (optional): bosses roll this rarity or better (default gearData.bossMin).
  // chanceMult: a raid ambush doubles the drop chance
  // dropTier: only shop items of this tier or lower (the region's dropTier, data/world.js)
  rollDrop(isBoss, rng = Math.random, minRarity = null, chanceMult = 1, dropTier = 1) {
    const G = FUP.gearData;
    if (rng() >= (isBoss ? G.dropChance.boss : G.dropChance.normal) * chanceMult) return null;

    // Rarity: bosses only roll Rare or better
    let pool = G.rarities;
    if (isBoss) pool = pool.slice(Math.max(0, pool.findIndex(r => r.name === (minRarity || G.bossMin))));
    const total = pool.reduce((s, r) => s + r.chance, 0);
    let roll = rng() * total, rarity = pool[0];
    for (const r of pool) { if (roll < r.chance) { rarity = r; break; } roll -= r.chance; }

    // Base item: any shop item of a random slot (not the free starter pants)
    const keys = Object.keys(G.items).filter(k => { const d = G.items[k]; return !d.starter && !d.chase && (d.tier || 1) <= dropTier; });
    const item = this.fromShop(keys[Math.floor(rng() * keys.length)]);
    item.rarity = rarity.name; item.color = rarity.color; item.sell = rarity.sell;

    // Bonus words: prefix, then suffix, then another prefix
    const pick = list => list[Math.floor(rng() * list.length)];
    const value = b => {
      const v = b.min + rng() * (b.max - b.min);
      return b.max < 1 ? Math.round(v * 100) / 100 : Math.round(v);
    };
    const add = b => { item.stats[b.stat] = Math.round(((item.stats[b.stat] || 0) + value(b)) * 100) / 100; };
    let pre = [], suf = null;
    if (rarity.bonuses >= 1) { const b = pick(G.prefixes); pre.push(b.word); add(b); }
    if (rarity.bonuses >= 2) { suf = pick(G.suffixes); add(suf); }
    if (rarity.bonuses >= 3) {
      const b = pick(G.prefixes.filter(p => !pre.includes(p.word))); pre.unshift(b.word); add(b);
    }
    item.name = [...pre, item.name, suf ? suf.word : ''].filter(Boolean).join(' ');
    return item;
  },

  // Everything you're wearing, added up. Missing stats count as 0.
  totals() {
    const t = { atk: 0, def: 0, hp: 0, spd: 0, crit: 0, rizz: 0, heal: 0, resistPoison: 0, resistFire: 0, rentLess: 0, satchel: 0, effects: [] };
    const eq = (FUP.run && FUP.run.equipped) || {};
    for (const slot of FUP.gearData.slots) {
      const it = eq[slot];
      if (!it) continue;
      for (const [k, v] of Object.entries(it.stats)) t[k] = (t[k] || 0) + v;
      const fx = this.effectOf(it);
      if (fx) t.effects.push(fx);
    }
    return t;
  },

  // Blender picture for an item (or a shop key). Weapon upgrades match your weapon.
  spriteKey(itemOrKey) {
    const key = typeof itemOrKey === 'string' ? itemOrKey : itemOrKey.key;
    return key.startsWith('weapon_') ? `gear_${key}_${FUP.run.weapon}` : `gear_${key}`;
  },

  has(effectId) { return this.totals().effects.includes(effectId); },

  // An item's special power id. Old saves (before v0.58) carry `unique` objects: the two that still exist carry over.
  effectOf(it) {
    if (it.effect) return it.effect;
    const old = it.unique && it.unique.id;
    return old === 'spareKey' ? 'rentImmune' : old === 'pigeonDiplomacy' ? 'pigeonDiplomacy' : null;
  },
  // { name, text } of an item's special power, or null (for the backpack / shop lines)
  effectInfo(it) { const id = this.effectOf(it); return id ? FUP.gearData.effects[id] || null : null; },

  // ---------- Boss chase drops (data/gear.js bossDrops) ----------
  rowId(row) { return row.key || row.hat || row.place; },
  dryKey(boss, row) { return `dry:${boss}:${this.rowId(row)}`; },
  rowName(row) { return row.key ? FUP.gearData.items[row.key].name : row.hat ? FUP.cosmeticData.hats[row.hat].name : FUP.placeData.items[row.place].name; },
  // Roll every row for this boss. Returns [{ id, name, emoji, gear (item or null), place (id or null), lost }]
  rollChase(bossKey, rng = Math.random) {
    const out = [];
    for (const row of FUP.gearData.bossDrops[bossKey] || []) {
      const dk = this.dryKey(bossKey, row), dry = FUP.facts.get(dk);
      if (!(rng() < row.rate || dry + 1 >= row.pity)) { FUP.facts.add(dk); continue; }
      FUP.facts.set(dk, 0);
      const id = this.rowId(row);
      FUP.facts.add('drop:' + id);
      if (row.hat) {
        const h = FUP.cosmeticData.hats[row.hat];
        FUP.cosmetics.own(row.hat);
        out.push({ id, name: h.name, emoji: h.emoji, gear: null, place: null, hat: row.hat, lost: false });
      } else if (row.key) {
        const item = this.fromShop(row.key);
        const kept = FUP.run.addGear(item);
        out.push({ id, name: item.name, emoji: item.emoji, gear: item, place: null, lost: !kept });
      } else {
        FUP.place.state.owned[row.place] = (FUP.place.state.owned[row.place] || 0) + 1;
        const it = FUP.placeData.items[row.place];
        out.push({ id, name: it.name, emoji: it.emoji, gear: null, place: row.place, lost: false });
      }
    }
    return out;
  },
  // For screens: [{ name, rateText: '1 in 8', dry, pity, found }]
  chaseInfo(bossKey) {
    return (FUP.gearData.bossDrops[bossKey] || []).map(row => ({
      name: this.rowName(row), rateText: `1 in ${Math.round(1 / row.rate)}`,
      dry: FUP.facts.get(this.dryKey(bossKey, row)), pity: row.pity, found: FUP.facts.get('drop:' + this.rowId(row)),
    }));
  },

  // Compare an item (or a shop key) with what you wear in that slot (v0.42, Jesus).
  // Returns { worn, diffs: [{ text, good }], verdict: 'better' | 'worse' | 'mixed' | 'same' | 'empty' }.
  compare(itemOrKey) {
    const it = typeof itemOrKey === 'string' ? { ...FUP.gearData.items[itemOrKey], stats: FUP.gearData.items[itemOrKey].stats } : itemOrKey;
    const worn = FUP.run.equipped[it.slot];
    const a = it.stats || {}, b = (worn && worn.stats) || {};
    const names = { atk: 'ATK', def: 'DEF', hp: 'HP', spd: 'speed', crit: 'crit', rizz: 'Rizz', heal: 'food healing', resistPoison: 'poison resist', resistFire: 'fire resist', rentLess: 'less rent', satchel: 'backpack slots' };
    const pct = k => ['spd', 'crit', 'rizz', 'heal', 'resistPoison', 'resistFire', 'rentLess'].includes(k);
    const diffs = [];
    for (const k of Object.keys(names)) {
      const d = Math.round(((a[k] || 0) - (b[k] || 0)) * 1000) / 1000;
      if (!d) continue;
      const v = pct(k) ? `${d > 0 ? '+' : ''}${Math.round(d * 100)}%` : `${d > 0 ? '+' : ''}${d}`;
      diffs.push({ text: `${v} ${names[k]}`, good: d > 0 });
    }
    const up = diffs.some(x => x.good), down = diffs.some(x => !x.good);
    const verdict = !worn ? 'empty' : up && !down ? 'better' : down && !up ? 'worse' : up ? 'mixed' : 'same';
    return { worn, diffs, verdict };
  },
  // One line for shop rows: "vs your Bucket: +1 DEF ▲ · -5 HP ▼"
  compareText(itemOrKey) {
    const c = this.compare(itemOrKey);
    if (!c.worn) return 'Nothing worn there: pure upgrade';
    if (c.verdict === 'same') return `Same as your ${c.worn.name}`;
    return `vs your ${c.worn.name}: ` + c.diffs.map(x => `${x.text} ${x.good ? '▲' : '▼'}`).join(' · ');
  },

  // "+2 DEF · +5 HP · Poison resist 15%"
  statText(stats) {
    const pct = v => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
    const out = [];
    if (stats.atk) out.push(`+${stats.atk} ATK`);
    if (stats.def) out.push(`+${stats.def} DEF`);
    if (stats.hp) out.push(`+${stats.hp} HP`);
    if (stats.spd) out.push(`${pct(stats.spd)} speed`);
    if (stats.crit) out.push(`${pct(stats.crit)} crit`);
    if (stats.rizz) out.push(`${pct(stats.rizz)} Rizz`);
    if (stats.heal) out.push(`${pct(stats.heal)} food healing`);
    if (stats.resistPoison) out.push(`Poison resist ${Math.round(stats.resistPoison * 100)}%`);
    if (stats.resistFire) out.push(`Fire resist ${Math.round(stats.resistFire * 100)}%`);
    if (stats.rentLess) out.push(`${Math.round(stats.rentLess * 100)}% less rent`);
    if (stats.satchel) out.push(`+${stats.satchel} backpack slot${stats.satchel === 1 ? '' : 's'}`);
    return out.join(' · ');
  },
};
