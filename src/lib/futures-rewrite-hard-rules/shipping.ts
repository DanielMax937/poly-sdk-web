import type { HardRule } from './types';

export const SHIPPING_RULE: HardRule = {
  id: 'shipping',
  match: ['shipping', '航运', 'freight', '运价'],
  terms: ['Suez', 'Panama', 'Red Sea', 'Gaza', 'container', 'Baltic Dry'],
};
