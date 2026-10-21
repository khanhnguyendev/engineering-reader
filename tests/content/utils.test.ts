import { describe, expect, it } from 'vitest';
import { countWords, readingTime, WPM } from '@/lib/content/reading-time';
import { extractRefs } from '@/lib/content/refs';
import { hostOf, normalizeSourceUrl } from '@/lib/content/normalize-url';

const words = (n: number) => Array.from({ length: n }, () => 'w').join(' ');

describe('reading time', () => {
  it('uses the WPM constants', () => {
    expect(WPM).toEqual({ vi: 200, en: 230 });
  });
  it('vi 1000 words -> 5 min', () => {
    expect(readingTime(words(1000), 'vi')).toEqual({ words: 1000, minutes: 5 });
  });
  it('en 1000 words -> 5 min (ceil)', () => {
    expect(readingTime(words(1000), 'en')).toEqual({ words: 1000, minutes: 5 });
  });
  it('0 words -> 0, 1 word -> 1', () => {
    expect(readingTime('', 'en').minutes).toBe(0);
    expect(readingTime('hi', 'vi').minutes).toBe(1);
  });
  it('ignores fenced code and frontmatter', () => {
    const text = '---\ntitle: x\n---\none two\n```ts\nconst a = 1;\n```\nthree';
    expect(countWords(text)).toBe(3);
  });
  it('ignores source ref tokens', () => {
    expect(countWords('one [S1] two [S2 @32:44]. three [S12 p.7], four')).toBe(4);
  });
});

describe('extractRefs', () => {
  it('extracts refs with and without locators', () => {
    expect(extractRefs('a [S1] b [S2 §3] c [S3 @12:40] d [S4 p.7]')).toEqual([
      { id: 'S1', raw: '[S1]' },
      { id: 'S2', locator: '§3', raw: '[S2 §3]' },
      { id: 'S3', locator: '@12:40', raw: '[S3 @12:40]' },
      { id: 'S4', locator: 'p.7', raw: '[S4 p.7]' },
    ]);
  });
});

describe('normalizeSourceUrl', () => {
  it('lowercases host, strips utm, hash, trailing slash', () => {
    expect(normalizeSourceUrl('https://Discord.com/blog/x/?utm_source=a#top')).toBe(
      'https://discord.com/blog/x',
    );
  });
  it('keeps other params, sorted', () => {
    expect(
      normalizeSourceUrl('https://www.youtube.com/watch?v=CZ3wIuvmHeM&utm_medium=x'),
    ).toBe('https://www.youtube.com/watch?v=CZ3wIuvmHeM');
    expect(normalizeSourceUrl('https://a.com/p?b=2&a=1')).toBe('https://a.com/p?a=1&b=2');
  });
  it('root path has no trailing slash', () => {
    expect(normalizeSourceUrl('https://Discord.com/')).toBe('https://discord.com');
  });
});

describe('hostOf', () => {
  it('returns lowercase hostname', () => {
    expect(hostOf('https://Discord.com/blog')).toBe('discord.com');
  });
});
