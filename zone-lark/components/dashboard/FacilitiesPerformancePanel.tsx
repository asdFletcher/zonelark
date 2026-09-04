import { IconPlugConnected } from "@tabler/icons-react";
import Link from "next/link";

/**
 * "Facilities Performance" twin module — SLA/CRM-relationship metrics (Phase 3/4). Deliberately
 * shows an honest empty state rather than fabricated numbers until a CMMS/CRM connection exists
 * and has synced at least once (lib/integrations/pipeline.ts writes cmms_work_orders /
 * crm_service_requests, lib/metrics/slaCompliance.ts reads them).
 */
export function FacilitiesPerformancePanel() {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-2.5 p-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <IconPlugConnected size={20} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.7px] text-hint">
        Facilities Performance
      </p>
      <p className="max-w-xs text-[13px] text-muted">
        Connect a CMMS or CRM system to populate work-order SLA compliance and tenant-relationship
        metrics here.
      </p>
      <Link
        href="/admin/integrations"
        className="mt-1 text-[13px] font-medium text-accent hover:underline"
      >
        Connect a system
      </Link>
    </div>
  );
}
