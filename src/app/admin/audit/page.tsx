"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminState } from "@/lib/admin/use-admin-state";
import { useMemo, useState } from "react";

function actorLabel(actorType: string, actorId?: string) {
  if (actorType === "admin") return `관리자${actorId ? ` · ${actorId}` : ""}`;
  if (actorType === "team") return `팀${actorId ? ` · ${actorId}` : ""}`;
  return `시스템${actorId ? ` · ${actorId}` : ""}`;
}

function actionLabel(action: string) {
  return action
    .split("_")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function dataSummary(value: unknown) {
  if (!value) return "변경 데이터 없음";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value).slice(0, 140);
  } catch {
    return "변경 데이터 확인 필요";
  }
}

export default function AdminAuditPage() {
  const [state] = useAdminState();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const normalizedQuery = query.trim();
    return state.auditLogs.filter((log) => {
      const text = `${log.action} ${log.actorType} ${log.actorId} ${log.entityType} ${log.entityId}`;
      return text.includes(normalizedQuery);
    });
  }, [query, state.auditLogs]);
  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString("ko-KR");
    const todayCount = state.auditLogs.filter((log) => new Date(log.createdAt).toLocaleDateString("ko-KR") === today).length;
    const admin = state.auditLogs.filter((log) => log.actorType === "admin").length;
    const team = state.auditLogs.filter((log) => log.actorType === "team").length;
    return { todayCount, admin, team };
  }, [state.auditLogs]);

  return (
    <AppShell mode="admin">
      <AdminNav />
      <div className="space-y-5 pb-20">
        <div className="rounded-md border-2 border-ink bg-night p-5 text-paper shadow-cut">
          <p className="text-xs font-black tracking-[0.18em] text-citrus">운영본부 기록 데스크</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black">감사 로그</h1>
              <p className="mt-1 text-sm text-paper/70">관리자 조작, 팀 제출, 시스템 기록을 시간순 표로 확인합니다.</p>
            </div>
            <div className="rounded-md border border-paper/20 px-3 py-2 text-sm font-black">
              표시 {rows.length.toLocaleString("ko-KR")}건 / 전체 {state.auditLogs.length.toLocaleString("ko-KR")}건
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["전체 로그", state.auditLogs.length],
            ["오늘 기록", stats.todayCount],
            ["관리자 액션", stats.admin],
            ["팀 액션", stats.team]
          ].map(([label, value]) => (
            <Card key={label as string} className="shadow-none">
              <div className="text-xs font-bold text-ink/55">{label}</div>
              <div className="mt-2 text-2xl font-black">{Number(value).toLocaleString("ko-KR")}</div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="grid gap-2 lg:grid-cols-[1fr_130px]">
            <Input
              placeholder="액션, 액터, 대상 ID 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="rounded-md bg-paper px-3 py-2 text-sm font-bold text-ink/65">현재 {rows.length}건</div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">변경 기록 표</h2>
              <p className="mt-1 text-sm text-ink/60">최근 로그부터 액터, 대상, 변경 요약을 빠르게 대조합니다.</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1120px] w-full border-separate border-spacing-y-1 text-left text-sm">
              <thead>
                <tr className="text-xs text-ink/55">
                  <th className="rounded-l-md bg-paper px-3 py-2">시각</th>
                  <th className="bg-paper px-3 py-2">액터</th>
                  <th className="bg-paper px-3 py-2">액션</th>
                  <th className="bg-paper px-3 py-2">대상</th>
                  <th className="rounded-r-md bg-paper px-3 py-2">변경 요약</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="rounded-l-md bg-white px-3 py-3 text-xs font-bold text-ink/55">
                      {new Date(log.createdAt).toLocaleString("ko-KR")}
                    </td>
                    <td className="bg-white px-3 py-3 font-bold">{actorLabel(log.actorType, log.actorId)}</td>
                    <td className="bg-white px-3 py-3">
                      <span className="inline-flex rounded-md border border-ink/15 bg-paper px-2 py-1 text-xs font-black">
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="bg-white px-3 py-3">
                      <div className="font-black">{log.entityType}</div>
                      <div className="mt-1 max-w-[260px] truncate text-xs text-ink/45">{log.entityId ?? "-"}</div>
                    </td>
                    <td className="rounded-r-md bg-white px-3 py-3">
                      <div className="max-w-[460px] truncate font-mono text-xs text-ink/60">
                        {dataSummary(log.afterData ?? log.beforeData)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? (
              <div className="rounded-md bg-white p-8 text-center">
                <div className="text-lg font-black">조건에 맞는 기록이 없습니다.</div>
                <p className="mt-2 text-sm text-ink/55">
                  {state.auditLogs.length ? "검색어를 지우거나 다른 키워드로 다시 찾아보세요." : "아직 기록된 운영 액션이 없습니다."}
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
