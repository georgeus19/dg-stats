export type MakeAttempt = {
  makes: number;
  attempts: number;
};

export type Rate = MakeAttempt & {
  decimal: number | null;
  display: string;
};

export function calculateRate({ makes, attempts }: MakeAttempt): Rate {
  if (!Number.isInteger(makes) || !Number.isInteger(attempts) || makes < 0 || attempts < 0) {
    throw new Error("Makes and attempts must be non-negative integers.");
  }

  if (makes > attempts) {
    throw new Error("Makes cannot exceed attempts.");
  }

  if (attempts === 0) {
    return { makes, attempts, decimal: null, display: "—" };
  }

  const decimal = makes / attempts;
  return {
    makes,
    attempts,
    decimal,
    display: `${(decimal * 100).toFixed(1)}%`
  };
}

export function combineRates(observations: readonly MakeAttempt[]): Rate {
  return calculateRate(
    observations.reduce(
      (total, observation) => ({
        makes: total.makes + observation.makes,
        attempts: total.attempts + observation.attempts
      }),
      { makes: 0, attempts: 0 }
    )
  );
}
