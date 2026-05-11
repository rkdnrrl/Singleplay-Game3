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

  /* ── 절차적 아이템 (희귀도 없음 — 표시·저장은 모두 일반) ─── */
  const RARITY_LABEL = { common: '일반' };

  /** API·저장용 타입 — 고철 스크랩 */
  const UNIFIED_TYPE = 'scrap';
  const SILHOUETTE_TYPES = ['ingot', 'wire', 'plate', 'machine', 'shard'];

  const NAME_PARTS = {
    ingot: {
      pre: ['야적장', '압연라인', '전기로', '순환', '가열로', '냉각', '고로', '정련'],
      core: ['빌릿', '슬래브', '블룸', '코일', '인곳', '괴철', 'H빔', '판재'],
      post: [' A급', ' 혼합', ' Lot', ' (불명)', ''],
    },
    wire: {
      pre: ['도금', '연동', '산세', '아연도', '스테인', '비닐피복', '동심'],
      core: ['와이어', '쇠사슬', '보빈', '스트랜드', '리드선', '로프', '체인'],
      post: [' Φ7', ' 굵기불균', ' 단위중량', ''],
    },
    plate: {
      pre: ['판금', '두께공차', '용접', '절단', '레이저', '프레스', '코팅'],
      core: ['철판', '두께판', '패치', '보강판', '스킨플레이트', '리브', '브래킷'],
      post: [' 절단편', ' 코너', ' 단면', ''],
    },
    machine: {
      pre: ['폐차', '해체', '노후', '양산종료', '정비불량', '라인교체', '중고설비'],
      core: ['크랭크', '변속기', '톱니바퀴', '유니버설', '베어링하우징', '실린더', '플라이휠'],
      post: [' 잔류오일', ' 초기형', ' MK2', ''],
    },
    shard: {
      pre: ['파쇄', '선별', '자력선별', '비철혼입', '슬래그', '샤링', '절단'],
      core: ['파편', '슬리버', '가루', '조각', '스크랩', '리바', '슬래그덩이'],
      post: [' 더미', ' 포대', ' 혼입', ''],
    },
  };

  /** 이름 조합 확장 — 야드·압연·비철 용어 (mod×body 만 단위 이상 확보) */
  const NAME_CATCH_MOD_EXT = `
야적장 선별장 압연로 냉연로 가열로 전기로 고로 슬래그장 비철장 차대번호 열처리 냉각
자력선별 바스켓 크레인 지게차 포크립 클램프 절단라인 프레스 브레이크 샤링 단조
용접라인 아크가스 CO2용접 가스절단 플라즈마절단 레이저가공 NC선반 밀링 탭핑
도금라인 연동산세 전기아연 크롬도금 니켈도금 인산염 피막 샌드블라스트 분체도장
적재단위 화물표준 중량표준 수분검사 성분검사 스펙트럼 XRF 촉매회수 슬러지
압연재 냉연판 열연판 아연도판 동판 알루미늄판 스테인판 철근콘크리트 프리캐스트
입고검사 출고검사 적재한도 중량표시 번들마킹 컨테이너마킹 벌크하역 로딩덱 언로딩
연주기록 히트넘버 로트추적 표면검사 두께측정 폭측정 길이측정 직진도 캔버각
녹제거라인 산세처리 폐수처리 슬러지건조 여과압력 증발농축 중화조 응집조
RH탈가스 VD처리 연속주조 라들예열 타격압축 스크랩압철 전로투입 배합비
슬래그포집 분진집진 정전분리 유입조 비철선별 동선분리 알루미늄선 스테인선
아연슬러지 대차정비 궤도정비 신호기 교량하부 연마라인 버핑라인 표면처리
코팅두께 밀착검사 경도검사 인장검사 굽힘시험 충격시험 금속현미경 재령관리
재령검사 예열로 균열검사 초음파탐상 마그넷픽업 전자석분리 용착검사 침투탐상
매끈도검사 엣지트리밍 비드절단 번들결속 표면코팅 패시베이션 입하대기 출하대기
야드순회 적재고도 적재균형 적재검증 적재사진 적재전표 적재라벨 적재바코드
`.trim().split(/\s+/).filter(Boolean);

  const NAME_CATCH_BODY_EXT = `
볼트 너트 와셔 스프링 핀 리벳 라쳇클램프 브래킷 샤프트 키웨이 스플라인 플랜지 게이트밸브
글로브밸브 체크밸브 버터플라이 커플링 호스 니플 엘보 티 레듀서 캡 엔드플레이트
기어 랙 피니언 스프로킷 체인 스프로킷 토크렌치 임팩트 그라인더 디스크 절단석
전동공구 에어호스 콤프레서 필터 오일필터 에어필터 라디에터 인터쿨러 터보차저
배터리 단자 퓨즈 릴레이 스타터 발전기 모터 인버터 PLC 센서 엔코더 리미트스위치
오일스틱 대팻대 크로스헤드 가이드핀 슬라이드베드 콜릿 척어댑터 밀링커터 리머
탭드릴 엔드밀홀더 지그베이스 클램프암 스위벨패드 톱니망대 별기어 행성기어
디퍼케이스 반축 유니조인트 드라이브플랜지 브레이크패드 마스터펌프 휠허브
베어링씰 오일가스켓 헤드가스켓 스터드볼트 플러그스크류 엔진마운트 미션마운트
바디마운트 와이퍼암 도어체크 힌지핀 스트라이크 콘솔브래킷 배선덕트 케이블가이드
헤드렌즈 후미등렌즈 리플렉터 퓨엘펌프 레귤레이터 인젝션레일 크랭크센서 온도센서
압력센서 MAP센서 O2센서 노크센서 스로틀바디 아이들밸브 EGR밸브 PCV밸브
연료레일 인젝터씰 흡기매니폴드 배기매니폴드 다운매니폴드 크랭크풀리 하모닉댐퍼
타이밍체인 텐셔너 체인가이드 워터펌프 테모스탯 팬클러치 라디에이터캡 오버플로우탱크
브레이크호스 클러치호스 파워호스 리턴호스 서보모터 스텝모터 리니어베어링 볼나트
리니어가이드 LM블록 볼스크류 리드스크류 커플링허브 키웨이샤프트 스플라인허브
`.trim().split(/\s+/).filter(Boolean);

  /** 이름 토큰 → 픽셀 실루엣 종류 (ingot·wire·plate·machine·shard) */
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
    m = n.match(/^고철장에서\s*나온\s+(.+)$/);
    if (m) return [normSilWord(m[1])].filter(Boolean);
    return null;
  }

  /**
   * 줍는 고철 이름 — 확장 풀(mod×body)로 조합 수 확보.
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

  /** 배경용: 짧은 고철·부품 명칭 */
  function generateBackgroundScrapName() {
    const short = [
      ...cores('shard').slice(0, 10),
      ...cores('wire').slice(0, 6),
      '철가루', '리바', '슬리버', '파편', '볼트', '너트',
    ];
    const pre = [...pres('shard'), ...pres('ingot')].slice(0, 12);

    const builders = [
      () => pick(short),
      () => `${pick(pre)} ${pick(short)}`,
      () => `${pick(pres('plate'))} ${pick(cores('plate'))}`,
    ];

    let name = '';
    for (let guard = 0; guard < 16; guard += 1) {
      name = pick(builders)();
      if (name && name.length <= 16) break;
    }
    return name || `${pick(pre)} ${pick(short)}`;
  }

  function sizeRangeForRarity() {
    return [3, 38];
  }

  function rollSize() {
    const [lo, hi] = sizeRangeForRarity();
    const u = Math.random();
    const skew = 0.45;
    const t = Math.pow(u, skew);
    return +((lo + t * (hi - lo)) * (0.92 + Math.random() * 0.08)).toFixed(1);
  }

  function computeCoinValue(size, type) {
    const base = 5;
    const [lo, hi] = sizeRangeForRarity();
    const mid = (lo + hi) / 2;
    const sizeBoost = Math.pow(Math.max(0.35, size / mid), 0.5);
    const typeMul = 1;
    const jitter = 0.88 + Math.random() * 0.26;
    const raw = base * sizeBoost * typeMul * jitter;
    const rounded = Math.round(raw);
    return Math.max(2, rounded);
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
    const s = `${String(item.name || '')}\0scrap`;
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
   * alternateRust 가 true 면 녹·구리 톤, false 면 냉철·회색 톤.
   */
  function generateProceduralPixelArtFromItem(item, salt, alternateRust) {
    const w = PIXEL_GRID_W;
    const h = PIXEL_GRID_H;
    const seed0 = hashPixelArtSeed(item);
    const seed = (seed0 ^ (salt >>> 0) ^ (alternateRust ? 0x51ed4eae : 0)) >>> 0;
    const rng = mulberry32(seed);

    const palette = [PIXEL_MAT];
    const nColors = 10 + ((seed >>> 3) % 5);
    for (let ci = 0; ci < nColors; ci += 1) {
      let r; let g; let b;
      if (alternateRust) {
        r = (88 + rng() * 95) | 0;
        g = (38 + rng() * 55) | 0;
        b = (18 + rng() * 42) | 0;
      } else {
        r = (52 + rng() * 95) | 0;
        g = (54 + rng() * 92) | 0;
        b = (58 + rng() * 100) | 0;
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
   * `window.__CATCH_SPRITE_RULES__ = [{ kw: '볼트', url: 'https://.../x.png' }, ...]`
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

  /** 적재함 등에서 픽셀 재생성용 최소 필드 */
  function itemStubForArt(row) {
    return {
      name: row.name,
      type: row.type || UNIFIED_TYPE,
      size: row.size != null ? row.size : 20,
      rarity: 'common',
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

  /** 야적장 플레이어 스프라이트 — 논리 해상도 32×32 (줍는 고철과 동일 그리드). */
  function createDefaultPlayerPixelArt() {
    const w = PIXEL_GRID_W;
    const h = PIXEL_GRID_H;
    const palette = [
      PIXEL_MAT,
      '#eceff1',
      '#cfd8dc',
      '#90a4ae',
      '#607d8b',
      '#4fc3f7',
      '#0277bd',
      '#37474f',
      '#fff176',
    ];
    const cells = new Array(w * h).fill(0);
    function rect(x0, y0, x1, y1, c) {
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          if (x >= 0 && x < w && y >= 0 && y < h) cells[y * w + x] = c;
        }
      }
    }
    rect(10, 5, 21, 6, 1);
    rect(9, 7, 22, 13, 1);
    rect(10, 14, 21, 14, 1);
    rect(8, 8, 23, 12, 2);
    rect(9, 6, 22, 7, 2);
    rect(11, 8, 20, 11, 5);
    rect(12, 9, 19, 10, 6);
    rect(9, 8, 9, 12, 4);
    rect(22, 8, 22, 12, 4);
    rect(11, 15, 20, 24, 2);
    rect(12, 16, 19, 23, 1);
    rect(13, 17, 18, 22, 3);
    rect(14, 19, 17, 20, 8);
    rect(7, 17, 10, 21, 2);
    rect(22, 17, 25, 21, 2);
    rect(12, 25, 15, 30, 3);
    rect(17, 25, 20, 30, 3);
    rect(11, 30, 16, 31, 7);
    rect(16, 30, 21, 31, 7);
    return { w, h, palette, cells, fromEmoji: false };
  }

  async function initPlayerSprite() {
    const host = document.getElementById('playerSpriteHost');
    if (!host) return;
    const url =
      typeof window !== 'undefined' && window.__PLAYER_SPRITE_URL__
        ? String(window.__PLAYER_SPRITE_URL__).trim()
        : '';
    let art = null;
    if (url) {
      art = await rasterizeImageUrlToPixelArt(url, PIXEL_GRID_W, PIXEL_GRID_H);
    }
    if (!art) art = createDefaultPlayerPixelArt();
    mountPixelArt(host, art, 80, 80);
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

  /** 미니게임 난이도 (등급 구분 없음) */
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
  const scanPanel          = document.getElementById('scanPanel');
  const scanCountNum       = document.getElementById('scanCountNum');
  const scanCountdownLine  = document.getElementById('scanCountdownLine');
  const scanOngoingLine    = document.getElementById('scanOngoingLine');
  const scanOngoingElapsed = document.getElementById('scanOngoingElapsed');
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

  /** 모바일: 미니게임 중 페이지 스크롤·바운스 차단 + 적재함이 터치 가로채기 방지 */
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

    // 총 줍은 개수
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

    // 적재함 로드 (미판매)
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
              rarity: 'common',
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

    /** index 짝수: 짧은 명칭 + 녹/구리 톤, 홀수: 풀 이름 + 냉철 톤 */
    function makePixelFloater(index, mobileLight) {
      const rustAlt = (index & 1) === 0;
      const name = rustAlt ? generateBackgroundScrapName() : generateCatchName();
      const size = rollSize();
      const item = { name, type: UNIFIED_TYPE, rarity: 'common', size };
      const base = hashPixelArtSeed(item);
      const pickSeed = rustAlt ? base ^ 0x9e3779b9 : base;
      const art0 = generateProceduralPixelArtFromItem(item, pickSeed, rustAlt);
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
      pixelFloaters = Array.from({ length: n }, (_, i) => makePixelFloater(i, mobileLight));
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

  /** 절차적 이름·크기·코인 (등급은 항상 일반) */
  function rollProceduralCatchItem() {
    const name = generateCatchName();
    const size = rollSize();
    const coins = computeCoinValue(size, UNIFIED_TYPE);
    return { name, type: UNIFIED_TYPE, rarity: 'common', size, coins };
  }

  /** 로그인 시 /api/ai/image (PixelLab 완료까지 대기, 서버 shared_pixel_arts 캐시) */
  async function enrichCatchItemWithAi(item) {
    if (!isLoggedIn || !alpToken || !platformApi) return item;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${alpToken}`,
    };
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 120000);
      const res = await fetch(`${platformApi}/api/ai/image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: item.name,
          type: item.type,
          rarity: 'common',
        }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (res.ok) {
        const data = await res.json();
        if (data.coins != null && Number.isFinite(Number(data.coins))) {
          totalCoins = Number(data.coins);
          updateCoinDisplay();
        }
        if (data.imageUrl) {
          const art = await rasterizeImageUrlToPixelArt(data.imageUrl, PIXEL_GRID_W, PIXEL_GRID_H);
          if (art) item.pixelArt = art;
        }
      }
    } catch {
      /* PixelLab/네트워크 실패 → 절차적 픽셀 폴백 */
    }
    return item;
  }

  /* ── 적재함(인벤토리) ─────────────────────────────────── */
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

  /** 세로+스트립 모드에서 미니게임이 열리면 적재함을 숨겨 게임 UI를 가리지 않게 함 */
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
      inventoryList.innerHTML = '<p class="log-empty">적재함이 비어 있습니다</p>';
      if (sellAllBtn) sellAllBtn.classList.add('hidden');
      syncInventoryScrollOverflow();
      return;
    }

    const totalValue = inventory.reduce((s, i) => s + i.coins, 0);
    if (sellAllBtn) {
      sellAllBtn.classList.remove('hidden');
      sellAllBtn.textContent = `고철 전부 팔기 · ${totalValue.toLocaleString()} 코인`;
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
          ? `적재함의 고철 ${n}덩이를 전부 파시겠습니까?\n합계 약 ${total.toLocaleString()} 코인`
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

  /** 스캔 패널 20→1초 카운터, 이후 경과 초(1초마다 증가) */
  let scanCountdownTimer = null;

  function stopScanPanel() {
    if (scanCountdownTimer != null) {
      clearInterval(scanCountdownTimer);
      scanCountdownTimer = null;
    }
    if (scanPanel) scanPanel.classList.add('hidden');
    if (scanCountdownLine) scanCountdownLine.classList.remove('hidden');
    if (scanOngoingLine) scanOngoingLine.classList.add('hidden');
    if (scanCountNum) scanCountNum.textContent = '20';
    if (scanOngoingElapsed) scanOngoingElapsed.textContent = '1';
  }

  function startScanPanelCountdown(seconds = 20) {
    if (scanCountdownTimer != null) {
      clearInterval(scanCountdownTimer);
      scanCountdownTimer = null;
    }
    stopStatusScanning();
    if (statusMsg) statusMsg.classList.add('hidden');
    if (!scanPanel || !scanCountNum || !scanCountdownLine || !scanOngoingLine) return;
    scanCountdownLine.classList.remove('hidden');
    scanOngoingLine.classList.add('hidden');
    let remaining = seconds;
    scanCountNum.textContent = String(remaining);
    scanPanel.classList.remove('hidden');
    scanCountdownTimer = window.setInterval(() => {
      remaining -= 1;
      if (remaining >= 1) {
        scanCountNum.textContent = String(remaining);
      } else {
        if (scanCountdownTimer != null) {
          clearInterval(scanCountdownTimer);
          scanCountdownTimer = null;
        }
        scanCountdownLine.classList.add('hidden');
        scanOngoingLine.classList.remove('hidden');
        let elapsed = 1;
        if (scanOngoingElapsed) scanOngoingElapsed.textContent = String(elapsed);
        scanCountdownTimer = window.setInterval(() => {
          elapsed += 1;
          if (scanOngoingElapsed) scanOngoingElapsed.textContent = String(elapsed);
        }, 1000);
      }
    }, 1000);
  }

  /* ── 상태 전환 ───────────────────────────────────────── */
  function goIdle() {
    state = 'IDLE';
    setMinigameScrollLocked(false);
    castBtn.classList.remove('hidden');
    stopScanPanel();
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
    stopScanPanel();
    showStatus('자석을 내리는 중...');
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
    showStatus('야적장을 훑는 중...');
    const wait = 2000 + Math.random() * 4000;
    setTimeout(() => {
      if (state !== 'WAITING') return;
      currentItem = { rarity: 'common' };
      goMinigame();
    }, wait);
    syncInventoryDockMinigamePosition();
    syncInventoryScrollOverflow();
  }

  function goMinigame() {
    state = 'MINIGAME';
    lureEl.classList.add('biting');
    showStatus('금속 반응!');
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
      showStatus('놓쳤다... 다시 줍기!');
      castBtn.classList.remove('hidden');
      return;
    }

    state = 'RESULT';
    startScanPanelCountdown(20);
    const scanT0 = performance.now();
    let item = rollProceduralCatchItem();
    try {
      item = await enrichCatchItemWithAi(item);
    } catch {
      /* enrich 내부에서 이미 폴백 */
    }
    const scanElapsed = performance.now() - scanT0;
    const scanMinMs = 2200;
    if (scanElapsed < scanMinMs) {
      await new Promise((r) => setTimeout(r, scanMinMs - scanElapsed));
    }
    stopScanPanel();
    currentItem = item;

    await showResult(currentItem);
    await saveCatch(currentItem);

    setTimeout(() => {
      resultCard.classList.add('hidden');
      goIdle();
    }, 3500);
  }

  /* ── 미니게임 ────────────────────────────────────────── */
  function startMinigame(item) {
    const cfg = MINI_CONFIG.common;
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
    stopScanPanel();
    stopStatusScanning();
    if (statusMsg) statusMsg.classList.add('hidden');
    resultCard.className = 'result-card hidden rarity-common';
    if (!item.pixelArt) {
      item.pixelArt = await generateCatchPixelArt(item);
    }
    const art = item.pixelArt;
    if (resultSpriteHost) {
      mountPixelArt(resultSpriteHost, art, 128, 128);
    }
    if (resultRarity) {
      resultRarity.className = 'result-rarity rarity-common';
      resultRarity.textContent = RARITY_LABEL.common;
    }
    resultName.textContent  = item.name;
    resultSize.textContent  = `${item.size}kg`;
    resultCoins.textContent = `${item.coins} 코인`;
    resultCard.classList.remove('hidden');

    totalCatches += 1;
    updateCatchesDisplay();
  }

  /* ── 서버 저장 + 적재함 추가 ─────────────────────────── */
  async function saveCatch(item) {
    let catchId = null;
    // 픽셀 패턴이 있으면 정제해서 전송, 없으면 서버가 자체 생성
    const pixelArtForServer = item.pixelArt
      ? serializePixelArt(item.pixelArt)
      : null;

    if (isLoggedIn && alpToken && platformApi) {
      try {
        const body = {
          itemName:  item.name,
          itemEmoji: typeof item.emoji === 'string' ? item.emoji.slice(0, 10) : '',
          itemType:  item.type,
          rarity:    'common',
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
      rarity: 'common',
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

  function showStatus(msg) {
    stopStatusScanning();
    statusMsg.textContent = msg;
    statusMsg.classList.remove('hidden');
  }

  /* ── 이벤트 ──────────────────────────────────────────── */
  castBtn.addEventListener('click', () => {
    if (state === 'IDLE') goCasting();
  });

  // 적재함: 팔기 버튼 / 그 외 영역 클릭 → 3D 복셀 보기
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

  /* 적재함: 마우스 드래그 스크롤 — 세로 스트립 모드는 좌우, 그 외는 세로 */
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
  void initPlayerSprite();
  updateCoinDisplay();
  updateCatchesDisplay();
  renderInventory();
})();
