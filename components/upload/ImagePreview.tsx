"use client";

import { IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface ImagePreviewProps {
  file: File | null;
  onClear: () => void;
}

export function ImagePreview({ file, onClear }: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file || !previewUrl) return null;

  return (
    <div className="relative mb-3.5 overflow-hidden rounded-[var(--radius)] border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt="Field photo preview"
        className="block max-h-[200px] w-full object-cover"
      />
      <button
        type="button"
        onClick={onClear}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
        aria-label="Clear preview"
      >
        <IconX size={14} />
      </button>
    </div>
  );
}
