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

function missionStatusLabel(status?: string) {
  if (status === "approved") return "완료";
  if (status === "pending_review" || status === "submitted") return "검토 필요";
  return "미참여";
}

function missionStatusClass(status?: string) {
  if (status === "approved") return "border-moss bg-moss text-paper";
  if (status === "pending_review" || status === "submitted") return "border-coral bg-coral text-white";
  return "border-ink/10 bg-paper text-ink/45";
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("newstart-admin-session") === "true";
  });
  const [checkingSession, setCheckingSession] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("newstart-admin-session") !== "true";
  });
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
        setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [router]);

  const [state] = useAdminState();
  const rows = buildTeamRows(state);
  const stats = useMemo(() => {
    const pending = state.submissions.filter((item) => ["pending_review", "submitted"].includes(item.status)).length;
    const completed = rows.filter((row) => row.progress.isNewstartComplete).length;
    const final = rows.filter((row) => row.progress.finalVerified).length;
    const average = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + row.progress.score, 0) / rows.length)
      : 0;
    return { pending, completed, final, average };
  }, [rows, state.submissions]);
  const scoreRows = [...rows].sort((a, b) => b.progress.score - a.progress.score);

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

  if (checkingSession) {
    return (
      <AppShell mode="admin">
        <div className="mx-auto max-w-md">
          <Card>
            <h1 className="text-2xl font-black">운영자 확인 중</h1>
            <p className="mt-2 text-sm text-ink/65">이미 로그인되어 있는지 확인하고 있습니다.</p>
          </Card>
        </div>
      </AppShell>
    );
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
          <p className="text-xs font-black tracking-[0.18em] text-citrus">운영본부</p>
          <h1 className="mt-2 text-3xl font-black">진행 상황 한눈에 보기</h1>
          <p className="mt-1 text-sm text-paper/70">노트북에서 팀별 점수, 제출 검토, 미션 참여 상태를 빠르게 확인합니다.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["전체 팀", state.teams.length],
            ["검토 필요 제출", stats.pending],
            ["최종 인증 완료", stats.final],
            ["완주 팀", stats.completed],
            ["평균 점수", formatScore(stats.average)]
          ].map(([label, value]) => (
            <Card key={label as string}>
              <div className="text-xs font-bold text-ink/55">{label}</div>
              <div className="mt-2 text-2xl font-black">{value}</div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">팀별 점수 현황</h2>
              <p className="mt-1 text-sm text-ink/60">운영 중 순위, 추첨권, 미션 완료 수를 한 화면에서 봅니다.</p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/admin/teams")}>
              팀 관리로 이동
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-y-1 text-left text-sm">
              <thead>
                <tr className="text-xs text-ink/55">
                  <th className="rounded-l-md bg-paper px-3 py-2">순위</th>
                  <th className="bg-paper px-3 py-2">팀</th>
                  <th className="bg-paper px-3 py-2 text-right">점수</th>
                  <th className="bg-paper px-3 py-2 text-right">추첨권</th>
                  <th className="bg-paper px-3 py-2 text-right">미션</th>
                  <th className="bg-paper px-3 py-2 text-right">테마</th>
                  <th className="rounded-r-md bg-paper px-3 py-2">최종</th>
                </tr>
              </thead>
              <tbody>
                {scoreRows.map(({ team, progress }, index) => (
                  <tr key={team.id} className="font-bold">
                    <td className="rounded-l-md bg-white px-3 py-2">{index + 1}</td>
                    <td className="bg-white px-3 py-2">{team.teamNumber}번 · {team.name}</td>
                    <td className="bg-white px-3 py-2 text-right">{formatScore(progress.score)}</td>
                    <td className="bg-white px-3 py-2 text-right">{progress.tickets}장</td>
                    <td className="bg-white px-3 py-2 text-right">{progress.completedMissionCodes.length}/{state.missions.length}</td>
                    <td className="bg-white px-3 py-2 text-right">{progress.clearedThemes.length}/8</td>
                    <td className="rounded-r-md bg-white px-3 py-2">{progress.finalVerified ? "완료" : "대기"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">팀별 미션 진행 현황</h2>
              <p className="mt-1 text-sm text-ink/60">팀 행을 따라가며 완료·검토 필요·미참여 상태를 확인합니다.</p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/admin/submissions")}>
              제출 검토로 이동
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1320px] w-full border-separate border-spacing-1 text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 rounded-md bg-white px-3 py-2 text-sm">팀</th>
                  <th className="rounded-md bg-paper px-3 py-2">점수</th>
                  {state.missions.map((mission) => (
                    <th key={mission.id} className="rounded-md bg-paper px-2 py-2 text-center">
                      {mission.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ team, progress }) => (
                  <tr key={team.id}>
                    <th className="sticky left-0 z-10 rounded-md bg-white px-3 py-2 font-black">
                      {team.teamNumber}번 · {team.name}
                    </th>
                    <td className="rounded-md bg-paper px-3 py-2 font-bold">{formatScore(progress.score)}</td>
                    {state.missions.map((mission) => {
                      const submission = state.submissions.find(
                        (item) => item.teamId === team.id && item.missionId === mission.id
                      );
                      return (
                        <td key={mission.id} className="px-1 py-1">
                          <span
                            className={`block rounded-md border px-2 py-1 text-center font-bold ${missionStatusClass(submission?.status)}`}
                            title={`${mission.code} ${mission.title}`}
                          >
                            {missionStatusLabel(submission?.status)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
