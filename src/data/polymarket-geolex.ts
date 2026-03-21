/**
 * Lexicon for Polymarket theme snapshot: country / geo / finance keywords (English).
 * Used to count mentions in event titles — longest phrases first for naive matching.
 */

/** Multi-word geo / risk phrases (match before single-word countries where relevant) */
export const GEO_PHRASES: string[] = [
  'Strait of Hormuz',
  'Strait of Gibraltar',
  'South China Sea',
  'Red Sea',
  'Black Sea',
  'Gulf of Oman',
  'Persian Gulf',
  'Arabian Gulf',
  'Suez Canal',
  'Panama Canal',
  'Middle East',
  'Latin America',
  'North Korea',
  'South Korea',
  'United States',
  'United Kingdom',
  'Saudi Arabia',
  'New Zealand',
  'Hong Kong',
  'European Union',
  'Central Bank',
  'Federal Reserve',
  'Wall Street',
];

/** Common English country / region names (Polymarket titles are English-first) */
export const COUNTRY_NAMES: string[] = [
  'Afghanistan', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belarus',
  'Belgium', 'Brazil', 'Bulgaria', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia',
  'Cuba', 'Czech Republic', 'Denmark', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia',
  'Finland', 'France', 'Germany', 'Ghana', 'Greece', 'Guinea', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Malaysia',
  'Mexico', 'Morocco', 'Myanmar', 'Netherlands', 'Nigeria', 'Norway', 'Pakistan', 'Palestine',
  'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa',
  'Spain', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tanzania', 'Thailand',
  'Tunisia', 'Turkey', 'UAE', 'Ukraine', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam',
  'Yemen', 'Zimbabwe', 'NATO', 'OPEC', 'Gaza', 'Crimea', 'Donbas',
];

/** Tag slug / label substrings — if any match, tag is considered “theme-relevant” for snapshot */
export const THEME_TAG_SUBSTRINGS: string[] = [
  'politic', 'election', 'congress', 'senate', 'president', 'trump', 'biden',
  'finance', 'econom', 'fed', 'stock', 'market', 'trade', 'tariff',
  'crypto', 'bitcoin', 'ethereum',
  'geopolit', 'world', 'international', 'global', 'foreign',
  'middle-east', 'middle east', 'israel', 'gaza', 'ukraine', 'russia', 'china',
  'oil', 'energy', 'commodit', 'climate',
];

export const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'as', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'this', 'that', 'these', 'those', 'it', 'its', 'from', 'with', 'than', 'then', 'what',
  'when', 'where', 'who', 'which', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so', 'too', 'very',
  'just', 'into', 'over', 'after', 'before', 'between', 'through', 'during', 'about',
  'against', 'below', 'above', 'up', 'down', 'out', 'off', 'if', 'any', 'new', 'vs',
]);
