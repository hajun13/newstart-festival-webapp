"use client";

import { loadState, syncStateFromServer, usesRemoteState } from "@/lib/state";
import type { AppState } from "@/lib/types";
import { useEffect, useState } from "react";

export function useAdminState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    let mounted = true;
    if (usesRemoteState()) {
      syncStateFromServer()
        .then((next) => {
          if (mounted) setState(next);
        })
        .catch(() => undefined);
    }
    const sync = () => setState(loadState());
    window.addEventListener("newstart-state", sync);
    window.addEventListener("storage", sync);
    return () => {
      mounted = false;
      window.removeEventListener("newstart-state", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return [state, setState] as const;
}
