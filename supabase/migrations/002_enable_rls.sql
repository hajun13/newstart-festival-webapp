alter table teams enable row level security;
alter table missions enable row level security;
alter table submissions enable row level security;
alter table team_theme_status enable row level security;
alter table easter_eggs enable row level security;
alter table team_easter_egg_claims enable row level security;
alter table final_verifications enable row level security;
alter table announcements enable row level security;
alter table announcement_submissions enable row level security;
alter table admin_awards enable row level security;
alter table audit_logs enable row level security;

-- No public PostgREST policies are intentionally created.
-- The Next.js server must access these tables with SUPABASE_SERVICE_ROLE_KEY.
