export function Tldr({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div className="panel mb-4 p-4 lg:p-6">
      <h2 className="mb-2 text-[16px] leading-[1.35] text-ink lg:text-[18px]">{heading}</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-[16px] leading-[1.6] lg:space-y-2 lg:text-[17px] lg:leading-[1.65] marker:text-muted">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
