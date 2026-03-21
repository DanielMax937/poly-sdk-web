function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** English/ASCII pattern: use word boundary for short tokens to avoid false positives */
function matchesAsciiPattern(queryLower: string, pattern: string): boolean {
  const p = pattern.toLowerCase();
  if (p.length <= 4 && /^[a-z][a-z0-9+-]*$/i.test(pattern)) {
    return new RegExp(`\\b${escapeRegex(p)}\\b`, 'i').test(queryLower);
  }
  return queryLower.includes(p);
}

export function matchesPattern(query: string, pattern: string): boolean {
  const q = query.trim();
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(pattern)) {
    return q.includes(pattern);
  }
  return matchesAsciiPattern(q.toLowerCase(), pattern);
}
