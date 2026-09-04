"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SAVE_DEBOUNCE_MS = 700;

/**
 * Generic per-user autosave: loads `user_preferences` on mount, merges in `update()` patches, and
 * debounces a PATCH to /api/preferences after each change. Covers theme choice, last-active tab,
 * selected building, KPI-tile ordering — anything that should follow a user across sessions
 * without an explicit "Save" action.
 */
export function useAutosavePreferences<T extends Record<string, unknown>>(defaults: T) {
  const [preferences, setPreferences] = useState<T>(defaults);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/preferences")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { preferences?: Partial<T> } | null) => {
        if (cancelled) return;
        if (data?.preferences && Object.keys(data.preferences).length > 0) {
          setPreferences((prev) => ({ ...prev, ...data.preferences }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<T>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSaving(true);
        fetch("/api/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: next }),
        })
          .catch(() => {})
          .finally(() => setSaving(false));
      }, SAVE_DEBOUNCE_MS);
      return next;
    });
  }, []);

  return { preferences, update, loaded, saving };
}
