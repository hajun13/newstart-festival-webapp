"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { findMissionByCode, getActiveTeamId, loadState } from "@/lib/state";
import { ArrowRight, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!getActiveTeamId()) {
      router.push("/login");
      return;
    }
    const normalized = code.trim().toUpperCase();
    const state = loadState();
    if (normalized.startsWith("EGG-")) {
      router.push(`/easter/${normalized}`);
      return;
    }
    const mission = findMissionByCode(state, normalized);
    if (!mission) {
      setMessage("미션 코드를 찾을 수 없습니다.");
      return;
    }
    router.push(`/mission/${mission.code}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl pb-20">
        <Card className="relative overflow-hidden">
          <div className="festival-ribbon absolute inset-x-0 top-0 h-2" />
          <KeyRound className="mb-4 mt-3 text-moss" size={34} />
          <h1 className="text-2xl font-black">미션 코드 입력</h1>
          <p className="mt-2 text-sm text-ink/65">
            현장 안내판에 표시된 미션 코드를 입력하세요. 히든 코드는 별도 보너스로 처리됩니다.
          </p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="off"
              placeholder="예: NUT-30"
              className="text-center text-2xl font-black uppercase tracking-widest"
            />
            {message ? <p className="text-sm font-semibold text-coral">{message}</p> : null}
            <Button className="w-full" type="submit">
              미션 열기 <ArrowRight size={18} />
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
