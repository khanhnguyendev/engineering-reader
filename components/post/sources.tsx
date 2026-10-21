import type { Source } from "@/lib/content/schema";
import type { Dictionary } from "@/lib/dictionaries";
import { fmt } from "@/lib/i18n";

export function Sources({ dict, sources }: { dict: Dictionary; sources: Source[] }) {
  return (
    <section aria-labelledby="sources" className="hairline mt-10 pt-8">
      <h2 id="sources" className="mb-4 text-[20px] leading-[1.3] text-ink lg:text-[24px]">
        {dict.post.sources}
      </h2>
      <ol className="space-y-5">
        {sources.map((s) => (
          <li
            key={s.id}
            id={s.id}
            className="scroll-mt-6 rounded-panel target:bg-panel-2 target:outline target:outline-1 target:outline-offset-4 target:outline-hairline-strong"
          >
            <p className="mono-label mb-1 text-muted">
              <span className="text-accent">{s.id}</span>
              <span aria-hidden="true"> · </span>
              {dict.post.sourceTypes[s.type]}
            </p>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-accent"
            >
              {s.title}
            </a>
            <p className="mt-1 text-[14px] leading-[1.6] text-ink-2">
              {s.authors.length > 0 && <span>{s.authors.join(", ")}</span>}
              {s.authors.length > 0 && <span aria-hidden="true"> · </span>}
              <time dateTime={s.publishedAt} className="font-mono text-[13px]">
                {s.publishedAt}
              </time>
              {s.locator && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono text-[13px]">{s.locator}</span>
                </>
              )}
            </p>
            <p className="mt-0.5 text-[13px] text-muted">
              {fmt(dict.post.accessed, { date: s.accessedAt })}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-[14px] leading-[1.6] text-muted">{dict.post.aiLine}</p>
    </section>
  );
}
