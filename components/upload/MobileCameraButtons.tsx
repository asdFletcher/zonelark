"use client";

import { IconCamera, IconPhoto } from "@tabler/icons-react";
import { useRef } from "react";

interface MobileCameraButtonsProps {
  onFilesAdd: (files: File[]) => void;
}

function imageFilesFromList(list: FileList | null | undefined): File[] {
  if (!list) return [];
  return Array.from(list).filter((f) => f.type.startsWith("image/"));
}

export function MobileCameraButtons({ onFilesAdd }: MobileCameraButtonsProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleChange = (list: FileList | null | undefined) => {
    const files = imageFilesFromList(list);
    if (files.length) onFilesAdd(files);
  };

  return (
    <>
      <div className="mb-3.5 flex min-[701px]:hidden gap-2.5">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex flex-1 flex-col items-center gap-1.5 rounded-[var(--radius)] border border-border bg-surface px-3 py-4 text-text active:bg-bg"
        >
          <IconCamera size={28} className="text-green" />
          <span className="text-xs text-muted">Take photo</span>
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex flex-1 flex-col items-center gap-1.5 rounded-[var(--radius)] border border-border bg-surface px-3 py-4 text-text active:bg-bg"
        >
          <IconPhoto size={28} className="text-green" />
          <span className="text-xs text-muted">Gallery</span>
        </button>
      </div>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleChange(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleChange(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}
