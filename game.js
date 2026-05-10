(function () {
  'use strict';

  /* ── 아이템 테이블 ───────────────────────────────────── */
  const ITEMS = [
    // Common (55%)
    { name: '플라즈마 피라냐',   emoji: '🐟', type: 'fish',     rarity: 'common',    coins: 5,   sizeMin: 8,  sizeMax: 25 },
    { name: '성운 청어',        emoji: '🐠', type: 'fish',     rarity: 'common',    coins: 3,   sizeMin: 5,  sizeMax: 18 },
    { name: '우주 플랑크톤',     emoji: '🦠', type: 'creature', rarity: 'common',    coins: 2,   sizeMin: 1,  sizeMax: 5  },
    { name: '위성 파편',        emoji: '🛸', type: 'artifact', rarity: 'common',    coins: 4,   sizeMin: 3,  sizeMax: 15 },
    { name: '우주 크리스탈',     emoji: '💎', type: 'crystal',  rarity: 'common',    coins: 6,   sizeMin: 2,  sizeMax: 10 },
    { name: '우주 쓰레기',       emoji: '🗑️', type: 'debris',  rarity: 'common',    coins: 1,   sizeMin: 5,  sizeMax: 30 },
    // Rare (28%)
    { name: '크리스탈 상어',     emoji: '🦈', type: 'fish',     rarity: 'rare',      coins: 25,  sizeMin: 40, sizeMax: 90 },
    { name: '은하 오징어',       emoji: '🦑', type: 'fish',     rarity: 'rare',      coins: 18,  sizeMin: 20, sizeMax: 55 },
    { name: '네뷸라 해파리',     emoji: '🪼', type: 'creature', rarity: 'rare',      coins: 20,  sizeMin: 10, sizeMax: 40 },
    { name: '고대 회로',        emoji: '🔌', type: 'artifact', rarity: 'rare',      coins: 22,  sizeMin: 5,  sizeMax: 20 },
    { name: '다크 매터 결정',    emoji: '🌑', type: 'crystal',  rarity: 'rare',      coins: 30,  sizeMin: 3,  sizeMax: 12 },
    { name: '고장난 드론',       emoji: '🤖', type: 'debris',   rarity: 'rare',      coins: 15,  sizeMin: 15, sizeMax: 50 },
    // Epic (13%)
    { name: '블랙홀 고래',       emoji: '🐋', type: 'fish',     rarity: 'epic',      coins: 80,  sizeMin: 200,sizeMax: 500 },
    { name: '타임 물고기',       emoji: '⏱️', type: 'fish',     rarity: 'epic',      coins: 65,  sizeMin: 30, sizeMax: 80 },
    { name: '반중력 돌고래',     emoji: '🐬', type: 'creature', rarity: 'epic',      coins: 70,  sizeMin: 80, sizeMax: 180 },
    { name: '외계 석판',        emoji: '📿', type: 'artifact', rarity: 'epic',      coins: 90,  sizeMin: 20, sizeMax: 60 },
    { name: '퀀텀 코어',        emoji: '🔮', type: 'crystal',  rarity: 'epic',      coins: 100, sizeMin: 5,  sizeMax: 15 },
    { name: 'AI 코어 파편',     emoji: '💻', type: 'debris',   rarity: 'epic',      coins: 60,  sizeMin: 10, sizeMax: 30 },
    // Legendary (4%)
    { name: '우주 드래곤피쉬',   emoji: '🐉', type: 'fish',     rarity: 'legendary', coins: 350, sizeMin: 300,sizeMax: 800 },
    { name: '우주 드래곤',       emoji: '🐲', type: 'creature', rarity: 'legendary', coins: 450, sizeMin: 500,sizeMax: 1200 },
    { name: '타임 캡슐',        emoji: '⏰', type: 'artifact', rarity: 'legendary', coins: 400, sizeMin: 20, sizeMax: 50 },
    { name: '오메가 크리스탈',   emoji: '✨', type: 'crystal',  rarity: 'legendary', coins: 500, sizeMin: 8,  sizeMax: 20 },
    { name: '전설의 우주선 엔진', emoji: '🚀', type: 'debris',   rarity: 'legendary', coins: 380, sizeMin: 100,sizeMax: 300 },
  ];

  const RARITY_WEIGHT = { common: 55, rare: 28, epic: 13, legendary: 4 };
  const RARITY_LABEL  = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

  const MINI_CONFIG = {
    common:    { zoneRatio: 0.36, speed: 60,  erratic: false },
    rare:      { zoneRatio: 0.30, speed: 90,  erratic: false },
    epic:      { zoneRatio: 0.24, speed: 120, erratic: true  },
    legendary: { zoneRatio: 0.18, speed: 160, erratic: true  },
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
  const resultEmoji       = document.getElementById('resultEmoji');
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

  let isLoggedIn   = false;
  let totalCoins   = 0;
  let totalCatches = 0;
  let inventory    = []; // { id, name, emoji, rarity, coins }
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
              emoji: c.itemEmoji || '❓',
              rarity: c.rarity,
              coins: c.coinValue,
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
  function rollRarity() {
    const total = Object.values(RARITY_WEIGHT).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [rarity, w] of Object.entries(RARITY_WEIGHT)) {
      r -= w;
      if (r <= 0) return rarity;
    }
    return 'common';
  }

  function rollItem() {
    const rarity = rollRarity();
    const pool   = ITEMS.filter(i => i.rarity === rarity);
    const item   = pool[Math.floor(Math.random() * pool.length)];
    const size   = +(item.sizeMin + Math.random() * (item.sizeMax - item.sizeMin)).toFixed(1);
    return { ...item, size };
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
        <span class="inv-emoji">${item.emoji}</span>
        <span class="inv-name">${item.name}</span>
        <span class="inv-coins">${item.coins}🪙</span>
        ${canSell
          ? `<button class="inv-sell-btn" data-id="${item.id}">팔기</button>`
          : `<span class="inv-sell-pending">${isLoggedIn ? '저장 중' : '로그인 필요'}</span>`
        }
      `;
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
    const cfg = MINI_CONFIG[item.rarity];
    mini.cfg = cfg;
    mini.trackH = minigameTrack.clientHeight || 160;
    mini.zoneH  = Math.floor(mini.trackH * cfg.zoneRatio);
    mini.zoneY  = Math.floor((mini.trackH - mini.zoneH) / 2);
    mini.barH   = Math.floor(mini.trackH * 0.2);
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
    if (cfg.erratic && Math.random() < 0.015) {
      mini.targetVY = cfg.speed * (Math.random() * 2 - 1);
    }

    const gravity = mini.pressing ? -320 : 280;
    mini.barY = Math.max(0, Math.min(mini.trackH - mini.barH, mini.barY + gravity * dt));

    const barTop = mini.barY, barBot = mini.barY + mini.barH;
    const zoneTop = mini.zoneY, zoneBot = mini.zoneY + mini.zoneH;
    const overlap = Math.min(barBot, zoneBot) - Math.max(barTop, zoneTop);
    const overlapRatio = Math.max(0, overlap) / mini.zoneH;

    const delta = overlapRatio > 0.4 ? 0.35 : -0.25;
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
    resultEmoji.textContent = item.emoji;
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
            itemEmoji: item.emoji,
            itemType:  item.type,
            rarity:    item.rarity,
            size:      item.size,
            coinValue: item.coins,
          }),
        });
        const data = res.ok ? await res.json() : null;
        catchId = data?.catch?.id ?? null;
      } catch {}
    }

    inventory.push({
      id: catchId,
      name: item.name,
      emoji: item.emoji,
      rarity: item.rarity,
      coins: item.coins,
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
