"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetState, saveState, setActiveTeam, syncStateFromServer, usesRemoteState } from "@/lib/state";
import type { AppState } from "@/lib/types";
import { ArrowRight, LockKeyhole, MapPinned, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const isRemoteMode = usesRemoteState();
  const [code, setCode] = useState(isRemoteMode ? "" : "TEAM-01-KEY");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    const result = (await response.json()) as {
      ok: boolean;
      team?: { id: string; name: string };
      message?: string;
    };
    if (!response.ok || !result.team) {
      setMessage(result.message ?? "팀 코드를 확인해 주세요. 하이픈은 빼고 입력해도 됩니다.");
      return;
    }
    setActiveTeam(result.team.id, result.team.name);
    if (usesRemoteState()) {
      await syncStateFromServer();
    }
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-paper text-ink lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative flex min-h-[46vh] flex-col justify-between overflow-hidden bg-night p-6 text-paper lg:min-h-screen lg:p-10">
        <div className="paper-grain absolute inset-0 opacity-10" />
        <div className="festival-ribbon absolute inset-x-0 top-0 h-3" />
        <div className="relative text-sm font-black tracking-[0.24em] text-citrus">
          2026 서중한합회 청소년 페스티벌
        </div>
        <div className="relative max-w-2xl">
          <p className="mb-4 inline-flex rounded-full border border-citrus/40 px-3 py-1 text-xs font-black tracking-[0.18em] text-citrus">
            NEWSTART FIELD QUEST
          </p>
          <h1 className="text-5xl font-black leading-[0.95] sm:text-7xl">
            생명의 열쇠를
            <br />
            찾아라
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-paper/78">
            팀 코드로 입장해 캠퍼스 미션, 히든 코드, 스태프 챌린지를 해결하세요.
            최종 목적지는 모든 테마를 열었을 때 공개됩니다.
          </p>
        </div>
        <div className="relative grid grid-cols-4 gap-2 text-center text-xs font-black text-ink">
          {["Nutrition", "Water", "Air", "Trust"].map((item) => (
            <span key={item} className="rounded-md bg-citrus px-2 py-2 shadow-[3px_3px_0_rgba(0,0,0,0.28)]">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="mb-6">
            <div className="mb-3 inline-flex rounded-full bg-pool px-3 py-1 text-xs font-black tracking-[0.16em] text-white">
              TEAM ENTRY
            </div>
            <h2 className="text-2xl font-black">팀 코드 입장</h2>
            <p className="mt-2 text-sm text-ink/65">
              팀장 1명이 대표로 로그인합니다. 현장에서 배부받은 팀 코드를 입력해 주세요.
            </p>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm font-bold" htmlFor="team-code">
              팀 코드
            </label>
            <Input
              id="team-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="off"
            />
            {message ? <p className="text-sm font-semibold text-coral">{message}</p> : null}
            <Button className="w-full" type="submit">
              게임 시작 <ArrowRight size={18} />
            </Button>
          </form>
          {!isRemoteMode ? (
            <Button
              type="button"
              variant="quiet"
              className="mt-3 w-full"
              onClick={async () => {
                const local = resetState();
                const response = await fetch("/api/mock/reset", { method: "POST" }).catch(() => null);
                const result = response ? ((await response.json()) as { ok: boolean; state?: AppState }) : null;
                saveState(result?.state ?? local);
                setMessage("테스트 데이터가 초기화되었습니다.");
              }}
            >
              <RotateCcw size={16} /> 로컬 테스트 데이터 초기화
            </Button>
          ) : null}
          <div className="mt-6 rounded-md border border-ink/10 bg-citrus/20 p-3 text-xs leading-5">
            <div className="flex items-start gap-2">
              <MapPinned size={16} className="mt-0.5 shrink-0" />
              <span>최종 장소는 게임 진행 중 획득한 열쇠 조각으로만 확인합니다.</span>
            </div>
          </div>
          <Link href="/admin" className="mt-3 block">
            <Button type="button" variant="quiet" className="w-full">
              <ShieldCheck size={16} /> 운영자 로그인
            </Button>
          </Link>
          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-ink/45">
            <LockKeyhole size={12} /> 참가자 화면과 운영자 화면은 분리됩니다.
          </div>
        </Card>
      </section>
    </main>
  );
}
