export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

export function otherLocale(l: Locale): Locale {
  return l === 'vi' ? 'en' : 'vi';
}

import vi from "@/dictionaries/vi.json";
import en from "@/dictionaries/en.json";

export type Dictionary = typeof vi;

const dictionaries: Record<Locale, Dictionary> = { vi, en };

export function getDictionary(l: Locale): Dictionary {
  return dictionaries[l];
}

export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) =>
    k in vars ? String(vars[k]) : m,
  );
}
