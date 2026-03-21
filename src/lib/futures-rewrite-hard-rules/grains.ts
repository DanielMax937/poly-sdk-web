import type { HardRule } from './types';

export const GRAINS_RULE: HardRule = {
  id: 'grains',
  match: ['wheat', '小麦', 'corn', '玉米', 'soybean', '大豆'],
  terms: ['Black Sea', 'Ukraine', 'Russia', 'USDA', 'Brazil', 'Argentina'],
};
