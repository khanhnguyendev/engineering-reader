/** Typography for the compiled deep layer: sections are panels, nothing inside them is. */
export const BODY = [
  "[&_section]:mb-3 [&_section]:scroll-mt-6 [&_section]:p-4 lg:[&_section]:mb-4 lg:[&_section]:px-8 lg:[&_section]:py-7",
  "[&_h2]:mb-3 [&_h2]:text-[20px] [&_h2]:leading-[1.3] [&_h2]:text-ink [&_h2]:text-balance lg:[&_h2]:mb-4 lg:[&_h2]:text-[26px] lg:[&_h2]:leading-[1.25]",
  "[&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-[17px] [&_h3]:leading-[1.35] lg:[&_h3]:text-[19px]",
  "[&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5 [&_li]:marker:text-muted",
  "[&_a:not(.ref)]:underline [&_a:not(.ref)]:decoration-hairline-strong [&_a:not(.ref)]:underline-offset-4 [&_a:not(.ref):hover]:decoration-accent",
  "[&_blockquote]:my-5 [&_blockquote]:border-l [&_blockquote]:border-hairline-strong [&_blockquote]:pl-4 [&_blockquote]:text-ink-2",
].join(" ");
