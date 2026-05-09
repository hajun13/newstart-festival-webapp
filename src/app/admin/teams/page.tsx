"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import {
  adjustManualScore,
  buildCsv,
  buildTeamRows,
  getTeamProgress,
  grantAdminAward,
  saveState
} from "@/lib/state";
import { formatScore } from "@/lib/utils";
import { Download } from "lucide-react";
import { useState } from "react";

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

export default function AdminTeamsPage() {
  const [state, setState] = useAdminState();
  const [query, setQuery] = useState("");
  const [delta, setDelta] = useState(10);
  const rows = buildTeamRows(state).filter((row) => `${row.team.teamNumber} ${row.team.name}`.includes(query));

  function mutate(next: typeof state) {
    saveState(next);
    setState(next);
  }

  function exportTeams() {
    const csv = buildCsv(
      ["team_number", "team_name", "score", "tickets", "cleared_themes", "completed_missions", "final_verified"],
      buildTeamRows(state).map(({ team, progress }) => [
        team.teamNumber,
        team.name,
        progress.score,
        progress.tickets,
        progress.clearedThemes.length,
        progress.completedMissionCodes.length,
        progress.finalVerified
      ])
    );
    downloadCsv("newstart-team-scores.csv", csv);
  }

  function exportTickets() {
    const csv = buildCsv(
      ["team_number", "team_name", "tickets", "score", "final_verified"],
      buildTeamRows(state).map(({ team, progress }) => [
        team.teamNumber,
        team.name,
        progress.tickets,
        progress.score,
        progress.finalVerified
      ])
    );
    downloadCsv("newstart-tickets.csv", csv);
  }

  function exportSubmissions() {
    const csv = buildCsv(
      ["team", "mission", "status", "awarded_points", "created_at"],
      state.submissions.map((submission) => {
        const team = state.teams.find((item) => item.id === submission.teamId);
        const mission = state.missions.find((item) => item.id === submission.missionId);
        return [team?.name, mission?.code, submission.status, submission.awardedPoints, submission.createdAt];
      })
    );
    downloadCsv("newstart-submissions.csv", csv);
  }

  return (
    <AppShell mode="admin">
      <AdminNav />
      <div className="space-y-4 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-black">팀 점수 관리</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportTeams}><Download size={16} /> 점수 CSV</Button>
            <Button variant="secondary" onClick={exportSubmissions}><Download size={16} /> 제출 CSV</Button>
            <Button variant="secondary" onClick={exportTickets}><Download size={16} /> 추첨권 CSV</Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
          <Input placeholder="팀 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Input type="number" value={delta} onChange={(event) => setDelta(Number(event.target.value))} />
        </div>
        <div className="grid gap-3">
          {rows.map(({ team, progress }) => (
            <Card key={team.id}>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="font-black">{team.teamNumber}번 · {team.name}</div>
                  <p className="text-sm text-ink/65">
                    {formatScore(progress.score)} · 추첨권 {progress.tickets}장 · 테마 {progress.clearedThemes.length}/8 · 미션 {progress.completedMissionCodes.length}/16 · 최종 {progress.finalVerified ? "완료" : "대기"}
                  </p>
                  <p className="mt-1 text-xs text-ink/50">코드 {team.loginCode} · 수동 보정 {team.manualAdjustment}점</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => mutate(adjustManualScore({ state, teamId: team.id, delta, actor: "admin", note: "수동 점수 조정" }))}
                  >
                    점수 조정
                  </Button>
                  <Button
                    onClick={() => {
                      const result = grantAdminAward({
                        state,
                        teamId: team.id,
                        awardType: "hidden_staff",
                        title: "숨은 운영진: 생명의 열쇠지기",
                        points: 50,
                        awardedBy: "admin",
                        note: "암호 문장 확인 및 가위바위보 승리"
                      });
                      mutate(result.state);
                      alert(result.message);
                    }}
                  >
                    숨은 운영진 +50
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => {
                      const progressAfter = getTeamProgress(state, team.id);
                      alert(`재계산 완료: ${formatScore(progressAfter.score)}, 추첨권 ${progressAfter.tickets}장`);
                    }}
                  >
                    재계산
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
