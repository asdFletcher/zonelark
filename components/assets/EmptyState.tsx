"use client";

import { IconClipboardList } from "@tabler/icons-react";

export function EmptyState() {
  return (
    <div className="px-5 py-16 text-center text-hint">
      <IconClipboardList size={40} className="mx-auto mb-2.5 opacity-35" />
      <p className="text-[13px]">
        No assets assessed yet.
        <br />
        Upload a field photo or run demo mode.
      </p>
    </div>
  );
}
