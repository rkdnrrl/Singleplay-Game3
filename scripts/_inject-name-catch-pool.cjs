/**
 * 한 번 실행해 game.js 의 이름 풀 블록을 교체합니다.
 * node scripts/_inject-name-catch-pool.cjs
 */
const fs = require('fs');
const path = require('path');
const gamePath = path.join(__dirname, '..', 'game.js');

const NAME_CATCH_SEED = `
엑스박스 패드
플스 패드
닌텐도 패드
빔프로젝트
홈시어터
PC모니터
게이밍 의자
사무용 의자
홈매트
요가매트
덤벨
케틀벨
아령세트
풀업바
스쿼트랙
벤치프레스
런닝머신
베개
이불세트
전기담요
가죽벨트
철벨트
나무벨트
가죽지갑
가죽장갑
작업용장갑
중갑옷
경량갑옷
방탄복
방탄헬멧
철모
안전모
철식탁
나무식탁
유리식탁
철수저
은수저
동수저
스테인수저
알루미늄팬
철솥
냄비세트
프라이팬
전기포트
믹서기
전자레인지
공기청정기
선풍기
가습기
전기히터
블라인드
커튼봉
옷걸이
나무옷장
철옷장
신발장
우산꽂이
발매트
욕실매트
샤워커튼
빨래바구니
빨랫줄
철선반
나무선반
책장세트
책상램프
스탠드조명
무선마우스
유선키보드
기계식키보드
USB허브
멀티탭
연장코드
철사다리
알루미늄사다리
접이식의자
캠핑의자
철의자
나무의자
유리컵
도자기그릇
플라스틱통
스테인텀블러
은잔
동팔찌
은반지
금목걸이
나무도마
철도마
고무장화
방수장화
운동화
등산화
헬멧
무릎보호대
손목보호대
요가블록
폼롤러
점핑로프
헬스밴드
저항밴드
평행봉
철링
체인톱
전동드릴
망치세트
렌치세트
철망
와이어망
`.trim();

const NAME_CATCH_OBJ_GROUPS = {
  가구: `의자 책상 식탁 침대 소파 쿠션 방석 안락의자 리클라이너 접이식의자 높이조절의자 사무의자 게이밍의자 스툴 벤치 파티션 칸막이 책꽂이 책받침 책장 장롱 서랍장 신발장 옷장 드레스룸장 행거 행거도어 거울 탁자 사이드테이블 티테이블 콘솔 벽선반 코너선반 TV다이 TV벽걸이 스피커스탠드 거치대 CD랙 DVD랙 LP판 보관함 보석함 액자 벽시계 탁상시계 알람시계 모션센서등 무드등 스탠드 조명 벽등`,
  주방: `냄비 후라이팬 찜기 압력솥 밥솥 전기밥솥 전자레인지 오븐 토스터 그릴 에어프라이 인덕션 믹서기 블렌더 커피포트 텀블러 보온병 물병 와인잔 맥주잔 샷글라스 도마 식칼 과도 가위 칼갈이 양념통 양념병 병따개 오프너 밀폐용기 도시락 보온도시락 젓가락 숟가락 국그릇 밥그릇 접시 대접 냄비받침 식탁보 테이블보 키친타올 행주 설거지통 식기건조대 식기세척기 식세기 냉장고 냉동고 와인셀러 김치냉장고 정수기 정수필터 커피머신 원두통 티포트 전기포트 전기주전자`,
  욕실: `세면대 거울 샤워기 샤워줄 샤워커튼 욕조 발판 변기 변기커버 비데 휴지걸이 휴지통 수건걸이 수건 비누 디스펜서 칫솔통 칫솔컵 샴푸 린스 바디워시 스펀지 샤워볼 욕실매트 발매트 욕실화 슬리퍼 배수구망 배수구커버 욕실선반 코너선반 욕실장 욕실수납함 세탁바구니 세탁망 건조대 빨랫줄 다리미 다림판 스팀다리미`,
  전자: `모니터 TV 프로젝터 스피커 사운드바 헤드폰 이어폰 이어버드 마이크 웹캠 키보드 마우스 패드 게이밍마우스 무선마우스 유선키보드 기계식키보드 노트북 태블릿 스마트폰 충전기 어댑터 보조배터리 파워뱅크 멀티탭 연장코드 콘센트 USB허브 랜허브 공유기 외장하드 SSD 메모리카드 프린터 스캐너 복합기 팩스 리모컨 셋톱박스 블루레이플레이어 DVD플레이어 CD플레이어 라디오 시계 라디오시계`,
  공구: `망치 톱 손톱 못 드릴 전동드릴 임팩드릴 드라이버 렌치 스패너 플라이어 집게 펜치 철사 줄자 수평기 레이저레벨 공구함 공구세트 연장선 작업등 안전모 보안경 귀마개 방진마스크 용접면 용접기 압착기 펜치세트 소켓세트 비트세트 체인톱 예초기 잔디깍기 물뿌리개 호스 스프링클러 삽 갈퀨 호미 낫 가위 전지가위 전기톱`,
  스포츠: `덤벨 케틀벨 아령 바벨 원판 풀업바 스쿼트랙 벤치프레스 런닝머신 실내자전거 스핀바이크 일립티컬 로잉머신 요가매트 폼롤러 요가블록 저항밴드 점핑로프 줄넘기 헬스장갑 헬스벨트 무릎보호대 손목보호대 팔꿈치보호 발목보호 허리보호 어깨보호 헬멧 스키헬멧 자전거헬멧 인라인헬멧 스케이트보드 롤러스케이트 킥보드 축구공 농구공 배구공 배드민턴라켓 테니스라켓 탁구채 야구배트 글러브 야구공 골프채 골프공 스노클 오리발 수경 수모 튜브 구명조끼`,
  사무: `연필 샤프 볼펜 만년필 형광펜 사인펜 마커 지우개 자 계산기 스테이플러 스테이플 심 클립 파일철 바인더 클립보드 메모지 스티커 테이프 디스펜서 명함철 명함지갑 서류가방 브리프케이스 노트 다이어리 캘린더 스케줄러 화이트보드 칠판 자석칠판 칠판지우개 프린터용지 라벨기 라벨지 펀치 홀펀치 제본기 과철기 문서고 서류꽂이 책꽂이 책받침 독서대`,
  정원: `화분 화분받침 화분받침대 받침대 모종삽 모종이 호미 갈퀨 삽 낫 예초기 잔디깍기 물뿌리개 스프링클러 호스 릴호스 비닐하우스 온실프레임 파라솔 해변의자 캠핑의자 캠핑테이블 쿨러 아이스박스 그릴 숯 가스버너 토치 바비큐집게 집게 불판 그릴망 훈연통 정원등 태양등 센서등 잔디씨 꽃씨 비료 거름 퇴비 흙 상토 배양토 화분흙 분무기 살충제 제초제 잡초제거기`,
};

const NAME_CATCH_PREFIX = `철 나무 은 동 구리 알루미늄 가죽 유리 고무 플라스틱 스테인 청동 황동 백동 강철 산화철 전기 무선 접이식 휴대용 대형 소형 미니 업소용 가정용 야외 방수 캠핑 게이밍 사무용 운동용 주방용 욕실용 정원용 차량용 얇은 두꺼운 긴 짧은 둥근 네모난 새것같은`
  .trim()
  .split(/\s+/)
  .filter(Boolean);

const NAME_CATCH_TREES = `
참나무 굴참나무 상수리나무 떡갈나무 신갈나무 졸참나무 느티나무 은행나무 벚나무 왕벚나무 단풍나무 소나무 해송 흑송 잣나무 리기다소나무 가문비나무 편백 향나무 유칼립투스 자작나무 물푸레나무 버드나무 때죽나무 가죽나무 무화과나무 감나무 밤나무 배나무 사과나무 복숭아나무 자두나무 매실나무 살구나무 앵두나무 체리나무 포도나무 키위나무 감귤나무 레몬나무 오렌지나무 귤나무 대추야자 야자수 잎갈나무 전나무 삼나무 육송 목련나무 왕버들 은버들 팽나무 느릅나무 회화나무 당나무 오동나무 배롱나무 주목 편백나무 노송나무 향나무숲 잣나무숲
`.trim()
  .split(/\s+/)
  .filter(Boolean);

const NAME_CATCH_FLOWERS = `
장미 튤립 백합 카네이션 국화 코스모스 수선화 은방울 안개꽃 데이지 해바라기 나팔꽃 철쭉 진달래 개나리 목련 매화 벚꽃 라일락 원추리 백일홍 패랭이 금낭화 봉선화 천상병 아스터 아이리스 도라지 연꽃 수련 패모 금어초 맨드라미 코스모스 카네이션꽃다발 장미꽃다발 수국 청매화 홍매화 동백 매화나무꽃 목련꽃 벚꽃잎 매화잎 라일락꽃 철쭉꽃 진달래꽃 개나리꽃 코스모스꽃 해바라기씨 해바라기꽃 국화꽃 튤립구근 수선화구근 백합구근 장미덤불 수국덤불 철쭉덤불 진달래덤불 라벤더 로즈마리 바질 허브 화분장미 화분튤립 화분국화 화분수국 화분다육 화분선인장 화분금전수 화분몬스테라 화분고무나무 화분떡갈고무나무 화분고무나무잎 화분야자 화분행운의나무 화분은행나무 화분소나무
`.trim()
  .split(/\s+/)
  .filter(Boolean);

const NAME_CATCH_GRASS = `
잔디 잔디밭 억새 갈대 머금풀 민들레 클로버 쑥 부추 고깔 새포아풀 나팔풀 닭의장풀 돌미나리 호밀 밀 보리 수수 조 팥 콩 강낭콩 들깨 깨 쑥갓 냉이 질경이 고랭이 패랭이풀 클로버밭 잔디씨 잔디롤 잔디블럭 잔디깍기날 잔디전지가위 잔디삽 잔디롤매트 잔디보호망 잔디비료 잔디제초 잔디예초 잔디관수 잔디스프링클러 잔디호스 잔디모래 잔디배양토 잔디흙 잔디뿌리 잔디줄기 잔디잎 잔디꽃 잔디씨앗 잔디모종 잔디덩이 잔디포트 잔디화분 잔디트레이 잔디매트 잔디그물 잔디그늘막 잔디파라솔 잔디의자 잔디테이블
`.trim()
  .split(/\s+/)
  .filter(Boolean);

function buildInjectionBlock() {
  const lines = [];
  lines.push('  /**');
  lines.push('   * 줍는 이름 — 손수 고른 시드 + (재질·용도 등 접두)×용품명 + 나무·꽃·풀 명칭 합집합(랜덤 토큰 난조합 없음).');
  lines.push('   * `catchNameToFormula`는 이름 안의 금속·합금 토큰만 골라냄.');
  lines.push('   */');
  lines.push('  const NAME_CATCH_SEED = `');
  lines.push(NAME_CATCH_SEED);
  lines.push('`.trim();');
  lines.push('');
  lines.push('  const NAME_CATCH_OBJ_GROUPS = {');
  for (const [k, v] of Object.entries(NAME_CATCH_OBJ_GROUPS)) {
    lines.push(`    ${k}: \`${v}\`.trim().split(/\\s+/).filter(Boolean),`);
  }
  lines.push('  };');
  lines.push('');
  lines.push(
    '  const NAME_CATCH_PREFIX = `' +
      NAME_CATCH_PREFIX.join(' ') +
      '`.trim().split(/\\s+/).filter(Boolean);',
  );
  lines.push('  const NAME_CATCH_CORE_OBJ = Object.values(NAME_CATCH_OBJ_GROUPS).flat();');
  lines.push('');
  lines.push('  const NAME_CATCH_TREES = `');
  lines.push(NAME_CATCH_TREES.join(' '));
  lines.push('`.trim().split(/\\s+/).filter(Boolean);');
  lines.push('');
  lines.push('  const NAME_CATCH_FLOWERS = `');
  lines.push(NAME_CATCH_FLOWERS.join(' '));
  lines.push('`.trim().split(/\\s+/).filter(Boolean);');
  lines.push('');
  lines.push('  const NAME_CATCH_GRASS = `');
  lines.push(NAME_CATCH_GRASS.join(' '));
  lines.push('`.trim().split(/\\s+/).filter(Boolean);');
  lines.push('');
  lines.push('  function buildNameCatchCurated() {');
  lines.push('    const set = new Set();');
  lines.push('    NAME_CATCH_SEED.split(/\\n/).forEach((line) => {');
  lines.push('      const s = line.trim();');
  lines.push('      if (s && s.length <= 26) set.add(s);');
  lines.push('    });');
  lines.push('    for (let i = 0; i < NAME_CATCH_PREFIX.length; i += 1) {');
  lines.push('      const p = NAME_CATCH_PREFIX[i];');
  lines.push('      for (let j = 0; j < NAME_CATCH_CORE_OBJ.length; j += 1) {');
  lines.push('        const o = NAME_CATCH_CORE_OBJ[j];');
  lines.push('        const n = `${p}${o}`;');
  lines.push('        if (n.length <= 26) set.add(n);');
  lines.push('      }');
  lines.push('    }');
  lines.push('    NAME_CATCH_TREES.forEach((t) => { if (t.length <= 26) set.add(t); });');
  lines.push('    NAME_CATCH_FLOWERS.forEach((t) => { if (t.length <= 26) set.add(t); });');
  lines.push('    NAME_CATCH_GRASS.forEach((t) => { if (t.length <= 26) set.add(t); });');
  lines.push('    return Array.from(set);');
  lines.push('  }');
  lines.push('');
  lines.push('  const NAME_CATCH_CURATED = buildNameCatchCurated();');
  lines.push('  const NAME_CATCH_BG = NAME_CATCH_CURATED.filter((s) => s.length <= 10);');
  lines.push('');
  return lines.join('\n');
}

let game = fs.readFileSync(gamePath, 'utf8');
const start = game.indexOf('  /**\n   * 줍는 이름 전용 — 실제 물건');
const end = game.indexOf('  /** 이름 토큰 → 픽셀 실루엣 종류');
if (start < 0 || end < 0) {
  console.error('markers not found', { start, end });
  process.exit(1);
}
const block = buildInjectionBlock();
game = game.slice(0, start) + block + game.slice(end);
fs.writeFileSync(gamePath, game, 'utf8');
console.log('injected block chars', block.length);
console.log('done');
