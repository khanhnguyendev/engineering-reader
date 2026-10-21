// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { parsePost, readRawPost, type PostRecord } from '@/lib/content/load';
import type { Vocab } from '@/lib/content/vocab';
import { getDictionary } from '@/lib/dictionaries';
import { Monogram } from '@/components/monogram';
import { PostCard } from '@/components/post-card';
import { PostList } from '@/components/post-list';
import { PageIntro } from '@/components/page-intro';
import { SectionHeading } from '@/components/section-heading';

// "server-only" is resolved by Next's bundler; under vitest it is an empty module.
vi.mock('server-only', () => ({}));

const GOOD = path.resolve(import.meta.dirname, '../fixtures/posts/good-post');
const post = parsePost(readRawPost(GOOD)).post as PostRecord;
// Inline vocab: these tests must not move when content/*.json changes.
const vocab: Vocab = {
  companies: [
    {
      slug: 'discord',
      name: 'Discord',
      blogUrl: 'https://discord.com/blog',
      feedUrl: 'https://discord.com/blog/rss.xml',
      brandColor: '#5865F2',
      logo: 'public/logos/discord.svg',
    },
  ],
  topics: [{ slug: 'data', vi: 'Dữ liệu', en: 'Data' }],
  tags: [],
  series: {},
  sourceHosts: [],
  featured: [],
};
const discord = vocab.companies.find((c) => c.slug === 'discord')!;
const dict = getDictionary('vi');

function dom(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
}

describe('Monogram', () => {
  it('is a hidden rounded square with the bold first letter in the brand colour', () => {
    const el = dom(renderToStaticMarkup(<Monogram name="discord" color="#5865F2" />))
      .firstElementChild as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.className).toContain('rounded-md');
    expect(el.className).toContain('border-hairline');
    expect(el.className).toContain('bg-panel');
    expect(el.className).not.toContain('rounded-full');
    expect(el.textContent).toBe('D');
    expect(el.style.color).toBe('rgb(88, 101, 242)');
    expect(el.style.borderColor).toBe('');
    expect(el.style.width).toBe('32px');
  });

  it('falls back to ink without a colour and honours size', () => {
    const el = dom(renderToStaticMarkup(<Monogram name="x" size={24} />)).firstElementChild as HTMLElement;
    expect(el.className).toContain('text-ink');
    expect(el.style.color).toBe('');
    expect(el.style.width).toBe('24px');
  });
});

describe('PostCard', () => {
  const html = renderToStaticMarkup(
    <PostCard post={post} locale="vi" company={discord} topicLabel="Dữ liệu" dict={dict} />,
  );
  const root = dom(html);
  const li = root.firstElementChild as HTMLElement;
  const a = li.querySelector('a')!;

  it('is a list item whose whole card is one panel link', () => {
    expect(li.tagName).toBe('LI');
    expect(li.querySelectorAll('a')).toHaveLength(1);
    expect(a.getAttribute('href')).toBe('/vi/posts/good-post');
    expect(a.className.split(' ')).toContain('panel');
  });

  it('puts the brand colour on the monogram letter only', () => {
    expect(html.match(/#5865F2|rgb\(88, ?101, ?242\)/gi)).toHaveLength(1);
    const mark = a.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(mark.textContent).toBe('D');
    expect(mark.style.color).toBe('rgb(88, 101, 242)');
    const name = [...a.querySelectorAll('.mono-label')].find((e) => e.textContent === 'Discord');
    expect(name).toBeDefined();
  });

  it('sets the title bold and clamped to two lines', () => {
    const title = [...a.querySelectorAll('*')].find(
      (e) => e.textContent === post.locales.vi!.frontmatter.title,
    ) as HTMLElement;
    expect(title).toBeDefined();
    expect(title.className).toContain('font-bold');
    expect(title.className).toContain('line-clamp-2');
  });

  it('shows the first key number in mono with its label, and the read time', () => {
    const k = post.meta.keyNumbers[0];
    const value = [...a.querySelectorAll('.font-mono')].find((e) => e.textContent === k.value);
    expect(value?.className).toContain('text-lg');
    expect(a.textContent).toContain(post.locales.vi!.frontmatter.keyNumberLabels[k.id]);
    expect(a.textContent).toContain(`${post.locales.vi!.readingTime.whole} phút đọc`);
  });

  it('renders the topic as an outlined chip', () => {
    const chip = [...a.querySelectorAll('*')].find((e) => e.textContent === 'Dữ liệu') as HTMLElement;
    for (const c of ['border', 'border-hairline-strong', 'rounded-md', 'px-2', 'text-xs']) {
      expect(chip.className.split(' ')).toContain(c);
    }
    expect(chip.className).not.toContain('accent');
  });
});

describe('PostList', () => {
  it('renders a two-column grid of cards with company and topic from vocab', () => {
    const html = renderToStaticMarkup(
      <PostList posts={[post]} locale="en" vocab={vocab} dict={getDictionary('en')} emptyLabel="None" />,
    );
    const ul = dom(html).firstElementChild as HTMLElement;
    expect(ul.tagName).toBe('UL');
    expect(ul.className).toBe('grid gap-4 sm:grid-cols-2');
    expect(ul.querySelectorAll('li')).toHaveLength(1);
    expect(ul.textContent).toContain('Discord');
    expect(ul.textContent).toContain('Data');
    expect(ul.querySelector('a')!.getAttribute('href')).toBe('/en/posts/good-post');
  });

  it('renders the empty label as muted text when there are no posts', () => {
    const html = renderToStaticMarkup(
      <PostList posts={[]} locale="vi" vocab={vocab} dict={dict} emptyLabel="Chưa có bài nào." />,
    );
    expect(html).toBe('<p class="text-muted">Chưa có bài nào.</p>');
  });

  it('renders the empty label when no post has the locale', () => {
    const viOnly: PostRecord = { ...post, locales: { vi: post.locales.vi } };
    const html = renderToStaticMarkup(
      <PostList posts={[viOnly]} locale="en" vocab={vocab} dict={getDictionary('en')} emptyLabel="None yet." />,
    );
    expect(html).toBe('<p class="text-muted">None yet.</p>');
  });
});

describe('PageIntro', () => {
  it('is a header with an h1 and an ink-2 dek', () => {
    const header = dom(renderToStaticMarkup(<PageIntro title="Công ty" dek="Một dòng." />))
      .firstElementChild as HTMLElement;
    expect(header.tagName).toBe('HEADER');
    expect(header.firstElementChild!.tagName).toBe('H1');
    expect(header.querySelector('h1')!.textContent).toBe('Công ty');
    const p = header.querySelector('p')!;
    expect(p.className).toContain('text-ink-2');
    expect(p.textContent).toBe('Một dòng.');
  });
});

describe('SectionHeading', () => {
  it('renders only an h2 when there is no link', () => {
    const row = dom(renderToStaticMarkup(<SectionHeading title="Mới nhất" />)).firstElementChild as HTMLElement;
    expect(row.firstElementChild!.tagName).toBe('H2');
    expect(row.querySelector('a')).toBeNull();
  });

  it('adds a mono-label link after the h2 when href is given', () => {
    const row = dom(
      renderToStaticMarkup(<SectionHeading title="Mới nhất" href="/vi/posts" hrefLabel="Tất cả →" />),
    ).firstElementChild as HTMLElement;
    expect(row.className).toContain('flex');
    expect(row.firstElementChild!.tagName).toBe('H2');
    const a = row.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('/vi/posts');
    expect(a.className).toContain('mono-label');
    expect(a.textContent).toBe('Tất cả →');
  });

  it('requires hrefLabel whenever href is given (type-level)', () => {
    // @ts-expect-error href without hrefLabel is not a valid prop combination
    const bad = <SectionHeading title="Mới nhất" href="/vi/posts" />;
    expect(bad).toBeDefined();
  });
});
