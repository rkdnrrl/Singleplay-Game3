(function () {
  'use strict';

  /** 대장장이(Singleplay-Game5)와 공유: 재료 스냅샷 · 제작에 소모된 uid (다른 탭 동기화) */
  const FORGE_MATERIALS_KEY = 'WEB_ALP_SPACE_FISHING_FORGE_V1';
  const FORGE_SPENT_UIDS_KEY = 'WEB_ALP_FORGE_SPENT_UIDS_V1';

  function forgeRandomUid() {
    return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function getForgeSpentSet() {
    try {
      const raw = localStorage.getItem(FORGE_SPENT_UIDS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function itemForgeUid(item) {
    if (item.uid) return item.uid;
    if (item.id != null && item.id !== '') {
      item.uid = `srv-${String(item.id)}`;
      return item.uid;
    }
    item.uid = forgeRandomUid();
    return item.uid;
  }

  function persistForgeMaterials() {
    try {
      const items = inventory.map((i) => {
        const uid = itemForgeUid(i);
        if (!i.uid) i.uid = uid;
        return {
          uid,
          name: i.name,
          rarity: i.rarity,
          size: i.size,
          coins: i.coins,
          serverId: i.id != null ? i.id : null,
        };
      });
      localStorage.setItem(
        FORGE_MATERIALS_KEY,
        JSON.stringify({ v: 1, items, updatedAt: Date.now(), source: 'space-fishing' })
      );
    } catch {
      /* ignore */
    }
  }

  function filterInventoryByForgeSpent() {
    const spent = getForgeSpentSet();
    if (spent.size === 0) return;
    inventory = inventory.filter((i) => !spent.has(itemForgeUid(i)));
  }

  window.addEventListener('storage', (e) => {
    if (e.key !== FORGE_SPENT_UIDS_KEY) return;
    filterInventoryByForgeSpent();
    renderInventory();
  });

  /* ── 절차적 아이템 (희귀도 = 이름 멋짐·예쁨 점수 기반) ─── */
  const RARITY_LABEL = { common: '일반', rare: '희귀', epic: '에픽', legendary: '전설' };

  /** 에픽·전설만 `/api/ai/catch` 사용 (일반·희귀는 절차적) */
  function rarityUsesAiCatch(rarity) {
    return rarity === 'epic' || rarity === 'legendary';
  }

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

  /**
   * 잡기 이름 조합 확장 — 기본 NAME_PARTS 외 수식·종명을 넉넉히 두어
   * `수식어 + 본체` 한 줄만으로도 대략 1만 가지 안팎의 고유 문자열이 나오게 함.
   */
  const NAME_CATCH_MOD_EXT = `
간섭파 잔광 저궤도 고각도 경계층 등온층 유성성 암점흔 위상수 공진층 희박대기 동위원소 방사청 중력렌즈
시공리프트 이차원막 삼차원막 빛의잔류 양자얽힘 광속접근 잔류궤도 간섭대 에너지벨트 플라즈마층
중성대 전하분리 자기장선 중력파속 극초기우주 암흑에너지 우주막대 성간먼지 행성파편 궤도잔류
위성파편 태양풍층 코로나링 헤일로링 드레이크방정식 페르미면 볼츠만층 라그랑주점 힐구역
로쉬한계 동심원궤도 타원근점 원격탐사 초분광 적외잔광 근적외선 중적외선 심적외선 초고해상도
다중주파수 위상배열 간섭계측 동기궤도 정지궤도 극궤도 역행궤도 공전면 경사각 보정궤도
추력벡터 자세제어 추진제잔류 연료증발 냉각막 열차폐 방열판 임계온도 초전도링 양자점
나노구조 미세공동 초미세입자 초분진 응축핵 응고층 대류셀 전하중화 이온화층 플라즈마토러스
`.trim().split(/\s+/).filter(Boolean);

  const NAME_CATCH_BODY_EXT = `
갈치 병어 노래미 도다리 숭어 뱅어 한치 광어 참돔 돌돔 점볼락 뱀장어 송사리 모래무지 은어 향어 빙어
송어 납자루 꺽지 꺽다리 피라미 가물치 동자개 자라 쏘가리 얼룩망둑 참굴바리 참종개 수수미꾸리
민물고기 잉붕어 토종붕어 각시멸 볼락 농어 치어 두만멸 가자미 대구 명태 조기 방어 삼치
가오리 해마 황새치 벨루가 연어 아귀 우럭 임연수어 붕어 잉어 메기 장어 민어 복어 도미
참치 청어 고등어 멸치 전어 전갱이 가재 새우 게 조개 거북 물개 물범 해마초 날치 송사리치
바다뱀 전기뱀장어 은연어 연어치 참황어 황줄돔 줄돔 벵에돔 돌돔치 참돔치 감성돔 돌문어
쭈꾸미 한치체 문어빙어 오징어새우 꽃게 대게 킹크랩 랍스터 가리비 전복 소라 성게 불가사리
`.trim().split(/\s+/).filter(Boolean);

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

  /**
   * 잡기 이름 — 확장 풀(mod×body)로 고유 조합이 대략 1만 가지 안팎.
   * 희귀도 점수는 기존 NAME_PRESTIGE·NAME_PARTS 단어가 그대로 걸리도록 유지.
   */
  function generateCatchName() {
    const allCore = SILHOUETTE_TYPES.flatMap((k) => cores(k));
    const allPre = SILHOUETTE_TYPES.flatMap((k) => pres(k));
    const mods = [...new Set(allPre.concat(NAME_CATCH_MOD_EXT))];
    const bodies = [...new Set(allCore.concat(NAME_CATCH_BODY_EXT))];

    const builders = [
      () => {
        const mod = pick(mods);
        const b = pickDistinct(bodies, mod);
        return `${mod} ${b}`;
      },
      () => pick(bodies),
      () => {
        const cat = pick(SILHOUETTE_TYPES);
        const pr = pres(cat);
        const co = cores(cat);
        return `${pick(pr)} ${pick(co)}`;
      },
      () => {
        const cat = pick(SILHOUETTE_TYPES);
        const c = pick(cores(cat));
        const tails = namePartsTrim(NAME_PARTS[cat].post);
        if (tails.length === 0 || Math.random() > 0.32) return c;
        return `${c} ${pick(tails)}`;
      },
    ];

    let name = '';
    for (let guard = 0; guard < 24; guard += 1) {
      const fn = Math.random() < 0.72 ? builders[0] : pick(builders.slice(1));
      name = fn();
      if (name && name.length <= 26) break;
    }
    return name || `${pick(mods)} ${pick(bodies)}`;
  }

  /** 배경용: 물고기·해양 생명 — 짧은 1~2어절 */
  function generateBackgroundMarineName() {
    const cf = cores('fish');
    const ccAll = cores('creature');
    const marineCreature = ccAll.filter((w) =>
      ['플랑크톤', '포식자', '돌고래', '해파리', '기생체'].indexOf(w) >= 0,
    );
    const cc = marineCreature.length ? marineCreature : ccAll;
    const pf = pres('fish');
    const pc = pres('creature');

    const builders = [
      () => pick(cf),
      () => `${pick(pf)} ${pick(cf)}`,
      () => `${pick(pc)} ${pick(cf)}`,
      () => `${pick(cf)} ${pick(cc)}`,
    ];

    let name = '';
    for (let guard = 0; guard < 16; guard += 1) {
      name = pick(builders)();
      if (name && name.length <= 16) break;
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
  /** 인벤·화면용 픽셀 샘플링 그리드 */
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

  /** 픽셀: 같은 이름이면 동일 패턴·동일 샘플링 */
  function hashPixelArtSeed(item) {
    const s = `${String(item.name || '')}\0fish`;
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * 스프라이트 URL이 없을 때: 이름·시드 기반 32×32 추상 패턴.
   * marineBias 가 true 면 배경 플로터(해양)용 청록 톤.
   */
  function generateProceduralPixelArtFromItem(item, salt, marineBias) {
    const w = PIXEL_GRID_W;
    const h = PIXEL_GRID_H;
    const seed0 = hashPixelArtSeed(item);
    const seed = (seed0 ^ (salt >>> 0) ^ (marineBias ? 0x51ed4eae : 0)) >>> 0;
    const rng = mulberry32(seed);

    const palette = [PIXEL_MAT];
    const nColors = 10 + ((seed >>> 3) % 5);
    for (let ci = 0; ci < nColors; ci += 1) {
      let r; let g; let b;
      if (marineBias) {
        r = (30 + rng() * 120) | 0;
        g = (80 + rng() * 100) | 0;
        b = (120 + rng() * 135) | 0;
      } else {
        r = (80 + rng() * 160) | 0;
        g = (40 + rng() * 140) | 0;
        b = (140 + rng() * 115) | 0;
      }
      palette.push(hexFromRgbByte(r, g, b));
    }

    const cells = new Array(w * h);
    const cx = (w - 1) / 2;
    const cy = (h - 1) / 2;
    const maxR = Math.min(w, h) * 0.42;

    for (let py = 0; py < h; py += 1) {
      for (let px = 0; px < w; px += 1) {
        const d = Math.hypot(px - cx, py - cy);
        const edge = d / maxR;
        const noise = rng() * 0.55 + (1 - edge) * 0.45;
        if (noise < 0.28 + edge * 0.35) {
          cells[py * w + px] = 0;
        } else {
          cells[py * w + px] = 1 + ((rng() * (palette.length - 1)) | 0);
        }
      }
    }

    return { w, h, palette, cells, fromEmoji: false };
  }

  /**
   * 사용자 제공 PNG/WebP 등 — URL 이미지를 픽셀 그리드로 샘플링.
   * `window.__CATCH_SPRITE_RULES__ = [{ kw: '피라냐', url: 'https://.../x.png' }, ...]`
   * 매칭은 이름 안에서 더 오른쪽에서 끝나는 kw 우선(동률이면 더 긴 kw).
   * 다른 도메인 이미지는 서버에서 CORS(Access-Control-Allow-Origin)가 열려 있어야 함.
   */
  function pickSpriteUrlForItem(name) {
    const rules =
      typeof window !== 'undefined' && Array.isArray(window.__CATCH_SPRITE_RULES__)
        ? window.__CATCH_SPRITE_RULES__
        : null;
    if (!rules || rules.length === 0) return '';
    const n = String(name || '');
    let bestUrl = '';
    let bestEnd = -1;
    let bestKwLen = -1;
    let bestI = Infinity;
    for (let i = 0; i < rules.length; i += 1) {
      const rule = rules[i];
      const kw = rule && rule.kw != null ? String(rule.kw) : '';
      const url = rule && rule.url != null ? String(rule.url).trim() : '';
      if (!kw || !url) continue;
      const pos = n.lastIndexOf(kw);
      if (pos < 0) continue;
      const end = pos + kw.length;
      const kwLen = kw.length;
      if (
        end > bestEnd ||
        (end === bestEnd && kwLen > bestKwLen) ||
        (end === bestEnd && kwLen === bestKwLen && i < bestI)
      ) {
        bestEnd = end;
        bestKwLen = kwLen;
        bestI = i;
        bestUrl = url;
      }
    }
    return bestUrl;
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

  /** DALL-E 이미지 URL(또는 data URL) → 픽셀아트 cells+palette */
  async function rasterizeImageUrlToPixelArt(url, w, h) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(img, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          const palette = [PIXEL_MAT];
          const keyToIdx = new Map();
          keyToIdx.set(PIXEL_MAT, 0);
          const maxP = 24;
          const cells = new Array(w * h);
          for (let i = 0; i < w * h; i += 1) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            const a = data[i * 4 + 3];
            if (colorLikeMat(r, g, b, a)) { cells[i] = 0; continue; }
            const k = quantRgbKey(r, g, b);
            let cidx = keyToIdx.get(k);
            if (cidx == null) {
              if (palette.length < maxP) {
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
            cells[i] = cidx;
          }
          resolve({ w, h, palette, cells });
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function generateMarineFloaterPixelArt(item) {
    const w = PIXEL_GRID_W;
    const h = PIXEL_GRID_H;
    const base = hashPixelArtSeed(item);
    const pickSeed = base ^ 0x9e3779b9;
    const spriteUrl = pickSpriteUrlForItem(item.name);
    if (spriteUrl) {
      const fromImg = await rasterizeImageUrlToPixelArt(spriteUrl, w, h);
      if (fromImg) return fromImg;
    }
    return generateProceduralPixelArtFromItem(item, pickSeed, true);
  }

  async function generateCatchPixelArt(item) {
    const w = PIXEL_GRID_W;
    const h = PIXEL_GRID_H;
    const base = hashPixelArtSeed(item);
    const spriteUrl = pickSpriteUrlForItem(item.name);
    if (spriteUrl) {
      const fromImg = await rasterizeImageUrlToPixelArt(spriteUrl, w, h);
      if (fromImg) return fromImg;
    }
    return generateProceduralPixelArtFromItem(item, base, false);
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

  /** 3D 복셀용 표시 색 (2D 캔버스와 동일 규칙) */
  function voxelDisplayHexForCell(art, cidx) {
    if (cidx === 0) return null;
    const raw = art.palette[cidx] || PIXEL_MAT;
    const s = art.fromEmoji ? String(raw).toLowerCase() : pixelPaintColor(raw, cidx);
    if (typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s)) return s;
    return '#6a6a8a';
  }

  function countSolidVoxels(art) {
    if (!art || !art.cells) return 0;
    let n = 0;
    for (let i = 0; i < art.cells.length; i += 1) {
      if (art.cells[i] !== 0) n += 1;
    }
    return n;
  }

  /** 3D 보기: 각 픽셀을 Y축으로 몇 겹 쌓을지(두께) */
  const VOXEL_EXTRUDE_LAYERS = 4;
  const VOXEL_LAYER_HEIGHT = 0.86;
  const VOXEL_PLAN = 0.9;

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

  /** easy 모드( config 플래그 AND ?easyEpic=1 )일 때 에픽·전설 미니게임만 희귀급에 가깝게 완화 */
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
  const sellConfirmOverlay  = document.getElementById('sellConfirmOverlay');
  const sellConfirmMsg      = document.getElementById('sellConfirmMsg');
  const sellConfirmCancel   = document.getElementById('sellConfirmCancel');
  const sellConfirmOk       = document.getElementById('sellConfirmOk');
  const inventoryDock       = document.getElementById('inventoryDock');
  const voxelViewerOverlay  = document.getElementById('voxelViewerOverlay');
  const voxelViewerCanvasHost = document.getElementById('voxelViewerCanvasHost');
  const voxelViewerTitle    = document.getElementById('voxelViewerTitle');
  const voxelViewerClose    = document.getElementById('voxelViewerClose');

  let sellConfirmPayload = null;
  let voxelViewerCtx = null;
  /** 마우스: 드래그 스크롤 후 뜨는 click 으로 3D가 중복 열리지 않게 */
  let suppressNextInvListClick = false;

  /** 모바일: 미니게임 중 페이지 스크롤·바운스 차단 + 보관함이 터치 가로채기 방지 */
  let minigameScrollLocked = false;
  function minigameTouchMoveBlock(e) {
    e.preventDefault();
  }
  function setMinigameScrollLocked(on) {
    const next = Boolean(on);
    if (next === minigameScrollLocked) return;
    minigameScrollLocked = next;
    document.documentElement.classList.toggle('minigame-active', next);
    if (inventoryDock) inventoryDock.classList.toggle('minigame-paused', next);
    if (next) {
      document.addEventListener('touchmove', minigameTouchMoveBlock, { passive: false });
    } else {
      document.removeEventListener('touchmove', minigameTouchMoveBlock, { passive: false });
    }
  }

  /* ── 플랫폼 연동 ─────────────────────────────────────── */
  const urlParams   = new URLSearchParams(window.location.search);
  const alpToken    = urlParams.get('token');
  const platformApi = window.__ALP_PLATFORM_API__ || '';
  /** 플랫폼 미니게임 ID — `config.js`에서 `window.__ALP_CATCH_GAME_ID__ = 2` 등으로 덮어쓸 수 있음 */
  const catchGameId = (() => {
    const n = Number(window.__ALP_CATCH_GAME_ID__);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 2;
  })();

  /**
   * 에픽·전설 테스트: 비중↑ · 미니게임 완화.
   * **둘 다** 만족할 때만 켜짐 — 배포에서 `__ALP_EASY_EPIC_TEST__` 를 false 두면 `?easyEpic=1` 만으로는 적용 안 됨.
   */
  const easyEpicTest =
    window.__ALP_EASY_EPIC_TEST__ === true &&
    (urlParams.get('easyEpic') === '1' || urlParams.get('testEpic') === '1');

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
          const spent = getForgeSpentSet();
          data.catches.forEach(c => {
            const uid = `srv-${c.id}`;
            if (spent.has(uid)) return;
            inventory.push({
              id: c.id,
              uid,
              name: c.itemName,
              type: c.itemType || UNIFIED_TYPE,
              size: c.size != null ? c.size : 20,
              rarity: c.rarity,
              coins: c.coinValue,
              pixelArt: c.pixelArt || null,
            });
          });
          inventory.sort((a, b) => {
            const na = a.id != null ? Number(a.id) : NaN;
            const nb = b.id != null ? Number(b.id) : NaN;
            if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
            return 0;
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

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobileViewport =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches;
    // 모바일에서는 reduced-motion이 켜져 있어도 배경 오브젝트는 움직이게 유지
    const reducedMotion = prefersReducedMotion && !isMobileViewport;

    let stars = [];
    let pixelFloaters = [];
    let sharedBmps = []; // shared_pixel_arts 에서 로드한 AI 이미지 비트맵

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

    /** base64 이미지 URL → 배경용 캔버스 비트맵 */
    function imageUrlToFloaterBmp(url, size) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = size;
          c.height = size;
          const cctx = c.getContext('2d');
          cctx.imageSmoothingEnabled = false;
          cctx.drawImage(img, 0, 0, size, size);
          resolve(c);
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }

    /** sharedBmps 에서 꺼낸 AI 이미지로 플로터 생성 */
    function makeSharedFloater(bmp, mobileLight) {
      const speedMul = mobileLight ? 0.42 : 1;
      const speed = reducedMotion ? 0 : (0.04 + Math.random() * 0.3) * speedMul;
      const ang = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed * (0.5 + Math.random() * 0.5),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: reducedMotion ? 0 : (Math.random() * 0.002 - 0.001) * speedMul,
        bmp,
        alpha: mobileLight ? 0.55 + Math.random() * 0.2 : 0.78 + Math.random() * 0.18,
        halfW: bmp.width / 2,
        halfH: bmp.height / 2,
      };
    }

    /** index 짝수: 해양, 홀수: 우주·잔해 등 일반 이름 */
    function makePixelFloater(index, mobileLight) {
      const marine = (index & 1) === 0;
      const name = marine ? generateBackgroundMarineName() : generateCatchName();
      const rarity = rarityFromName(name);
      const size = rollSize(rarity);
      const item = { name, type: UNIFIED_TYPE, rarity, size };
      const base = hashPixelArtSeed(item);
      const pickSeed = marine ? base ^ 0x9e3779b9 : base;
      const art0 = generateProceduralPixelArtFromItem(item, pickSeed, marine);
      const scale = mobileLight
        ? 2
        : 2 + (Math.random() < 0.28 ? 1 : 0);
      const bmp = rasterizePixelArtForBg(art0, scale);
      const speedMul = mobileLight ? 0.42 : 1;
      const speed = reducedMotion ? 0 : (0.05 + Math.random() * 0.38) * speedMul;
      const ang = Math.random() * Math.PI * 2;
      const floater = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed * (0.5 + Math.random() * 0.55),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: reducedMotion ? 0 : (Math.random() * 0.003 - 0.0015) * speedMul,
        bmp,
        alpha: mobileLight ? 0.52 + Math.random() * 0.14 : 0.72 + Math.random() * 0.2,
        halfW: bmp.width / 2,
        halfH: bmp.height / 2,
        _bgScale: scale,
      };
      return floater;
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const mobileLight =
        isMobileViewport ||
        (typeof window.matchMedia === 'function' &&
          window.matchMedia('(max-width: 520px)').matches);
      const starCount = mobileLight ? 38 : 88;
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random(),
        da: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
        vx: reducedMotion ? 0 : (Math.random() * 0.06 + 0.008) * (Math.random() < 0.5 ? -1 : 1),
        vy: reducedMotion ? 0 : (Math.random() * 0.05 + 0.006) * (Math.random() < 0.5 ? -1 : 1),
      }));
      const area = canvas.width * canvas.height;
      const n = mobileLight
        ? Math.min(8, Math.max(4, Math.floor(area / 72000)))
        : Math.min(34, Math.max(14, Math.floor(area / 26000)));
      // AI 이미지가 있으면 최대 60%를 AI 플로터로, 나머지는 절차적
      const aiCount = Math.min(sharedBmps.length, Math.floor(n * 0.6));
      const shuffled = sharedBmps.length > 0
        ? [...sharedBmps].sort(() => Math.random() - 0.5)
        : [];
      pixelFloaters = [
        ...Array.from({ length: aiCount }, (_, i) => makeSharedFloater(shuffled[i % shuffled.length], mobileLight)),
        ...Array.from({ length: n - aiCount }, (_, i) => makePixelFloater(i, mobileLight)),
      ];
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

    /** shared_pixel_arts 에서 AI 이미지 로드 후 배경 플로터에 반영 */
    async function loadSharedFloaters() {
      if (!platformApi) return;
      try {
        const headers = alpToken ? { Authorization: `Bearer ${alpToken}` } : {};
        const res = await fetch(`${platformApi}/api/ai/floaters?limit=20`, { headers });
        if (!res.ok) return;
        const { arts = [] } = await res.json();
        if (arts.length === 0) return;

        const BMP_SIZE = 56; // 배경 오브젝트 크기(px)
        const loaded = (await Promise.all(arts.map((a) => imageUrlToFloaterBmp(a.imageData, BMP_SIZE))))
          .filter(Boolean);
        if (loaded.length === 0) return;

        sharedBmps = loaded;
        // 로드 완료 후 바로 플로터 교체 (resize 재호출 없이)
        const mobileLight =
          isMobileViewport ||
          (typeof window.matchMedia === 'function' &&
            window.matchMedia('(max-width: 520px)').matches);
        const aiCount = Math.min(sharedBmps.length, Math.floor(pixelFloaters.length * 0.6));
        const shuffled = [...sharedBmps].sort(() => Math.random() - 0.5);
        for (let i = 0; i < aiCount; i++) {
          const bmp = shuffled[i % shuffled.length];
          pixelFloaters[i] = makeSharedFloater(bmp, mobileLight);
        }
      } catch {
        // 실패 시 절차적 플로터 유지
      }
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
    // 약간 지연 후 로드 (alpToken 세팅 시간 확보)
    setTimeout(loadSharedFloaters, 2000);
  })();

  /* ── 아이템 뽑기 ─────────────────────────────────────── */

  /** 이름 없이 희귀도만 랜덤으로 결정 (미니게임 시작 전에 사용)
   *  기본: common 90% / rare 7% / epic 2.5% / legendary 0.5%
   *  easy 모드: common 22% / rare 28% / epic 38% / legendary 12%
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
  function syncInventoryDockLayoutMode() {
    if (!inventoryDock || !inventoryScrollWrap) return;
    const strip = window.innerWidth <= 520 && window.innerHeight > window.innerWidth;
    const was = inventoryDock.classList.contains('inventory-dock--portrait-strip');
    inventoryDock.classList.toggle('inventory-dock--portrait-strip', strip);
    if (was !== strip) {
      inventoryScrollWrap.scrollLeft = 0;
      inventoryScrollWrap.scrollTop = 0;
    }
  }

  function syncInventoryScrollOverflow() {
    const wrap = inventoryScrollWrap;
    if (!wrap) return;
    if (inventory.length === 0) {
      wrap.classList.remove('has-overflow', 'is-dragging');
      wrap.scrollTop = 0;
      wrap.scrollLeft = 0;
      return;
    }
    requestAnimationFrame(() => {
      let overflow;
      if (inventoryDock && inventoryDock.classList.contains('inventory-dock--portrait-strip')) {
        overflow = wrap.scrollWidth > wrap.clientWidth + 1;
      } else {
        overflow = wrap.scrollHeight > wrap.clientHeight + 1;
      }
      wrap.classList.toggle('has-overflow', overflow);
    });
  }

  /** 세로+스트립 모드에서 잡기 미니게임이 열리면 보관함을 숨겨 낚시 UI를 가리지 않게 함 */
  function syncInventoryDockMinigamePosition() {
    if (!inventoryDock || !minigame || !inventoryScrollWrap) return;
    const strip = inventoryDock.classList.contains('inventory-dock--portrait-strip');
    const miniOpen = !minigame.classList.contains('hidden');
    const next = strip && miniOpen;
    const was = inventoryDock.classList.contains('inventory-dock--minigame-hidden');
    inventoryDock.classList.toggle('inventory-dock--minigame-hidden', next);
    if (next) inventoryDock.setAttribute('aria-hidden', 'true');
    else inventoryDock.removeAttribute('aria-hidden');
    if (was !== next) {
      inventoryScrollWrap.scrollLeft = 0;
      inventoryScrollWrap.scrollTop = 0;
    }
  }

  function renderInventory() {
    if (!inventoryList) return;
    syncInventoryDockLayoutMode();
    syncInventoryDockMinigamePosition();

    if (inventory.length === 0) {
      inventoryList.innerHTML = '<p class="log-empty">보관함이 비어있습니다</p>';
      if (sellAllBtn) sellAllBtn.classList.add('hidden');
      syncInventoryScrollOverflow();
      return;
    }

    const totalValue = inventory.reduce((s, i) => s + i.coins, 0);
    if (sellAllBtn) {
      sellAllBtn.classList.remove('hidden');
      sellAllBtn.textContent = `전체 팔기 · ${totalValue.toLocaleString()} 코인`;
    }

    inventoryList.innerHTML = '';
    inventory.forEach((item, invIdx) => {
      const canSell = isLoggedIn && item.id;
      const el = document.createElement('div');
      el.className = `inv-item rarity-${item.rarity}`;
      el.dataset.invIdx = String(invIdx);
      el.innerHTML = `
        <div class="inv-thumb" data-thumb></div>
        <span class="inv-name">${item.name}</span>
        <span class="inv-coins">${item.coins} 코인</span>
        ${canSell
          ? `<button class="inv-sell-btn" data-id="${item.id}">팔기</button>`
          : `<span class="inv-sell-pending">${isLoggedIn ? '저장 중' : '로그인 필요'}</span>`
        }
      `;
      const thumb = el.querySelector('[data-thumb]');
      if (thumb) {
        void (async () => {
          const art =
            item.pixelArt && item.pixelArt.cells && item.pixelArt.palette
              ? item.pixelArt
              : await generateCatchPixelArt(itemStubForArt(item));
          mountPixelArt(thumb, art, 56, 56);
        })();
      }
      inventoryList.appendChild(el);
    });
    syncInventoryScrollOverflow();
    persistForgeMaterials();
  }

  function closeSellConfirm() {
    sellConfirmPayload = null;
    if (sellConfirmOverlay) sellConfirmOverlay.classList.add('hidden');
  }

  function openSellConfirm(payload) {
    if (!sellConfirmOverlay || !sellConfirmMsg) return;
    sellConfirmPayload = payload;
    if (payload.type === 'one') {
      const item = inventory.find((i) => i.id === payload.id);
      sellConfirmMsg.textContent = item
        ? `「${item.name}」을(를) 정말 파시겠습니까?\n예상 수익 ${item.coins.toLocaleString()} 코인`
        : '이 아이템을 정말 파시겠습니까?';
    } else {
      const withId = inventory.filter((i) => i.id);
      const n = withId.length;
      const total = withId.reduce((s, i) => s + (i.coins || 0), 0);
      sellConfirmMsg.textContent =
        n > 0
          ? `보관함의 아이템 ${n}개를 전부 파시겠습니까?\n합계 약 ${total.toLocaleString()} 코인`
          : '팔 수 있는 아이템이 없습니다.';
    }
    sellConfirmOverlay.classList.remove('hidden');
  }

  function closeVoxelViewer() {
    if (voxelViewerOverlay) voxelViewerOverlay.classList.add('hidden');
    if (voxelViewerCtx) {
      cancelAnimationFrame(voxelViewerCtx.rafId);
      window.removeEventListener('resize', voxelViewerCtx.onResize);
      try {
        voxelViewerCtx.controls.dispose();
      } catch {
        /* ignore */
      }
      voxelViewerCtx.scene.remove(voxelViewerCtx.mesh);
      voxelViewerCtx.mesh.geometry.dispose();
      voxelViewerCtx.mesh.material.dispose();
      voxelViewerCtx.renderer.dispose();
      const cEl = voxelViewerCtx.renderer.domElement;
      if (cEl && cEl.parentNode) cEl.parentNode.removeChild(cEl);
      if (voxelViewerCanvasHost) voxelViewerCanvasHost.innerHTML = '';
      voxelViewerCtx = null;
    }
  }

  function initVoxelViewerScene(THREE, OrbitControls, art) {
    const host = voxelViewerCanvasHost;
    if (!host) return;
    host.innerHTML = '';
    const rw = Math.max(1, host.clientWidth || 320);
    const rh = Math.max(1, host.clientHeight || 280);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08081a);

    const camera = new THREE.PerspectiveCamera(48, rw / rh, 0.1, 4000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rw, rh);
    if (renderer.outputColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    if (renderer.toneMappingExposure !== undefined) {
      renderer.toneMappingExposure = 1.22;
    }
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.52));
    scene.add(new THREE.HemisphereLight(0xd6e4ff, 0x6a7088, 1.15));
    const dir = new THREE.DirectionalLight(0xffffff, 0.82);
    dir.position.set(5, 9, 7);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.38);
    fill.position.set(-6, 4, -5);
    scene.add(fill);

    const layers = Math.max(1, Math.min(8, VOXEL_EXTRUDE_LAYERS));
    const layerH = VOXEL_LAYER_HEIGHT;
    const plan = VOXEL_PLAN;
    const solid = countSolidVoxels(art);
    const count = solid * layers;
    const geometry = new THREE.BoxGeometry(plan, layerH * 0.96, plan);
    const material = new THREE.MeshLambertMaterial();
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();
    let ii = 0;
    for (let py = 0; py < art.h; py += 1) {
      for (let px = 0; px < art.w; px += 1) {
        const cidx = art.cells[py * art.w + px];
        if (cidx === 0) continue;
        const baseHex = voxelDisplayHexForCell(art, cidx);
        for (let ly = 0; ly < layers; ly += 1) {
          dummy.position.set(
            px - art.w / 2 + 0.5,
            -(ly + 0.5) * layerH,
            py - art.h / 2 + 0.5
          );
          dummy.updateMatrix();
          mesh.setMatrixAt(ii, dummy.matrix);
          tmpColor.set(baseHex);
          if (ly > 0) tmpColor.multiplyScalar(1 - ly * 0.035);
          mesh.setColorAt(ii, tmpColor);
          ii += 1;
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);

    const yExtent = layers * layerH;
    const midY = -yExtent / 2;
    const maxDim = Math.max(art.w, art.h, yExtent, 1);
    const dist = maxDim * 1.35;
    camera.position.set(dist * 0.72, midY + dist * 0.58, dist * 0.88);
    camera.lookAt(0, midY, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, midY, 0);
    controls.update();

    function onResize() {
      if (!voxelViewerCtx) return;
      const nw = Math.max(1, host.clientWidth);
      const nh = Math.max(1, host.clientHeight);
      voxelViewerCtx.camera.aspect = nw / nh;
      voxelViewerCtx.camera.updateProjectionMatrix();
      voxelViewerCtx.renderer.setSize(nw, nh);
    }
    window.addEventListener('resize', onResize);

    voxelViewerCtx = {
      scene,
      camera,
      renderer,
      controls,
      mesh,
      host,
      onResize,
      rafId: 0,
    };

    function loop() {
      if (!voxelViewerCtx) return;
      voxelViewerCtx.rafId = requestAnimationFrame(loop);
      voxelViewerCtx.controls.update();
      voxelViewerCtx.renderer.render(voxelViewerCtx.scene, voxelViewerCtx.camera);
    }
    loop();
  }

  async function openInventoryVoxelFromItem(item) {
    if (!voxelViewerOverlay || !voxelViewerCanvasHost || !voxelViewerTitle) return;
    const V = window.__VOXEL__;
    if (!V || !V.THREE || !V.OrbitControls) {
      showStatus('3D 보기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      setTimeout(() => {
        if (statusMsg) statusMsg.classList.add('hidden');
      }, 3200);
      return;
    }
    let art =
      item.pixelArt && item.pixelArt.cells && item.pixelArt.palette
        ? item.pixelArt
        : null;
    if (!art) art = await generateCatchPixelArt(itemStubForArt(item));
    if (!art || !art.cells || !art.cells.length) return;
    if (countSolidVoxels(art) === 0) {
      showStatus('표시할 픽셀이 없어요.');
      setTimeout(() => {
        if (statusMsg) statusMsg.classList.add('hidden');
      }, 2200);
      return;
    }
    voxelViewerTitle.textContent = item.name || '3D 보기';
    closeVoxelViewer();
    voxelViewerOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      try {
        initVoxelViewerScene(V.THREE, V.OrbitControls, art);
      } catch {
        closeVoxelViewer();
        showStatus('3D 표시 중 오류가 났어요.');
        setTimeout(() => {
          if (statusMsg) statusMsg.classList.add('hidden');
        }, 3200);
      }
    });
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
    setMinigameScrollLocked(false);
    castBtn.classList.remove('hidden');
    stopStatusScanning();
    statusMsg.classList.add('hidden');
    minigame.classList.add('hidden');
    beamLine.classList.remove('extended');
    lureEl.classList.remove('biting');
    lureEl.textContent = '';
    syncInventoryDockMinigamePosition();
    syncInventoryScrollOverflow();
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
    syncInventoryDockMinigamePosition();
    syncInventoryScrollOverflow();
  }

  function goWaiting() {
    state = 'WAITING';
    showStatus('우주의 심연을 기다리는 중...');
    const wait = 2000 + Math.random() * 4000;
    setTimeout(() => {
      if (state !== 'WAITING') return;
      // 미니게임에는 희귀도만 필요 — 에픽+는 잡은 뒤 AI가 이름·이미지 생성
      currentItem = { rarity: rollRarity() };
      goMinigame();
    }, wait);
    syncInventoryDockMinigamePosition();
    syncInventoryScrollOverflow();
  }

  function goMinigame() {
    state = 'MINIGAME';
    lureEl.classList.add('biting');
    showStatus('무언가 걸렸다!');
    minigame.classList.remove('hidden');
    startMinigame(currentItem);
    syncInventoryDockMinigamePosition();
    syncInventoryScrollOverflow();
  }

  async function goResult(success) {
    if (mini.rafId) cancelAnimationFrame(mini.rafId);
    mini.rafId = null;
    setMinigameScrollLocked(false);
    minigame.classList.add('hidden');
    syncInventoryDockMinigamePosition();
    syncInventoryScrollOverflow();
    lureEl.classList.remove('biting');
    beamLine.classList.remove('extended');
    lureEl.textContent = '';

    if (!success) {
      state = 'IDLE';
      showStatus('놓쳤다... 다시 도전!');
      castBtn.classList.remove('hidden');
      return;
    }

    state = 'RESULT';
    const rarity = currentItem.rarity;

    // ── AI로 생명체 생성 (로그인 + 에픽·전설만, 일반·희귀는 절차적) ──
    let aiData = null;
    if (isLoggedIn && alpToken && platformApi && rarityUsesAiCatch(rarity)) {
      showStatusScanning('스캔중');
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 16000); // 16초 타임아웃 (PixelLab ~3초)
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
      // 이미지 URL → 픽셀아트 변환 (실패 시 절차적 패턴)
      let pixelArt = null;
      if (aiData.imageUrl) {
        pixelArt = await rasterizeImageUrlToPixelArt(
          aiData.imageUrl, PIXEL_GRID_W, PIXEL_GRID_H
        );
      }
      if (!pixelArt) {
        const stub = { name: aiData.name, type, rarity, size };
        pixelArt = generateProceduralPixelArtFromItem(
          stub,
          hashPixelArtSeed(stub),
          false
        );
      }

      item = { name: aiData.name, type, rarity, size, coins, pixelArt };
    } else {
      // 일반·희귀 (또는 에픽·전설 AI 폴백): 절차적 이름으로 즉시 생성
      item = rollItemFromRarity(rarity);
    }
    currentItem = item;

    // 결과 카드를 즉시 표시 (AI 이미지 기다리지 않음)
    await showResult(currentItem);
    await saveCatch(currentItem);

    // 일반·희귀: AI 이미지를 백그라운드에서 로드 → 완료되면 카드·보관함 업데이트
    if ((rarity === 'common' || rarity === 'rare') && isLoggedIn && alpToken && platformApi) {
      void (async () => {
        try {
          const ctrl2 = new AbortController();
          const tid2 = setTimeout(() => ctrl2.abort(), 35000);
          const imgRes = await fetch(`${platformApi}/api/ai/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${alpToken}` },
            body: JSON.stringify({ name: item.name, type: item.type, rarity }),
            signal: ctrl2.signal,
          });
          clearTimeout(tid2);
          if (!imgRes.ok) {
            const errText = await imgRes.text().catch(() => '');
            console.error('[AI image] server error', imgRes.status, errText);
            return;
          }
          const imgData = await imgRes.json();
          console.log('[AI image]', rarity, imgData.cached ? 'cache hit' : 'generated', imgData.imageUrl ? 'has url' : 'no url');
          if (!imgData.imageUrl) return;
          const art = await rasterizeImageUrlToPixelArt(imgData.imageUrl, PIXEL_GRID_W, PIXEL_GRID_H);
          if (!art) return;
          // 아이템에 AI 픽셀아트 반영
          item.pixelArt = art;
          if (currentItem === item) currentItem.pixelArt = art;
          // 결과 카드가 아직 열려 있으면 스프라이트 교체
          if (resultSpriteHost && !resultCard.classList.contains('hidden')) {
            mountPixelArt(resultSpriteHost, art, 128, 128);
          }
          // 보관함 첫 번째 썸네일 교체
          const firstThumb = inventoryList?.querySelector('.item-thumb');
          if (firstThumb) mountPixelArt(firstThumb, art, 56, 56);
        } catch (err) {
          console.error('[AI image] fetch error', err.message || err);
        }
      })();
    }

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
    setMinigameScrollLocked(true);
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onRelease();
  });

  /* ── 픽셀아트 서버 전송용 정제 (palette ≤ 24, cells 정수 배열) ── */
  function serializePixelArt(art) {
    if (!art || !Array.isArray(art.cells) || !Array.isArray(art.palette)) return null;
    const MAX_P = 24;
    // palette hex 검증
    const validPalette = art.palette.filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
    if (validPalette.length === 0) return null;
    const palette = validPalette.slice(0, MAX_P);
    const maxIdx = palette.length - 1;
    const cells = Array.from(art.cells).map(n => {
      const i = Number(n) | 0;
      return i < 0 ? 0 : i > maxIdx ? maxIdx : i;
    });
    if (cells.length !== art.w * art.h) return null;
    return { w: art.w, h: art.h, palette, cells };
  }

  /* ── 결과 표시 ───────────────────────────────────────── */
  async function showResult(item) {
    stopStatusScanning();
    if (statusMsg) statusMsg.classList.add('hidden');
    resultCard.className = `result-card hidden rarity-${item.rarity}`;
    if (!item.pixelArt) {
      item.pixelArt = await generateCatchPixelArt(item);
    }
    const art = item.pixelArt;
    if (resultSpriteHost) {
      mountPixelArt(resultSpriteHost, art, 128, 128);
    }
    resultRarity.className  = `result-rarity rarity-${item.rarity}`;
    resultRarity.textContent = RARITY_LABEL[item.rarity];
    resultName.textContent  = item.name;
    resultSize.textContent  = `${item.size}cm`;
    resultCoins.textContent = `${item.coins} 코인`;
    resultCard.classList.remove('hidden');

    totalCatches += 1;
    updateCatchesDisplay();
  }

  /* ── 서버 저장 + 보관함 추가 ─────────────────────────── */
  async function saveCatch(item) {
    let catchId = null;
    // AI 픽셀아트가 있으면 정제해서 전송, 없으면 서버가 자체 생성 (공유 캐시 or 절차적)
    const pixelArtForServer = item.pixelArt
      ? serializePixelArt(item.pixelArt)
      : null;

    if (isLoggedIn && alpToken && platformApi) {
      try {
        const body = {
          itemName:  item.name,
          itemEmoji: '',
          itemType:  item.type,
          rarity:    item.rarity,
          size:      item.size,
          coinValue: item.coins,
        };
        if (pixelArtForServer) body.pixelArt = pixelArtForServer;

        const res = await fetch(`${platformApi}/api/catches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${alpToken}`,
          },
          body: JSON.stringify(body),
        });
        const data = res.ok ? await res.json() : null;
        catchId = data?.catch?.id ?? null;
      } catch {}
    }

    if (!item.pixelArt) {
      item.pixelArt = await generateCatchPixelArt(item);
    }
    const localPixelArt = item.pixelArt;
    const newUid = catchId != null ? `srv-${catchId}` : forgeRandomUid();
    inventory.unshift({
      id: catchId,
      uid: newUid,
      name: item.name,
      type: item.type,
      size: item.size,
      rarity: item.rarity,
      coins: item.coins,
      pixelArt: localPixelArt,
    });
    renderInventory();
  }

  /* ── 유틸 ────────────────────────────────────────────── */
  /** 스캔중 점 애니메이션용 — showStatus 호출 시 DOM 초기화 */
  function stopStatusScanning() {
    if (!statusMsg) return;
    if (statusMsg.querySelector('.status-scan-dots')) {
      statusMsg.textContent = '';
    }
  }

  /** "스캔중" + 점(…) 순차 애니메이션 (CSS `.status-scan-dots`) */
  function showStatusScanning(label) {
    if (!statusMsg) return;
    const base = String(label || '스캔중').replace(/[\s.]+$/g, '');
    statusMsg.innerHTML = `${base}<span class="status-scan-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span><span>.</span></span>`;
    statusMsg.classList.remove('hidden');
  }

  function showStatus(msg) {
    stopStatusScanning();
    statusMsg.textContent = msg;
    statusMsg.classList.remove('hidden');
  }

  /* ── 이벤트 ──────────────────────────────────────────── */
  castBtn.addEventListener('click', () => {
    if (state === 'IDLE') goCasting();
  });

  // 보관함: 팔기 버튼 / 그 외 영역 클릭 → 3D 복셀 보기
  if (inventoryList) {
    inventoryList.addEventListener('click', e => {
      if (suppressNextInvListClick) {
        suppressNextInvListClick = false;
        return;
      }
      const sellBtn = e.target.closest('.inv-sell-btn');
      if (sellBtn) {
        if (isSelling) return;
        const id = sellBtn.dataset.id;
        if (id) openSellConfirm({ type: 'one', id });
        return;
      }
      if (e.target.closest('button')) return;
      const row = e.target.closest('.inv-item');
      if (!row || row.dataset.invIdx == null) return;
      const item = inventory[Number(row.dataset.invIdx)];
      if (item) void openInventoryVoxelFromItem(item);
    });
  }

  // 전체 팔기
  if (sellAllBtn) {
    sellAllBtn.addEventListener('click', () => {
      if (isSelling) return;
      const ids = inventory.filter((i) => i.id);
      if (ids.length === 0) return;
      openSellConfirm({ type: 'all' });
    });
  }

  if (sellConfirmCancel) {
    sellConfirmCancel.addEventListener('click', closeSellConfirm);
  }
  if (sellConfirmOverlay) {
    sellConfirmOverlay.addEventListener('click', (e) => {
      if (e.target === sellConfirmOverlay) closeSellConfirm();
    });
  }
  if (sellConfirmOk) {
    sellConfirmOk.addEventListener('click', async () => {
      const p = sellConfirmPayload;
      if (!p || isSelling) return;
      if (p.type === 'all') {
        const ids = inventory.filter((i) => i.id);
        if (ids.length === 0) {
          closeSellConfirm();
          return;
        }
      }
      closeSellConfirm();
      if (p.type === 'one') await sellItem(p.id);
      else await sellAll();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (voxelViewerOverlay && !voxelViewerOverlay.classList.contains('hidden')) {
      closeVoxelViewer();
      return;
    }
    if (!sellConfirmOverlay || sellConfirmOverlay.classList.contains('hidden')) return;
    closeSellConfirm();
  });

  if (voxelViewerClose) {
    voxelViewerClose.addEventListener('click', closeVoxelViewer);
  }
  if (voxelViewerOverlay) {
    voxelViewerOverlay.addEventListener('click', (e) => {
      if (e.target === voxelViewerOverlay) closeVoxelViewer();
    });
  }

  /* 보관함: 마우스 드래그 스크롤 — 세로 스트립 모드는 좌우, 그 외는 세로 */
  (function setupInventoryDragScroll() {
    const wrap = inventoryScrollWrap;
    if (!wrap) return;

    function inventoryDragIsHorizontal() {
      return (
        inventoryDock &&
        inventoryDock.classList.contains('inventory-dock--portrait-strip') &&
        !inventoryDock.classList.contains('inventory-dock--minigame-hidden')
      );
    }

    const DRAG_THRESHOLD_PX = 8;
    let ptrId = null;
    let dragCommitted = false;
    let startX = 0;
    let startY = 0;
    let startScrollL = 0;
    let startScrollT = 0;
    let dragHorizontal = false;
    let pendingInvRow = null;

    function cleanupPointerSession(openVoxelOnTap) {
      if (ptrId === null) return;
      if (openVoxelOnTap) {
        if (!dragCommitted && pendingInvRow && pendingInvRow.dataset.invIdx != null) {
          suppressNextInvListClick = true;
          const item = inventory[Number(pendingInvRow.dataset.invIdx)];
          if (item) void openInventoryVoxelFromItem(item);
        } else if (dragCommitted) {
          suppressNextInvListClick = true;
        }
      } else if (dragCommitted) {
        suppressNextInvListClick = true;
      }
      pendingInvRow = null;
      dragCommitted = false;
      const id = ptrId;
      ptrId = null;
      wrap.classList.remove('is-dragging');
      if (id != null) {
        try {
          wrap.releasePointerCapture(id);
        } catch {
          /* ignore */
        }
      }
    }

    wrap.addEventListener(
      'pointerdown',
      (e) => {
        if (!wrap.classList.contains('has-overflow')) return;
        if (e.pointerType !== 'mouse') return;
        if (e.button !== 0) return;
        if (e.target.closest('button, input, a, [role="button"]')) return;
        ptrId = e.pointerId;
        dragCommitted = false;
        startX = e.clientX;
        startY = e.clientY;
        startScrollL = wrap.scrollLeft;
        startScrollT = wrap.scrollTop;
        dragHorizontal = inventoryDragIsHorizontal();
        pendingInvRow = e.target.closest('.inv-item');
      },
      { passive: true }
    );

    wrap.addEventListener(
      'pointermove',
      (e) => {
        if (ptrId === null || e.pointerId !== ptrId) return;
        const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (!dragCommitted) {
          if (dist <= DRAG_THRESHOLD_PX) return;
          dragCommitted = true;
          wrap.classList.add('is-dragging');
          try {
            wrap.setPointerCapture(ptrId);
          } catch {
            /* ignore */
          }
        }
        if (dragHorizontal) {
          wrap.scrollLeft = startScrollL - (e.clientX - startX);
        } else {
          wrap.scrollTop = startScrollT - (e.clientY - startY);
        }
      },
      { passive: true }
    );

    wrap.addEventListener('pointerup', (e) => {
      if (ptrId === null || e.pointerId !== ptrId) return;
      cleanupPointerSession(true);
    });
    wrap.addEventListener('pointercancel', (e) => {
      if (ptrId === null || e.pointerId !== ptrId) return;
      cleanupPointerSession(false);
    });
    wrap.addEventListener('lostpointercapture', (e) => {
      if (ptrId !== null && e.pointerId === ptrId) {
        cleanupPointerSession(false);
      }
    });

    /* 세로 스트립(가로 스크롤): PC는 카드 클릭을 살리기 위해 휠·트랙패드로 좌우 이동 */
    wrap.addEventListener(
      'wheel',
      (e) => {
        if (!wrap.classList.contains('has-overflow')) return;
        if (!inventoryDragIsHorizontal()) return;
        const dx = e.deltaX;
        const dy = e.deltaY;
        if (dx === 0 && dy === 0) return;
        e.preventDefault();
        wrap.scrollLeft += dx + dy;
      },
      { passive: false }
    );

    function onInventoryLayoutResize() {
      syncInventoryDockLayoutMode();
      syncInventoryDockMinigamePosition();
      syncInventoryScrollOverflow();
    }
    window.addEventListener('resize', onInventoryLayoutResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(onInventoryLayoutResize, 120);
    });
  })();

  /* ── 초기 렌더 ───────────────────────────────────────── */
  updateCoinDisplay();
  updateCatchesDisplay();
  renderInventory();
})();
