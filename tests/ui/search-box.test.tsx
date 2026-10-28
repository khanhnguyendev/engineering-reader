// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import vi_dict from '@/dictionaries/vi.json';
import en_dict from '@/dictionaries/en.json';
import { SearchBox } from '@/components/search/search-box';
import { loadPagefind } from '@/components/search/load-pagefind';

vi.mock('@/components/search/load-pagefind', () => ({ loadPagefind: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockLoad = vi.mocked(loadPagefind);

const ROWS = [
  { url: '/vi/posts/a.html', meta: { title: 'Dữ liệu của Discord', summary: 'Chuyển kho tin nhắn sang ScyllaDB.', company: 'Discord', companyId: 'discord', keyValue: '4 tỷ', keyLabel: 'tin nhắn mỗi ngày' } },
  { url: '/vi/posts/b.html', meta: { title: 'Sự cố ở Cloudflare', summary: 'Một cấu hình sai làm sập mạng.', company: 'Cloudflare', companyId: 'nowhere', keyValue: '27 phút', keyLabel: 'thời gian sập' } },
];

function fake(rows: typeof ROWS, search = vi.fn()) {
  search.mockResolvedValue({
    results: rows.map((r) => ({ id: r.url, data: async () => ({ ...r, excerpt: 'du lieu <mark>x</mark>' }) })),
  });
  return { init: vi.fn().mockResolvedValue(undefined), search };
}

let host: HTMLDivElement;
let root: Root;

const COMPANIES = [{ slug: 'discord', name: 'Discord', brandColor: '#5865f2' }];
const TOPICS = [
  { slug: 'databases', label: 'Cơ sở dữ liệu', count: 3 },
  { slug: 'incidents', label: 'Sự cố', count: 1 },
  { slug: 'ai', label: 'AI', count: 2 },
  { slug: 'infra', label: 'Hạ tầng', count: 5 },
];

async function mount(locale: 'vi' | 'en' = 'vi') {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const dict = (locale === 'vi' ? vi_dict : en_dict) as typeof vi_dict;
  await act(async () => {
    root.render(<SearchBox locale={locale} t={dict.search} list={{ postsOne: dict.list.postsOne, postsOther: dict.list.postsOther }} companies={COMPANIES} topics={TOPICS} />);
  });
}

async function type(value: string) {
  const input = host.querySelector('input')!;
  await act(async () => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
}

const state = () => host.querySelector('[data-search-state]')!.getAttribute('data-search-state');

beforeEach(() => {
  vi.useFakeTimers();
  mockLoad.mockReset();
  window.history.replaceState(null, '', '/vi/search');
});
afterEach(async () => {
  await act(async () => root.unmount());
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('SearchBox deep link', () => {
  it('searches the seeded query at once, then debounces typing', async () => {
    const search = vi.fn();
    mockLoad.mockResolvedValue(fake(ROWS, search));
    window.history.replaceState(null, '', '/vi/search?q=du%20lieu');
    await mount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenLastCalledWith('du lieu');

    const input = host.querySelector('input')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'kafka');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(199);
    });
    expect(search).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith('kafka');
  });
});

describe('SearchBox', () => {
  it('renders result rows from meta, never the excerpt', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    expect(state()).toBe('idle');
    await type('du lieu');
    expect(state()).toBe('results');
    const rows = host.querySelectorAll('ol[data-search-results] > li');
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector('a')!.getAttribute('href')).toBe('/vi/posts/a');
    expect(rows[1].querySelector('a')!.getAttribute('href')).toBe('/vi/posts/b');
    for (const [i, r] of ROWS.entries()) {
      const text = rows[i].textContent!;
      expect(text).toContain(r.meta.title);
      expect(text).toContain(r.meta.summary);
      expect(text).toContain(r.meta.company);
    }
    expect(rows[0].querySelector('a')!.textContent).toBe(ROWS[0].meta.title);
    expect(host.innerHTML).not.toContain('<mark');
    expect(host.textContent).not.toContain('du lieu <mark>');
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe('2 kết quả');
  });

  it('renders a bold title, the lead key number, a monogram and the company name per row', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    await type('du lieu');
    const rows = host.querySelectorAll('ol[data-search-results] > li');
    const link = rows[0].querySelector('a')!;
    expect(link.className).toContain('font-bold');
    expect(rows[0].textContent).toContain('4 tỷ');
    expect(rows[0].textContent).toContain('tin nhắn mỗi ngày');
    expect(rows[0].querySelector('.font-mono')!.textContent).toBe('4 tỷ');
    const mono = rows[0].querySelector<HTMLElement>('[aria-hidden]')!;
    expect(mono.textContent).toBe('D');
    expect(mono.style.color).toContain('#5865f2');
    expect(rows[0].textContent).toContain('Discord');
    expect(rows[0].querySelector('p.mono-label')).toBeNull();
    expect(rows[0].className).not.toContain('hover:bg-panel-2');
    expect(link.className).toContain('focus-visible:outline-none');
    expect(rows[0].className).not.toContain('rounded');
    expect(link.className).toContain('focus-visible:after:outline-[var(--accent)]');
    expect(link.className).toContain('after:rounded-panel');
  });

  it('falls back to an ink monogram for an unknown companyId', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    await type('du lieu');
    const rows = host.querySelectorAll('ol[data-search-results] > li');
    const mono = rows[1].querySelector<HTMLElement>('[aria-hidden]')!;
    expect(mono.textContent).toBe('C');
    expect(mono.className).toContain('text-ink');
    expect(mono.style.color).toBe('');
  });

  it('shows linked topic chips with counts, and hides them once searching', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    const browse = host.querySelector('[data-search-browse]')!;
    expect(browse.textContent).toContain(vi_dict.search.browse);
    expect(browse.querySelectorAll('li')).toHaveLength(TOPICS.length);
    const anchors = [...browse.querySelectorAll('a')];
    expect(anchors.map((a) => a.getAttribute('href'))).toEqual(
      TOPICS.filter((t) => t.count > 0).map((t) => `/vi/topics/${t.slug}`),
    );
    expect(anchors[0].textContent).toContain('Cơ sở dữ liệu');
    expect(anchors[0].querySelector('[aria-hidden="true"]')!.textContent).toBe('3');
    expect(anchors[0].querySelector('.sr-only')!.textContent).toBe('3 bài');
    await type('du lieu');
    expect(host.querySelector('[data-search-browse]')).toBeNull();
  });

  it('keeps the live region empty and unspaced while idle, and announces on the first search', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    const live = host.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe('');
    expect(live.className).not.toContain('min-h');
    expect(host.querySelector('[data-search-browse]')!.className).toContain('mt-3');
    await type('du lieu');
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe('2 kết quả');
  });

  it('renders no key-number block when keyValue is empty', async () => {
    const rows = [{ url: '/vi/posts/c.html', meta: { title: 'Không số', summary: 'Tóm tắt.', company: 'Discord', companyId: 'discord', keyValue: '', keyLabel: '' } }];
    mockLoad.mockResolvedValue(fake(rows));
    await mount();
    await type('du lieu');
    const li = host.querySelector('ol[data-search-results] > li')!;
    expect(li.querySelector('.font-mono')).toBeNull();
    expect(li.textContent).not.toContain('tin nhắn mỗi ngày');
  });

  it('styles the input caret and removes the native cancel glyph', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    const input = host.querySelector<HTMLInputElement>('input')!;
    expect(input.type).toBe('search');
    expect(input.className).toContain('caret-[var(--accent)]');
    expect(input.className).toContain('[&::-webkit-search-cancel-button]:appearance-none');
  });

  it('labels the input and uses the placeholder from the dictionary', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    const input = host.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(input.placeholder).toBe(vi_dict.search.placeholder);
    const label = host.querySelector(`label[for="${input.id}"]`)!;
    expect(label.textContent).toBe(vi_dict.search.label);
  });

  it('leaves a one-character query idle with no list', async () => {
    const pf = fake(ROWS);
    mockLoad.mockResolvedValue(pf);
    await mount();
    await type('d');
    expect(state()).toBe('idle');
    expect(host.querySelector('ol')).toBeNull();
    expect(pf.search).not.toHaveBeenCalled();
  });

  it('does not flash the idle topic chips for a ?q= deep link', async () => {
    window.history.replaceState(null, '', '/vi/search?q=du%20lieu');
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    expect(host.querySelector('[data-search-browse]')).toBeNull();
    expect(state()).toBe('loading');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(state()).toBe('results');
  });

  it('drops old rows once the query shrinks below two characters and grows back', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    await type('du lieu');
    expect(host.querySelectorAll('ol li')).toHaveLength(2);
    await type('d');
    expect(host.querySelector('ol')).toBeNull();
    const input = host.querySelector('input')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'du');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(host.querySelector('ol')).toBeNull();
    expect(host.querySelectorAll('ol li')).toHaveLength(0);
  });

  it('does not search after unmount before the debounce fires', async () => {
    const pf = fake(ROWS);
    mockLoad.mockResolvedValue(pf);
    await mount();
    const input = host.querySelector('input')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'du lieu');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => root.unmount());
    await vi.advanceTimersByTimeAsync(200);
    expect(pf.search).not.toHaveBeenCalled();
    root = createRoot(host);
  });

  it('shows the empty message for no matches', async () => {
    mockLoad.mockResolvedValue(fake([]));
    await mount();
    await type('zzqxv');
    expect(state()).toBe('empty');
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe(vi_dict.search.empty);
    expect(host.querySelector('ol')).toBeNull();
  });

  it('sets the empty sentence in 15px ink-2 Inter, not mono, and keeps the topic browse chips', async () => {
    mockLoad.mockResolvedValue(fake([]));
    await mount();
    await type('zzqxv');
    const live = host.querySelector('[aria-live="polite"]')!;
    expect(live.className).not.toContain('mono-label');
    for (const c of ['mt-4', 'text-[15px]', 'leading-[1.55]', 'text-ink-2']) expect(live.className.split(' ')).toContain(c);
    expect(vi_dict.search.empty).toBe('Không có bài nào khớp. Thử từ khác.');
    expect(en_dict.search.empty).toBe('No posts match. Try another word.');
    expect(host.querySelector('[data-search-browse]')).not.toBeNull();
  });

  it('keeps mono only on the results count and the searching line', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    await type('du lieu');
    expect(host.querySelector('[aria-live="polite"]')!.className).toContain('mono-label');
    expect(host.querySelector('[data-search-browse]')).toBeNull();
  });

  it('shows unavailable when the index cannot load', async () => {
    mockLoad.mockResolvedValue(null);
    await mount();
    await type('du lieu');
    expect(state()).toBe('unavailable');
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe(vi_dict.search.unavailable);
    expect(host.querySelector('[aria-live="polite"]')!.className).not.toContain('mono-label');
    expect(host.querySelector('[data-search-browse]')).toBeNull();
  });

  it('shows error when search rejects', async () => {
    const pf = fake(ROWS);
    pf.search.mockRejectedValue(new Error('boom'));
    mockLoad.mockResolvedValue(pf);
    await mount();
    await type('du lieu');
    expect(state()).toBe('error');
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe(vi_dict.search.error);
  });

  it('searches once on mount from ?q= and syncs the URL', async () => {
    window.history.replaceState(null, '', '/vi/search?q=du%20lieu');
    const pf = fake(ROWS);
    mockLoad.mockResolvedValue(pf);
    await mount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(pf.search).toHaveBeenCalledTimes(1);
    expect(pf.search).toHaveBeenCalledWith('du lieu');
    expect(host.querySelector<HTMLInputElement>('input')!.value).toBe('du lieu');
    expect(state()).toBe('results');
    await type('kafka');
    expect(window.location.search).toBe('?q=kafka');
    await type('');
    expect(window.location.search).toBe('');
  });

  it('shows the singular count and English copy on en', async () => {
    mockLoad.mockResolvedValue(fake(ROWS.slice(0, 1)));
    await mount('en');
    await type('database');
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe('1 result');
  });

  it('takes every vi string from the vi dictionary', async () => {
    mockLoad.mockResolvedValue(fake(ROWS));
    await mount();
    const strings = Object.values(vi_dict.search);
    const label = host.querySelector('label')!.textContent!;
    expect(strings).toContain(label);
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe('');
    expect(strings).toContain(host.querySelector('[data-search-browse] p')!.textContent);
    // no ASCII English from the en dictionary leaks into the vi render
    for (const s of [en_dict.search.label, en_dict.search.placeholder]) {
      expect(host.textContent).not.toContain(s);
    }
  });

  it('shows ten rows but the full count for 12 results', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      url: `/vi/posts/p${i}.html`,
      meta: { title: `Bài ${i}`, summary: `Tóm tắt ${i}`, company: 'Discord' },
    }));
    mockLoad.mockResolvedValue(fake(many as typeof ROWS));
    await mount();
    await type('du lieu');
    expect(host.querySelectorAll('ol[data-search-results] > li')).toHaveLength(10);
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe('12 kết quả');
  });

  it('ignores a stale search that resolves after a newer one', async () => {
    type Res = Awaited<ReturnType<NonNullable<Awaited<ReturnType<typeof loadPagefind>>>['search']>>;
    const mk = (title: string): Res => ({
      results: [{ id: title, data: async () => ({ url: `/vi/posts/${title}.html`, meta: { title, summary: 's', company: 'c' } }) }],
    });
    const resolvers: ((r: Res) => void)[] = [];
    const search = vi.fn(() => new Promise<Res>((res) => resolvers.push(res)));
    mockLoad.mockResolvedValue({ init: vi.fn(), search });
    await mount();
    await type('aa');
    await type('bb');
    expect(resolvers).toHaveLength(2);
    await act(async () => {
      resolvers[1](mk('from-bb'));
    });
    await act(async () => {
      resolvers[0](mk('from-aa'));
    });
    const titles = [...host.querySelectorAll('ol[data-search-results] a')].map((a) => a.textContent);
    expect(titles).toEqual(['from-bb']);
  });

  it('shows loading while search is pending and keeps the previous rows', async () => {
    const pf = fake(ROWS);
    mockLoad.mockResolvedValue(pf);
    await mount();
    await type('du lieu');
    expect(host.querySelectorAll('ol li')).toHaveLength(2);
    pf.search.mockReturnValue(new Promise(() => {}));
    await type('du lieu 2');
    expect(state()).toBe('loading');
    expect(host.querySelector('[aria-live="polite"]')!.textContent).toBe(vi_dict.search.searching);
    expect(host.querySelectorAll('ol li')).toHaveLength(2);
  });
});
