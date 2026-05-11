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
  // 이름에 키워드가 포함되면 해당 URL 이미지를 절차적 패턴보다 먼저 픽셀아트로 씀 (PNG/WebP 권장).
  // 같은 폴더에 두면 CORS 없음. 외부 URL은 이미지 서버가 CORS 허용해야 함.
  // window.__CATCH_SPRITE_RULES__ = [
  //   { kw: '피라냐', url: '/assets/sprites/piranha.png' },
  //   { kw: '고등어', url: 'https://your-cdn.example/fish/mackerel.webp' },
  // ];
  // 필요 시 주석 해제
  // window.__ALP_CATCH_GAME_ID__ = 2;
  //
  // 낚시 장면 위 플레이어 캐릭터 — 원본 32×32 PNG/WebP 권장(다른 비율이면 32×32로 샘플링됨).
  // 비우면 코드에 있는 기본 우주인 픽셀아트가 쓰입니다.
  // window.__PLAYER_SPRITE_URL__ = '/assets/player.png';
  //
  // 일반·희귀: AI 스캔 성공할 때마다 클라이언트에서 +100 코인(로컬 표시). 플랫폼 지갑과 동기화하려면
  // 동일 조건으로 서버에서 보너스를 지급하는 API를 따로 두는 것을 권장합니다.
  //
  // 에픽·전설 완화 허용 스위치(내부 빌드만 true). 배포는 반드시 false — URL만으로는 켜지지 않음.
  // 켤 때: 여기 true + 페이지에 `?easyEpic=1` 또는 `?testEpic=1` 둘 다 필요.
  window.__ALP_EASY_EPIC_TEST__ = false;
})();
