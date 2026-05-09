"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import { saveState, setSubmissionStatus, syncStateFromServer, usesRemoteState } from "@/lib/state";
import type { SubmissionStatus } from "@/lib/types";
import { useState } from "react";

function isStorageImagePath(path: string) {
  return path.startsWith("mission-submissions/");
}

export default function AdminSubmissionsPage() {
  const [state, setState] = useAdminState();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SubmissionStatus | "all">("all");

  async function mutate(submissionId: string, nextStatus: Extract<SubmissionStatus, "approved" | "rejected" | "cancelled">) {
    if (usesRemoteState()) {
      const response = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          status: nextStatus,
          reviewedBy: "admin"
        })
      });
      if (!response.ok) return;
      setState(await syncStateFromServer());
      return;
    }
    const next = setSubmissionStatus({
        state,
        submissionId,
        status: nextStatus,
        reviewedBy: "admin",
        reviewNote: nextStatus === "approved" ? "관리자 승인" : nextStatus === "rejected" ? "관리자 반려" : "승인 취소"
      });
    saveState(next);
    setState(next);
  }

  const rows = state.submissions.filter((submission) => {
    const team = state.teams.find((item) => item.id === submission.teamId);
    const mission = state.missions.find((item) => item.id === submission.missionId);
    const text = `${team?.name} ${team?.teamNumber} ${mission?.code} ${mission?.title}`;
    return text.includes(query) && (status === "all" || submission.status === status);
  });

  return (
    <AppShell mode="admin">
      <AdminNav />
      <div className="space-y-4 pb-20">
        <h1 className="text-3xl font-black">제출 검토</h1>
        <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
          <Input placeholder="팀/미션 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="rounded-md border border-ink/20 px-3" value={status} onChange={(event) => setStatus(event.target.value as never)}>
            <option value="all">전체 상태</option>
            <option value="pending_review">승인 대기</option>
            <option value="approved">승인</option>
            <option value="rejected">반려</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
        <div className="space-y-3">
          {rows.map((submission) => {
            const team = state.teams.find((item) => item.id === submission.teamId);
            const mission = state.missions.find((item) => item.id === submission.missionId);
            return (
              <Card key={submission.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-black">{team?.name} · {mission?.code}</div>
                    <p className="text-sm text-ink/65">{mission?.title} · {submission.status} · {submission.awardedPoints}점</p>
                    <p className="mt-2 text-sm">{submission.answerText}</p>
                    {submission.filePaths.length ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {submission.filePaths.map((path, index) =>
                          isStorageImagePath(path) ? (
                            <a
                              key={`${submission.id}-${path}`}
                              href={`/api/admin/files?path=${encodeURIComponent(path)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-md border border-ink/15 bg-paper p-2 text-xs font-bold hover:border-moss"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/admin/files?path=${encodeURIComponent(path)}`}
                                alt={`${team?.name ?? "팀"} 제출 이미지 ${index + 1}`}
                                className="mb-2 aspect-video w-full rounded object-cover"
                              />
                              원본 보기 {index + 1}
                            </a>
                          ) : (
                            <div
                              key={`${submission.id}-${path}`}
                              className="rounded-md border border-ink/15 bg-paper p-3 text-xs font-bold text-ink/60"
                            >
                              이전 임시 제출 파일 {index + 1}
                            </div>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => mutate(submission.id, "approved")}
                    >
                      승인
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => mutate(submission.id, "rejected")}
                    >
                      반려
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => mutate(submission.id, "cancelled")}
                    >
                      승인 취소
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
