"use client";

import { Button } from "@/components/ui/button";
import { hasAdminSession, setAdminSession, syncStateFromServer } from "@/lib/state";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["/admin", "대시보드"],
  ["/admin/submissions", "제출 검토"],
  ["/admin/staff", "스태프 승인"],
  ["/admin/teams", "팀 관리"],
  ["/admin/announcements", "공지"],
  ["/admin/audit", "기록"]
];

export function AdminNav() {
  const pathname = usePathname();
  const [active, setActive] = useState(() => hasAdminSession());

  useEffect(() => {
    setActive(hasAdminSession());
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { ok: boolean }) => {
        setActive(result.ok);
        setAdminSession(result.ok);
        if (result.ok) syncStateFromServer().catch(() => undefined);
      })
      .catch(() => {
        setActive(false);
        setAdminSession(false);
      });
  }, []);

  if (!active) return null;

  return (
    <div className="sticky top-[72px] z-30 mb-5 flex flex-wrap items-center gap-2 border-b border-ink/10 bg-paper/95 py-3 backdrop-blur">
      {links.map(([href, label]) => (
        <Link key={href} href={href}>
          <Button
            variant={pathname === href ? "primary" : "secondary"}
            className="min-h-9 px-3 text-xs shadow-none"
          >
            {label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
