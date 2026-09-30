import { mockApi } from "@/test/helpers";

import { ApiError, client, messageOf, setTokenProvider, unwrap } from "./client";

afterEach(() => {
    setTokenProvider(() => Promise.resolve(null));
});

describe("client", () => {
    it("calls the API under the configured base, with the schema's /api paths", async () => {
        const fetchMock = mockApi({ "GET /api/places": [] });
        await unwrap(client.GET("/api/places"));
        expect(fetchMock.requests[0]?.url).toBe("http://api.test/api/places");
    });

    it("sends no Authorization header without a token", async () => {
        const fetchMock = mockApi({ "GET /api/places": [] });
        await unwrap(client.GET("/api/places"));
        expect(fetchMock.requests[0]?.headers.has("Authorization")).toBe(false);
    });

    it("adds a Bearer header from the token provider", async () => {
        setTokenProvider(() => Promise.resolve("abc.def"));
        const fetchMock = mockApi({ "GET /api/places": [] });
        await unwrap(client.GET("/api/places"));
        expect(fetchMock.requests[0]?.headers.get("Authorization")).toBe("Bearer abc.def");
    });

    it("sends typed JSON bodies", async () => {
        const fetchMock = mockApi({ "POST /api/event-plan/plan-1/add-lineup-invitation": "OK" });
        const payload = { performerId: "p1", startTime: "2030-01-01T20:00", endTime: "2030-01-01T22:00" };
        await unwrap(
            client.POST("/api/event-plan/{id}/add-lineup-invitation", {
                params: { path: { id: "plan-1" } },
                body: payload,
            }),
        );
        expect(fetchMock.requests[0]?.method).toBe("POST");
        expect(fetchMock.requests[0]?.body).toEqual(payload);
    });
});

describe("unwrap", () => {
    it("resolves with the parsed data", async () => {
        mockApi({ "GET /api/places/p1": { id: "p1" } });
        await expect(unwrap(client.GET("/api/places/{id}", { params: { path: { id: "p1" } } }))).resolves.toEqual({
            id: "p1",
        });
    });

    it("resolves with nothing for an empty response", async () => {
        mockApi({ "DELETE /api/event-plan/plan-1/lineup-invitation/p1": null });
        const call = client.DELETE("/api/event-plan/{id}/lineup-invitation/{performerId}", {
            params: { path: { id: "plan-1", performerId: "p1" } },
        });
        await expect(unwrap(call)).resolves.toBeUndefined();
    });

    it("rejects with an ApiError carrying the status, path and body", async () => {
        mockApi({
            "GET /api/places/missing": () =>
                new Response(JSON.stringify({ status: 404, error: "Not Found" }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }),
        });
        const error = await unwrap(client.GET("/api/places/{id}", { params: { path: { id: "missing" } } })).catch(
            (e: unknown) => e,
        );
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ status: 404, body: { status: 404, error: "Not Found" } });
        expect((error as ApiError).message).toBe("Request failed with 404");
    });

    it("names the path when the response knows its URL", async () => {
        const response = new Response(null, { status: 500 });
        Object.defineProperty(response, "url", { value: "http://api.test/api/places" });
        const error = await unwrap(Promise.resolve({ response })).catch((e: unknown) => e);
        expect((error as ApiError).message).toBe("Request to /api/places failed with 500");
    });
});

describe("messageOf", () => {
    it("prefers the problem detail, then its title", () => {
        expect(
            messageOf(new ApiError(400, "x", { detail: "Name is required", title: "Bad Request" }), "fallback"),
        ).toBe("Name is required");
        expect(messageOf(new ApiError(400, "x", { detail: 3, title: "Bad Request" }), "fallback")).toBe("Bad Request");
    });

    it("falls back for anything else", () => {
        expect(messageOf(new ApiError(500, "x", { error: "Internal Server Error" }), "fallback")).toBe("fallback");
        expect(messageOf(new ApiError(500, "x", "plain text"), "fallback")).toBe("fallback");
        expect(messageOf(new ApiError(500, "x"), "fallback")).toBe("fallback");
        expect(messageOf(new Error("boom"), "fallback")).toBe("fallback");
    });
});
