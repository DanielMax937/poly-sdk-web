import type { HardRule } from './types';

export const CRYPTO_RULE: HardRule = {
  id: 'crypto',
  match: ['bitcoin', 'btc', 'ethereum', 'eth', '比特币', '以太坊'],
  terms: ['ETF', 'halving', 'mining', 'regulation', 'SEC', 'Treasury'],
};
