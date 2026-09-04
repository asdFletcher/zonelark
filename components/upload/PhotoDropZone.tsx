"use client";

import { IconPhotoUp } from "@tabler/icons-react";
import { DragEvent, KeyboardEvent, useRef, useState } from "react";

interface PhotoDropZoneProps {
  onFilesAdd: (files: File[]) => void;
}

function imageFilesFromList(list: FileList | null | undefined): File[] {
  if (!list) return [];
  return Array.from(list).filter((f) => f.type.startsWith("image/"));
}

export function PhotoDropZone({ onFilesAdd }: PhotoDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: File[]) => {
    if (files.length) onFilesAdd(files);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(imageFilesFromList(e.dataTransfer.files));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mb-3.5 hidden min-[701px]:block cursor-pointer rounded-[var(--radius)] border-[1.5px] border-dashed px-4 py-7 text-center transition-[background,border-color] ${
          dragOver ? "border-green bg-green/5" : "border-border hover:border-green hover:bg-green/5"
        }`}
      >
        <IconPhotoUp size={34} className="mx-auto mb-2 block text-green" />
        <p className="text-[13px] text-muted">Drop images here</p>
        <span className="mt-0.5 block text-[11px] text-hint">or click to browse</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(imageFilesFromList(e.target.files));
          e.target.value = "";
        }}
      />
    </>
  );
}
