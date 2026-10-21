import type { Locale } from '@/lib/i18n';

export const WPM: Record<Locale, number> = { vi: 200, en: 230 };

export function countWords(text: string): number {
  const stripped = text
    .replace(/^﻿?---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[ \t]*\[S\d+[^\]]*\]/g, '');
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function readingTime(
  text: string,
  locale: Locale,
): { words: number; minutes: number } {
  const words = countWords(text);
  const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / WPM[locale]));
  return { words, minutes };
}
