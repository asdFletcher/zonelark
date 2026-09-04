"use client";

interface ServerStatusBadgeProps {
  online: boolean | null;
}

export function ServerStatusBadge({ online }: ServerStatusBadgeProps) {
  const isOnline = online === true;
  const label = online === null ? "Checking server..." : isOnline ? "Server online" : "Demo mode";

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isOnline
          ? "bg-green/20 text-[#5fffc6]"
          : online === null
            ? "bg-white/10 text-white/70"
            : "bg-red-500/20 text-[#ff9494]"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
