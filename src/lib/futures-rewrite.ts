import { apiCache } from '@/lib/ttl-cache';
import { getHardRuleSeedTerms } from '@/lib/futures-rewrite-hard-rules';

const DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

/** Max distinct keywords after dedup; used for Polymarket Gamma search expansion */
const MAX_REWRITE_KEYWORDS = 18;

type RewriteResult = {
  keywords: string[];
};

function extractJsonPayload(raw: string): string {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/m.exec(t);
  if (fence) return fence[1].trim();
  return t;
}

function parseRewriteResult(raw: string): RewriteResult {
  const payload = extractJsonPayload(raw);
  try {
    return JSON.parse(payload) as RewriteResult;
  } catch {
    const start = payload.indexOf('{');
    const end = payload.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(payload.slice(start, end + 1)) as RewriteResult;
    }
    throw new Error('Invalid JSON');
  }
}

/** Drop CJK and other non-Latin-heavy strings so Polymarket search stays English-first */
function isEnglishKeyword(s: string): boolean {
  if (!s.trim()) return false;
  return !/[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/.test(s);
}

function normalizeKeywords(items: string[], original: string): string[] {
  const cleaned = items
    .map(s => s.trim())
    .filter(Boolean)
    .filter(isEnglishKeyword);

  if (isEnglishKeyword(original) && !cleaned.includes(original)) cleaned.unshift(original);

  return Array.from(new Set(cleaned)).slice(0, MAX_REWRITE_KEYWORDS);
}

async function callVolcEngine(prompt: string): Promise<string> {
  const apiKey = process.env.VOLC_API_KEY;
  const model = process.env.VOLC_MODEL;
  const baseUrl = process.env.VOLC_BASE_URL || DEFAULT_BASE_URL;

  if (!apiKey || !model) {
    throw new Error('VolcEngine API key or model is not configured');
  }

  const url = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content:
              'You are a commodities, macro, and geopolitical risk research assistant. Expand user queries into **English-only** search keywords for prediction-market discovery. Return a single JSON object only, no markdown.',
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`VolcEngine API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from VolcEngine');
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function buildLlmPromptWithSeeds(query: string, seeds: string[]): string {
  const seedLine = seeds.length > 0
    ? `**Step 1 (already applied by the system — do not repeat these in your output):**
${seeds.join(', ')}

`
    : '';

  const task = seeds.length > 0
    ? `**Step 2 — your task:** Add **additional** English-only keywords beyond the seeds above. Do **not** copy or paraphrase the seed list. Focus on extra synonyms, supply chain, institutions, routes, countries, or policy hooks that still fit the user theme.

Return JSON only:
{ "keywords": ["...", "..."] }

Rules for the **new** keywords only:
- English (Latin script) only; translate concepts if needed.
- At most ${MAX_REWRITE_KEYWORDS} items in this array (seeds are merged separately).
- Order from specific to broader. No duplicates.`
    : `Expand it into keywords for finding prediction markets and news about **futures-related** risk (commodities, shipping, energy, agriculture, metals, macro).

Return JSON only, exactly this shape:
{ "keywords": ["...", "..."] }

Expansion rules (apply what fits the term; skip irrelevant categories):

1. **Core**: Express the user intent in **English** (translate if needed). Add English synonyms, tickers-style names, and chemical symbols if relevant (e.g. Fe, Al2O3).

2. **Commodity / product chain**: Add upstream/downstream where it helps (e.g. iron ore → steel; bauxite → alumina → aluminum; LNG vs pipeline gas).

3. **Producing / exporting countries & regions**: Add major origins or price-setters tied to this market (examples: iron ore → Australia, Brazil; bauxite/alumina → Guinea, Australia; grains → US, Brazil, Black Sea; oil/gas → Middle East, US shale).

4. **Industry & policy**: Add sectors or bodies when they map to futures narratives (e.g. OPEC+, IEA, smelters, miners, refiners, shipping lines) — only when plausibly linked.

5. **Geopolitics, routes, chokepoints**: Add places and routes that commonly drive futures headlines for this theme (e.g. Strait of Hormuz, Red Sea, Iran, sanctions, Suez, Taiwan Strait, Venezuela) — only when linked to energy, shipping, or the commodity in question.

6. **Key people / institutions**: Add **sparingly** (0–2 items): officials or leaders only when markets routinely price their actions (e.g. major central bankers, OPEC ministers) for this theme.

7. **Language**: **Every keyword must be English** (Latin script; standard English names for countries, routes, and institutions). If the user wrote in Chinese or another language, **translate** into the usual English commodity/market terms — do **not** output non-English script.

8. Order keywords from **most specific** to **broader context**. Deduplicate. At most ${MAX_REWRITE_KEYWORDS} keywords.`;

  return `${seedLine}User search term: "${query}"

${task}`;
}

/**
 * Two-step rewrite: (1) hard-coded seed terms from `futures-rewrite-hard-rules/` (per variety),
 * (2) LLM adds more English keywords. Results are merged and deduped (seeds first).
 */
export async function rewriteFuturesQuery(query: string): Promise<string[]> {
  const cacheKey = `rewrite:v2:${query}`;
  return apiCache.getOrSet(cacheKey, 10 * 60 * 1000, async () => {
    const seeds = getHardRuleSeedTerms(query);

    let llmKeywords: string[] = [];
    try {
      const prompt = buildLlmPromptWithSeeds(query, seeds);
      const raw = await callVolcEngine(prompt);
      const parsed = parseRewriteResult(raw);
      if (parsed?.keywords?.length) {
        llmKeywords = parsed.keywords;
      }
    } catch {
      // No VOLC or LLM failure: seeds-only is OK
    }

    const merged = [...seeds, ...llmKeywords];
    const terms = normalizeKeywords(merged, query);
    if (terms.length === 0) return [query];
    return terms;
  });
}
