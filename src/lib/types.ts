export const THEMES = [
  "nutrition",
  "exercise",
  "water",
  "sunshine",
  "temperance",
  "air",
  "rest",
  "trust"
] as const;

export type Theme = (typeof THEMES)[number];

export type SubmissionType =
  | "quiz"
  | "text"
  | "photo"
  | "screenshot"
  | "video_or_text"
  | "staff"
  | "final"
  | "easter_qr"
  | "admin_award"
  | "announcement_challenge";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected"
  | "cancelled";

export type Team = {
  id: string;
  teamNumber: number;
  name: string;
  loginCode: string;
  churchName: string;
  memberCount: number;
  finalVerified: boolean;
  finalVerifiedAt?: string;
  manualAdjustment: number;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
};

export type Mission = {
  id: string;
  code: string;
  theme: Theme;
  themeLabel: string;
  title: string;
  description: string;
  points: number;
  type: SubmissionType;
  successCriteria: string;
  locationHint: string;
  sortOrder: number;
  autoApprove: boolean;
  quiz?: {
    passScore: number;
    questions: QuizQuestion[];
  };
  acceptedAnswers?: string[];
  helperItems?: string[];
};

export type Submission = {
  id: string;
  teamId: string;
  missionId: string;
  type: SubmissionType;
  status: SubmissionStatus;
  answerText?: string;
  answerJson?: Record<string, unknown>;
  filePaths: string[];
  awardedPoints: number;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EasterEgg = {
  id: string;
  code: string;
  title: string;
  message: string;
  points: number;
  isActive: boolean;
};

export type EasterEggClaim = {
  id: string;
  teamId: string;
  easterEggId: string;
  awardedPoints: number;
  claimedAt: string;
  note?: string;
};

export type AdminAward = {
  id: string;
  teamId: string;
  awardType: "hidden_staff" | "manual_bonus" | "manual_penalty";
  title: string;
  points: number;
  awardedBy: string;
  note?: string;
  createdAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  announcementType: "notice" | "challenge";
  points?: number;
  isActive: boolean;
  createdAt: string;
};

export type AnnouncementSubmission = {
  id: string;
  announcementId: string;
  teamId: string;
  status: SubmissionStatus;
  answerText?: string;
  awardedPoints: number;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actorType: "team" | "admin" | "system";
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeData?: unknown;
  afterData?: unknown;
  createdAt: string;
};

export type AppState = {
  teams: Team[];
  missions: Mission[];
  submissions: Submission[];
  easterEggs: EasterEgg[];
  easterEggClaims: EasterEggClaim[];
  adminAwards: AdminAward[];
  announcements: Announcement[];
  announcementSubmissions: AnnouncementSubmission[];
  auditLogs: AuditLog[];
};

export type TeamProgress = {
  score: number;
  baseMissionScore: number;
  completedMissionCodes: string[];
  clearedThemes: Theme[];
  codePieces: string[];
  lifeKey: string;
  isNewstartComplete: boolean;
  isAllClear: boolean;
  tickets: number;
  missingThemes: Theme[];
  finalVerified: boolean;
  easterAwardedCount: number;
};
