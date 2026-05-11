/**
 * 로컬에서 정적 호스팅하거나 index.html만 열 때 사용하는 기본값입니다.
 *
 * `node server.js`로 실행하면 Express가 같은 경로 `/config.js`를 **먼저** 처리해
 * `__ALP_PLATFORM_API__`만 주입합니다. 그 경우 이 파일은 디스크에서 서빙되지 않습니다.
 */
(function () {
  'use strict';
  if (typeof window.__ALP_PLATFORM_API__ === 'undefined') {
    window.__ALP_PLATFORM_API__ = '';
  }
  // Twemoji 72×72 PNG 베이스 URL (끝에 / 권장). 미설정 시 game.js 기본 CDN 사용.
  // window.__TWEMOJI_CDN_72__ = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/';
  //
  // 이름에 키워드가 포함되면 해당 URL 이미지를 이모지보다 먼저 픽셀아트로 씀 (PNG/WebP 권장).
  // 같은 폴더에 두면 CORS 없음. 외부 URL은 이미지 서버가 CORS 허용해야 함.
  // window.__CATCH_SPRITE_RULES__ = [
  //   { kw: '피라냐', url: '/assets/sprites/piranha.png' },
  //   { kw: '고등어', url: 'https://your-cdn.example/fish/mackerel.webp' },
  // ];
  // 필요 시 주석 해제
  // window.__ALP_CATCH_GAME_ID__ = 2;
  //window.__ALP_EASY_EPIC_TEST__ = true;
})();
