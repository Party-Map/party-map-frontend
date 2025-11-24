"use client"

import {useContext, useState} from "react"
import {MdFavorite, MdFavoriteBorder} from "react-icons/md"
import {FcDislike} from "react-icons/fc"
import {like, unlike} from "@/lib/api/likes"
import {SessionContext} from "@/lib/auth/session-provider"
import {LikeTarget} from "@/lib/types"
import toast from "react-hot-toast";


export function LikeToggleButton({
                                     target,
                                     targetId,
                                     initialLiked,
                                     targetName,
                                     className,
                                     onChange,
                                 }: {
    target: LikeTarget
    targetId: string
    initialLiked: boolean
    targetName: string,
    className?: string
    onChange?: (liked: boolean) => void
}) {
    const session = useContext(SessionContext)
    const [liked, setLiked] = useState(initialLiked)
    const [loading, setLoading] = useState(false)
    const [hovering, setHovering] = useState(false)

    if (!session?.accessToken) return null

    const handleToggle = async () => {
        if (loading) return

        setLoading(true)
        try {
            const result = liked
                ? await unlike(target, targetId, session)
                : await like(target, targetId, session)

            setLiked(result.liked)
            onChange?.(result.liked)

            if (result.liked) {
                toast.success(`You liked ${targetName}`, {style: {backgroundColor: '#333', color: 'white'}})
            } else {
                toast.error(`You broke up with ${targetName}`, {style: {backgroundColor: '#333', color: 'white'}})
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleToggle}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            disabled={loading}
            aria-pressed={liked}
            aria-label={liked ? "Remove from favorites" : "Add to favorites"}
            className={className ?? "inline-flex items-center justify-center cursor-pointer"}
        >
            {/* Liked State */}
            {liked ? (
                hovering ? (
                    <FcDislike className="h-5 w-5 transition-all duration-150"/>
                ) : (
                    <MdFavorite className="h-5 w-5 text-red-500 transition-all duration-150"/>
                )
            ) : (
                // Not Liked State
                <MdFavoriteBorder
                    className="h-5 w-5 text-red-500 hover:text-red-400 transition-all duration-150"
                />
            )}
        </button>
    )
}
