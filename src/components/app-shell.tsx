"use client";

import { Button } from "@/components/ui/button";
import {
  getActiveTeamId,
  getActiveTeamName,
  getTeamProgress,
  hasAdminSession,
  loadState,
  requireTeam,
  setAdminSession,
  syncStateFromServer
} from "@/lib/state";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, KeyRound, LogOut, Trophy } from "lucide-react";

export function AppShell({
  children,
  mode = "participant"
}: {
  children: React.ReactNode;
  mode?: "participant" | "admin";
}) {
  const [teamName, setTeamName] = useState<string>("");
  const [tickets, setTickets] = useState<number>(0);
  const [adminActive, setAdminActive] = useState(false);

  useEffect(() => {
    function sync() {
      const teamId = getActiveTeamId();
      if (!teamId) {
        setTeamName("");
        setTickets(0);
        return;
      }
      const cachedTeamName = getActiveTeamName();
      if (cachedTeamName) setTeamName(cachedTeamName);
      const state = loadState();
      try {
        setTeamName(requireTeam(state, teamId).name);
        setTickets(getTeamProgress(state, teamId).tickets);
      } catch {
        setTeamName("");
      }
    }
    sync();
    syncStateFromServer().catch(() => undefined);
    if (mode === "admin") {
      setAdminActive(hasAdminSession());
      fetch("/api/admin/session", { cache: "no-store" })
        .then((response) => response.json())
        .then((result: { ok: boolean }) => {
          setAdminActive(result.ok);
          setAdminSession(result.ok);
        })
        .catch(() => {
          setAdminActive(false);
          setAdminSession(false);
        });
    }
    window.addEventListener("newstart-state", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("newstart-state", sync);
      window.removeEventListener("storage", sync);
    };
  }, [mode]);

  async function logoutAdmin() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setAdminSession(false);
    setAdminActive(false);
    window.location.assign("/admin");
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="festival-ribbon h-2" />
      <header className="sticky top-0 z-40 border-b-2 border-ink/15 bg-paper/95 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between px-4 py-3 ${mode === "admin" ? "max-w-[1680px] lg:px-6" : "max-w-6xl"}`}>
          <Link href={mode === "admin" ? "/admin" : "/dashboard"} className="leading-tight">
            <span className="block text-[10px] font-black tracking-[0.28em] text-clay">
              2026 서중한합회
            </span>
            <span className="text-base font-black tracking-[0.08em]">청소년 페스티벌</span>
          </Link>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            {mode === "participant" && teamName ? (
              <span className="rounded-md border border-ink/15 bg-citrus px-2 py-1 font-black">
                {teamName} · {tickets}장
              </span>
            ) : null}
            {mode === "admin" ? (
              <>
                <Link href="/login">
                  <Button variant="secondary" className="min-h-9 px-3 text-xs">
                    참가자 홈
                  </Button>
                </Link>
                {adminActive ? (
                  <Button variant="quiet" className="min-h-9 px-3 text-xs" onClick={logoutAdmin}>
                    <LogOut size={16} /> 로그아웃
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 py-6 ${mode === "admin" ? "max-w-[1680px] lg:px-6" : "max-w-6xl"}`}>{children}</main>
      {mode === "participant" ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white sm:hidden">
          <div className="grid grid-cols-3">
            <Link className="flex flex-col items-center gap-1 py-2 text-xs" href="/dashboard">
              <Home size={18} /> 홈
            </Link>
            <Link className="flex flex-col items-center gap-1 py-2 text-xs" href="/code">
              <KeyRound size={18} /> 코드
            </Link>
            <Link className="flex flex-col items-center gap-1 py-2 text-xs" href="/final">
              <Trophy size={18} /> 최종
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
