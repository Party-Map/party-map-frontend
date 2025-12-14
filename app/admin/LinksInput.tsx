"use client"

import type {Link, LinkConfig, LinkType} from "@/lib/types"


const LINK_CONFIG: LinkConfig[] = [
    {type: "INSTAGRAM", label: "Instagram", prefix: "https://instagram.com/"},
    {type: "FACEBOOK", label: "Facebook", prefix: "https://facebook.com/"},
    {type: "TWITTER", label: "Twitter", prefix: "https://twitter.com/"},
    {type: "REDDIT", label: "Reddit", prefix: "https://reddit.com/"},
    {type: "WEBSITE", label: "Website", prefix: "https://"},
]

const ALL_LINK_TYPES: LinkType[] = LINK_CONFIG.map((c) => c.type)

function getConfig(type: LinkType): LinkConfig {
    return LINK_CONFIG.find((c) => c.type === type)!
}

function toSuffix(type: LinkType, url: string): string {
    const {prefix} = getConfig(type)
    return url.startsWith(prefix) ? url.slice(prefix.length) : url
}

function buildUrl(type: LinkType, suffix: string): string {
    const trimmed = suffix.trim()
    if (!trimmed) return ""
    const {prefix} = getConfig(type)
    return prefix + trimmed
}

export function LinksInput({
                               value,
                               onChange,
                               label = "Links",
                           }: {
    value: Link[]
    onChange: (links: Link[]) => void
    label?: string
}) {
    const addLink = () => {
        const unused = ALL_LINK_TYPES.find(
            (t) => !value.some((l) => l.type === t),
        )
        if (!unused) return
        onChange([...value, {type: unused, url: ""}])
    }

    const updateType = (index: number, newType: LinkType) => {
        if (value.some((l, i) => i !== index && l.type === newType)) return

        const prev = value[index]
        const suffix = toSuffix(prev.type, prev.url)

        const next = [...value]
        next[index] = {
            type: newType,
            url: buildUrl(newType, suffix),
        }
        onChange(next)
    }

    const updateSuffix = (index: number, suffix: string) => {
        const next = [...value]
        const link = next[index]
        next[index] = {
            ...link,
            url: buildUrl(link.type, suffix),
        }
        onChange(next)
    }

    const remove = (index: number) => {
        const next = [...value]
        next.splice(index, 1)
        onChange(next)
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{label}</label>
                <button
                    type="button"
                    onClick={addLink}
                    disabled={value.length >= ALL_LINK_TYPES.length}
                    className="text-xs text-zinc-700 hover:underline dark:text-zinc-300 disabled:opacity-50"
                >
                    + Add link
                </button>
            </div>

            {value.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Add Instagram, Facebook, Twitter, Reddit or a website.
                </p>
            )}

            <div className="space-y-2">
                {value.map((link, index) => {
                    const {prefix} = getConfig(link.type)
                    const suffix = toSuffix(link.type, link.url)

                    return (
                        <div key={link.type} className="flex items-center gap-2">
                            <select
                                className="w-32 rounded-xl border border-zinc-300 bg-white px-2 py-2 text-xs dark:bg-zinc-900 dark:border-zinc-700"
                                value={link.type}
                                onChange={(e) => updateType(index, e.target.value as LinkType)}
                            >
                                {LINK_CONFIG.map(({type, label}) => (
                                    <option
                                        key={type}
                                        value={type}
                                        disabled={value.some(
                                            (l, i) => l.type === type && i !== index,
                                        )}
                                    >
                                        {label}
                                    </option>
                                ))}
                            </select>

                            <div
                                className="flex flex-1 items-center rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                <span className="px-2 text-xs text-zinc-500 dark:text-zinc-400">
                                  {prefix}
                                </span>
                                <input
                                    className="w-full bg-transparent px-2 py-2 text-xs outline-none"
                                    value={suffix}
                                    onChange={(e) => updateSuffix(index, e.target.value)}
                                    placeholder="username-or-path"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="rounded-xl border border-zinc-300 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                                Remove
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
