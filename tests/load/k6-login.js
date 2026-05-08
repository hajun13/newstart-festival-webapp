import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    opening_login: {
      executor: "constant-vus",
      vus: 500,
      duration: "1m"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["avg<1000", "p(95)<3000"]
  }
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";

export default function loginScenario() {
  const team = String((__VU % 30) + 1).padStart(2, "0");
  const login = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ code: `TEAM-${team}-KEY` }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(login, { "login ok": (res) => res.status === 200 });
  const dashboard = http.get(`${BASE_URL}/api/dashboard?teamId=team-${team}`);
  check(dashboard, { "dashboard ok": (res) => res.status === 200 });
  sleep(1);
}
