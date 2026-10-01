import { expect, test } from "@playwright/test";

// Dev seed ids from party-map-backend/src/main/resources/db/seed/afterMigrate.sql.
const routes: [name: string, path: string, fullPage: boolean][] = [
    ["home", "/", false],
    ["search", "/?q=balaton", false],
    ["place", "/places/43ce6e13-e30b-5b9f-8cc6-0aa52be7cf85", true],
    ["event", "/events/50bf3153-7d1c-51d2-9bb7-cc81432d7311", true],
    ["performer", "/performers/04238ef3-0e2b-528d-b141-ab202c578afc", true],
    ["browse-events", "/browse/events", true],
    ["browse-places", "/browse/places", true],
    ["browse-performers", "/browse/performers", true],
    ["not-found", "/this-does-not-exist", true],
];

const HIDE_BASEMAP = ".leaflet-tile-pane { visibility: hidden; }";

for (const [name, path, fullPage] of routes) {
    test(`@visual ${name}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        // The basemap is a WebGL canvas whose rasterisation differs between machines; hiding its pane leaves the
        // map's background with the pins and UI visible. The seed's event times are relative to now, so the weekday
        // labels in <time> elements drift from day to day.
        await page.addStyleTag({ content: HIDE_BASEMAP });
        await expect(page).toHaveScreenshot(`${name}.png`, { fullPage, mask: [page.locator("time")] });
    });

    test(`@visual no horizontal overflow on ${name}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(0);
    });
}
