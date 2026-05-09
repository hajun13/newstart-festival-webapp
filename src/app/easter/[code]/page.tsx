"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  claimEasterEgg,
  getActiveTeamId,
  loadState,
  saveState,
  syncStateFromServer,
  usesRemoteState
} from "@/lib/state";
import { Gift } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function EasterPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function claim() {
    const teamId = getActiveTeamId();
    if (!teamId) {
      router.push("/login");
      return;
    }
    try {
      if (usesRemoteState()) {
        const response = await fetch(`/api/easter/${params.code}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId })
        });
        const result = (await response.json()) as { ok: boolean; message?: string };
        if (!response.ok || !result.ok) {
          setMessage(result.message ?? "히든 코드 처리 실패");
          return;
        }
        await syncStateFromServer();
        setMessage(result.message ?? "히든 코드가 반영되었습니다.");
      } else {
        const result = claimEasterEgg(loadState(), teamId, params.code);
        saveState(result.state);
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "히든 코드 처리 실패");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pb-20">
        <Card>
          <Gift className="mb-4 text-coral" size={40} />
          <h1 className="text-2xl font-black">숨겨진 축복 코드</h1>
          <p className="mt-2 text-ink/70">
            같은 코드는 팀당 1회만 인정되며, 점수 지급은 팀당 최대 3개까지입니다.
          </p>
          {message ? <p className="mt-4 rounded-md bg-citrus/30 p-3 font-bold">{message}</p> : null}
          <div className="mt-5 flex gap-2">
            <Button onClick={claim}>코드 인증하기</Button>
            <Button variant="secondary" onClick={() => router.push("/dashboard")}>
              대시보드
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
