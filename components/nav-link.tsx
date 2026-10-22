"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A header nav item; `aria-current="page"` when the first segment after the locale is `section`. */
export function NavLink({
  href,
  section,
  children,
}: {
  href: string;
  section: string;
  children: React.ReactNode;
}) {
  const active = usePathname().split("/")[2] === section;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`mono-label hover:text-ink ${active ? "text-ink" : "text-muted"}`}
    >
      {children}
    </Link>
  );
}
