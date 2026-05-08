"use client";

import { Button } from "@/components/ui/button";
import { getActiveTeamId, getTeamProgress, loadState, requireTeam, syncStateFromServer } from "@/lib/state";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, KeyRound, ShieldCheck, Trophy } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [teamName, setTeamName] = useState<string>("");
  const [tickets, setTickets] = useState<number>(0);

  useEffect(() => {
    function sync() {
      const teamId = getActiveTeamId();
      if (!teamId) return;
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
    window.addEventListener("newstart-state", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("newstart-state", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-black tracking-[0.08em]">
            NEWSTART
          </Link>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            {teamName ? (
              <span className="rounded-md bg-citrus px-2 py-1 font-semibold">
                {teamName} · {tickets}장
              </span>
            ) : null}
            <Link href="/admin">
              <Button variant="quiet" className="min-h-9 px-2" title="관리자">
                <ShieldCheck size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white sm:hidden">
        <div className="grid grid-cols-4">
          <Link className="flex flex-col items-center gap-1 py-2 text-xs" href="/dashboard">
            <Home size={18} /> 홈
          </Link>
          <Link className="flex flex-col items-center gap-1 py-2 text-xs" href="/code">
            <KeyRound size={18} /> 코드
          </Link>
          <Link className="flex flex-col items-center gap-1 py-2 text-xs" href="/final">
            <Trophy size={18} /> 최종
          </Link>
          <Link className="flex flex-col items-center gap-1 py-2 text-xs" href="/admin">
            <ShieldCheck size={18} /> 관리
          </Link>
        </div>
      </nav>
    </div>
  );
}
