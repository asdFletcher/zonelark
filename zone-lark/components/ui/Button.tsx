"use client";

import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "primary" | "confirm" | "export" | "admin" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "border border-border bg-surface text-text hover:bg-bg active:scale-[0.98]",
  primary:
    "w-full border border-navy bg-navy py-3 text-sm text-white hover:bg-navy-light active:scale-[0.98] disabled:pointer-events-none disabled:opacity-65",
  confirm:
    "w-full border border-transparent bg-green/12 py-2.5 text-[13px] font-semibold text-[#0d7a5a] hover:bg-green/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  export:
    "w-full border border-green text-green hover:bg-green/5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35",
  admin:
    "border border-admin/40 bg-admin/10 text-admin hover:bg-admin/15 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  danger:
    "border border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/15 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
};

export function Button({ variant = "default", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-[background,transform] ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
