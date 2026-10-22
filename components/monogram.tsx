/**
 * A company mark: rounded square (6px) on panel with a hairline border.
 * The brand colour, when given, goes on the letter only (never the border).
 */
export function Monogram({
  name,
  color,
  size = 32,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-hairline bg-panel font-sans font-bold leading-none ${color ? "" : "text-ink"}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        ...(color ? { color: `color-mix(in oklab, ${color} var(--monogram-mix), var(--ink))` } : {}),
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
