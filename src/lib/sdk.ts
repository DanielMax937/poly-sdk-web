/**
 * Server-side SDK singleton instance
 * Used by API routes to access Polymarket data
 */
import { PolymarketSDK } from '@catalyst-team/poly-sdk';

// Singleton instance for server-side usage
let sdkInstance: PolymarketSDK | null = null;

export function getSDK(): PolymarketSDK {
  if (!sdkInstance) {
    sdkInstance = new PolymarketSDK();
  }
  return sdkInstance;
}

// Re-export types for convenience
export type {
  GammaMarket,
  GammaEvent,
  Position,
  Activity,
  Trade,
  LeaderboardEntry,
  LeaderboardPage,
} from '@catalyst-team/poly-sdk';
