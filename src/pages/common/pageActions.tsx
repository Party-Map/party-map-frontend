import { MapPin, Navigation, Share2 } from "lucide-react";

import type { GeoPoint, ID } from "@/api/types";
import { PillAnchor, PillButton, PillLink } from "@/components/Pill";
import { directionsUrl } from "@/lib/maps";
import { shareOrCopy } from "@/lib/share";

/** Opens the map with the place's card. */
export function MapPill({ placeId }: { placeId: ID }) {
    return (
        <PillLink to={`/?focus=${placeId}`} icon={<MapPin size={16} aria-hidden />}>
            Show on map
        </PillLink>
    );
}

export function DirectionsPill({ point }: { point: GeoPoint }) {
    return (
        <PillAnchor href={directionsUrl(point)} icon={<Navigation size={16} aria-hidden />}>
            Directions
        </PillAnchor>
    );
}

/** Shares the current page. */
export function SharePill({ title }: { title: string }) {
    return (
        <PillButton
            icon={<Share2 size={16} aria-hidden />}
            onClick={() => void shareOrCopy({ title, url: window.location.href })}
        >
            Share
        </PillButton>
    );
}
