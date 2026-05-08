export const missionCodes = [
  "NUT-30",
  "NUT-50",
  "EXE-50",
  "EXE-80",
  "WTR-30",
  "WTR-80",
  "SUN-50",
  "SUN-80",
  "TMP-50",
  "TMP-80",
  "AIR-30",
  "AIR-80",
  "RST-50",
  "RST-55",
  "TRS-50",
  "TRS-80"
];

export function createTeams() {
  return Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    return {
      teamNumber: number,
      name: `NEWSTART ${number}팀`,
      loginCode: `TEAM-${String(number).padStart(2, "0")}-KEY`,
      score: 0,
      tickets: 0,
      finalVerified: false
    };
  });
}

export function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}
