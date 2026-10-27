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

/** Normalize many URLs (one per input line). Blank lines are skipped; invalid ones become `ERROR <input>`. */
export function normalizeMany(lines: string[]): { out: string[]; ok: boolean } {
  const out: string[] = [];
  let ok = true;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') continue;
    try {
      out.push(normalizeSourceUrl(line));
    } catch {
      out.push(`ERROR ${line}`);
      ok = false;
    }
  }
  return { out, ok };
}
