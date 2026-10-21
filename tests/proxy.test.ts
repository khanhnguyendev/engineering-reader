import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

describe('proxy', () => {
  it('redirects / to /vi with 308 and keeps the query string', () => {
    const res = proxy(new NextRequest('https://example.com/?utm_source=x'));
    expect(res.status).toBe(308);
    const loc = new URL(res.headers.get('location')!);
    expect(loc.pathname + loc.search).toBe('/vi?utm_source=x');
    expect(res.headers.get('location')).toBe('https://example.com/vi?utm_source=x');
  });

  it('redirects bare / to /vi', () => {
    const res = proxy(new NextRequest('https://example.com/'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://example.com/vi');
  });
});
