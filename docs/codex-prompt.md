# Codex 구현 지시문

아래 지시문을 Codex 앱 첫 요청에 그대로 붙여넣고 작업을 시작한다.

---

이 레포는 2026 하계 청소년 페스티벌 **NEWSTART 생명의 열쇠를 찾아라** 웹앱 프로젝트다.

목표는 단순 MVP가 아니라, 행사 당일 운영 가능한 완성본을 구현하는 것이다. 구현 완료 여부는 `docs/acceptance-criteria.md`와 `docs/test-harness.md`를 기준으로 판단한다.

먼저 다음 문서를 반드시 읽고 요구사항을 이해한 뒤 구현을 시작해줘.

1. `docs/requirements.md`
2. `docs/missions.md`
3. `docs/data-model.md`
4. `docs/load-testing.md`
5. `docs/acceptance-criteria.md`
6. `docs/test-harness.md`

## 프로젝트 핵심

대상은 청소년 약 300명, 팀은 약 30개, 팀당 10명 내외다. 장소는 삼육대학교 캠퍼스 전체이고, 최종 장소는 홍명기홀이다.

웹앱 운영 방식은 다음과 같다.

- 공통 QR 1개로 웹앱 접속
- 팀 코드 기반 로그인
- 각 미션 장소에는 QR 대신 미션 코드가 적힌 안내판 배치
- 참가팀은 웹앱에서 미션 코드를 입력해 미션 페이지에 들어감
- 일반 미션은 정답 입력, 사진 업로드, 스크린샷 업로드 등으로 인증
- 스태프 미션은 참가자가 미션 코드를 입력한 뒤, 현장에서 스태프가 관리자 화면에서 성공/실패 승인
- 히든 이스터에그 QR과 홍명기홀 최종 인증 QR만 별도 QR 사용

## NEWSTART 테마

1. Nutrition 영양
2. Exercise 운동
3. Water 물
4. Sunshine 햇빛
5. Temperance 절제
6. Air 공기
7. Rest 휴식
8. Trust 믿음

## 테마 클리어 규칙

- 각 테마에는 2개의 미션이 있다.
- 한 테마에서 1개 이상 미션을 성공하면 해당 테마가 클리어된다.
- 한 테마의 2개 미션을 모두 성공하면 두 미션 점수를 모두 받는다.
- 8개 테마 모두 클리어하면 NEWSTART 완주다.
- 8개 테마 모두 클리어 시 +100점 보너스를 부여한다.
- 16개 전체 미션을 모두 완료하면 +200점 보너스를 부여한다.

## 점수 체계

- 쉬운 미션: 30점
- 일반 미션: 50점
- 도전 미션: 80점
- 8개 테마 모두 클리어: +100점
- 16개 전체 미션 모두 완료: +200점

## 추첨권 계산

- 300점 이상: 1장
- 500점 이상: 2장
- 700점 이상: 3장
- 900점 이상: 4장
- 홍명기홀 최종 인증 완료: 추가 2장
- 최대 추첨권: 6장

## 생명의 열쇠 코드

테마 클리어 시 코드 조각을 공개한다.

- Nutrition: 홍
- Exercise: 명
- Water: 기
- Sunshine: 홀
- Temperance: 로
- Air: 오
- Rest: 라
- Trust: !

8개 모두 클리어 시 다음 문구를 표시한다.

> 홍명기홀로 오라!

그 다음 홍명기홀 최종 QR 인증이 가능하다.

## 미션 목록

- NUT-30: 영양 관련 QR 퀴즈, 30점, quiz
- NUT-50: 생명의 식탁을 완성하라, 50점, text
- EXE-50: 삼육대 무지개 루트, 50점, photo
- EXE-80: 네버스탑 1000보, 80점, screenshot
- WTR-30: 생수의 근원을 찾아라, 30점, quiz
- WTR-80: 하루 2리터 챌린지, 80점, staff
- SUN-50: 빛을 찾아서, 50점, photo
- SUN-80: 빛의 말씀을 찾아라, 80점, text
- TMP-50: 절제의 3분, 50점, video_or_text
- TMP-80: 고통도 이겨내는 거야, 80점, staff
- AIR-30: Air QR 퀴즈, 30점, quiz
- AIR-80: 숨결로 날려버려, 80점, staff
- RST-50: 지친 자들아 티부스로 오라, 50점, staff
- RST-55: 짐 내려놓기, 50점, text
- TRS-50: 믿음의 한 컷, 50점, photo
- TRS-80: 라이어 게임, 80점, staff

## 이스터에그

1. 숨은 운영진을 찾아라: 생명의 열쇠지기 미션
   - 암호 문장: 생명의 열쇠를 찾고 있습니다.
   - 가위바위보 승리 50점, 패배 10점
   - 팀당 1회
   - 관리자 직접 부여

2. 숨겨진 축복 QR
   - QR 1개당 30점
   - 팀당 최대 3개
   - 같은 QR은 팀당 1회만 인정

3. NEWSTART 돌발 미션
   - 행사 중 1~2회 공개
   - 성공 시 30점

## 필수 페이지

- `/login`: 팀 로그인
- `/dashboard`: 팀 점수, 추첨권, 클리어 테마, 생명의 열쇠 코드 표시
- `/code`: 미션 코드 입력
- `/mission/[code]`: 미션 상세 및 제출
- `/final`: 홍명기홀 최종 인증
- `/admin`: 관리자 대시보드
- `/admin/submissions`: 제출 검토
- `/admin/staff`: 스태프 미션 승인
- `/admin/teams`: 팀별 점수 및 상태 확인
- `/admin/announcements`: 공지 및 돌발 미션 발송
- `/admin/audit`: 감사 로그

## 기술 스택

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Database
- Supabase Storage
- 팀 코드 기반 자체 로그인
- Vercel 배포

## 완성 구현 범위

다음을 모두 구현해야 한다.

### 1. 앱 구조

- Next.js 15 + TypeScript + Tailwind 프로젝트 구성
- shadcn/ui 기반 모바일 우선 UI
- `.env.example` 작성
- README에 실행, 설정, 배포, 테스트 방법 작성

### 2. 데이터베이스

- `supabase/schema.sql` 작성
- `supabase/seed.sql` 또는 `scripts/seed.ts` 작성
- 30개 팀 seed
- 16개 미션 seed
- 10개 히든 QR seed
- audit log 테이블 포함

### 3. 참가자 기능

- 팀 코드 로그인
- 대시보드
- 미션 코드 입력
- 미션 상세
- quiz/text/photo/screenshot/staff/final/easter_qr 제출 흐름
- 테마 클리어 상태
- 생명의 열쇠 코드 표시
- 추첨권 계산 표시

### 4. 관리자 기능

- 관리자 대시보드
- 팀 현황
- 제출 검토
- 스태프 승인
- 점수 수동 수정
- 점수 재계산
- 공지/돌발 미션 발송
- 숨은 운영진 보너스 지급
- CSV export
- audit log 조회

### 5. 안정성

- 중복 제출 방지
- 중복 점수 지급 방지
- 최종 인증 중복 방지
- 히든 QR 최대 3개 제한
- 숨은 운영진 보너스 팀당 1회 제한
- 사진 업로드 압축 또는 파일 크기 제한
- 영상 업로드는 기본 제외 또는 별도 제출 안내

### 6. 테스트 하네스

- Unit test 작성
- Playwright E2E test 작성
- k6 load test 작성
- seed/test mode 제공
- CI에서 lint/typecheck/test/build 가능하게 구성

## 필수 테스트 명령

다음 명령이 동작해야 한다.

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run test:load
```

실제 외부 Supabase가 없는 환경에서도 핵심 unit test는 통과해야 한다. E2E는 mock/test mode 또는 local seed 기반으로 실행 가능해야 한다.

## 완료 보고 기준

구현 완료 후 다음을 보고해줘.

1. 구현한 페이지 목록
2. 구현한 API/action 목록
3. Supabase 스키마 및 seed 파일 위치
4. 테스트 명령 실행 결과
5. 완성 정의 문서의 수용 기준 충족 여부
6. 미구현 항목이 있다면 명확한 사유와 목록
7. 행사 전 운영자가 직접 확인해야 할 체크리스트

## 구현 순서 제안

순서는 자유롭게 하되, 최종 결과는 `docs/acceptance-criteria.md`와 `docs/test-harness.md`를 통과해야 한다. 중간에 MVP만 만들고 멈추지 말고, 완성 정의를 기준으로 끝까지 구현해줘.
