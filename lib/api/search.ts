import type {JwtSession} from "@/lib/auth/jwt-session";
import {apiGet} from "@/lib/api/api";
import {SearchHit, SearchResponse} from "@/lib/types";

export async function fetchSearch(
    q: string | null,
    session: JwtSession | null
): Promise<SearchHit[]> {
    if (!q || !q.trim()) return [];

    const response = await apiGet<SearchResponse>(
        `search?q=${encodeURIComponent(q)}`,
        session
    );

    return response.hits;
}