import { expect, test } from "@playwright/test";

// Dev seed place from party-map-backend/src/main/resources/data.sql (Danube Club).
const PLACE_ID = "6375cdd9-b837-5ac9-a4d6-ae200d4e6059";

test("signed-in user sees profile, likes and the admin area", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText("e2e@partymap.local")).toBeVisible();

    await page.getByRole("link", { name: "Admin page" }).click();
    await expect(page).toHaveURL(/\/admin\/places$/);
    await expect(page.getByRole("heading", { name: "Places admin" })).toBeVisible();

    await page.getByRole("link", { name: "Likes" }).first().click();
    await expect(page.getByRole("heading", { name: "Your likes" })).toBeVisible();
});

test("the backend accepts the Keycloak token: liking a place round-trips", async ({ page }) => {
    await page.goto(`/places/${PLACE_ID}`);
    const like = page.getByRole("button", { name: /favorites/ });
    await expect(like).toBeVisible();
    const wasLiked = (await like.getAttribute("aria-pressed")) === "true";

    await like.click();
    await expect(page.getByRole("status")).toContainText(wasLiked ? "You broke up with" : "You liked");
    await expect(like).toHaveAttribute("aria-pressed", String(!wasLiked));

    // Leave the seed data as we found it.
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", String(wasLiked));
});
