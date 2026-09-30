import { expect, test } from "@playwright/test";

// Dev seed ids from party-map-backend/src/main/resources/data.sql.
const routes: Array<[name: string, path: string, fullPage: boolean]> = [
    ["home", "/", false],
    ["search", "/?q=balaton", false],
    ["place", "/places/43ce6e13-e30b-5b9f-8cc6-0aa52be7cf85", true],
    ["event", "/events/50bf3153-7d1c-51d2-9bb7-cc81432d7311", true],
    ["not-found", "/this-does-not-exist", true],
];

for (const [name, path, fullPage] of routes) {
    test(`@visual ${name}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot(`${name}.png`, {
            fullPage,
            // Map tiles come from the network and differ between runs; pins and UI stay visible.
            mask: [page.locator(".leaflet-tile-pane")],
        });
    });

    test(`@visual no horizontal overflow on ${name}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(0);
    });
}
