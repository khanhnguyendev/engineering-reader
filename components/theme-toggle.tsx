"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function apply(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // storage unavailable: the theme applies to this page only
  }
}

/** Two pressed-state buttons. The full label is the accessible name and contains the short visible word. */
export function ThemeToggle({
  groupLabel,
  lightLabel,
  darkLabel,
  lightShort,
  darkShort,
}: {
  groupLabel?: string;
  lightLabel: string;
  darkLabel: string;
  lightShort: string;
  darkShort: string;
}) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "dark" as const);
  const options: { value: Theme; label: string; short: string }[] = [
    { value: "dark", label: darkLabel, short: darkShort },
    { value: "light", label: lightLabel, short: lightShort },
  ];
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="flex rounded-panel border border-hairline-strong p-0.5 text-[12px] leading-none"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => apply(o.value)}
          aria-pressed={theme === o.value}
          className="rounded-[7px] px-2 py-1.5 text-muted hover:text-ink aria-pressed:bg-panel-2 aria-pressed:text-ink"
        >
          <span className="sr-only">{o.label}</span>
          <span aria-hidden="true">{o.short}</span>
        </button>
      ))}
    </div>
  );
}
