import {LineupItem} from "@/lib/types";
import {LineupListItem} from "@/app/events/[id]/LineupListItem";

export function LineupList({items}: { items: LineupItem[] }) {
    const sorted = [...items].sort(
        (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    return (
        <>
            <h1 className="text-2xl font-bold mb-4">Lineup & Set Times</h1>
            <ul className="space-y-2">
                {sorted.map((item) => (
                    <LineupListItem
                        key={`${item.performer.id}-${item.startTime}`}
                        item={item}
                    />
                ))}
            </ul>
        </>
    )
}