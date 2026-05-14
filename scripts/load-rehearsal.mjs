const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_VUS = 40;
const DEFAULT_DURATION_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_ITERATION_DELAY_MS = 1000;

const nutritionAnswers = {
  "n-mc1": "철분 흡수를 돕고 항산화 작용을 한다",
  "n-mc2": "고혈압",
  "n-mc3": "빈혈",
  "n-mc4": "야맹증",
  "n-mc5": "산소 운반",
  "n-mc6": "철분",
  "n-mc7": "비타민 D",
  "n-mc8": "비타민 C",
  "n-mc9": "충치와 체중 증가",
  "n-mc10": "식이섬유 - 혈액 속 산소 운반",
  "n-ox1": "O",
  "n-ox2": "O",
  "n-ox3": "X",
  "n-ox4": "O",
  "n-ox5": "O",
  "n-ox6": "O",
  "n-ox7": "O",
  "n-ox8": "O",
  "n-ox9": "O",
  "n-ox10": "O"
};

function parseArgs(argv) {
  const result = {
    baseUrl: process.env.BASE_URL || DEFAULT_BASE_URL,
    vus: Number(process.env.VUS || DEFAULT_VUS),
    durationSeconds: Number(process.env.DURATION_SECONDS || DEFAULT_DURATION_SECONDS),
    write: process.env.WRITE === "true",
    iterationDelayMs: Number(process.env.ITERATION_DELAY_MS || DEFAULT_ITERATION_DELAY_MS)
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base") result.baseUrl = argv[++index];
    else if (arg === "--vus") result.vus = Number(argv[++index]);
    else if (arg === "--duration") result.durationSeconds = Number(argv[++index]);
    else if (arg === "--delay") result.iterationDelayMs = Number(argv[++index]);
    else if (arg === "--write") result.write = true;
    else if (arg === "--help") {
      console.log("Usage: node scripts/load-rehearsal.mjs [--base URL] [--vus 40] [--duration 60] [--delay 1000] [--write]");
      process.exit(0);
    }
  }
  return result;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, index))];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function teamCodeFor(vu) {
  return String((vu % 30) + 1).padStart(2, "0");
}

function extractCookie(response) {
  const setCookie = response.headers.get("set-cookie");
  return setCookie ? setCookie.split(";")[0] : "";
}

async function request(metrics, label, url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = performance.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const duration = performance.now() - started;
    metrics.push({
      label,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      duration
    });
    return response;
  } catch (error) {
    const duration = performance.now() - started;
    metrics.push({
      label,
      status: 0,
      ok: false,
      duration,
      error: error instanceof Error ? error.message : "request failed"
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function virtualUser({ baseUrl, write, endAt, vu, metrics, iterationDelayMs }) {
  const team = teamCodeFor(vu);
  const login = await request(metrics, "login", `${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: `TEAM-${team}-KEY` })
  });
  const cookie = login ? extractCookie(login) : "";
  const loginBody = login ? await login.json().catch(() => null) : null;
  const teamId = loginBody?.team?.id;
  if (!login?.ok || !cookie || !teamId) {
    return;
  }
  while (Date.now() < endAt) {
    const headers = cookie ? { Cookie: cookie } : {};
    await request(metrics, "dashboard", `${baseUrl}/api/dashboard?teamId=${encodeURIComponent(teamId)}`, { headers });
    await request(metrics, "mission_lookup", `${baseUrl}/api/missions/NUT-30`, { headers });
    await request(metrics, "code_page", `${baseUrl}/code`, { headers });
    if (write) {
      await request(metrics, "quiz_submit", `${baseUrl}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          teamId,
          missionCode: "NUT-30",
          answerJson: { answers: nutritionAnswers },
          filePaths: []
        })
      });
    }
    await sleep(iterationDelayMs);
  }
}

function printSummary(metrics, options) {
  const total = metrics.length;
  const failed = metrics.filter((item) => !item.ok).length;
  const durations = metrics.map((item) => item.duration);
  console.log("");
  console.log("Load rehearsal summary");
  console.log(`base=${options.baseUrl}`);
  console.log(`vus=${options.vus} duration=${options.durationSeconds}s write=${options.write} delay=${options.iterationDelayMs}ms`);
  console.log(`requests=${total} failed=${failed} failRate=${total ? ((failed / total) * 100).toFixed(2) : "0.00"}%`);
  const maxDuration = durations.reduce((max, item) => Math.max(max, item), 0);
  console.log(`latency avg=${Math.round(durations.reduce((sum, item) => sum + item, 0) / Math.max(1, durations.length))}ms p50=${Math.round(percentile(durations, 50))}ms p95=${Math.round(percentile(durations, 95))}ms max=${Math.round(maxDuration)}ms`);
  const labels = [...new Set(metrics.map((item) => item.label))];
  for (const label of labels) {
    const group = metrics.filter((item) => item.label === label);
    const groupDurations = group.map((item) => item.duration);
    const groupFailed = group.filter((item) => !item.ok).length;
    const statuses = group.reduce((map, item) => {
      map[item.status] = (map[item.status] ?? 0) + 1;
      return map;
    }, {});
    console.log(
      `${label}: count=${group.length} failed=${groupFailed} p95=${Math.round(percentile(groupDurations, 95))}ms statuses=${JSON.stringify(statuses)}`
    );
  }
  const thresholdFailed = total ? failed / total > 0.01 : true;
  const thresholdSlow = percentile(durations, 95) > 3000;
  if (thresholdFailed || thresholdSlow) {
    console.error("FAIL: threshold exceeded. Target failRate <= 1%, p95 <= 3000ms.");
    process.exit(1);
  }
  console.log("PASS: threshold met. Target failRate <= 1%, p95 <= 3000ms.");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const metrics = [];
  const endAt = Date.now() + options.durationSeconds * 1000;
  console.log(`Starting load rehearsal: ${options.vus} VUs for ${options.durationSeconds}s`);
  console.log(options.write ? "WRITE MODE: quiz submissions will be created/updated." : "READ MODE: login/dashboard/mission lookup only.");
  await Promise.all(
    Array.from({ length: options.vus }, (_, index) =>
      virtualUser({ ...options, vu: index, endAt, metrics })
    )
  );
  printSummary(metrics, options);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
