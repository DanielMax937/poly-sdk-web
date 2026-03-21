import type { HardRule } from './types';

export const NATURAL_GAS_RULE: HardRule = {
  id: 'natural-gas',
  match: ['natural gas', 'lng', '天然气'],
  terms: ['Europe', 'LNG', 'Russia', 'Ukraine', 'NATO', 'Henry Hub', 'TTF'],
};
