import { FUTURES_REWRITE_HARD_RULES } from './rules';
import { matchesPattern } from './match';

export type HardRuleMatchDetail = {
  id?: string;
  matchedPatterns: string[];
  terms: string[];
};

/**
 * Returns English seed terms from hard rules (deduped). No LLM.
 */
export function getHardRuleSeedTerms(query: string): string[] {
  const q = query.trim();
  if (!q) return [];

  const out = new Set<string>();
  for (const rule of FUTURES_REWRITE_HARD_RULES) {
    const hit = rule.match.some((m) => matchesPattern(q, m));
    if (hit) {
      for (const t of rule.terms) out.add(t);
    }
  }
  return [...out];
}

/**
 * Which hard rules fire for a query (for debugging / UX).
 */
export function getHardRuleMatchDetails(query: string): HardRuleMatchDetail[] {
  const q = query.trim();
  if (!q) return [];

  const details: HardRuleMatchDetail[] = [];
  for (const rule of FUTURES_REWRITE_HARD_RULES) {
    const matchedPatterns = rule.match.filter((m) => matchesPattern(q, m));
    if (matchedPatterns.length > 0) {
      details.push({
        id: rule.id,
        matchedPatterns,
        terms: [...rule.terms],
      });
    }
  }
  return details;
}
