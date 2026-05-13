import {
  ALL_CLEAR_BONUS,
  EASTER_EGG_SCORE_LIMIT,
  NEWSTART_COMPLETION_BONUS,
  calculateTeamProgress
} from "@/lib/scoring/calculate-score";
import { THEMES, type AdminAward, type Announcement, type AppState, type AuditLog, type Mission, type Submission, type SubmissionStatus, type Team, type TeamProgress } from "@/lib/types";
import { createEasterEggSeed, createTeamsSeed, missionsSeed } from "@/lib/missions/mission-seed";

const STORAGE_KEY = "newstart-festival-state-v1";
const TEAM_SESSION_KEY = "newstart-active-team-id";
const TEAM_NAME_KEY = "newstart-active-team-name";
const ADMIN_SESSION_KEY = "newstart-admin-session";

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  void prefix;
  return crypto.randomUUID();
}

export function usesRemoteState() {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false";
}

export function createDefaultState(): AppState {
  return {
    teams: createTeamsSeed(),
    missions: missionsSeed,
    submissions: [],
    easterEggs: createEasterEggSeed(),
    easterEggClaims: [],
    adminAwards: [],
    announcements: [
      {
        id: "notice-1",
        title: "운영본부 공지",
        body: "팀장은 한 명만 대표로 제출하고, 사진 업로드 실패 시 스태프에게 백업 제출을 요청하세요.",
        announcementType: "notice",
        isActive: true,
        createdAt: now()
      }
    ],
    announcementSubmissions: [],
    auditLogs: []
  };
}

export function isBrowser() {
  return typeof window !== "undefined";
}

export function loadState(): AppState {
  if (!isBrowser()) return createDefaultState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = createDefaultState();
    saveState(state);
    return state;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    if (usesRemoteState()) {
      return {
        ...createDefaultState(),
        ...parsed
      };
    }
    return {
      ...createDefaultState(),
      ...parsed,
      missions: missionsSeed,
      easterEggs: createEasterEggSeed()
    };
  } catch {
    const state = createDefaultState();
    saveState(state);
    return state;
  }
}

export async function syncStateFromServer() {
  if (!isBrowser() || !usesRemoteState()) return loadState();
  const response = await fetch("/api/state", { cache: "no-store" });
  if (!response.ok) return loadState();
  const remote = (await response.json()) as AppState;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
  window.dispatchEvent(new CustomEvent("newstart-state"));
  return remote;
}

export function saveState(state: AppState) {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("newstart-state"));
    if (usesRemoteState() && hasAdminSession()) {
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
        keepalive: true
      }).catch(() => undefined);
    }
  }
}

export function resetState() {
  const state = createDefaultState();
  saveState(state);
  return state;
}

export function setActiveTeam(teamId: string, teamName?: string) {
  if (isBrowser()) {
    window.localStorage.setItem(TEAM_SESSION_KEY, teamId);
    if (teamName) window.localStorage.setItem(TEAM_NAME_KEY, teamName);
  }
}

export function getActiveTeamId() {
  return isBrowser() ? window.localStorage.getItem(TEAM_SESSION_KEY) : null;
}

export function clearActiveTeam() {
  if (isBrowser()) {
    window.localStorage.removeItem(TEAM_SESSION_KEY);
    window.localStorage.removeItem(TEAM_NAME_KEY);
  }
}

export function getActiveTeamName() {
  return isBrowser() ? window.localStorage.getItem(TEAM_NAME_KEY) : null;
}

export function setAdminSession(active: boolean) {
  if (isBrowser()) {
    if (active) window.localStorage.setItem(ADMIN_SESSION_KEY, "true");
    else window.localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function hasAdminSession() {
  return isBrowser() && window.localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function addAudit(
  state: AppState,
  log: Omit<AuditLog, "id" | "createdAt">
): AppState {
  return {
    ...state,
    auditLogs: [
      {
        id: id("audit"),
        createdAt: now(),
        ...log
      },
      ...state.auditLogs
    ]
  };
}

export function loginTeam(state: AppState, loginCode: string): Team | null {
  return (
    state.teams.find(
      (team) => team.loginCode.toUpperCase() === loginCode.trim().toUpperCase()
    ) ?? null
  );
}

export function getTeamProgress(state: AppState, teamId: string): TeamProgress {
  const team = requireTeam(state, teamId);
  return calculateTeamProgress({
    team,
    missions: state.missions,
    submissions: state.submissions.filter((submission) => submission.teamId === teamId),
    easterEggClaims: state.easterEggClaims.filter((claim) => claim.teamId === teamId),
    adminAwards: state.adminAwards.filter((award) => award.teamId === teamId),
    announcementPoints: state.announcementSubmissions
      .filter((item) => item.teamId === teamId && item.status === "approved")
      .reduce((sum, item) => sum + item.awardedPoints, 0)
  });
}

export function requireTeam(state: AppState, teamId: string): Team {
  const team = state.teams.find((item) => item.id === teamId);
  if (!team) throw new Error(`Team not found: ${teamId}`);
  return team;
}

export function findMissionByCode(state: AppState, code: string): Mission | null {
  return (
    state.missions.find(
      (mission) => mission.code.toUpperCase() === code.trim().toUpperCase()
    ) ?? null
  );
}

function evaluateTextMission(mission: Mission, answer: string) {
  if (!mission.acceptedAnswers?.length) return answer.trim().length >= 5;
  const normalized = answer.replace(/\s/g, "").toLowerCase();
  const matches = mission.acceptedAnswers.filter((expected) =>
    normalized.includes(expected.replace(/\s/g, "").toLowerCase())
  );
  if (mission.code === "NUT-50") return matches.length >= 5;
  return matches.length >= 1;
}

export function submitMission(input: {
  state: AppState;
  teamId: string;
  missionCode: string;
  answerText?: string;
  answerJson?: Record<string, unknown>;
  filePaths?: string[];
}): { state: AppState; submission: Submission; message: string } {
  const mission = findMissionByCode(input.state, input.missionCode);
  if (!mission) throw new Error("존재하지 않는 미션 코드입니다.");
  requireTeam(input.state, input.teamId);

  const existing = input.state.submissions.find(
    (submission) =>
      submission.teamId === input.teamId && submission.missionId === mission.id
  );
  if (existing?.status === "approved") {
    return {
      state: input.state,
      submission: existing,
      message: "이미 승인된 미션입니다. 점수는 중복 지급되지 않습니다."
    };
  }

  let status: SubmissionStatus = mission.autoApprove ? "approved" : "pending_review";
  let reviewNote = mission.autoApprove ? "자동 승인" : "관리자 검토 대기";
  let awardedPoints = status === "approved" ? mission.points : 0;

  if (mission.type === "quiz") {
    const answers = (input.answerJson?.answers ?? {}) as Record<string, string>;
    const correctCount =
      mission.quiz?.questions.filter((question) => answers[question.id] === question.answer)
        .length ?? 0;
    const passed = correctCount >= (mission.quiz?.passScore ?? 1);
    status = passed ? "approved" : "rejected";
    awardedPoints = passed ? mission.points : 0;
    reviewNote = `${correctCount}개 정답`;
  }

  if (["text", "video_or_text"].includes(mission.type)) {
    const passed = evaluateTextMission(mission, input.answerText ?? "");
    status = passed ? "approved" : "pending_review";
    awardedPoints = passed ? mission.points : 0;
    reviewNote = passed ? "텍스트 자동 승인" : "관리자 검토 필요";
  }

  if (mission.type === "staff") {
    status = "pending_review";
    awardedPoints = 0;
    reviewNote = "스태프 승인 대기";
  }

  if (["photo", "screenshot"].includes(mission.type) && !input.filePaths?.length) {
    throw new Error("이미지 파일을 첨부해야 제출할 수 있습니다.");
  }

  const submission: Submission = {
    id: existing?.id ?? id("sub"),
    teamId: input.teamId,
    missionId: mission.id,
    type: mission.type,
    status,
    answerText: input.answerText,
    answerJson: input.answerJson,
    filePaths: input.filePaths ?? existing?.filePaths ?? [],
    awardedPoints,
    reviewNote,
    reviewedBy: status === "approved" ? "system" : undefined,
    reviewedAt: status === "approved" ? now() : undefined,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now()
  };

  const submissions = existing
    ? input.state.submissions.map((item) => (item.id === existing.id ? submission : item))
    : [submission, ...input.state.submissions];
  let next = {
    ...input.state,
    submissions
  };
  next = addAudit(next, {
    actorType: "team",
    actorId: input.teamId,
    action: "mission_submit",
    entityType: "submission",
    entityId: submission.id,
    beforeData: existing,
    afterData: submission
  });
  return {
    state: next,
    submission,
    message:
      status === "approved"
        ? `${mission.points}점이 반영되었습니다.`
        : status === "pending_review"
          ? "제출이 접수되었습니다. 관리자 또는 스태프 승인을 기다려 주세요."
          : "통과 기준을 충족하지 못했습니다."
  };
}

export function setSubmissionStatus(input: {
  state: AppState;
  submissionId: string;
  status: Extract<SubmissionStatus, "approved" | "rejected" | "cancelled">;
  reviewedBy: string;
  reviewNote?: string;
}) {
  const target = input.state.submissions.find((item) => item.id === input.submissionId);
  if (!target) throw new Error("제출 내역을 찾을 수 없습니다.");
  const mission = input.state.missions.find((item) => item.id === target.missionId);
  if (!mission) throw new Error("미션을 찾을 수 없습니다.");
  if (target.status === "approved" && input.status === "approved") {
    return input.state;
  }

  const nextSubmission: Submission = {
    ...target,
    status: input.status,
    awardedPoints: input.status === "approved" ? mission.points : 0,
    reviewedBy: input.reviewedBy,
    reviewedAt: now(),
    reviewNote: input.reviewNote,
    updatedAt: now()
  };
  let next: AppState = {
    ...input.state,
    submissions: input.state.submissions.map((item) =>
      item.id === target.id ? nextSubmission : item
    )
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.reviewedBy,
    action: `submission_${input.status}`,
    entityType: "submission",
    entityId: target.id,
    beforeData: target,
    afterData: nextSubmission
  });
  return next;
}

export function staffApproveByTeamMission(input: {
  state: AppState;
  teamId: string;
  missionCode: string;
  success: boolean;
  reviewedBy: string;
}) {
  const mission = findMissionByCode(input.state, input.missionCode);
  if (!mission) throw new Error("미션을 찾을 수 없습니다.");
  const existing = input.state.submissions.find(
    (item) => item.teamId === input.teamId && item.missionId === mission.id
  );
  const ensured = existing
    ? input.state
    : submitMission({
        state: input.state,
        teamId: input.teamId,
        missionCode: input.missionCode,
        answerText: "현장 스태프 확인"
      }).state;
  const submission = ensured.submissions.find(
    (item) => item.teamId === input.teamId && item.missionId === mission.id
  );
  if (!submission) return ensured;
  return setSubmissionStatus({
    state: ensured,
    submissionId: submission.id,
    status: input.success ? "approved" : "rejected",
    reviewedBy: input.reviewedBy,
    reviewNote: input.success ? "스태프 성공 처리" : "스태프 실패 처리"
  });
}

export function verifyFinal(state: AppState, teamId: string) {
  const team = requireTeam(state, teamId);
  const progress = getTeamProgress(state, teamId);
  if (!progress.isNewstartComplete) {
    return {
      state,
      ok: false,
      message: `아직 ${progress.missingThemes.length}개 테마가 남았습니다.`,
      missingThemes: progress.missingThemes
    };
  }
  if (team.finalVerified) {
    return {
      state,
      ok: true,
      message: "이미 최종 인증을 완료했습니다. 추첨권은 중복 지급되지 않습니다.",
      missingThemes: []
    };
  }
  const updatedTeam: Team = {
    ...team,
    finalVerified: true,
    finalVerifiedAt: now()
  };
  let next: AppState = {
    ...state,
    teams: state.teams.map((item) => (item.id === team.id ? updatedTeam : item))
  };
  next = addAudit(next, {
    actorType: "team",
    actorId: teamId,
    action: "final_verified",
    entityType: "team",
    entityId: teamId,
    beforeData: team,
    afterData: updatedTeam
  });
  return {
    state: next,
    ok: true,
    message: "홍명기홀 최종 인증이 완료되었습니다. 추첨권 2장이 추가됩니다.",
    missingThemes: []
  };
}

export function claimEasterEgg(state: AppState, teamId: string, code: string) {
  const egg = state.easterEggs.find(
    (item) => item.code.toUpperCase() === code.trim().toUpperCase() && item.isActive
  );
  if (!egg) throw new Error("유효하지 않은 히든 코드입니다.");
  const existing = state.easterEggClaims.find(
    (claim) => claim.teamId === teamId && claim.easterEggId === egg.id
  );
  if (existing) {
    return {
      state,
      claim: existing,
      message: "이미 획득한 히든 코드입니다. 점수는 중복 지급되지 않습니다."
    };
  }
  const awardedCount = state.easterEggClaims.filter(
    (claim) => claim.teamId === teamId && claim.awardedPoints > 0
  ).length;
  const awardedPoints =
    awardedCount < EASTER_EGG_SCORE_LIMIT ? egg.points : 0;
  const claim = {
    id: id("egg-claim"),
    teamId,
    easterEggId: egg.id,
    awardedPoints,
    claimedAt: now(),
    note:
      awardedPoints > 0
        ? "점수 인정"
        : "팀당 최대 3개까지 점수 인정"
  };
  let next: AppState = {
    ...state,
    easterEggClaims: [claim, ...state.easterEggClaims]
  };
  next = addAudit(next, {
    actorType: "team",
    actorId: teamId,
    action: "easter_egg_claim",
    entityType: "easter_egg",
    entityId: egg.id,
    afterData: claim
  });
  return {
    state: next,
    claim,
    message:
      awardedPoints > 0
        ? `${egg.title}: ${awardedPoints}점이 지급되었습니다.`
        : "팀당 최대 3개까지 점수 인정됩니다. 기록은 남겼지만 점수는 추가되지 않습니다."
  };
}

export function grantAdminAward(input: {
  state: AppState;
  teamId: string;
  awardType: AdminAward["awardType"];
  title: string;
  points: number;
  awardedBy: string;
  note?: string;
}) {
  if (
    input.awardType === "hidden_staff" &&
    input.state.adminAwards.some(
      (award) => award.teamId === input.teamId && award.awardType === "hidden_staff"
    )
  ) {
    return {
      state: input.state,
      ok: false,
      message: "이미 숨은 운영진 보너스를 받은 팀입니다."
    };
  }
  const award: AdminAward = {
    id: id("award"),
    teamId: input.teamId,
    awardType: input.awardType,
    title: input.title,
    points: input.points,
    awardedBy: input.awardedBy,
    note: input.note,
    createdAt: now()
  };
  let next: AppState = {
    ...input.state,
    adminAwards: [award, ...input.state.adminAwards]
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.awardedBy,
    action: "admin_award",
    entityType: "admin_award",
    entityId: award.id,
    afterData: award
  });
  return {
    state: next,
    ok: true,
    message: `${input.points}점 보너스를 지급했습니다.`
  };
}

export function undoAdminAward(input: {
  state: AppState;
  awardId: string;
  actor: string;
}) {
  const award = input.state.adminAwards.find((item) => item.id === input.awardId);
  if (!award) throw new Error("되돌릴 보너스를 찾을 수 없습니다.");
  let next: AppState = {
    ...input.state,
    adminAwards: input.state.adminAwards.filter((item) => item.id !== input.awardId)
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.actor,
    action: "admin_award_undo",
    entityType: "admin_award",
    entityId: award.id,
    beforeData: award,
    afterData: { removed: true }
  });
  return next;
}

export function adjustManualScore(input: {
  state: AppState;
  teamId: string;
  delta: number;
  actor: string;
  note?: string;
}) {
  const team = requireTeam(input.state, input.teamId);
  const updatedTeam = {
    ...team,
    manualAdjustment: team.manualAdjustment + input.delta
  };
  let next: AppState = {
    ...input.state,
    teams: input.state.teams.map((item) => (item.id === team.id ? updatedTeam : item))
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.actor,
    action: "manual_score_adjust",
    entityType: "team",
    entityId: team.id,
    beforeData: team,
    afterData: { updatedTeam, note: input.note }
  });
  return next;
}

export function undoManualScoreAdjustment(input: {
  state: AppState;
  auditLogId: string;
  actor: string;
}) {
  const log = input.state.auditLogs.find(
    (item) => item.id === input.auditLogId && item.action === "manual_score_adjust"
  );
  if (!log) throw new Error("되돌릴 점수 조정 기록을 찾을 수 없습니다.");
  const beforeTeam = log.beforeData as Team | undefined;
  if (!beforeTeam?.id) throw new Error("점수 조정 이전 상태가 없습니다.");
  const currentTeam = requireTeam(input.state, beforeTeam.id);
  const restoredTeam: Team = {
    ...currentTeam,
    manualAdjustment: beforeTeam.manualAdjustment
  };
  let next: AppState = {
    ...input.state,
    teams: input.state.teams.map((item) => (item.id === restoredTeam.id ? restoredTeam : item))
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.actor,
    action: "manual_score_undo",
    entityType: "team",
    entityId: restoredTeam.id,
    beforeData: currentTeam,
    afterData: { restoredTeam, sourceAuditLogId: input.auditLogId }
  });
  return next;
}

export function createTeam(input: {
  state: AppState;
  teamNumber: number;
  name: string;
  loginCode: string;
  churchName?: string;
  memberCount?: number;
  actor: string;
}) {
  const loginCode = input.loginCode.trim().toUpperCase();
  if (!input.teamNumber || input.teamNumber < 1) throw new Error("팀 번호를 확인해 주세요.");
  if (!input.name.trim()) throw new Error("팀 이름을 입력해 주세요.");
  if (!loginCode) throw new Error("팀 코드를 입력해 주세요.");
  if (input.state.teams.some((team) => team.teamNumber === input.teamNumber)) {
    throw new Error("이미 사용 중인 팀 번호입니다.");
  }
  if (input.state.teams.some((team) => team.loginCode.toUpperCase() === loginCode)) {
    throw new Error("이미 사용 중인 팀 코드입니다.");
  }
  const team: Team = {
    id: id("team"),
    teamNumber: input.teamNumber,
    name: input.name.trim(),
    loginCode,
    churchName: input.churchName?.trim() ?? "",
    memberCount: input.memberCount ?? 0,
    finalVerified: false,
    manualAdjustment: 0
  };
  let next: AppState = {
    ...input.state,
    teams: [...input.state.teams, team].sort((a, b) => a.teamNumber - b.teamNumber)
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.actor,
    action: "team_create",
    entityType: "team",
    entityId: team.id,
    afterData: team
  });
  return next;
}

export function updateTeam(input: {
  state: AppState;
  teamId: string;
  teamNumber: number;
  name: string;
  loginCode: string;
  churchName?: string;
  memberCount?: number;
  actor: string;
}) {
  const team = requireTeam(input.state, input.teamId);
  const loginCode = input.loginCode.trim().toUpperCase();
  if (!input.teamNumber || input.teamNumber < 1) throw new Error("팀 번호를 확인해 주세요.");
  if (!input.name.trim()) throw new Error("팀 이름을 입력해 주세요.");
  if (!loginCode) throw new Error("팀 코드를 입력해 주세요.");
  if (input.state.teams.some((item) => item.id !== team.id && item.teamNumber === input.teamNumber)) {
    throw new Error("이미 사용 중인 팀 번호입니다.");
  }
  if (input.state.teams.some((item) => item.id !== team.id && item.loginCode.toUpperCase() === loginCode)) {
    throw new Error("이미 사용 중인 팀 코드입니다.");
  }
  const updatedTeam: Team = {
    ...team,
    teamNumber: input.teamNumber,
    name: input.name.trim(),
    loginCode,
    churchName: input.churchName?.trim() ?? "",
    memberCount: input.memberCount ?? 0
  };
  let next: AppState = {
    ...input.state,
    teams: input.state.teams
      .map((item) => (item.id === team.id ? updatedTeam : item))
      .sort((a, b) => a.teamNumber - b.teamNumber)
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.actor,
    action: "team_update",
    entityType: "team",
    entityId: team.id,
    beforeData: team,
    afterData: updatedTeam
  });
  return next;
}

export function deleteTeam(input: {
  state: AppState;
  teamId: string;
  actor: string;
}) {
  const team = requireTeam(input.state, input.teamId);
  let next: AppState = {
    ...input.state,
    teams: input.state.teams.filter((item) => item.id !== team.id),
    submissions: input.state.submissions.filter((item) => item.teamId !== team.id),
    easterEggClaims: input.state.easterEggClaims.filter((item) => item.teamId !== team.id),
    adminAwards: input.state.adminAwards.filter((item) => item.teamId !== team.id),
    announcementSubmissions: input.state.announcementSubmissions.filter((item) => item.teamId !== team.id)
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.actor,
    action: "team_delete",
    entityType: "team",
    entityId: team.id,
    beforeData: team,
    afterData: { deleted: true }
  });
  return next;
}

export function resetOperationProgress(state: AppState): AppState {
  return {
    ...state,
    teams: state.teams.map((team) => ({
      ...team,
      manualAdjustment: 0,
      finalVerified: false,
      finalVerifiedAt: undefined
    })),
    submissions: [],
    easterEggClaims: [],
    adminAwards: [],
    announcementSubmissions: [],
    auditLogs: []
  };
}

export function createAnnouncement(input: {
  state: AppState;
  title: string;
  body: string;
  announcementType: Announcement["announcementType"];
  points?: number;
  isActive: boolean;
  actor: string;
}) {
  const announcement: Announcement = {
    id: id("announcement"),
    title: input.title,
    body: input.body,
    announcementType: input.announcementType,
    points: input.points,
    isActive: input.isActive,
    createdAt: now()
  };
  let next = {
    ...input.state,
    announcements: [announcement, ...input.state.announcements]
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.actor,
    action: "announcement_create",
    entityType: "announcement",
    entityId: announcement.id,
    afterData: announcement
  });
  return next;
}

export function toggleAnnouncement(input: {
  state: AppState;
  announcementId: string;
  actor: string;
}) {
  const target = input.state.announcements.find((item) => item.id === input.announcementId);
  if (!target) return input.state;
  const updated = { ...target, isActive: !target.isActive };
  let next = {
    ...input.state,
    announcements: input.state.announcements.map((item) =>
      item.id === target.id ? updated : item
    )
  };
  next = addAudit(next, {
    actorType: "admin",
    actorId: input.actor,
    action: "announcement_toggle",
    entityType: "announcement",
    entityId: target.id,
    beforeData: target,
    afterData: updated
  });
  return next;
}

export function buildTeamRows(state: AppState) {
  return state.teams.map((team) => {
    const progress = getTeamProgress(state, team.id);
    return { team, progress };
  });
}

export function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

export { ALL_CLEAR_BONUS, NEWSTART_COMPLETION_BONUS, THEMES };
