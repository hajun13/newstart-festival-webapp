export const STORAGE_BUCKETS = {
  missionSubmissions: "mission-submissions",
  announcementSubmissions: "announcement-submissions"
} as const;

export function buildMissionSubmissionPath(input: {
  teamId: string;
  missionCode: string;
  filename: string;
  timestamp?: number;
}) {
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${input.teamId}/${input.missionCode}/${input.timestamp ?? Date.now()}-${safeName}`;
}
