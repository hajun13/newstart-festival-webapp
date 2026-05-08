"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadState, saveState, staffApproveByTeamMission } from "@/lib/state";
import { useState } from "react";

export default function AdminStaffPage() {
  const [state, setState] = useState(loadState());
  const [teamQuery, setTeamQuery] = useState("1");
  const [missionCode, setMissionCode] = useState("WTR-80");
  const staffMissions = state.missions.filter((mission) => mission.type === "staff");
  const teams = state.teams.filter((team) => `${team.teamNumber} ${team.name}`.includes(teamQuery));

  function approve(teamId: string, success: boolean) {
    const next = staffApproveByTeamMission({
      state,
      teamId,
      missionCode,
      success,
      reviewedBy: "staff-admin"
    });
    saveState(next);
    setState(next);
  }

  return (
    <AppShell>
      <AdminNav />
      <div className="space-y-4 pb-20">
        <h1 className="text-3xl font-black">스태프 미션 승인</h1>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} placeholder="팀 번호 검색" />
          <select className="rounded-md border border-ink/20 px-3" value={missionCode} onChange={(event) => setMissionCode(event.target.value)}>
            {staffMissions.map((mission) => (
              <option key={mission.id} value={mission.code}>{mission.code} {mission.title}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {teams.map((team) => {
            const mission = state.missions.find((item) => item.code === missionCode);
            const submission = state.submissions.find((item) => item.teamId === team.id && item.missionId === mission?.id);
            return (
              <Card key={team.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black">{team.teamNumber}번 · {team.name}</div>
                    <p className="text-sm text-ink/60">상태: {submission?.status ?? "제출 없음"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approve(team.id, true)}>성공</Button>
                    <Button variant="danger" onClick={() => approve(team.id, false)}>실패</Button>
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
