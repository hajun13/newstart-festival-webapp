insert into teams (team_number, name, login_code, church_name, member_count)
select
  number,
  'NEWSTART ' || number || '팀',
  'TEAM-' || lpad(number::text, 2, '0') || '-KEY',
  '지역교회 ' || number,
  10
from generate_series(1, 30) as number
on conflict (team_number) do nothing;

insert into missions (code, theme, title, description, points, submission_type, sort_order, success_criteria, metadata) values
('NUT-30','nutrition','영양 관련 QR 퀴즈','영양과 건강한 식습관 관련 퀴즈',30,'quiz',1,'절반 이상 정답','{"passScore":2}'::jsonb),
('NUT-50','nutrition','생명의 식탁을 완성하라','건강한 식단 카드 5개 입력',50,'text',2,'정답 카드 5개 이상','{"acceptedAnswers":["현미","채소","과일","견과류","물","달걀","닭가슴살","생선","두부","콩"]}'::jsonb),
('EXE-50','exercise','삼육대 무지개 루트','무지개 7가지 색 사진 인증',50,'photo',3,'현장 사진 제출','{}'::jsonb),
('EXE-80','exercise','네버스탑 1000보','걸음 수 시작/종료 스크린샷 제출',80,'screenshot',4,'1,000보 이상','{}'::jsonb),
('WTR-30','water','생수의 근원을 찾아라','물 관련 퀴즈',30,'quiz',5,'절반 이상 정답','{"passScore":2}'::jsonb),
('WTR-80','water','하루 2리터 챌린지','2L 기준 100mL 내외 맞추기',80,'staff',6,'스태프 성공 판정','{}'::jsonb),
('SUN-50','sunshine','빛을 찾아서','햇빛 장소 3곳 사진 인증',50,'photo',7,'서로 다른 장소 3곳','{}'::jsonb),
('SUN-80','sunshine','빛의 말씀을 찾아라','성경구절과 장절 입력',80,'text',8,'정답 구절 입력','{"acceptedAnswers":["요한복음 8:12","나는 세상의 빛","세상의 빛"]}'::jsonb),
('TMP-50','temperance','절제의 3분','절제 챌린지 텍스트/외부 제출 인증',50,'video_or_text',9,'인증 문구 제출','{}'::jsonb),
('TMP-80','temperance','고통도 이겨내는 거야','지압판 줄넘기 챌린지',80,'staff',10,'스태프 성공 판정','{}'::jsonb),
('AIR-30','air','Air QR 퀴즈','공기 관련 퀴즈',30,'quiz',11,'절반 이상 정답','{"passScore":2}'::jsonb),
('AIR-80','air','숨결로 날려버려','포스트잇 떨어뜨리기',80,'staff',12,'스태프 성공 판정','{}'::jsonb),
('RST-50','rest','지친 자들아 티부스로 오라','티부스 방문 휴식',50,'staff',13,'스태프 방문 확인','{}'::jsonb),
('RST-55','rest','짐 내려놓기','기도 제목 작성',50,'text',14,'기도 제목 작성','{}'::jsonb),
('TRS-50','trust','믿음의 한 컷','오얏봉 신뢰 장면 사진',50,'photo',15,'안전한 팀 사진 제출','{}'::jsonb),
('TRS-80','trust','라이어 게임','라이어 찾아내기',80,'staff',16,'스태프 성공 판정','{}'::jsonb)
on conflict (code) do nothing;

insert into easter_eggs (code, title, message, points)
select
  'EGG-' || lpad(number::text, 2, '0'),
  '숨겨진 축복 QR ' || number,
  '숨겨진 축복을 발견했습니다. 팀당 최대 3개까지 점수로 인정됩니다.',
  30
from generate_series(1, 10) as number
on conflict (code) do nothing;

insert into announcements (title, body, announcement_type, is_active)
values ('운영본부 공지', '팀장은 한 명만 대표로 제출하고, 업로드 실패 시 백업 제출을 요청하세요.', 'notice', true)
on conflict do nothing;
