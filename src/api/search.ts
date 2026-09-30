// Search across places, events, performers and tags.
import { client, unwrap } from "./client";
import type { SearchHit } from "./types";

/** The hits for a query; an empty query asks nothing and finds nothing. */
export async function search(query: string): Promise<SearchHit[]> {
    const q = query.trim();
    if (!q) return [];
    const response = await unwrap(client.GET("/api/search", { params: { query: { q } } }));
    return response.hits;
}
