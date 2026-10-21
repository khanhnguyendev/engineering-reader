"use client";

import { useEffect, useState } from "react";

export type TocHeading = { id: string; text: string };

/** `idKey` is the heading ids joined by newlines: a stable effect dependency. */
function useActiveHeading(idKey: string, enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || !idKey) return;
    const ids = idKey.split("\n");
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        // The first section in document order that is on screen wins.
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-15% 0px -55% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [idKey, enabled]);
  return active;
}

function Links({ headings, active }: { headings: TocHeading[]; active: string | null }) {
  return (
    <ol className="space-y-2.5">
      {headings.map((h) => {
        const current = h.id === active;
        return (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={current ? "location" : undefined}
              className={`block text-[14px] leading-[1.45] transition-colors duration-150 hover:text-ink ${
                current ? "font-medium text-accent" : "text-muted"
              }`}
            >
              {h.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function Toc({
  label,
  headings,
  variant,
}: {
  label: string;
  headings: TocHeading[];
  variant: "rail" | "details";
}) {
  const active = useActiveHeading(
    headings.map((h) => h.id).join("\n"),
    variant === "rail",
  );
  if (headings.length === 0) return null;
  if (variant === "details") {
    return (
      <details className="panel group mb-4 lg:hidden">
        <summary className="mono-label flex cursor-pointer list-none items-center justify-between px-4 py-3 text-ink-2 [&::-webkit-details-marker]:hidden">
          {label}
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="h-3 w-3 text-muted transition-transform duration-200 group-open:rotate-180"
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </summary>
        <nav aria-label={label} className="border-t border-hairline px-4 py-3">
          <Links headings={headings} active={null} />
        </nav>
      </details>
    );
  }
  return (
    <nav aria-label={label} className="panel p-4">
      <p className="mono-label mb-3 text-muted">{label}</p>
      <Links headings={headings} active={active} />
    </nav>
  );
}
