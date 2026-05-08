"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadState, saveState, setSubmissionStatus } from "@/lib/state";
import type { SubmissionStatus } from "@/lib/types";
import { useState } from "react";

export default function AdminSubmissionsPage() {
  const [state, setState] = useState(loadState());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SubmissionStatus | "all">("all");

  function mutate(next: typeof state) {
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
    <AppShell>
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
                    {submission.filePaths.length ? <p className="text-xs text-ink/55">파일 {submission.filePaths.length}개</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => mutate(setSubmissionStatus({ state, submissionId: submission.id, status: "approved", reviewedBy: "admin", reviewNote: "관리자 승인" }))}
                    >
                      승인
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => mutate(setSubmissionStatus({ state, submissionId: submission.id, status: "rejected", reviewedBy: "admin", reviewNote: "관리자 반려" }))}
                    >
                      반려
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => mutate(setSubmissionStatus({ state, submissionId: submission.id, status: "cancelled", reviewedBy: "admin", reviewNote: "승인 취소" }))}
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
