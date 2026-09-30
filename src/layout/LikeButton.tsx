import { Heart, HeartCrack } from "lucide-react";
import { useState } from "react";

import { useToggleLike } from "@/api/hooks";
import type { ID, LikeTarget } from "@/api/types";
import { useAuth } from "@/auth/provider";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

import styles from "./LikeButton.module.scss";

interface LikeButtonProps {
    target: LikeTarget;
    targetId: ID;
    targetName: string;
    initialLiked: boolean;
    onChange?: (liked: boolean) => void;
    className?: string;
}

/** Heart toggle; renders nothing for anonymous visitors. */
export function LikeButton({ target, targetId, targetName, initialLiked, onChange, className }: LikeButtonProps) {
    const { status } = useAuth();
    const [liked, setLiked] = useState(initialLiked);
    const toggleLike = useToggleLike(target, targetId);
    const busy = toggleLike.isPending;
    const [hovering, setHovering] = useState(false);

    if (status !== "authenticated") return null;

    const toggle = async () => {
        if (busy) return;
        try {
            const result = await toggleLike.mutateAsync(!liked);
            setLiked(result.liked);
            onChange?.(result.liked);
            if (result.liked) toast.success(`You liked ${targetName}`);
            else toast.info(`You broke up with ${targetName}`);
        } catch {
            toast.error("Could not update your likes. Please try again.");
        }
    };

    const showBreak = liked && hovering;

    return (
        <button
            type="button"
            onClick={toggle}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            disabled={busy}
            aria-pressed={liked}
            aria-label={liked ? "Remove from favorites" : "Add to favorites"}
            className={cn(styles.button, className)}
        >
            {showBreak ? (
                <HeartCrack size={20} className={styles.icon} aria-hidden />
            ) : (
                <Heart size={20} className={styles.icon} fill={liked ? "currentColor" : "none"} aria-hidden />
            )}
        </button>
    );
}
