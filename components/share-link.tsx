"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "copied" | "failed";

/** Fallback for contexts without the async clipboard (http, older browsers, denied permission). */
function copyWithTextarea(text: string): boolean {
  const previous = document.activeElement;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  if (previous instanceof HTMLElement) previous.focus();
  return ok;
}

export function ShareLink({
  label,
  copiedLabel,
  failedLabel,
}: {
  label: string;
  copiedLabel: string;
  failedLabel: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const t = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [status]);

  async function copy() {
    const href = location.href;
    try {
      await navigator.clipboard.writeText(href);
      setStatus("copied");
    } catch {
      setStatus(copyWithTextarea(href) ? "copied" : "failed");
    }
  }

  const text = status === "copied" ? copiedLabel : status === "failed" ? failedLabel : label;
  return (
    <button
      type="button"
      onClick={copy}
      className="mono-label w-full rounded-panel border border-hairline-strong px-3 py-2.5 text-ink-2 transition-colors duration-150 hover:bg-panel-2 hover:text-ink"
    >
      <span aria-live="polite">{text}</span>
    </button>
  );
}
