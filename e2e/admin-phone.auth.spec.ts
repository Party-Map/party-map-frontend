import { expect, test } from "@playwright/test";

test("on phones the sections open in a drawer that closes after navigating", async ({ page }) => {
    await page.goto("/admin/places");
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);

    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.getByRole("dialog", { name: "Navigation" });
    await drawer.getByRole("link", { name: "Requests" }).click();

    await expect(page).toHaveURL(/\/admin\/places\/requests$/);
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Requests" })).toBeVisible();
});
