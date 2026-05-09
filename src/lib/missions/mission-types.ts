import type { SubmissionType } from "@/lib/types";

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  quiz: "퀴즈 자동 채점",
  text: "텍스트 답안",
  photo: "사진 업로드",
  screenshot: "스크린샷 업로드",
  video_or_text: "텍스트/외부 제출 안내",
  staff: "스태프 승인",
  final: "최종 인증",
  easter_qr: "히든 코드",
  admin_award: "관리자 보너스",
  announcement_challenge: "돌발 미션"
};
