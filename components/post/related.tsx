import { PostList } from "@/components/post-list";
import { SectionHeading } from "@/components/section-heading";
import type { PostRecord } from "@/lib/content/load";
import type { Vocab } from "@/lib/content/vocab";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

/** Up to three related cases; no heading and no block when there are none. */
export function Related({
  posts,
  locale,
  vocab,
  dict,
}: {
  posts: readonly PostRecord[];
  locale: Locale;
  vocab: Vocab;
  dict: Dictionary;
}) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-12">
      <SectionHeading title={dict.related.title} />
      <PostList posts={posts} locale={locale} vocab={vocab} dict={dict} emptyLabel="" />
    </section>
  );
}
