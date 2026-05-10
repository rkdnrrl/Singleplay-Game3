(function () {
  'use strict';

  /* ── 절차적 아이템 (희귀도 = 이름 멋짐·예쁨 점수 기반) ─── */
  const RARITY_LABEL = { common: '일반', rare: '희귀', epic: '에픽', legendary: '전설' };

  /** 이름에 걸리면 희귀도 점수(prestige)에 가산 */
  const NAME_PRESTIGE_LEGEND = [
    '블랙홀', '평행우주', '다차원', '오메가', '퀀텀', '다크매터', '멸망한 행성', '암흑물질',
  ];
  const NAME_PRESTIGE_EPIC = [
    '중성자', '펄사', '성간', '반중력', '양자', '고대', '외계', '프로토타입', '불완전',
    '인공물', '모듈', '회로',
  ];
  const NAME_PRESTIGE_RARE = [
    '네뷸라', '허블', '플라즈마', '이온', '광자', '위성', '유물', '전쟁터', '조각난',
  ];
  /** 시적인·반짝이는 느낌 */
  const NAME_PRESTIGE_PRETTY = [
    '성운', '은하', '솔라', '프리즘', '클러스터', '코어', '샤드', '결정', '해파리', '돌고래',
    '포식자', '상어', '문어',
  ];
  /** 이름이 밋밋해지는 단어 */
  const NAME_PRESTIGE_DRAB = ['쓰레기', '더미', '녹슨', '잔해', '(손상)'];

  /** API·게임 로직용 단일 종류 (이름은 전 카테고리 단어 혼합) */
  const UNIFIED_TYPE = 'cosmic';
  const SILHOUETTE_TYPES = ['fish', 'creature', 'artifact', 'crystal', 'debris'];

  const NAME_PARTS = {
    fish: {
      pre:  ['성운', '네뷸라', '이온', '플라즈마', '펄사', '광자', '허블', '암흑물질', '중성자'],
      core: ['피라냐', '청어', '고등어', '멸치', '문어', '해파리', '상어', '오징어', '가자미', '우럭'],
      post: [' 유체', ' 아종', ' α형', ' β형', ' (미기록)', ' 표본', ''],
    },
    creature: {
      pre:  ['반중력', '양자', '다차원', '평행우주', '블랙홀', '성간', '고대'],
      core: ['플랑크톤', '포식자', '기생체', '돌고래', '해파리', '포자', '유기체'],
      post: [' 번식군', ' 군체', ' 개체', ' -7세대', ''],
    },
    artifact: {
      pre:  ['위성', '고대', '멸망한 행성', '외계', '조각난', '불완전'],
      core: ['파편', '석판', '회로', '모듈', '유물', '인공물', '잔해', '냉장고'],
      post: [' MK-Ⅱ', ' (손상)', ' 프로토타입', ''],
    },
    crystal: {
      pre:  ['우주', '퀀텀', '다크매터', '오메가', '솔라', '은하'],
      core: ['결정', '코어', '샤드', '프리즘', '클러스터'],
      post: [' α', ' Ω', ' (공명)', ''],
    },
    debris: {
      pre:  ['우주', '궤도', '전쟁터', '버려진', '녹슨'],
      core: ['쓰레기', '드론', '패널', '엔진', '컨테이너', '위성조각'],
      post: [' 더미', ' 묶음', ''],
    },
  };

  /** 이름 토큰 → 픽셀 실루엣 종류 (fish·creature·artifact·crystal·debris) */
  const FRAGMENT_SILHOUETTE = (() => {
    const m = {};
    Object.keys(NAME_PARTS).forEach((cat) => {
      const p = NAME_PARTS[cat];
      [p.pre, p.core, p.post].forEach((arr) => {
        arr.forEach((s) => {
          const t = String(s).trim();
          if (t) m[t] = cat;
        });
      });
    });
    return m;
  })();

  function hashWordSilhouette(word) {
    let h = 2166136261;
    const s = String(word);
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return SILHOUETTE_TYPES[h % SILHOUETTE_TYPES.length];
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function namePartsTrim(arr) {
    return arr.map((s) => String(s).trim()).filter(Boolean);
  }

  function cores(cat) {
    return namePartsTrim(NAME_PARTS[cat].core);
  }

  function pres(cat) {
    return namePartsTrim(NAME_PARTS[cat].pre);
  }

  function posts(cat) {
    return namePartsTrim(NAME_PARTS[cat].post);
  }

  function pickDistinct(pool, avoid) {
    const a = String(avoid || '');
    const filt = pool.filter((x) => x !== a);
    return pick(filt.length ? filt : pool);
  }

  /** 풀에 맞게 조사·어미만 정리 (멋대로 잘라내지 않음) */
  function normSilWord(raw) {
    const w = String(raw || '').trim();
    if (!w) return '';
    if (FRAGMENT_SILHOUETTE[w]) return w;
    const josa1 = ['가', '이', '은', '는', '을', '를'];
    const last = w[w.length - 1];
    if (w.length >= 2 && josa1.indexOf(last) >= 0) {
      const cut = w.slice(0, -1);
      if (FRAGMENT_SILHOUETTE[cut]) return cut;
    }
    const josa2 = ['으로', '에서'];
    for (let i = 0; i < josa2.length; i += 1) {
      const p = josa2[i];
      if (w.length > p.length && w.endsWith(p)) {
        const cut = w.slice(0, -p.length);
        if (FRAGMENT_SILHOUETTE[cut]) return cut;
      }
    }
    return w;
  }

  /**
   * 픽셀 합성 순서 [오른쪽·앞, …, 왼쪽·뒤].
   * 문장형 이름이면 주어·수식과 본체 순서를 바로잡고, 아니면 null.
   */
  function silhouetteWordOrderFromName(name) {
    const n = String(name || '').trim();
    if (!n) return null;

    const pair = (m, flip) => (flip ? [normSilWord(m[2]), normSilWord(m[1])] : [normSilWord(m[1]), normSilWord(m[2])]);
    let m = n.match(/^조각난 (.+?)의 일부$/);
    if (m) return [normSilWord(m[1])].filter(Boolean);
    m = n.match(/^(.+?)가\s*된\s+(.+)$/);
    if (m) return pair(m, false).filter(Boolean);
    m = n.match(/^(.+?)이\s*된\s+(.+)$/);
    if (m) return pair(m, false).filter(Boolean);
    m = n.match(/^(.+?)의 (.+)$/);
    if (m) return pair(m, true).filter(Boolean);
    m = n.match(/^(.+?)형 (.+)$/);
    if (m) return pair(m, true).filter(Boolean);
    m = n.match(/^(.+?) 같은 (.+)$/);
    if (m) return pair(m, true).filter(Boolean);
    m = n.match(/^(.+?)에서\s*온\s+(.+)$/);
    if (m) return pair(m, true).filter(Boolean);
    m = n.match(/^(.+?)에 붙은 (.+)$/);
    if (m) return pair(m, true).filter(Boolean);
    m = n.match(/^(.+?) 속의 (.+)$/);
    if (m) return pair(m, true).filter(Boolean);
    m = n.match(/^(.+?)에 갇힌 (.+)$/);
    if (m) return pair(m, true).filter(Boolean);
    m = n.match(/^(.+?)와 숨어든 (.+)$/);
    if (m) return pair(m, false).filter(Boolean);
    m = n.match(/^(.+?) 뒤에 숨은 (.+)$/);
    if (m) return pair(m, false).filter(Boolean);
    m = n.match(/^버려진 (.+)$/);
    if (m) return [normSilWord(m[1])].filter(Boolean);
    m = n.match(/^녹슨 (.+)$/);
    if (m) return [normSilWord(m[1])].filter(Boolean);
    m = n.match(/^우주에서 떨어진 (.+)$/);
    if (m) return [normSilWord(m[1])].filter(Boolean);
    return null;
  }

  /** 자연스러운 한국어 문장형 (예: 포자가 된 피라냐) */
  function generateCatchName() {
    const cf = cores('fish');
    const cc = cores('creature');
    const ca = cores('artifact');
    const cr = cores('crystal');
    const cd = cores('debris');
    const pf = pres('fish');
    const pc = pres('creature');
    const pa = pres('artifact');
    const pr = pres('crystal');
    const pd = pres('debris');
    const sf = posts('fish');
    const sr = posts('crystal');
    const allLiving = cf.concat(cc);
    const allPre = pf.concat(pc, pa, pr, pd);
    const artCryDeb = ca.concat(cr, cd);

    const builders = [
      () => {
        const a = pick(cc);
        const b = pickDistinct(cf, a);
        return `${a}가 된 ${b}`;
      },
      () => {
        const a = pick(cf);
        const b = pickDistinct(cc, a);
        return `${a}가 된 ${b}`;
      },
      () => `${pick(allPre)}의 ${pick(allLiving)}`,
      () => {
        const mod = pick(pc.concat(pf));
        const b = pick(artCryDeb);
        return `${mod}형 ${b}`;
      },
      () => `${pick(cc)} 같은 ${pick(cf)}`,
      () => `${pick(pa.concat(pd, pr))}에서 온 ${pick(allLiving)}`,
      () => `${pick(ca)}에 붙은 ${pick(allLiving)}`,
      () => `${pick(cr)} 속의 ${pick(allLiving)}`,
      () => `${pick(ca)}에 갇힌 ${pick(allLiving)}`,
      () => `${pick(cf)}와 숨어든 ${pick(cd)}`,
      () => `${pick(cf)} 뒤에 숨은 ${pick(ca)}`,
      () => `조각난 ${pick(ca)}의 일부`,
      () => `버려진 ${pick(ca.concat(cd))}`,
      () => `녹슨 ${pick(cd)}`,
      () => `우주에서 떨어진 ${pick(ca.concat(cd))}`,
      () => {
        const pre = pick(pf);
        const c = pickDistinct(cf, pre);
        const po = sf.length ? pick(sf) : '';
        return po ? `${pre} ${c} ${po}` : `${pre} ${c}`;
      },
      () => {
        const pre = pick(pr);
        const c = pickDistinct(cr, pre);
        const po = sr.length ? pick(sr) : '';
        return po ? `${pre} ${c} ${po}` : `${pre} ${c}`;
      },
      () => `${pick(pd)} ${pick(cd)}`,
      () => `${pick(pc)} ${pick(cc)}`,
    ];

    let name = '';
    for (let guard = 0; guard < 16; guard += 1) {
      name = pick(builders)();
      if (name && name.length <= 42) break;
    }
    return name || '미상 유체';
  }

  /** 배경용: 물고기·해양 크리처 단어만 (우주 잔해·유물 접두는 제외) */
  function generateBackgroundMarineName() {
    const cf = cores('fish');
    const ccAll = cores('creature');
    const marineCreature = ccAll.filter((w) =>
      ['플랑크톤', '포식자', '돌고래', '해파리', '기생체'].indexOf(w) >= 0,
    );
    const cc = marineCreature.length ? marineCreature : ccAll;
    const pf = pres('fish');
    const pc = pres('creature');
    const sf = posts('fish');
    const pre = pf.concat(pc);
    const living = cf.concat(cc);

    const whaleLike = ['돌고래', '범고래'];

    const builders = [
      () => {
        const a = pick(cc);
        const b = pickDistinct(cf, a);
        return `${a}가 된 ${b}`;
      },
      () => {
        const a = pick(cf);
        const b = pickDistinct(cc, a);
        return `${a}가 된 ${b}`;
      },
      () => `${pick(whaleLike)}가 된 ${pick(cf)}`,
      () => `${pick(whaleLike)} 같은 ${pick(cf)}`,
      () => `${pick(pre)}의 ${pick(living)}`,
      () => `${pick(cc)} 같은 ${pick(cf)}`,
      () => `${pick(pf.concat(pc))}에서 온 ${pick(living)}`,
      () => {
        const mod = pick(pc.concat(pf));
        const b = pick(cf);
        return `${mod}형 ${b}`;
      },
      () => {
        const pre1 = pick(pf);
        const c = pickDistinct(cf, pre1);
        const po = sf.length ? pick(sf) : '';
        return po ? `${pre1} ${c} ${po}`.trim() : `${pre1} ${c}`;
      },
    ];

    let name = '';
    for (let guard = 0; guard < 16; guard += 1) {
      name = pick(builders)();
      if (name && name.length <= 42) break;
    }
    return name || `${pick(pf)} ${pick(cf)}`;
  }

  /** 키워드·기호만 반영 (길이 보정은 prestigeFromName에서) */
  function intrinsicPrestigeFromName(name) {
    let s = 0;
    let leg = 0;
    for (let i = 0; i < NAME_PRESTIGE_LEGEND.length; i += 1) {
      if (name.includes(NAME_PRESTIGE_LEGEND[i])) leg += 1;
    }
    s += Math.min(44, leg * 24);

    for (let i = 0; i < NAME_PRESTIGE_EPIC.length; i += 1) {
      if (name.includes(NAME_PRESTIGE_EPIC[i])) s += 11;
    }
    for (let i = 0; i < NAME_PRESTIGE_RARE.length; i += 1) {
      if (name.includes(NAME_PRESTIGE_RARE[i])) s += 7;
    }
    for (let i = 0; i < NAME_PRESTIGE_PRETTY.length; i += 1) {
      if (name.includes(NAME_PRESTIGE_PRETTY[i])) s += 5;
    }
    for (let i = 0; i < NAME_PRESTIGE_DRAB.length; i += 1) {
      if (name.includes(NAME_PRESTIGE_DRAB[i])) s -= 14;
    }

    if (/[αβΩ]/.test(name)) s += 11;
    if (/Ⅱ/.test(name)) s += 9;
    if (name.includes('(미기록)')) s += 9;
    if (name.includes('(공명)')) s += 10;
    if (name.includes('-7세대')) s += 8;

    return s;
  }

  /**
   * 0~100: 짧은데 시그널이 강하면 ↑, 긴데 멋진 단어 밀도가 낮으면 ↓
   */
  function prestigeFromName(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return 0;

    let s = intrinsicPrestigeFromName(trimmed);
    const words = trimmed.split(/\s+/).filter(Boolean);
    const w = words.length;
    const c = [...trimmed].length;
    const perWord = s / Math.max(1, w);

    if (w <= 2 && s >= 22) {
      s += 18;
    } else if (w === 3 && perWord >= 10) {
      s += 14;
    } else if (w <= 4 && perWord >= 12) {
      s += 10;
    } else if (w <= 4 && perWord >= 8) {
      s += 5;
    }

    if (w >= 5 && perWord < 6) {
      s -= Math.min(38, (w - 4) * 9 + (perWord < 3.5 ? 14 : 0));
    }
    if (w >= 6 && s < 28) {
      s -= Math.min(22, (w - 5) * 6);
    }

    if (c >= 22 && perWord < 5.5) {
      s -= Math.min(20, Math.floor((c - 18) / 3) * 4);
    }

    if (w <= 2 && s < 10) {
      s -= 6;
    }

    return Math.max(0, Math.min(100, s));
  }

  /** prestige + 약간의 랜덤으로 최종 희귀도 */
  function rarityFromName(name) {
    const p = prestigeFromName(name);
    const noise = (Math.random() - 0.5) * 16;
    const t = Math.max(0, Math.min(100, p + noise)) / 100;

    const wCommon = Math.max(3, 76 * (1 - t * 0.9));
    const wRare = 14 + t * 36;
    const wEpic = 7 + t * 40;
    const wLeg = 1 + t * 52;

    let r = Math.random() * (wCommon + wRare + wEpic + wLeg);
    if ((r -= wCommon) <= 0) return 'common';
    if ((r -= wRare) <= 0) return 'rare';
    if ((r -= wEpic) <= 0) return 'epic';
    return 'legendary';
  }

  function sizeRangeForRarity(rarity) {
    const R = {
      common:    [3, 38],
      rare:      [22, 110],
      epic:      [55, 380],
      legendary: [180, 980],
    };
    return R[rarity] || R.common;
  }

  function rollSize(rarity) {
    const [lo, hi] = sizeRangeForRarity(rarity);
    const u = Math.random();
    const skew = rarity === 'legendary' ? 0.65 : rarity === 'epic' ? 0.55 : 0.45;
    const t = Math.pow(u, skew);
    return +((lo + t * (hi - lo)) * (0.92 + Math.random() * 0.08)).toFixed(1);
  }

  function computeCoinValue(rarity, size, type) {
    const base = { common: 5, rare: 28, epic: 95, legendary: 420 }[rarity] || 5;
    const [lo, hi] = sizeRangeForRarity(rarity);
    const mid = (lo + hi) / 2;
    const sizeBoost = Math.pow(Math.max(0.35, size / mid), 0.5);
    const typeMul = 1;
    const jitter = 0.88 + Math.random() * 0.26;
    const raw = base * sizeBoost * typeMul * jitter;
    const rounded = Math.round(raw);
    return Math.max(rarity === 'legendary' ? 120 : rarity === 'epic' ? 35 : rarity === 'rare' ? 8 : 2, rounded);
  }

  /* ── 픽셀 스프라이트 (DB JSON + 화면 표시) ───────────── */
  /** 빈 칸 — 페이지 배경과 동일(#08081a)이라 밝은 테두리·박스가 안 보임 */
  const PIXEL_MAT = '#08081a';
  /** 인벤·이모지 샘플링 그리드 */
  const PIXEL_GRID_W = 32;
  const PIXEL_GRID_H = 32;

  function pixelPaintColor(hex, cidx) {
    if (cidx === 0) return PIXEL_MAT;
    if (!hex || typeof hex !== 'string') return PIXEL_MAT;
    const h = hex.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(h)) return PIXEL_MAT;
    const r = parseInt(h.slice(1, 3), 16) / 255;
    const g = parseInt(h.slice(3, 5), 16) / 255;
    const b = parseInt(h.slice(5, 7), 16) / 255;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const cap = cidx === 0 ? 0.4 : cidx >= 5 ? 0.82 : 0.58;
    if (L <= cap) return h.toLowerCase();
    const f = cap / L;
    const rr = Math.min(255, Math.round(r * f * 255));
    const gg = Math.min(255, Math.round(g * f * 255));
    const bb = Math.min(255, Math.round(b * f * 255));
    return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
  }

  function hashCatchSeed(item) {
    const s = `${item.name}\0${item.size}\0${item.rarity}\0${item.type}`;
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** 픽셀: 같은 이름이면 동일 이모지·동일 샘플링 */
  function hashPixelArtSeed(item) {
    const s = `${String(item.name || '')}\0fish`;
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** 이름 키워드 → 이모지 (긴 키워드 우선) */
  const EMOJI_BY_NAME_KEYWORD = [
    ['플랑크톤', '🦠'],
    ['돌고래', '🐬'],
    ['범고래', '🐋'],
    ['쭈꾸미', '🐙'],
    ['오징어', '🦑'],
    ['문어', '🐙'],
    ['해파리', '🪼'],
    ['낙지', '🐙'],
    ['상어', '🦈'],
    ['고래', '🐋'],
    ['물고기', '🐟'],
    ['물개', '🦭'],
    ['거북', '🐢'],
    ['조개', '🦪'],
    ['새우', '🦐'],
    ['가재', '🦞'],
    ['게', '🦀'],
    ['민물', '🐠'],
    ['바다', '🌊'],
    ['수중', '🐟'],
    ['유체', '🫧'],
    ['포식자', '🦈'],
    ['피라냐', '🐠'],
    ['멸치', '🐟'],
    ['청어', '🐟'],
    ['고등어', '🐟'],
    ['가자미', '🐡'],
    ['우럭', '🐟'],
    ['아귀', '🐟'],
    ['연어', '🐟'],
    ['참치', '🐟'],
    ['삼치', '🐟'],
    ['지느러미', '🐟'],
    ['성운', '🌌'],
    ['네뷸라', '🌌'],
    ['결정', '💎'],
    ['코어', '🔮'],
    ['유물', '🏺'],
    ['잔해', '🛰️'],
    ['쓰레기', '🗑️'],
  ];

  const EMOJI_FALLBACK_COSMIC = ['🐠', '🐡', '🦑', '🐙', '🪼', '🐬', '🐋', '🐟', '🦈', '🌊', '✨', '🌀'];
  const EMOJI_FALLBACK_MARINE = ['🐠', '🐡', '🐟', '🐬', '🐋', '🦈', '🪼', '🐙', '🦑', '🌊', '🦭', '🐳'];

  function pickEmojiForItem(name, seed, marineOnly) {
    const n = String(name || '');
    const pool = marineOnly ? EMOJI_FALLBACK_MARINE : EMOJI_FALLBACK_COSMIC;
    for (let i = 0; i < EMOJI_BY_NAME_KEYWORD.length; i += 1) {
      const kw = EMOJI_BY_NAME_KEYWORD[i][0];
      const em = EMOJI_BY_NAME_KEYWORD[i][1];
      if (n.indexOf(kw) >= 0) return em;
    }
    return pool[seed % pool.length];
  }

  function hexFromRgbByte(r, g, b) {
    const rr = r & 255;
    const gg = g & 255;
    const bb = b & 255;
    return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
  }

  /** 3비트 양자화(32단계) — 색 차이를 더 살림 */
  function quantRgbKey(r, g, b) {
    const q = (v) => (v >> 3) << 3;
    return `${q(r)},${q(g)},${q(b)}`;
  }

  function colorLikeMat(r, g, b, a) {
    if (a < 30) return true;
    const dr = r - 8;
    const dg = g - 8;
    const db = b - 26;
    return dr * dr + dg * dg + db * db < 520;
  }

  function nearestPaletteColorIdx(r, g, b, palette) {
    let best = 1;
    let bestD = 1e12;
    for (let pi = 1; pi < palette.length; pi += 1) {
      const hex = palette[pi];
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
      const pr = parseInt(hex.slice(1, 3), 16);
      const pg = parseInt(hex.slice(3, 5), 16);
      const pb = parseInt(hex.slice(5, 7), 16);
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < bestD) {
        bestD = d;
        best = pi;
      }
    }
    return best;
  }

  /** 이모지를 고해상도에 그린 뒤 축소 샘플 → cells + palette (transformSeed = 이름 기반 미세 변형) */
  function rasterizeEmojiToPixelArt(emoji, w, h, transformSeed) {
    const empty = { w, h, palette: [PIXEL_MAT], cells: new Array(w * h).fill(0), fromEmoji: true };
    const scaleUp = 4;
    const hi = document.createElement('canvas');
    hi.width = w * scaleUp;
    hi.height = h * scaleUp;
    const hctx = hi.getContext('2d');
    if (!hctx) return empty;

    const s = (transformSeed != null ? transformSeed >>> 0 : 0x5bd1e995) >>> 0;
    const mirror = (s & 1) !== 0;
    const ox = ((s >>> 1) & 7) - 3;
    const oy = ((s >>> 4) & 7) - 3;
    const drawScale = 0.92 + ((s >>> 7) & 15) / 100;
    const hueDeg = ((s >>> 11) & 0x1f) - 15;
    const rot = ((((s >>> 16) & 7) - 3) * Math.PI) / 180;
    const sat = 1.06 + ((s >>> 21) & 0xf) / 22;
    const con = 0.97 + ((s >>> 25) & 7) / 45;

    hctx.fillStyle = PIXEL_MAT;
    hctx.fillRect(0, 0, hi.width, hi.height);

    const cx = hi.width / 2;
    const cy = hi.height / 2;
    const fontPx = Math.max(10, Math.floor(hi.height * 0.72));

    hctx.save();
    hctx.translate(cx + ox, cy + oy);
    hctx.rotate(rot);
    hctx.scale(mirror ? -drawScale : drawScale, drawScale);
    const filt = [];
    if (hueDeg !== 0) filt.push(`hue-rotate(${hueDeg}deg)`);
    filt.push(`saturate(${sat.toFixed(3)})`);
    filt.push(`contrast(${con.toFixed(3)})`);
    hctx.filter = filt.join(' ');
    hctx.font = `${fontPx}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`;
    hctx.textAlign = 'center';
    hctx.textBaseline = 'middle';
    hctx.fillText(emoji, 0, 0);
    hctx.restore();

    const lo = document.createElement('canvas');
    lo.width = w;
    lo.height = h;
    const lctx = lo.getContext('2d');
    if (!lctx) return empty;
    lctx.imageSmoothingEnabled = false;
    lctx.drawImage(hi, 0, 0, w, h);

    const data = lctx.getImageData(0, 0, w, h).data;
    const palette = [PIXEL_MAT];
    const keyToIdx = new Map();
    keyToIdx.set(PIXEL_MAT, 0);
    const maxPaletteEntries = 36;
    const cells = new Array(w * h);

    for (let py = 0; py < h; py += 1) {
      for (let px = 0; px < w; px += 1) {
        const di = (py * w + px) * 4;
        const r = data[di];
        const g = data[di + 1];
        const b = data[di + 2];
        const a = data[di + 3];
        if (colorLikeMat(r, g, b, a)) {
          cells[py * w + px] = 0;
          continue;
        }
        const k = quantRgbKey(r, g, b);
        let cidx = keyToIdx.get(k);
        if (cidx == null) {
          if (palette.length < maxPaletteEntries) {
            const parts = k.split(',').map((x) => parseInt(x, 10));
            const hex = hexFromRgbByte(parts[0], parts[1], parts[2]);
            cidx = palette.length;
            palette.push(hex);
            keyToIdx.set(k, cidx);
          } else {
            cidx = nearestPaletteColorIdx(r, g, b, palette);
            keyToIdx.set(k, cidx);
          }
        }
        cells[py * w + px] = cidx;
      }
    }

    return { w, h, palette, cells, fromEmoji: true };
  }

  function generateMarineFloaterPixelArt(item) {
    const w = PIXEL_GRID_W;
    const h = PIXEL_GRID_H;
    const base = hashPixelArtSeed(item);
    const pickSeed = base ^ 0x9e3779b9;
    const emoji = pickEmojiForItem(item.name, pickSeed, true);
    return rasterizeEmojiToPixelArt(emoji, w, h, base);
  }

  function generateCatchPixelArt(item) {
    const w = PIXEL_GRID_W;
    const h = PIXEL_GRID_H;
    const base = hashPixelArtSeed(item);
    const emoji = pickEmojiForItem(item.name, base, false);
    return rasterizeEmojiToPixelArt(emoji, w, h, base);
  }

  /** 보관함 등에서 픽셀 재생성용 최소 필드 */
  function itemStubForArt(row) {
    return {
      name: row.name,
      type: row.type || UNIFIED_TYPE,
      size: row.size != null ? row.size : 20,
      rarity: row.rarity || 'common',
    };
  }

  function mountPixelArt(hostEl, art, cssW, cssH) {
    if (!hostEl || !art || !Array.isArray(art.cells) || !Array.isArray(art.palette)) return;
    const canvas = document.createElement('canvas');
    canvas.width = art.w;
    canvas.height = art.h;
    canvas.className = 'pixel-art-canvas';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = PIXEL_MAT;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < art.cells.length; i += 1) {
      const cidx = art.cells[i];
      const px = i % art.w;
      const py = Math.floor(i / art.w);
      const raw = cidx === 0 ? PIXEL_MAT : (art.palette[cidx] || PIXEL_MAT);
      ctx.fillStyle = art.fromEmoji ? raw.toLowerCase() : pixelPaintColor(raw, cidx);
      ctx.fillRect(px, py, 1, 1);
    }
    const scale = 2;
    canvas.style.width = `${cssW != null ? cssW : art.w * scale}px`;
    canvas.style.height = `${cssH != null ? cssH : art.h * scale}px`;
    canvas.style.imageRendering = 'pixelated';
    hostEl.innerHTML = '';
    hostEl.appendChild(canvas);
  }

  /** 희귀할수록 판정 타이트·속도↑·게이지 벌칙↑ (전설은 매우 어렵게) */
  const MINI_CONFIG = {
    common: {
      zoneRatio: 0.42,
      speed: 48,
      erratic: false,
      erraticChance: 0,
      barRatio: 0.23,
      gainMul: 1.22,
      lossMul: 0.78,
      overlapNeed: 0.28,
    },
    rare: {
      zoneRatio: 0.30,
      speed: 86,
      erratic: false,
      erraticChance: 0.004,
      barRatio: 0.21,
      gainMul: 1.0,
      lossMul: 1.05,
      overlapNeed: 0.36,
    },
    epic: {
      zoneRatio: 0.20,
      speed: 128,
      erratic: true,
      erraticChance: 0.014,
      barRatio: 0.185,
      gainMul: 0.68,
      lossMul: 1.42,
      overlapNeed: 0.44,
    },
    legendary: {
      zoneRatio: 0.11,
      speed: 188,
      erratic: true,
      erraticChance: 0.032,
      barRatio: 0.155,
      gainMul: 0.42,
      lossMul: 2.05,
      overlapNeed: 0.54,
    },
  };

  /** `easyEpic` 테스트 시 에픽·전설 미니게임만 희귀급에 가깝게 완화 */
  const MINI_EPIC_SOFT = {
    epic: {
      zoneRatio: 0.30,
      speed: 86,
      erratic: false,
      erraticChance: 0,
      barRatio: 0.20,
      gainMul: 1.05,
      lossMul: 0.92,
      overlapNeed: 0.32,
    },
    legendary: {
      zoneRatio: 0.26,
      speed: 96,
      erratic: true,
      erraticChance: 0.006,
      barRatio: 0.19,
      gainMul: 0.9,
      lossMul: 1.05,
      overlapNeed: 0.35,
    },
  };

  /* ── DOM ────────────────────────────────────────────── */
  const coinCountEl       = document.getElementById('coinCount');
  const totalCatchesEl    = document.getElementById('totalCatches');
  const castBtn           = document.getElementById('castBtn');
  const statusMsg         = document.getElementById('statusMsg');
  const beamLine          = document.getElementById('beamLine');
  const lureEl            = document.getElementById('lure');
  const minigame          = document.getElementById('minigame');
  const minigameTrack     = document.getElementById('minigameTrack');
  const targetZone        = document.getElementById('targetZone');
  const catchBar          = document.getElementById('catchBar');
  const catchProgressFill = document.getElementById('catchProgressFill');
  const resultCard        = document.getElementById('resultCard');
  const resultSpriteHost  = document.getElementById('resultSpriteHost');
  const resultRarity      = document.getElementById('resultRarity');
  const resultName        = document.getElementById('resultName');
  const resultSize        = document.getElementById('resultSize');
  const resultCoins       = document.getElementById('resultCoins');
  const inventoryList       = document.getElementById('inventoryList');
  const inventoryScrollWrap = document.getElementById('inventoryScrollWrap');
  const sellAllBtn          = document.getElementById('sellAllBtn');

  /* ── 플랫폼 연동 ─────────────────────────────────────── */
  const urlParams   = new URLSearchParams(window.location.search);
  const alpToken    = urlParams.get('token');
  const platformApi = window.__ALP_PLATFORM_API__ || '';
  /** 플랫폼 미니게임 ID — `config.js`에서 `window.__ALP_CATCH_GAME_ID__ = 2` 등으로 덮어쓸 수 있음 */
  const catchGameId = (() => {
    const n = Number(window.__ALP_CATCH_GAME_ID__);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 2;
  })();

  /** 에픽·전설 테스트: 일반 출현 비중↓ · 미니게임 판정 완화. `?easyEpic=1` 또는 `window.__ALP_EASY_EPIC_TEST__` */
  const easyEpicTest =
    urlParams.get('easyEpic') === '1' ||
    urlParams.get('testEpic') === '1' ||
    window.__ALP_EASY_EPIC_TEST__ === true;

  let isLoggedIn   = false;
  let totalCoins   = 0;
  let totalCatches = 0;
  let inventory    = []; // { id, name, type, size, rarity, coins, pixelArt? }
  let isSelling    = false;

  function updateCoinDisplay() {
    if (!coinCountEl) return;
    coinCountEl.textContent = isLoggedIn ? totalCoins.toLocaleString() : '로그인 필요';
  }
  function updateCatchesDisplay() {
    if (totalCatchesEl) totalCatchesEl.textContent = totalCatches.toLocaleString();
  }

  if (alpToken && platformApi) {
    // 내 정보 (코인)
    fetch(`${platformApi}/api/auth/me`, {
      headers: { Authorization: `Bearer ${alpToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          isLoggedIn = true;
          totalCoins = data.user.coins ?? 0;
          updateCoinDisplay();
        }
      })
      .catch(() => {});

    // 총 포획 수
    fetch(`${platformApi}/api/catches/stats`, {
      headers: { Authorization: `Bearer ${alpToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          totalCatches = data.total ?? 0;
          updateCatchesDisplay();
        }
      })
      .catch(() => {});

    // 보관함 로드 (미판매 아이템)
    fetch(`${platformApi}/api/catches/inventory?limit=50`, {
      headers: { Authorization: `Bearer ${alpToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.catches?.length) {
          data.catches.forEach(c => {
            inventory.push({
              id: c.id,
              name: c.itemName,
              type: c.itemType || UNIFIED_TYPE,
              size: c.size != null ? c.size : 20,
              rarity: c.rarity,
              coins: c.coinValue,
              pixelArt: c.pixelArt || null,
            });
          });
          renderInventory();
        }
      })
      .catch(() => {});
  }

  /* ── 별 + 이름 기반 픽셀 오브젝트(배경, 선명하게) ──────── */
  (function initStarsAndPixelFloaters() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars = [];
    let pixelFloaters = [];

    function wrapCoord(v, max) {
      const pad = 80;
      if (v < -pad) return v + max + pad * 2;
      if (v > max + pad) return v - max - pad * 2;
      return v;
    }

    function rasterizePixelArtForBg(art, scale) {
      const c = document.createElement('canvas');
      c.width = art.w * scale;
      c.height = art.h * scale;
      const cctx = c.getContext('2d');
      if (!cctx) return c;
      // 투명 배경: 전체를 매트로 채우면 플로터끼리 겹칠 때 네모난 덮개가 보임
      for (let i = 0; i < art.cells.length; i += 1) {
        const cidx = art.cells[i];
        if (cidx === 0) continue;
        const px = i % art.w;
        const py = (i / art.w) | 0;
        const raw = art.palette[cidx] || PIXEL_MAT;
        cctx.fillStyle = art.fromEmoji ? raw.toLowerCase() : pixelPaintColor(raw, cidx);
        cctx.fillRect(px * scale, py * scale, scale, scale);
      }
      return c;
    }

    /** index 짝수: 해양, 홀수: 우주·잔해 등 일반 이름 */
    function makePixelFloater(index) {
      const marine = (index & 1) === 0;
      const name = marine ? generateBackgroundMarineName() : generateCatchName();
      const rarity = rarityFromName(name);
      const size = rollSize(rarity);
      const item = { name, type: UNIFIED_TYPE, rarity, size };
      const art = marine ? generateMarineFloaterPixelArt(item) : generateCatchPixelArt(item);
      const scale = 2 + (Math.random() < 0.28 ? 1 : 0);
      const bmp = rasterizePixelArtForBg(art, scale);
      const speed = reducedMotion ? 0 : 0.05 + Math.random() * 0.38;
      const ang = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed * (0.5 + Math.random() * 0.55),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: reducedMotion ? 0 : (Math.random() * 0.003 - 0.0015),
        bmp,
        alpha: 0.72 + Math.random() * 0.2,
        halfW: bmp.width / 2,
        halfH: bmp.height / 2,
      };
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 88 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random(),
        da: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
        vx: reducedMotion ? 0 : (Math.random() * 0.06 + 0.008) * (Math.random() < 0.5 ? -1 : 1),
        vy: reducedMotion ? 0 : (Math.random() * 0.05 + 0.006) * (Math.random() < 0.5 ? -1 : 1),
      }));
      const area = canvas.width * canvas.height;
      const n = Math.min(34, Math.max(14, Math.floor(area / 26000)));
      pixelFloaters = Array.from({ length: n }, (_, i) => makePixelFloater(i));
    }

    function drawPixelFloater(f) {
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.translate(Math.round(f.x), Math.round(f.y));
      ctx.rotate(f.rot);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(f.bmp, -f.halfW, -f.halfH);
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.a += s.da;
        if (s.a > 1 || s.a < 0) s.da *= -1;
        s.x = wrapCoord(s.x + s.vx, canvas.width);
        s.y = wrapCoord(s.y + s.vy, canvas.height);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a.toFixed(3)})`;
        ctx.fill();
      });
      pixelFloaters.forEach((f) => {
        f.x = wrapCoord(f.x + f.vx, canvas.width);
        f.y = wrapCoord(f.y + f.vy, canvas.height);
        f.rot += f.rotSpeed;
        drawPixelFloater(f);
      });
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
  })();

  /* ── 아이템 뽑기 ─────────────────────────────────────── */

  /** 이름 없이 희귀도만 랜덤으로 결정 (미니게임 시작 전에 사용)
   *  기본: common 90% / rare 7% / epic 2.5% / legendary 0.5%
   *  easyEpic: common 22% / rare 28% / epic 38% / legendary 12%
   */
  function rollRarity() {
    let wC; let wR; let wE; let wL;
    if (easyEpicTest) {
      wC = 22;
      wR = 28;
      wE = 38;
      wL = 12;
    } else {
      wC = 180;
      wR = 14;
      wE = 5;
      wL = 1;
    }
    let r = Math.random() * (wC + wR + wE + wL);
    if ((r -= wC) <= 0) return 'common';
    if ((r -= wR) <= 0) return 'rare';
    if ((r -= wE) <= 0) return 'epic';
    return 'legendary';
  }

  /** 희귀도가 정해진 후 크기·코인·절차적 이름까지 완성 (AI 폴백용) */
  function rollItemFromRarity(rarity) {
    const name = generateCatchName();
    const size = rollSize(rarity);
    const coins = computeCoinValue(rarity, size, UNIFIED_TYPE);
    return { name, type: UNIFIED_TYPE, rarity, size, coins };
  }

  function rollItem() {
    const name = generateCatchName();
    const rarity = rarityFromName(name);
    const size = rollSize(rarity);
    const coins = computeCoinValue(rarity, size, UNIFIED_TYPE);
    return { name, type: UNIFIED_TYPE, rarity, size, coins };
  }

  /* ── 보관함 ──────────────────────────────────────────── */
  function syncInventoryScrollOverflow() {
    const wrap = inventoryScrollWrap;
    if (!wrap) return;
    if (inventory.length === 0) {
      wrap.classList.remove('has-overflow', 'is-dragging');
      wrap.scrollTop = 0;
      return;
    }
    requestAnimationFrame(() => {
      const overflow = wrap.scrollHeight > wrap.clientHeight + 1;
      wrap.classList.toggle('has-overflow', overflow);
    });
  }

  function renderInventory() {
    if (!inventoryList) return;

    if (inventory.length === 0) {
      inventoryList.innerHTML = '<p class="log-empty">보관함이 비어있습니다</p>';
      if (sellAllBtn) sellAllBtn.classList.add('hidden');
      syncInventoryScrollOverflow();
      return;
    }

    const totalValue = inventory.reduce((s, i) => s + i.coins, 0);
    if (sellAllBtn) {
      sellAllBtn.classList.remove('hidden');
      sellAllBtn.textContent = `전체 팔기 · ${totalValue.toLocaleString()}🪙`;
    }

    inventoryList.innerHTML = '';
    inventory.forEach(item => {
      const canSell = isLoggedIn && item.id;
      const el = document.createElement('div');
      el.className = `inv-item rarity-${item.rarity}`;
      el.innerHTML = `
        <div class="inv-thumb" data-thumb></div>
        <span class="inv-name">${item.name}</span>
        <span class="inv-coins">${item.coins}🪙</span>
        ${canSell
          ? `<button class="inv-sell-btn" data-id="${item.id}">팔기</button>`
          : `<span class="inv-sell-pending">${isLoggedIn ? '저장 중' : '로그인 필요'}</span>`
        }
      `;
      const thumb = el.querySelector('[data-thumb]');
      if (thumb) {
        const art =
          item.pixelArt && item.pixelArt.cells && item.pixelArt.palette
            ? item.pixelArt
            : generateCatchPixelArt(itemStubForArt(item));
        mountPixelArt(thumb, art, 56, 56);
      }
      inventoryList.appendChild(el);
    });
    syncInventoryScrollOverflow();
  }

  async function sellItem(catchId) {
    if (isSelling || !isLoggedIn || !alpToken || !platformApi) return;
    isSelling = true;
    try {
      const res = await fetch(`${platformApi}/api/catches/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${alpToken}` },
        body: JSON.stringify({ ids: [catchId] }),
      });
      if (!res.ok) return;
      const data = await res.json();
      totalCoins = data.totalCoins;
      inventory = inventory.filter(i => i.id !== catchId);
      renderInventory();
      updateCoinDisplay();
    } catch {}
    finally { isSelling = false; }
  }

  async function sellAll() {
    if (isSelling || !isLoggedIn || !alpToken || !platformApi || inventory.length === 0) return;
    const ids = inventory.filter(i => i.id).map(i => i.id);
    if (ids.length === 0) return;
    isSelling = true;
    if (sellAllBtn) sellAllBtn.disabled = true;
    try {
      const res = await fetch(`${platformApi}/api/catches/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${alpToken}` },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) return;
      const data = await res.json();
      totalCoins = data.totalCoins;
      inventory = inventory.filter(i => !ids.includes(i.id));
      renderInventory();
      updateCoinDisplay();
    } catch {}
    finally {
      isSelling = false;
      if (sellAllBtn) sellAllBtn.disabled = false;
    }
  }

  /* ── 게임 상태 ───────────────────────────────────────── */
  let state = 'IDLE';
  let currentItem = null;

  let mini = {
    trackH: 0, zoneH: 0, zoneY: 0,
    barH: 0, barY: 0,
    pressing: false,
    progress: 0,
    targetVY: 0,
    rafId: null,
    lastTime: 0,
    cfg: null,
  };

  /* ── 상태 전환 ───────────────────────────────────────── */
  function goIdle() {
    state = 'IDLE';
    castBtn.classList.remove('hidden');
    statusMsg.classList.add('hidden');
    minigame.classList.add('hidden');
    beamLine.classList.remove('extended');
    lureEl.classList.remove('biting');
    lureEl.textContent = '🔵';
  }

  function goCasting() {
    state = 'CASTING';
    castBtn.classList.add('hidden');
    resultCard.classList.add('hidden');
    showStatus('낚싯줄을 드리우는 중...');
    beamLine.classList.add('extended');

    setTimeout(() => {
      if (state !== 'CASTING') return;
      goWaiting();
    }, 600);
  }

  function goWaiting() {
    state = 'WAITING';
    showStatus('우주의 심연을 기다리는 중 🌌');
    const wait = 2000 + Math.random() * 4000;
    setTimeout(() => {
      if (state !== 'WAITING') return;
      // 미니게임에는 희귀도만 필요 — 이름은 잡은 후 AI가 생성
      currentItem = { rarity: rollRarity() };
      goMinigame();
    }, wait);
  }

  function goMinigame() {
    state = 'MINIGAME';
    lureEl.classList.add('biting');
    showStatus('⚡ 무언가 걸렸다!');
    minigame.classList.remove('hidden');
    startMinigame(currentItem);
  }

  async function goResult(success) {
    if (mini.rafId) cancelAnimationFrame(mini.rafId);
    minigame.classList.add('hidden');
    lureEl.classList.remove('biting');
    beamLine.classList.remove('extended');
    lureEl.textContent = '🔵';

    if (!success) {
      state = 'IDLE';
      showStatus('놓쳤다... 다시 도전!');
      castBtn.classList.remove('hidden');
      return;
    }

    state = 'RESULT';
    const rarity = currentItem.rarity;

    // ── AI로 생명체 생성 (로그인 + rare 이상일 때만, common은 절차적) ──
    let aiData = null;
    if (isLoggedIn && alpToken && platformApi && rarity !== 'common') {
      showStatus('🔍 생명체 분석 중...');
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 5000); // 5초 타임아웃
        const aiRes = await fetch(`${platformApi}/api/ai/catch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${alpToken}`,
          },
          body: JSON.stringify({ rarity }),
          signal: ctrl.signal,
        });
        clearTimeout(tid);
        if (aiRes.ok) {
          aiData = await aiRes.json();
        }
      } catch {
        // 타임아웃 or 네트워크 오류 → 절차적 폴백
      }
    }

    // ── 아이템 완성 (AI 성공 or 절차적 폴백) ──
    let item;
    if (aiData?.name) {
      const type = aiData.type || UNIFIED_TYPE;
      const size = rollSize(rarity);
      const coins = computeCoinValue(rarity, size, type);
      item = { name: aiData.name, type, rarity, size, coins, emoji: aiData.emoji || '' };
    } else {
      item = rollItemFromRarity(rarity);
    }
    currentItem = item;

    showResult(currentItem);
    saveCatch(currentItem);

    setTimeout(() => {
      resultCard.classList.add('hidden');
      goIdle();
    }, 3500);
  }

  /* ── 미니게임 ────────────────────────────────────────── */
  function startMinigame(item) {
    let cfg = MINI_CONFIG[item.rarity] || MINI_CONFIG.common;
    if (easyEpicTest) {
      const soft = MINI_EPIC_SOFT[item.rarity];
      if (soft) cfg = soft;
    }
    mini.cfg = cfg;
    mini.trackH = minigameTrack.clientHeight || 160;
    mini.zoneH  = Math.floor(mini.trackH * cfg.zoneRatio);
    mini.zoneY  = Math.floor((mini.trackH - mini.zoneH) / 2);
    const br = cfg.barRatio != null ? cfg.barRatio : 0.2;
    mini.barH   = Math.floor(mini.trackH * br);
    mini.barY   = mini.trackH - mini.barH;
    mini.progress = 0.5;
    mini.pressing = false;
    mini.targetVY = cfg.speed * (Math.random() < 0.5 ? 1 : -1);
    mini.lastTime = performance.now();

    catchProgressFill.classList.remove('danger');
    renderMinigame();

    if (mini.rafId) cancelAnimationFrame(mini.rafId);
    mini.rafId = requestAnimationFrame(miniLoop);
  }

  function miniLoop(now) {
    const dt = Math.min((now - mini.lastTime) / 1000, 0.05);
    mini.lastTime = now;
    const cfg = mini.cfg;

    mini.zoneY += mini.targetVY * dt;
    if (mini.zoneY <= 0) { mini.zoneY = 0; mini.targetVY *= -1; }
    if (mini.zoneY + mini.zoneH >= mini.trackH) {
      mini.zoneY = mini.trackH - mini.zoneH;
      mini.targetVY *= -1;
    }
    const ech = cfg.erraticChance != null ? cfg.erraticChance : (cfg.erratic ? 0.012 : 0);
    if (cfg.erratic && Math.random() < ech) {
      mini.targetVY = cfg.speed * (Math.random() * 2 - 1);
    }

    const gravity = mini.pressing ? -320 : 280;
    mini.barY = Math.max(0, Math.min(mini.trackH - mini.barH, mini.barY + gravity * dt));

    const barTop = mini.barY, barBot = mini.barY + mini.barH;
    const zoneTop = mini.zoneY, zoneBot = mini.zoneY + mini.zoneH;
    const overlap = Math.min(barBot, zoneBot) - Math.max(barTop, zoneTop);
    const overlapRatio = Math.max(0, overlap) / mini.zoneH;

    const need = cfg.overlapNeed != null ? cfg.overlapNeed : 0.4;
    const catching = overlapRatio > need;
    const gain = (cfg.gainMul != null ? cfg.gainMul : 1) * 0.35;
    const loss = (cfg.lossMul != null ? cfg.lossMul : 1) * 0.25;
    const delta = catching ? gain : -loss;
    mini.progress = Math.max(0, Math.min(1, mini.progress + delta * dt));

    renderMinigame();

    if (mini.progress >= 1) { goResult(true);  return; }
    if (mini.progress <= 0) { goResult(false); return; }

    mini.rafId = requestAnimationFrame(miniLoop);
  }

  function renderMinigame() {
    targetZone.style.top    = `${mini.zoneY}px`;
    targetZone.style.height = `${mini.zoneH}px`;
    catchBar.style.bottom   = `${mini.trackH - mini.barY - mini.barH}px`;
    catchBar.style.height   = `${mini.barH}px`;

    const pct = mini.progress * 100;
    catchProgressFill.style.height = `${pct}%`;
    catchProgressFill.classList.toggle('danger', mini.progress < 0.25);
  }

  function onPress()   { if (state === 'MINIGAME') mini.pressing = true; }
  function onRelease() { mini.pressing = false; }

  document.addEventListener('pointerdown', onPress);
  document.addEventListener('pointerup',   onRelease);
  document.addEventListener('pointercancel', onRelease);
  document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); onPress(); } });
  document.addEventListener('keyup',   e => { if (e.code === 'Space') onRelease(); });

  /* ── 결과 표시 ───────────────────────────────────────── */
  function showResult(item) {
    resultCard.className = `result-card rarity-${item.rarity}`;
    const art = generateCatchPixelArt(item);
    if (resultSpriteHost) {
      mountPixelArt(resultSpriteHost, art, 128, 128);
    }
    resultRarity.className  = `result-rarity rarity-${item.rarity}`;
    resultRarity.textContent = RARITY_LABEL[item.rarity];
    resultName.textContent  = item.name;
    resultSize.textContent  = `${item.size}cm`;
    resultCoins.textContent = `${item.coins}🪙`;
    resultCard.classList.remove('hidden');

    totalCatches += 1;
    updateCatchesDisplay();
  }

  /* ── 서버 저장 + 보관함 추가 ─────────────────────────── */
  async function saveCatch(item) {
    let catchId = null;
    const pixelArt = generateCatchPixelArt(item);

    if (isLoggedIn && alpToken && platformApi) {
      try {
        const res = await fetch(`${platformApi}/api/catches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${alpToken}`,
          },
          body: JSON.stringify({
            itemName:  item.name,
            itemEmoji: item.emoji || '',
            itemType:  item.type,
            rarity:    item.rarity,
            size:      item.size,
            coinValue: item.coins,
            // pixelArt는 서버가 자체 생성 (클라이언트 포맷 불일치 방지)
          }),
        });
        const data = res.ok ? await res.json() : null;
        catchId = data?.catch?.id ?? null;
      } catch {}
    }

    inventory.push({
      id: catchId,
      name: item.name,
      type: item.type,
      size: item.size,
      rarity: item.rarity,
      coins: item.coins,
      pixelArt,
    });
    renderInventory();
  }

  /* ── 유틸 ────────────────────────────────────────────── */
  function showStatus(msg) {
    statusMsg.textContent = msg;
    statusMsg.classList.remove('hidden');
  }

  /* ── 이벤트 ──────────────────────────────────────────── */
  castBtn.addEventListener('click', () => {
    if (state === 'IDLE') goCasting();
  });

  // 개별 팔기 (이벤트 위임)
  if (inventoryList) {
    inventoryList.addEventListener('click', e => {
      const btn = e.target.closest('.inv-sell-btn');
      if (!btn || isSelling) return;
      const id = btn.dataset.id;
      if (id) sellItem(id);
    });
  }

  // 전체 팔기
  if (sellAllBtn) {
    sellAllBtn.addEventListener('click', sellAll);
  }

  /* 보관함: 내용이 영역보다 길면 세로 드래그로 스크롤 */
  (function setupInventoryDragScroll() {
    const wrap = inventoryScrollWrap;
    if (!wrap) return;

    let dragging = false;
    let startY = 0;
    let startScroll = 0;
    let ptrId = null;

    wrap.addEventListener(
      'pointerdown',
      (e) => {
        if (!wrap.classList.contains('has-overflow')) return;
        if (e.pointerType !== 'mouse') return;
        if (e.button !== 0) return;
        if (e.target.closest('button, input, a, [role="button"]')) return;
        dragging = true;
        startY = e.clientY;
        startScroll = wrap.scrollTop;
        ptrId = e.pointerId;
        wrap.classList.add('is-dragging');
        try {
          wrap.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      },
      { passive: true }
    );

    wrap.addEventListener(
      'pointermove',
      (e) => {
        if (!dragging || e.pointerId !== ptrId) return;
        wrap.scrollTop = startScroll - (e.clientY - startY);
      },
      { passive: true }
    );

    function endDrag(e) {
      if (ptrId != null && e && e.pointerId !== ptrId) return;
      dragging = false;
      wrap.classList.remove('is-dragging');
      const id = ptrId;
      ptrId = null;
      if (id != null) {
        try {
          wrap.releasePointerCapture(id);
        } catch {
          /* ignore */
        }
      }
    }

    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);
    wrap.addEventListener('lostpointercapture', () => {
      dragging = false;
      ptrId = null;
      wrap.classList.remove('is-dragging');
    });

    window.addEventListener('resize', () => syncInventoryScrollOverflow());
  })();

  /* ── 초기 렌더 ───────────────────────────────────────── */
  updateCoinDisplay();
  updateCatchesDisplay();
  renderInventory();
})();
