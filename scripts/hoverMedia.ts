import type { AtRule, Container, Document, Plugin, Rule } from "postcss";

/** Only devices with a real pointer get hover styles; touch screens would otherwise keep the last tap "hovered". */
export const HOVER_MEDIA = "(hover: hover)";

const HOVER = ":hover";

/** Whether the rule sits inside a media query about hovering (the plugin's own, or a hand-written one). */
export function insideHoverMedia(rule: Rule): boolean {
    let parent: Container | Document | undefined = rule.parent;
    while (parent) {
        if (
            parent.type === "atrule" &&
            (parent as AtRule).name === "media" &&
            (parent as AtRule).params.includes("hover")
        ) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
}

/**
 * A PostCSS plugin that moves every `:hover` selector into `@media (hover: hover)`, so touch devices (phones and
 * tablets, where there is no pointer to hover with) get none of the hover colours, lifts and glows and keep only
 * their active and focus states. A rule that mixes hover and other selectors is split: the others stay where they
 * are. Applied to the whole build in rsbuild.config.ts, so stylesheets write plain `:hover` rules.
 */
export function hoverMedia(): Plugin {
    return {
        postcssPlugin: "hover-media",
        Rule(rule, { AtRule: MediaRule }) {
            if (!rule.selector.includes(HOVER) || insideHoverMedia(rule)) return;
            const hovered = rule.selectors.filter((selector) => selector.includes(HOVER));
            const rest = rule.selectors.filter((selector) => !selector.includes(HOVER));
            const media = new MediaRule({ name: "media", params: HOVER_MEDIA });
            media.append(rule.clone({ selectors: hovered }));
            if (rest.length === 0) {
                rule.replaceWith(media);
                return;
            }
            rule.after(media);
            rule.selectors = rest;
        },
    };
}
hoverMedia.postcss = true;
