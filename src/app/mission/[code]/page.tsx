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
  syncStateFromServer,
  usesRemoteState
} from "@/lib/state";
import type { AppState, Mission } from "@/lib/types";
import { CheckCircle2, FileImage, ShieldCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

async function fileToLocalPreviewPath(file: File): Promise<string> {
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("파일은 4MB 이하만 선택할 수 있습니다. 현장에서는 1MB 이하 압축 업로드를 권장합니다.");
  }
  if (!file.type.startsWith("image/")) return `${file.name}:${file.size}`;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("이미지 미리보기를 만들 수 없습니다."));
    reader.readAsDataURL(file);
  });
}

async function uploadMissionFile(input: { file: File; teamId: string; missionCode: string }) {
  const formData = new FormData();
  formData.set("teamId", input.teamId);
  formData.set("missionCode", input.missionCode);
  formData.set("file", input.file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData
  });
  const result = (await response.json()) as { ok: boolean; path?: string; message?: string };
  if (!response.ok || !result.ok || !result.path) {
    throw new Error(result.message ?? "파일 업로드 실패");
  }
  return result.path;
}

export default function MissionPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [receivedPrayer, setReceivedPrayer] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const state = loadState();
    const target = findMissionByCode(state, params.code);
    if (!target) router.replace("/code");
    setMission(target);
    if (target?.code === "RST-55") {
      const teamId = getActiveTeamId();
      const candidates = state.submissions
        .filter((submission) => submission.missionId === target.id && submission.teamId !== teamId && submission.answerText?.trim())
        .map((submission) => submission.answerText!.trim());
      setReceivedPrayer(candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : "");
    }
  }, [params.code, router]);

  const helper = useMemo(() => mission?.helperItems ?? [], [mission]);
  const textPlaceholder = mission?.code === "TMP-50"
    ? "예: 팀 전원 3분 절제 영상을 카카오톡으로 이한빛 전도사에게 보냈습니다."
    : mission?.code === "RST-55"
      ? "개인 이름 없이 우리 팀의 고민/기도 제목을 적어 주세요."
      : "답안 또는 인증 문구를 입력하세요.";

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
      if (["photo", "screenshot"].includes(mission.type) && files.length === 0) {
        setMessage("이미지를 선택한 뒤 제출해 주세요.");
        return;
      }
      const filePaths = usesRemoteState()
        ? await Promise.all(files.map((file) => uploadMissionFile({ file, teamId, missionCode: mission.code })))
        : await Promise.all(files.map(fileToLocalPreviewPath));
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          missionCode: mission.code,
          answerText: text,
          answerJson: { answers },
          filePaths
        })
      });
      const result = (await response.json()) as { ok: boolean; message?: string; state?: AppState };
      if (!response.ok || !result.ok) {
        setMessage(result.message ?? "제출 중 문제가 발생했습니다.");
        return;
      }
      if (result.state) {
        saveState(result.state);
      } else if (usesRemoteState()) {
        await syncStateFromServer();
      }
      setMessage(result.message ?? "제출이 반영되었습니다.");
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
                    placeholder={textPlaceholder}
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
                    <div className="mt-3 rounded-md bg-paper p-3 text-sm leading-6 text-ink/70">
                      <p className="font-bold text-ink">영상 제출 안내</p>
                      <p>절제의 3분 영상은 카카오톡으로 이한빛 전도사에게 보내고, 앱에는 전송 완료 문구를 남기세요.</p>
                    </div>
                  ) : null}
                  {mission.code === "RST-55" ? (
                    <div className="mt-3 rounded-md bg-paper p-3 text-sm leading-6 text-ink/70">
                      <p className="font-bold text-ink">개인정보 주의</p>
                      <p>개인 이름, 연락처, 민감한 신상 정보는 적지 마세요.</p>
                      <div className="mt-3 rounded-md bg-white p-3">
                        <p className="text-xs font-black text-clay">함께 기도할 제목</p>
                        <p className="mt-1 font-semibold">
                          {receivedPrayer || "아직 다른 팀의 기도 제목이 없습니다. 먼저 작성하고 1분간 함께 기도해 주세요."}
                        </p>
                      </div>
                    </div>
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
                    multiple={mission.type === "photo" || mission.code === "EXE-80"}
                    onChange={async (event) => {
                      const selected = Array.from(event.currentTarget.files ?? []);
                      const oversized = selected.find((file) => file.size > 4 * 1024 * 1024);
                      if (oversized) {
                        setFiles([]);
                        setMessage("파일은 4MB 이하만 선택할 수 있습니다.");
                        return;
                      }
                      setFiles(selected);
                      setMessage("이미지를 선택했습니다. 제출 시 운영 서버에 업로드됩니다.");
                    }}
                  />
                  <p className="mt-2 text-xs text-ink/60">
                    4MB 초과 파일은 차단합니다. 제출 후 관리자가 원본 이미지를 확인할 수 있습니다.
                  </p>
                  {files.length ? <p className="mt-2 text-sm font-bold">{files.length}개 선택됨</p> : null}
                  {helper.length ? (
                    <div className="mt-4 rounded-md bg-paper p-3">
                      <div className="text-xs font-black text-clay">제출 전 체크</div>
                      <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                        {helper.map((item) => (
                          <li key={item} className="rounded-md bg-white px-3 py-2 font-semibold">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
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
