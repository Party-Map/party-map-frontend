import { expect, type Page, test } from "@playwright/test";

interface StoredView {
    center: [number, number];
    zoom: number;
    popupId: string | null;
}

/** The map memory the app keeps in sessionStorage. */
async function storedView(page: Page): Promise<StoredView> {
    const raw = await page.evaluate(() => sessionStorage.getItem("pm:map:v1"));
    if (!raw) throw new Error("no map memory stored");
    return JSON.parse(raw) as StoredView;
}

test("going back from a detail page returns to the same map view with the card still open", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".pm-pin").first()).toBeVisible();

    // Open a card the way a user would: pick a search hit, which flies to the place and opens its card.
    await page.getByRole("combobox", { name: "Search" }).fill("balaton");
    await page
        .getByRole("listbox", { name: "Search results" })
        .getByRole("option", { name: /Füred Pier Lounge/ })
        .first()
        .click();
    const card = page.locator(".leaflet-popup");
    await expect(card).toContainText("Füred Pier Lounge");
    // The pick flies to the place; the memory is final once the flight's zoom has landed.
    await expect.poll(async () => (await storedView(page)).zoom).toBe(15);
    const before = await storedView(page);
    expect(before.popupId).toBeTruthy();

    // Into the detail page from the card, then back.
    await card.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/(events|places)\//);
    await page.getByRole("link", { name: "Back" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.locator(".leaflet-popup")).toContainText("Füred Pier Lounge");
    // Leaflet snaps a restored centre to its pixel grid, hence the tolerance.
    const after = await storedView(page);
    expect(after.popupId).toBe(before.popupId);
    expect(after.zoom).toBe(before.zoom);
    expect(Math.abs(after.center[0] - before.center[0])).toBeLessThan(0.01);
    expect(Math.abs(after.center[1] - before.center[1])).toBeLessThan(0.01);
});
