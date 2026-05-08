import { accessSync } from "node:fs";
import { spawnSync } from "node:child_process";

const scripts = [
  "tests/load/k6-login.js",
  "tests/load/k6-mission-submit.js",
  "tests/load/k6-final-verification.js"
];

for (const script of scripts) {
  accessSync(script);
}

const hasK6 = spawnSync("k6", ["version"], { stdio: "ignore" }).status === 0;
if (!hasK6) {
  console.log("k6 is not installed; load scripts are present and syntax-checkable by k6 in CI/ops environment.");
  process.exit(0);
}

for (const script of scripts) {
  const result = spawnSync("k6", ["run", "--vus", "1", "--iterations", "1", script], {
    stdio: "inherit",
    env: { ...process.env, BASE_URL: process.env.BASE_URL ?? "http://127.0.0.1:3000" }
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
