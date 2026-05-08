import { THEME_LABELS } from "@/lib/scoring/code-pieces";
import type { EasterEgg, Mission, Team } from "@/lib/types";

export const missionsSeed: Mission[] = [
  {
    id: "mission-nut-30",
    code: "NUT-30",
    theme: "nutrition",
    themeLabel: THEME_LABELS.nutrition,
    title: "영양 관련 QR 퀴즈",
    description: "영양과 건강한 식습관에 관한 퀴즈를 풀어 생명의 식탁 첫 단서를 확인합니다.",
    points: 30,
    type: "quiz",
    successCriteria: "3문항 중 2문항 이상 정답",
    locationHint: "영양 미션 안내판",
    sortOrder: 1,
    autoApprove: true,
    quiz: {
      passScore: 2,
      questions: [
        { id: "n1", prompt: "건강한 식사의 기본 원칙은?", options: ["균형", "폭식", "야식"], answer: "균형" },
        { id: "n2", prompt: "수분 섭취에 가장 좋은 음료는?", options: ["물", "탄산음료", "에너지드링크"], answer: "물" },
        { id: "n3", prompt: "채소와 과일은 어떤 영양소를 돕나요?", options: ["비타민", "니코틴", "카페인"], answer: "비타민" }
      ]
    }
  },
  {
    id: "mission-nut-50",
    code: "NUT-50",
    theme: "nutrition",
    themeLabel: THEME_LABELS.nutrition,
    title: "생명의 식탁을 완성하라",
    description: "건강한 식단 카드 5개를 쉼표로 구분해 입력합니다. 유혹 카드가 포함되면 관리자 검토 대상입니다.",
    points: 50,
    type: "text",
    successCriteria: "건강한 식단 카드 5개 이상 입력",
    locationHint: "식단 카드 구역",
    sortOrder: 2,
    autoApprove: true,
    acceptedAnswers: ["현미", "채소", "과일", "견과류", "물", "달걀", "닭가슴살", "생선", "두부", "콩"],
    helperItems: ["현미", "채소", "과일", "견과류", "물", "두부", "콩"]
  },
  {
    id: "mission-exe-50",
    code: "EXE-50",
    theme: "exercise",
    themeLabel: THEME_LABELS.exercise,
    title: "삼육대 무지개 루트",
    description: "캠퍼스에서 무지개 7가지 색을 찾아 팀 사진을 제출합니다.",
    points: 50,
    type: "photo",
    successCriteria: "현장에서 촬영한 색깔 인증 사진 제출",
    locationHint: "캠퍼스 전체",
    sortOrder: 3,
    autoApprove: true,
    helperItems: ["빨강", "주황", "노랑", "초록", "파랑", "남색", "보라"]
  },
  {
    id: "mission-exe-80",
    code: "EXE-80",
    theme: "exercise",
    themeLabel: THEME_LABELS.exercise,
    title: "네버스탑 1000보",
    description: "시작과 종료 걸음 수 스크린샷을 제출합니다. 차이가 1,000보 이상이어야 합니다.",
    points: 80,
    type: "screenshot",
    successCriteria: "걸음 수 차이 1,000보 이상",
    locationHint: "운동 루트",
    sortOrder: 4,
    autoApprove: false
  },
  {
    id: "mission-wtr-30",
    code: "WTR-30",
    theme: "water",
    themeLabel: THEME_LABELS.water,
    title: "생수의 근원을 찾아라",
    description: "물과 건강에 관한 퀴즈를 풉니다.",
    points: 30,
    type: "quiz",
    successCriteria: "3문항 중 2문항 이상 정답",
    locationHint: "물 미션 안내판",
    sortOrder: 5,
    autoApprove: true,
    quiz: {
      passScore: 2,
      questions: [
        { id: "w1", prompt: "우리 몸에 꼭 필요한 기본 음료는?", options: ["물", "커피", "탄산"], answer: "물" },
        { id: "w2", prompt: "갈증이 심할 때 먼저 해야 할 일은?", options: ["물 마시기", "간식 먹기", "운동 멈추지 않기"], answer: "물 마시기" },
        { id: "w3", prompt: "충분한 수분은 무엇을 돕나요?", options: ["집중력", "탈수", "피로 누적"], answer: "집중력" }
      ]
    }
  },
  {
    id: "mission-wtr-80",
    code: "WTR-80",
    theme: "water",
    themeLabel: THEME_LABELS.water,
    title: "하루 2리터 챌린지",
    description: "스태프 앞에서 주어진 통에 2L 기준 100mL 내외로 물을 맞춥니다.",
    points: 80,
    type: "staff",
    successCriteria: "연습 1회, 도전 3회 중 1회 성공",
    locationHint: "물 챌린지 부스",
    sortOrder: 6,
    autoApprove: false
  },
  {
    id: "mission-sun-50",
    code: "SUN-50",
    theme: "sunshine",
    themeLabel: THEME_LABELS.sunshine,
    title: "빛을 찾아서",
    description: "햇빛이 잘 드는 캠퍼스 장소 3곳에서 서로 다른 콘셉트 사진을 제출합니다.",
    points: 50,
    type: "photo",
    successCriteria: "서로 다른 장소 3곳 사진 제출",
    locationHint: "햇빛이 드는 캠퍼스 장소",
    sortOrder: 7,
    autoApprove: true
  },
  {
    id: "mission-sun-80",
    code: "SUN-80",
    theme: "sunshine",
    themeLabel: THEME_LABELS.sunshine,
    title: "빛의 말씀을 찾아라",
    description: "복도에 숨겨진 성경구절 조각을 찾아 장절과 문장을 입력합니다.",
    points: 80,
    type: "text",
    successCriteria: "정답 구절 또는 장절 입력",
    locationHint: "신학관 1층·2층 복도",
    sortOrder: 8,
    autoApprove: true,
    acceptedAnswers: ["요한복음 8:12", "나는 세상의 빛", "세상의 빛"]
  },
  {
    id: "mission-tmp-50",
    code: "TMP-50",
    theme: "temperance",
    themeLabel: THEME_LABELS.temperance,
    title: "절제의 3분",
    description: "팀원 전원이 3분 동안 조용히 절제 챌린지를 수행한 뒤 인증 문구를 제출합니다. 영상은 외부 백업 제출로 안내합니다.",
    points: 50,
    type: "video_or_text",
    successCriteria: "절제 챌린지 수행 확인 문구 제출",
    locationHint: "절제 챌린지 존",
    sortOrder: 9,
    autoApprove: true
  },
  {
    id: "mission-tmp-80",
    code: "TMP-80",
    theme: "temperance",
    themeLabel: THEME_LABELS.temperance,
    title: "고통도 이겨내는 거야",
    description: "지압판 위에서 파티피리를 물고 줄넘기 10회를 수행합니다.",
    points: 80,
    type: "staff",
    successCriteria: "참여자 과반수 통과",
    locationHint: "절제 스태프 부스",
    sortOrder: 10,
    autoApprove: false
  },
  {
    id: "mission-air-30",
    code: "AIR-30",
    theme: "air",
    themeLabel: THEME_LABELS.air,
    title: "Air QR 퀴즈",
    description: "공기와 호흡에 관한 수수께끼형 퀴즈를 풉니다.",
    points: 30,
    type: "quiz",
    successCriteria: "3문항 중 2문항 이상 정답",
    locationHint: "공기 미션 안내판",
    sortOrder: 11,
    autoApprove: true,
    quiz: {
      passScore: 2,
      questions: [
        { id: "a1", prompt: "눈에 보이지 않지만 숨 쉴 때 필요한 것은?", options: ["공기", "모래", "종이"], answer: "공기" },
        { id: "a2", prompt: "깊은 호흡은 무엇을 돕나요?", options: ["긴장 완화", "갈증 증가", "소음 증가"], answer: "긴장 완화" },
        { id: "a3", prompt: "맑은 공기를 위해 좋은 행동은?", options: ["환기", "연기 피우기", "쓰레기 태우기"], answer: "환기" }
      ]
    }
  },
  {
    id: "mission-air-80",
    code: "AIR-80",
    theme: "air",
    themeLabel: THEME_LABELS.air,
    title: "숨결로 날려버려",
    description: "얼굴에 붙은 포스트잇을 제한 시간 안에 떨어뜨립니다.",
    points: 80,
    type: "staff",
    successCriteria: "제한 시간 내 성공",
    locationHint: "공기 스태프 부스",
    sortOrder: 12,
    autoApprove: false
  },
  {
    id: "mission-rst-50",
    code: "RST-50",
    theme: "rest",
    themeLabel: THEME_LABELS.rest,
    title: "지친 자들아 티부스로 오라",
    description: "티부스에 방문해 준비된 음료 또는 물을 마시며 쉰 뒤 스태프 확인을 받습니다.",
    points: 50,
    type: "staff",
    successCriteria: "스태프 방문 확인",
    locationHint: "티부스",
    sortOrder: 13,
    autoApprove: false
  },
  {
    id: "mission-rst-55",
    code: "RST-55",
    theme: "rest",
    themeLabel: THEME_LABELS.rest,
    title: "짐 내려놓기",
    description: "익명 고민/기도 제목을 작성하고 다른 팀을 위해 1분간 기도합니다.",
    points: 50,
    type: "text",
    successCriteria: "기도 제목 또는 감사 제목 작성",
    locationHint: "휴식 미션 존",
    sortOrder: 14,
    autoApprove: true
  },
  {
    id: "mission-trs-50",
    code: "TRS-50",
    theme: "trust",
    themeLabel: THEME_LABELS.trust,
    title: "믿음의 한 컷",
    description: "오얏봉에서 팀원들이 서로 신뢰하는 장면을 안전하게 연출해 사진을 제출합니다.",
    points: 50,
    type: "photo",
    successCriteria: "위험한 자세 없이 팀 신뢰 장면 촬영",
    locationHint: "오얏봉",
    sortOrder: 15,
    autoApprove: true
  },
  {
    id: "mission-trs-80",
    code: "TRS-80",
    theme: "trust",
    themeLabel: THEME_LABELS.trust,
    title: "라이어 게임",
    description: "서로 다른 제시어를 가진 사람을 찾아내는 팀 게임입니다.",
    points: 80,
    type: "staff",
    successCriteria: "라이어를 찾아내면 성공",
    locationHint: "Trust 게임 부스",
    sortOrder: 16,
    autoApprove: false
  }
];

export function createTeamsSeed(): Team[] {
  return Array.from({ length: 30 }, (_, index) => {
    const teamNumber = index + 1;
    return {
      id: `team-${String(teamNumber).padStart(2, "0")}`,
      teamNumber,
      name: `NEWSTART ${teamNumber}팀`,
      loginCode: `TEAM-${String(teamNumber).padStart(2, "0")}-KEY`,
      churchName: `지역교회 ${teamNumber}`,
      memberCount: 10,
      finalVerified: false,
      manualAdjustment: 0
    };
  });
}

export function createEasterEggSeed(): EasterEgg[] {
  return Array.from({ length: 10 }, (_, index) => {
    const eggNumber = index + 1;
    return {
      id: `egg-${String(eggNumber).padStart(2, "0")}`,
      code: `EGG-${String(eggNumber).padStart(2, "0")}`,
      title: `숨겨진 축복 QR ${eggNumber}`,
      message: "숨겨진 축복을 발견했습니다. 팀당 최대 3개까지 점수로 인정됩니다.",
      points: 30,
      isActive: true
    };
  });
}
