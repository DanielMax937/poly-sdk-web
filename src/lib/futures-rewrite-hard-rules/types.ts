/**
 * One rule = one variety: if any `match` string hits the user query, all `terms` become seeds.
 */
export type HardRule = {
  /** Stable id for docs / debugging (optional) */
  id?: string;
  /** If any pattern matches the user query, `terms` are added as seeds */
  match: string[];
  /** English keywords for Polymarket / news search */
  terms: string[];
};
