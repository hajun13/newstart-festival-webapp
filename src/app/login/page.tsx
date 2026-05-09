"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginTeam, loadState, resetState, setActiveTeam, usesRemoteState } from "@/lib/state";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const isRemoteMode = usesRemoteState();
  const [code, setCode] = useState(isRemoteMode ? "" : "TEAM-01-KEY");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isRemoteMode) {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const result = (await response.json()) as { ok: boolean; team?: { id: string }; message?: string };
      if (!response.ok || !result.team) {
        setMessage(result.message ?? "팀 코드를 확인해 주세요.");
        return;
      }
      setActiveTeam(result.team.id);
      router.push("/dashboard");
      return;
    }
    const team = loginTeam(loadState(), code);
    if (!team) {
      setMessage("팀 코드를 확인해 주세요.");
      return;
    }
    setActiveTeam(team.id);
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-paper text-ink lg:grid-cols-[1.05fr_0.95fr]">
      <section className="scanline flex min-h-[42vh] flex-col justify-between bg-ink p-6 text-paper lg:min-h-screen lg:p-10">
        <div className="text-sm font-bold tracking-[0.22em] text-citrus">
          2026 NEWSTART FESTIVAL
        </div>
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-citrus">생명의 열쇠를 찾아라</p>
          <h1 className="text-5xl font-black leading-none sm:text-7xl">
            홍명기홀로
            <br />
            오라!
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-paper/80">
            삼육대학교 캠퍼스 전체를 움직이는 팀 기반 NEWSTART 퀘스트 운영 화면입니다.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-ink">
          {["Nutrition", "Exercise", "Water", "Trust"].map((item) => (
            <span key={item} className="rounded-md bg-citrus px-2 py-2">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-black">팀 코드 로그인</h2>
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
              로그인 <ArrowRight size={18} />
            </Button>
          </form>
          {!isRemoteMode ? (
            <Button
              type="button"
              variant="quiet"
              className="mt-3 w-full"
              onClick={() => {
                resetState();
                setMessage("테스트 데이터가 초기화되었습니다.");
              }}
            >
              <RotateCcw size={16} /> 로컬 테스트 데이터 초기화
            </Button>
          ) : null}
          <div className="mt-6 rounded-md border border-ink/10 bg-citrus/20 p-3 text-xs leading-5">
            운영 모드에서는 Supabase seed에 생성된 팀 코드를 사용합니다. 이메일/문자 인증은 사용하지 않습니다.
          </div>
        </Card>
      </section>
    </main>
  );
}
