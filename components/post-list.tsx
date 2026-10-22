import { PostCard } from "@/components/post-card";
import { hasLocale, type PostRecord } from "@/lib/content/load";
import type { Vocab } from "@/lib/content/vocab";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

/** A two-up grid of PostCards for `locale`, or the empty label when none have that locale. */
export function PostList({
  posts,
  locale,
  vocab,
  dict,
  emptyLabel,
  cols = 2,
}: {
  posts: readonly PostRecord[];
  locale: Locale;
  vocab: Vocab;
  dict: Dictionary;
  emptyLabel: string;
  cols?: 2 | 3;
}) {
  const shown = posts.filter((p) => hasLocale(p, locale));
  if (shown.length === 0) return <p className="text-muted">{emptyLabel}</p>;
  return (
    <ul className={`grid gap-4 sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
      {shown.map((post) => (
        <PostCard
          key={post.slug}
          post={post}
          locale={locale}
          company={vocab.companies.find((c) => c.slug === post.meta.company)}
          topicLabel={vocab.topics.find((t) => t.slug === post.meta.topic)?.[locale] ?? post.meta.topic}
          dict={dict}
        />
      ))}
    </ul>
  );
}
