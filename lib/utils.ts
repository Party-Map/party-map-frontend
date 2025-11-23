import {ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";
import {GeoPoint} from "@/lib/types";
import {LatLngTuple} from "leaflet";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toLatLngTuple(point: GeoPoint): LatLngTuple {
    return [point.latitude, point.longitude]
}