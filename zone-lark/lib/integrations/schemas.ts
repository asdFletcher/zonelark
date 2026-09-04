/**
 * Vendor-agnostic normalized shapes a CmmsAdapter/CrmAdapter syncs into. Field names are chosen
 * for what Zone Lark's metrics need (see lib/metrics/slaCompliance.ts's opened_at/responded_at/
 * closed_at usage), not to mirror any specific vendor's real API — the vendor is undecided.
 */
import { z } from "zod";

export const NormalizedAssetSchema = z.object({
  external_id: z.string(),
  name: z.string(),
  status: z.string().default("active"),
});
export type NormalizedAsset = z.infer<typeof NormalizedAssetSchema>;

export const NormalizedWorkOrderSchema = z.object({
  external_id: z.string(),
  priority: z.string().default("normal"),
  status: z.string().default("open"),
  opened_at: z.string(),
  responded_at: z.string().optional(),
  closed_at: z.string().optional(),
});
export type NormalizedWorkOrder = z.infer<typeof NormalizedWorkOrderSchema>;

export const NormalizedTenantRecordSchema = z.object({
  external_id: z.string(),
  name: z.string(),
  status: z.string().default("active"),
});
export type NormalizedTenantRecord = z.infer<typeof NormalizedTenantRecordSchema>;

export const NormalizedServiceRequestSchema = z.object({
  external_id: z.string(),
  status: z.string().default("open"),
  opened_at: z.string(),
  closed_at: z.string().optional(),
});
export type NormalizedServiceRequest = z.infer<typeof NormalizedServiceRequestSchema>;
