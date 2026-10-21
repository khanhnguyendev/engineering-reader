"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): "dark" | "light" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle({ ariaLabel }: { ariaLabel: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "dark" as const);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // storage unavailable: the theme applies to this page only
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === "light"}
      className="mono-label rounded-panel border border-hairline-strong px-3 py-2 text-ink"
    >
      <span className="sr-only">{ariaLabel}</span>
      <span aria-hidden="true">{theme === "light" ? "LIGHT" : "DARK"}</span>
    </button>
  );
}
