"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import { saveState, setSubmissionStatus, syncStateFromServer, usesRemoteState } from "@/lib/state";
import type { SubmissionStatus } from "@/lib/types";
import { formatScore } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

function isStorageImagePath(path: string) {
  return path.startsWith("mission-submissions/");
}

const statusLabels: Record<SubmissionStatus, string> = {
  draft: "임시저장",
  submitted: "접수됨",
  pending_review: "검토 대기",
  approved: "승인",
  rejected: "반려",
  cancelled: "취소"
};

function statusBadgeClass(status: SubmissionStatus) {
  if (status === "approved") return "border-moss bg-moss text-paper";
  if (status === "pending_review" || status === "submitted") return "border-coral bg-coral text-white";
  if (status === "rejected") return "border-coral/30 bg-coral/10 text-coral";
  if (status === "cancelled") return "border-ink/20 bg-paper text-ink/55";
  return "border-ink/15 bg-white text-ink/55";
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

  const rows = useMemo(() => {
    const normalizedQuery = query.trim();
    return state.submissions
      .map((submission) => ({
        submission,
        team: state.teams.find((item) => item.id === submission.teamId),
        mission: state.missions.find((item) => item.id === submission.missionId)
      }))
      .filter(({ submission, team, mission }) => {
        const text = `${team?.name} ${team?.teamNumber} ${mission?.code} ${mission?.title}`;
        return text.includes(normalizedQuery) && (status === "all" || submission.status === status);
      });
  }, [query, state.missions, state.submissions, state.teams, status]);

  const stats = useMemo(() => {
    const waiting = state.submissions.filter((item) => item.status === "pending_review" || item.status === "submitted").length;
    const approved = state.submissions.filter((item) => item.status === "approved").length;
    const rejected = state.submissions.filter((item) => item.status === "rejected").length;
    const files = state.submissions.reduce((sum, item) => sum + item.filePaths.length, 0);
    return { waiting, approved, rejected, files };
  }, [state.submissions]);

  return (
    <AppShell mode="admin">
      <AdminNav />
      <div className="space-y-5 pb-20">
        <div className="rounded-md border-2 border-ink bg-night p-5 text-paper shadow-cut">
          <p className="text-xs font-black tracking-[0.18em] text-citrus">운영본부 제출 데스크</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black">제출 검토</h1>
              <p className="mt-1 text-sm text-paper/70">팀 제출물, 증빙 파일, 승인 액션을 한 표에서 처리합니다.</p>
            </div>
            <div className="rounded-md border border-paper/20 px-3 py-2 text-sm font-black">
              표시 {rows.length.toLocaleString("ko-KR")}건 / 전체 {state.submissions.length.toLocaleString("ko-KR")}건
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["검토 대기", stats.waiting],
            ["승인 완료", stats.approved],
            ["반려", stats.rejected],
            ["첨부 파일", stats.files]
          ].map(([label, value]) => (
            <Card key={label as string} className="shadow-none">
              <div className="text-xs font-bold text-ink/55">{label}</div>
              <div className="mt-2 text-2xl font-black">{Number(value).toLocaleString("ko-KR")}</div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="grid gap-2 lg:grid-cols-[1fr_220px_130px]">
            <Input placeholder="팀 번호, 교회명, 미션 코드 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="min-h-11 rounded-md border border-ink/20 bg-white px-3" value={status} onChange={(event) => setStatus(event.target.value as never)}>
              <option value="all">전체 상태</option>
              <option value="submitted">접수됨</option>
              <option value="pending_review">검토 대기</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
              <option value="cancelled">취소</option>
              <option value="draft">임시저장</option>
            </select>
            <div className="rounded-md bg-paper px-3 py-2 text-sm font-bold text-ink/65">
              현재 {rows.length}건
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">제출 목록</h2>
              <p className="mt-1 text-sm text-ink/60">상태 배지와 파일 미리보기를 확인하고 행 오른쪽에서 바로 처리합니다.</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1280px] w-full border-separate border-spacing-y-1 text-left text-sm">
              <thead>
                <tr className="text-xs text-ink/55">
                  <th className="rounded-l-md bg-paper px-3 py-2">팀</th>
                  <th className="bg-paper px-3 py-2">미션</th>
                  <th className="bg-paper px-3 py-2">상태</th>
                  <th className="bg-paper px-3 py-2 text-right">점수</th>
                  <th className="bg-paper px-3 py-2">답변/메모</th>
                  <th className="bg-paper px-3 py-2">첨부</th>
                  <th className="bg-paper px-3 py-2">제출 시각</th>
                  <th className="rounded-r-md bg-paper px-3 py-2">처리</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ submission, team, mission }) => (
                  <tr key={submission.id} className="align-top">
                    <td className="rounded-l-md bg-white px-3 py-3">
                      <div className="font-black">{team ? `${team.teamNumber}번 · ${team.name}` : "팀 정보 없음"}</div>
                    </td>
                    <td className="bg-white px-3 py-3">
                      <div className="font-black">{mission?.code ?? "미션 없음"}</div>
                      <div className="mt-1 max-w-[220px] truncate text-xs text-ink/55">{mission?.title ?? submission.missionId}</div>
                    </td>
                    <td className="bg-white px-3 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-black ${statusBadgeClass(submission.status)}`}>
                        {statusLabels[submission.status]}
                      </span>
                    </td>
                    <td className="bg-white px-3 py-3 text-right font-black">{formatScore(submission.awardedPoints)}</td>
                    <td className="bg-white px-3 py-3">
                      <div className="max-w-[320px] whitespace-pre-wrap text-sm leading-5 text-ink/75">
                        {submission.answerText?.trim() || submission.reviewNote?.trim() || "텍스트 답변 없음"}
                      </div>
                      {submission.reviewedBy ? (
                        <div className="mt-2 text-xs font-bold text-ink/45">검토자 {submission.reviewedBy}</div>
                      ) : null}
                    </td>
                    <td className="bg-white px-3 py-3">
                      {submission.filePaths.length ? (
                        <div className="grid min-w-[220px] grid-cols-2 gap-2">
                          {submission.filePaths.slice(0, 4).map((path, index) =>
                            isStorageImagePath(path) ? (
                              <a
                                key={`${submission.id}-${path}`}
                                href={`/api/admin/files?path=${encodeURIComponent(path)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="group block rounded-md border border-ink/15 bg-paper p-1 text-xs font-bold hover:border-moss"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`/api/admin/files?path=${encodeURIComponent(path)}`}
                                  alt={`${team?.name ?? "팀"} 제출 이미지 ${index + 1}`}
                                  className="aspect-video w-full rounded object-cover"
                                />
                                <span className="mt-1 flex items-center gap-1 px-1">
                                  원본 {index + 1} <ExternalLink size={12} />
                                </span>
                              </a>
                            ) : (
                              <div
                                key={`${submission.id}-${path}`}
                                className="rounded-md border border-ink/15 bg-paper p-2 text-xs font-bold text-ink/60"
                              >
                                임시 파일 {index + 1}
                              </div>
                            )
                          )}
                          {submission.filePaths.length > 4 ? (
                            <div className="rounded-md bg-paper p-2 text-xs font-black text-ink/55">+{submission.filePaths.length - 4}개</div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-ink/40">첨부 없음</span>
                      )}
                    </td>
                    <td className="bg-white px-3 py-3 text-xs font-bold text-ink/55">
                      {new Date(submission.createdAt).toLocaleString("ko-KR")}
                    </td>
                    <td className="rounded-r-md bg-white px-3 py-3">
                      <div className="flex min-w-[240px] flex-wrap gap-1">
                        <Button type="button" className="min-h-9 px-3 text-xs" onClick={() => mutate(submission.id, "approved")}>
                          승인
                        </Button>
                        <Button type="button" variant="danger" className="min-h-9 px-3 text-xs" onClick={() => mutate(submission.id, "rejected")}>
                          반려
                        </Button>
                        <Button type="button" variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => mutate(submission.id, "cancelled")}>
                          취소
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? (
              <div className="rounded-md bg-white p-8 text-center">
                <div className="text-lg font-black">조건에 맞는 제출물이 없습니다.</div>
                <p className="mt-2 text-sm text-ink/55">검색어 또는 상태 필터를 바꾸면 다른 제출물이 표시됩니다.</p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
