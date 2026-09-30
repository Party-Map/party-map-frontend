import { Globe } from "lucide-react";

import type { Link, LinkType } from "@/api/types";
import { LINK_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import styles from "./SocialLinks.module.css";

const GLYPHS: Record<Exclude<LinkType, "WEBSITE">, string> = {
    INSTAGRAM: "IG",
    FACEBOOK: "f",
    TWITTER: "X",
    REDDIT: "r",
};

/** Small monogram badge for a social network; lucide ships no brand icons. */
export function BrandIcon({ type }: { type: LinkType }) {
    if (type === "WEBSITE") return <Globe size={16} aria-hidden />;
    return (
        <span className={styles.glyph} aria-hidden>
            {GLYPHS[type]}
        </span>
    );
}

export function SocialLinks({ links, className }: { links?: Link[]; className?: string }) {
    if (!links || links.length === 0) return null;

    return (
        <div className={cn(styles.list, className)}>
            {links.map((link) => (
                <a key={link.type} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    <BrandIcon type={link.type} />
                    {LINK_TYPE_LABELS[link.type]}
                </a>
            ))}
        </div>
    );
}
