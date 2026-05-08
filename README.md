# NEWSTART Festival Webapp

2026 하계 청소년 페스티벌 **NEWSTART 생명의 열쇠를 찾아라** 운영 웹앱입니다. 공통 QR로 접속한 뒤 팀 코드 로그인, 현장 미션 코드 입력, 인증 제출, 스태프 승인, 최종 홍명기홀 인증까지 행사 당일 운영 흐름을 다룹니다.

## 구현 범위

- Next.js 15 + TypeScript + Tailwind CSS
- shadcn/ui 스타일의 자체 UI 컴포넌트
- 팀 코드 기반 로그인
- 30개 팀, 16개 공식 미션, 10개 히든 QR seed
- 참가자 페이지: `/login`, `/dashboard`, `/code`, `/mission/[code]`, `/easter/[code]`, `/final`
- 관리자 페이지: `/admin`, `/admin/submissions`, `/admin/staff`, `/admin/teams`, `/admin/announcements`, `/admin/audit`
- 중복 제출/중복 점수 방지, 테마 클리어, 완주 보너스, 올클리어 보너스, 추첨권 계산
- 숨은 운영진 보너스 팀당 1회 제한, 히든 QR 팀당 3개 점수 제한
- CSV export, 수기 점수표 백업 스크립트
- Unit, Playwright E2E, k6 load script 하네스

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:3000/login`으로 접속합니다.

테스트용 팀 코드:

```text
TEAM-01-KEY
TEAM-02-KEY
...
TEAM-30-KEY
```

로컬 mock 관리자 비밀번호 기본값:

```text
NEWSTART-ADMIN-2026
```

## 환경 변수

`.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
cp .env.example .env.local
```

외부 Supabase 없이도 `NEXT_PUBLIC_USE_MOCK_DATA=true` 상태에서 핵심 UI/E2E 테스트가 동작합니다. 운영 배포 시 Supabase URL, anon key, service role key, 관리자 비밀번호를 실제 값으로 교체하세요. `SUPABASE_SERVICE_ROLE_KEY`와 `ADMIN_PASSWORD`는 서버 전용 환경변수이며 브라우저에 노출하면 안 됩니다.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL editor에서 [supabase/schema.sql](supabase/schema.sql)을 실행합니다.
3. 이어서 [supabase/seed.sql](supabase/seed.sql)을 실행합니다.
4. Storage 버킷을 생성합니다.
   - `mission-submissions`
   - `announcement-submissions`
5. 참가자는 자신의 팀 제출 파일만 업로드하고, 관리자는 전체 파일을 조회할 수 있도록 RLS 정책을 설정합니다.

운영 보안 적용 순서:

1. Vercel Production env에 `SUPABASE_SERVICE_ROLE_KEY`를 추가합니다.
2. Vercel Production env에 긴 랜덤 값의 `ADMIN_PASSWORD`를 추가합니다.
3. [supabase/migrations/002_enable_rls.sql](supabase/migrations/002_enable_rls.sql)을 Supabase SQL editor에서 실행합니다.
4. `/api/state`와 `/api/login`이 정상 응답하는지 확인합니다.

## Seed 및 백업

로컬 mock seed JSON 생성:

```bash
npm run seed
```

운영 백업 파일 생성:

```bash
npm run export:backup
```

생성 파일:

- `backup/team-scores.csv`
- `backup/submissions.csv`
- `backup/tickets.csv`
- `backup/manual-score-sheet.md`

## 테스트

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run test:load
```

Playwright 브라우저가 없는 환경에서는 최초 1회 실행:

```bash
npx playwright install chromium
```

`npm run test:load`는 k6가 설치된 운영/CI 환경에서는 k6 시나리오를 실행하고, 설치되지 않은 로컬 환경에서는 스크립트 존재를 확인합니다.

## 배포

Vercel 권장 설정:

1. GitHub 저장소를 Vercel에 연결합니다.
2. Build command: `npm run build`
3. Install command: `npm ci`
4. Environment Variables에 `.env.example`의 운영 값을 등록합니다.
5. 배포 후 `/login`, `/dashboard`, `/admin`, `/final`을 실제 휴대폰에서 확인합니다.

## 운영 전 체크리스트

- 30개 팀 코드가 인쇄물/운영표와 일치하는지 확인
- 16개 미션 안내판 코드가 seed와 일치하는지 확인
- 히든 QR 10개와 최종 QR URL 확인
- 휴대폰 5대 이상으로 로그인, 사진 제출, 스태프 승인 리허설
- `/admin/teams` CSV export 다운로드 확인
- 업로드 장애 시 카카오톡/구글폼 백업 링크 준비
- 웹앱 전체 장애 시 `backup/manual-score-sheet.md` 기반 수기 운영 전환 준비

## 문서

- [docs/requirements.md](docs/requirements.md)
- [docs/missions.md](docs/missions.md)
- [docs/data-model.md](docs/data-model.md)
- [docs/load-testing.md](docs/load-testing.md)
- [docs/acceptance-criteria.md](docs/acceptance-criteria.md)
- [docs/test-harness.md](docs/test-harness.md)
- [docs/codex-prompt.md](docs/codex-prompt.md)
