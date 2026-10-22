"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

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
  // On a prerendered 404 the server path is /_not-found while the browser path is the real URL;
  // hydrate with the server value, then switch to the browser value.
  const serverPath = usePathname();
  const path = useSyncExternalStore(noop, () => window.location.pathname, () => serverPath);
  const [, pathLocale, pathSection] = path.split("/");
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
