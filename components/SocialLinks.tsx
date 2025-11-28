import type {Link as EntityLink, LinkType} from "@/lib/types"

import {FaFacebookSquare, FaInstagram, FaReddit} from "react-icons/fa"
import {FaSquareXTwitter} from "react-icons/fa6"
import {CiGlobe} from "react-icons/ci"
import {IconType} from "react-icons";

const LABELS: Record<LinkType, string> = {
    INSTAGRAM: "Instagram",
    FACEBOOK: "Facebook",
    TWITTER: "Twitter",
    REDDIT: "Reddit",
    WEBSITE: "Website",
}

const ICONS: Record<LinkType, IconType> = {
    INSTAGRAM: FaInstagram,
    FACEBOOK: FaFacebookSquare,
    TWITTER: FaSquareXTwitter,
    REDDIT: FaReddit,
    WEBSITE: CiGlobe,
}

export function SocialLinks({
                                links,
                                className,
                            }: {
    links?: EntityLink[]
    className?: string
}) {
    if (!links || links.length === 0) return null

    const wrapperClass =
        "mt-2 flex flex-wrap items-center gap-3 text-sm" +
        (className ? ` ${className}` : "")

    return (
        <div className={wrapperClass}>
            {links.map((l) => {
                const Icon = ICONS[l.type]
                return (
                    <a
                        key={l.type}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 px-3 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/50"
                    >
                        <Icon className="text-lg"/>
                        {LABELS[l.type]}
                    </a>
                )
            })}
        </div>
    )
}
