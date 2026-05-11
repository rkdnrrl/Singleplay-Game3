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
  // 야적장 플레이어 — 단일 정지 스프라이트(폴백). 원본 32×32 PNG/WebP 권장. 비우면 코드 기본 픽셀.
  // 로컬에서 index.html을 file:// 로 열면 `/assets/...` 는 깨지므로 상대 경로 권장.
  window.__PLAYER_SPRITE_URL__ = 'assets/player/player.png';
  //
  // 96×96 등 큰 픽셀 스프라이트: 아래 두 줄을 켜면 32×32로 줄이지 않고 원본 그리드를 그대로 씀.
  // 화면에 보이는 크기만 바꾸려면 `__PLAYER_DISPLAY_CSS_W__` / `__PLAYER_DISPLAY_CSS_H__` (비우면 프레임 크기와 동일).
  window.__PLAYER_FRAME_WIDTH__ = 92;
  window.__PLAYER_FRAME_HEIGHT__ = 92;
  //
  // 애니메이션 — `idle/1.png`, `idle/2.png` … (기본 시작 1, `__PLAYER_IDLE_FRAME_START__` 로 0 등 변경 가능)
  // action 도 `action/1.png` … (기본 시작 1, `__PLAYER_ACTION_FRAME_START__`)
  // idle 폴더가 비어 있고 action 만 있으면 대기 화면은 코드 기본 캐릭터, 미니게임 누를 때만 action 루프.
  // 수동 목록이 필요하면 아래 배열이 폴더 스캔보다 우선.
  // window.__PLAYER_ANIM_MS__ = 110;
  // window.__PLAYER_IDLE_DIR__ = 'assets/player/idle';
  // window.__PLAYER_ACTION_DIR__ = 'assets/player/action';
  // window.__PLAYER_DISABLE_FOLDER_SCAN__ = true;
  // window.__PLAYER_FOLDER_MAX_FRAMES__ = 48;
  // window.__PLAYER_FOLDER_FRAME_GAP_ABORT__ = 3;
  // window.__PLAYER_IDLE_FRAMES__ = ['assets/player/idle/1.png', 'assets/player/idle/2.png'];
  // window.__PLAYER_ACTION_FRAMES__ = ['assets/player/action/1.png', 'assets/player/action/2.png'];
})();
