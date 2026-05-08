export function calculateBaseTickets(score: number): number {
  if (score >= 900) return 4;
  if (score >= 700) return 3;
  if (score >= 500) return 2;
  if (score >= 300) return 1;
  return 0;
}

export function calculateTickets(score: number, finalVerified: boolean): number {
  return Math.min(6, calculateBaseTickets(score) + (finalVerified ? 2 : 0));
}
