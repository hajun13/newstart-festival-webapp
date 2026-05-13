"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { THEME_LABELS } from "@/lib/scoring/code-pieces";
import { formatScore } from "@/lib/utils";
import { clearActiveTeam, getActiveTeamId, getTeamProgress, loadState, syncStateFromServer, usesRemoteState } from "@/lib/state";
import type { AppState, Team } from "@/lib/types";
import { Compass, KeyRound, LogOut, Map, Ticket, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const teamId = getActiveTeamId();
      if (!teamId) {
        router.replace("/login");
        return;
      }
      const cached = loadState();
      const cachedTeam = cached.teams.find((item) => item.id === teamId);
      if (cachedTeam) {
        setState(cached);
        setTeam(cachedTeam);
      }
      const next = usesRemoteState()
        ? await syncStateFromServer().catch(() => cached)
        : cached;
      if (!active) return;
      const nextTeam = next.teams.find((item) => item.id === teamId);
      if (!nextTeam) {
        clearActiveTeam();
        setState(null);
        setTeam(null);
        router.replace("/login");
        return;
      }
      setState(next);
      setTeam(nextTeam);
    }
    void hydrate();
    const sync = () => {
      const teamId = getActiveTeamId();
      if (!teamId) {
        clearActiveTeam();
        setState(null);
        setTeam(null);
        router.replace("/login");
        return;
      }
      const next = loadState();
      const nextTeam = next.teams.find((item) => item.id === teamId);
      if (!nextTeam) {
        clearActiveTeam();
        setState(null);
        setTeam(null);
        router.replace("/login");
        return;
      }
      setState(next);
      setTeam(nextTeam);
    };
    window.addEventListener("newstart-state", sync);
    return () => {
      active = false;
      window.removeEventListener("newstart-state", sync);
    };
  }, [router]);

  if (!state || !team) return null;
  const progress = getTeamProgress(state, team.id);
  const activeAnnouncements = state.announcements.filter((item) => item.isActive);

  return (
    <AppShell>
      <div className="grid gap-4 pb-20 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <div className="relative overflow-hidden rounded-md border-2 border-ink bg-night p-5 text-paper shadow-cut">
            <div className="paper-grain absolute inset-0 opacity-10" />
            <p className="relative text-sm font-black text-citrus">{team.name}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div className="relative">
                <p className="mb-2 text-xs font-black tracking-[0.18em] text-paper/55">CURRENT SCORE</p>
                <h1 className="text-4xl font-black">{formatScore(progress.score)}</h1>
                <p className="mt-1 text-paper/70">
                  테마 {progress.clearedThemes.length}/8 · 미션 {progress.completedMissionCodes.length}/16
                </p>
              </div>
              <div className="relative rounded-md border-2 border-ink bg-citrus px-4 py-3 text-center text-ink shadow-[5px_5px_0_rgba(0,0,0,0.24)]">
                <Ticket className="mx-auto mb-1" size={22} />
                <div className="text-2xl font-black">{progress.tickets}장</div>
              </div>
            </div>
          </div>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-black tracking-[0.16em] text-clay">
                  <Compass size={14} /> LIFE KEY
                </p>
                <h2 className="text-xl font-black">생명의 열쇠</h2>
                <p className="text-sm text-ink/60">테마를 클리어할 때마다 마지막 장소 단서가 열립니다.</p>
              </div>
              {progress.isNewstartComplete ? <Trophy className="text-coral" /> : null}
            </div>
            <div className="mt-4 grid grid-cols-8 gap-2">
              {progress.codePieces.map((piece, index) => (
                <div
                  key={`${piece}-${index}`}
                  className="aspect-square rounded-md border-2 border-ink/15 bg-paper text-center text-2xl font-black leading-[3rem] shadow-[3px_3px_0_rgba(21,23,19,0.1)] sm:leading-[4rem]"
                >
                  {piece}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border-2 border-ink bg-moss px-4 py-3 text-center text-xl font-black text-paper">
              {progress.lifeKey}
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(THEME_LABELS).map(([theme, label]) => {
              const cleared = progress.clearedThemes.includes(theme as never);
              return (
                <Card key={theme} className={cleared ? "border-moss bg-moss/10" : "bg-linen/80"}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{label}</span>
                    <span className={cleared ? "text-moss" : "text-ink/40"}>
                      {cleared ? "클리어" : "대기"}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <Link href="/code">
            <Button className="w-full">
              <KeyRound size={18} /> 미션 코드 입력
            </Button>
          </Link>
          <Link href="/final">
            <Button variant="secondary" className="w-full">
              {progress.isNewstartComplete ? <Trophy size={18} /> : <Map size={18} />}
              {progress.isNewstartComplete ? "최종 장소 인증" : "마지막 장소 잠김"}
            </Button>
          </Link>
          <Card>
            <h2 className="font-black">공지사항</h2>
            <div className="mt-3 space-y-3">
              {activeAnnouncements.map((item) => (
                <div key={item.id} className="rounded-md bg-paper p-3">
                  <div className="font-bold">{item.title}</div>
                  <p className="mt-1 text-sm text-ink/70">{item.body}</p>
                  {item.announcementType === "challenge" ? (
                    <span className="mt-2 inline-block rounded-md bg-coral px-2 py-1 text-xs font-bold text-white">
                      돌발 미션 {item.points ?? 0}점
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-black">보너스 상태</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>완주 보너스: {progress.isNewstartComplete ? "100점 반영" : "대기"}</li>
              <li>올클리어 보너스: {progress.isAllClear ? "200점 반영" : "대기"}</li>
              <li>히든 코드 점수 인정: {progress.easterAwardedCount}/3</li>
              <li>최종 인증: {progress.finalVerified ? "완료" : "미완료"}</li>
            </ul>
          </Card>
          <Button
            variant="quiet"
            className="w-full"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
              clearActiveTeam();
              router.push("/login");
            }}
          >
            <LogOut size={16} /> 로그아웃
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
