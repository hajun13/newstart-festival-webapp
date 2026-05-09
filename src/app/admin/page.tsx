"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import { buildTeamRows, setAdminSession, syncStateFromServer } from "@/lib/state";
import { formatScore } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((result: { ok: boolean }) => {
        if (result.ok) syncStateFromServer().catch(() => undefined);
        if (result.ok) {
          setActive(true);
          setAdminSession(true);
          const next = new URLSearchParams(window.location.search).get("next");
          if (next?.startsWith("/admin/")) router.replace(next);
        }
      })
      .catch(() => undefined);
  }, [router]);

  const [state] = useAdminState();
  const rows = buildTeamRows(state);
  const stats = useMemo(() => {
    const pending = state.submissions.filter((item) => item.status === "pending_review").length;
    const completed = rows.filter((row) => row.progress.isNewstartComplete).length;
    const final = rows.filter((row) => row.progress.finalVerified).length;
    const average = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + row.progress.score, 0) / rows.length)
      : 0;
    return { pending, completed, final, average };
  }, [rows, state.submissions]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    if (!response.ok || !result.ok) {
      setMessage(result.message ?? "관리자 비밀번호를 확인해 주세요.");
      setBusy(false);
      return;
    }
    setAdminSession(true);
    setActive(true);
    await syncStateFromServer().catch(() => undefined);
    const next = new URLSearchParams(window.location.search).get("next");
    if (next?.startsWith("/admin/")) router.replace(next);
    setBusy(false);
  }

  if (!active) {
    return (
      <AppShell mode="admin">
        <div className="mx-auto max-w-md">
          <Card>
            <h1 className="text-2xl font-black">관리자 로그인</h1>
            <form className="mt-5 space-y-4" onSubmit={login}>
              <label className="block text-sm font-black" htmlFor="admin-password">
                관리자 비밀번호
              </label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                autoFocus
                placeholder="운영본부 비밀번호"
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
              />
              {message ? <p className="text-sm font-bold text-coral">{message}</p> : null}
              <Button className="w-full" disabled={busy}>
                {busy ? "확인 중" : "관리자 진입"}
              </Button>
            </form>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell mode="admin">
      <AdminNav />
      <div className="space-y-5 pb-20">
        <div className="rounded-md border-2 border-ink bg-night p-5 text-paper shadow-cut">
          <p className="text-xs font-black tracking-[0.18em] text-citrus">FESTIVAL CONTROL</p>
          <h1 className="mt-2 text-3xl font-black">운영본부 대시보드</h1>
          <p className="mt-1 text-sm text-paper/70">실시간 운영 DB를 읽고, 승인/점수 변경은 관리자 인증 쿠키로만 저장됩니다.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["전체 팀", state.teams.length],
            ["전체 제출", state.submissions.length],
            ["승인 대기", stats.pending],
            ["평균 점수", formatScore(stats.average)],
            ["완주 팀", stats.completed],
            ["최종 인증", stats.final]
          ].map(([label, value]) => (
            <Card key={label as string}>
              <div className="text-xs font-bold text-ink/55">{label}</div>
              <div className="mt-2 text-2xl font-black">{value}</div>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="font-black">미션별 제출 현황</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {state.missions.map((mission) => {
              const count = state.submissions.filter((item) => item.missionId === mission.id).length;
              const approved = state.submissions.filter(
                (item) => item.missionId === mission.id && item.status === "approved"
              ).length;
              return (
                <div key={mission.id} className="flex items-center justify-between rounded-md bg-paper p-3 text-sm">
                  <span className="font-bold">{mission.code} {mission.title}</span>
                  <span>{approved}/{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
