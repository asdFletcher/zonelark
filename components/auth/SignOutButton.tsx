"use client";

import { IconLogout } from "@tabler/icons-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      aria-label="Sign out"
      title="Sign out"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      <IconLogout size={18} />
    </button>
  );
}
