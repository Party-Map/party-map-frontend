import { type ImgHTMLAttributes, useState } from "react";

import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { cn } from "@/lib/utils";

import styles from "./CoverImage.module.scss";

type CoverImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
    src: string | null | undefined;
    alt: string;
    height?: "sm" | "md" | "lg";
};

const HEIGHTS = { sm: styles.sm, md: styles.md, lg: styles.lg };

/** Image with a placeholder fallback for missing or broken sources. */
export function CoverImage({ src, alt, height = "lg", className, ...rest }: CoverImageProps) {
    const [failed, setFailed] = useState(false);
    const source = !src || failed ? PLACEHOLDER_IMAGE : src;

    return (
        <img
            src={source}
            alt={alt}
            loading="lazy"
            className={cn(styles.image, HEIGHTS[height], className)}
            onError={() => setFailed(true)}
            {...rest}
        />
    );
}
