"use client";

import { IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface PhotoPreviewGridProps {
  files: File[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

function PreviewTile({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl) return null;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt="Field photo preview"
        className="block h-[72px] w-full object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
        aria-label="Remove photo"
      >
        <IconX size={10} />
      </button>
    </div>
  );
}

export function PhotoPreviewGrid({ files, onRemove, onClear }: PhotoPreviewGridProps) {
  if (files.length === 0) return null;

  const label =
    files.length +
    " photo" +
    (files.length !== 1 ? "s" : "") +
    " selected — combined into one asset";

  return (
    <div className="mb-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted">{label}</p>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-hint underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {files.map((file, i) => (
          <PreviewTile
            key={`${file.name}-${file.size}-${i}`}
            file={file}
            onRemove={() => onRemove(i)}
          />
        ))}
      </div>
    </div>
  );
}
