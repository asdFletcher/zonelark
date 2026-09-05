"use client";

import { useCallback, useEffect, useState } from "react";

const fieldClass =
  "w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);

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
        <p className="mt-0.5 text-[13px] text-muted">Display name saves when you leave the field.</p>
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
    </div>
  );
}
