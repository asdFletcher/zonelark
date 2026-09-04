"use client";

import { IconLoader2, IconRefresh } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";

interface Connection {
  id: string;
  provider_kind: "cmms" | "crm";
  adapter_key: string;
  status: "disconnected" | "connected" | "error";
  last_synced_at: string | null;
}

const fieldClass =
  "w-full rounded-[7px] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-[border-color] focus:border-green";

export default function AdminIntegrationsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerKind, setProviderKind] = useState<"cmms" | "crm">("cmms");
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load connections.");
      setConnections(data.connections);
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to load.", type: "err" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider_kind: providerKind, adapter_key: "mock" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ text: data.error || "Failed to add connection.", type: "err" });
      return;
    }
    setConnections((prev) => [...prev, data.connection]);
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/integrations/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed.");
      setMessage({
        text: `Synced ${data.synced} record${data.synced === 1 ? "" : "s"}.`,
        type: "ok",
      });
      load();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Sync failed.", type: "err" });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-5">
      <div>
        <p className="text-lg font-semibold text-text">CMMS / CRM Integrations</p>
        <p className="mt-0.5 text-[13px] text-muted">
          Connect facilities systems to pull live data into the dashboard. Only a mock adapter is
          available today — real vendor connections plug into the same framework once chosen.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2.5 rounded-lg border border-border bg-surface p-4">
        <div>
          <div className="mb-0.5 text-[11px] text-muted">System type</div>
          <select
            value={providerKind}
            onChange={(e) => setProviderKind(e.target.value as "cmms" | "crm")}
            className={fieldClass}
          >
            <option value="cmms">CMMS</option>
            <option value="crm">CRM</option>
          </select>
        </div>
        <Button variant="primary" className="w-auto" onClick={handleAdd}>
          Add mock connection
        </Button>
      </div>

      {message && <StatusMessage message={message.text} type={message.type} />}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {loading ? (
          <p className="p-5 text-center text-[13px] text-hint">Loading...</p>
        ) : connections.length === 0 ? (
          <p className="p-5 text-center text-[13px] text-hint">
            No connections yet — add one above.
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.5px] text-hint">
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Adapter</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Last synced</th>
                <th className="px-4 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 uppercase text-text">{c.provider_kind}</td>
                  <td className="px-4 py-2.5 text-text">{c.adapter_key}</td>
                  <td className="px-4 py-2.5 capitalize text-text">{c.status}</td>
                  <td className="px-4 py-2.5 text-muted">
                    {c.last_synced_at ? new Date(c.last_synced_at).toLocaleString() : "never"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleSync(c.id)}
                      disabled={syncingId === c.id}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-green hover:underline disabled:opacity-50"
                    >
                      {syncingId === c.id ? (
                        <IconLoader2 size={14} className="animate-spin" />
                      ) : (
                        <IconRefresh size={14} />
                      )}
                      Sync now
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
