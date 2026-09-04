"use client";

import { useCallback, useEffect, useState } from "react";

export function useServerHealth(pollMs = 10_000) {
  const [online, setOnline] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { signal: AbortSignal.timeout(2000) });
      setOnline(res.ok);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, pollMs);
    return () => clearInterval(id);
  }, [check, pollMs]);

  return { online, checking: online === null };
}
