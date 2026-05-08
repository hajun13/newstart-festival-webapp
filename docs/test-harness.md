# 테스트 하네스 구조

이 문서는 Codex가 앱을 한 번에 구현할 때 반드시 함께 만들어야 하는 테스트 하네스 구조를 정의한다.

목표는 단순 화면 구현이 아니라, 행사 당일 운영 가능한지 자동으로 검증할 수 있는 구조를 만드는 것이다.

## 1. 하네스 목표

테스트 하네스는 다음을 자동 검증해야 한다.

1. 팀 코드 로그인
2. 미션 코드 입력
3. 미션 타입별 제출
4. 점수 중복 지급 방지
5. 테마 클리어 계산
6. 완주 보너스 100점 지급
7. 올클리어 보너스 200점 지급
8. 생명의 열쇠 코드 표시
9. 최종 인증 조건 검증
10. 추첨권 계산
11. 히든 QR 최대 3개 제한
12. 숨은 운영진 보너스 팀당 1회 제한
13. 관리자 승인/반려/취소
14. CSV export
15. 부하 테스트 시나리오

## 2. 권장 디렉터리 구조

```text
src/
  app/
  components/
  lib/
    scoring/
      calculate-score.ts
      calculate-tickets.ts
      theme-status.ts
      code-pieces.ts
    missions/
      mission-types.ts
      mission-seed.ts
    auth/
      team-session.ts
    supabase/
      client.ts
      server.ts
    admin/
      audit-log.ts
      awards.ts
  server/
    actions/
    services/
      submit-mission.ts
      approve-submission.ts
      verify-final.ts
      claim-easter-egg.ts
      recalculate-score.ts
supabase/
  schema.sql
  seed.sql
  migrations/
scripts/
  seed.ts
  generate-team-codes.ts
  export-backup.ts
tests/
  unit/
    scoring.test.ts
    tickets.test.ts
    theme-status.test.ts
    final-verification.test.ts
    easter-eggs.test.ts
  e2e/
    team-flow.spec.ts
    admin-flow.spec.ts
    scoring-flow.spec.ts
  load/
    k6-login.js
    k6-mission-submit.js
    k6-final-verification.js
```

## 3. Unit Test 요구사항

### 3.1 점수 계산

파일: `tests/unit/scoring.test.ts`

검증:

- 단일 미션 승인 시 해당 점수 반영
- 같은 미션 중복 승인 시 점수 1회만 반영
- 8개 테마 클리어 시 완주 보너스 100점 1회 지급
- 16개 미션 완료 시 올클리어 보너스 200점 1회 지급
- 제출 취소 시 점수 회수
- 점수 수동 조정 시 총점 반영

### 3.2 추첨권 계산

파일: `tests/unit/tickets.test.ts`

검증:

- 0~299점: 0장
- 300~499점: 1장
- 500~699점: 2장
- 700~899점: 3장
- 900점 이상: 4장
- 최종 인증 시 +2장
- 최대 6장을 넘지 않음

### 3.3 테마 클리어

파일: `tests/unit/theme-status.test.ts`

검증:

- 같은 테마에서 1개 미션 성공 시 테마 클리어
- 같은 테마에서 2개 미션 성공 시 테마는 1개로만 카운트
- 8개 테마 클리어 시 완주 상태
- 코드 조각 순서가 `홍명기홀로오라!`로 표시됨

### 3.4 최종 인증

파일: `tests/unit/final-verification.test.ts`

검증:

- 8개 테마 미완료 팀은 최종 인증 실패
- 8개 테마 완료 팀은 최종 인증 성공
- 최종 인증 중복 시 추가 추첨권 미지급

### 3.5 이스터에그

파일: `tests/unit/easter-eggs.test.ts`

검증:

- 히든 QR 1개당 30점
- 같은 QR 중복 점수 미지급
- 팀당 최대 3개까지만 점수 지급
- 숨은 운영진 보너스는 팀당 1회만 지급

## 4. E2E Test 요구사항

### 4.1 참가자 플로우

파일: `tests/e2e/team-flow.spec.ts`

시나리오:

1. `/login`에서 팀 코드 로그인
2. `/dashboard` 진입
3. `/code`에서 `NUT-30` 입력
4. 퀴즈 제출 성공
5. 대시보드에서 Nutrition 코드 조각 `홍` 확인
6. 8개 테마를 순차적으로 mock 성공 처리
7. 최종 문구 `홍명기홀로 오라!` 확인
8. `/final`에서 최종 인증 성공
9. 추첨권 +2 반영 확인

### 4.2 관리자 플로우

파일: `tests/e2e/admin-flow.spec.ts`

시나리오:

1. 관리자 로그인
2. `/admin` 대시보드 진입
3. `/admin/staff`에서 팀 검색
4. `WTR-80` 성공 처리
5. 팀 점수 80점 반영 확인
6. audit log 생성 확인
7. 점수 수동 조정
8. CSV export 버튼 확인

### 4.3 점수 플로우

파일: `tests/e2e/scoring-flow.spec.ts`

시나리오:

1. 한 팀이 8개 테마를 모두 클리어
2. 완주 보너스 100점 확인
3. 같은 미션을 재제출해도 점수 변동 없음 확인
4. 나머지 8개 미션 완료
5. 올클리어 보너스 200점 확인
6. 900점 이상 + 최종 인증 시 추첨권 6장 확인

## 5. Load Test 요구사항

### 5.1 로그인 부하

파일: `tests/load/k6-login.js`

검증:

- 500 virtual users
- 로그인 API 호출
- 대시보드 조회
- 평균 응답 1초 이내 권장
- 오류율 1% 미만 목표

### 5.2 미션 제출 부하

파일: `tests/load/k6-mission-submit.js`

검증:

- 미션 코드 조회 200회/분
- 퀴즈 제출 200회/분
- 텍스트 제출 100회/분
- 중복 제출 방지 확인

### 5.3 최종 인증 부하

파일: `tests/load/k6-final-verification.js`

검증:

- 최종 인증 100회/분
- 미완료 팀 인증 실패
- 완료 팀 인증 성공
- 중복 인증 차단

## 6. Mock / Local Test Mode

Supabase 프로젝트 없이도 기본 테스트가 가능하도록 local mock mode를 제공한다.

권장 방식:

- 순수 함수는 DB 없이 unit test
- 서비스 함수는 repository interface를 통해 mock 가능하게 설계
- E2E는 test seed 또는 mock API로 실행 가능하게 구성

환경변수 예시:

```text
NEXT_PUBLIC_APP_ENV=test
USE_MOCK_DATA=true
```

## 7. Seed Data Harness

Codex는 다음 seed script를 제공해야 한다.

```bash
npm run seed
```

Seed 결과:

- 30개 팀
- 16개 공식 미션
- 10개 히든 QR
- 공지 샘플 1개
- 관리자 계정 또는 관리자 비밀번호 설정

## 8. Backup Harness

행사 당일 장애 대비를 위해 다음 기능을 제공한다.

1. 팀별 점수 CSV export
2. 제출 내역 CSV export
3. 추첨권 CSV export
4. 수기 점수표 템플릿 생성 또는 문서 제공

권장 명령:

```bash
npm run export:backup
```

## 9. CI 요구사항

가능하다면 GitHub Actions로 다음을 실행한다.

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

E2E와 load test는 시간이 오래 걸릴 수 있으므로 별도 workflow 또는 manual trigger로 둔다.

## 10. 완료 판정

Codex는 구현 마지막에 다음을 보고해야 한다.

- 구현된 페이지 목록
- 구현된 API/action 목록
- Supabase 스키마 파일 경로
- seed 실행 방법
- 테스트 실행 결과
- 미구현 항목이 있다면 명확한 목록
- 행사 운영 전 추가 확인이 필요한 항목
