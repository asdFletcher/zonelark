import "server-only";

import { AssetRecord } from "@/lib/schemas";

interface Job {
  buffer: Buffer;
  assets: AssetRecord[];
}

const jobs = new Map<string, Job>();

/** Process-local store for assess → export workbooks. Asset rows also persist to Postgres when a building is selected. */
export const jobStore = {
  async set(jobId: string, buffer: Buffer, assets: AssetRecord[]): Promise<void> {
    jobs.set(jobId, { buffer, assets });
  },
  async getBuffer(jobId: string): Promise<Buffer | undefined> {
    return jobs.get(jobId)?.buffer;
  },
  async getAssets(jobId: string): Promise<AssetRecord[] | undefined> {
    return jobs.get(jobId)?.assets;
  },
};
