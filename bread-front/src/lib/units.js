/**
 * Canonical unit list — the SINGLE source of truth for measurement units
 * across the whole app (recipes, pantry, grocery).
 *
 * Units MUST be selected from this fixed list, never free-typed. Free-typed
 * units (e.g. "tablespoon" vs "tbsp" vs "Tbsp") make pantry reduction
 * impossible because the same unit can't be matched across entries.
 *
 * If you need a new unit, add it HERE and it appears everywhere.
 */
export const UNITS = [
  "oz",
  "lbs",
  "cups",
  "tbsp",
  "tsp",
  "pcs",
  "slices",
  "cloves",
  "cans",
  "liters",
  "ml",
  "kg",
  "g",
];

export const DEFAULT_UNIT = "pcs";
