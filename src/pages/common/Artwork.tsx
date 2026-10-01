import type { CSSProperties } from "react";

import { CoverImage } from "@/components/CoverImage";
import { cn } from "@/lib/utils";

import styles from "./Artwork.module.scss";

interface ArtworkProps {
    src: string | null | undefined;
    alt: string;
    /** Row thumbnail, square card, or the page hero. */
    size?: "row" | "card" | "hero";
    shape?: "square" | "round";
    /**
     * Paint a blurred copy of the image behind it. The copy's opacity is the `--artwork-glow` custom property, 0 by
     * default, so a parent can light it up (on hover, say) without reaching into this module.
     */
    ambient?: boolean;
    className?: string;
}

const SIZES = { row: styles.row, card: styles.card, hero: styles.hero };
const SHAPES = { square: styles.square, round: styles.round };

/** Album-art style image: rounded, shadowed, optionally glowing with its own colours. */
export function Artwork({ src, alt, size = "row", shape = "square", ambient = false, className }: ArtworkProps) {
    const glow = ambient && src;
    const style = glow ? ({ "--artwork-url": `url(${JSON.stringify(src)})` } as CSSProperties) : undefined;
    return (
        <div className={cn(styles.frame, SIZES[size], SHAPES[shape], glow && styles.ambient, className)} style={style}>
            <CoverImage src={src} alt={alt} height="fill" className={styles.image} />
        </div>
    );
}
