// The map's behaviour: every move lands once, where it was told, and nothing bounces (see the plan's edge-case
// matrix). Runs on the desktop and phone projects plus a landscape phone and a tablet. Needs the dev stack with the
// seeded border places (party-map-backend db/seed/afterMigrate.sql).
import { expect, type Page, test } from "@playwright/test";

import {
    activePin,
    band,
    card,
    CARD_ROOM,
    cardRoom,
    drag,
    expectCardInBand,
    expectInsideWall,
    expectStill,
    freeSpot,
    installProbe,
    label,
    mapState,
    moveLog,
    pinch,
    settle,
    setView,
    shove,
    storedView,
    tapPlace,
    viewWithPinAt,
} from "./helpers/map";

const RUIN_BAR = { lat: 47.4984, lng: 19.0593, name: /Ruin Bar 42|Basement Breaks/ };
const DANUBE_CLUB = { lat: 47.5005, lng: 19.0481, name: /Danube Club|Sunset Sessions/ };
const WAREHOUSE = { lat: 47.4869, lng: 19.0701, name: /Warehouse X|Warehouse All-Nighter/ };
const FURED = { lat: 46.9606, lng: 17.871, name: /Füred Pier Lounge/ };
const HOLLOHAZA = { lat: 48.5397, lng: 21.4106, name: /Hollóházi Kúria|Border Beats/ };
const GARBOLC = { lat: 47.9453, lng: 22.8699, name: /Garbolc Tanya/ };
const BEREMEND = { lat: 45.7917, lng: 18.4317, name: /Beremend Pince/ };

async function openMap(page: Page) {
    await page.goto("/");
    await expect(page.locator(".pm-pin").first()).toBeVisible();
    await installProbe(page);
    await settle(page);
}

/** Opens a card with a tap on the place's pin and waits for the camera; the moves it took. */
async function openCard(page: Page, place: { lat: number; lng: number; name: RegExp }) {
    const before = (await mapState(page)).moves;
    await tapPlace(page, place.lat, place.lng);
    await expect(card(page)).toContainText(place.name);
    await settle(page);
    return (await mapState(page)).moves - before;
}

/** Skips a test whose card could never sit between the bars (a phone held sideways). */
async function needsRoomForCard(page: Page) {
    test.skip((await cardRoom(page)) < CARD_ROOM, "the card is taller than the free area between the bars");
}

test.describe("opening a card", () => {
    test("pans just enough for a card cut off under the top bar, once, and then stays still", async ({ page }) => {
        await openMap(page);
        await needsRoomForCard(page);
        // The pin just under the top bar: its card would be clipped.
        await viewWithPinAt(page, RUIN_BAR.lat, RUIN_BAR.lng, 14, 120);
        const moves = await openCard(page, RUIN_BAR);
        expect(moves, await moveLog(page)).toBeLessThanOrEqual(1);
        expect((await mapState(page)).zoom).toBe(14);
        await expectCardInBand(page);
        await expectStill(page);
    });

    test("does not move for a card that is already in view", async ({ page }) => {
        await openMap(page);
        await needsRoomForCard(page);
        // The pin low in the free area: its card has room above it.
        const free = await band(page);
        await viewWithPinAt(page, RUIN_BAR.lat, RUIN_BAR.lng, 14, free.bottom - 60);
        const moves = await openCard(page, RUIN_BAR);
        expect(moves, await moveLog(page)).toBe(0);
        await expectCardInBand(page);
        await expectStill(page, 800);
    });

    test("zooms in from the floor instead of bouncing against the wall", async ({ page }) => {
        await openMap(page);
        await needsRoomForCard(page);
        const { minZoom } = await mapState(page);
        await setView(page, [47.2, 19.5], minZoom);
        await expect(page.locator(".pm-pin").first()).toBeVisible();
        const before = (await mapState(page)).moves;
        await tapPlace(page, HOLLOHAZA.lat, HOLLOHAZA.lng);
        await expect(card(page)).toContainText("Hollóházi Kúria");
        await settle(page);
        const after = await mapState(page);
        expect(after.moves - before, await moveLog(page)).toBeLessThanOrEqual(1);
        expect(after.zoom).toBeGreaterThan(minZoom);
        expect(after.zoom).toBeLessThanOrEqual(16);
        await expectCardInBand(page);
        await expectInsideWall(page);
        await expectStill(page);
    });

    test("zooms in a step for a pin at the eastern border whose card the wall keeps out", async ({
        page,
        isMobile,
    }) => {
        await openMap(page);
        await needsRoomForCard(page);
        await setView(page, [GARBOLC.lat, GARBOLC.lng], 13);
        const moves = await openCard(page, GARBOLC);
        expect(moves, await moveLog(page)).toBeLessThanOrEqual(1);
        const state = await mapState(page);
        // On a phone the card is wider than the room the wall leaves; on desktop it just fits at this zoom.
        if (isMobile) expect(state.zoom).toBeGreaterThan(13);
        else expect(state.zoom).toBeGreaterThanOrEqual(13);
        await expectCardInBand(page);
        await expectInsideWall(page);
        await expectStill(page);
    });

    test("keeps the card open when it is dragged off the screen and back", async ({ page }) => {
        test.setTimeout(90_000);
        await openMap(page);
        await setView(page, [DANUBE_CLUB.lat, DANUBE_CLUB.lng], 15);
        await openCard(page, DANUBE_CLUB);
        const { moves } = await mapState(page);
        await drag(page, -900, 0);
        await drag(page, -900, 0);
        await expect(card(page)).toBeAttached();
        await expect(activePin(page)).toBeAttached();
        await drag(page, 900, 0);
        await drag(page, 900, 0);
        await expect(card(page)).toBeVisible();
        // Four drags (with their inertia), nothing else: nothing pulled the map back.
        const after = await mapState(page);
        expect(after.moves - moves, await moveLog(page)).toBeLessThanOrEqual(8);
        expect(after.inFlight).toBe(false);
        await expectStill(page, 800);
    });

    test("switching cards moves at most once, and closing never moves", async ({ page }) => {
        await openMap(page);
        await needsRoomForCard(page);
        await viewWithPinAt(page, RUIN_BAR.lat, RUIN_BAR.lng, 14, 200);
        await openCard(page, RUIN_BAR);
        const switched = await openCard(page, WAREHOUSE);
        expect(switched, await moveLog(page)).toBeLessThanOrEqual(1);
        await expect(card(page)).toContainText(WAREHOUSE.name);

        const before = (await mapState(page)).moves;
        await card(page).getByRole("button", { name: "Close popup" }).click();
        await expect(card(page)).toBeHidden();
        // A label opens its place like the pin does; the open card hides its own label, so the pin toggles it closed.
        await expect(label(page, WAREHOUSE.name)).toBeVisible();
        await label(page, WAREHOUSE.name).click();
        await expect(card(page)).toBeVisible();
        await tapPlace(page, WAREHOUSE.lat, WAREHOUSE.lng);
        await expect(card(page)).toBeHidden();
        await page.mouse.click(40, (await mapState(page)).size.y / 2);
        await expect(card(page)).toBeHidden();
        expect((await mapState(page)).moves, await moveLog(page)).toBe(before);
    });
});

test.describe("gestures", () => {
    test("zooming with a card open never pulls the card back", async ({ page, isMobile }) => {
        await openMap(page);
        await setView(page, [RUIN_BAR.lat, RUIN_BAR.lng], 15);
        await openCard(page, RUIN_BAR);
        // Clear of the pin and its card: a press on the card would stay with the card.
        const spot = await freeSpot(page);
        if (isMobile) {
            await pinch(page, spot, 1.8);
        } else {
            await page.mouse.move(spot.x, spot.y);
            await page.mouse.wheel(0, -300);
            await settle(page);
            await page.getByRole("button", { name: "Zoom in" }).click();
            await settle(page);
        }
        await expect(card(page)).toBeAttached();
        const state = await mapState(page);
        expect(state.zoom, await moveLog(page)).toBeGreaterThan(15);
        await expectStill(page, 800);
    });

    test("a pinch ends on the zoom the fingers left, never below the floor", async ({ page, isMobile }) => {
        test.skip(!isMobile, "a pinch needs a touch screen");
        test.setTimeout(60_000);
        await openMap(page);
        await setView(page, [47.4979, 19.0402], 13);
        const size = (await mapState(page)).size;
        await pinch(page, { x: size.x / 2, y: size.y / 2 }, 1.5);
        const zoomed = await mapState(page);
        expect(zoomed.zoom).toBeGreaterThan(13);
        expect(Number.isInteger(zoomed.zoom)).toBe(false);

        const { minZoom } = await mapState(page);
        await setView(page, [47.2, 19.5], minZoom);
        await pinch(page, { x: size.x / 2, y: size.y / 2 }, 0.3);
        const floored = await mapState(page);
        expect(floored.zoom).toBeCloseTo(minZoom, 6);
        await expectStill(page, 800);
    });

    test("the wall holds in every direction, and the floor view cannot be dragged", async ({ page }) => {
        test.setTimeout(120_000);
        await openMap(page);
        const { minZoom } = await mapState(page);
        // A level and a half above the floor the country is larger than the screen in both directions.
        await setView(page, [47.4979, 19.0402], minZoom + 1.5);
        for (const direction of ["west", "north", "east", "south"] as const) {
            await shove(page, direction, 2);
            await expectInsideWall(page);
        }
        await setView(page, [47.2, 19.5], minZoom);
        const before = await mapState(page);
        await drag(page, 300, 200);
        const after = await mapState(page);
        // Leaflet lets a pixel of rounding through, which at the floor is a hundredth of a degree.
        expect(Math.abs(after.center[0] - before.center[0])).toBeLessThan(0.03);
        expect(Math.abs(after.center[1] - before.center[1])).toBeLessThan(0.03);
        await expectInsideWall(page);
    });

    test("a zoom at the border lands once, without a corrective nudge", async ({ page, isMobile }) => {
        await openMap(page);
        await setView(page, [GARBOLC.lat, GARBOLC.lng], 12);
        await expectInsideWall(page);
        const size = (await mapState(page)).size;
        const before = (await mapState(page)).moves;
        if (isMobile) await pinch(page, { x: size.x * 0.8, y: size.y / 2 }, 1.6);
        else {
            await page.mouse.move(size.x * 0.8, size.y / 2);
            await page.mouse.wheel(0, -200);
            await settle(page);
        }
        const after = await mapState(page);
        expect(after.zoom).toBeGreaterThan(12);
        expect(after.moves - before, await moveLog(page)).toBe(1);
        await expectInsideWall(page);
        await expectStill(page);
    });

    test("turning the device recomputes the floor both ways", async ({ page }) => {
        await openMap(page);
        const portrait = page.viewportSize()!;
        const { minZoom: floorBefore } = await mapState(page);
        await page.setViewportSize({ width: portrait.height, height: portrait.width });
        await settle(page);
        const turned = await mapState(page);
        expect(turned.minZoom).not.toBeCloseTo(floorBefore, 3);
        expect(turned.zoom).toBeGreaterThanOrEqual(turned.minZoom - 1e-6);
        await page.setViewportSize(portrait);
        await settle(page);
        expect((await mapState(page)).minZoom).toBeCloseTo(floorBefore, 6);
        await expectInsideWall(page);
    });
});

test.describe("search and history", () => {
    test("a search pick lands with the card fully visible in one flight", async ({ page }) => {
        await openMap(page);
        await needsRoomForCard(page);
        const before = (await mapState(page)).moves;
        await page.getByRole("combobox", { name: "Search" }).fill("hollóházi");
        await page
            .getByRole("listbox", { name: "Search results" })
            .getByRole("option", { name: /Hollóházi/ })
            .first()
            .click();
        await expect(card(page)).toContainText("Hollóházi Kúria");
        await settle(page);
        const after = await mapState(page);
        expect(after.moves - before, await moveLog(page)).toBeLessThanOrEqual(1);
        expect(after.zoom).toBeGreaterThanOrEqual(15);
        await expectCardInBand(page);
        await expectInsideWall(page);
        await expectStill(page);
    });

    test("back from a detail page restores the dragged view and its card without a move", async ({ page }) => {
        await openMap(page);
        await needsRoomForCard(page);
        await setView(page, [DANUBE_CLUB.lat, DANUBE_CLUB.lng], 15);
        await openCard(page, DANUBE_CLUB);
        await drag(page, 120, -90);
        const before = await storedView(page);
        expect(before.popupId).toBeTruthy();

        await card(page).getByRole("link").first().click();
        await expect(page).toHaveURL(/\/(events|places)\//);
        await page.getByRole("link", { name: "Back" }).click();
        await expect(page).toHaveURL("/");
        await installProbe(page);
        await expect(card(page)).toContainText(DANUBE_CLUB.name);
        await settle(page);
        const after = await storedView(page);
        expect(after.zoom).toBeCloseTo(before.zoom, 6);
        expect(Math.abs(after.center[0] - before.center[0])).toBeLessThan(1e-4);
        expect(Math.abs(after.center[1] - before.center[1])).toBeLessThan(1e-4);
        expect((await mapState(page)).moves, await moveLog(page)).toBe(0);
    });

    test("back to a query keeps the card, the view and the quiet search box", async ({ page }) => {
        await openMap(page);
        await needsRoomForCard(page);
        const box = page.getByRole("combobox", { name: "Search" });
        const results = page.getByRole("listbox", { name: "Search results" });
        await box.fill("balaton");
        await expect(results).toBeVisible();
        await box.press("Enter");
        await expect(page).toHaveURL(/q=balaton/);
        // Following the query link mounts the box again with its results open; put them away before using the map.
        await expect(results).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(results).toBeHidden();
        await installProbe(page);
        await settle(page);
        await setView(page, [FURED.lat, FURED.lng], 15);
        await openCard(page, FURED);
        await drag(page, 80, 60);
        const before = await storedView(page);

        await card(page).getByRole("link").first().click();
        await expect(page).toHaveURL(/\/(events|places)\//);
        await page.getByRole("link", { name: "Back" }).click();
        await expect(page).toHaveURL(/q=balaton/);
        await installProbe(page);
        await expect(card(page)).toContainText(FURED.name);
        await expect(results).toBeHidden();
        await settle(page);
        const after = await storedView(page);
        expect(after.popupId).toBe(before.popupId);
        expect(Math.abs(after.center[0] - before.center[0])).toBeLessThan(1e-4);
        expect((await mapState(page)).moves, await moveLog(page)).toBe(0);
    });

    test("hiding the results with a tap on the map keeps the card", async ({ page }) => {
        await openMap(page);
        await needsRoomForCard(page);
        const box = page.getByRole("combobox", { name: "Search" });
        const results = page.getByRole("listbox", { name: "Search results" });
        // A search, then a card: typing a new search would close the card, focusing the box only shows the hits.
        await box.fill("ruin");
        await expect(results).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(results).toBeHidden();
        await settle(page);
        const free = await band(page);
        await viewWithPinAt(page, RUIN_BAR.lat, RUIN_BAR.lng, 15, (free.top + free.bottom) / 2 + 100);
        // A real tap on the label (the pin's twin), which also takes the focus off the box.
        await label(page, RUIN_BAR.name).click();
        await expect(card(page)).toContainText(RUIN_BAR.name);
        await settle(page);
        await box.click();
        await expect(results).toBeVisible();
        const spot = await freeSpot(page);
        await page.mouse.click(spot.x, spot.y);
        await expect(results).toBeHidden();
        await expect(card(page)).toBeVisible();
        await expectStill(page, 600);
        await expect(card(page)).toBeVisible();
    });

    test("the first visit flies to the device, centred between the bars", async ({ page }) => {
        await page.goto("/");
        await expect(page.locator(".pm-you")).toBeVisible();
        await installProbe(page);
        await settle(page);
        const state = await mapState(page);
        expect(state.zoom).toBeGreaterThanOrEqual(14);
        const dot = (await page.locator(".pm-you").boundingBox())!;
        const free = await band(page);
        expect(dot.y).toBeGreaterThan(free.top);
        expect(dot.y + dot.height).toBeLessThan(free.bottom);
        await expectStill(page, 800);
    });
});

test.describe("first visit with the consent banner", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("keeps an opened card above the banner", async ({ page }) => {
        await openMap(page);
        const banner = page.getByRole("dialog", { name: /Privacy/ });
        await expect(banner).toBeVisible();
        const free = await band(page);
        const bannerTop = (await banner.boundingBox())!.y;
        test.skip(bannerTop - free.top < CARD_ROOM, "the banner leaves no room for a card");
        await viewWithPinAt(page, BEREMEND.lat, BEREMEND.lng, 14, free.bottom - 30);
        await openCard(page, BEREMEND);
        const bannerBox = (await banner.boundingBox())!;
        const pinBox = (await activePin(page).boundingBox())!;
        expect(pinBox.y + pinBox.height).toBeLessThanOrEqual(bannerBox.y + 2);
        await expectCardInBand(page);
        await expectStill(page, 800);
    });
});
