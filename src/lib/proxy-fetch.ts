import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

// 1. Define proxy URL (Clash: 7890, V2Ray: 10809, User: 1087)
// Note: Set HTTP_PROXY='' to bypass proxy and connect directly
const proxyUrl = process.env.HTTP_PROXY || '';

// 2. Create Agent (only if proxy is configured and not empty)
let agent: HttpsProxyAgent | undefined = undefined;
try {
    if (proxyUrl && proxyUrl !== '' && proxyUrl !== 'none') {
        agent = new HttpsProxyAgent(proxyUrl);
    }
} catch (e) {
    console.warn('Failed to create proxy agent, connecting directly:', e);
}

/**
 * Browser-like headers to bypass anti-bot detection
 * Mimics a real Chrome browser request to Polymarket APIs
 */
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': 'https://polymarket.com',
    'Referer': 'https://polymarket.com/',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'Connection': 'keep-alive',
};

/**
 * Fetch wrapper that routes requests through a local proxy (optional)
 * and uses browser-like headers to bypass anti-bot detection
 */
export async function proxyFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
        const fetchOptions: any = {
            ...options,
            // Only add agent if proxy is configured
            ...(agent ? { agent } : {}),
            // Use HTTP/2 if supported
            http2: true,
            headers: {
                ...BROWSER_HEADERS,
                ...options.headers,
                // Preserve Content-Type if provided in options
                ...(options.headers && typeof options.headers === 'object' && 'Content-Type' in options.headers
                    ? { 'Content-Type': (options.headers as any)['Content-Type'] }
                    : {}),
            }
        };

        const response = await fetch(url, fetchOptions);

        return response as unknown as Response;
    } catch (error) {
        console.error('ProxyFetch error:', error);
        throw error;
    }
}
