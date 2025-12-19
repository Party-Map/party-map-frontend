import {useState} from "react"
import Link from "next/link"
import Image from "next/image"
import {LikeToggleButton} from "@/components/LikeToggleButton"
import type {EventType, LikeTarget} from "@/lib/types"
import {EVENT_TYPE_BADGE_CLASSES, EVENT_TYPE_LABELS} from "@/lib/constants";
import {cn} from "@/lib/utils";

function renderColoredMeta(text: string) {
    for (const [type, label] of Object.entries(EVENT_TYPE_LABELS)) {
        if (text.includes(label)) {

            const badgeClass = EVENT_TYPE_BADGE_CLASSES[type as EventType]

            const [before, after] = text.split(label)

            return (
                <span>
                    {before}
                    <span
                        className={cn("inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold", badgeClass)}
                    >
                        {label}
                    </span>
                    {after}
                </span>
            )
        }
    }

    return text
}


export function LikedListItem({
                                  target,
                                  targetId,
                                  targetName,
                                  href,
                                  title,
                                  image,
                                  secondary,
                                  metaTop,
                                  metaBottom,
                              }: {
    target: LikeTarget
    targetId: string
    targetName: string
    href: string
    title: string
    image?: string | null
    secondary?: string
    metaTop?: string
    metaBottom?: string
}) {
    const [visible, setVisible] = useState(true)

    if (!visible) return null

    return (
        <li className="flex gap-3 sm:gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-zinc-950 p-3 sm:p-4">
            {image && (
                <div
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-zinc-800">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="64px"
                        className="object-cover"
                    />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <Link href={href}
                              className="font-semibold hover:text-violet-850 dark:hover:text-violet-400/60 break-words">
                            {title}
                        </Link>

                        {secondary && (
                            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-200 truncate">
                                {secondary}
                            </p>
                        )}
                    </div>
                    <LikeToggleButton
                        target={target}
                        targetId={targetId}
                        targetName={targetName}
                        initialLiked={true}
                        onChange={(liked) => {
                            if (!liked) {
                                setVisible(false)
                            }
                        }}
                    />
                </div>

                <div className="mt-1 space-y-0.5">
                    {metaTop && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            {metaTop}
                        </p>
                    )}
                    {metaBottom && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {renderColoredMeta(metaBottom)}
                        </p>
                    )}
                </div>
            </div>
        </li>
    )
}
