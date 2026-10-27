import { Avatar } from "@/components/post/avatar";

export function Byline({ text }: { text: string }) {
  return (
    <footer className="hairline mt-10 flex items-center gap-3 lg:hidden pt-6 text-[15px]">
      <Avatar size={28} />
      <span className="font-semibold text-ink">{text}</span>
    </footer>
  );
}
