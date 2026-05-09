"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { SUBMISSION_TYPE_LABELS } from "@/lib/missions/mission-types";
import {
  findMissionByCode,
  getActiveTeamId,
  loadState,
  saveState,
  submitMission,
  syncStateFromServer,
  usesRemoteState
} from "@/lib/state";
import type { Mission } from "@/lib/types";
import { CheckCircle2, FileImage, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

async function fileToCompressedMarker(file: File): Promise<string> {
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("파일은 4MB 이하만 선택할 수 있습니다. 현장에서는 1MB 이하 압축 업로드를 권장합니다.");
  }
  if (!file.type.startsWith("image/")) return `${file.name}:${file.size}`;
  return `${file.name}:${Math.min(file.size, 1024 * 1024)}:client-compressed`;
}

export default function MissionPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const state = loadState();
    const target = findMissionByCode(state, params.code);
    if (!target) router.replace("/code");
    setMission(target);
  }, [params.code, router]);

  const helper = useMemo(() => mission?.helperItems ?? [], [mission]);

  if (!mission) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mission || busy) return;
    const teamId = getActiveTeamId();
    if (!teamId) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const result = submitMission({
        state: loadState(),
        teamId,
        missionCode: mission.code,
        answerText: text,
        answerJson: { answers },
        filePaths: files
      });
      if (usesRemoteState()) {
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId,
            missionCode: mission.code,
            answerText: text,
            answerJson: { answers },
            filePaths: files
          })
        });
        const remoteResult = (await response.json()) as { ok: boolean; message?: string };
        if (!response.ok || !remoteResult.ok) {
          setMessage(remoteResult.message ?? "제출 중 문제가 발생했습니다.");
          return;
        }
        await syncStateFromServer();
        setMessage(remoteResult.message ?? "제출이 반영되었습니다.");
      } else {
        saveState(result.state);
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "제출 중 문제가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-4 pb-20 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <Card className="relative overflow-hidden bg-linen">
            <div className="festival-ribbon absolute inset-x-0 top-0 h-2" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mt-3 text-sm font-black tracking-[0.12em] text-clay">{mission.themeLabel}</p>
                <h1 className="mt-1 text-3xl font-black leading-tight">{mission.title}</h1>
              </div>
              <span className="mt-3 rounded-md border-2 border-ink bg-citrus px-3 py-2 text-lg font-black shadow-[4px_4px_0_rgba(21,23,19,0.18)]">
                {mission.points}점
              </span>
            </div>
            <p className="mt-4 leading-7 text-ink/75">{mission.description}</p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md border border-ink/10 bg-paper p-3">
                <dt className="font-bold">제출 방식</dt>
                <dd>{SUBMISSION_TYPE_LABELS[mission.type]}</dd>
              </div>
              <div className="rounded-md border border-ink/10 bg-paper p-3">
                <dt className="font-bold">완료 조건</dt>
                <dd>{mission.successCriteria}</dd>
              </div>
              <div className="rounded-md border border-ink/10 bg-paper p-3">
                <dt className="font-bold">장소 힌트</dt>
                <dd>{mission.locationHint}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-xl font-black">인증 제출</h2>
            <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
              {mission.type === "quiz" && mission.quiz ? (
                <div className="space-y-4">
                  {mission.quiz.questions.map((question) => (
                    <fieldset key={question.id} className="rounded-md border-2 border-ink/10 bg-paper/70 p-3">
                      <legend className="px-1 font-bold">{question.prompt}</legend>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        {question.options.map((option) => (
                          <label
                            key={option}
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-ink/10 bg-linen px-3 py-2 hover:border-moss"
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              onChange={() =>
                                setAnswers((current) => ({ ...current, [question.id]: option }))
                              }
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              ) : null}

              {["text", "video_or_text"].includes(mission.type) ? (
                <div>
                  <Textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="답안 또는 인증 문구를 입력하세요."
                  />
                  {helper.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {helper.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="rounded-md bg-citrus/35 px-2 py-1 text-xs font-bold"
                          onClick={() =>
                            setText((current) => `${current}${current ? ", " : ""}${item}`)
                          }
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {mission.type === "video_or_text" ? (
                    <p className="mt-2 text-xs text-ink/60">
                      영상 업로드는 앱에서 기본 지원하지 않습니다. 운영본부 백업 채널에 제출한 뒤 확인 문구를 남기세요.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {["photo", "screenshot"].includes(mission.type) ? (
                <div className="rounded-md border border-dashed border-ink/30 p-4">
                  <div className="mb-3 flex items-center gap-2 font-bold">
                    <FileImage size={18} /> 이미지 업로드
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple={mission.type === "photo"}
                    onChange={async (event) => {
                      const selected = Array.from(event.currentTarget.files ?? []);
                      try {
                        setFiles(await Promise.all(selected.map(fileToCompressedMarker)));
                        setMessage("이미지 압축 정책을 적용했습니다.");
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "파일 처리 실패");
                      }
                    }}
                  />
                  <p className="mt-2 text-xs text-ink/60">
                    클라이언트에서 4MB 초과 파일은 차단하고, 운영 권장 기준은 장당 1MB 이하입니다.
                  </p>
                  {files.length ? <p className="mt-2 text-sm font-bold">{files.length}개 선택됨</p> : null}
                </div>
              ) : null}

              {mission.type === "staff" ? (
                <div className="rounded-md bg-paper p-4">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldCheck size={18} /> 스태프 승인 미션
                  </div>
                  <p className="mt-2 text-sm text-ink/65">
                    제출을 생성한 뒤 현장 스태프가 관리자 화면에서 성공/실패를 처리합니다.
                  </p>
                </div>
              ) : null}

              {message ? (
                <div className="flex items-start gap-2 rounded-md bg-moss/10 p-3 text-sm font-semibold">
                  <CheckCircle2 size={18} className="mt-0.5 text-moss" />
                  <span>{message}</span>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} type="submit">
                  {busy ? "제출 중" : "제출하기"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.push("/dashboard")}>
                  대시보드
                </Button>
              </div>
            </form>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <h2 className="font-black">중복 지급 방지</h2>
            <p className="mt-2 text-sm text-ink/65">
              같은 팀이 같은 미션을 다시 제출해도 승인 점수는 한 번만 반영됩니다.
            </p>
          </Card>
          <Card>
            <h2 className="font-black">현장 백업</h2>
            <p className="mt-2 text-sm text-ink/65">
              사진 업로드 실패 시 카카오톡/구글폼 백업 제출 후 관리자 제출 검토에서 승인할 수 있습니다.
            </p>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
