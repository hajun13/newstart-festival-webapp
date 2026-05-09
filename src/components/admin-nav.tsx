"use client";

import { Button } from "@/components/ui/button";
import { hasAdminSession, setAdminSession, syncStateFromServer } from "@/lib/state";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const links = [
  ["/admin", "대시보드"],
  ["/admin/submissions", "제출 검토"],
  ["/admin/staff", "스태프 승인"],
  ["/admin/teams", "팀 관리"],
  ["/admin/announcements", "공지"],
  ["/admin/audit", "감사 로그"]
];

export function AdminNav() {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(hasAdminSession());
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { ok: boolean }) => {
        setActive(result.ok);
        setAdminSession(result.ok);
        if (result.ok) syncStateFromServer().catch(() => undefined);
      })
      .catch(() => undefined);
  }, []);

  if (!active) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {links.map(([href, label]) => (
        <Link key={href} href={href}>
          <Button variant="secondary" className="min-h-9 px-3 text-xs">
            {label}
          </Button>
        </Link>
      ))}
      <Button
        variant="quiet"
        className="min-h-9 px-3 text-xs"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
          setAdminSession(false);
          router.push("/admin");
        }}
      >
        관리자 로그아웃
      </Button>
    </div>
  );
}
