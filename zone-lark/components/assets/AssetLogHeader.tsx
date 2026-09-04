"use client";

import { IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/Button";

interface AssetLogHeaderProps {
  count: number;
  onClear: () => void;
}

export function AssetLogHeader({ count, onClear }: AssetLogHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border bg-surface px-5 py-4">
      <h2 className="text-sm font-semibold">Asset log</h2>
      <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-muted">
        {count} asset{count !== 1 ? "s" : ""}
      </span>
      <div className="ml-auto flex gap-2">
        <Button onClick={onClear} className="px-3 py-1.5 text-xs">
          <IconTrash size={14} />
          Clear
        </Button>
      </div>
    </div>
  );
}
