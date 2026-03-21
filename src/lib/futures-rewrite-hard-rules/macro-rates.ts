import type { HardRule } from './types';

/**
 * Fed / rates / US macro — from Polymarket snapshot high-liquidity themes (Fed tag + geopolitics co-occurrence).
 * Complements commodity rules when the query is policy-first.
 */
export const MACRO_RATES_RULE: HardRule = {
  id: 'macro-rates',
  match: [
    'fed',
    'fomc',
    'powell',
    'warsh',
    'federal reserve',
    'treasury',
    'treasury yield',
    'rate cut',
    'rate hike',
    '美联储主席',
    '美联储',
    '加息',
    '降息',
  ],
  terms: [
    'Federal Reserve',
    'FOMC',
    'Treasury',
    'United States',
    'Russia',
    'Ukraine',
    'Iran',
    'NATO',
    'Gaza',
    'Serbia',
  ],
};
