# Supabase 데이터 모델 초안

## 1. 설계 원칙

- 팀 코드 기반 로그인으로 구현한다.
- 이메일/문자 인증은 사용하지 않는다.
- 모든 점수 지급은 중복 지급을 방지해야 한다.
- 같은 팀이 같은 미션을 여러 번 제출해도 점수는 한 번만 반영한다.
- 스태프 승인 미션은 제출 상태와 승인 상태를 분리한다.
- 관리자 수동 수정과 주요 액션은 audit log에 남긴다.
- 사진/스크린샷 파일은 Supabase Storage에 저장하고 DB에는 URL/path만 저장한다.

## 2. Enum 제안

```sql
create type mission_theme as enum (
  'nutrition',
  'exercise',
  'water',
  'sunshine',
  'temperance',
  'air',
  'rest',
  'trust'
);

create type submission_type as enum (
  'quiz',
  'text',
  'photo',
  'screenshot',
  'video_or_text',
  'staff',
  'final',
  'easter_qr',
  'admin_award',
  'announcement_challenge'
);

create type submission_status as enum (
  'draft',
  'submitted',
  'pending_review',
  'approved',
  'rejected',
  'cancelled'
);
```

## 3. teams

팀 정보를 저장한다.

```sql
create table teams (
  id uuid primary key default gen_random_uuid(),
  team_number int not null unique,
  name text not null,
  login_code text not null unique,
  church_name text,
  member_count int,
  total_score int not null default 0,
  final_verified boolean not null default false,
  final_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 4. missions

미션 마스터 데이터다.

```sql
create table missions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  theme mission_theme not null,
  title text not null,
  description text not null,
  points int not null,
  submission_type submission_type not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  success_criteria text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`metadata` 예시:

```json
{
  "quiz": {
    "passScore": 3,
    "questions": []
  },
  "themeCodePiece": "홍",
  "requiresStaffApproval": false
}
```

## 5. submissions

팀별 미션 제출 내역이다.

```sql
create table submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  submission_type submission_type not null,
  status submission_status not null default 'submitted',
  answer_text text,
  answer_json jsonb not null default '{}'::jsonb,
  file_paths text[] not null default '{}',
  awarded_points int not null default 0,
  reviewed_by text,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, mission_id)
);
```

중복 제출 허용이 필요하다면 unique 제약 대신 `attempts` 테이블을 별도로 둔다. 행사 운영 안정성을 위해 기본은 팀당 미션별 1개 제출만 유지한다.

## 6. team_theme_status

테마별 클리어 상태를 저장한다. 미션 승인 시 갱신한다.

```sql
create table team_theme_status (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  theme mission_theme not null,
  is_cleared boolean not null default false,
  cleared_by_mission_id uuid references missions(id),
  code_piece text not null,
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, theme)
);
```

## 7. easter_eggs

히든 QR 정보를 저장한다.

```sql
create table easter_eggs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  message text not null,
  points int not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

## 8. team_easter_egg_claims

팀별 히든 QR 획득 내역이다.

```sql
create table team_easter_egg_claims (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  easter_egg_id uuid not null references easter_eggs(id) on delete cascade,
  awarded_points int not null default 30,
  claimed_at timestamptz not null default now(),
  unique(team_id, easter_egg_id)
);
```

비즈니스 규칙:

- 같은 QR은 팀당 1회만 인정한다.
- 팀당 최대 3개까지만 점수 지급한다.

## 9. final_verifications

홍명기홀 최종 인증 기록이다.

```sql
create table final_verifications (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  verified_at timestamptz not null default now(),
  awarded_tickets int not null default 2,
  note text,
  unique(team_id)
);
```

## 10. announcements

공지와 돌발 미션을 저장한다.

```sql
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  announcement_type text not null default 'notice',
  points int,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

## 11. announcement_submissions

돌발 미션 제출 내역이다.

```sql
create table announcement_submissions (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  status submission_status not null default 'submitted',
  file_paths text[] not null default '{}',
  answer_text text,
  awarded_points int not null default 0,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(announcement_id, team_id)
);
```

## 12. admin_awards

숨은 운영진 미션 등 관리자가 직접 부여하는 보너스 점수다.

```sql
create table admin_awards (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  award_type text not null,
  title text not null,
  points int not null,
  awarded_by text,
  note text,
  created_at timestamptz not null default now()
);
```

숨은 운영진 미션은 팀당 1회만 인정해야 하므로 애플리케이션 또는 partial unique index로 제한한다.

```sql
create unique index unique_hidden_staff_award_per_team
on admin_awards(team_id)
where award_type = 'hidden_staff';
```

## 13. audit_logs

중요 액션 기록이다.

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,
  actor_id text,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
```

## 14. 점수 계산 원칙

팀 총점은 다음 항목의 합으로 계산한다.

1. 승인된 미션 제출 점수
2. 히든 QR 점수
3. 관리자 보너스 점수
4. 돌발 미션 점수
5. NEWSTART 완주 보너스 100점
6. 전체 미션 올클리어 보너스 200점

권장 구현:

- 승인/취소 액션 시 `teams.total_score`를 갱신한다.
- 동시에 점수 재계산 함수도 제공한다.
- 관리자 화면에 “점수 재계산” 버튼을 제공한다.

## 15. 추첨권 계산 함수

```ts
function calculateBaseTickets(score: number): number {
  if (score >= 900) return 4;
  if (score >= 700) return 3;
  if (score >= 500) return 2;
  if (score >= 300) return 1;
  return 0;
}

function calculateTickets(score: number, finalVerified: boolean): number {
  return Math.min(6, calculateBaseTickets(score) + (finalVerified ? 2 : 0));
}
```

## 16. 테마 코드 조각

```ts
const THEME_CODE_PIECES = {
  nutrition: '홍',
  exercise: '명',
  water: '기',
  sunshine: '홀',
  temperance: '로',
  air: '오',
  rest: '라',
  trust: '!'
};
```

## 17. Storage 버킷

권장 버킷:

- `mission-submissions`: 사진, 스크린샷, 제출 이미지
- `announcement-submissions`: 돌발 미션 이미지

권장 정책:

- 참가자는 자신의 팀 제출 파일만 업로드 가능
- 관리자는 전체 파일 조회 가능
- 파일명에는 team id, mission code, timestamp를 포함한다.

예시 파일 경로:

```text
mission-submissions/{teamId}/{missionCode}/{timestamp}.jpg
```

## 18. Seed 데이터 요구사항

- 30개 팀 생성
- 16개 미션 생성
- 10개 히든 QR 생성
- 관리자 계정 또는 관리자 비밀번호 환경변수 기반 설정

팀 코드 예시:

```text
TEAM-01-KEY
TEAM-02-KEY
...
TEAM-30-KEY
```
