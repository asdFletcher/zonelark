import Link from "next/link";
import { IconChevronRight, IconPlugConnected, IconUsers } from "@tabler/icons-react";

export default function AdminPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-5">
      <div>
        <p className="text-lg font-semibold text-text">Admin console</p>
        <p className="mt-0.5 text-[13px] text-muted">
          Manage who has access to this organization and what they can see.
        </p>
      </div>
      <Link
        href="/admin/users"
        className="flex items-center gap-3.5 rounded-lg border border-border bg-surface p-5 text-left transition-colors hover:border-green hover:bg-green/[0.04]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green/10 text-green">
          <IconUsers size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-text">Users</p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Invite users, assign roles, and remove access.
          </p>
        </div>
        <IconChevronRight size={18} className="shrink-0 text-hint" />
      </Link>
      <Link
        href="/admin/integrations"
        className="flex items-center gap-3.5 rounded-lg border border-border bg-surface p-5 text-left transition-colors hover:border-green hover:bg-green/[0.04]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green/10 text-green">
          <IconPlugConnected size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-text">Integrations</p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Connect CMMS/CRM systems for live facilities data.
          </p>
        </div>
        <IconChevronRight size={18} className="shrink-0 text-hint" />
      </Link>
    </div>
  );
}
