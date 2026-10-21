import Link from "next/link";

/** An H2 row with an optional right-aligned "all" link; nothing sits above the heading. */
export function SectionHeading({
  title,
  href,
  hrefLabel,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-[20px] leading-[1.3] text-ink lg:text-[26px] lg:leading-[1.25]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="mono-label shrink-0 text-muted transition-colors duration-150 hover:text-ink"
        >
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}
