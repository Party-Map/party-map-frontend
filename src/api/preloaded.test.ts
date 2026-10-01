import { eventKeys, performerKeys, placeKeys } from "./keys";
import { readPreloaded, seedQueryClient } from "./preloaded";
import { createQueryClient } from "./queryClient";

function withScript(content: string | null): Document {
    const doc = document.implementation.createHTMLDocument("");
    if (content !== null) {
        const script = doc.createElement("script");
        script.id = "pm-data";
        script.type = "application/json";
        script.textContent = content;
        doc.body.append(script);
    }
    return doc;
}

describe("readPreloaded", () => {
    it("reads a known payload and removes the element", () => {
        const payload = { v: 1, kind: "event", id: "event-1", data: { event: { id: "event-1" }, place: null } };
        const doc = withScript(JSON.stringify(payload));
        expect(readPreloaded(doc)).toEqual({ kind: "event", id: "event-1", data: payload.data });
        expect(doc.getElementById("pm-data")).toBeNull();
        expect(readPreloaded(doc)).toBeNull();
    });

    it.each([
        ["no element", null],
        ["broken JSON", "{nope"],
        ["another version", JSON.stringify({ v: 2, kind: "event", id: "e", data: {} })],
        ["an unknown kind", JSON.stringify({ v: 1, kind: "user", id: "u", data: {} })],
        ["a missing id", JSON.stringify({ v: 1, kind: "place", data: {} })],
        ["data that is not an object", JSON.stringify({ v: 1, kind: "place", id: "p", data: 3 })],
    ])("ignores %s", (_, content) => {
        expect(readPreloaded(withScript(content))).toBeNull();
    });
});

describe("seedQueryClient", () => {
    it("stores the data under the page key of its kind, fresh for a minute", () => {
        const client = createQueryClient();
        seedQueryClient(client, { kind: "place", id: "place-1", data: { place: { id: "place-1" }, events: [] } });
        seedQueryClient(client, { kind: "performer", id: "p-1", data: { performer: {}, events: [] } });
        seedQueryClient(client, { kind: "event", id: "e-1", data: { event: {}, place: null } });
        expect(client.getQueryData(placeKeys.page("place-1"))).toEqual({ place: { id: "place-1" }, events: [] });
        expect(client.getQueryData(performerKeys.page("p-1"))).toEqual({ performer: {}, events: [] });
        expect(client.getQueryData(eventKeys.page("e-1"))).toEqual({ event: {}, place: null });
        expect(client.getQueryDefaults(placeKeys.page("place-1"))).toMatchObject({ staleTime: 60_000 });
        expect(client.getQueryData(placeKeys.page("place-2"))).toBeUndefined();
    });

    it("does nothing without a payload", () => {
        const client = createQueryClient();
        seedQueryClient(client, null);
        expect(client.getQueryCache().getAll()).toHaveLength(0);
    });
});
