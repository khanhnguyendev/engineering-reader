import { readFileSync } from 'node:fs';
import { RedirectsSchema, type Redirect } from './redirects';

// Only next.config.ts and validate.ts may import this: the dynamic read makes Turbopack trace the
// whole project from any app module that reaches it. Relative imports only (loaded by next.config.ts).
export function readRedirects(file = 'content/redirects.json'): Redirect[] {
  return RedirectsSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
}
