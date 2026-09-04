"use client";

import { IconLoader2, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { UserRole } from "@/lib/supabase/database.types";

const ROLES: UserRole[] = ["admin", "regional", "ownership", "individual"];

interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isSiteAdmin: boolean;
  createdAt: string;
}

const fieldClass =
  "w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("individual");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users.");
      setUsers(data.users);
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to load users.",
        type: "err",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite user.");
      setInviteEmail("");
      setMessage({ text: `Invited ${inviteEmail}.`, type: "ok" });
      load();
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to invite user.",
        type: "err",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      setMessage({ text: "Failed to update role.", type: "err" });
      load();
    }
  };

  const handleRemove = async (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ text: data.error || "Failed to remove user.", type: "err" });
      load();
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-5">
      <div>
        <p className="text-lg font-semibold text-text">Users</p>
        <p className="mt-0.5 text-[13px] text-muted">
          Invite teammates and control what they can see and do.
        </p>
      </div>

      <form
        onSubmit={handleInvite}
        className="flex flex-wrap items-end gap-2.5 rounded-lg border border-border bg-surface p-4"
      >
        <div className="min-w-[220px] flex-1">
          <div className="mb-0.5 text-[11px] text-muted">Email</div>
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@company.com"
            className={fieldClass}
          />
        </div>
        <div>
          <div className="mb-0.5 text-[11px] text-muted">Role</div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className={fieldClass}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="primary" className="w-auto" disabled={inviting}>
          {inviting ? <IconLoader2 size={16} className="animate-spin" /> : "Invite"}
        </Button>
      </form>

      {message && <StatusMessage message={message.text} type={message.type} />}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {loading ? (
          <p className="p-5 text-center text-[13px] text-hint">Loading...</p>
        ) : users.length === 0 ? (
          <p className="p-5 text-center text-[13px] text-hint">No users yet — invite one above.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.5px] text-hint">
                <th className="px-4 py-2.5 font-semibold">Email</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <p className="text-text">{u.email ?? "—"}</p>
                    {u.displayName && <p className="text-[11px] text-hint">{u.displayName}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className={fieldClass}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(u.id)}
                      className="text-hint transition-colors hover:text-red-600"
                      aria-label={`Remove ${u.email}`}
                    >
                      <IconTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
