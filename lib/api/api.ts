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

export async function apiPut<T>(
    path: string,
    session: JwtSession | null,
    body?: unknown
): Promise<T> {
    if (!API_BASE) {
        throw new Error("NEXT_PUBLIC_RESOURCE_API_BASE_URL is not defined")
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path

    const res = await fetch(`${API_BASE}/api/${cleanPath}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(session),
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        throw new Error(`PUT ${cleanPath} failed: ${res.status}`)
    }

    return await res.json() as T
}

export async function apiPost<T>(
    path: string,
    session: JwtSession | null,
    body?: unknown
): Promise<T> {
    if (!API_BASE) {
        throw new Error("NEXT_PUBLIC_RESOURCE_API_BASE_URL is not defined")
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path

    const res = await fetch(`${API_BASE}/api/${cleanPath}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(session),
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        throw new Error(`POST ${cleanPath} failed: ${res.status}`)
    }

    return await res.json() as T
}


export async function apiDelete<T>(
    path: string,
    session: JwtSession | null
): Promise<T> {
    if (!API_BASE) {
        throw new Error("NEXT_PUBLIC_RESOURCE_API_BASE_URL is not defined")
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path

    const res = await fetch(`${API_BASE}/api/${cleanPath}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(session),
        },
    })

    if (!res.ok) {
        throw new Error(`DELETE ${cleanPath} failed: ${res.status}`)
    }

    return await res.json() as T
}