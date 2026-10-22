import { CHIP } from "@/components/chip";

export function TagsRow({ pills }: { pills: string[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <ul className="contents">
        {pills.map((p) => (
          <li key={p} className={CHIP}>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
