/**
 * How much of the map the floating bars cover, in CSS pixels. Mirrors layout/bars.module.scss: a `--topbar-h` (4rem)
 * bar `--space-2` (0.5rem) from the top at every width, and a `--bottombar-h` (4rem) bar `--space-3` (0.75rem) from
 * the bottom below the desktop breakpoint (styles/_mixins.scss).
 */
export const TOP_INSET = 64 + 8;
export const BOTTOM_INSET = 64 + 12;
/** From this viewport width on, the bottom bar is gone (the `desktop` mixin). */
export const DESKTOP_MIN_WIDTH = 1024;

export interface MapInsets {
    top: number;
    bottom: number;
}

/** The bars' cover for a map of the given width. */
export function mapInsets(width: number): MapInsets {
    return { top: TOP_INSET, bottom: width < DESKTOP_MIN_WIDTH ? BOTTOM_INSET : 0 };
}
