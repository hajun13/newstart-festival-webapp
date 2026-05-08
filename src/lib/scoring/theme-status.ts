import { THEME_CODE_PIECES } from "@/lib/scoring/code-pieces";
import { THEMES, type Mission, type Submission, type Theme } from "@/lib/types";

export function getApprovedMissionIds(submissions: Submission[]): Set<string> {
  return new Set(
    submissions
      .filter((submission) => submission.status === "approved")
      .map((submission) => submission.missionId)
  );
}

export function getClearedThemes(
  missions: Mission[],
  submissions: Submission[]
): Theme[] {
  const approvedMissionIds = getApprovedMissionIds(submissions);
  const cleared = new Set<Theme>();

  for (const mission of missions) {
    if (approvedMissionIds.has(mission.id)) {
      cleared.add(mission.theme);
    }
  }

  return THEMES.filter((theme) => cleared.has(theme));
}

export function getCodePieces(clearedThemes: Theme[]): string[] {
  return THEMES.map((theme) =>
    clearedThemes.includes(theme) ? THEME_CODE_PIECES[theme] : "_"
  );
}

export function getLifeKeyPhrase(clearedThemes: Theme[]): string {
  if (clearedThemes.length === THEMES.length) return "홍명기홀로 오라!";
  return getCodePieces(clearedThemes).join(" ");
}
