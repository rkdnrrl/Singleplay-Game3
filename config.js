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
  // 도감 목록 GET — 기본 `{플랫폼}/api/codex` (Bearer는 URL에 token= 있으면 자동 첨부됨).
  // 응답: 배열 또는 { items|codex|codexItems|entries|data: [...] }.
  // 각 항목은 name/itemName 등 + 선택 pixelArt({ w,h,palette,cells }) 가 있으면 배경 플로터로 표시.
  // window.__ALP_CODEX_API_PATH__ = 'game/codex';
  // window.__ALP_CODEX_API__ = 'https://example.com/api/codex';
  //
  // 야적장 플레이어 스프라이트 — 원본 32×32 PNG/WebP 권장.
  // 비우면 코드에 있는 기본 작업원 픽셀아트가 쓰입니다.
  // window.__PLAYER_SPRITE_URL__ = '/assets/player.png';
})();
