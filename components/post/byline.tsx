import { Avatar } from "@/components/post/avatar";

export function Byline({ text, className = "" }: { text: string; className?: string }) {
  return (
    <footer className={`hairline mt-10 flex items-center gap-3 pt-6 text-[15px] ${className}`.trim()}>
      <Avatar size={28} />
      <span className="font-semibold text-ink">{text}</span>
    </footer>
  );
}
