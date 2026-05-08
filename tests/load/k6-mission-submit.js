import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    mission_submit: {
      executor: "constant-arrival-rate",
      rate: 200,
      timeUnit: "1m",
      duration: "1m",
      preAllocatedVUs: 80,
      maxVUs: 200
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["avg<1000", "p(95)<3000"]
  }
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";

export default function missionSubmitScenario() {
  const team = String((__VU % 30) + 1).padStart(2, "0");
  const mission = http.get(`${BASE_URL}/api/missions/NUT-30`);
  check(mission, { "mission lookup ok": (res) => res.status === 200 });
  const submit = http.post(
    `${BASE_URL}/api/submissions`,
    JSON.stringify({
      teamId: `team-${team}`,
      missionCode: "NUT-30",
      answerJson: { answers: { n1: "균형", n2: "물", n3: "비타민" } }
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(submit, { "submit ok or idempotent": (res) => [200, 409].includes(res.status) });
  sleep(1);
}
