/**
 * Pull Polymarket Gamma events by theme tags, aggregate liquidity-weighted stats
 * (countries, geo phrases, tokens) to inform futures hard-rule seeds.
 *
 * Run: npm run snapshot:themes
 */

import {
  COUNTRY_NAMES,
  GEO_PHRASES,
  STOPWORDS,
  THEME_TAG_SUBSTRINGS,
} from '../data/polymarket-geolex';
import { gammaApi, type GammaEvent, type GammaTag } from './sdk';

export type ThemeSnapshotOptions = {
  /** Max tags to query (after filter) */
  maxTags?: number;
  /** Max events to collect per tag */
  maxEventsPerTag?: number;
  /** Page size for /events pagination */
  eventPageSize?: number;
};

export type ThemeSnapshotReport = {
  generatedAt: string;
  source: string;
  options: Required<ThemeSnapshotOptions>;
  tagSelection: {
    totalTagsFetched: number;
    matchedTagCount: number;
    tags: Array<{ id: string; slug: string; label: string }>;
  };
  events: {
    totalRows: number;
    uniqueEventIds: number;
    byTagId: Record<string, number>;
  };
  topEventsByLiquidity: Array<{
    title: string;
    slug: string;
    liquidity: number;
    volume24hr: number;
    tagId: string;
  }>;
  tokenCounts: Array<{ token: string; count: number }>;
  countryMentions: Array<{ term: string; count: number }>;
  geoMentions: Array<{ term: string; count: number }>;
  /** Heuristic: top English tokens that may become `match` or `terms` in hard rules */
  suggestedSeedsForHardRules: Array<{
    note: string;
    topLiquidityTokens: string[];
    topCountryTerms: string[];
    topGeoTerms: string[];
  }>;
  notes: string[];
};

const DEFAULT_OPTS: Required<ThemeSnapshotOptions> = {
  maxTags: 24,
  maxEventsPerTag: 120,
  eventPageSize: 50,
};

export function tagMatchesTheme(tag: GammaTag): boolean {
  const slug = tag.slug.toLowerCase();
  const label = tag.label.toLowerCase();
  return THEME_TAG_SUBSTRINGS.some((s) => slug.includes(s) || label.includes(s));
}

export async function fetchAllTags(): Promise<GammaTag[]> {
  const all: GammaTag[] = [];
  let offset = 0;
  const limit = 500;
  for (;;) {
    const batch = await gammaApi.getTags({ limit, offset });
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return all;
}

export async function fetchEventsForTag(
  tagId: string,
  opts: Required<ThemeSnapshotOptions>
): Promise<GammaEvent[]> {
  const out: GammaEvent[] = [];
  let offset = 0;
  while (out.length < opts.maxEventsPerTag) {
    const take = Math.min(opts.eventPageSize, opts.maxEventsPerTag - out.length);
    const base = {
      tag_id: tagId,
      limit: take,
      offset,
      active: true,
      closed: false,
    } as const;
    let batch: GammaEvent[] = [];
    try {
      batch = await gammaApi.getEvents({
        ...base,
        order: 'volume24hr',
        ascending: false,
      });
    } catch {
      batch = await gammaApi.getEvents(base);
    }
    if (batch.length === 0) break;
    out.push(...batch);
    if (batch.length < take) break;
    offset += take;
  }
  return out;
}

function countPhraseInText(lowerText: string, phrase: string): number {
  const t = phrase.toLowerCase();
  if (!t) return 0;
  let idx = 0;
  let c = 0;
  while ((idx = lowerText.indexOf(t, idx)) !== -1) {
    c++;
    idx += t.length;
  }
  return c;
}

function aggregateTitleText(events: Array<{ title: string; description?: string }>): {
  tokenCounts: Map<string, number>;
  countryMentions: Map<string, number>;
  geoMentions: Map<string, number>;
} {
  const tokenCounts = new Map<string, number>();
  const countryMentions = new Map<string, number>();
  const geoMentions = new Map<string, number>();

  const geoOrdered = [...GEO_PHRASES].sort((a, b) => b.length - a.length);
  const countryOrdered = [...COUNTRY_NAMES].sort((a, b) => b.length - a.length);

  for (const e of events) {
    const blob = `${e.title} ${e.description || ''}`.toLowerCase();

    for (const g of geoOrdered) {
      const n = countPhraseInText(blob, g);
      if (n > 0) geoMentions.set(g, (geoMentions.get(g) || 0) + n);
    }

    for (const c of countryOrdered) {
      const n = countPhraseInText(blob, c);
      if (n > 0) countryMentions.set(c, (countryMentions.get(c) || 0) + n);
    }

    const words = blob.split(/[^a-z0-9]+/i).filter((w) => w.length >= 3);
    for (const w of words) {
      const t = w.toLowerCase();
      if (STOPWORDS.has(t)) continue;
      tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
    }
  }

  return { tokenCounts, countryMentions, geoMentions };
}

function sortMapDesc(m: Map<string, number>, limit: number): Array<{ term: string; count: number }> {
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

function sortTokenMap(m: Map<string, number>, limit: number): Array<{ token: string; count: number }> {
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token, count]) => ({ token, count }));
}

export async function buildThemeSnapshotReport(
  options: ThemeSnapshotOptions = {}
): Promise<ThemeSnapshotReport> {
  const opts = { ...DEFAULT_OPTS, ...options };
  const notes: string[] = [];

  const allTags = await fetchAllTags();
  const matched = allTags.filter(tagMatchesTheme).slice(0, opts.maxTags);

  if (matched.length === 0) {
    notes.push('No tags matched THEME_TAG_SUBSTRINGS — widen filters in src/data/polymarket-geolex.ts');
  }

  const byTagId: Record<string, number> = {};
  const eventMap = new Map<string, GammaEvent & { tagId: string }>();

  for (const tag of matched) {
    try {
      const evs = await fetchEventsForTag(tag.id, opts);
      byTagId[tag.id] = evs.length;
      for (const e of evs) {
        if (!eventMap.has(e.id)) {
          eventMap.set(e.id, { ...e, tagId: tag.id });
        }
      }
    } catch (err) {
      notes.push(`tag ${tag.slug} (${tag.id}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const merged = [...eventMap.values()];
  const { tokenCounts, countryMentions, geoMentions } = aggregateTitleText(merged);

  const topByLiq = [...merged]
    .sort((a, b) => b.liquidity - a.liquidity)
    .slice(0, 40)
    .map((e) => ({
      title: e.title,
      slug: e.slug,
      liquidity: e.liquidity,
      volume24hr: e.volume24hr,
      tagId: e.tagId,
    }));

  const topTokens = sortTokenMap(tokenCounts, 80);
  const topCountries = sortMapDesc(countryMentions, 40);
  const topGeo = sortMapDesc(geoMentions, 40);

  const topLiquidityTokenSet = new Set<string>();
  for (const e of merged.sort((a, b) => b.liquidity - a.liquidity).slice(0, 200)) {
    const words = e.title.split(/[^a-z0-9]+/i).filter((w) => w.length >= 4);
    for (const w of words) {
      const t = w.toLowerCase();
      if (!STOPWORDS.has(t)) topLiquidityTokenSet.add(t);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    source: 'https://gamma-api.polymarket.com',
    options: opts,
    tagSelection: {
      totalTagsFetched: allTags.length,
      matchedTagCount: matched.length,
      tags: matched.map((t) => ({ id: t.id, slug: t.slug, label: t.label })),
    },
    events: {
      totalRows: merged.length,
      uniqueEventIds: eventMap.size,
      byTagId,
    },
    topEventsByLiquidity: topByLiq,
    tokenCounts: topTokens,
    countryMentions: topCountries,
    geoMentions: topGeo,
    suggestedSeedsForHardRules: [
      {
        note:
          'Use topCountryTerms / topGeoTerms as `terms` in futures-rewrite-hard-rules/*.ts; add `match` from commodity + high-frequency tokens.',
        topLiquidityTokens: [...topLiquidityTokenSet].slice(0, 40),
        topCountryTerms: topCountries.slice(0, 25).map((x) => x.term),
        topGeoTerms: topGeo.slice(0, 25).map((x) => x.term),
      },
    ],
    notes,
  };
}
