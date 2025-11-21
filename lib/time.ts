export function fmtRange(startISO: string, endISO: string) {
    const s = new Date(startISO)
    const e = new Date(endISO)

    const date = s.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })

    const st = s.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    })

    const en = e.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    })

    return `${date} • ${st} – ${en}`
}