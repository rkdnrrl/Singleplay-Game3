/**
 * 클라이언트 기본값입니다.
 *
 * `node server.js`로 실행하면 `/config.js` 응답이 **플랫폼 API 한 줄 + 이 파일 전체**로 합쳐집니다.
 * easy 테스트는 `window.__ALP_EASY_EPIC_TEST__ === true` **이고** 주소에 `?easyEpic=1`(또는 `?testEpic=1`)일 때만 켜짐(AND).
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
  //
  // 에픽·전설 완화 허용 스위치(내부 빌드만 true). 배포는 반드시 false — URL만으로는 켜지지 않음.
  // 켤 때: 여기 true + 페이지에 `?easyEpic=1` 또는 `?testEpic=1` 둘 다 필요.
  window.__ALP_EASY_EPIC_TEST__ = false;
})();
