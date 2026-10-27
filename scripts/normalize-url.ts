import { readFileSync } from 'node:fs';
import { normalizeMany, normalizeSourceUrl } from '../lib/content/normalize-url';

const args = process.argv.slice(2);
try {
  if (args.length === 0) throw new Error('usage: pnpm normalize-url <url> [<url>...] | -');
  if (args.length === 1 && args[0] !== '-') {
    console.log(normalizeSourceUrl(args[0]));
  } else {
    const lines = args.flatMap((a) => (a === '-' ? readFileSync(0, 'utf8').split(/\r?\n/) : [a]));
    const { out, ok } = normalizeMany(lines);
    if (out.length > 0) console.log(out.join('\n'));
    if (!ok) process.exitCode = 1;
  }
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
