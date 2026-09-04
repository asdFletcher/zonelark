export interface MetricResult {
  key: string;
  value: number;
  definitionVersion: string;
  metadata?: Record<string, unknown>;
}
