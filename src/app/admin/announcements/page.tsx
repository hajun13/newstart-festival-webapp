"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import { createAnnouncement, saveState, toggleAnnouncement } from "@/lib/state";
import { Megaphone, Send, ToggleLeft, ToggleRight } from "lucide-react";
import { useMemo, useState } from "react";

function typeLabel(type: "notice" | "challenge") {
  return type === "challenge" ? "돌발 미션" : "공지";
}

export default function AdminAnnouncementsPage() {
  const [state, setState] = useAdminState();
  const [title, setTitle] = useState("NEWSTART 돌발 미션");
  const [body, setBody] = useState("지금부터 10분 안에 팀원들이 하트 포즈로 사진을 찍어 카카오톡 운영 채널로 제출하세요. 운영진 확인 후 팀 관리에서 돌발 미션 점수를 지급합니다.");
  const [type, setType] = useState<"notice" | "challenge">("challenge");
  const [points, setPoints] = useState(30);
  const stats = useMemo(() => {
    const active = state.announcements.filter((item) => item.isActive).length;
    const challenges = state.announcements.filter((item) => item.announcementType === "challenge").length;
    const activeChallenges = state.announcements.filter((item) => item.announcementType === "challenge" && item.isActive).length;
    return { active, challenges, activeChallenges };
  }, [state.announcements]);

  function mutate(next: typeof state) {
    saveState(next);
    setState(next);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutate(
      createAnnouncement({
        state,
        title,
        body,
        announcementType: type,
        points: type === "challenge" ? points : undefined,
        isActive: true,
        actor: "admin"
      })
    );
  }

  return (
    <AppShell mode="admin">
      <AdminNav />
      <div className="space-y-5 pb-20">
        <div className="rounded-md border-2 border-ink bg-night p-5 text-paper shadow-cut">
          <p className="text-xs font-black tracking-[0.18em] text-citrus">운영본부 방송 데스크</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black">공지/돌발 미션</h1>
              <p className="mt-1 text-sm text-paper/70">현장 안내와 시간 제한 돌발 미션을 생성하고 노출 상태를 관리합니다.</p>
            </div>
            <div className="rounded-md border border-paper/20 px-3 py-2 text-sm font-black">
              활성 {stats.active}건 / 전체 {state.announcements.length}건
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["전체 공지", state.announcements.length],
            ["활성", stats.active],
            ["돌발 미션", stats.challenges],
            ["진행 중 돌발", stats.activeChallenges]
          ].map(([label, value]) => (
            <Card key={label as string} className="shadow-none">
              <div className="text-xs font-bold text-ink/55">{label}</div>
              <div className="mt-2 text-2xl font-black">{Number(value).toLocaleString("ko-KR")}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Card>
            <div className="flex items-center gap-2">
              <Megaphone size={20} className="text-coral" />
              <h2 className="text-xl font-black">새 항목 생성</h2>
            </div>
            <form className="mt-5 space-y-4" onSubmit={submit}>
              <label className="block text-xs font-black text-ink/55" htmlFor="announcement-title">제목</label>
              <Input id="announcement-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <label className="block text-xs font-black text-ink/55" htmlFor="announcement-body">내용</label>
              <Textarea id="announcement-body" value={body} onChange={(event) => setBody(event.target.value)} />
              <label className="block text-xs font-black text-ink/55" htmlFor="announcement-type">종류</label>
              <select
                id="announcement-type"
                className="min-h-11 w-full rounded-md border border-ink/20 bg-white px-3"
                value={type}
                onChange={(event) => setType(event.target.value as never)}
              >
                <option value="notice">공지</option>
                <option value="challenge">돌발 미션</option>
              </select>
              {type === "challenge" ? (
                <>
                  <p className="rounded-md bg-citrus/25 p-3 text-sm font-semibold leading-6">
                    돌발 미션은 공지로 시간을 열고, 제출 확인 후 팀 관리에서 `돌발 미션 +30`을 누르면 됩니다.
                  </p>
                  <label className="block text-xs font-black text-ink/55" htmlFor="announcement-points">점수</label>
                  <Input id="announcement-points" type="number" value={points} onChange={(event) => setPoints(Number(event.target.value))} />
                </>
              ) : null}
              <Button className="w-full">
                <Send size={16} /> 발송
              </Button>
            </form>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">공지 운영 표</h2>
                <p className="mt-1 text-sm text-ink/60">최근 생성 항목부터 상태, 종류, 점수와 노출 전환을 확인합니다.</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[920px] w-full border-separate border-spacing-y-1 text-left text-sm">
                <thead>
                  <tr className="text-xs text-ink/55">
                    <th className="rounded-l-md bg-paper px-3 py-2">상태</th>
                    <th className="bg-paper px-3 py-2">종류</th>
                    <th className="bg-paper px-3 py-2">제목/내용</th>
                    <th className="bg-paper px-3 py-2 text-right">점수</th>
                    <th className="bg-paper px-3 py-2">생성 시각</th>
                    <th className="rounded-r-md bg-paper px-3 py-2">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {state.announcements.map((announcement) => (
                    <tr key={announcement.id} className="align-top">
                      <td className="rounded-l-md bg-white px-3 py-3">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-black ${announcement.isActive ? "border-moss bg-moss text-paper" : "border-ink/15 bg-paper text-ink/55"}`}>
                          {announcement.isActive ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="bg-white px-3 py-3 font-black">{typeLabel(announcement.announcementType)}</td>
                      <td className="bg-white px-3 py-3">
                        <div className="max-w-[420px] font-black">{announcement.title}</div>
                        <div className="mt-1 max-w-[520px] whitespace-pre-wrap text-sm leading-5 text-ink/65">{announcement.body}</div>
                      </td>
                      <td className="bg-white px-3 py-3 text-right font-black">{announcement.points ?? 0}점</td>
                      <td className="bg-white px-3 py-3 text-xs font-bold text-ink/55">
                        {new Date(announcement.createdAt).toLocaleString("ko-KR")}
                      </td>
                      <td className="rounded-r-md bg-white px-3 py-3">
                        <Button
                          variant="secondary"
                          className="min-h-9 px-3 text-xs"
                          onClick={() => mutate(toggleAnnouncement({ state, announcementId: announcement.id, actor: "admin" }))}
                        >
                          {announcement.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                          {announcement.isActive ? "비활성" : "활성"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!state.announcements.length ? (
                <div className="rounded-md bg-white p-8 text-center">
                  <div className="text-lg font-black">등록된 공지나 돌발 미션이 없습니다.</div>
                  <p className="mt-2 text-sm text-ink/55">왼쪽 생성 폼에서 첫 안내를 발송하면 이 표에 표시됩니다.</p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
