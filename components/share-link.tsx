"use client";

import { useEffect, useState } from "react";

export function ShareLink({ label, copiedLabel }: { label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
    } catch {
      // clipboard blocked: the address bar still has the link
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="mono-label w-full rounded-panel border border-hairline-strong px-3 py-2.5 text-ink-2 transition-colors duration-150 hover:border-accent hover:text-ink"
    >
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
