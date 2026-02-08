export type AgeBounds = {
  minYears?: number;
  maxYears?: number;
};

const EMPTY_TOKENS = ["", "n/a", "na", "not applicable", "not specified"];

export function normalizeAgeBounds(
  rawMin?: string,
  rawMax?: string
): AgeBounds {
  const minYears = parseAgeToYears(rawMin) ?? parseKeywordMin(rawMin);
  const maxYears = parseAgeToYears(rawMax) ?? parseKeywordMax(rawMax);

  return {
    minYears,
    maxYears,
  };
}

function parseAgeToYears(raw?: string): number | undefined {
  if (!raw) return;
  const normalized = raw.trim().toLowerCase();
  if (EMPTY_TOKENS.includes(normalized)) return;

  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return;

  if (normalized.includes("month")) {
    return roundToTwo(value / 12);
  }
  if (normalized.includes("week")) {
    return roundToTwo(value / 52);
  }
  if (normalized.includes("day")) {
    return roundToTwo(value / 365);
  }

  return value;
}

function parseKeywordMin(raw?: string): number | undefined {
  if (!raw) return;
  const normalized = raw.trim().toLowerCase();
  if (normalized.includes("older adult")) return 65;
  if (normalized.includes("adult")) return 18;
  if (normalized.includes("child") || normalized.includes("pediatric"))
    return 0;
  return;
}

function parseKeywordMax(raw?: string): number | undefined {
  if (!raw) return;
  const normalized = raw.trim().toLowerCase();
  if (normalized.includes("child") || normalized.includes("pediatric"))
    return 17;
  if (normalized.includes("adult")) return 64;
  return;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
