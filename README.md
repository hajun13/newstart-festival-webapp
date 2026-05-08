# NEWSTART Festival Webapp

2026 하계 청소년 페스티벌 **NEWSTART 생명의 열쇠를 찾아라** 운영을 위한 웹앱입니다.

이 레포는 Codex가 바로 구현을 시작할 수 있도록 요구사항 문서를 먼저 포함합니다.

## 핵심 요약

- 대상: 청소년 약 300명
- 팀: 약 30팀, 팀당 10명 내외
- 장소: 삼육대학교 캠퍼스 전체
- 최종 장소: 홍명기홀
- 운영 방식: 웹앱 기반 NEWSTART 캠퍼스 퀘스트
- 일반 미션 접근 방식: 공통 QR로 웹앱 접속 후, 현장 안내판의 미션 코드 입력
- 별도 QR 사용: 히든 이스터에그 QR, 홍명기홀 최종 인증 QR
- 팀 식별: 팀 코드 기반 로그인
- 관리자: 스태프 미션 승인, 제출 검토, 점수 수정, 공지 발송

## 문서 구조

- `docs/requirements.md`: 제품 및 운영 요구사항 전체
- `docs/missions.md`: 테마별 미션, 점수, 인증 방식
- `docs/data-model.md`: Supabase DB 스키마 초안
- `docs/load-testing.md`: 성능, 부하 테스트, 장애 대응 요구사항
- `docs/codex-prompt.md`: Codex 앱에 붙여넣을 구현 지시문

## 추천 기술 스택

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Database
- Supabase Storage
- 팀 코드 기반 자체 로그인
- Vercel 배포

## Codex 작업 시작 방법

Codex 앱에서 이 레포를 열고, 먼저 아래 파일들을 읽도록 지시합니다.

1. `docs/requirements.md`
2. `docs/missions.md`
3. `docs/data-model.md`
4. `docs/load-testing.md`
5. `docs/codex-prompt.md`

그 다음 `docs/codex-prompt.md`의 지시문을 기준으로 프로젝트 초기 구현을 진행합니다.
