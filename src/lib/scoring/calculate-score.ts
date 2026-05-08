import { THEME_CODE_PIECES } from "@/lib/scoring/code-pieces";
import { calculateTickets } from "@/lib/scoring/calculate-tickets";
import { getClearedThemes, getLifeKeyPhrase } from "@/lib/scoring/theme-status";
import { THEMES, type AdminAward, type EasterEggClaim, type Mission, type Submission, type Team, type TeamProgress } from "@/lib/types";

export const NEWSTART_COMPLETION_BONUS = 100;
export const ALL_CLEAR_BONUS = 200;
export const EASTER_EGG_SCORE_LIMIT = 3;

export function calculateTeamProgress(input: {
  team: Team;
  missions: Mission[];
  submissions: Submission[];
  easterEggClaims: EasterEggClaim[];
  adminAwards: AdminAward[];
  announcementPoints?: number;
}): TeamProgress {
  const approvedSubmissions = input.submissions.filter(
    (submission) => submission.status === "approved"
  );
  const approvedMissionIds = new Set(
    approvedSubmissions.map((submission) => submission.missionId)
  );
  const baseMissionScore = input.missions
    .filter((mission) => approvedMissionIds.has(mission.id))
    .reduce((sum, mission) => sum + mission.points, 0);
  const clearedThemes = getClearedThemes(input.missions, approvedSubmissions);
  const completedMissionCodes = input.missions
    .filter((mission) => approvedMissionIds.has(mission.id))
    .map((mission) => mission.code);
  const isNewstartComplete = clearedThemes.length === THEMES.length;
  const isAllClear = completedMissionCodes.length === input.missions.length;
  const easterPoints = input.easterEggClaims.reduce(
    (sum, claim) => sum + claim.awardedPoints,
    0
  );
  const awardPoints = input.adminAwards.reduce(
    (sum, award) => sum + award.points,
    0
  );
  const bonusScore =
    (isNewstartComplete ? NEWSTART_COMPLETION_BONUS : 0) +
    (isAllClear ? ALL_CLEAR_BONUS : 0);
  const score =
    baseMissionScore +
    easterPoints +
    awardPoints +
    (input.announcementPoints ?? 0) +
    bonusScore +
    input.team.manualAdjustment;

  return {
    score,
    baseMissionScore,
    completedMissionCodes,
    clearedThemes,
    codePieces: THEMES.map((theme) =>
      clearedThemes.includes(theme) ? THEME_CODE_PIECES[theme] : "_"
    ),
    lifeKey: getLifeKeyPhrase(clearedThemes),
    isNewstartComplete,
    isAllClear,
    tickets: calculateTickets(score, input.team.finalVerified),
    missingThemes: THEMES.filter((theme) => !clearedThemes.includes(theme)),
    finalVerified: input.team.finalVerified,
    easterAwardedCount: input.easterEggClaims.filter(
      (claim) => claim.awardedPoints > 0
    ).length
  };
}
