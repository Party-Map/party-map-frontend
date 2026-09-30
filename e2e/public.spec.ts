import { expect, test } from "@playwright/test";

test("map home renders pins and the search finds places", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await expect(page.locator(".pm-pin").first()).toBeVisible();

    await page.getByRole("combobox", { name: "Search" }).fill("balaton");
    const results = page.getByRole("listbox", { name: "Search results" });
    await expect(results).toBeVisible();
    await expect(results.getByRole("option").first()).toBeVisible();
});

test("a place page shows its details and events", async ({ page }) => {
    await page.goto("/places/43ce6e13-e30b-5b9f-8cc6-0aa52be7cf85");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
});

test("unknown routes show the 404 page", async ({ page }) => {
    await page.goto("/nope");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await page.getByRole("link", { name: "Back to Map" }).click();
    await expect(page).toHaveURL("/");
});
