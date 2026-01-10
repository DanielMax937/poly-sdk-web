/**
 * Polymarket Order Client
 * Provides authenticated order management using @polymarket/clob-client
 * 
 * Environment variables required:
 * - POLY_PRIVATE_KEY: Wallet private key
 * - POLY_API_KEY: L2 API key
 * - POLY_API_SECRET: L2 API secret
 * - POLY_API_PASSPHRASE: L2 API passphrase
 * - POLY_SIGNATURE_TYPE: 0=EOA, 1=Gnosis Safe, 2=MagicLink (default: 0)
 * - POLY_FUNDER_ADDRESS: Optional funder address
 */

import { ClobClient, Side, OrderType } from '@polymarket/clob-client';
import { Wallet } from 'ethers';

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon mainnet

// Types
export interface OrderParams {
    tokenId: string;
    price: number;
    size: number;
    side: 'BUY' | 'SELL';
    orderType?: 'GTC' | 'GTD' | 'FOK' | 'FAK';
    expiration?: number; // For GTD orders, Unix timestamp
    postOnly?: boolean;
}

export interface OrderResponse {
    success: boolean;
    orderId?: string;
    status?: string;
    errorMsg?: string;
    transactionsHashes?: string[];
}

export interface OpenOrder {
    id: string;
    market: string;
    asset_id: string;
    side: 'BUY' | 'SELL';
    price: string;
    original_size: string;
    size_matched: string;
    outcome: string;
    owner: string;
    expiration: string;
    type: string;
    created_at: number;
}

export interface ApiCredentials {
    apiKey: string;
    secret: string;
    passphrase: string;
}

// Check if credentials are configured
export function hasOrderCredentials(): boolean {
    return !!(
        process.env.POLY_PRIVATE_KEY &&
        process.env.POLY_API_KEY &&
        process.env.POLY_API_SECRET &&
        process.env.POLY_API_PASSPHRASE
    );
}

// Create authenticated client
export function createOrderClient(): ClobClient | null {
    const privateKey = process.env.POLY_PRIVATE_KEY;
    const apiKey = process.env.POLY_API_KEY;
    const apiSecret = process.env.POLY_API_SECRET;
    const apiPassphrase = process.env.POLY_API_PASSPHRASE;
    const signatureType = parseInt(process.env.POLY_SIGNATURE_TYPE || '0', 10);

    if (!privateKey || !apiKey || !apiSecret || !apiPassphrase) {
        return null;
    }

    const signer = new Wallet(privateKey);
    const funderAddress = process.env.POLY_FUNDER_ADDRESS || signer.address;

    return new ClobClient(
        CLOB_HOST,
        CHAIN_ID,
        signer,
        { key: apiKey, secret: apiSecret, passphrase: apiPassphrase },
        signatureType,
        funderAddress
    );
}

// Order API
export const orderApi = {
    /**
     * Check if order credentials are configured
     */
    isConfigured(): boolean {
        return hasOrderCredentials();
    },

    /**
     * Get wallet address from configured credentials
     */
    async getWalletAddress(): Promise<string | null> {
        const privateKey = process.env.POLY_PRIVATE_KEY;
        if (!privateKey) return null;
        const signer = new Wallet(privateKey);
        return signer.address;
    },

    /**
     * Create and place a new order
     */
    async createOrder(params: OrderParams): Promise<OrderResponse> {
        const client = createOrderClient();
        if (!client) {
            return { success: false, errorMsg: 'Order credentials not configured' };
        }

        try {
            // Get market info for tick size
            const market = await client.getMarket(params.tokenId);

            // Map order type - only GTC and GTD supported in createAndPostOrder
            const orderType = params.orderType === 'GTD' ? OrderType.GTD : OrderType.GTC;

            const response = await client.createAndPostOrder(
                {
                    tokenID: params.tokenId,
                    price: params.price,
                    size: params.size,
                    side: params.side === 'BUY' ? Side.BUY : Side.SELL,
                    expiration: params.expiration,
                },
                {
                    tickSize: market.minimum_tick_size,
                    negRisk: market.neg_risk || false,
                },
                orderType
            );

            return {
                success: response.success,
                orderId: response.orderID,
                status: response.status,
                errorMsg: response.errorMsg,
                transactionsHashes: response.transactionsHashes,
            };
        } catch (error) {
            return {
                success: false,
                errorMsg: (error as Error).message,
            };
        }
    },

    /**
     * Cancel an existing order
     */
    async cancelOrder(orderId: string): Promise<{ success: boolean; errorMsg?: string }> {
        const client = createOrderClient();
        if (!client) {
            return { success: false, errorMsg: 'Order credentials not configured' };
        }

        try {
            await client.cancelOrder({ orderID: orderId });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                errorMsg: (error as Error).message,
            };
        }
    },

    /**
     * Cancel all open orders
     */
    async cancelAllOrders(): Promise<{ success: boolean; errorMsg?: string }> {
        const client = createOrderClient();
        if (!client) {
            return { success: false, errorMsg: 'Order credentials not configured' };
        }

        try {
            await client.cancelAll();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                errorMsg: (error as Error).message,
            };
        }
    },

    /**
     * Get all open orders
     */
    async getOpenOrders(): Promise<{ orders: OpenOrder[]; errorMsg?: string }> {
        const client = createOrderClient();
        if (!client) {
            return { orders: [], errorMsg: 'Order credentials not configured' };
        }

        try {
            const orders = await client.getOpenOrders();
            return {
                orders: (orders as unknown as Record<string, unknown>[]).map((o) => ({
                    id: String(o.id || ''),
                    market: String(o.market || ''),
                    asset_id: String(o.asset_id || ''),
                    side: String(o.side || 'BUY') as 'BUY' | 'SELL',
                    price: String(o.price || '0'),
                    original_size: String(o.original_size || '0'),
                    size_matched: String(o.size_matched || '0'),
                    outcome: String(o.outcome || ''),
                    owner: String(o.owner || ''),
                    expiration: String(o.expiration || ''),
                    type: String((o as Record<string, unknown>).order_type || o.type || ''),
                    created_at: Number(o.created_at || 0),
                })),
            };
        } catch (error) {
            return {
                orders: [],
                errorMsg: (error as Error).message,
            };
        }
    },

    /**
     * Get a specific order by ID
     */
    async getOrder(orderId: string): Promise<{ order: OpenOrder | null; errorMsg?: string }> {
        const client = createOrderClient();
        if (!client) {
            return { order: null, errorMsg: 'Order credentials not configured' };
        }

        try {
            const order = await client.getOrder(orderId) as unknown as Record<string, unknown> | null;
            if (!order) {
                return { order: null };
            }
            return {
                order: {
                    id: String(order.id || ''),
                    market: String(order.market || ''),
                    asset_id: String(order.asset_id || ''),
                    side: String(order.side || 'BUY') as 'BUY' | 'SELL',
                    price: String(order.price || '0'),
                    original_size: String(order.original_size || '0'),
                    size_matched: String(order.size_matched || '0'),
                    outcome: String(order.outcome || ''),
                    owner: String(order.owner || ''),
                    expiration: String(order.expiration || ''),
                    type: String(order.order_type || order.type || ''),
                    created_at: Number(order.created_at || 0),
                },
            };
        } catch (error) {
            return {
                order: null,
                errorMsg: (error as Error).message,
            };
        }
    },

    /**
     * Get user's trade history
     */
    async getTrades(): Promise<{ trades: Record<string, unknown>[]; errorMsg?: string }> {
        const client = createOrderClient();
        if (!client) {
            return { trades: [], errorMsg: 'Order credentials not configured' };
        }

        try {
            const trades = await client.getTrades();
            return { trades: trades as unknown as Record<string, unknown>[] };
        } catch (error) {
            return {
                trades: [],
                errorMsg: (error as Error).message,
            };
        }
    },
};
