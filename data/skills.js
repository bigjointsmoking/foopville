// ============================================================
// SKILLS — every skill in the game shares one XP curve.
// To add a new skill later (Magic...), add one entry to `skills`.
// XP curve (RuneScape-style; v0.41 Jesus: 2.5x slower, ~50 hours to max a skill):
//   XP from level N to N+1 = round(xpBase x 2^(N / xpDoubleEvery) - xpBase x xpOffset)
//   Each level costs ~9% more than the last (doubles every 8 levels), so level 42 is about
//   half the XP of level 50. Totals: Lv 10 = 1,315 · Lv 20 = 6,860 · Lv 30 = 22,391 · Lv 42 = 74,711 · Lv 50 = 157,442.
//
// Each skill has:
//   order (where it sits in lists), built (false = listed, but "Not in the game yet"),
//   combat (true = counts toward your combat level)
//   name, emoji, color (for its XP bar and pop-ups)
//   everyLevel: what you get from EVERY level (shown in the skill guide)
//   guide():    the list of special unlocks, as [{ level, text }].
//               It reads the other data files, so changing (say) when Boil unlocks
//               in data/cooking.js updates the guide by itself.
// ============================================================
window.FUP = window.FUP || {};

FUP.skillData = {
  maxLevel: 50,
  xpBase: 200,   // was 80 (v0.38)
  xpDoubleEvery: 8,
  xpOffset: 0.85,

  // How the XP pop-ups and the level-up banner behave
  display: {
    popSeconds: 1.4,      // how long a "+12 XP" pop-up floats
    bannerSeconds: 3.5,   // how long the LEVEL UP banner stays (tap it to close sooner)
  },

  skills: {
    cooking: {
      order: 5, built: true,
      name: 'Cooking', emoji: '🍳', color: FUP.look.num('y2'),
      everyLevel: () => `Every level: you burn recipes less (never at recipe level +${FUP.cookingData.stopBurnAfter}). A dish's stars come from its recipe.`,
      guide: () => {
        const d = FUP.cookingData, out = [];
        const start = Object.values(d.methods).filter(m => m.unlock <= 1).map(m => `${m.emoji} ${m.name}`).join(' and ');
        out.push({ level: 1, text: `Cook with ${start}, ${d.slotsByLevel[0].slots} ingredients at a time` });
        for (const m of Object.values(d.methods)) if (m.unlock > 1) out.push({ level: m.unlock, text: `New cooking method: ${m.emoji} ${m.name}` });
        for (const s of d.slotsByLevel) if (s.level > 1) out.push({ level: s.level, text: `Cook with ${s.slots} ingredients at once` });
        // Every recipe, named (secret ones stay ??? until you discover them)
        for (const r of FUP.recipeData.list) {
          const seen = FUP.cooking.isVisible(r);
          out.push({ level: r.level, text: seen ? `📜 Recipe: ${r.name}` : '🔮 Secret recipe: ??? (find it by experimenting)' });
        }
        return out.sort((a, b) => a.level - b.level);
      },
    },
    melee: {
      order: 1, built: true, combat: true,
      name: 'Melee', emoji: '⚔️', color: FUP.look.num('r3'),
      everyLevel: () => {
        const p = FUP.balance.playerStats;
        return `Every level: +${p.hpPerLvl} max HP, +${p.atkPerLvl} ATK, +${p.defPerLvl} DEF (from your next fight).`;
      },
      guide: () => {
        const out = FUP.balance.limitBreaks.map(l => ({ level: l.level, text: `⚡ Limit Break: ${l.name} (${l.desc})` }));
        // Weapon skills (data/weapons.js), in the fight's Skills menu
        for (const sk of FUP.weapons[FUP.run.weapon].skills || []) out.push({ level: sk.level, text: `🗡️ Skill: ${sk.name} (${sk.desc})` });
        for (const p of FUP.unlockData.perks.melee) out.push({ level: p.level, text: `⭐ ${p.name}: ${p.text}` });
        // Gear you can wear (`req` in data/gear.js). You can buy it earlier.
        for (const it of Object.values(FUP.gearData.items)) {
          const lv = it.req && it.req.skills && it.req.skills.melee;
          if (!lv) continue;
          out.push({ level: lv, text: `🗡️ Wear the ${it.names ? it.names[FUP.run.weapon] : it.name} (+${it.stats.atk} ATK)` });
        }
        return out;
      },
    },
    gardening: {
      order: 6, built: true,
      name: 'Gardening', emoji: '🌱', color: FUP.look.num('g4'),
      everyLevel: () => `Every level: crops grow ${Math.round(FUP.gardenData.fasterPerLevel * 100)}% faster (up to ${Math.round((1 - FUP.gardenData.minGrowShare) * 100)}% faster).`,
      guide: () => {
        const G = FUP.gardenData, out = [];
        for (const [id, c] of Object.entries(G.crops)) out.push({ level: c.level, text: `Grow ${FUP.ingredients[id].emoji} ${FUP.ingredients[id].name}` });
        for (let lv = G.bonusYieldEvery; lv <= FUP.skillData.maxLevel; lv += G.bonusYieldEvery) {
          out.push({ level: lv, text: `Harvests give up to ${G.yieldMax + lv / G.bonusYieldEvery} (was ${G.yieldMax + lv / G.bonusYieldEvery - 1})` });
        }
        for (const p of FUP.unlockData.perks.gardening) out.push({ level: p.level, text: `⭐ ${p.name}: ${p.text}` });
        return out;
      },
    },
    rizz: {
      order: 4, built: true,
      name: 'Rizz', emoji: '😎', color: FUP.look.num('p2'),
      everyLevel: () => {
        const v = FUP.villageData;
        return `Every level: +${Math.round(FUP.balance.rizzPerLevel * 100)}% to Charm and Roast, +${Math.round(v.haggle.perLevel * 100)}% to haggle, ${Math.round(v.rizzDiscountPerLevel * 100)}% better shop prices (up to ${Math.round(v.rizzDiscountMax * 100)}%).`;
      },
      guide: () => {
        const v = FUP.villageData;
        const capLevel = Math.ceil(v.rizzDiscountMax / v.rizzDiscountPerLevel);
        const U = FUP.unlockData, M = U.rizzMoves, pct = x => Math.round(x * 100) + '%';
        const out = [
          { level: 1, text: '💕 Charm (enemy leaves) and 🔥 Roast (enemy ATK down)' },
          { level: capLevel, text: `Best shop prices: ${pct(v.rizzDiscountMax)} off` },
          { level: M.sweetTalk.level, text: `${M.sweetTalk.emoji} ${M.sweetTalk.name}: an enemy gives you one of its things` },
          { level: M.hype.level, text: `${M.hype.emoji} ${M.hype.name}: your ATK +${pct(M.hype.atkMult - 1)} for ${M.hype.turns} turns` },
          { level: M.charmMiniBoss.level, text: '💕 Charm works on mini-bosses (not real bosses)' },
          { level: v.riddleHalfPriceRizz, text: "👨‍🍳 Chef Marrowbone's riddles are half price" },
        ];
        // Hooded Hank's secret item shows here once Hank exists (Forest side rooms, 18.6 step 5)
        if (U.hankBuilt) out.push({ level: U.hankSecretItemRizz, text: '🧥 Hooded Hank shows you a secret extra item' });
        for (const t of FUP.forestData.toll.payByRizz) if (t.level > 1) out.push({ level: t.level, text: t.pay ? `🧌 Goblin toll drops to ${pct(t.pay)}` : '⭐ Living Legend: the goblin toll is free' });
        for (const lv of U.secretLevels) out.push({ level: lv, text: '😎 Villagers tell you secrets (tips, gifts, discounts)' });
        for (const p of U.perks.rizz) out.push({ level: p.level, text: `⭐ ${p.name}: ${p.text}` });
        return out;
      },
    },
  },
};

// ---------- Skills that are listed but have little or nothing to do yet ----------
// Their special unlocks are just their perks in data/unlocks.js (none yet).
(() => {
  const perkGuide = id => () => ((FUP.unlockData.perks || {})[id] || []).map(p => ({ level: p.level, text: '\u2b50 ' + p.name + ': ' + p.text }));
  const soon = (id, what) => () => [{ level: 1, text: `Coming soon: ${what}` }, ...perkGuide(id)()];
  const N = k => FUP.look.num(k), S = FUP.skillData.skills, notYet = 'Not in the game yet.';
  S.ranged   = { order: 2,  built: false, combat: true, name: 'Ranged',   emoji: '🎯', color: N('x'),  everyLevel: () => 'Every level: +0.6 Ranged ATK.', guide: perkGuide('ranged') };
  S.magic    = { order: 3,  built: false, combat: true, name: 'Magic',    emoji: '✨', color: N('p1'), everyLevel: () => notYet, guide: perkGuide('magic') };
  S.fishing  = { order: 7,  built: true,  name: 'Fishing',  emoji: '🎣', color: N('b3'), everyLevel: () => 'Every level: the catch bar gets a little bigger.', guide: () => {
      const out = [];
      for (const [sid, s] of Object.entries(FUP.fishData.spots)) for (const id of Object.keys(s.fish)) {
        out.push({ level: FUP.fishData.fish[id].level, text: `${FUP.ingredients[id].emoji} Catch: ${FUP.ingredients[id].name} (${s.name})` });
      }
      return [...out, ...perkGuide('fishing')()];
    } };
  S.building = { order: 8,  built: true,  name: 'Building', emoji: '🔨', color: N('w4'), everyLevel: () => 'Every level: closer to bigger things to build. XP comes from sawing planks and from buying things to build.',
    guide: () => {
      const out = [{ level: 1, text: `🪚 Saw ${FUP.placeData.plankBark} Bark into a Plank at the sawhorse (next to the Carpenter)` }];
      for (const it of Object.values(FUP.placeData.items).filter(x => !x.noShop && x.source !== 'market')) out.push({ level: (it.req && it.req.skills && it.req.skills.building) || 1, text: `${it.emoji} Build: ${it.name}` });
      for (const t of FUP.stallData.tiers) if (t.req) out.push({ level: t.req.skills.building, text: `🏪 Stall upgrade: ${t.name} (${t.blurb})` });
      return [...out, ...perkGuide('building')()];
    } };
  S.mining   = { order: 9,  built: false, name: 'Mining',   emoji: '⛏️', color: N('s2'), everyLevel: () => notYet, guide: perkGuide('mining') };
  S.smithing = { order: 10, built: false, name: 'Smithing', emoji: '⚒️', color: N('r2'), everyLevel: () => notYet, guide: perkGuide('smithing') };
  FUP.skillData.notBuiltText = notYet;
})();
