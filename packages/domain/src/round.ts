export const providers = ["pdga", "udisc", "native"] as const;
export type Provider = (typeof providers)[number];

export const roundCoverageLevels = [
  "scores_only",
  "aggregate_stats",
  "throw_timeline",
  "partial",
  "complete"
] as const;
export type RoundCoverage = (typeof roundCoverageLevels)[number];

export type MetricDefinition = {
  provider: Provider;
  code: string;
  version: string;
  label: string;
};

export type StatObservation = MetricDefinition & {
  count: number | null;
  opportunityCount: number | null;
  value: number | null;
};
