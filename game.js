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

  const CATCH_TYPES = ['fish', 'creature', 'artifact', 'crystal', 'debris'];

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
      core: ['파편', '석판', '회로', '모듈', '유물', '인공물', '잔해'],
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

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateCatchName(type) {
    const p = NAME_PARTS[type] || NAME_PARTS.fish;
    const a = pick(p.pre);
    const b = pick(p.core);
    const c = pick(p.post);
    if (Math.random() < 0.35) return `${a} ${b}${c}`;
    if (Math.random() < 0.5) return `${b}${c}`;
    return `${a} ${b}${c}`;
  }

  /** 0~100: 높을수록 희귀·에픽·전설 쪽 가중 */
  function prestigeFromName(name) {
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

    const len = [...name].length;
    if (len >= 14) s += 13;
    else if (len >= 10) s += 8;
    else if (len >= 7) s += 4;
    else if (len <= 3) s -= 10;

    if ((name.match(/ /g) || []).length >= 2) s += 5;

    return Math.max(0, Math.min(100, s));
  }

  /** prestige + 약간의 랜덤으로 최종 희귀도 */
  function rarityFromName(name) {
    const p = prestigeFromName(name);
    const noise = (Math.random() - 0.5) * 20;
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
    const typeMul = { fish: 1.05, creature: 1.0, artifact: 1.08, crystal: 1.12, debris: 0.92 }[type] || 1;
    const jitter = 0.88 + Math.random() * 0.26;
    const raw = base * sizeBoost * typeMul * jitter;
    const rounded = Math.round(raw);
    return Math.max(rarity === 'legendary' ? 120 : rarity === 'epic' ? 35 : rarity === 'rare' ? 8 : 2, rounded);
  }

  /* ── 픽셀 스프라이트 (DB JSON + 화면 표시) ───────────── */
  const PIXEL_PALETTES = {
    common:    ['#0d1b2a', '#415a77', '#778da9', '#e0e1dd', '#1b263b', '#a8dadc'],
    rare:      ['#1a0a2e', '#5a189a', '#9d4edd', '#c77dff', '#e0aaff', '#10002b'],
    epic:      ['#1a0505', '#6a040f', '#9d0208', '#d00000', '#ffba08', '#370617'],
    legendary: ['#1a1200', '#b8860b', '#ffd700', '#fff4b8', '#8b6914', '#ffec8b'],
  };

  function hashCatchSeed(item) {
    const s = `${item.name}\0${item.size}\0${item.rarity}\0${item.type}`;
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** 이름·타입·크기 시드로 실루엣이 갈리는 픽셀 (이모지 없음) */
  function generateCatchPixelArt(item) {
    const w = 14;
    const h = 10;
    const palette = PIXEL_PALETTES[item.rarity] || PIXEL_PALETTES.common;
    const type = item.type || 'fish';
    let state = hashCatchSeed(item);
    function rnd() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0xffffffff;
    }

    const debrisRects = [];
    if (type === 'debris') {
      const n = 3 + Math.floor(rnd() * 4);
      for (let i = 0; i < n; i += 1) {
        debrisRects.push({
          x0: Math.floor(rnd() * 9),
          y0: Math.floor(rnd() * 7),
          rw: 2 + Math.floor(rnd() * 5),
          rh: 1 + Math.floor(rnd() * 4),
        });
      }
    }

    const fishAx = 0.38 + rnd() * 0.12;
    const fishBy = 0.32 + rnd() * 0.1;
    const fishStretch = 0.88 + rnd() * 0.22;
    const crystalRot = rnd() * Math.PI * 0.35;
    const cryTh = 0.44 + rnd() * 0.14;
    const creBlobR = 0.32 + rnd() * 0.1;
    const creWarpPh = rnd() * 2;
    const artSlotX = 0.22 + rnd() * 0.18;
    const artSlotY = rnd() * 0.12;

    function inDebrisPixel(px, py) {
      for (let i = 0; i < debrisRects.length; i += 1) {
        const r = debrisRects[i];
        if (px >= r.x0 && px < r.x0 + r.rw && py >= r.y0 && py < r.y0 + r.rh) return true;
      }
      return false;
    }

    const cells = [];
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const nx = ((x + 0.5) / w) * 2 - 1;
        const ny = ((y + 0.5) / h) * 2 - 1;
        let filled = false;
        let accent = false;
        let eye = false;
        let shine = false;

        if (type === 'fish') {
          const ex = nx / (fishAx * fishStretch);
          const ey = ny / fishBy;
          const body = ex * ex + ey * ey < 1;
          const tail = nx < -0.26 && nx > -0.92 && Math.abs(ny) < 0.4;
          const fin = nx > -0.18 && nx < 0.22 && ny < -0.18 && ny > -0.5;
          filled = body || tail || fin;
          eye = nx > 0.14 && nx < 0.36 && ny > -0.12 && ny < 0.14;
          accent = tail && ((x + y) & 1) === 0;
        } else if (type === 'creature') {
          const warp = Math.sin(nx * 4.2 + creWarpPh) * 0.11;
          const wy = ny + warp;
          const blob = nx * nx * 0.72 + wy * wy * 0.88 < creBlobR;
          const bump = (nx - 0.22) ** 2 + (ny + 0.22) ** 2 < 0.055;
          const tendril = nx < -0.15 && Math.abs(ny + nx * 0.4) < 0.2 && nx > -0.75;
          filled = blob || bump || tendril;
          eye = nx > 0.08 && nx < 0.26 && Math.abs(ny) < 0.11;
        } else if (type === 'artifact') {
          const plate = Math.abs(nx) < 0.52 && Math.abs(ny) < 0.3;
          const notch = Math.abs(nx - 0.38) < 0.09 && ny > 0.06;
          const railH = Math.abs(ny - artSlotY) < 0.07 && nx > -0.42 && nx < 0.48;
          const railV = Math.abs(nx - artSlotX) < 0.06 && Math.abs(ny) < 0.35;
          const corner = (Math.abs(nx) > 0.35 && Math.abs(ny) > 0.18) && plate && Math.abs(nx) + Math.abs(ny) < 0.72;
          filled = (plate && !notch) || railH || railV || corner;
          eye = nx > 0.28 && nx < 0.42 && Math.abs(ny) < 0.07;
          shine = plate && !notch && nx > 0.15 && ny < -0.05;
        } else if (type === 'crystal') {
          const cx = nx * Math.cos(crystalRot) - ny * Math.sin(crystalRot);
          const cy = nx * Math.sin(crystalRot) + ny * Math.cos(crystalRot);
          const fac = Math.abs(cx) * 0.52 + Math.abs(cy) * 0.72;
          filled = fac < cryTh;
          shine = fac > cryTh * 0.68 && fac < cryTh * 0.88 && cx > -0.05;
          const facet = Math.abs(Math.abs(cx) - Math.abs(cy)) < 0.08 && filled;
          accent = facet;
        } else {
          filled = inDebrisPixel(x, y);
          accent = filled && (x + y) % 3 === 0;
        }

        let idx;
        if (eye) {
          idx = Math.min(5, palette.length - 1);
        } else if (shine) {
          idx = Math.min(palette.length - 1, 3 + Math.floor(rnd() * 2));
        } else if (filled) {
          if (accent) {
            idx = 2 + Math.floor(rnd() * 2);
          } else {
            const strip = Math.floor((x + y * 2 + rnd() * 2) % 3);
            idx = 1 + strip;
            if (rnd() > 0.82) idx = Math.min(palette.length - 2, idx + 1);
          }
        } else {
          idx = 0;
        }
        cells.push(idx);
      }
    }
    return { w, h, palette, cells };
  }

  /** 보관함 등에서 픽셀 재생성용 최소 필드 */
  function itemStubForArt(row) {
    return {
      name: row.name,
      type: row.type || 'fish',
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
    for (let i = 0; i < art.cells.length; i += 1) {
      const cidx = art.cells[i];
      const px = i % art.w;
      const py = Math.floor(i / art.w);
      ctx.fillStyle = art.palette[cidx] || '#000';
      ctx.fillRect(px, py, 1, 1);
    }
    const scale = 4;
    canvas.style.width = `${cssW != null ? cssW : art.w * scale}px`;
    canvas.style.height = `${cssH != null ? cssH : art.h * scale}px`;
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
  const inventoryList     = document.getElementById('inventoryList');
  const sellAllBtn        = document.getElementById('sellAllBtn');

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
              type: c.itemType || 'fish',
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

  /* ── 별 배경 ─────────────────────────────────────────── */
  (function initStars() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 140 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random(),
        da: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a += s.da;
        if (s.a > 1 || s.a < 0) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a.toFixed(2)})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();
  })();

  /* ── 아이템 뽑기 ─────────────────────────────────────── */
  function rollItem() {
    const type = pick(CATCH_TYPES);
    const name = generateCatchName(type);
    const rarity = rarityFromName(name);
    const size = rollSize(rarity);
    const coins = computeCoinValue(rarity, size, type);
    return { name, type, rarity, size, coins };
  }

  /* ── 보관함 ──────────────────────────────────────────── */
  function renderInventory() {
    if (!inventoryList) return;

    if (inventory.length === 0) {
      inventoryList.innerHTML = '<p class="log-empty">보관함이 비어있습니다</p>';
      if (sellAllBtn) sellAllBtn.classList.add('hidden');
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
        mountPixelArt(thumb, art, 36, 26);
      }
      inventoryList.appendChild(el);
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
      currentItem = rollItem();
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

  function goResult(success) {
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
    showResult(currentItem);
    saveCatch(currentItem);

    setTimeout(() => {
      resultCard.classList.add('hidden');
      goIdle();
    }, 3500);
  }

  /* ── 미니게임 ────────────────────────────────────────── */
  function startMinigame(item) {
    const cfg = MINI_CONFIG[item.rarity] || MINI_CONFIG.common;
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
      mountPixelArt(resultSpriteHost, art, 56, 40);
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
            itemEmoji: '',
            itemType:  item.type,
            rarity:    item.rarity,
            size:      item.size,
            coinValue: item.coins,
            pixelArt,
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

  /* ── 초기 렌더 ───────────────────────────────────────── */
  updateCoinDisplay();
  updateCatchesDisplay();
})();
