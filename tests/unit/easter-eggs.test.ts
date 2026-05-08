import { describe, expect, it } from "vitest";
import { claimEasterEgg, createDefaultState, getTeamProgress, grantAdminAward } from "@/lib/state";

describe("easter eggs and admin awards", () => {
  it("히든 QR은 같은 QR 중복 지급 없이 팀당 최대 3개까지만 점수 인정한다", () => {
    let state = createDefaultState();
    state = claimEasterEgg(state, "team-01", "EGG-01").state;
    state = claimEasterEgg(state, "team-01", "EGG-01").state;
    state = claimEasterEgg(state, "team-01", "EGG-02").state;
    state = claimEasterEgg(state, "team-01", "EGG-03").state;
    state = claimEasterEgg(state, "team-01", "EGG-04").state;
    expect(getTeamProgress(state, "team-01").score).toBe(90);
    expect(state.easterEggClaims).toHaveLength(4);
  });

  it("숨은 운영진 보너스는 팀당 1회만 지급한다", () => {
    let state = createDefaultState();
    const first = grantAdminAward({
      state,
      teamId: "team-01",
      awardType: "hidden_staff",
      title: "숨은 운영진",
      points: 50,
      awardedBy: "admin"
    });
    expect(first.ok).toBe(true);
    state = first.state;
    const second = grantAdminAward({
      state,
      teamId: "team-01",
      awardType: "hidden_staff",
      title: "숨은 운영진",
      points: 50,
      awardedBy: "admin"
    });
    expect(second.ok).toBe(false);
    expect(getTeamProgress(second.state, "team-01").score).toBe(50);
  });
});
