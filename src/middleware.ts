// =====================================================================
// THE CLEVER TRADER — ENTERPRISE EDGE SECURITY MIDDLEWARE
// Multi-Tier DDoS Shield, Token-Bucket Rate Limiter & Injection Firewall
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

// In-memory sliding window rate-limiting store (Edge Compatible)
const ipRateLimitStore = new Map<string, RateLimitBucket>();

// Clean up stale IP records every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of ipRateLimitStore.entries()) {
    if (now > val.resetTime) {
      ipRateLimitStore.delete(key);
    }
  }
}, 120000);

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ip = request.headers.get('cf-connecting-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             '127.0.0.1';

  // 1. Path Traversal & Injection Payload Firewall
  const rawUrl = request.url || '';
  let decodedUrl = '';
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch {
    decodedUrl = rawUrl;
  }
  const testString = `${rawUrl} ${decodedUrl} ${pathname} ${search}`.toLowerCase();

  const dangerousPatterns = [
    '/etc/passwd',
    'win.ini',
    '<script',
    'javascript:',
    'union select',
    'union%20select',
    'union+select',
    '--;',
    'exec(',
    'eval(',
    'cmd.exe',
    '../',
    '..\\',
  ];

  for (const pattern of dangerousPatterns) {
    if (testString.includes(pattern)) {
      console.warn(`[SECURITY FIREWALL BLOCKED] Malicious pattern "${pattern}" detected from IP: ${ip}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Malicious request signature detected by Clever Trader Security Shield',
          blockedSignature: pattern,
          timestamp: new Date().toISOString(),
        },
        { 
          status: 403, 
          headers: { 
            'X-Content-Type-Options': 'nosniff',
            'X-Edge-Firewall': 'BLOCKED',
          } 
        }
      );
    }
  }

  // 2. Token-Bucket Rate Limiting (Stricter for Trade Execution, Relaxed for Data Streams)
  if (pathname.startsWith('/api/')) {
    // Whitelist localhost/internal IPC traffic so local MT5 bridge, UI polling, and background daemons never get throttled
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return NextResponse.next();
    }

    const isTradeRoute = pathname.includes('/api/auto-trade') || 
                         pathname.includes('/api/orders') || 
                         pathname.includes('/api/webhook');

    // 40 req/min for sensitive trading & webhooks, 180 req/min for real-time rates/ticks
    const maxRequestsPerMinute = isTradeRoute ? 40 : 180;
    const windowMs = 60000;
    const now = Date.now();

    const bucketKey = `${ip}:${isTradeRoute ? 'trade' : 'data'}`;
    const bucket = ipRateLimitStore.get(bucketKey);

    if (!bucket || now > bucket.resetTime) {
      ipRateLimitStore.set(bucketKey, { count: 1, resetTime: now + windowMs });
    } else {
      bucket.count++;
      if (bucket.count > maxRequestsPerMinute) {
        const retryAfterSec = Math.ceil((bucket.resetTime - now) / 1000);
        console.warn(`[RATE LIMIT EXCEEDED] IP ${ip} throttled on ${pathname}. Count: ${bucket.count}`);
        
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Too Many Requests: Rate limit exceeded. Throttled to preserve execution stability.',
            retryAfterSeconds: retryAfterSec,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfterSec),
              'X-RateLimit-Limit': String(maxRequestsPerMinute),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    }
  }

  // 3. Forward request with security tracking headers
  const response = NextResponse.next();
  response.headers.set('X-Edge-Shield', 'Active');
  response.headers.set('X-Security-Policy', 'OWASP-HedgeFund-Grade');
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
