/** The one chip look: strong hairline, 6px radius, ink-2 text. PostCard and every chip list share it. */
export const CHIP = "rounded-md border border-hairline-strong px-2 py-[3px] text-xs leading-[1.35] text-ink-2";

/** A chip that is a link carrying a count. */
export const CHIP_LINK = `${CHIP} inline-flex items-baseline gap-2 transition-colors duration-150 hover:bg-panel-2 hover:text-ink`;
