export function MissingLocaleNote({ text }: { text: string }) {
  return (
    <p role="note" className="mb-4 border-b border-hairline pb-3 text-[14px] text-muted">
      {text}
    </p>
  );
}
