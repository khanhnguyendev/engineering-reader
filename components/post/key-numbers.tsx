import type { KeyNumber } from "@/lib/content/schema";

const COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

export function KeyNumbers({
  heading,
  numbers,
  labels,
}: {
  heading: string;
  numbers: KeyNumber[];
  labels: Record<string, string>;
}) {
  return (
    <div className="mb-6">
      <h2 className="sr-only">{heading}</h2>
      <ul className={`grid gap-2 lg:gap-3 ${COLS[numbers.length] ?? "grid-cols-3"}`}>
        {numbers.map((k) => (
          <li key={k.id} className="panel flex flex-col bg-panel-2 p-2.5 lg:p-4">
            <span className="font-mono text-[15px] font-semibold leading-[1.3] tracking-[-0.02em] break-words text-ink lg:text-[20px]">
              {k.value}
            </span>
            <span className="mt-1 text-[12px] leading-[1.4] text-ink-2 lg:text-[13px]">
              {labels[k.id] ?? k.id}
            </span>
            <a href={`#${k.ref}`} className="ref mt-auto pt-1.5 text-[11px]">
              [{k.ref}]
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
