import type { HardRule } from './types';

export const IRON_ORE_RULE: HardRule = {
  id: 'iron-ore',
  match: ['iron ore', '铁矿石'],
  terms: ['Australia', 'Brazil', 'China', 'Russia', 'steel', 'Rio Tinto', 'Vale'],
};
