/** Accent-folds text so unaccented Vietnamese queries match accented content. */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

/** Markdown to searchable prose: drops fenced code, URLs and tags, strips markup characters. */
export function plainText(md: string): string {
  return md
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, " ")
    .replace(/https?:\/\/[^\s)\]>]+/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`>[\]()|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pagefind URLs end in `.html`; the site path does not. */
export function toSitePath(url: string): string {
  return url.replace(/\.html$/, "");
}
