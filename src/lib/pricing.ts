export const MONTHLY_TRANSACTIONS = 30000;
export const BANK_FEE_RATE = 0.0125;
export const PLATFORM_FEE_RATE = 0.0045;
export const BANK_TXN_FEE = 0.25;
export const PLATFORM_TXN_FEE = 0.04;
export const BANK_FIXED_FEE = 2500;

export function volumeTier(monthlyVolume: number): number {
  return Math.max(1, Math.min(4, Math.floor(monthlyVolume / 5_000_000) + 1));
}

export function bankMonthlyCost(monthlyVolume: number): number {
  return (
    monthlyVolume * BANK_FEE_RATE +
    (monthlyVolume / MONTHLY_TRANSACTIONS) * BANK_TXN_FEE +
    BANK_FIXED_FEE
  );
}

export function platformMonthlyCost(monthlyVolume: number): number {
  return (
    monthlyVolume * PLATFORM_FEE_RATE +
    (monthlyVolume / MONTHLY_TRANSACTIONS) * PLATFORM_TXN_FEE
  );
}

export function monthlySavings(monthlyVolume: number): number {
  return Math.max(0, bankMonthlyCost(monthlyVolume) - platformMonthlyCost(monthlyVolume));
}

export function annualSavings(monthlyVolume: number): number {
  return monthlySavings(monthlyVolume) * 12;
}

export function savingsPercentage(monthlyVolume: number): number {
  const bank = bankMonthlyCost(monthlyVolume);
  if (bank <= 0) return 0;
  return (monthlySavings(monthlyVolume) / bank) * 100;
}

export function avgTransactionSize(monthlyVolume: number): number {
  return monthlyVolume / MONTHLY_TRANSACTIONS;
}

export const OPS_HOURS_PER_MONTH = 60;
export const OPS_HOURLY_COST = 85;
export const FX_SPREAD_RATE = 0.002;
export const PLATFORM_FX_RATE = 0.0006;
export const FLOAT_DAYS_SAVED = 1.5;
export const FLOAT_YIELD_RATE = 0.038;

export function opsMonthlyCost(): number {
  return OPS_HOURS_PER_MONTH * OPS_HOURLY_COST;
}

export function fxMonthlyCost(monthlyVolume: number, fxExposurePct = 0.4): number {
  return monthlyVolume * fxExposurePct * FX_SPREAD_RATE;
}

export function platformFxMonthlyCost(monthlyVolume: number, fxExposurePct = 0.4): number {
  return monthlyVolume * fxExposurePct * PLATFORM_FX_RATE;
}

export function legacyMonthlyCost(monthlyVolume: number, fxExposurePct = 0.4): number {
  return bankMonthlyCost(monthlyVolume) + opsMonthlyCost() + fxMonthlyCost(monthlyVolume, fxExposurePct);
}

export function mizanMonthlyCost(monthlyVolume: number, fxExposurePct = 0.4): number {
  return platformMonthlyCost(monthlyVolume) + platformFxMonthlyCost(monthlyVolume, fxExposurePct);
}

export function costImpactAnnual(monthlyVolume: number, fxExposurePct = 0.4): number {
  return (legacyMonthlyCost(monthlyVolume, fxExposurePct) - mizanMonthlyCost(monthlyVolume, fxExposurePct)) * 12;
}

export function costImpactPct(monthlyVolume: number, fxExposurePct = 0.4): number {
  const legacy = legacyMonthlyCost(monthlyVolume, fxExposurePct);
  if (legacy <= 0) return 0;
  return ((legacy - mizanMonthlyCost(monthlyVolume, fxExposurePct)) / legacy) * 100;
}

export function floatBenefitMonthly(monthlyVolume: number): number {
  return (monthlyVolume / 30) * FLOAT_DAYS_SAVED * (FLOAT_YIELD_RATE / 12);
}