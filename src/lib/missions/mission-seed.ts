import { THEME_LABELS } from "@/lib/scoring/code-pieces";
import type { EasterEgg, Mission, Team } from "@/lib/types";

export const missionsSeed: Mission[] = [
  {
    id: "mission-nut-30",
    code: "NUT-30",
    theme: "nutrition",
    themeLabel: THEME_LABELS.nutrition,
    title: "영양 미션 코드 퀴즈",
    description: "영양과 건강한 식습관에 관한 퀴즈를 풀어 생명의 식탁 첫 단서를 확인합니다.",
    points: 30,
    type: "quiz",
    successCriteria: "20문항 중 10문항 이상 정답",
    locationHint: "영양 미션 안내판",
    sortOrder: 1,
    autoApprove: true,
    quiz: {
      passScore: 10,
      questions: [
        {
          id: "n-mc1",
          prompt: "다음 중 비타민 C의 주요 기능으로 가장 적절한 것은?",
          options: [
            "뼈와 치아의 주성분이 된다",
            "철분 흡수를 돕고 항산화 작용을 한다",
            "혈액을 통해 산소를 운반한다",
            "몸의 주된 에너지원으로 사용된다"
          ],
          answer: "철분 흡수를 돕고 항산화 작용을 한다"
        },
        {
          id: "n-mc2",
          prompt: "다음 중 나트륨 과다 섭취와 가장 관련 깊은 건강 문제는?",
          options: ["저혈압", "고혈압", "야맹증", "빈혈"],
          answer: "고혈압"
        },
        {
          id: "n-mc3",
          prompt: "다음 중 철분이 부족할 때 생길 수 있는 대표적인 문제는?",
          options: ["빈혈", "충치", "탈수", "야맹증"],
          answer: "빈혈"
        },
        {
          id: "n-mc4",
          prompt: "다음 중 비타민 A 부족과 가장 관련 깊은 증상은?",
          options: ["야맹증", "빈혈", "고혈압", "골다공증"],
          answer: "야맹증"
        },
        {
          id: "n-mc5",
          prompt: "다음 중 지방의 기능으로 가장 적절하지 않은 것은?",
          options: ["에너지 저장", "체온 유지", "지용성 비타민 흡수 도움", "산소 운반"],
          answer: "산소 운반"
        },
        {
          id: "n-mc6",
          prompt: "다음 중 혈액에서 산소 운반과 가장 관련 깊은 영양소는?",
          options: ["칼슘", "철분", "비타민 C", "식이섬유"],
          answer: "철분"
        },
        {
          id: "n-mc7",
          prompt: "다음 중 지용성 비타민에 해당하는 것은?",
          options: ["비타민 C", "비타민 B1", "비타민 D", "비타민 B12"],
          answer: "비타민 D"
        },
        {
          id: "n-mc8",
          prompt: "다음 중 수용성 비타민에 해당하는 것은?",
          options: ["비타민 A", "비타민 D", "비타민 E", "비타민 C"],
          answer: "비타민 C"
        },
        {
          id: "n-mc9",
          prompt: "다음 중 과도한 당 섭취와 가장 관련 깊은 문제는?",
          options: ["충치와 체중 증가", "야맹증", "산소 부족", "칼슘 흡수 증가"],
          answer: "충치와 체중 증가"
        },
        {
          id: "n-mc10",
          prompt: "다음 중 영양소와 기능의 연결이 잘못된 것은?",
          options: [
            "단백질 - 근육과 세포 구성",
            "칼슘 - 뼈와 치아 건강",
            "철분 - 산소 운반",
            "식이섬유 - 혈액 속 산소 운반"
          ],
          answer: "식이섬유 - 혈액 속 산소 운반"
        },
        {
          id: "n-ox1",
          prompt: "지용성 비타민은 지방과 함께 섭취할 때 흡수가 더 잘될 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "n-ox2",
          prompt: "비타민 D는 칼슘 흡수와 관련이 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "n-ox3",
          prompt: "식이섬유는 소장에서 완전히 소화된다.",
          options: ["O", "X"],
          answer: "X"
        },
        {
          id: "n-ox4",
          prompt: "단백질은 근육뿐 아니라 효소와 호르몬의 구성에도 관여한다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "n-ox5",
          prompt: "철분은 혈액 내 산소 운반과 관련이 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "n-ox6",
          prompt: "탄수화물, 단백질, 지방은 모두 에너지원으로 사용될 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "n-ox7",
          prompt: "나트륨은 체내 수분 균형 유지와 관련이 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "n-ox8",
          prompt: "비타민 C는 철분 흡수를 도울 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "n-ox9",
          prompt: "칼슘은 뼈와 치아 건강 유지에 중요한 역할을 한다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "n-ox10",
          prompt: "과도한 당 섭취는 충치 및 체중 증가와 관련될 수 있다.",
          options: ["O", "X"],
          answer: "O"
        }
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
    description: "캠퍼스 전체에서 무지개 7가지 색을 찾고, 색깔별 포즈를 함께 찍어 팀 사진을 제출합니다. 특정 장소 코드 없이 앱에서 바로 시작합니다.",
    points: 50,
    type: "photo",
    successCriteria: "빨강 열정, 주황 점프, 노랑 햇살 미소, 초록 나무, 파랑 파도, 남색 기도, 보라 왕관 포즈 인증",
    locationHint: "캠퍼스 전체 자유 진행",
    sortOrder: 3,
    autoApprove: true,
    helperItems: [
      "빨강 - 열정 포즈",
      "주황 - 점프 포즈",
      "노랑 - 햇살 미소",
      "초록 - 나무 포즈",
      "파랑 - 파도 포즈",
      "남색 - 기도 포즈",
      "보라 - 왕관 포즈"
    ]
  },
  {
    id: "mission-exe-80",
    code: "EXE-80",
    theme: "exercise",
    themeLabel: THEME_LABELS.exercise,
    title: "네버스탑 1000보",
    description: "운영진이 나눠준 실제 만보기로 1,000보를 채운 뒤, 만보기 화면과 팀이 함께 보이게 사진을 찍어 제출합니다.",
    points: 80,
    type: "photo",
    successCriteria: "실제 만보기 1,000보 이상 완료 사진 제출",
    locationHint: "캠퍼스 전체 자유 진행",
    sortOrder: 4,
    autoApprove: false,
    helperItems: ["운영진 지급 만보기 사용", "만보기 숫자 1,000보 이상 보이게 촬영", "팀원이 함께 보이게 촬영"]
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
    successCriteria: "20문항 중 10문항 이상 정답",
    locationHint: "물 미션 안내판",
    sortOrder: 5,
    autoApprove: true,
    quiz: {
      passScore: 10,
      questions: [
        {
          id: "w-mc1",
          prompt: "물을 끓이면 생기는 기체는?",
          options: ["산소", "수증기", "이산화탄소", "먼지"],
          answer: "수증기"
        },
        {
          id: "w-mc2",
          prompt: "물의 화학식으로 알맞은 것은?",
          options: ["CO₂", "H₂O", "O₂", "NaCl"],
          answer: "H₂O"
        },
        {
          id: "w-mc3",
          prompt: "물 대신 탄산음료를 자주 마시면 많이 섭취하게 되는 것은?",
          options: ["단백질", "칼슘", "당", "산소"],
          answer: "당"
        },
        {
          id: "w-mc4",
          prompt: "물을 아껴 쓰는 것을 무엇이라고 하나요?",
          options: ["절수", "과식", "과속", "소음"],
          answer: "절수"
        },
        {
          id: "w-mc5",
          prompt: "물이 부족할 때 색이 진해질 수 있는 것은?",
          options: ["머리카락", "소변", "손톱", "눈동자"],
          answer: "소변"
        },
        {
          id: "w-mc6",
          prompt: "물은 혈액을 통해 무엇의 이동을 돕나요?",
          options: ["영양소와 산소", "먼지와 모래", "머리카락과 손톱", "신발과 옷"],
          answer: "영양소와 산소"
        },
        {
          id: "w-mc7",
          prompt: "예수님께서 첫 번째 기적으로 물을 포도주로 바꾸신 장소는?",
          options: ["가나 혼인잔치", "베들레헴 마구간", "예루살렘 성전", "갈릴리 바다"],
          answer: "가나 혼인잔치"
        },
        {
          id: "w-mc8",
          prompt: "광야에서 목말라하던 이스라엘 백성을 위해 하나님께서 물을 내신 곳은?",
          options: ["반석", "나무", "구름", "성전"],
          answer: "반석"
        },
        {
          id: "w-mc9",
          prompt: "다음 중 수분 보충에 대한 설명으로 가장 적절한 것은?",
          options: [
            "갈증이 전혀 없어도 활동량과 날씨에 따라 물이 필요할 수 있다",
            "목이 마르지 않으면 하루 종일 물을 안 마셔도 항상 괜찮다",
            "운동 전에는 물을 마시면 안 된다",
            "물은 식사 중에는 절대 마시면 안 된다"
          ],
          answer: "갈증이 전혀 없어도 활동량과 날씨에 따라 물이 필요할 수 있다"
        },
        {
          id: "w-mc10",
          prompt: "더운 날 야외활동을 할 때 물을 자주 마셔야 하는 이유로 가장 알맞은 것은?",
          options: [
            "땀으로 수분 손실이 증가할 수 있기 때문이다",
            "더운 날에는 물이 몸에서 만들어지기 때문이다",
            "물을 마시면 햇빛을 완전히 차단할 수 있기 때문이다",
            "물을 마시면 땀이 절대 나지 않기 때문이다"
          ],
          answer: "땀으로 수분 손실이 증가할 수 있기 때문이다"
        },
        {
          id: "w-ox1",
          prompt: "몸에서 가장 많이 차지하는 영양소는 물이다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "w-ox2",
          prompt: "물도 많이 먹으면 살이 찔 수 있다.",
          options: ["O", "X"],
          answer: "X"
        },
        {
          id: "w-ox3",
          prompt: "마시던 물을 오랫동안 열어두면 먼지나 세균에 오염될 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "w-ox4",
          prompt: "물은 몸속 노폐물 배출과 관련이 없다.",
          options: ["O", "X"],
          answer: "X"
        },
        {
          id: "w-ox5",
          prompt: "기름을 싱크대에 함부로 버리면 물을 오염시킬 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "w-ox6",
          prompt: "모든 사람에게 하루 물 섭취량은 무조건 똑같이 정해져 있다.",
          options: ["O", "X"],
          answer: "X"
        },
        {
          id: "w-ox7",
          prompt: "깨끗한 물은 무한히 생기기 때문에 아껴 쓸 필요가 없다.",
          options: ["O", "X"],
          answer: "X"
        },
        {
          id: "w-ox8",
          prompt: "운동하기 전에도 미리 물을 마셔두면 수분 부족을 예방하는 데 도움이 된다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "w-ox9",
          prompt: "성경에서 물은 생명, 정결, 새로움의 의미로 사용되기도 한다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "w-ox10",
          prompt: "계곡물이나 강물은 맑아 보이면 바로 마셔도 항상 안전하다.",
          options: ["O", "X"],
          answer: "X"
        }
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
    description: "햇빛이 잘 드는 캠퍼스 장소 3곳을 팀이 직접 찾아 가장 밝은 미소, 햇빛 영웅 포즈, 하나님이 주신 빛 표현 사진을 제출합니다. 특정 추천 장소 없이 앱에서 바로 시작합니다.",
    points: 50,
    type: "photo",
    successCriteria: "서로 다른 장소 3곳에서 지정 콘셉트 3장 제출",
    locationHint: "캠퍼스 전체 자유 진행",
    sortOrder: 7,
    autoApprove: true,
    helperItems: ["가장 밝은 미소", "햇빛을 받는 영웅 포즈", "하나님이 주신 빛을 표현하는 포즈"]
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
    description: "팀원 전원이 3분 동안 한자리에 앉아 움직이지 않고 조용히 있는 모습을 촬영합니다. 영상은 카카오톡으로 이한빛 전도사에게 보내고, 앱에는 전송 완료 문구를 남깁니다.",
    points: 50,
    type: "video_or_text",
    successCriteria: "절제 챌린지 수행 확인 문구 제출",
    locationHint: "조용하고 안전한 장소에서 분산 진행",
    sortOrder: 9,
    autoApprove: true,
    helperItems: ["카카오톡 전송 완료", "이한빛 전도사에게 영상 전송", "팀 전원 3분 절제 완료"]
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
    title: "Air 미션 코드 퀴즈",
    description: "공기와 호흡에 관한 수수께끼형 퀴즈를 풉니다.",
    points: 30,
    type: "quiz",
    successCriteria: "20문항 중 10문항 이상 정답",
    locationHint: "공기 미션 안내판",
    sortOrder: 11,
    autoApprove: true,
    quiz: {
      passScore: 10,
      questions: [
        {
          id: "a-mc1",
          prompt: "다음 중 공기 중 가장 많은 비율을 차지하는 기체는?",
          options: ["산소", "질소", "이산화탄소", "수소"],
          answer: "질소"
        },
        {
          id: "a-mc2",
          prompt: "다음 중 사람의 호흡에 가장 직접적으로 필요한 기체는?",
          options: ["산소", "질소", "헬륨", "수소"],
          answer: "산소"
        },
        {
          id: "a-mc3",
          prompt: "다음 중 실내 공기를 깨끗하게 하는 데 가장 도움이 되는 행동은?",
          options: ["환기하기", "불 켜두기", "이어폰 끼기", "설탕 줄이기"],
          answer: "환기하기"
        },
        {
          id: "a-mc4",
          prompt: "다음 중 폐 건강에 가장 좋지 않은 것은?",
          options: ["담배 연기", "산책", "환기", "물 마시기"],
          answer: "담배 연기"
        },
        {
          id: "a-mc5",
          prompt: "다음 중 미세먼지가 심한 날 도움이 되는 행동은?",
          options: ["KF 마스크 착용", "창문 계속 열기", "야외 운동 오래 하기", "먼지 많은 곳 걷기"],
          answer: "KF 마스크 착용"
        },
        {
          id: "a-mc6",
          prompt: "다음 중 광합성과 가장 관련 있는 기체는?",
          options: ["산소", "질소", "이산화탄소", "헬륨"],
          answer: "이산화탄소"
        },
        {
          id: "a-mc7",
          prompt: "다음 중 폐 안에서 기체 교환이 일어나는 곳은?",
          options: ["심장", "위", "폐포", "간"],
          answer: "폐포"
        },
        {
          id: "a-mc8",
          prompt: "다음 중 호흡 운동과 가장 관련 깊은 근육은?",
          options: ["이두근", "복근", "횡격막", "삼두근"],
          answer: "횡격막"
        },
        {
          id: "a-mc9",
          prompt: "다음 중 공기 오염 물질로 볼 수 있는 것은?",
          options: ["미세먼지", "산소", "수증기", "질소"],
          answer: "미세먼지"
        },
        {
          id: "a-mc10",
          prompt: "다음 중 이산화탄소 농도가 너무 높아질 때 나타날 수 있는 증상은?",
          options: ["집중력 저하", "키 성장", "시력 향상", "근육 증가"],
          answer: "집중력 저하"
        },
        {
          id: "a-ox1",
          prompt: "폐포는 산소와 이산화탄소의 기체 교환이 일어나는 곳이다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "a-ox2",
          prompt: "공기 중에서 가장 많은 비율을 차지하는 기체는 산소이다.",
          options: ["O", "X"],
          answer: "X"
        },
        {
          id: "a-ox3",
          prompt: "환기는 실내 공기 질 개선에 도움이 될 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "a-ox4",
          prompt: "미세먼지는 호흡기 건강에 영향을 줄 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "a-ox5",
          prompt: "횡격막은 호흡 운동과 관련된 근육이다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "a-ox6",
          prompt: "사람이 들이마시는 공기에는 이산화탄소가 전혀 포함되어 있지 않다.",
          options: ["O", "X"],
          answer: "X"
        },
        {
          id: "a-ox7",
          prompt: "KF 마스크는 미세먼지 차단에 도움을 줄 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "a-ox8",
          prompt: "광합성 과정에서 식물은 산소를 흡수한다.",
          options: ["O", "X"],
          answer: "X"
        },
        {
          id: "a-ox9",
          prompt: "공기 오염은 폐 건강과 관련이 있을 수 있다.",
          options: ["O", "X"],
          answer: "O"
        },
        {
          id: "a-ox10",
          prompt: "세포호흡은 산소와 관련된 과정이다.",
          options: ["O", "X"],
          answer: "O"
        }
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
    description: "개인 이름 없이 익명 고민/기도 제목을 작성하고, 앱에 표시되는 다른 팀의 기도 제목을 받아 팀끼리 1분간 기도합니다.",
    points: 50,
    type: "text",
    successCriteria: "개인정보 없이 기도 제목 작성 후 다른 팀 기도 제목을 위해 1분 기도",
    locationHint: "조용하고 안전한 장소에서 자유 진행",
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
      title: `숨겨진 축복 코드 ${eggNumber}`,
      message: "숨겨진 축복을 발견했습니다. 팀당 최대 3개까지 점수로 인정됩니다.",
      points: 30,
      isActive: true
    };
  });
}
