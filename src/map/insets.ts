// How much of the map the floating bars cover, in CSS pixels. Mirrors layout/bars.module.scss: a `--topbar-h` (4rem)
// bar `--space-2` (0.5rem) from the top at every width, and a `--bottombar-h` (4rem) bar `--space-3` (0.75rem) or the
// device's safe area (whichever is larger) from the bottom below the desktop breakpoint (styles/_mixins.scss).
import { DESKTOP_MIN_WIDTH } from "@/lib/constants";

export const TOP_INSET = 64 + 8;
const BOTTOM_BAR = 64;
const BOTTOM_GAP = 12;
/** The bottom bar's cover on a device without a safe area. */
export const BOTTOM_INSET = BOTTOM_BAR + BOTTOM_GAP;

export interface MapInsets {
    top: number;
    bottom: number;
}

/**
 * The device's bottom safe area in pixels. `env()` cannot be read from scripts, so styles/base.scss publishes it as
 * the custom property `--safe-bottom` on the root element.
 */
export function readSafeBottom(): number {
    if (typeof document === "undefined") return 0;
    const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-bottom"));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** The bars' cover for a map of the given width. */
export function mapInsets(width: number, safeBottom = readSafeBottom()): MapInsets {
    return { top: TOP_INSET, bottom: width < DESKTOP_MIN_WIDTH ? BOTTOM_BAR + Math.max(BOTTOM_GAP, safeBottom) : 0 };
}

/**
 * The top edge, in viewport pixels, of the overlays floating over the lower part of the map that mark themselves
 * `data-map-inset="bottom"` (the consent banner); null while none is shown. An open card is kept above them.
 */
export function overlayTop(): number | null {
    if (typeof document === "undefined") return null;
    const tops = Array.from(
        document.querySelectorAll('[data-map-inset="bottom"]'),
        (el) => el.getBoundingClientRect().top,
    );
    return tops.length ? Math.min(...tops) : null;
}
