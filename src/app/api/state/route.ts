import { missionsSeed } from "@/lib/missions/mission-seed";
import { createDefaultState } from "@/lib/state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  AdminAward,
  Announcement,
  AppState,
  AuditLog,
  EasterEgg,
  EasterEggClaim,
  Mission,
  Submission,
  Team
} from "@/lib/types";
import { NextResponse } from "next/server";

type DbTeam = {
  id: string;
  team_number: number;
  name: string;
  login_code: string;
  church_name: string | null;
  member_count: number | null;
  manual_adjustment: number | null;
  final_verified: boolean;
  final_verified_at: string | null;
};

type DbMission = {
  id: string;
  code: string;
  theme: Mission["theme"];
  title: string;
  description: string;
  points: number;
  submission_type: Mission["type"];
  sort_order: number;
  success_criteria: string | null;
};

type DbSubmission = {
  id: string;
  team_id: string;
  mission_id: string;
  submission_type: Submission["type"];
  status: Submission["status"];
  answer_text: string | null;
  answer_json: Record<string, unknown> | null;
  file_paths: string[] | null;
  awarded_points: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

type DbEasterEgg = {
  id: string;
  code: string;
  title: string;
  message: string;
  points: number;
  is_active: boolean;
};

type DbEasterClaim = {
  id: string;
  team_id: string;
  easter_egg_id: string;
  awarded_points: number;
  claimed_at: string;
  note: string | null;
};

type DbAward = {
  id: string;
  team_id: string;
  award_type: AdminAward["awardType"];
  title: string;
  points: number;
  awarded_by: string | null;
  note: string | null;
  created_at: string;
};

type DbAnnouncement = {
  id: string;
  title: string;
  body: string;
  announcement_type: Announcement["announcementType"];
  points: number | null;
  is_active: boolean;
  created_at: string;
};

type DbAudit = {
  id: string;
  actor_type: AuditLog["actorType"];
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
};

function dbMissionToMission(row: DbMission): Mission {
  const seeded = missionsSeed.find((mission) => mission.code === row.code);
  return {
    ...(seeded ?? missionsSeed[0]),
    id: row.id,
    code: row.code,
    theme: row.theme,
    title: row.title,
    description: row.description,
    points: row.points,
    type: row.submission_type,
    sortOrder: row.sort_order,
    successCriteria: row.success_criteria ?? seeded?.successCriteria ?? ""
  };
}

async function readState(): Promise<AppState> {
  const supabase = createSupabaseServiceClient();
  const [
    teams,
    missions,
    submissions,
    easterEggs,
    easterClaims,
    awards,
    announcements,
    auditLogs
  ] = await Promise.all([
    supabase.from("teams").select("*").order("team_number"),
    supabase.from("missions").select("*").order("sort_order"),
    supabase.from("submissions").select("*").order("created_at", { ascending: false }),
    supabase.from("easter_eggs").select("*").order("code"),
    supabase.from("team_easter_egg_claims").select("*").order("claimed_at", { ascending: false }),
    supabase.from("admin_awards").select("*").order("created_at", { ascending: false }),
    supabase.from("announcements").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false })
  ]);

  for (const result of [
    teams,
    missions,
    submissions,
    easterEggs,
    easterClaims,
    awards,
    announcements,
    auditLogs
  ]) {
    if (result.error) throw result.error;
  }

  return {
    ...createDefaultState(),
    teams: ((teams.data ?? []) as DbTeam[]).map((row): Team => ({
      id: row.id,
      teamNumber: row.team_number,
      name: row.name,
      loginCode: "",
      churchName: row.church_name ?? "",
      memberCount: row.member_count ?? 0,
      finalVerified: row.final_verified,
      finalVerifiedAt: row.final_verified_at ?? undefined,
      manualAdjustment: row.manual_adjustment ?? 0
    })),
    missions: ((missions.data ?? []) as DbMission[]).map(dbMissionToMission),
    submissions: ((submissions.data ?? []) as DbSubmission[]).map((row): Submission => ({
      id: row.id,
      teamId: row.team_id,
      missionId: row.mission_id,
      type: row.submission_type,
      status: row.status,
      answerText: row.answer_text ?? undefined,
      answerJson: row.answer_json ?? {},
      filePaths: row.file_paths ?? [],
      awardedPoints: row.awarded_points,
      reviewedBy: row.reviewed_by ?? undefined,
      reviewedAt: row.reviewed_at ?? undefined,
      reviewNote: row.review_note ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })),
    easterEggs: ((easterEggs.data ?? []) as DbEasterEgg[]).map((row): EasterEgg => ({
      id: row.id,
      code: row.code,
      title: row.title,
      message: row.message,
      points: row.points,
      isActive: row.is_active
    })),
    easterEggClaims: ((easterClaims.data ?? []) as DbEasterClaim[]).map(
      (row): EasterEggClaim => ({
        id: row.id,
        teamId: row.team_id,
        easterEggId: row.easter_egg_id,
        awardedPoints: row.awarded_points,
        claimedAt: row.claimed_at,
        note: row.note ?? undefined
      })
    ),
    adminAwards: ((awards.data ?? []) as DbAward[]).map((row): AdminAward => ({
      id: row.id,
      teamId: row.team_id,
      awardType: row.award_type,
      title: row.title,
      points: row.points,
      awardedBy: row.awarded_by ?? "admin",
      note: row.note ?? undefined,
      createdAt: row.created_at
    })),
    announcements: ((announcements.data ?? []) as DbAnnouncement[]).map(
      (row): Announcement => ({
        id: row.id,
        title: row.title,
        body: row.body,
        announcementType: row.announcement_type,
        points: row.points ?? undefined,
        isActive: row.is_active,
        createdAt: row.created_at
      })
    ),
    announcementSubmissions: [],
    auditLogs: ((auditLogs.data ?? []) as DbAudit[]).map((row): AuditLog => ({
      id: row.id,
      actorType: row.actor_type,
      actorId: row.actor_id ?? undefined,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id ?? undefined,
      beforeData: row.before_data,
      afterData: row.after_data,
      createdAt: row.created_at
    }))
  };
}

export async function GET() {
  try {
    return NextResponse.json(await readState());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "state read failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const state = (await request.json()) as AppState;
    const supabase = createSupabaseServiceClient();

    await supabase.from("teams").upsert(
      state.teams.map((team) => ({
        id: team.id,
        team_number: team.teamNumber,
        name: team.name,
        church_name: team.churchName,
        member_count: team.memberCount,
        manual_adjustment: team.manualAdjustment,
        final_verified: team.finalVerified,
        final_verified_at: team.finalVerifiedAt ?? null
      }))
    );
    await supabase.from("submissions").upsert(
      state.submissions.map((submission) => ({
        id: submission.id,
        team_id: submission.teamId,
        mission_id: submission.missionId,
        submission_type: submission.type,
        status: submission.status,
        answer_text: submission.answerText ?? null,
        answer_json: submission.answerJson ?? {},
        file_paths: submission.filePaths,
        awarded_points: submission.awardedPoints,
        reviewed_by: submission.reviewedBy ?? null,
        reviewed_at: submission.reviewedAt ?? null,
        review_note: submission.reviewNote ?? null,
        created_at: submission.createdAt,
        updated_at: submission.updatedAt
      }))
    );
    await supabase.from("team_easter_egg_claims").upsert(
      state.easterEggClaims.map((claim) => ({
        id: claim.id,
        team_id: claim.teamId,
        easter_egg_id: claim.easterEggId,
        awarded_points: claim.awardedPoints,
        claimed_at: claim.claimedAt,
        note: claim.note ?? null
      }))
    );
    await supabase.from("admin_awards").upsert(
      state.adminAwards.map((award) => ({
        id: award.id,
        team_id: award.teamId,
        award_type: award.awardType,
        title: award.title,
        points: award.points,
        awarded_by: award.awardedBy,
        note: award.note ?? null,
        created_at: award.createdAt
      }))
    );
    await supabase.from("announcements").upsert(
      state.announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        announcement_type: announcement.announcementType,
        points: announcement.points ?? null,
        is_active: announcement.isActive,
        created_at: announcement.createdAt
      }))
    );
    await supabase.from("audit_logs").upsert(
      state.auditLogs.map((log) => ({
        id: log.id,
        actor_type: log.actorType,
        actor_id: log.actorId ?? null,
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId ?? null,
        before_data: log.beforeData ?? null,
        after_data: log.afterData ?? null,
        created_at: log.createdAt
      }))
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "state write failed" },
      { status: 500 }
    );
  }
}
