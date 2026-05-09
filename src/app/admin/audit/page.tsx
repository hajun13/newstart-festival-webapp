"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { useAdminState } from "@/lib/admin/use-admin-state";

export default function AdminAuditPage() {
  const [state] = useAdminState();

  return (
    <AppShell mode="admin">
      <AdminNav />
      <div className="space-y-4 pb-20">
        <h1 className="text-3xl font-black">감사 로그</h1>
        <div className="space-y-3">
          {state.auditLogs.map((log) => (
            <Card key={log.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-black">{log.action}</div>
                <div className="text-xs text-ink/55">{new Date(log.createdAt).toLocaleString("ko-KR")}</div>
              </div>
              <p className="mt-1 text-sm text-ink/65">
                {log.actorType}:{log.actorId ?? "-"} · {log.entityType}:{log.entityId ?? "-"}
              </p>
            </Card>
          ))}
          {!state.auditLogs.length ? <Card>아직 기록된 액션이 없습니다.</Card> : null}
        </div>
      </div>
    </AppShell>
  );
}
