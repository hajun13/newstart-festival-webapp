"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { findMissionByCode, getActiveTeamId, loadState } from "@/lib/state";
import { ArrowRight, KeyRound, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DIRECT_MISSION_CODES = ["EXE-50", "EXE-80", "SUN-50", "TMP-50", "RST-55"];

export default function CodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const state = loadState();
  const directMissions = DIRECT_MISSION_CODES
    .map((missionCode) => findMissionByCode(state, missionCode))
    .filter(Boolean);

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
            안내판 코드가 있는 미션은 코드를 입력하고, 캠퍼스 전체에서 진행하는 미션은 아래에서 바로 시작하세요.
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

        <Card className="mt-4">
          <div className="flex items-center gap-2">
            <MapPinned size={20} className="text-clay" />
            <h2 className="text-lg font-black">장소 코드 없이 바로 시작</h2>
          </div>
          <p className="mt-2 text-sm text-ink/60">
            캠퍼스 전체, 분산형, 영상 백업형 미션은 현장 코드판을 찾지 않아도 됩니다.
          </p>
          <div className="mt-4 grid gap-2">
            {directMissions.map((mission) => (
              <button
                key={mission!.id}
                type="button"
                className="rounded-md border-2 border-ink/10 bg-white p-3 text-left transition hover:border-moss"
                onClick={() => {
                  if (!getActiveTeamId()) {
                    router.push("/login");
                    return;
                  }
                  router.push(`/mission/${mission!.code}`);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-clay">{mission!.code} · {mission!.themeLabel}</div>
                    <div className="mt-1 font-black">{mission!.title}</div>
                  </div>
                  <div className="shrink-0 rounded-md bg-citrus px-2 py-1 text-sm font-black">{mission!.points}점</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
