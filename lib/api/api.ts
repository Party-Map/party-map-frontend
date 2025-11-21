import type {JwtSession} from "@/lib/auth/jwt-session"

const API_BASE = process.env.NEXT_PUBLIC_RESOURCE_API_BASE_URL

function authHeaders(session: JwtSession | null): HeadersInit {
    return session ? session.authorizationHeader() : {}
}

export async function apiGet<T>(
    path: string,
    session: JwtSession | null
): Promise<T> {
    if (!API_BASE) {
        throw new Error("NEXT_PUBLIC_RESOURCE_API_BASE_URL is not defined")
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path

    const res = await fetch(`${API_BASE}/api/${cleanPath}`, {
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(session),
        },
    })

    if (!res.ok) {
        throw new Error(`GET ${cleanPath} failed: ${res.status}`)
    }

    return await res.json() as T
}
