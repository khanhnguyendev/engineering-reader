import { normalizeSourceUrl } from '../lib/content/normalize-url';

const url = process.argv[2];
try {
  if (url === undefined) throw new Error('usage: pnpm normalize-url <url>');
  console.log(normalizeSourceUrl(url));
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
