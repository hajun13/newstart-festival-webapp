"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import { createAnnouncement, saveState, toggleAnnouncement } from "@/lib/state";
import { useState } from "react";

export default function AdminAnnouncementsPage() {
  const [state, setState] = useAdminState();
  const [title, setTitle] = useState("NEWSTART 돌발 미션");
  const [body, setBody] = useState("운영본부 안내에 따라 지정 장소에서 팀 사진을 제출하세요.");
  const [type, setType] = useState<"notice" | "challenge">("notice");
  const [points, setPoints] = useState(30);

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
      <div className="grid gap-4 pb-20 lg:grid-cols-[420px_1fr]">
        <Card>
          <h1 className="text-2xl font-black">공지/돌발 미션 생성</h1>
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} />
            <select className="min-h-11 w-full rounded-md border border-ink/20 px-3" value={type} onChange={(event) => setType(event.target.value as never)}>
              <option value="notice">공지</option>
              <option value="challenge">돌발 미션</option>
            </select>
            {type === "challenge" ? (
              <Input type="number" value={points} onChange={(event) => setPoints(Number(event.target.value))} />
            ) : null}
            <Button className="w-full">발송</Button>
          </form>
        </Card>
        <div className="space-y-3">
          {state.announcements.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-black">{announcement.title}</div>
                  <p className="mt-1 text-sm text-ink/65">{announcement.body}</p>
                  <p className="mt-2 text-xs">
                    {announcement.announcementType} · {announcement.isActive ? "활성" : "비활성"} · {announcement.points ?? 0}점
                  </p>
                </div>
                <Button variant="secondary" onClick={() => mutate(toggleAnnouncement({ state, announcementId: announcement.id, actor: "admin" }))}>
                  {announcement.isActive ? "비활성" : "활성"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
