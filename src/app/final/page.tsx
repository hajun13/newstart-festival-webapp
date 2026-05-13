"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { THEME_LABELS } from "@/lib/scoring/code-pieces";
import {
  getActiveTeamId,
  getTeamProgress,
  loadState,
  saveState,
  clearActiveTeam,
  syncStateFromServer,
  usesRemoteState,
  verifyFinal
} from "@/lib/state";
import type { AppState } from "@/lib/types";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FinalPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [message, setMessage] = useState("");
  const progress =
    state && teamId && state.teams.some((team) => team.id === teamId)
      ? getTeamProgress(state, teamId)
      : null;

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const active = getActiveTeamId();
      if (!active) {
        router.replace("/login");
        return;
      }
      const next = usesRemoteState()
        ? await syncStateFromServer().catch(() => loadState())
        : loadState();
      if (!mounted) return;
      if (!next.teams.some((team) => team.id === active)) {
        clearActiveTeam();
        router.replace("/login");
        return;
      }
      setTeamId(active);
      setState(next);
    }
    void hydrate();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function submit() {
    if (!teamId) return;
    if (usesRemoteState()) {
      const response = await fetch("/api/final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId })
      });
      const result = (await response.json()) as { ok: boolean; message?: string };
      setState(await syncStateFromServer());
      setMessage(result.message ?? (response.ok ? "최종 인증이 반영되었습니다." : "아직 열리지 않았습니다."));
      return;
    }
    const result = verifyFinal(loadState(), teamId);
    saveState(result.state);
    setState(result.state);
    setMessage(result.message);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl pb-20">
        <Card>
          <Trophy className="mb-4 text-coral" size={40} />
          <h1 className="text-3xl font-black">
            {progress?.isNewstartComplete ? "최종 장소 인증" : "마지막 장소는 아직 잠겨 있습니다"}
          </h1>
          <p className="mt-3 text-ink/70">
            8개 테마를 모두 클리어한 팀만 최종 장소 인증이 성공합니다. 성공 시 추첨권 2장이 추가되며 팀당 1회만 인정됩니다.
          </p>
          {progress ? (
            <div className="mt-5 rounded-md bg-paper p-4">
              <div className="text-xl font-black">{progress.lifeKey}</div>
              <p className="mt-1 text-sm text-ink/65">
                클리어 {progress.clearedThemes.length}/8 · 현재 추첨권 {progress.tickets}장
              </p>
              {progress.missingThemes.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {progress.missingThemes.map((theme) => (
                    <span key={theme} className="rounded-md bg-white px-2 py-1 text-xs font-bold">
                      남은 테마: {THEME_LABELS[theme]}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {message ? <p className="mt-4 rounded-md bg-citrus/30 p-3 font-bold">{message}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={submit}>
              {progress?.isNewstartComplete ? "최종 인증 처리" : "잠금 확인"}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/dashboard")}>
              대시보드
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
