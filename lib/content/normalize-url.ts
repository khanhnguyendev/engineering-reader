export function normalizeSourceUrl(url: string): string {
  const u = new URL(url);
  u.hash = '';
  const kept = [...u.searchParams.entries()]
    .filter(([k]) => !k.toLowerCase().startsWith('utm_'))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  u.search = '';
  for (const [k, v] of kept) u.searchParams.append(k, v);
  const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, '') : '';
  return `${u.protocol}//${u.host}${path}${u.search}`;
}

export function hostOf(url: string): string {
  return new URL(url).hostname.toLowerCase();
}
