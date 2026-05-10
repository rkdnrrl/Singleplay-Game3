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
  // 필요 시 주석 해제
  // window.__ALP_CATCH_GAME_ID__ = 2;
   window.__ALP_EASY_EPIC_TEST__ = true;
})();
