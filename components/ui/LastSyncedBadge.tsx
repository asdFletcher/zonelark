"use client";

import { useLastSyncedAt } from "@/hooks/useLastSyncedAt";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

/** Admin/regional-only — hidden entirely when the server has nothing to report (see route). */
export function LastSyncedBadge() {
  const lastSyncedAt = useLastSyncedAt();
  if (!lastSyncedAt) return null;

  return (
    <span
      title={new Date(lastSyncedAt).toLocaleString()}
      className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Synced {relativeTime(lastSyncedAt)}
    </span>
  );
}
