import "server-only";

import {
  NormalizedAsset,
  NormalizedServiceRequest,
  NormalizedTenantRecord,
  NormalizedWorkOrder,
} from "@/lib/integrations/schemas";

export type ConnectionConfig = Record<string, unknown>;

export interface AuthResult {
  ok: boolean;
  message?: string;
}

export interface SyncContext {
  connectionId: string;
  orgId: string;
  config: ConnectionConfig;
}

export interface CmmsAdapter {
  readonly key: string;
  authenticate(config: ConnectionConfig): Promise<AuthResult>;
  syncAssets(ctx: SyncContext): Promise<NormalizedAsset[]>;
  syncWorkOrders(ctx: SyncContext): Promise<NormalizedWorkOrder[]>;
}

export interface CrmAdapter {
  readonly key: string;
  authenticate(config: ConnectionConfig): Promise<AuthResult>;
  syncTenantRecords(ctx: SyncContext): Promise<NormalizedTenantRecord[]>;
  syncServiceRequests(ctx: SyncContext): Promise<NormalizedServiceRequest[]>;
}
