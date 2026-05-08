"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { findMissionByCode, getActiveTeamId, loadState } from "@/lib/state";
import { ArrowRight, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CodePage() {
  const router = useRouter();
  const [code, setCode] = useState("NUT-30");
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
        <Card>
          <QrCode className="mb-4 text-moss" size={32} />
          <h1 className="text-2xl font-black">미션 코드 입력</h1>
          <p className="mt-2 text-sm text-ink/65">
            현장 안내판의 코드를 입력하세요. 히든 QR은 `EGG-01` 형식으로 처리됩니다.
          </p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="off"
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
