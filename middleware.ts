import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { authConfig } from 'lib/auth.config';

const store: Record<string, { count: number; timestamp: number; blockUntil: number }> = {};

export const middleware = (req: NextRequest) => {
  //
  let res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith('/setting') && req.method === 'POST') {
    const forwardedFor = headers().get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(':')[0] : headers().get('x-real-ip');

    if (!ip) {
      return res;
    }

    const now = Date.now();
    const windowMs = 60 * 1000;
    const blockDuration = 15 * 60 * 1000;
    const max = 60;

    if (!store[ip] || (now > store[ip].timestamp && now > store[ip].blockUntil)) {
      store[ip] = { count: 1, timestamp: now + windowMs, blockUntil: 0 };
    } else if (store[ip].count < max) {
      store[ip].count++;
    } else {
      store[ip].blockUntil = now + blockDuration;
      res = NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }
  }

  return res;
};

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
