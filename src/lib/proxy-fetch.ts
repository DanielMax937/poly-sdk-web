import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

// 1. Define proxy URL (Clash: 7890, V2Ray: 10809, User: 1087)
const proxyUrl = process.env.HTTP_PROXY || 'http://127.0.0.1:1087';

// 2. Create Agent
const agent = new HttpsProxyAgent(proxyUrl);

/**
 * Fetch wrapper that routes requests through a local proxy
 */
export async function proxyFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
        const fetchOptions: any = {
            ...options,
            agent: agent, // Inject agent
            headers: {
                ...options.headers,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(url, fetchOptions);

        return response as unknown as Response;
    } catch (error) {
        console.error('ProxyFetch error:', error);
        throw error;
    }
}
