/** Monogram mark for the editor: hairline ring, accent letter, no fill. */
export function Avatar({ size = 20 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-hairline-strong font-semibold leading-none text-accent"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      R
    </span>
  );
}
