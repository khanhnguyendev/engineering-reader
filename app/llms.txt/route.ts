import { CONTENT_ROOT, listPosts } from '@/lib/content/load';
import { loadVocab } from '@/lib/content/vocab';
import { getDictionary } from '@/lib/dictionaries';
import { llmsTxt } from '@/lib/markdown';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export async function GET() {
  const body = llmsTxt(
    listPosts(CONTENT_ROOT),
    loadVocab(),
    { vi: getDictionary('vi'), en: getDictionary('en') },
    SITE_URL,
  );
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
