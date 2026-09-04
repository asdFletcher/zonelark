"use client";

import { IconSettings, IconUserCircle } from "@tabler/icons-react";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { FactoryIcon } from "@/components/icons/FactoryIcon";
import { LastSyncedBadge } from "@/components/ui/LastSyncedBadge";
import { ServerStatusBadge } from "@/components/ui/ServerStatusBadge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface TopBarProps {
  serverOnline: boolean | null;
}

export function TopBar({ serverOnline }: TopBarProps) {
  return (
    <header className="sticky top-0 z-[100] flex items-center gap-3.5 bg-navy px-6 py-3.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green">
        <FactoryIcon size={26} className="text-white" />
      </div>
      <div>
        <p className="text-lg font-semibold text-white">Zone Lark</p>
        <p className="mt-px text-[11px] text-white/50">Facility Condition Assessment</p>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <LastSyncedBadge />
        <ServerStatusBadge online={serverOnline} />
        <Link
          href="/admin"
          aria-label="Admin console"
          title="Admin console"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <IconSettings size={18} />
        </Link>
        <Link
          href="/profile"
          aria-label="Your profile"
          title="Your profile"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <IconUserCircle size={18} />
        </Link>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
