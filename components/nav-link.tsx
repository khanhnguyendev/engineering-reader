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
  serverPath,
  children,
}: {
  href: string;
  locale: string;
  section: string;
  /** Path to use on the server and during hydration. `""` means unknown: mark nothing. `undefined` uses `usePathname()`. */
  serverPath?: string;
  children: React.ReactNode;
}) {
  // On a prerendered 404 the server path is /_not-found while the browser path is the real URL
  // (the client router is seeded from window.location), so pathless callers pass serverPath="".
  // Hydrate with the server value, then switch to the browser value.
  const routerPath = usePathname();
  const path = useSyncExternalStore(noop, () => window.location.pathname, () => serverPath ?? routerPath);
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
