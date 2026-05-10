(function () {
  const STORAGE_KEY = 'fishing-clicker-high';
  const COIN_SAVE_INTERVAL = 5000;

  const fishBtn = document.getElementById('fish');
  const stage = document.getElementById('stage');
  const tensionLayer = document.getElementById('tensionLayer');
  const hpFill = document.getElementById('hpFill');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const caughtEl = document.getElementById('caught');
  const comboEl = document.getElementById('combo');
  const coinCountEl = document.getElementById('coinCount');

  const urlParams = new URLSearchParams(window.location.search);
  const alpToken = urlParams.get('token');
  const platformApi = window.__ALP_PLATFORM_API__ || '';

  let score = 0;
  let caughtCount = 0;
  let highScore = Number(localStorage.getItem(STORAGE_KEY)) || 0;
  let maxHp = 8;
  let hp = maxHp;
  let combo = 0;
  let comboTimer = null;
  let reeling = false;

  let totalCoins = 0;
  let pendingCoins = 0;
  let isLoggedIn = false;

  if (alpToken && platformApi) {
    fetch(`${platformApi}/api/auth/me`, {
      headers: { Authorization: `Bearer ${alpToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          isLoggedIn = true;
          totalCoins = data.user.coins ?? 0;
          updateCoinDisplay();
        }
      })
      .catch(() => {});
  }

  function updateCoinDisplay() {
    if (!coinCountEl) return;
    if (!isLoggedIn) {
      coinCountEl.textContent = '로그인 필요';
      return;
    }
    const display = totalCoins + pendingCoins;
    coinCountEl.textContent = display.toLocaleString();
  }

  setInterval(() => {
    if (!isLoggedIn || pendingCoins <= 0 || !alpToken || !platformApi) return;
    const amount = pendingCoins;
    pendingCoins = 0;
    fetch(`${platformApi}/api/coins/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alpToken}`,
      },
      body: JSON.stringify({ amount }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.coins !== undefined) {
          totalCoins = data.coins;
          updateCoinDisplay();
        }
      })
      .catch(() => {
        pendingCoins += amount;
      });
  }, COIN_SAVE_INTERVAL);

  highScoreEl.textContent = String(highScore);

  function persistHigh() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(STORAGE_KEY, String(highScore));
      highScoreEl.textContent = String(highScore);
    }
  }

  function updateHpBar() {
    const ratio = Math.max(0, hp / maxHp);
    hpFill.style.transform = `scaleX(${ratio})`;
  }

  /** 물고기가 버티는 정도: 체력이 많을수록 물결이 거침 */
  function setSplashIntensity(strength) {
    const t = Math.min(1, Math.max(0, strength));
    tensionLayer.innerHTML = '';
    if (t < 0.05) return;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const cx = 50;
    const cy = 50;
    const rings = Math.floor(2 + t * 6);
    for (let i = 0; i < rings; i += 1) {
      const r = 12 + (i / rings) * (22 + t * 18) + Math.random() * 4;
      const ellipse = document.createElementNS(ns, 'ellipse');
      ellipse.setAttribute('cx', String(cx + (Math.random() - 0.5) * 6 * t));
      ellipse.setAttribute('cy', String(cy + (Math.random() - 0.5) * 4 * t));
      ellipse.setAttribute('rx', String(r * 0.95));
      ellipse.setAttribute('ry', String(r * 0.55));
      ellipse.setAttribute('fill', 'none');
      const a = 0.15 + t * 0.35;
      ellipse.setAttribute('stroke', `rgba(200, 240, 255, ${a})`);
      ellipse.setAttribute('stroke-width', (0.4 + t * 1.1).toFixed(2));
      svg.appendChild(ellipse);
    }

    const branches = Math.floor(1 + t * 4);
    for (let i = 0; i < branches; i += 1) {
      const angle = (i / branches) * Math.PI * 2 + t * 0.6;
      const len = 14 + t * 22 + Math.random() * 8;
      const x2 = cx + Math.cos(angle) * len * 0.4;
      const y2 = cy + Math.sin(angle) * len * 0.25;
      const x3 = cx + Math.cos(angle) * len;
      const y3 = cy + Math.sin(angle) * len * 0.35;

      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', `M ${cx} ${cy} L ${x2} ${y2} L ${x3} ${y3}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', `rgba(255, 255, 255, ${0.2 + t * 0.35})`);
      path.setAttribute('stroke-width', (0.5 + t).toFixed(2));
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    }
    tensionLayer.appendChild(svg);
  }

  function bumpCombo() {
    combo += 1;
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      combo = 0;
      comboEl.classList.add('hidden');
    }, 1200);
    comboEl.textContent = `콤보 ×${combo}`;
    comboEl.classList.remove('hidden');
  }

  function spawnFloatText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'float-score';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function spawnParticles(x, y, count) {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('div');
      p.className = 'particle';
      const dx = (Math.random() - 0.5) * 140;
      const dy = (Math.random() - 0.5) * 140 - 40;
      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      document.body.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  function nextFish() {
    caughtCount += 1;
    caughtEl.textContent = String(caughtCount);
    maxHp = Math.min(40, 8 + Math.floor(caughtCount * 1.2));
    hp = maxHp;
    updateHpBar();
    setSplashIntensity(hp / maxHp);
  }

  function finishCatch(clientX, clientY) {
    reeling = true;
    fishBtn.disabled = true;
    fishBtn.classList.add('caught');

    const bonus = 25 + maxHp * 2 + combo * 3;
    score += bonus;
    scoreEl.textContent = String(score);
    persistHigh();

    const coinsEarned = Math.max(5, Math.floor(bonus * 0.1));
    if (isLoggedIn) {
      pendingCoins += coinsEarned;
      updateCoinDisplay();
    }

    const x = clientX ?? stage.getBoundingClientRect().left + stage.offsetWidth / 2;
    const y = clientY ?? stage.getBoundingClientRect().top + stage.offsetHeight / 2;
    spawnFloatText(x, y, `+${bonus} 입각!`);
    spawnParticles(x, y, 14);

    setTimeout(() => {
      fishBtn.classList.remove('caught');
      nextFish();
      fishBtn.disabled = false;
      reeling = false;
    }, 480);
  }

  function clientPoint(ev) {
    if (ev.changedTouches && ev.changedTouches[0]) {
      const t = ev.changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: ev.clientX, y: ev.clientY };
  }

  let lastHitFromPointer = false;

  function reelIn(ev) {
    if (reeling) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;

    bumpCombo();
    const mult = 1 + Math.min(5, combo) * 0.08;
    const base = Math.max(1, Math.round(2 * mult));
    score += base;
    scoreEl.textContent = String(score);
    persistHigh();

    hp -= 1;
    updateHpBar();
    setSplashIntensity(hp / maxHp);

    fishBtn.style.transform = `translate(${(Math.random() - 0.5) * 8}px, ${(Math.random() - 0.5) * 6}px) scale(0.97)`;
    requestAnimationFrame(() => {
      fishBtn.style.transform = '';
    });

    const { x, y } = clientPoint(ev);
    spawnFloatText(x, y, `+${base}`);

    if (hp <= 0) {
      finishCatch(x, y);
    }
  }

  fishBtn.addEventListener(
    'pointerdown',
    (ev) => {
      if (!ev.isPrimary) return;
      lastHitFromPointer = true;
      reelIn(ev);
    },
    { passive: true }
  );

  fishBtn.addEventListener('click', (ev) => {
    if (lastHitFromPointer) {
      lastHitFromPointer = false;
      return;
    }
    reelIn(ev);
  });

  updateHpBar();
  setSplashIntensity(hp / maxHp);
})();
