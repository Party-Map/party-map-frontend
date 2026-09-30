import { Heart, HeartCrack } from "lucide-react";
import { useState } from "react";

import { like, unlike } from "@/api/likes";
import type { ID, LikeTarget } from "@/api/types";
import { useAuth } from "@/auth/provider";
import { cn } from "@/lib/utils";

import styles from "./LikeButton.module.css";
import { useToast } from "./ToastProvider";

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
    const toast = useToast();
    const [liked, setLiked] = useState(initialLiked);
    const [busy, setBusy] = useState(false);
    const [hovering, setHovering] = useState(false);

    if (status !== "authenticated") return null;

    const toggle = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const result = liked ? await unlike(target, targetId) : await like(target, targetId);
            setLiked(result.liked);
            onChange?.(result.liked);
            if (result.liked) toast.success(`You liked ${targetName}`);
            else toast.info(`You broke up with ${targetName}`);
        } catch {
            toast.error("Could not update your likes. Please try again.");
        } finally {
            setBusy(false);
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
