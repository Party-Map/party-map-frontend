// Browse lists: the paged, filtered public lists of events, places and performers, and the facets their chips show.
import { client, unwrap } from "./client";
import type { BrowseEventsQuery, BrowsePerformersQuery, BrowsePlacesQuery } from "./types";

export const fetchBrowseEvents = (query: BrowseEventsQuery) =>
    unwrap(client.GET("/api/browse/events", { params: { query } }));
export const fetchBrowsePlaces = (query: BrowsePlacesQuery) =>
    unwrap(client.GET("/api/browse/places", { params: { query } }));
export const fetchBrowsePerformers = (query: BrowsePerformersQuery) =>
    unwrap(client.GET("/api/browse/performers", { params: { query } }));
export const fetchPlaceTags = () => unwrap(client.GET("/api/browse/place-tags"));
export const fetchPerformerGenres = () => unwrap(client.GET("/api/browse/performer-genres"));
