/** The one chip look: strong hairline, 6px radius, ink-2 text. PostCard and every chip list share it. */
const CHIP_BASE = "rounded-md border border-hairline-strong px-2 py-[3px] text-xs leading-[1.35]";
const CHIP_LAYOUT = "inline-flex items-baseline gap-2";
export const CHIP = `${CHIP_BASE} text-ink-2`;

/** A chip that is a link carrying a count. */
export const CHIP_LINK = `${CHIP} ${CHIP_LAYOUT} transition-colors duration-150 hover:bg-panel-2 hover:text-ink`;

/** A non-link chip carrying a count, muted (e.g. a topic with no posts). */
export const CHIP_MUTED = `${CHIP_BASE} ${CHIP_LAYOUT} text-muted`;
