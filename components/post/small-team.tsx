/** The only accent-bordered block on the page. */
export function SmallTeam({ heading, items }: { heading: string; items: string[] }) {
  return (
    <aside aria-labelledby="post-small-team" className="callout mb-8 p-4 lg:p-6">
      <h2 id="post-small-team" className="mb-2 text-[15px] leading-[1.35] text-accent lg:text-[17px]">
        {heading}
      </h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[16px] leading-[1.6] lg:space-y-2 lg:text-[17px] lg:leading-[1.65] marker:text-accent">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </aside>
  );
}
