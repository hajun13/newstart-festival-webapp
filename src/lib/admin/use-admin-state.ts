"use client";

import { loadState, setAdminSession, syncStateFromServer } from "@/lib/state";
import type { AppState } from "@/lib/types";
import { useEffect, useState } from "react";

export function useAdminState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { ok: boolean }) => {
        setAdminSession(result.ok);
        if (!result.ok && window.location.pathname !== "/admin") {
          const next = `${window.location.pathname}${window.location.search}`;
          window.location.assign(`/admin?next=${encodeURIComponent(next)}`);
        }
      })
      .catch(() => {
        setAdminSession(false);
        if (window.location.pathname !== "/admin") window.location.assign("/admin");
      });
    const refreshState = () => {
      syncStateFromServer()
        .then((next) => {
          if (mounted) setState(next);
        })
        .catch(() => undefined);
    };
    refreshState();
    const interval = window.setInterval(refreshState, 5000);
    const sync = () => setState(loadState());
    window.addEventListener("newstart-state", sync);
    window.addEventListener("storage", sync);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("newstart-state", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return [state, setState] as const;
}
