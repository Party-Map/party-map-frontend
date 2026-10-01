import { expect, test } from "@playwright/test";

// Admin pages whose content does not grow between runs (the flow spec adds places, plans and events).
const pages: [name: string, path: string][] = [
    ["admin-new-place", "/admin/places/new"],
    ["admin-new-plan", "/admin/events/plans/new"],
    ["admin-users-search", "/admin/platform/users?q=adrian"],
];
// Every page must also fit the screen, whatever it lists.
const fitOnly = ["/admin/places", "/admin/places/list", "/admin/events", "/admin/events/plans", "/admin/events/live"];

for (const scheme of ["light", "dark"] as const) {
    for (const [name, path] of pages) {
        test(`@visual ${name} ${scheme}`, async ({ page }) => {
            await page.emulateMedia({ colorScheme: scheme });
            await page.goto(path);
            await page.waitForLoadState("networkidle");
            await expect(page).toHaveScreenshot(`${name}-${scheme}.png`, {
                fullPage: true,
                mask: [page.locator(".leaflet-tile-pane"), page.getByRole("button", { name: /Account menu/ })],
            });
        });
    }
}

for (const path of [...pages.map(([, p]) => p), ...fitOnly]) {
    test(`@visual no horizontal overflow on ${path}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(0);
    });
}
