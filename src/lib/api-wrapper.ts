import { NextRequest, NextResponse } from 'next/server';
import { createRequestId, recordRequest } from '@/lib/monitoring';

export type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

export function withMonitoring(handler: ApiHandler, routeName: string): ApiHandler {
  return async (request: NextRequest) => {
    const start = Date.now();
    const requestId = createRequestId();

    try {
      const response = await handler(request);
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-as-of', new Date().toISOString());

      await recordRequest({
        route: routeName,
        method: request.method,
        status: response.status,
        durationMs: Date.now() - start,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      await recordRequest({
        route: routeName,
        method: request.method,
        status: 500,
        durationMs: Date.now() - start,
        timestamp: Date.now(),
      });

      console.error(`[API] ${routeName} failed:`, error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
