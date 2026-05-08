import { mkdirSync, writeFileSync } from "node:fs";
import { createTeams, missionCodes } from "./mock-data.mjs";

const state = {
  teams: createTeams(),
  missions: missionCodes,
  easterEggs: Array.from({ length: 10 }, (_, index) => `EGG-${String(index + 1).padStart(2, "0")}`),
  announcements: ["운영본부 공지"]
};

mkdirSync("backup", { recursive: true });
writeFileSync("backup/local-seed.json", JSON.stringify(state, null, 2));

console.log(`teams=${state.teams.length}`);
console.log(`missions=${state.missions.length}`);
console.log(`easter_eggs=${state.easterEggs.length}`);
console.log("backup/local-seed.json written");
