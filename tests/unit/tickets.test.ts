import { describe, expect, it } from "vitest";
import { calculateTickets } from "@/lib/scoring/calculate-tickets";

describe("calculateTickets", () => {
  it.each([
    [0, false, 0],
    [299, false, 0],
    [300, false, 1],
    [500, false, 2],
    [700, false, 3],
    [900, false, 4],
    [920, true, 6],
    [1200, true, 6]
  ])("%i점 final=%s -> %i장", (score, finalVerified, expected) => {
    expect(calculateTickets(score, finalVerified)).toBe(expected);
  });
});
