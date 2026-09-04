"use client";

interface StatusMessageProps {
  message: string;
  type: "ok" | "err";
}

export function StatusMessage({ message, type }: StatusMessageProps) {
  return (
    <div
      className={`mt-2.5 whitespace-pre-line rounded-[7px] px-3 py-2 text-xs ${
        type === "ok" ? "bg-green/12 text-[#0d7a5a]" : "bg-red-500/10 text-red-700"
      }`}
    >
      {message}
    </div>
  );
}
