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
import { Download, RefreshCcw, RotateCcw, Trash2 } from "lucide-react";
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
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
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

  const allRows = buildTeamRows(state);
  const rows = allRows.filter((row) => `${row.team.teamNumber} ${row.team.name} ${row.team.loginCode}`.includes(query));
  const totals = useMemo(() => {
    return {
      score: allRows.reduce((sum, row) => sum + row.progress.score, 0),
      tickets: allRows.reduce((sum, row) => sum + row.progress.tickets, 0),
      submissions: state.submissions.length,
      final: allRows.filter((row) => row.progress.finalVerified).length
    };
  }, [allRows, state.submissions.length]);
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

  async function resetScores() {
    setResetting(true);
    await callAdminApi(
      "/api/admin/reset-scores",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPhrase: resetConfirm })
      },
      "초기화 실패"
    );
    setResetConfirm("");
    setResetting(false);
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
        <div className="rounded-md border-2 border-ink bg-night p-5 text-paper shadow-cut">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-citrus">팀 운영</p>
              <h1 className="mt-2 text-3xl font-black">교회별 점수 관리</h1>
              <p className="mt-1 text-sm text-paper/70">
                팀 이름은 교회명으로 사용합니다. 테스트가 끝나면 전체 점수 초기화 후 실제 운영을 시작하세요.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:min-w-[520px]">
              {[
                ["총점", formatScore(totals.score)],
                ["추첨권", `${totals.tickets}장`],
                ["제출", `${totals.submissions}건`],
                ["최종", `${totals.final}팀`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-paper/10 px-3 py-2">
                  <div className="text-[11px] font-bold text-paper/55">{label}</div>
                  <div className="mt-1 text-lg font-black">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_420px]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">팀 추가</h2>
                <p className="mt-1 text-sm text-ink/60">교회명과 로그인 코드를 등록합니다. 코드는 비우면 자동 생성됩니다.</p>
              </div>
            </div>
            <form className="mt-4 grid gap-2 lg:grid-cols-[84px_1.2fr_1fr_84px_auto]" onSubmit={addTeam}>
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
                aria-label="새 교회명"
                placeholder="교회명"
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
                type="number"
                aria-label="새 팀 인원"
                placeholder="인원"
                value={newTeam.memberCount}
                onChange={(event) => setNewTeam((current) => ({ ...current, memberCount: Number(event.target.value) }))}
              />
              <Button type="submit">팀 추가</Button>
            </form>
          </Card>

          <Card className="border-coral/35 bg-coral/10">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-coral p-2 text-white">
                <RefreshCcw size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black">전체 점수 초기화</h2>
                <p className="mt-1 text-sm text-ink/65">
                  팀과 로그인 코드는 남기고 점수, 제출, 보너스, 최종 인증, 운영 기록을 비웁니다.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                aria-label="전체 점수 초기화 확인"
                placeholder="초기화 입력"
                value={resetConfirm}
                onChange={(event) => setResetConfirm(event.target.value)}
              />
              <Button
                variant="danger"
                disabled={resetting || resetConfirm.trim() !== "초기화"}
                onClick={resetScores}
              >
                전체 초기화
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">운영 자료 내보내기</h2>
            <p className="mt-1 text-sm text-ink/60">행사 종료 후 점수, 제출, 추첨권 자료를 CSV로 저장합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportTeams}><Download size={16} /> 팀 CSV</Button>
            <Button variant="secondary" onClick={exportSubmissions}><Download size={16} /> 제출 CSV</Button>
            <Button variant="secondary" onClick={exportTickets}><Download size={16} /> 추첨권 CSV</Button>
          </div>
        </div>

        {message ? <div className="rounded-md bg-citrus/30 p-3 text-sm font-bold">{message}</div> : null}

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">팀별 점수와 운영 조정</h2>
              <p className="mt-1 text-sm text-ink/60">오른쪽 끝까지 밀리지 않도록 핵심 항목만 남겼습니다.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[360px_110px]">
              <Input placeholder="번호, 교회명, 코드 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
              <div className="rounded-md bg-paper px-3 py-2 text-sm font-bold">표시 {rows.length}팀</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1280px] w-full border-separate border-spacing-y-1 text-left text-xs">
              <thead>
                <tr className="text-ink/55">
                  <th className="sticky left-0 z-10 rounded-l-md bg-paper px-2 py-2">번호</th>
                  <th className="bg-paper px-2 py-2">교회명(팀 이름)</th>
                  <th className="bg-paper px-2 py-2">로그인 코드</th>
                  <th className="bg-paper px-2 py-2">인원</th>
                  <th className="bg-paper px-2 py-2 text-right">점수</th>
                  <th className="bg-paper px-2 py-2 text-right">추첨권</th>
                  <th className="bg-paper px-2 py-2">점수 조정</th>
                  <th className="bg-paper px-2 py-2">최근 조정</th>
                  <th className="rounded-r-md bg-paper px-2 py-2">관리</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ team, progress }) => {
                  const draft = draftFor(team);
                  const adjustment = adjustmentFor(team.id);
                  const manualLogs = state.auditLogs
                    .filter((log) => log.action === "manual_score_adjust" && log.entityId === team.id)
                    .slice(0, 2);
                  const awards = state.adminAwards.filter((award) => award.teamId === team.id);
                  const hiddenAward = awards.find((award) => award.awardType === "hidden_staff");
                  return (
                    <tr key={team.id} className="align-top">
                      <td className="sticky left-0 z-10 rounded-l-md bg-white px-2 py-2">
                        <Input
                          type="number"
                          aria-label={`${team.name} 팀 번호`}
                          className="min-h-9 w-20 px-2 text-sm"
                          value={draft.teamNumber}
                          onChange={(event) => updateDraft(team, { teamNumber: Number(event.target.value) })}
                        />
                      </td>
                      <td className="bg-white px-2 py-2">
                        <Input
                          aria-label={`${team.name} 교회명`}
                          className="min-h-9 min-w-[220px] px-2 text-sm font-bold"
                          value={draft.name}
                          onChange={(event) => updateDraft(team, { name: event.target.value })}
                        />
                      </td>
                      <td className="bg-white px-2 py-2">
                        <Input
                          aria-label={`${team.name} 팀 코드`}
                          className="min-h-9 min-w-[160px] px-2 font-mono text-sm"
                          value={draft.loginCode}
                          onChange={(event) => updateDraft(team, { loginCode: event.target.value })}
                        />
                      </td>
                      <td className="bg-white px-2 py-2">
                        <Input
                          type="number"
                          aria-label={`${team.name} 인원`}
                          className="min-h-9 w-20 px-2 text-sm"
                          value={draft.memberCount}
                          onChange={(event) => updateDraft(team, { memberCount: Number(event.target.value) })}
                        />
                      </td>
                      <td className="whitespace-nowrap bg-white px-2 py-3 text-right text-base font-black">{formatScore(progress.score)}</td>
                      <td className="whitespace-nowrap bg-white px-2 py-3 text-right font-black">{progress.tickets}장</td>
                      <td className="bg-white px-2 py-2">
                        <div className="grid min-w-[320px] grid-cols-[72px_1fr_auto] gap-1">
                          <Input
                            type="number"
                            aria-label={`${team.name} 점수 조정`}
                            className="min-h-9 px-2 text-sm"
                            value={adjustment.delta}
                            onChange={(event) => updateAdjustment(team.id, { delta: Number(event.target.value) })}
                          />
                          <Input
                            aria-label={`${team.name} 점수 조정 사유`}
                            className="min-h-9 px-2 text-sm"
                            placeholder="사유"
                            value={adjustment.note}
                            onChange={(event) => updateAdjustment(team.id, { note: event.target.value })}
                          />
                          <Button variant="secondary" className="min-h-9 px-2 text-xs" onClick={() => adjustScore(team)}>
                            점수 적용
                          </Button>
                        </div>
                      </td>
                      <td className="bg-white px-2 py-2">
                        <div className="min-w-[200px] space-y-1">
                          {manualLogs.map((log) => {
                            const delta = manualDelta(log);
                            const undone = undoneManualLogIds.has(log.id);
                            return (
                              <div key={log.id} className="flex items-center justify-between gap-2 rounded-md bg-paper px-2 py-1">
                                <span className="truncate font-bold">{delta > 0 ? "+" : ""}{delta}점 · {manualNote(log)}</span>
                                <Button
                                  variant="quiet"
                                  className="min-h-7 px-1 text-[11px]"
                                  disabled={undone}
                                  onClick={() => undoManual(team, log.id)}
                                >
                                  <RotateCcw size={12} /> {undone ? "완료" : "취소"}
                                </Button>
                              </div>
                            );
                          })}
                          {awards.map((award) => (
                            <div key={award.id} className="flex items-center justify-between gap-2 rounded-md bg-citrus/25 px-2 py-1">
                              <span className="truncate font-bold">보너스 +{award.points}</span>
                              <Button
                                variant="quiet"
                                className="min-h-7 px-1 text-[11px]"
                                onClick={() => undoAward(team, award.id)}
                              >
                                <RotateCcw size={12} /> 취소
                              </Button>
                            </div>
                          ))}
                          {!manualLogs.length && !awards.length ? <span className="text-ink/45">기록 없음</span> : null}
                        </div>
                      </td>
                      <td className="rounded-r-md bg-white px-2 py-2">
                        <div className="grid min-w-[190px] grid-cols-2 gap-1">
                          <Button variant="secondary" className="min-h-9 px-2 text-xs" onClick={() => saveTeam(team)}>
                            저장
                          </Button>
                          <Button
                            className="min-h-9 px-2 text-xs"
                            disabled={Boolean(hiddenAward)}
                            onClick={() => grantHiddenStaff(team)}
                          >
                            {hiddenAward ? "완료" : "+50"}
                          </Button>
                          <Input
                            className="col-span-2 min-h-9 px-2 text-xs"
                            placeholder="삭제 확인명"
                            value={deleteConfirm[team.id] ?? ""}
                            onChange={(event) =>
                              setDeleteConfirm((current) => ({ ...current, [team.id]: event.target.value }))
                            }
                          />
                          <Button variant="danger" className="col-span-2 min-h-9 px-2 text-xs" onClick={() => deleteTeam(team)}>
                            <Trash2 size={14} /> 삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
