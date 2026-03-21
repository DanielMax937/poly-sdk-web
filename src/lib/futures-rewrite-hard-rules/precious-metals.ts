import type { HardRule } from './types';

export const PRECIOUS_METALS_RULE: HardRule = {
  id: 'precious-metals',
  match: ['gold', '黄金', 'silver', '白银'],
  terms: [
    'Fed',
    'Federal Reserve',
    'FOMC',
    'Treasury',
    'real yields',
    'dollar',
    'safe haven',
  ],
};
