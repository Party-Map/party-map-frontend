import type { ReactNode } from "react";

import type { Link as SocialLink } from "@/api/types";
import { CoverImage } from "@/components/CoverImage";
import { SocialLinks } from "@/components/SocialLinks";
import card from "@/pages/admin/shared/card.module.scss";

import styles from "./ProfileCard.module.scss";
import { StatusChip } from "./StatusChip";

interface ProfileCardProps {
    title: string;
    image: string | null | undefined;
    imageAlt: string;
    text: string | null | undefined;
    emptyText: string;
    chips?: string[];
    links: SocialLink[];
    /** An action in the card's head (an Edit link). */
    action?: ReactNode;
}

/** How a place or performer looks to the public: image, text, tags and links, as a card. */
export function ProfileCard({ title, image, imageAlt, text, emptyText, chips = [], links, action }: ProfileCardProps) {
    return (
        <section className={card.card} aria-label={title}>
            <div className={card.head}>
                <h2 className={card.title}>{title}</h2>
                {action}
            </div>
            <div className={styles.body}>
                <CoverImage src={image} alt={imageAlt} height="md" className={styles.image} />
                <div className={styles.text}>
                    <p className={text ? styles.description : styles.empty}>{text || emptyText}</p>
                    {chips.length > 0 && (
                        <span className={styles.chips}>
                            {chips.map((chip) => (
                                <StatusChip key={chip}>{chip}</StatusChip>
                            ))}
                        </span>
                    )}
                    {links.length > 0 && <SocialLinks links={links} />}
                </div>
            </div>
        </section>
    );
}
