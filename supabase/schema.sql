create extension if not exists pgcrypto;

create type mission_theme as enum (
  'nutrition', 'exercise', 'water', 'sunshine', 'temperance', 'air', 'rest', 'trust'
);

create type submission_type as enum (
  'quiz', 'text', 'photo', 'screenshot', 'video_or_text', 'staff', 'final',
  'easter_qr', 'admin_award', 'announcement_challenge'
);

create type submission_status as enum (
  'draft', 'submitted', 'pending_review', 'approved', 'rejected', 'cancelled'
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  team_number int not null unique,
  name text not null,
  login_code text not null unique,
  church_name text,
  member_count int,
  total_score int not null default 0,
  manual_adjustment int not null default 0,
  final_verified boolean not null default false,
  final_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  theme mission_theme not null,
  title text not null,
  description text not null,
  points int not null check (points >= 0),
  submission_type submission_type not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  success_criteria text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists submissions (
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

create table if not exists team_theme_status (
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

create table if not exists easter_eggs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  message text not null,
  points int not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists team_easter_egg_claims (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  easter_egg_id uuid not null references easter_eggs(id) on delete cascade,
  awarded_points int not null default 30,
  claimed_at timestamptz not null default now(),
  note text,
  unique(team_id, easter_egg_id)
);

create table if not exists final_verifications (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  verified_at timestamptz not null default now(),
  awarded_tickets int not null default 2,
  note text,
  unique(team_id)
);

create table if not exists announcements (
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

create table if not exists announcement_submissions (
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

create table if not exists admin_awards (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  award_type text not null,
  title text not null,
  points int not null,
  awarded_by text,
  note text,
  created_at timestamptz not null default now()
);

create unique index if not exists unique_hidden_staff_award_per_team
on admin_awards(team_id)
where award_type = 'hidden_staff';

create table if not exists audit_logs (
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

create index if not exists idx_submissions_status on submissions(status);
create index if not exists idx_submissions_team on submissions(team_id);
create index if not exists idx_missions_code on missions(code);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
