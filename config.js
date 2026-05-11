/**
 * 클라이언트 기본값입니다.
 *
 * `node server.js`로 실행하면 `/config.js` 응답이 **플랫폼 API 한 줄 + 이 파일 전체**로 합쳐집니다.
 */
(function () {
  'use strict';
  if (typeof window.__ALP_PLATFORM_API__ === 'undefined') {
    window.__ALP_PLATFORM_API__ = '';
  }
  // 이름에 키워드가 포함되면 해당 URL 이미지를 절차적 패턴보다 먼저 픽셀아트로 씀 (PNG/WebP 권장).
  // 같은 폴더에 두면 CORS 없음. 외부 URL은 이미지 서버가 CORS 허용해야 함.
  // window.__CATCH_SPRITE_RULES__ = [
  //   { kw: '볼트', url: '/assets/sprites/bolt.png' },
  // ];
  // 필요 시 주석 해제
  // window.__ALP_CATCH_GAME_ID__ = 2;
  //
  // 야적장 플레이어 스프라이트 — 원본 32×32 PNG/WebP 권장.
  // 비우면 코드에 있는 기본 작업원 픽셀아트가 쓰입니다.
  // window.__PLAYER_SPRITE_URL__ = '/assets/player.png';
})();
