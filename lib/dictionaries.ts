import "server-only";
import vi from "@/dictionaries/vi.json";
import en from "@/dictionaries/en.json";
import type { Locale } from "@/lib/i18n";

export type Dictionary = typeof vi;

const dictionaries: Record<Locale, Dictionary> = { vi, en };

export function getDictionary(l: Locale): Dictionary {
  return dictionaries[l];
}

/** The one-line shelf dek for a topic; the topics dek when the shelf has none. */
export function shelfDek(dict: Dictionary, slug: string): string {
  const shelf: Record<string, string> = dict.topics.shelf;
  return Object.hasOwn(shelf, slug) ? shelf[slug] : dict.topics.dek;
}
