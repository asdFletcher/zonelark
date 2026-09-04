"use client";

import { useCallback, useEffect, useState } from "react";

import { DashboardTab } from "@/components/layout/TabBar";
import { useAutosavePreferences } from "@/hooks/useAutosavePreferences";

interface ProfilePreferences extends Record<string, unknown> {
  defaultTab: DashboardTab;
}

const DEFAULT_PREFERENCES: ProfilePreferences = { defaultTab: "home" };

const fieldClass =
  "w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const { preferences, update, loaded, saving } =
    useAutosavePreferences<ProfilePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setEmail(data.email ?? null);
        setRole(data.profile?.role ?? null);
        setDisplayName(data.profile?.display_name ?? "");
      })
      .catch(() => {});
  }, []);

  const saveDisplayName = useCallback(async () => {
    setSavingName(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
    } finally {
      setSavingName(false);
    }
  }, [displayName]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-5">
      <div>
        <p className="text-lg font-semibold text-text">Your profile</p>
        <p className="mt-0.5 text-[13px] text-muted">
          Personal settings — changes here save automatically.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.7px] text-hint">
          Account
        </p>
        <div className="mb-2.5">
          <div className="mb-0.5 text-[11px] text-muted">Email</div>
          <p className="text-[13px] text-text">{email ?? "—"}</p>
        </div>
        <div className="mb-2.5">
          <div className="mb-0.5 text-[11px] text-muted">Role</div>
          <p className="text-[13px] capitalize text-text">{role ?? "—"}</p>
        </div>
        <div>
          <div className="mb-0.5 text-[11px] text-muted">Display name</div>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={saveDisplayName}
            placeholder="How teammates see you"
            className={fieldClass}
          />
          {savingName && <p className="mt-1 text-[11px] text-hint">Saving...</p>}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.7px] text-hint">
            Preferences
          </p>
          {loaded && <p className="text-[11px] text-hint">{saving ? "Saving..." : "Saved"}</p>}
        </div>
        <div>
          <div className="mb-0.5 text-[11px] text-muted">Default landing tab</div>
          <select
            value={preferences.defaultTab}
            onChange={(e) => update({ defaultTab: e.target.value as DashboardTab })}
            className={fieldClass}
          >
            <option value="home">Home</option>
            <option value="building">Build Your Portfolio</option>
            <option value="capture">Asset Capture</option>
            <option value="grid">Asset Grid</option>
          </select>
        </div>
      </div>
    </div>
  );
}
