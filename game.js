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

  // 미니게임 설정 (희귀도별)
  const MINI_CONFIG = {
    common:    { zoneRatio: 0.36, speed: 60, erratic: false },
    rare:      { zoneRatio: 0.30, speed: 90, erratic: false },
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
  const logList           = document.getElementById('logList');

  /* ── 플랫폼 연동 ─────────────────────────────────────── */
  const urlParams   = new URLSearchParams(window.location.search);
  const alpToken    = urlParams.get('token');
  const platformApi = window.__ALP_PLATFORM_API__ || '';

  let isLoggedIn   = false;
  let totalCoins   = 0;
  let totalCatches = 0;

  if (alpToken && platformApi) {
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

    // 최근 포획 로드
    fetch(`${platformApi}/api/catches?limit=10`, {
      headers: { Authorization: `Bearer ${alpToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.catches?.length) {
          totalCatches = data.total ?? 0;
          updateCatchesDisplay();
          data.catches.forEach(c => addLogItem(c.itemName, c.rarity, c.coinValue, new Date(c.caughtAt)));
        }
      })
      .catch(() => {});
  }

  function updateCoinDisplay() {
    if (!coinCountEl) return;
    coinCountEl.textContent = isLoggedIn ? totalCoins.toLocaleString() : '로그인 필요';
  }
  function updateCatchesDisplay() {
    if (totalCatchesEl) totalCatchesEl.textContent = totalCatches.toLocaleString();
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

  /* ── 게임 상태 ───────────────────────────────────────── */
  // IDLE → CASTING → WAITING → MINIGAME → RESULT
  let state = 'IDLE';
  let currentItem = null;

  // 미니게임 내부 상태
  let mini = {
    trackH: 0, zoneH: 0, zoneY: 0,
    barH: 0, barY: 0,
    pressing: false,
    progress: 0,          // 0~1
    targetVY: 0,          // 현재 속도
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

    // 타겟 존 이동
    mini.zoneY += mini.targetVY * dt;
    if (mini.zoneY <= 0) { mini.zoneY = 0; mini.targetVY *= -1; }
    if (mini.zoneY + mini.zoneH >= mini.trackH) {
      mini.zoneY = mini.trackH - mini.zoneH;
      mini.targetVY *= -1;
    }
    // 불규칙 움직임
    if (cfg.erratic && Math.random() < 0.015) {
      mini.targetVY = cfg.speed * (Math.random() * 2 - 1);
    }

    // 캐치 바 이동
    const gravity = mini.pressing ? -320 : 280;
    mini.barY = Math.max(0, Math.min(mini.trackH - mini.barH, mini.barY + gravity * dt));

    // 겹치는지 확인
    const barTop = mini.barY, barBot = mini.barY + mini.barH;
    const zoneTop = mini.zoneY, zoneBot = mini.zoneY + mini.zoneH;
    const overlap = Math.min(barBot, zoneBot) - Math.max(barTop, zoneTop);
    const overlapRatio = Math.max(0, overlap) / mini.zoneH;

    // 진행도 업데이트
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

  // 누르기 이벤트
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
    resultCoins.textContent = `+${item.coins}🪙`;
    resultCard.classList.remove('hidden');

    totalCoins += item.coins;
    totalCatches += 1;
    updateCoinDisplay();
    updateCatchesDisplay();
    addLogItem(item.name, item.rarity, item.coins, new Date());
  }

  function addLogItem(name, rarity, coins, date) {
    const empty = logList.querySelector('.log-empty');
    if (empty) empty.remove();

    const item = ITEMS.find(i => i.name === name);
    const emoji = item?.emoji ?? '❓';

    const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    const el = document.createElement('div');
    el.className = `log-item rarity-${rarity}`;
    el.innerHTML = `
      <span class="log-item-emoji">${emoji}</span>
      <span class="log-item-name">${name}</span>
      <span class="log-item-coins">+${coins}🪙</span>
      <span class="log-item-time">${timeStr}</span>
    `;

    logList.insertBefore(el, logList.firstChild);
    // 최대 15개 유지
    while (logList.children.length > 15) logList.removeChild(logList.lastChild);
  }

  /* ── 서버 저장 ───────────────────────────────────────── */
  function saveCatch(item) {
    if (!isLoggedIn || !alpToken || !platformApi) return;
    fetch(`${platformApi}/api/catches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alpToken}`,
      },
      body: JSON.stringify({
        itemName:  item.name,
        itemType:  item.type,
        rarity:    item.rarity,
        size:      item.size,
        coinValue: item.coins,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .catch(() => {});
  }

  /* ── 유틸 ────────────────────────────────────────────── */
  function showStatus(msg) {
    statusMsg.textContent = msg;
    statusMsg.classList.remove('hidden');
  }

  /* ── 시작 ────────────────────────────────────────────── */
  castBtn.addEventListener('click', () => {
    if (state === 'IDLE') goCasting();
  });

  updateCoinDisplay();
  updateCatchesDisplay();
})();
