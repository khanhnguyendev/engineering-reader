export function TagsRow({ pills }: { pills: string[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <ul className="contents">
        {pills.map((p) => (
          <li
            key={p}
            className="rounded-[6px] border border-hairline-strong px-2 py-[3px] text-[12px] leading-[1.35] text-ink-2"
          >
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
