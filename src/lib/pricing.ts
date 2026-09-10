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