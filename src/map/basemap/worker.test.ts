import { readFileSync } from "node:fs";
import path from "node:path";

import { getWorkerUrl } from "maplibre-gl";
import { version as maplibreVersion } from "maplibre-gl/package.json";

import { configureMaplibreWorker, MAPLIBRE_WORKER_URL } from "./worker";

describe("configureMaplibreWorker", () => {
    it("points MapLibre at the worker copied into the versioned static folder", () => {
        configureMaplibreWorker();
        expect(getWorkerUrl()).toBe(MAPLIBRE_WORKER_URL);
        expect(MAPLIBRE_WORKER_URL).toBe(`/static/maplibre-${maplibreVersion}/maplibre-gl-worker.mjs`);
    });

    it("matches the folder the build copies the worker into", () => {
        const config = readFileSync(path.resolve(process.cwd(), "rsbuild.config.ts"), "utf8");
        expect(config).toContain("const name = `static/maplibre-${maplibreVersion}/${file}`;");
        expect(config).toContain('["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]');
    });
});
