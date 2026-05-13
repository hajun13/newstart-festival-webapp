const DASH_LIKE_CHARACTERS = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;
const INVISIBLE_CHARACTERS = /[\u200B-\u200D\uFEFF]/g;

export function normalizeTeamLoginCode(value: string) {
  return value
    .normalize("NFKC")
    .replace(DASH_LIKE_CHARACTERS, "-")
    .replace(INVISIBLE_CHARACTERS, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function teamLoginCodeMatches(input: string, expected: string) {
  const normalizedInput = normalizeTeamLoginCode(input);
  const normalizedExpected = normalizeTeamLoginCode(expected);
  return (
    normalizedInput === normalizedExpected ||
    normalizedInput.replaceAll("-", "") === normalizedExpected.replaceAll("-", "")
  );
}
