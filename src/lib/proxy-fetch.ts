/**
 * Enhanced HTTP client for Polymarket APIs
 *
 * Implements reliability improvements based on production testing:
 * 1. Rate limiting with jitter (1.5s base + 0-1s random)
 * 2. Exponential backoff retry on transient failures
 * 3. Browser-like headers to bypass bot detection
 * 4. IPv4 preference (IPv6 to Cloudflare is less reliable)
 * 5. No brotli encoding (causes decode failures on some platforms)
 * 6. Request queuing for serialized API calls
 *
 * Proxy Configuration:
 * - Default: No proxy (direct connection)
 * - Polymarket uses **HTTPS**; Node/undici convention is **HTTPS_PROXY** for https:// origins.
 *   We resolve: **HTTPS_PROXY → HTTP_PROXY → ALL_PROXY** (first non-empty).
 * - Example: `HTTPS_PROXY="http://127.0.0.1:1087" npm run dev`
 * - Local proxy for this repo: **1087** (HTTP CONNECT)
 *
 * Undici: all Polymarket traffic goes through `fetch(..., { dispatcher: ProxyAgent })`.
 * Incoming `options.dispatcher` is stripped so user code cannot disable the proxy.
 */

import { ProxyAgent } from 'undici';

function resolveProxyUrl(): string {
  const raw =
    process.env.HTTPS_PROXY?.trim() ||
    process.env.HTTP_PROXY?.trim() ||
    process.env.ALL_PROXY?.trim() ||
    '';
  if (!raw || raw.toLowerCase() === 'none') return '';
  return raw;
}

// ============================================================================
// Configuration
// ============================================================================

const API_MIN_INTERVAL = 1500; // 1.5s between API calls (ms)
const API_JITTER = 1000; // 0-1s random jitter (ms)
const MAX_RETRIES = 4;
const BASE_RETRY_DELAY = 3000; // 3s initial retry delay

// Retriable error codes (mapped from curl exit codes to fetch behaviors)
const RETRIABLE_ERRORS = new Set([
    'ECONNRESET',    // Connection reset by peer (curl 52)
    'ECONNREFUSED',  // Couldn't connect (curl 7)
    'ETIMEDOUT',     // Connection timeout (curl 28, but usually timeout)
    'ENOTFOUND',     // Could not resolve host (curl 6)
    'EAI_AGAIN',     // Temporary DNS failure
    'EPIPE',         // Broken pipe (curl 55 send failure, curl 56 recv failure)
]);

// ============================================================================
// Browser-like Headers (Critical for bypassing Cloudflare bot detection)
// ============================================================================

const BROWSER_HEADERS: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    // Note: NO Accept-Encoding to avoid brotli decode failures
    'Origin': 'https://polymarket.com',
    'Referer': 'https://polymarket.com/',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
};

// ============================================================================
// Rate Limiter with Jitter
// ============================================================================

class RateLimiter {
    private lastCallTime: number = 0;
    private pendingPromise: Promise<void> | null = null;

    /**
     * Wait before making the next API call.
     * Ensures minimum interval between calls plus random jitter.
     */
    async wait(): Promise<void> {
        // If there's already a pending wait, chain onto it
        if (this.pendingPromise) {
            await this.pendingPromise;
            this.pendingPromise = null;
            return;
        }

        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        const jitter = Math.random() * API_JITTER;
        const requiredWait = API_MIN_INTERVAL + jitter;

        if (timeSinceLastCall < requiredWait) {
            const waitTime = requiredWait - timeSinceLastCall;
            this.pendingPromise = new Promise(resolve => setTimeout(resolve, waitTime));
            await this.pendingPromise;
            this.pendingPromise = null;
        }

        this.lastCallTime = Date.now();
    }

    /**
     * Reset the rate limiter (useful after long idle periods)
     */
    reset(): void {
        this.lastCallTime = 0;
        this.pendingPromise = null;
    }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// ============================================================================
// Proxy Configuration (DEFAULT: NO PROXY)
// ============================================================================

const proxyUrl = resolveProxyUrl();

let dispatcher: ProxyAgent | undefined = undefined;

if (proxyUrl) {
    try {
        const via =
            process.env.HTTPS_PROXY?.trim() ? 'HTTPS_PROXY'
            : process.env.HTTP_PROXY?.trim() ? 'HTTP_PROXY'
            : 'ALL_PROXY';
        console.log(`[ProxyFetch] Using proxy (${via}): ${proxyUrl}`);
        // Object form is explicit for undici v6; string form also supported
        dispatcher = new ProxyAgent({ uri: proxyUrl });
    } catch (e) {
        console.warn('[ProxyFetch] Failed to create ProxyAgent, connecting directly:', e);
    }
} else {
    console.log('[ProxyFetch] No proxy — set HTTPS_PROXY or HTTP_PROXY for Polymarket (HTTPS)');
}

// ============================================================================
// Enhanced Fetch with Retry Logic
// ============================================================================

interface FetchOptions extends RequestInit {
    retryCount?: number;
}

function isRetriableError(error: unknown): boolean {
    if (error instanceof Error) {
        // Check for retriable error codes
        if (RETRIABLE_ERRORS.has(error.name as string)) {
            return true;
        }
        // Check for common network error patterns
        const message = error.message.toLowerCase();
        return (
            message.includes('econnreset') ||
            message.includes('etimedout') ||
            message.includes('econnrefused') ||
            message.includes('enotfound') ||
            message.includes('socket hang up') ||
            message.includes('fetch failed') ||
            message.includes('network error')
        );
    }
    return false;
}

function calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 3s, 6s, 12s, 24s + jitter
    const exponentialDelay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // 0-1s jitter
    return exponentialDelay + jitter;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Core fetch implementation with retry logic
 */
async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
    const retryCount = options.retryCount ?? 0;

    try {
        const { dispatcher: _ignoreUserDispatcher, retryCount: _rc, ...rest } = options as FetchOptions & {
            dispatcher?: unknown;
        };

        // Never let a caller-supplied dispatcher bypass our ProxyAgent (undici merges init.dispatcher)
        const fetchOptions: RequestInit & { dispatcher?: ProxyAgent } = {
            ...rest,
            ...(dispatcher ? { dispatcher } : {}),
        };

        const response = await fetch(url, fetchOptions);
        return response;
    } catch (error) {
        // Check if this is a retriable error
        if (retryCount < MAX_RETRIES && isRetriableError(error)) {
            const delay = calculateRetryDelay(retryCount);
            console.warn(
                `[ProxyFetch] Retriable error, retrying in ${(delay / 1000).toFixed(1)}s ` +
                `(attempt ${retryCount + 1}/${MAX_RETRIES}):`,
                error instanceof Error ? error.message : error
            );

            await sleep(delay);

            // Retry with incremented counter
            return fetchWithRetry(url, { ...options, retryCount: retryCount + 1 });
        }

        // Either max retries reached or non-retriable error
        throw error;
    }
}

// ============================================================================
// Public API
// ============================================================================

export interface ProxyFetchOptions extends RequestInit {
    /**
     * Skip rate limiting for this request (use sparingly!)
     */
    skipRateLimit?: boolean;
    /**
     * Custom headers to merge with browser headers
     */
    customHeaders?: Record<string, string>;
    /**
     * Next.js revalidate option (for API route caching)
     */
    next?: { revalidate?: number | false };
}

/**
 * Enhanced fetch wrapper for Polymarket APIs
 *
 * Features:
 * - Automatic rate limiting with jitter (1.5s + 0-1s random)
 * - Exponential backoff retry on transient failures
 * - Browser-like headers to bypass bot detection
 * - IPv4 preference for reliability (via NODE_OPTIONS)
 * - Optional proxy support via HTTP_PROXY env variable
 *
 * Proxy Usage (optional):
 *   Set HTTPS_PROXY (preferred for https:// Polymarket) or HTTP_PROXY / ALL_PROXY
 *   Example: HTTPS_PROXY="http://127.0.0.1:1087" npm run dev
 *
 * @example
 * ```ts
 * // Direct connection (default)
 * const response = await proxyFetch('https://gamma-api.polymarket.com/markets');
 * const data = await response.json();
 *
 * // With custom headers
 * const response = await proxyFetch(url, {
 *   customHeaders: { 'X-Custom-Header': 'value' }
 * });
 *
 * // Skip rate limiting (use sparingly)
 * const response = await proxyFetch(url, { skipRateLimit: true });
 * ```
 */
export async function proxyFetch(
    url: string,
    options: ProxyFetchOptions = {}
): Promise<Response> {
    const { skipRateLimit = false, customHeaders, headers: optionHeaders, ...fetchOptions } = options;

    // Apply rate limiting unless explicitly skipped
    if (!skipRateLimit) {
        await rateLimiter.wait();
    }

    // Merge browser headers with custom headers
    const mergedHeaders = new Headers();
    Object.entries(BROWSER_HEADERS).forEach(([key, value]) => {
        mergedHeaders.set(key, value);
    });
    if (customHeaders) {
        Object.entries(customHeaders).forEach(([key, value]) => {
            mergedHeaders.set(key, value);
        });
    }
    if (optionHeaders) {
        const headersToMerge = optionHeaders instanceof Headers
            ? optionHeaders
            : Array.isArray(optionHeaders)
                ? optionHeaders
                : Object.entries(optionHeaders);

        if (headersToMerge instanceof Headers) {
            headersToMerge.forEach((value, key) => mergedHeaders.set(key, value));
        } else if (Array.isArray(headersToMerge)) {
            headersToMerge.forEach(([key, value]) => mergedHeaders.set(key, value as string));
        } else {
            Object.entries(headersToMerge).forEach(([key, value]) =>
                mergedHeaders.set(key, value as string)
            );
        }
    }

    // Override Accept-Encoding if present to avoid brotli issues
    mergedHeaders.delete('Accept-Encoding');

    try {
        const response = await fetchWithRetry(url, {
            ...fetchOptions,
            headers: mergedHeaders,
        });

        return response as unknown as Response;
    } catch (error) {
        console.error('[ProxyFetch] Request failed:', {
            url,
            error: error instanceof Error ? error.message : error,
        });
        throw error;
    }
}

/**
 * Reset the rate limiter state
 * Useful after long idle periods or when switching contexts
 */
export function resetRateLimiter(): void {
    rateLimiter.reset();
}

/**
 * Get current rate limiter stats
 */
export function getRateLimiterStats() {
    return {
        minInterval: API_MIN_INTERVAL,
        jitter: API_JITTER,
        maxRetries: MAX_RETRIES,
    };
}

/**
 * Get proxy configuration status
 */
export function getProxyConfig() {
    return {
        proxyUrl: proxyUrl || null,
        usingProxy: !!dispatcher,
        message: dispatcher ? `Using proxy: ${proxyUrl}` : 'No proxy - direct connection',
        /** Which env was used (for debugging) */
        source: process.env.HTTPS_PROXY?.trim()
            ? 'HTTPS_PROXY'
            : process.env.HTTP_PROXY?.trim()
              ? 'HTTP_PROXY'
              : process.env.ALL_PROXY?.trim()
                ? 'ALL_PROXY'
                : null,
    };
}
