import { expect, test } from "@playwright/test";

// The Playwright config grants geolocation at the Budapest centre; the seed's nearest venue is Danube Club.
test("the browse page lists the nearest upcoming events first", async ({ page }) => {
    await page.goto("/browse");
    await expect(page).toHaveURL("/browse/events");
    await expect(page.getByRole("button", { name: "Near you" })).toBeVisible();
    const list = page.getByRole("list", { name: "Events" });
    await expect(list.getByRole("link").first()).toContainText("Sunset Sessions");
    await expect(list.getByRole("link").first()).toContainText("Danube Club");
});

test("kind chips filter the events and are kept in the URL", async ({ page }) => {
    await page.goto("/browse/events");
    await page.getByRole("button", { name: "Jazz" }).click();
    await expect(page).toHaveURL(/kind=JAZZ/);
    const list = page.getByRole("list", { name: "Events" });
    await expect(list.getByRole("link")).toHaveCount(1);
    await expect(list.getByRole("link").first()).toContainText("Tisza Neon Ride");
});

test("the tabs switch to places and performers", async ({ page }) => {
    await page.goto("/browse/events");
    await page.getByRole("navigation", { name: "Browse sections" }).getByRole("link", { name: "Places" }).click();
    await expect(page).toHaveURL("/browse/places");
    await expect(page.getByRole("list", { name: "Places" }).getByRole("link").first()).toContainText("Danube Club");

    await page.getByRole("navigation", { name: "Browse sections" }).getByRole("link", { name: "Performers" }).click();
    await expect(page).toHaveURL("/browse/performers");
    await expect(page.getByRole("list", { name: "Performers" }).getByRole("link", { name: /DJ Aurora/ })).toBeVisible();
});
