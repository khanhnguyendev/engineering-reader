export function DeepDivider({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span aria-hidden="true" className="h-px flex-1 bg-hairline-strong" />
      <p className="mono-label text-[11px] tracking-[0.12em] text-accent">{label}</p>
      <span aria-hidden="true" className="h-px flex-1 bg-hairline-strong" />
    </div>
  );
}
