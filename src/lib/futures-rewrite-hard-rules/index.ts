/**
 * Step 1 of query rewrite: deterministic seed terms by commodity variety.
 * Add or edit one file per variety under this directory, then register in `rules.ts`.
 */

export type { HardRule } from './types';
export { FUTURES_REWRITE_HARD_RULES } from './rules';
export { getHardRuleSeedTerms, getHardRuleMatchDetails, type HardRuleMatchDetail } from './seed-terms';

export { CRUDE_OIL_RULE } from './crude-oil';
export { MACRO_RATES_RULE } from './macro-rates';
export { IRON_ORE_RULE } from './iron-ore';
export { ALUMINA_RULE } from './alumina';
export { COPPER_RULE } from './copper';
export { NATURAL_GAS_RULE } from './natural-gas';
export { GRAINS_RULE } from './grains';
export { PRECIOUS_METALS_RULE } from './precious-metals';
export { CRYPTO_RULE } from './crypto';
export { SHIPPING_RULE } from './shipping';
