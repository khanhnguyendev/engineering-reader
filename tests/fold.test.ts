import { describe, expect, it } from 'vitest';
import { fold, plainText, toSitePath } from '@/lib/fold';

describe('fold', () => {
  it('strips Vietnamese diacritics and maps đ/Đ', () => {
    expect(fold('Dữ liệu')).toBe('Du lieu');
    expect(fold('Đà Nẵng')).toBe('Da Nang');
  });
  it('folds NFC and NFD input equally', () => {
    const nfc = 'Dữ liệu'.normalize('NFC');
    const nfd = 'Dữ liệu'.normalize('NFD');
    expect(nfc).not.toBe(nfd);
    expect(fold(nfc)).toBe(fold(nfd));
  });
});

describe('plainText', () => {
  it('drops code fences and URLs and strips markdown characters', () => {
    const out = plainText('## Head\n\nSome *em* [link](https://x.y) text\n\n```js\ncode\n```');
    expect(out).toContain('Head');
    expect(out).toContain('Some em link text');
    for (const bad of ['#', '*', '[', 'https', 'code']) expect(out).not.toContain(bad);
  });
});

describe('plainText tags', () => {
  it('strips JSX and HTML tags but keeps their text', () => {
    const out = plainText('Before <Callout kind="note">inside</Callout> and <br/> after <b>bold</b>');
    expect(out).toBe('Before inside and after bold');
  });
});

describe('toSitePath', () => {
  it('removes a trailing .html', () => {
    expect(toSitePath('/vi/posts/a.html')).toBe('/vi/posts/a');
    expect(toSitePath('/vi/posts/a')).toBe('/vi/posts/a');
  });
});
