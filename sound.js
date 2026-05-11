/**
 * 메인 BGM — 브라우저 정책상 첫 `play()`는 사용자 제스처 이후에만 성공하는 경우가 많음.
 * `pointerdown` / `keydown`으로 한 번 재생을 시도하고, 성공하면 리스너를 제거함.
 */
(function () {
  'use strict';

  const noopApi = {
    tryStartMainBgm: async () => false,
    isMainBgmStarted: () => false,
  };

  if (window.__ALP_SOUND_BGM_DISABLED__) {
    window.__ALP_GAME_SOUND__ = noopApi;
    return;
  }

  function bgmBasePath() {
    const raw =
      typeof window.__ALP_SOUND_BGM_BASE__ === 'string' && String(window.__ALP_SOUND_BGM_BASE__).trim()
        ? String(window.__ALP_SOUND_BGM_BASE__).trim()
        : 'sounds/bgm';
    return raw.replace(/\/+$/, '');
  }

  const MAIN_CANDIDATES = ['main_loop.mp3', 'main_loop.ogg', 'main_loop.m4a'];

  let mainBgm = null;
  let mainBgmStarted = false;
  let candidateIndex = 0;

  function currentMainUrl() {
    return `${bgmBasePath()}/${MAIN_CANDIDATES[candidateIndex]}`;
  }

  function ensureMainBgm() {
    if (mainBgm) return mainBgm;
    mainBgm = new Audio();
    mainBgm.loop = true;
    mainBgm.preload = 'auto';
    const vol = Number(window.__ALP_SOUND_BGM_VOLUME__);
    mainBgm.volume =
      Number.isFinite(vol) && vol >= 0 && vol <= 1 ? vol : 0.45;
    mainBgm.src = currentMainUrl();

    let errLogged = false;
    mainBgm.addEventListener(
      'error',
      () => {
        if (candidateIndex < MAIN_CANDIDATES.length - 1) {
          candidateIndex += 1;
          mainBgm.src = currentMainUrl();
          mainBgm.load();
          return;
        }
        if (!errLogged) {
          errLogged = true;
          console.warn('[BGM] 파일을 불러오지 못했습니다. 경로를 확인하세요:', currentMainUrl());
        }
      },
      { passive: true },
    );

    return mainBgm;
  }

  async function tryStartMainBgm() {
    if (mainBgmStarted) return true;
    const a = ensureMainBgm();
    try {
      await a.play();
      mainBgmStarted = true;
      return true;
    } catch {
      return false;
    }
  }

  function bindUserGestureOnce() {
    const handler = () => {
      void tryStartMainBgm().then((ok) => {
        if (ok) {
          document.removeEventListener('pointerdown', handler, true);
          document.removeEventListener('keydown', handler, true);
        }
      });
    };
    document.addEventListener('pointerdown', handler, { capture: true, passive: true });
    document.addEventListener('keydown', handler, { capture: true, passive: true });
  }

  ensureMainBgm();
  bindUserGestureOnce();

  window.__ALP_GAME_SOUND__ = {
    tryStartMainBgm,
    isMainBgmStarted: () => mainBgmStarted,
  };
})();
