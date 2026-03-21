import type { HardRule } from './types';
import { ALUMINA_RULE } from './alumina';
import { COPPER_RULE } from './copper';
import { CRUDE_OIL_RULE } from './crude-oil';
import { CRYPTO_RULE } from './crypto';
import { GRAINS_RULE } from './grains';
import { IRON_ORE_RULE } from './iron-ore';
import { MACRO_RATES_RULE } from './macro-rates';
import { NATURAL_GAS_RULE } from './natural-gas';
import { PRECIOUS_METALS_RULE } from './precious-metals';
import { SHIPPING_RULE } from './shipping';

/** All variety rules in evaluation order (multiple rules may apply; seeds are merged). */
export const FUTURES_REWRITE_HARD_RULES: HardRule[] = [
  CRUDE_OIL_RULE,
  MACRO_RATES_RULE,
  IRON_ORE_RULE,
  ALUMINA_RULE,
  COPPER_RULE,
  NATURAL_GAS_RULE,
  GRAINS_RULE,
  PRECIOUS_METALS_RULE,
  CRYPTO_RULE,
  SHIPPING_RULE,
];
