"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import {
  buildCsv,
  buildTeamRows,
  grantAdminAward,
  saveState,
  syncStateFromServer,
  usesRemoteState
} from "@/lib/state";
import type { AppState, AuditLog, Team } from "@/lib/types";
import { formatScore } from "@/lib/utils";
import { Download, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type TeamDraft = {
  teamNumber: number;
  name: string;
  loginCode: string;
  churchName: string;
  memberCount: number;
};

type AdjustmentDraft = {
  delta: number;
  note: string;
};

type ApiResult = {
  ok: boolean;
  message?: string;
  state?: AppState;
};

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

function teamToDraft(team: Team): TeamDraft {
  return {
    teamNumber: team.teamNumber,
    name: team.name,
    loginCode: team.loginCode,
    churchName: team.churchName,
    memberCount: team.memberCount
  };
}

function defaultCode(teamNumber: number) {
  return `TEAM-${String(teamNumber).padStart(2, "0")}-KEY`;
}

function manualDelta(log: AuditLog) {
  const before = log.beforeData as Team | undefined;
  const after = log.afterData as { updatedTeam?: Team } | undefined;
  return (after?.updatedTeam?.manualAdjustment ?? 0) - (before?.manualAdjustment ?? 0);
}

function manualNote(log: AuditLog) {
  return ((log.afterData as { note?: string } | undefined)?.note ?? "수동 점수 조정").trim();
}

export default function AdminTeamsPage() {
  const [state, setState] = useAdminState();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, TeamDraft>>({});
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentDraft>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const nextTeamNumber = useMemo(
    () => Math.max(0, ...state.teams.map((team) => team.teamNumber)) + 1,
    [state.teams]
  );
  const [newTeam, setNewTeam] = useState<TeamDraft>({
    teamNumber: 0,
    name: "",
    loginCode: "",
    churchName: "",
    memberCount: 0
  });

  const rows = buildTeamRows(state).filter((row) =>
    `${row.team.teamNumber} ${row.team.name} ${row.team.loginCode}`.includes(query)
  );
  const undoneManualLogIds = new Set(
    state.auditLogs
      .filter((log) => log.action === "manual_score_undo")
      .map((log) => (log.afterData as { sourceAuditLogId?: string } | undefined)?.sourceAuditLogId)
      .filter(Boolean)
  );

  async function applyResult(result: ApiResult, fallbackMessage: string) {
    if (!result.ok) {
      setMessage(result.message ?? fallbackMessage);
      return;
    }
    if (result.state) {
      setState(result.state);
      saveState(result.state);
    } else {
      setState(await syncStateFromServer());
    }
    setMessage(result.message ?? "변경사항을 저장했습니다.");
  }

  async function callAdminApi(path: string, init: RequestInit, fallbackMessage: string) {
    const response = await fetch(path, init);
    const result = (await response.json()) as ApiResult;
    await applyResult({ ...result, ok: response.ok && result.ok }, fallbackMessage);
  }

  async function persistState(next: AppState, successMessage: string) {
    if (usesRemoteState()) {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
      if (!response.ok) {
        setMessage("저장에 실패했습니다.");
        return;
      }
    }
    saveState(next);
    setState(next);
    setMessage(successMessage);
  }

  function draftFor(team: Team) {
    return drafts[team.id] ?? teamToDraft(team);
  }

  function updateDraft(team: Team, patch: Partial<TeamDraft>) {
    setDrafts((current) => ({
      ...current,
      [team.id]: { ...draftFor(team), ...patch }
    }));
  }

  function adjustmentFor(teamId: string) {
    return adjustments[teamId] ?? { delta: 10, note: "" };
  }

  function updateAdjustment(teamId: string, patch: Partial<AdjustmentDraft>) {
    setAdjustments((current) => ({
      ...current,
      [teamId]: { ...adjustmentFor(teamId), ...patch }
    }));
  }

  async function addTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await callAdminApi(
      "/api/admin/teams",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTeam, teamNumber: newTeam.teamNumber || nextTeamNumber })
      },
      "팀 추가 실패"
    );
    setNewTeam({
      teamNumber: nextTeamNumber + 1,
      name: "",
      loginCode: "",
      churchName: "",
      memberCount: 0
    });
  }

  async function saveTeam(team: Team) {
    await callAdminApi(
      `/api/admin/teams/${team.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftFor(team))
      },
      "팀 수정 실패"
    );
    setDrafts((current) => {
      const next = { ...current };
      delete next[team.id];
      return next;
    });
  }

  async function deleteTeam(team: Team) {
    await callAdminApi(
      `/api/admin/teams/${team.id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: deleteConfirm[team.id] ?? "" })
      },
      "팀 삭제 실패"
    );
  }

  async function adjustScore(team: Team) {
    const draft = adjustmentFor(team.id);
    await callAdminApi(
      `/api/admin/teams/${team.id}/manual-adjustments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      },
      "점수 조정 실패"
    );
    updateAdjustment(team.id, { note: "" });
  }

  async function undoManual(team: Team, auditLogId: string) {
    await callAdminApi(
      `/api/admin/teams/${team.id}/undo-adjustment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "manual_score", auditLogId })
      },
      "점수 되돌리기 실패"
    );
  }

  async function grantHiddenStaff(team: Team) {
    const result = grantAdminAward({
      state,
      teamId: team.id,
      awardType: "hidden_staff",
      title: "숨은 운영진: 생명의 열쇠지기",
      points: 50,
      awardedBy: "admin",
      note: "암호 문장 확인 및 현장 과제 성공"
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await persistState(result.state, result.message);
  }

  async function undoAward(team: Team, awardId: string) {
    await callAdminApi(
      `/api/admin/teams/${team.id}/undo-adjustment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "admin_award", awardId })
      },
      "보너스 되돌리기 실패"
    );
  }

  function exportTeams() {
    const csv = buildCsv(
      ["team_number", "team_name", "login_code", "score", "tickets", "cleared_themes", "completed_missions", "final_verified"],
      buildTeamRows(state).map(({ team, progress }) => [
        team.teamNumber,
        team.name,
        team.loginCode,
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
          <div>
            <h1 className="text-3xl font-black">팀 관리</h1>
            <p className="mt-1 text-sm text-ink/60">팀 등록, 코드 수정, 점수 조정과 되돌리기를 한곳에서 처리합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportTeams}><Download size={16} /> 팀 CSV</Button>
            <Button variant="secondary" onClick={exportSubmissions}><Download size={16} /> 제출 CSV</Button>
            <Button variant="secondary" onClick={exportTickets}><Download size={16} /> 추첨권 CSV</Button>
          </div>
        </div>

        {message ? <div className="rounded-md bg-citrus/30 p-3 text-sm font-bold">{message}</div> : null}

        <Card>
          <h2 className="text-xl font-black">팀 추가</h2>
          <form className="mt-4 grid gap-2 lg:grid-cols-[100px_1fr_1fr_1fr_100px_auto]" onSubmit={addTeam}>
            <Input
              type="number"
              aria-label="새 팀 번호"
              value={newTeam.teamNumber || nextTeamNumber}
              onChange={(event) => {
                const teamNumber = Number(event.target.value);
                setNewTeam((current) => ({ ...current, teamNumber }));
              }}
            />
            <Input
              aria-label="새 팀 이름"
              placeholder="팀 이름"
              value={newTeam.name}
              onChange={(event) => setNewTeam((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              aria-label="새 팀 코드"
              placeholder={`비우면 ${defaultCode(newTeam.teamNumber || nextTeamNumber)}`}
              value={newTeam.loginCode}
              onChange={(event) => setNewTeam((current) => ({ ...current, loginCode: event.target.value }))}
            />
            <Input
              aria-label="새 팀 교회"
              placeholder="교회/소속"
              value={newTeam.churchName}
              onChange={(event) => setNewTeam((current) => ({ ...current, churchName: event.target.value }))}
            />
            <Input
              type="number"
              aria-label="새 팀 인원"
              placeholder="인원"
              value={newTeam.memberCount}
              onChange={(event) => setNewTeam((current) => ({ ...current, memberCount: Number(event.target.value) }))}
            />
            <Button type="submit">팀 추가</Button>
          </form>
        </Card>

        <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
          <Input placeholder="팀 번호, 이름, 코드 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="rounded-md bg-paper px-3 py-2 text-sm font-bold">표시 {rows.length}팀</div>
        </div>

        <div className="grid gap-3">
          {rows.map(({ team, progress }) => {
            const draft = draftFor(team);
            const adjustment = adjustmentFor(team.id);
            const manualLogs = state.auditLogs
              .filter((log) => log.action === "manual_score_adjust" && log.entityId === team.id)
              .slice(0, 3);
            const awards = state.adminAwards.filter((award) => award.teamId === team.id);
            const hiddenAward = awards.find((award) => award.awardType === "hidden_staff");

            return (
              <Card key={team.id}>
                <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black">{team.teamNumber}번 · {team.name}</h2>
                        <p className="mt-1 text-sm text-ink/65">
                          {formatScore(progress.score)} · 추첨권 {progress.tickets}장 · 미션 {progress.completedMissionCodes.length}/{state.missions.length} · 최종 {progress.finalVerified ? "완료" : "대기"}
                        </p>
                      </div>
                      <Button variant="secondary" onClick={() => saveTeam(team)}>
                        팀 정보 저장
                      </Button>
                    </div>

                    <div className="grid gap-2 md:grid-cols-5">
                      <Input
                        type="number"
                        aria-label={`${team.name} 팀 번호`}
                        value={draft.teamNumber}
                        onChange={(event) => updateDraft(team, { teamNumber: Number(event.target.value) })}
                      />
                      <Input
                        aria-label={`${team.name} 팀 이름`}
                        value={draft.name}
                        onChange={(event) => updateDraft(team, { name: event.target.value })}
                      />
                      <Input
                        aria-label={`${team.name} 팀 코드`}
                        value={draft.loginCode}
                        onChange={(event) => updateDraft(team, { loginCode: event.target.value })}
                      />
                      <Input
                        aria-label={`${team.name} 교회`}
                        value={draft.churchName}
                        onChange={(event) => updateDraft(team, { churchName: event.target.value })}
                      />
                      <Input
                        type="number"
                        aria-label={`${team.name} 인원`}
                        value={draft.memberCount}
                        onChange={(event) => updateDraft(team, { memberCount: Number(event.target.value) })}
                      />
                    </div>

                    <div className="grid gap-2 rounded-md bg-paper p-3 lg:grid-cols-[120px_1fr_auto]">
                      <Input
                        type="number"
                        aria-label={`${team.name} 점수 조정`}
                        value={adjustment.delta}
                        onChange={(event) => updateAdjustment(team.id, { delta: Number(event.target.value) })}
                      />
                      <Input
                        aria-label={`${team.name} 점수 조정 사유`}
                        placeholder="조정 사유를 입력하세요"
                        value={adjustment.note}
                        onChange={(event) => updateAdjustment(team.id, { note: event.target.value })}
                      />
                      <Button variant="secondary" onClick={() => adjustScore(team)}>
                        점수 조정 저장
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button disabled={Boolean(hiddenAward)} onClick={() => grantHiddenStaff(team)}>
                        {hiddenAward ? "숨은 운영진 지급됨" : "숨은 운영진 +50"}
                      </Button>
                      <Input
                        className="max-w-xs"
                        placeholder={`삭제하려면 ${team.name} 입력`}
                        value={deleteConfirm[team.id] ?? ""}
                        onChange={(event) =>
                          setDeleteConfirm((current) => ({ ...current, [team.id]: event.target.value }))
                        }
                      />
                      <Button variant="danger" onClick={() => deleteTeam(team)}>
                        <Trash2 size={16} /> 팀 삭제
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-md border border-ink/10 bg-linen p-3">
                    <h3 className="font-black">최근 조정 내역</h3>
                    {manualLogs.map((log) => {
                      const delta = manualDelta(log);
                      const undone = undoneManualLogIds.has(log.id);
                      return (
                        <div key={log.id} className="rounded-md bg-white p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black">{delta > 0 ? "+" : ""}{delta}점</span>
                            <Button
                              variant="quiet"
                              className="min-h-8 px-2 text-xs"
                              disabled={undone}
                              onClick={() => undoManual(team, log.id)}
                            >
                              <RotateCcw size={14} /> {undone ? "되돌림" : "되돌리기"}
                            </Button>
                          </div>
                          <p className="mt-1 text-xs text-ink/60">{manualNote(log)}</p>
                        </div>
                      );
                    })}
                    {awards.map((award) => (
                      <div key={award.id} className="rounded-md bg-white p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black">{award.title} · +{award.points}점</span>
                          <Button
                            variant="quiet"
                            className="min-h-8 px-2 text-xs"
                            onClick={() => undoAward(team, award.id)}
                          >
                            <RotateCcw size={14} /> 되돌리기
                          </Button>
                        </div>
                        {award.note ? <p className="mt-1 text-xs text-ink/60">{award.note}</p> : null}
                      </div>
                    ))}
                    {!manualLogs.length && !awards.length ? (
                      <p className="rounded-md bg-white p-3 text-sm text-ink/55">아직 조정 내역이 없습니다.</p>
                    ) : null}
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
