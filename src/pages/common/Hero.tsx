import type { CSSProperties, ReactNode } from "react";

import { Artwork } from "./Artwork";
import styles from "./Hero.module.scss";

interface HeroProps {
    image: string | null | undefined;
    alt: string;
    /** The small line above the title (kind and day, city, genre). */
    eyebrow?: ReactNode;
    title: string;
    /** The line under the title: when and where, as `<time>` and `<address>` where it applies. */
    subtitle?: ReactNode;
    /** The pill actions. */
    actions?: ReactNode;
    /** Reserved for the future teaser player; renders nothing until a page passes one. */
    play?: ReactNode;
    shape?: "square" | "round";
}

/** The page opener: big artwork over an ambient blur of itself, the title and the actions. */
export function Hero({ image, alt, eyebrow, title, subtitle, actions, play, shape = "square" }: HeroProps) {
    const backdrop = image ? ({ "--hero-image": `url(${JSON.stringify(image)})` } as CSSProperties) : undefined;
    return (
        <header className={styles.hero} style={backdrop}>
            {image && <div className={styles.backdrop} aria-hidden />}
            <div className={styles.content}>
                <Artwork src={image} alt={alt} size="hero" shape={shape} className={styles.art} />
                <div className={styles.text}>
                    {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
                    {(play || actions) && (
                        <div className={styles.actions}>
                            {play}
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
