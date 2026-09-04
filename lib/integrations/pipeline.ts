import "server-only";

import { MockCmmsAdapter, MockCrmAdapter } from "@/lib/integrations/adapters/mock";
import { CmmsAdapter, CrmAdapter } from "@/lib/integrations/types";

export const CMMS_ADAPTERS: Record<string, CmmsAdapter> = { mock: new MockCmmsAdapter() };
export const CRM_ADAPTERS: Record<string, CrmAdapter> = { mock: new MockCrmAdapter() };
