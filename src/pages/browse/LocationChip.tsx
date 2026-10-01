import { LocateFixed, MapPin } from "lucide-react";

import { Chip } from "@/components/Chip";
import { useUserLocation } from "@/layout/LocationProvider";
import { toast } from "@/lib/toast";

/** Where the distances are measured from, and the way to switch from Budapest to the device position. */
export function LocationChip() {
    const { status, request } = useUserLocation();

    if (status === "granted") {
        return (
            <Chip pressed icon={<LocateFixed size={14} aria-hidden />} onClick={request}>
                Near you
            </Chip>
        );
    }

    const locating = status === "locating";
    const onClick = () => {
        if (status === "denied") toast.info("Location is blocked for this site in your browser settings.");
        request();
    };
    return (
        <Chip icon={<MapPin size={14} aria-hidden />} onClick={onClick} disabled={locating}>
            {locating ? "Locating…" : "Budapest · Use my location"}
        </Chip>
    );
}
