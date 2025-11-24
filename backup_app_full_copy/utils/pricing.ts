export const FEE_RATE = 0.2;

export function feeCents(workerAmountCents: number): number {
  return Math.round(workerAmountCents * FEE_RATE);
}

export function employerTotalCents(workerAmountCents: number): number {
  return workerAmountCents + feeCents(workerAmountCents);
}

export function euro(cents: number): string {
  return (cents / 100).toFixed(2) + ' €';
}