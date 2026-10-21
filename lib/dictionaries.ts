import "server-only";
import vi from "@/dictionaries/vi.json";
import en from "@/dictionaries/en.json";
import type { Locale } from "@/lib/i18n";

export type Dictionary = typeof vi;

const dictionaries: Record<Locale, Dictionary> = { vi, en };

export function getDictionary(l: Locale): Dictionary {
  return dictionaries[l];
}
