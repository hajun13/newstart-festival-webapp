import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    final_verification: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1m",
      duration: "1m",
      preAllocatedVUs: 50,
      maxVUs: 120
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["avg<1000", "p(95)<3000"]
  }
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";

export default function finalVerificationScenario() {
  const team = String((__VU % 30) + 1).padStart(2, "0");
  const result = http.post(
    `${BASE_URL}/api/final`,
    JSON.stringify({ teamId: `team-${team}` }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(result, { "final handled": (res) => [200, 400].includes(res.status) });
  sleep(1);
}
