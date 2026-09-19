import { describe, it, expect } from "vitest";
import {
  MONTHLY_TRANSACTIONS,
  volumeTier,
  bankMonthlyCost,
  platformMonthlyCost,
  monthlySavings,
  annualSavings,
  savingsPercentage,
  avgTransactionSize,
  opsMonthlyCost,
  fxMonthlyCost,
  platformFxMonthlyCost,
  legacyMonthlyCost,
  mizanMonthlyCost,
  costImpactAnnual,
  costImpactPct,
  floatBenefitMonthly,
} from "./pricing";

describe("volumeTier", () => {
  it("floors at tier 1", () => {
    expect(volumeTier(0)).toBe(1);
    expect(volumeTier(1_000)).toBe(1);
  });

  it("scales with volume", () => {
    expect(volumeTier(5_000_000)).toBe(2);
    expect(volumeTier(10_000_000)).toBe(3);
    expect(volumeTier(15_000_000)).toBe(4);
  });

  it("caps at tier 4", () => {
    expect(volumeTier(100_000_000)).toBe(4);
  });
});

describe("monthly cost model", () => {
  const volume = 12_000_000;

  it("platform is always cheaper than traditional banking", () => {
    expect(platformMonthlyCost(volume)).toBeLessThan(bankMonthlyCost(volume));
  });

  it("savings is strictly positive", () => {
    expect(monthlySavings(volume)).toBeGreaterThan(0);
  });

  it("annual savings is 12x monthly", () => {
    expect(annualSavings(volume)).toBeCloseTo(monthlySavings(volume) * 12, 6);
  });

  it("percentage is within a sensible range", () => {
    const pct = savingsPercentage(volume);
    expect(pct).toBeGreaterThan(40);
    expect(pct).toBeLessThan(80);
  });

  it("avg transaction size matches the constant", () => {
    expect(avgTransactionSize(volume)).toBeCloseTo(volume / MONTHLY_TRANSACTIONS, 2);
  });
});

describe("edge cases", () => {
  it("zero volume yields positive fixed bank cost and zero platform cost", () => {
    expect(bankMonthlyCost(0)).toBeGreaterThan(0);
    expect(platformMonthlyCost(0)).toBeCloseTo(0, 6);
  });
});

describe("cost impact model", () => {
  const volume = 12_000_000;

  it("fx costs scale with exposure", () => {
    expect(fxMonthlyCost(volume, 1)).toBeCloseTo(fxMonthlyCost(volume, 0.5) * 2, 6);
  });

  it("mizan fx execution is cheaper than legacy spread", () => {
    expect(platformFxMonthlyCost(volume)).toBeLessThan(fxMonthlyCost(volume));
  });

  it("ops cost is fixed per month", () => {
    expect(opsMonthlyCost()).toBe(60 * 85);
  });

  it("legacy stack totals more than the mizan stack", () => {
    expect(legacyMonthlyCost(volume)).toBeGreaterThan(mizanMonthlyCost(volume));
  });

  it("annual impact is 12x the monthly delta", () => {
    const expected = (legacyMonthlyCost(volume) - mizanMonthlyCost(volume)) * 12;
    expect(costImpactAnnual(volume)).toBeCloseTo(expected, 6);
  });

  it("impact percentage sits in a sensible range and grows with fx exposure", () => {
    expect(costImpactPct(volume)).toBeGreaterThan(40);
    expect(costImpactPct(volume)).toBeLessThan(85);
    expect(costImpactPct(volume, 0.8)).toBeGreaterThan(costImpactPct(volume, 0.1));
  });

  it("float benefit is positive and small relative to volume", () => {
    const float = floatBenefitMonthly(volume);
    expect(float).toBeGreaterThan(0);
    expect(float).toBeLessThan(volume / 20);
  });
});