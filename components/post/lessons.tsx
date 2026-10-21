export function Lessons({ heading, items }: { heading: string; items: string[] }) {
  return (
    <section aria-labelledby="lessons" className="hairline mt-10 pt-8">
      <h2 id="lessons" className="mb-3 text-[20px] leading-[1.3] text-ink lg:text-[24px]">
        {heading}
      </h2>
      <ul className="list-disc space-y-2 pl-5 marker:text-muted">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
