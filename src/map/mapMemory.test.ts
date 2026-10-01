import { MAP_MEMORY_STORAGE_KEY } from "@/lib/constants";

import { forgetMap, type MapMemory, recallMap, rememberMap } from "./mapMemory";

const remembered: MapMemory = { center: [47.6, 19.2], zoom: 15, popupId: "place-2" };

describe("map memory", () => {
    afterEach(() => {
        forgetMap();
        vi.restoreAllMocks();
    });

    it("starts empty, keeps what it is told and forgets on request", () => {
        expect(recallMap()).toBeNull();
        rememberMap(remembered);
        expect(recallMap()).toEqual(remembered);
        expect(JSON.parse(sessionStorage.getItem(MAP_MEMORY_STORAGE_KEY) ?? "null")).toEqual(remembered);
        forgetMap();
        expect(recallMap()).toBeNull();
        expect(sessionStorage.getItem(MAP_MEMORY_STORAGE_KEY)).toBeNull();
    });

    it("survives a fresh module load through the session's storage", async () => {
        rememberMap(remembered);
        vi.resetModules();
        const fresh = await import("./mapMemory");
        expect(fresh.recallMap()).toEqual(remembered);
    });

    it.each([
        ["corrupt JSON", "{nope"],
        ["a foreign shape", JSON.stringify({ center: [1], zoom: 3, popupId: null })],
        ["a non-numeric zoom", JSON.stringify({ center: [1, 2], zoom: "3", popupId: null })],
        ["a non-string popup id", JSON.stringify({ center: [1, 2], zoom: 3, popupId: 7 })],
    ])("ignores %s in the storage", async (_, raw) => {
        sessionStorage.setItem(MAP_MEMORY_STORAGE_KEY, raw);
        vi.resetModules();
        const fresh = await import("./mapMemory");
        expect(fresh.recallMap()).toBeNull();
    });

    it("still remembers within the page load when the storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("quota");
        });
        vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
            throw new Error("quota");
        });
        rememberMap(remembered);
        expect(recallMap()).toEqual(remembered);
        forgetMap();
        expect(recallMap()).toBeNull();
    });
});
