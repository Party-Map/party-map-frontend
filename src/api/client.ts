import { getEnv } from "@/lib/env";

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider = () => Promise.resolve(null);

/** The auth layer registers how to obtain a fresh access token; the API layer stays framework-free. */
export function setTokenProvider(provider: TokenProvider): void {
    tokenProvider = provider;
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const cleanPath = path.replace(/^\/+/, "");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const token = await tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${getEnv().apiBase}/${cleanPath}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
        throw new ApiError(res.status, `${method} /api/${cleanPath} failed with ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    delete: <T>(path: string) => request<T>("DELETE", path),
};
