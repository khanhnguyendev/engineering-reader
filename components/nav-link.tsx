"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A header nav item; `aria-current="page"` when the path is in `locale` and its first segment after the locale is `section`. */
export function NavLink({
  href,
  locale,
  section,
  children,
}: {
  href: string;
  locale: string;
  section: string;
  children: React.ReactNode;
}) {
  const [, pathLocale, pathSection] = usePathname().split("/");
  const active = pathLocale === locale && pathSection === section;
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
