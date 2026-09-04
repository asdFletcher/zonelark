"use client";

import { useCallback, useEffect, useState } from "react";

/** Polls GET /api/integrations/last-synced — server returns null for roles/orgs that shouldn't see it. */
export function useLastSyncedAt(pollMs = 60_000) {
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/last-synced", {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return;
      const data = await res.json();
      setLastSyncedAt(data.lastSyncedAt ?? null);
    } catch {
      // Leave the previous value in place on a transient failure.
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, pollMs);
    return () => clearInterval(id);
  }, [check, pollMs]);

  return lastSyncedAt;
}
