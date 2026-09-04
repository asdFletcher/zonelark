"use client";

import { IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = () => {
    // todo: sign-out against the new auth provider
    router.push("/login");
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label="Sign out"
      title="Sign out"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    >
      <IconLogout size={18} />
    </button>
  );
}
