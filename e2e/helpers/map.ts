// Reads and drives the Leaflet map in the browser for the map behaviour spec. The app hands its map and camera to
// the page in development builds (src/map/MapProbe.tsx); the probe installed here counts the map's moves.
import { expect, type Page } from "@playwright/test";

export interface MapState {
    center: [number, number];
    zoom: number;
    minZoom: number;
    /** `moveend`s since the probe was installed. */
    moves: number;
    /** Whether the camera has a move of its own in progress. */
    inFlight: boolean;
    size: { x: number; y: number };
}

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Probe {
    moves: number;
    /** Every move's end: the centre, zoom and the time since the probe went in. */
    log: { lat: number; lng: number; zoom: number; at: number }[];
    /** Every call of a move method, with who made it. */
    calls: { method: string; at: number; by: string }[];
}

declare global {
    interface Window {
        __pmProbe?: Probe;
    }
}

/** Hooks the map once it exists; call again after a navigation (the map page remounts). */
export async function installProbe(page: Page): Promise<void> {
    await page.waitForFunction(() => Boolean(window.__pmMap));
    await page.evaluate(() => {
        const map = window.__pmMap!;
        const probe: Probe = { moves: 0, log: [], calls: [] };
        const started = performance.now();
        map.on("moveend", () => {
            probe.moves += 1;
            const c = map.getCenter();
            probe.log.push({
                lat: c.lat,
                lng: c.lng,
                zoom: map.getZoom(),
                at: Math.round(performance.now() - started),
            });
        });
        // Who moves the map: the move methods are wrapped to note their callers.
        const target = map as unknown as Record<string, (...args: unknown[]) => unknown>;
        for (const method of ["panTo", "flyTo", "setView", "panBy", "fitBounds", "setZoom", "setZoomAround"]) {
            const original = target[method]!;
            target[method] = function wrapped(this: unknown, ...args: unknown[]) {
                const by = (new Error().stack ?? "").split("\n").slice(2, 6).join(" | ");
                probe.calls.push({ method, at: Math.round(performance.now() - started), by });
                return original.apply(this, args);
            };
        }
        window.__pmProbe = probe;
    });
}

/** The probe's move log, for a failure message. */
export async function moveLog(page: Page): Promise<string> {
    return page.evaluate(() =>
        JSON.stringify({ ends: window.__pmProbe?.log ?? [], calls: window.__pmProbe?.calls ?? [] }),
    );
}

export async function mapState(page: Page): Promise<MapState> {
    return page.evaluate(() => {
        const map = window.__pmMap!;
        const center = map.getCenter();
        const size = map.getSize();
        return {
            center: [center.lat, center.lng],
            zoom: map.getZoom(),
            minZoom: map.getMinZoom(),
            moves: window.__pmProbe?.moves ?? 0,
            inFlight: window.__pmCamera?.inFlight() ?? false,
            size: { x: size.x, y: size.y },
        };
    });
}

/** Puts the view somewhere without animation (as a restored view would), and waits for the places there. */
export async function setView(page: Page, center: [number, number], zoom: number): Promise<void> {
    await page.evaluate(
        ([lat, lng, z]) => {
            window.__pmMap!.setView([lat, lng], z, { animate: false });
        },
        [center[0], center[1], zoom] as const,
    );
    await settle(page);
}

/** Puts the view at the zoom so that the place's pin lands at the given container y, horizontally centred. */
export async function viewWithPinAt(page: Page, lat: number, lng: number, zoom: number, y: number): Promise<void> {
    await page.evaluate(
        ([la, ln, z, py]) => {
            const map = window.__pmMap!;
            const size = map.getSize();
            const center = map.unproject(map.project([la, ln], z).add([0, size.y / 2 - py]), z);
            map.setView(center, z, { animate: false });
        },
        [lat, lng, zoom, y] as const,
    );
    await settle(page);
}

/** The height of the free area between the bars; a card with its pin needs about 340 px of it. */
export async function cardRoom(page: Page): Promise<number> {
    const free = await band(page);
    return free.bottom - free.top;
}
export const CARD_ROOM = 340;

/** Waits until the map has not moved for a while and the camera has nothing in flight. */
export async function settle(page: Page, quietMs = 700): Promise<void> {
    await expect
        .poll(
            async () => {
                const before = await mapState(page);
                await page.waitForTimeout(quietMs);
                const after = await mapState(page);
                return before.moves === after.moves && !after.inFlight && before.zoom === after.zoom;
            },
            { timeout: 10_000 },
        )
        .toBe(true);
}

/** The map pane's transform, which changes with every animation frame of a pan or zoom. */
async function paneTransform(page: Page): Promise<string> {
    return page.locator(".leaflet-map-pane").evaluate((el) => getComputedStyle(el).transform);
}

/** Asserts that nothing moves the map for a while: no bounce, no corrective pan. */
export async function expectStill(page: Page, ms = 1500): Promise<void> {
    const before = await mapState(page);
    const transform = await paneTransform(page);
    await page.waitForTimeout(ms);
    const after = await mapState(page);
    expect(after.moves, await moveLog(page)).toBe(before.moves);
    expect(after.inFlight).toBe(false);
    expect(await paneTransform(page)).toBe(transform);
}

/** The open card; a card that was just closed fades out for 200 ms beside it, so the newest one is the card. */
export const card = (page: Page) => page.locator(".leaflet-popup").last();
export const activePin = (page: Page) => page.locator(".pm-pin--active");
export const label = (page: Page, text: string | RegExp) =>
    page.locator(".pm-label-marker", { hasText: text }).getByRole("button");

/** The free area between the bars, in viewport pixels (the bottom bar is gone on desktop). */
export async function band(page: Page): Promise<{ top: number; bottom: number; left: number; right: number }> {
    const size = page.viewportSize()!;
    // The header's inner bar sits 8 px from the top; the bottom nav's wrapper carries the bar and its gap.
    const topBar = await page.getByRole("banner").locator("> div").boundingBox();
    const bottomNav = page.getByRole("navigation", { name: "Mobile navigation" });
    const bottomBox = (await bottomNav.isVisible()) ? await bottomNav.boundingBox() : null;
    return {
        top: topBar ? topBar.y + topBar.height : 0,
        bottom: bottomBox ? bottomBox.y : size.height,
        left: 0,
        right: size.width,
    };
}

/** A point on the map background inside the free area, clear of the open card and its pin, for a gesture. */
export async function freeSpot(page: Page): Promise<{ x: number; y: number }> {
    const free = await band(page);
    const taken = [await card(page).boundingBox(), await activePin(page).boundingBox()].filter(
        (box): box is Box => box !== null,
    );
    const clear = (x: number, y: number) =>
        taken.every(
            (box) => x < box.x - 20 || x > box.x + box.width + 20 || y < box.y - 20 || y > box.y + box.height + 20,
        );
    const middle = (free.top + free.bottom) / 2;
    const candidates = [
        { x: free.right * 0.5, y: free.bottom - 40 },
        { x: free.right * 0.85, y: middle },
        { x: free.right * 0.15, y: middle },
        { x: free.right * 0.5, y: free.top + 40 },
    ];
    const spot = candidates.find((c) => clear(c.x, c.y));
    if (!spot) throw new Error("no free spot on the map");
    return spot;
}

/** The open card and its pin sit inside the free area between the bars (give or take a pixel of rounding). */
export async function expectCardInBand(page: Page): Promise<void> {
    await expect(card(page)).toBeVisible();
    const free = await band(page);
    const cardBox = (await card(page).boundingBox())!;
    const pinBox = (await activePin(page).boundingBox())!;
    const slack = 2;
    expect(cardBox.y).toBeGreaterThanOrEqual(free.top - slack);
    expect(cardBox.x).toBeGreaterThanOrEqual(free.left - slack);
    expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(free.right + slack);
    expect(pinBox.y + pinBox.height).toBeLessThanOrEqual(free.bottom + slack);
}

/** Taps the pin of a place: the marker icon nearest to the place's point gets the click (pins may sit under controls). */
export async function tapPlace(page: Page, lat: number, lng: number): Promise<void> {
    const found = await page.evaluate(
        ([la, ln]) => {
            const map = window.__pmMap!;
            const target = map.latLngToContainerPoint([la, ln]);
            const container = map.getContainer().getBoundingClientRect();
            let best: { el: Element; distance: number } | null = null;
            for (const el of Array.from(document.querySelectorAll(".leaflet-marker-icon.pm-pin-wrapper"))) {
                const box = el.getBoundingClientRect();
                const anchor = { x: box.left - container.left + box.width / 2, y: box.top - container.top + 44 };
                const distance = Math.hypot(anchor.x - target.x, anchor.y - target.y);
                if (!best || distance < best.distance) best = { el, distance };
            }
            if (!best || best.distance > 40) return false;
            best.el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
            return true;
        },
        [lat, lng] as const,
    );
    expect(found, `no pin near ${lat},${lng}`).toBe(true);
}

/** Drags the map by the given pixels, in steps, starting low on the screen (clear of a card above the centre). */
export async function drag(page: Page, dx: number, dy: number, steps = 12): Promise<void> {
    const size = page.viewportSize()!;
    const from = { x: size.width / 2, y: size.height * 0.82 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let i = 1; i <= steps; i += 1) {
        await page.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    }
    await page.mouse.up();
    await settle(page);
}

/** Shoves the map this many screens in a direction, drag by drag. */
export async function shove(
    page: Page,
    direction: "west" | "east" | "north" | "south",
    screens: number,
): Promise<void> {
    const size = page.viewportSize()!;
    const horizontal = direction === "west" || direction === "east";
    const step = horizontal ? size.width * 0.8 : size.height * 0.5;
    const sign = direction === "west" || direction === "north" ? 1 : -1;
    const times = Math.ceil((screens * (horizontal ? size.width : size.height)) / step);
    for (let i = 0; i < times; i += 1) {
        await drag(page, horizontal ? sign * step : 0, horizontal ? 0 : sign * step, 6);
    }
}

/** A two-finger pinch through the browser's real input pipeline (Chromium only, touch projects). */
export async function pinch(page: Page, center: { x: number; y: number }, scale: number, steps = 12): Promise<void> {
    const cdp = await page.context().newCDPSession(page);
    const start = 80;
    const points = (distance: number) => [
        { x: center.x - distance / 2, y: center.y, id: 0 },
        { x: center.x + distance / 2, y: center.y, id: 1 },
    ];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(start) });
    for (let i = 1; i <= steps; i += 1) {
        await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: points(start + ((start * scale - start) * i) / steps),
        });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
    await settle(page);
}

/**
 * The view stays inside the wall (the country's box grown by the bars' cover north and south), or, where the wall is
 * smaller than the view, centred on it, as Leaflet keeps it. Checked in pixels at the current zoom.
 */
export async function expectInsideWall(page: Page): Promise<void> {
    const report = await page.evaluate(() => {
        const map = window.__pmMap!;
        const zoom = map.getZoom();
        const size = map.getSize();
        const extent = { south: 45.737, west: 16.114, north: 48.585, east: 22.897 };
        const bottomInset = size.x < 1024 ? 76 : 0;
        const wallMin = map.project([extent.north, extent.west], zoom).subtract([0, 72]);
        const wallMax = map.project([extent.south, extent.east], zoom).add([0, bottomInset]);
        const centre = map.project(map.getCenter(), zoom);
        const viewMin = centre.subtract(size.divideBy(2));
        const viewMax = centre.add(size.divideBy(2));
        const slack = 2;
        const axis = (lo: number, hi: number, wLo: number, wHi: number) =>
            hi - lo > wHi - wLo
                ? Math.abs((lo + hi) / 2 - (wLo + wHi) / 2) <= slack
                : lo >= wLo - slack && hi <= wHi + slack;
        return {
            x: axis(viewMin.x, viewMax.x, wallMin.x, wallMax.x),
            y: axis(viewMin.y, viewMax.y, wallMin.y, wallMax.y),
            view: [viewMin.x, viewMin.y, viewMax.x, viewMax.y].map(Math.round),
            wall: [wallMin.x, wallMin.y, wallMax.x, wallMax.y].map(Math.round),
        };
    });
    expect(report, JSON.stringify(report)).toEqual(expect.objectContaining({ x: true, y: true }));
}

export interface StoredView {
    center: [number, number];
    zoom: number;
    popupId: string | null;
}

/** The map memory the app keeps in sessionStorage. */
export async function storedView(page: Page): Promise<StoredView> {
    const raw = await page.evaluate(() => sessionStorage.getItem("pm:map:v1"));
    if (!raw) throw new Error("no map memory stored");
    return JSON.parse(raw) as StoredView;
}
