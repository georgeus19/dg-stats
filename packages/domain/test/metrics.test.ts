import { describe, expect, it } from "vitest";
import { calculateRate, combineRates } from "../src/metrics";

describe("calculateRate", () => {
  it("does not invent a percentage when no opportunities exist", () => {
    expect(calculateRate({ makes: 0, attempts: 0 })).toMatchObject({
      decimal: null,
      display: "—"
    });
  });

  it("aggregates underlying counts instead of averaging round percentages", () => {
    expect(combineRates([{ makes: 1, attempts: 1 }, { makes: 9, attempts: 20 }]))
      .toMatchObject({ makes: 10, attempts: 21, display: "47.6%" });
  });
});
