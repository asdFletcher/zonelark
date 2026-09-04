"use client";

import { IconFileSpreadsheet } from "@tabler/icons-react";
import { DragEvent, KeyboardEvent, useRef, useState } from "react";

interface CsvDropZoneProps {
  onFileSelect: (file: File) => void;
}

function assetFileFromList(list: FileList | null | undefined): File | null {
  if (!list) return null;
  return (
    Array.from(list).find((f) => {
      const name = f.name.toLowerCase();
      return (
        name.endsWith(".csv") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".xls") ||
        f.type === "text/csv" ||
        f.type.includes("spreadsheetml") ||
        f.type === "application/vnd.ms-excel"
      );
    }) ?? null
  );
}

export function CsvDropZone({ onFileSelect }: CsvDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | null) => {
    if (file) onFileSelect(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(assetFileFromList(e.dataTransfer.files));
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
        className={`flex cursor-pointer items-center justify-center gap-2.5 rounded-[var(--radius)] border-[1.5px] border-dashed px-4 py-4 text-center transition-[background,border-color] ${
          dragOver ? "border-green bg-green/5" : "border-border hover:border-green hover:bg-green/5"
        }`}
      >
        <IconFileSpreadsheet size={22} className="text-green" />
        <p className="text-[13px] text-muted">
          Drop a CSV or Excel file of assets here{" "}
          <span className="text-hint">or click to browse</span>
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={(e) => {
          handleFile(assetFileFromList(e.target.files));
          e.target.value = "";
        }}
      />
    </>
  );
}
