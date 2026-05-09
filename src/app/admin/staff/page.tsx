"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import { saveState, staffApproveByTeamMission } from "@/lib/state";
import { CheckCircle2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

function statusLabel(status?: string) {
  if (status === "approved") return "성공";
  if (status === "rejected") return "실패";
  if (status === "pending_review" || status === "submitted") return "검토 대기";
  if (status === "cancelled") return "취소";
  return "미처리";
}

function statusClass(status?: string) {
  if (status === "approved") return "border-moss bg-moss text-paper";
  if (status === "rejected") return "border-coral/30 bg-coral/10 text-coral";
  if (status === "pending_review" || status === "submitted") return "border-coral bg-coral text-white";
  return "border-ink/15 bg-paper text-ink/55";
}

export default function AdminStaffPage() {
  const [state, setState] = useAdminState();
  const [teamQuery, setTeamQuery] = useState("");
  const [missionCode, setMissionCode] = useState("WTR-80");
  const staffMissions = state.missions.filter((mission) => mission.type === "staff");
  const selectedMission = staffMissions.find((mission) => mission.code === missionCode) ?? staffMissions[0];
  const teams = useMemo(
    () => state.teams.filter((team) => `${team.teamNumber} ${team.name}`.includes(teamQuery.trim())),
    [state.teams, teamQuery]
  );
  const rows = useMemo(
    () =>
      teams.map((team) => ({
        team,
        submission: state.submissions.find((item) => item.teamId === team.id && item.missionId === selectedMission?.id)
      })),
    [selectedMission?.id, state.submissions, teams]
  );
  const stats = useMemo(() => {
    const approved = rows.filter((row) => row.submission?.status === "approved").length;
    const rejected = rows.filter((row) => row.submission?.status === "rejected").length;
    const waiting = rows.filter((row) => row.submission?.status === "pending_review" || row.submission?.status === "submitted").length;
    return { approved, rejected, waiting };
  }, [rows]);

  function approve(teamId: string, success: boolean) {
    if (!selectedMission) return;
    const next = staffApproveByTeamMission({
      state,
      teamId,
      missionCode: selectedMission.code,
      success,
      reviewedBy: "staff-admin"
    });
    saveState(next);
    setState(next);
  }

  return (
    <AppShell mode="admin">
      <AdminNav />
      <div className="space-y-5 pb-20">
        <div className="rounded-md border-2 border-ink bg-night p-5 text-paper shadow-cut">
          <p className="text-xs font-black tracking-[0.18em] text-citrus">현장 스태프 승인 데스크</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black">스태프 미션 승인</h1>
              <p className="mt-1 text-sm text-paper/70">선택한 현장 미션을 팀별 행 단위로 성공/실패 처리합니다.</p>
            </div>
            <div className="rounded-md border border-paper/20 px-3 py-2 text-sm font-black">
              {selectedMission ? `${selectedMission.code} · ${selectedMission.points}점` : "스태프 미션 없음"}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["표시 팀", rows.length],
            ["스태프 미션", staffMissions.length],
            ["성공", stats.approved],
            ["실패", stats.rejected],
            ["검토 대기", stats.waiting]
          ].map(([label, value]) => (
            <Card key={label as string} className="shadow-none">
              <div className="text-xs font-bold text-ink/55">{label}</div>
              <div className="mt-2 text-2xl font-black">{Number(value).toLocaleString("ko-KR")}</div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="grid gap-2 lg:grid-cols-[1fr_520px_120px]">
            <Input value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} placeholder="팀 번호 검색" />
            <select
              className="min-h-11 rounded-md border border-ink/20 bg-white px-3"
              value={selectedMission?.code ?? missionCode}
              onChange={(event) => setMissionCode(event.target.value)}
            >
              {staffMissions.map((mission) => (
                <option key={mission.id} value={mission.code}>{mission.code} · {mission.title}</option>
              ))}
            </select>
            <div className="rounded-md bg-paper px-3 py-2 text-sm font-bold text-ink/65">현재 {rows.length}팀</div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">팀별 승인 표</h2>
              <p className="mt-1 text-sm text-ink/60">현장 확인 후 성공 또는 실패를 누르면 기존 승인 로직으로 즉시 반영됩니다.</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-y-1 text-left text-sm">
              <thead>
                <tr className="text-xs text-ink/55">
                  <th className="rounded-l-md bg-paper px-3 py-2">팀</th>
                  <th className="bg-paper px-3 py-2">선택 미션</th>
                  <th className="bg-paper px-3 py-2">현재 상태</th>
                  <th className="bg-paper px-3 py-2">최근 처리</th>
                  <th className="rounded-r-md bg-paper px-3 py-2">승인 처리</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ team, submission }) => (
                  <tr key={team.id} className="align-middle">
                    <td className="rounded-l-md bg-white px-3 py-3">
                      <div className="font-black">{team.teamNumber}번 · {team.name}</div>
                      <div className="mt-1 text-xs text-ink/45">{team.memberCount}명</div>
                    </td>
                    <td className="bg-white px-3 py-3">
                      <div className="font-black">{selectedMission?.code ?? "-"}</div>
                      <div className="mt-1 max-w-[360px] truncate text-xs text-ink/55">{selectedMission?.title ?? "선택 가능한 스태프 미션이 없습니다."}</div>
                    </td>
                    <td className="bg-white px-3 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-black ${statusClass(submission?.status)}`}>
                        {statusLabel(submission?.status)}
                      </span>
                    </td>
                    <td className="bg-white px-3 py-3 text-xs font-bold text-ink/55">
                      {submission?.reviewedAt ? new Date(submission.reviewedAt).toLocaleString("ko-KR") : "처리 기록 없음"}
                    </td>
                    <td className="rounded-r-md bg-white px-3 py-3">
                      <div className="flex min-w-[180px] flex-wrap gap-1">
                        <Button className="min-h-9 px-3 text-xs" disabled={!selectedMission} onClick={() => approve(team.id, true)}>
                          <CheckCircle2 size={15} /> 성공
                        </Button>
                        <Button variant="danger" className="min-h-9 px-3 text-xs" disabled={!selectedMission} onClick={() => approve(team.id, false)}>
                          <XCircle size={15} /> 실패
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? (
              <div className="rounded-md bg-white p-8 text-center">
                <div className="text-lg font-black">표시할 팀이 없습니다.</div>
                <p className="mt-2 text-sm text-ink/55">팀 검색어를 지우거나 다른 번호를 입력해 주세요.</p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
