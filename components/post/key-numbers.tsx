import type { KeyNumber } from "@/lib/content/schema";

const COLS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

/**
 * Phone: one row per number (value left, label right, ref at the end).
 * From sm: the 2–4-up grid of cells (value, label, ref stacked).
 */
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
      <ul className={`grid grid-cols-1 gap-2 lg:gap-3 ${COLS[numbers.length] ?? "sm:grid-cols-3"}`}>
        {numbers.map((k) => (
          <li
            key={k.id}
            className="panel grid grid-cols-[minmax(0,44%)_minmax(0,1fr)_auto] items-baseline gap-x-3 bg-panel-2 px-3 py-2.5 sm:flex sm:flex-col sm:items-stretch sm:p-3 lg:p-4"
          >
            <span className="font-mono text-[15px] font-semibold leading-[1.35] tracking-[-0.02em] break-words text-ink lg:text-[20px] lg:leading-[1.3]">
              {k.value}
            </span>
            <span className="text-[13px] leading-[1.45] text-ink-2 sm:mt-1 sm:text-[12px] lg:text-[13px]">
              {labels[k.id] ?? k.id}
            </span>
            <a href={`#${k.ref}`} className="ref text-[11px] sm:mt-auto sm:pt-1.5">
              [{k.ref}]
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
