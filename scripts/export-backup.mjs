import { mkdirSync, writeFileSync } from "node:fs";
import { buildCsv, createTeams } from "./mock-data.mjs";

const teams = createTeams();
mkdirSync("backup", { recursive: true });

writeFileSync(
  "backup/team-scores.csv",
  buildCsv(
    ["team_number", "team_name", "score", "tickets", "final_verified"],
    teams.map((team) => [team.teamNumber, team.name, team.score, team.tickets, team.finalVerified])
  )
);

writeFileSync(
  "backup/submissions.csv",
  buildCsv(["team", "mission", "status", "points", "note"], [])
);

writeFileSync(
  "backup/tickets.csv",
  buildCsv(
    ["team_number", "team_name", "tickets"],
    teams.map((team) => [team.teamNumber, team.name, team.tickets])
  )
);

writeFileSync(
  "backup/manual-score-sheet.md",
  `# NEWSTART 수기 점수표\n\n| 팀 | 점수 | 추첨권 | 비고 |\n|---|---:|---:|---|\n${teams
    .map((team) => `| ${team.teamNumber} ${team.name} |  |  |  |`)
    .join("\n")}\n`
);

console.log("backup/team-scores.csv");
console.log("backup/submissions.csv");
console.log("backup/tickets.csv");
console.log("backup/manual-score-sheet.md");
